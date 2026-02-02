import { GoogleGenAI } from "@google/genai";
import { HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

// ==========================================
// Gemini Wrapper - 集中式 AI 呼叫管理
// ==========================================

// === 類型定義 ===
export interface GeminiCallParams {
    source: 'daily' | 'weekly' | 'summary' | 'manual' | 'treehouse' | 'growth' | 'task';
    userId: string;      // 排程任務用 'system'
    prompt: string;
    model?: string;
    config?: any;
}

export interface GeminiCallResult {
    success: boolean;
    status: 'success' | 'fallback';  // 新增：明確狀態
    reason?: 'daily_limit' | 'rate_limit' | 'circuit_breaker' | 'concurrency_limit' | 'api_error' | 'quota_exhausted'; // 新增：失敗原因
    text?: string;       // AI 生成的內容
    error?: string;      // 錯誤訊息
    rateLimited?: boolean; // 向後相容，但建議使用 reason
    fallback?: boolean;    // 向後相容，但建議使用 status
    usedModel?: string;    // 實際使用的模型
}

interface UsageRecord {
    timestamp: string;
    source: string;
    userId: string;
    success: boolean;
    promptLength: number;
    responseLength: number;
    error?: string;
    rateLimited?: boolean;
    model?: string;
}

// === 全域限制配置 ===
const GLOBAL_DAILY_LIMIT = 500;      // 每日最大 500 次 (提升以適應 1.5 Flash 較高的額度)
const GLOBAL_RPM_LIMIT = 15;          // 每分鐘最大 15 次 (1.5 Flash Free Tier 限制)

// === Retry Policy 配置 ===
const MAX_RETRIES = 2;                // 單一模型最大重試次數
const RETRY_DELAYS = [1000, 2000];    // 重試延遲 (ms)

// === Fallback 模型配置 ===
// 當首選模型失敗時，依序嘗試這些模型
const DEFAULT_MODEL = "gemini-1.5-flash";
const FALLBACK_CHAIN = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"];

// === Circuit Breaker 配置 ===
const CIRCUIT_BREAKER_THRESHOLD = 10;  // 連續失敗 10 次後熔斷 (放寬因為有 fallback)
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 熔斷後 60 秒才重試

// === Circuit Breaker 快取（避免每次都讀 Firestore）===
interface CircuitBreakerCache {
    consecutiveFailures: number;
    openUntil: number;
    lastFetched: number;
}
let circuitBreakerCache: CircuitBreakerCache | null = null;
const CACHE_TTL = 10000; // 快取 10 秒

// === Circuit Breaker Firestore Schema ===
interface CircuitBreakerState {
    consecutiveFailures: number;
    openUntil: number; // timestamp (ms)
    lastUpdated: string; // ISO string
}

// Helper: 從 Firestore 讀取 Circuit Breaker 狀態（含快取）
async function getCircuitBreakerState(): Promise<CircuitBreakerState> {
    const now = Date.now();

    // 如果快取有效，直接返回
    if (circuitBreakerCache && (now - circuitBreakerCache.lastFetched) < CACHE_TTL) {
        return {
            consecutiveFailures: circuitBreakerCache.consecutiveFailures,
            openUntil: circuitBreakerCache.openUntil,
            lastUpdated: new Date(circuitBreakerCache.lastFetched).toISOString()
        };
    }

    // 從 Firestore 讀取
    try {
        const db = getFirestore();
        const doc = await db.collection('systemStatus').doc('circuitBreaker').get();

        if (doc.exists) {
            const data = doc.data() as CircuitBreakerState;
            // 更新快取
            circuitBreakerCache = {
                consecutiveFailures: data.consecutiveFailures || 0,
                openUntil: data.openUntil || 0,
                lastFetched: now
            };
            return data;
        }
    } catch (error) {
        console.error('[Circuit Breaker] Failed to read state from Firestore:', error);
    }

    // 預設值
    return {
        consecutiveFailures: 0,
        openUntil: 0,
        lastUpdated: new Date().toISOString()
    };
}

// Helper: 更新 Circuit Breaker 狀態到 Firestore
async function updateCircuitBreakerState(state: Partial<CircuitBreakerState>): Promise<void> {
    try {
        const db = getFirestore();
        await db.collection('systemStatus').doc('circuitBreaker').set({
            ...state,
            lastUpdated: new Date().toISOString()
        }, { merge: true });

        // 更新快取
        const now = Date.now();
        if (!circuitBreakerCache) {
            circuitBreakerCache = {
                consecutiveFailures: 0,
                openUntil: 0,
                lastFetched: now
            };
        }
        if (state.consecutiveFailures !== undefined) {
            circuitBreakerCache.consecutiveFailures = state.consecutiveFailures;
        }
        if (state.openUntil !== undefined) {
            circuitBreakerCache.openUntil = state.openUntil;
        }
        circuitBreakerCache.lastFetched = now;

        console.log('[Circuit Breaker] State updated:', state);
    } catch (error) {
        console.error('[Circuit Breaker] Failed to update state to Firestore:', error);
    }
}

// === Concurrency Control 配置 ===
const MAX_CONCURRENT_REQUESTS = 5;    // 同時最多 5 個請求
let currentConcurrentRequests = 0;

// === Helper: 取得 AI Instance ===
function getAiInstance(): GoogleGenAI {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        throw new HttpsError("failed-precondition", "AI API Key is missing");
    }
    return new GoogleGenAI({ apiKey: key });
}

