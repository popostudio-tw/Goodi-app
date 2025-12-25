/**
 * AI 錯誤處理服務
 * 將技術性錯誤轉換為用戶友善的訊息，並提供統一的錯誤處理邏輯
 */

// 錯誤類型定義
export type AiErrorType =
    | 'daily_limit'
    | 'rate_limit'
    | 'circuit_breaker'
    | 'concurrency_limit'
    | 'api_error'
    | 'network_error'
    | 'not_found'
    | 'unknown';

export interface AiErrorInfo {
    type: AiErrorType;
    userMessage: string;
    technicalMessage: string;
    action: string;
    canRetry: boolean;
    retryAfterSeconds?: number;
}

/**
 * 從錯誤對象中提取錯誤類型
 */
function extractErrorType(error: any): AiErrorType {
    const message = error?.message || '';
    const errorText = typeof error === 'string' ? error : message;

    if (errorText.includes('Daily limit') || errorText.includes('daily_limit')) {
        return 'daily_limit';
    }
    if (errorText.includes('Rate limit') || errorText.includes('rate_limit')) {
        return 'rate_limit';
    }
    if (errorText.includes('Circuit breaker') || errorText.includes('circuit_breaker')) {
        return 'circuit_breaker';
    }
    if (errorText.includes('concurrent') || errorText.includes('concurrency_limit')) {
        return 'concurrency_limit';
    }
    if (errorText.includes('網路') || errorText.includes('network') || errorText.includes('連線')) {
        return 'network_error';
    }
    if (errorText.includes('not-found') || errorText.includes('資料連線異常')) {
        return 'not_found';
    }
    if (errorText.includes('api_error') || errorText.includes('API')) {
        return 'api_error';
    }

    return 'unknown';
}

/**
 * 獲取用戶友善的錯誤訊息
 */
export function getAiErrorInfo(error: any): AiErrorInfo {
    const type = extractErrorType(error);
    const technicalMessage = error?.message || String(error);

    const errorMap: Record<AiErrorType, Omit<AiErrorInfo, 'type' | 'technicalMessage'>> = {
        daily_limit: {
            userMessage: '🦖 Goodi 今天有點累了...',
            action: 'Goodi 每天的工作量有限，明天再來找我玩吧！',
            canRetry: false,
            retryAfterSeconds: undefined
        },
        rate_limit: {
            userMessage: '🦖 Goodi 需要休息一下',
            action: '請稍等1分鐘後再試，Goodi 馬上回來！',
            canRetry: true,
            retryAfterSeconds: 60
        },
        circuit_breaker: {
            userMessage: '🦖 Goodi 正在恢復體力中',
            action: '請稍等1分鐘，Goodi 很快就會好起來！',
            canRetry: true,
            retryAfterSeconds: 60
        },
        concurrency_limit: {
            userMessage: '🦖 太多人找 Goodi 了',
            action: '請稍後再試，Goodi 會盡快幫助你！',
            canRetry: true,
            retryAfterSeconds: 10
        },
        api_error: {
            userMessage: '🦖 Goodi 遇到了一些困難',
            action: '請稍後重試，或聯繫客服協助',
            canRetry: true,
            retryAfterSeconds: 30
        },
        network_error: {
            userMessage: '📡 網路連線異常',
            action: '請檢查網路連線後重試',
            canRetry: true,
            retryAfterSeconds: 5
        },
        not_found: {
            userMessage: '🔍 找不到相關資料',
            action: '資料可能還在生成中，請稍後重新整理',
            canRetry: true,
            retryAfterSeconds: 10
        },
        unknown: {
            userMessage: '⚠️ 發生了未知的錯誤',
            action: '請稍後重試，如果問題持續請聯繫客服',
            canRetry: true,
            retryAfterSeconds: 30
        }
    };

    const errorInfo = errorMap[type];

    return {
        type,
        technicalMessage,
        ...errorInfo
    };
}

/**
 * 統一的 AI 錯誤處理函數
 * @param error 錯誤對象
 * @param onRetry 重試回調函數（可選）
 * @returns 錯誤信息
 */
export function handleAiError(
    error: any,
    context?: string
): AiErrorInfo {
    const errorInfo = getAiErrorInfo(error);

    // 記錄錯誤日誌
    console.error(`[AI Error] ${context || 'Unknown context'}:`, {
        type: errorInfo.type,
        message: errorInfo.technicalMessage,
        userMessage: errorInfo.userMessage
    });

    return errorInfo;
}

/**
 * 檢查錯誤是否為臨時性錯誤（可重試）
 */
export function isTemporaryError(error: any): boolean {
    const errorInfo = getAiErrorInfo(error);
    return errorInfo.canRetry;
}

/**
 * 獲取建議的重試延遲時間（秒）
 */
export function getRetryDelay(error: any): number {
    const errorInfo = getAiErrorInfo(error);
    return errorInfo.retryAfterSeconds || 30;
}

/**
 * 格式化錯誤訊息供 UI 顯示
 */
export function formatErrorForDisplay(error: any): string {
    const errorInfo = getAiErrorInfo(error);
    return `${errorInfo.userMessage}\n${errorInfo.action}`;
}
