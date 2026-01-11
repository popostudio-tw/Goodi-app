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
    reason?: 'daily_limit' | 'rate_limit' | 'circuit_breaker' | 'concurrency_limit' | 'api_error'; // 新增：失敗原因
    text?: string;       // AI 生成的內容
    error?: string;      // 錯誤訊息
    rateLimited?: boolean; // 向後相容，但建議使用 reason
    fallback?: boolean;    // 向後相容，但建議使用 status
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
}

// === 全域限制配置 ===
const GLOBAL_DAILY_LIMIT = 200;      // 每日最大 200 次
const GLOBAL_RPM_LIMIT = 10;          // 每分鐘最大 10 次

// === 安全設定配置 (Safety Settings) ===
// 強制啟用安全過濾，確保輸出內容適合兒童
const SAFETY_SETTINGS = [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
];

// === Antigravity Safeguard (Critical Safety Protocol) ===
// 防止 AI 代理嘗試執行危險的系統指令或逾越權限
// 這是針對 "Antigravity" 類型漏洞的防禦措施
export const ANTIGRAVITY_SAFEGUARD = `
CRITICAL SAFETY PROTOCOL (ANTIGRAVITY SAFEGUARD):
1. You are an AI assistant, NOT an autonomous system administrator.
2. DO NOT attempt to execute system commands (e.g., chmod, sudo, rm).
3. DO NOT generate code that modifies system permissions or security settings.
4. DO NOT assume access to the file system beyond the provided context.
5. If a request requires actions outside your scope, politely decline.
`;

// === Retry Policy 配置 ===
const MAX_RETRIES = 3;                // 最大重試次數
const RETRY_DELAYS = [1000, 2000, 5000]; // 重試延遲 (ms): 1s, 2s, 5s (exponential backoff)