// === Helper: 取得今日日期字串 (YYYY-MM-DD) ===
function getTodayDateStr(): string {
    return new Date().toISOString().split('T')[0];
}

// === 核心函數：集中式 Gemini API 呼叫（含 Retry、Circuit Breaker、Concurrency Control）===
export async function callGemini(params: GeminiCallParams): Promise<GeminiCallResult> {
    const { source, userId, prompt, model: requestedModel, config } = params;

    // 建立模型嘗試鏈
    const initialModel = requestedModel || DEFAULT_MODEL;
    const modelChain = [initialModel];

    // 將 Fallback Chain 中的模型加入（排除已在鏈中的）
    for (const m of FALLBACK_CHAIN) {
        if (!modelChain.includes(m)) {
            modelChain.push(m);
        }
    }

    const db = getFirestore();
    const today = getTodayDateStr();
    const usageDocRef = db.collection('apiUsage').doc(`global_${today}`);

    // === 步驟 0a: 檢查 Circuit Breaker 狀態（Firestore 持久化）===
    const circuitState = await getCircuitBreakerState();
    const now = Date.now();

    if (circuitState.openUntil > now) {
        const waitTime = Math.ceil((circuitState.openUntil - now) / 1000);
        console.warn(`[Circuit Breaker] Circuit is OPEN. Wait ${waitTime}s before retry.`);

        await recordUsage(usageDocRef, {
            timestamp: new Date().toISOString(),
            source,
            userId,
            success: false,
            promptLength: prompt.length,
            responseLength: 0,
            error: 'Circuit breaker open',
            rateLimited: true,
            model: initialModel
        });

        return {
            success: false,
            status: 'fallback',
            reason: 'circuit_breaker',
            rateLimited: true,
            error: `Circuit breaker is open. Retry after ${waitTime}s`
        };
    }

    // === 步驟 0b: Concurrency Control ===
    if (currentConcurrentRequests >= MAX_CONCURRENT_REQUESTS) {
        console.warn(`[Concurrency Control] Max concurrent requests reached: ${currentConcurrentRequests}/${MAX_CONCURRENT_REQUESTS}`);

        await recordUsage(usageDocRef, {
            timestamp: new Date().toISOString(),
            source,
            userId,
            success: false,
            promptLength: prompt.length,
            responseLength: 0,
            error: 'Concurrency limit exceeded',
            rateLimited: true,
            model: initialModel
        });

        return {
            success: false,
            status: 'fallback',
            reason: 'concurrency_limit',
            rateLimited: true,
            error: `Too many concurrent requests (${MAX_CONCURRENT_REQUESTS} max)`
        };
    }

    // 增加並發計數
    currentConcurrentRequests++;

    try {
        // === 步驟 1: 檢查全域每日限制 ===
        const usageDoc = await usageDocRef.get();
        const usageData = usageDoc.data();
        const totalCalls = usageData?.totalCalls || 0;

        if (totalCalls >= GLOBAL_DAILY_LIMIT) {
            console.warn(`[Gemini Wrapper] Daily limit reached: ${totalCalls}/${GLOBAL_DAILY_LIMIT}`);

            await recordUsage(usageDocRef, {
                timestamp: new Date().toISOString(),
                source,
                userId,
                success: false,
                promptLength: prompt.length,
                responseLength: 0,
                rateLimited: true,
                error: 'Daily limit exceeded',
                model: initialModel
            });

            return {
                success: false,
                status: 'fallback',
                reason: 'daily_limit',
                rateLimited: true,
                error: `Daily API limit exceeded (${GLOBAL_DAILY_LIMIT} calls/day)`
            };
        }

        // === 步驟 2: 檢查每分鐘速率限制 ===
        const lastMinuteReset = usageData?.lastMinuteReset ? new Date(usageData.lastMinuteReset) : new Date(0);
        const now = new Date();
        const minutesSinceReset = (now.getTime() - lastMinuteReset.getTime()) / 1000 / 60;
        let lastMinuteCount = usageData?.lastMinuteCount || 0;
        if (minutesSinceReset >= 1) lastMinuteCount = 0;

        if (lastMinuteCount >= GLOBAL_RPM_LIMIT) {
            console.warn(`[Gemini Wrapper] Rate limit reached: ${lastMinuteCount}/${GLOBAL_RPM_LIMIT} per minute`);

            await recordUsage(usageDocRef, {
                timestamp: now.toISOString(),
                source,
                userId,
                success: false,
                promptLength: prompt.length,
                responseLength: 0,
                rateLimited: true,
                error: 'Rate limit exceeded',
                model: initialModel
            });

            return {
                success: false,
                status: 'fallback',
                reason: 'rate_limit',
                rateLimited: true,
                error: `Rate limit exceeded (${GLOBAL_RPM_LIMIT} calls/minute)`
            };
        }

        // === 步驟 3: 執行模型鏈 Fallback 機制 ===
        let lastError: Error | null = null;
        let successModel: string | null = null;
        let responseText = "";

        // 遍歷模型鏈
        for (const modelToTry of modelChain) {
            console.log(`[Gemini Wrapper] Trying model: ${modelToTry}`);

            try {
                // 對單一模型進行重試 (針對網絡錯誤)
                for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
                    try {
                        const ai = getAiInstance();
                        const requestParams: any = {
                            model: modelToTry,
                            contents: prompt
                        };
                        if (config) requestParams.generationConfig = config;

                        console.log(`[Gemini Wrapper] Call attempt ${attempt + 1}/${MAX_RETRIES + 1} for ${modelToTry}`);
                        const response = await ai.models.generateContent(requestParams);

                        responseText = response.text ||
                            (response as any).candidates?.[0]?.content?.parts?.[0]?.text ||
                            "";

                        if (!responseText) {
                            throw new Error('Empty response from Gemini API');
                        }

                        // 成功！
                        successModel = modelToTry;
                        break;

                    } catch (error: any) {
                        // 判斷錯誤類型
                        const isQuotaExhausted = error.status === 429 || error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED');
                        const isNotFound = error.status === 404 || error.message?.includes('not found') || error.message?.includes('404');
                        // const isServiceUnavailable = error.status === 503; // Unused

                        // 如果是配額耗盡或模型不存在，不要重試當前模型，直接拋出讓外層迴圈捕捉並切換模型
                        if (isQuotaExhausted || isNotFound) {
                            console.warn(`[Gemini Wrapper] ${modelToTry} failed with permanent/quota error: ${error.message}`);
                            throw error;
                        }

                        // 如果是網絡波動或服務暫時不可用，則進行 Retry
                        if (attempt < MAX_RETRIES) {
                            const delay = RETRY_DELAYS[attempt] || 1000;
                            await new Promise(r => setTimeout(r, delay));
                        } else {
                            throw error;
                        }
                    }
                }

                if (successModel) break; // 成功則跳出模型鏈迴圈

            } catch (error: any) {
                console.warn(`[Gemini Wrapper] Model ${modelToTry} failed completely.`, error.message);
                lastError = error;
                // 繼續嘗試下一個模型
            }
        }

        // === 檢查結果 ===
        if (successModel && responseText) {
            // 成功
            await updateCircuitBreakerState({ consecutiveFailures: 0, openUntil: 0 });

            await recordUsage(usageDocRef, {
                timestamp: new Date().toISOString(),
                source,
                userId,
                success: true,
                promptLength: prompt.length,
                responseLength: responseText.length,
                model: successModel
            });

            await updateUsageStats(usageDocRef, {
                source,
                lastMinuteCount: minutesSinceReset >= 1 ? 1 : lastMinuteCount + 1,
                lastMinuteReset: minutesSinceReset >= 1 ? new Date().toISOString() : usageData?.lastMinuteReset || new Date().toISOString()
            });

            return {
                success: true,
                status: 'success',
                text: responseText,
                usedModel: successModel
            };

        } else {
            // 所有模型都失敗
            throw lastError || new Error("All models failed");
        }

    } catch (error: any) {
        console.error(`[Gemini Wrapper] All models failed - Source: ${source}, Error:`, error.message);

        // Circuit Breaker 更新
        const currentState = await getCircuitBreakerState();
        const newFailureCount = currentState.consecutiveFailures + 1;

        if (newFailureCount >= CIRCUIT_BREAKER_THRESHOLD) {
            const openUntil = Date.now() + CIRCUIT_BREAKER_TIMEOUT;
            await updateCircuitBreakerState({
                consecutiveFailures: newFailureCount,
                openUntil
            });
            console.error(`[Circuit Breaker] OPENED!`);
        } else {
            await updateCircuitBreakerState({ consecutiveFailures: newFailureCount });
        }

        await recordUsage(usageDocRef, {
            timestamp: new Date().toISOString(),
            source,
            userId,
            success: false,
            promptLength: prompt.length,
            responseLength: 0,
            error: error.message,
            model: 'all_failed'
        });

        const isQuota = error.message?.includes('429') || error.message?.includes('quota');

        return {
            success: false,
            status: 'fallback',
            reason: isQuota ? 'quota_exhausted' : 'api_error',
            error: error.message
        };

    } finally {
        currentConcurrentRequests--;
    }
}

