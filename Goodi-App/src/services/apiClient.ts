import { httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { functions } from '../../firebase';

// ==========================================
// 統一型別定義
// ==========================================

/**
 * API 錯誤類型
 */
export type ApiErrorType =
    | 'network'           // 網路連線問題
    | 'auth'              // 認證失敗
    | 'rate_limit'        // 速率限制
    | 'daily_limit'       // 每日配額用盡
    | 'circuit_breaker'   // 熔斷器啟動
    | 'server'            // 伺服器錯誤
    | 'timeout'           // 請求超時
    | 'unknown';          // 未知錯誤

/**
 * 統一錯誤格式
 */
export interface ApiError {
    type: ApiErrorType;
    message: string;        // 用戶友善訊息
    originalError?: any;    // 原始錯誤物件（供 debug）
    canRetry: boolean;      // 是否可重試
    retryAfter?: number;    // 建議重試延遲（秒）
    technicalDetails?: string; // 技術細節（供開發者查看）
}

/**
 * 統一回應格式
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiError;
}

/**
 * 調用選項
 */
export interface CallOptions {
    retry?: boolean;        // 是否啟用重試（預設 false，因後端已有 retry）
    maxRetries?: number;    // 最大重試次數
    timeout?: number;       // 超時時間（毫秒）
    showLoading?: boolean;  // 是否顯示 loading（供 UI 層使用）
}

// ==========================================
// 錯誤映射與訊息生成
// ==========================================

/**
 * 將後端 reason 映射到前端 error type
 */
function mapReasonToType(reason?: string): ApiErrorType {
    switch (reason) {
        case 'daily_limit':
            return 'daily_limit';
        case 'rate_limit':
            return 'rate_limit';
        case 'circuit_breaker':
            return 'circuit_breaker';
        case 'api_error':
            return 'server';
        case 'concurrency_limit':
            return 'rate_limit'; // 併發限制視為速率限制
        default:
            return 'unknown';
    }
}

/**
 * 生成用戶友善的錯誤訊息
 */
function getFriendlyMessage(type: ApiErrorType, reason?: string): string {
    switch (type) {
        case 'network':
            return '網路連線不穩定，請檢查網路後重試';

        case 'auth':
            return '登入狀態已過期，請重新登入';

        case 'rate_limit':
            return '系統使用量較高，請稍後再試';

        case 'daily_limit':
            return '今日 AI 配額已用完，明天會自動恢復';

        case 'circuit_breaker':
            return 'Goodi 正在維護中，請稍後再試';

        case 'server':
            return 'AI 服務暫時無法使用，請稍後重試';

        case 'timeout':
            return '請求超時，請重試';

        default:
            return '發生錯誤，請稍後再試';
    }
}

/**
 * 計算建議重試延遲（秒）
 */
function calculateRetryDelay(type: ApiErrorType, reason?: string): number | undefined {
    switch (type) {
        case 'rate_limit':
            return 30; // 速率限制建議 30 秒後重試

        case 'circuit_breaker':
            return 60; // 熔斷器建議 60 秒後重試

        case 'daily_limit':
            return undefined; // 每日配額用盡無法重試

        case 'server':
        case 'timeout':
            return 10; // 伺服器錯誤/超時建議 10 秒後重試

        default:
            return 5; // 其他錯誤建議 5 秒後重試
    }
}

/**
 * 判斷錯誤是否可重試
 */
function canRetryError(type: ApiErrorType): boolean {
    // 每日配額用盡和認證錯誤不可重試
    return type !== 'daily_limit' && type !== 'auth';
}

/**
 * 解析 Firebase Functions 錯誤
 */
function parseFirebaseError(error: any): ApiError {
    // 網路錯誤
    if (error.code === 'unavailable' || error.message?.includes('Failed to fetch')) {
        return {
            type: 'network',
            message: getFriendlyMessage('network'),
            originalError: error,
            canRetry: true,
            retryAfter: 5,
            technicalDetails: error.message
        };
    }

    // 認證錯誤
    if (error.code === 'unauthenticated') {
        return {
            type: 'auth',
            message: getFriendlyMessage('auth'),
            originalError: error,
            canRetry: false,
            technicalDetails: error.message
        };
    }

    // 超時錯誤
    if (error.code === 'deadline-exceeded') {
        return {
            type: 'timeout',
            message: getFriendlyMessage('timeout'),
            originalError: error,
            canRetry: true,
            retryAfter: 10,
            technicalDetails: error.message
        };
    }

    // 其他錯誤
    return {
        type: 'unknown',
        message: getFriendlyMessage('unknown'),
        originalError: error,
        canRetry: true,
        retryAfter: 5,
        technicalDetails: error.message || JSON.stringify(error)
    };
}

// ==========================================
// 核心調用函數
// ==========================================

/**
 * 統一的 Cloud Function 呼叫函數
 * 
 * @param functionName - Cloud Function 名稱
 * @param params - 傳遞給 Function 的參數
 * @param options - 調用選項
 * @returns 統一格式的 API 回應
 * 
 * @example
 * ```typescript
 * const result = await callFunction<{ report: string }>('triggerWeeklyReport', {});
 * if (result.success) {
 *   console.log(result.data.report);
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */
export async function callFunction<T = any>(
    functionName: string,
    params: any = {},
    options: CallOptions = {}
): Promise<ApiResponse<T>> {
    const {
        retry = false,
        maxRetries = 2,
        timeout = 30000,
    } = options;

    let attempt = 0;
    let lastError: ApiError | null = null;

    while (attempt <= (retry ? maxRetries : 0)) {
        try {
            console.log(`[apiClient] Calling ${functionName}, attempt ${attempt + 1}`);

            // 創建 callable function
            const fn = httpsCallable(functions, functionName);

            // 設置 timeout（Firebase SDK 支援）
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            try {
                // 呼叫 Cloud Function
                const result: HttpsCallableResult<any> = await fn(params);
                clearTimeout(timeoutId);

                // 檢查後端是否返回 fallback 狀態
                const responseData = result.data;

                // 情況 1: 後端明確返回 status === 'fallback'
                if (responseData?.status === 'fallback') {
                    const errorType = mapReasonToType(responseData.reason);
                    lastError = {
                        type: errorType,
                        message: getFriendlyMessage(errorType, responseData.reason),
                        canRetry: canRetryError(errorType),
                        retryAfter: calculateRetryDelay(errorType, responseData.reason),
                        technicalDetails: responseData.error || responseData.reason,
                        originalError: responseData
                    };

                    // 如果不可重試或已達最大重試次數，直接返回
                    if (!lastError.canRetry || attempt >= maxRetries) {
                        return {
                            success: false,
                            error: lastError
                        };
                    }

                    // 可重試，等待後繼續
                    const delay = (lastError.retryAfter || 5) * 1000;
                    console.warn(`[apiClient] ${functionName} returned fallback (${responseData.reason}), retrying after ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    attempt++;
                    continue;
                }

                // 情況 2: 後端返回 success: false（舊格式向後相容）
                if (responseData?.success === false) {
                    const errorType = responseData.rateLimited ? 'rate_limit' : 'server';
                    lastError = {
                        type: errorType,
                        message: responseData.error || getFriendlyMessage(errorType),
                        canRetry: canRetryError(errorType),
                        retryAfter: calculateRetryDelay(errorType),
                        technicalDetails: responseData.error,
                        originalError: responseData
                    };

                    if (!lastError.canRetry || attempt >= maxRetries) {
                        return {
                            success: false,
                            error: lastError
                        };
                    }

                    const delay = (lastError.retryAfter || 5) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    attempt++;
                    continue;
                }

                // 情況 3: 成功
                console.log(`[apiClient] ${functionName} succeeded`);
                return {
                    success: true,
                    data: responseData as T
                };

            } catch (callError: any) {
                clearTimeout(timeoutId);

                // 處理 timeout
                if (callError.name === 'AbortError') {
                    lastError = {
                        type: 'timeout',
                        message: getFriendlyMessage('timeout'),
                        canRetry: true,
                        retryAfter: 10,
                        technicalDetails: `Request timeout after ${timeout}ms`,
                        originalError: callError
                    };
                } else {
                    // 其他 Firebase 錯誤
                    lastError = parseFirebaseError(callError);
                }

                // 判斷是否重試
                if (!retry || !lastError.canRetry || attempt >= maxRetries) {
                    console.error(`[apiClient] ${functionName} failed:`, lastError);
                    return {
                        success: false,
                        error: lastError
                    };
                }

                // 重試
                const delay = (lastError.retryAfter || 5) * 1000;
                console.warn(`[apiClient] ${functionName} failed, retrying after ${delay}ms... (${lastError.type})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                attempt++;
            }

        } catch (unexpectedError: any) {
            // 捕捉任何意外錯誤
            console.error(`[apiClient] Unexpected error in ${functionName}:`, unexpectedError);
            return {
                success: false,
                error: {
                    type: 'unknown',
                    message: getFriendlyMessage('unknown'),
                    canRetry: false,
                    originalError: unexpectedError,
                    technicalDetails: unexpectedError?.message || String(unexpectedError)
                }
            };
        }
    }

    // 所有重試都失敗
    return {
        success: false,
        error: lastError || {
            type: 'unknown',
            message: '所有重試都失敗了',
            canRetry: false
        }
    };
}

// ==========================================
// 便利函數（可選）
// ==========================================

/**
 * 週報生成
 */
export async function triggerWeeklyReport(): Promise<ApiResponse<{ success: boolean; weekKey: string; message: string }>> {
    return callFunction('triggerWeeklyReport', {});
}

/**
 * 昨日總結獲取
 */
export async function getYesterdaySummary(): Promise<ApiResponse<{ summary: string }>> {
    return callFunction('generateYesterdaySummary', {});
}

/**
 * 昨日總結生成
 */
export async function triggerYesterdaySummary(): Promise<ApiResponse<{ success: boolean; summary: string }>> {
    return callFunction('triggerYesterdaySummary', {});
}

/**
 * 每日內容獲取
 */
export async function getDailyContent(date: string): Promise<ApiResponse<{ todayInHistory: string; animalTrivia: string }>> {
    return callFunction('generateDailyContent', { date });
}

/**
 * 悄悄話樹洞回應
 */
export async function getSafeResponse(userMessage: string, userNickname?: string): Promise<ApiResponse<{ needsAttention: boolean; response: string }>> {
    return callFunction('generateSafeResponse', { userMessage, userNickname });
}

/**
 * 通用 Gemini 內容生成（支援自定義 schema）
 */
export async function generateGeminiContent(params: {
    model: string;
    prompt: string;
    responseMimeType?: string;
    schema?: any;
}): Promise<ApiResponse<{ text?: string } | any>> {
    return callFunction('generateGeminiContent', params);
}

/**
 * 取得系統狀態（熔斷器、API 使用量）
 */
export async function getSystemStatus(): Promise<ApiResponse<{
    timestamp: string;
    circuitBreaker: {
        isOpen: boolean;
        opensAt: number | null;
        consecutiveFailures: number;
    };
    dailyUsage: {
        date: string;
        totalCalls: number;
        limit: number;
        callsPerSource: Record<string, number>;
    };
    rateLimit: {
        current: number;
        limit: number;
    };
}>> {
    return callFunction('getSystemStatus', {});
}

/**
 * ����C�餺�e (���v�W������ + �ʪ��N����)
 */
export async function getDailyFacts(date?: string): Promise<ApiResponse<{ history: string; animalFact: string; date: string }>> {
  return callFunction('getDailyFacts', { date });
}