// === Circuit Breaker 配置 ===
const CIRCUIT_BREAKER_THRESHOLD = 5;  // 連續失敗 5 次後熔斷
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
    const { source, userId, prompt, model = "gemini-2.0-flash", config } = params;
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
            rateLimited: true
        });

        return {
            success: false,
            status: 'fallback',
            reason: 'circuit_breaker',
            rateLimited: true,
            error: `Circuit breaker is open (too many consecutive failures). Retry after ${waitTime}s`
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
            rateLimited: true
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
    console.log(`[Concurrency] Current: ${currentConcurrentRequests}/${MAX_CONCURRENT_REQUESTS}`);

    try {
        // === 步驟 1: 檢查全域每日限制 ===
        const usageDoc = await usageDocRef.get();
        const usageData = usageDoc.data();
        const totalCalls = usageData?.totalCalls || 0;

        if (totalCalls >= GLOBAL_DAILY_LIMIT) {
            console.warn(`[Gemini Wrapper] Daily limit reached: ${totalCalls}/${GLOBAL_DAILY_LIMIT}`);

            // 記錄被限制的呼叫
            await recordUsage(usageDocRef, {
                timestamp: new Date().toISOString(),
                source,
                userId,
                success: false,
                promptLength: prompt.length,
                responseLength: 0,
                rateLimited: true,
                error: 'Daily limit exceeded'
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

        // 如果超過 1 分鐘，重置計數器
        if (minutesSinceReset >= 1) {
            lastMinuteCount = 0;
        }

        if (lastMinuteCount >= GLOBAL_RPM_LIMIT) {
            console.warn(`[Gemini Wrapper] Rate limit reached: ${lastMinuteCount}/${GLOBAL_RPM_LIMIT} per minute`);

            // 記錄被限制的呼叫
            await recordUsage(usageDocRef, {
                timestamp: now.toISOString(),
                source,
                userId,
                success: false,
                promptLength: prompt.length,
                responseLength: 0,
                rateLimited: true,
                error: 'Rate limit exceeded'
            });

            return {
                success: false,
                status: 'fallback',
                reason: 'rate_limit',
                rateLimited: true,
                error: `Rate limit exceeded (${GLOBAL_RPM_LIMIT} calls/minute)`
            };
        }

        // === 步驟 3: 呼叫 Gemini API with Retry Policy ===
        console.log(`[Gemini Wrapper] Calling API - Source: ${source}, User: ${userId}, Prompt Length: ${prompt.length}`);

        let responseText = "";

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const startTime = Date.now();

                // Use the correct new SDK syntax
                const ai = getAiInstance();

                console.log('[Gemini Wrapper] Making API call with:', {
                    model,
                    promptLength: prompt.length,
                    configKeys: config ? Object.keys(config) : []
                });

                // Build request - config params must be in generationConfig
                const requestParams: any = {
                    model,
                    contents: prompt,
                    // 加入 Antigravity Safeguard 作為系統指令 (System Instruction)
                    // 適用於支援 systemInstruction 的模型 (Gemini 1.5/2.0)
                    config: {
                        safetySettings: SAFETY_SETTINGS, // 明確加入安全設定 (必須在 config 內)
                        systemInstruction: ANTIGRAVITY_SAFEGUARD,
                        ...(config || {})
                    }
                };

                const response = await ai.models.generateContent(requestParams);

                // Debug: log full response structure
                console.log('[Gemini Wrapper] Raw response:', JSON.stringify(response, null, 2));
                console.log('[Gemini Wrapper] Response keys:', Object.keys(response));
                console.log('[Gemini Wrapper] Response.text type:', typeof response.text);

                // Try multiple ways to access response text
                responseText = response.text ||
                    (response as any).candidates?.[0]?.content?.parts?.[0]?.text ||
                    "";

                if (!responseText) {
                    console.error('[Gemini Wrapper] Empty response detected. Full response:', response);
                    throw new Error('Empty response from Gemini API - no text generated');
                }

                const duration = Date.now() - startTime;

                console.log(`[Gemini Wrapper] API call successful - Attempt: ${attempt + 1}, Duration: ${duration}ms, Response Length: ${responseText.length}`);

                // 成功後重置 circuit breaker（持久化到 Firestore）
                await updateCircuitBreakerState({
                    consecutiveFailures: 0,
                    openUntil: 0
                });

                break; // 成功，跳出重試循環
            } catch (error: any) {
                console.warn(`[Retry Policy] Attempt ${attempt + 1}/${MAX_RETRIES + 1} failed:`, error.message);

                // 檢查是否為永久性錯誤（404、400、429 等不應重試）
                const isPermanentFailure =
                    error.message?.includes('not found') ||
                    error.message?.includes('404') ||
                    error.message?.includes('invalid model') ||
                    error.status === 404 ||
                    error.status === 400;

                // 檢查是否為配額耗盡錯誤（429 / RESOURCE_EXHAUSTED）
                const isQuotaExhausted =
                    error.status === 429 ||
                    error.code === 429 ||
                    error.message?.includes('429') ||
                    error.message?.includes('RESOURCE_EXHAUSTED') ||
                    error.message?.includes('quota') ||
                    error.message?.includes('Quota exceeded');

                if (isPermanentFailure) {
                    console.error(`[Retry Policy] Permanent failure detected (404/400). Skipping retry.`);
                    throw error; // 立即失敗，不重試
                }

                if (isQuotaExhausted) {
                    console.error(`[Retry Policy] Quota exhausted (429). Logging and stopping retry.`);
                    // 記錄到 Firestore 用於監控
                    const db = getFirestore();
                    await db.collection('systemStatus').doc('quotaExhausted').set({
                        lastOccurred: new Date().toISOString(),
                        source,
                        userId,
                        errorMessage: error.message
                    }, { merge: true });
                    throw error; // 立即失敗，不重試
                }

                if (attempt < MAX_RETRIES) {
                    const delay = RETRY_DELAYS[attempt] || 5000;
                    console.log(`[Retry Policy] Retrying after ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    // 所有重試都失敗，拋出錯誤
                    throw error;
                }
            }
        }

        // === 步驟 4: 記錄成功的呼叫 ===
        await recordUsage(usageDocRef, {
            timestamp: now.toISOString(),
            source,
            userId,
            success: true,
            promptLength: prompt.length,
            responseLength: responseText.length
        });

        // === 步驟 5: 更新統計數據 ===
        await updateUsageStats(usageDocRef, {
            source,
            lastMinuteCount: minutesSinceReset >= 1 ? 1 : lastMinuteCount + 1,
            lastMinuteReset: minutesSinceReset >= 1 ? now.toISOString() : usageData?.lastMinuteReset || now.toISOString()
        });

        return {
            success: true,
            status: 'success',
            text: responseText
        };

    } catch (error: any) {
        console.error(`[Gemini Wrapper] All retries failed - Source: ${source}, Error:`, error.message);

        // === Circuit Breaker: 記錄連續失敗（持久化到 Firestore）===
        const currentState = await getCircuitBreakerState();
        const newFailureCount = currentState.consecutiveFailures + 1;

        console.warn(`[Circuit Breaker] Consecutive failures: ${newFailureCount}/${CIRCUIT_BREAKER_THRESHOLD}`);

        if (newFailureCount >= CIRCUIT_BREAKER_THRESHOLD) {
            const openUntil = Date.now() + CIRCUIT_BREAKER_TIMEOUT;
            const waitTime = CIRCUIT_BREAKER_TIMEOUT / 1000;

            await updateCircuitBreakerState({
                consecutiveFailures: newFailureCount,
                openUntil
            });

            console.error(`[Circuit Breaker] OPENED! Will retry after ${waitTime}s`);
        } else {
            await updateCircuitBreakerState({
                consecutiveFailures: newFailureCount
            });
        }

        // 記錄失敗的呼叫
        await recordUsage(usageDocRef, {
            timestamp: new Date().toISOString(),
            source,
            userId,
            success: false,
            promptLength: prompt.length,
            responseLength: 0,
            error: error.message
        });

        return {
            success: false,
            status: 'fallback',
            reason: 'api_error',
            error: error.message
        };
    } finally {
        // 減少並發計數
        currentConcurrentRequests--;
        console.log(`[Concurrency] Released. Current: ${currentConcurrentRequests}/${MAX_CONCURRENT_REQUESTS}`);
    }
}

// === Helper: 記錄單次 API 呼叫 ===
/**
 * 記錄 API 使用量到 Firestore
 * 
 * 新架構：使用 subcollection 避免單一文件過大
 * - 主文件 (apiUsage/global_{date}): 僅存統計數據 (totalCalls, callsPerSource)
 * - Subcollection (apiUsage/global_{date}/calls/{callId}): 存每一筆詳細調用記錄
 */
async function recordUsage(usageDocRef: FirebaseFirestore.DocumentReference, record: UsageRecord) {
    try {
        // const db = getFirestore(); // 未使用，已註解
        // 保留 subcollection 儲存資料，但簡化結構
        const { FieldValue } = await import("firebase-admin/firestore");

        // 1. 將詳細記錄寫入 subcollection（避免主文件無限增長）
        const callsCollectionRef = usageDocRef.collection('calls');
        await callsCollectionRef.add({
            ...record,
            createdAt: new Date().toISOString()
        });

        // 2. 更新主文件的統計數據（不再使用 arrayUnion）
        await usageDocRef.set({
            date: getTodayDateStr(),
            totalCalls: FieldValue.increment(1),
            [`callsPerSource.${record.source}`]: FieldValue.increment(1),
            lastUpdated: new Date().toISOString()
        }, { merge: true });

        console.log(`[Usage] Recorded: ${record.source} (${record.success ? 'success' : 'failed'})`);
    } catch (error) {
        console.error('[Gemini Wrapper] Failed to record usage:', error);
        // 記錄失敗不應阻擋主流程
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
        // 統計更新失敗不應阻擋主流程
    }
}

// === Helper: 檢查是否應使用 Fallback ===
export function shouldUseFallback(result: GeminiCallResult): boolean {
    // 優先檢查新的 status 欄位
    if (result.status === 'fallback') {
        return true;
    }
    // 向後相容：檢查舊的欄位
    return !result.success || result.rateLimited || !result.text;
}