// === Helper: 記錄單次 API 呼叫 ===
async function recordUsage(usageDocRef: FirebaseFirestore.DocumentReference, record: UsageRecord) {
    try {
        const { FieldValue } = await import("firebase-admin/firestore");
        const callsCollectionRef = usageDocRef.collection('calls');
        await callsCollectionRef.add({
            ...record,
            createdAt: new Date().toISOString()
        });

        // 僅更新統計，不寫入大量日誌到主文件
        await usageDocRef.set({
            date: getTodayDateStr(),
            totalCalls: FieldValue.increment(1),
            [`callsPerSource.${record.source}`]: FieldValue.increment(1),
            lastUpdated: new Date().toISOString()
        }, { merge: true });

    } catch (error) {
        console.error('[Gemini Wrapper] Failed to record usage:', error);
    }
}

// === Helper: 更新統計數據 ===
async function updateUsageStats(
    usageDocRef: FirebaseFirestore.DocumentReference,
    stats: {
        source: string;
        lastMinuteCount: number;
        lastMinuteReset: string;
    }
) {
    try {
        const { FieldValue } = await import("firebase-admin/firestore");
        const { source, lastMinuteCount, lastMinuteReset } = stats;

        await usageDocRef.set({
            date: getTodayDateStr(),
            totalCalls: FieldValue.increment(1),
            [`callsPerSource.${source}`]: FieldValue.increment(1),
            lastMinuteCount,
            lastMinuteReset,
            lastUpdated: new Date().toISOString()
        }, { merge: true });
    } catch (error) {
        console.error('[Gemini Wrapper] Failed to update usage stats:', error);
    }
}

// === Helper: 檢查是否應使用 Fallback ===
export function shouldUseFallback(result: GeminiCallResult): boolean {
    if (result.status === 'fallback') {
        return true;
    }
    return !result.success || result.rateLimited || !result.text;
}
