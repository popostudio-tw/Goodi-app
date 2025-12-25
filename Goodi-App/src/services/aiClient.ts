import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase";
import { handleAiError, AiErrorInfo } from "../../services/aiErrorHandler";

/**
 * AI 調用結果類型
 */
export interface AiCallResult<T = any> {
  success: boolean;
  data?: T;
  error?: AiErrorInfo;
}

/**
 * 統一呼叫後端 AI Cloud Function 的介面（增強版）
 * @param functionName 要呼叫的 Function 名稱
 * @param params 傳給 Function 的參數
 * @param context 錯誤上下文（用於日誌）
 * @returns 包含成功狀態和數據或錯誤信息的結果
 */
export const callAiFunction = async <T = any>(
  functionName: string,
  params: any,
  context?: string
): Promise<AiCallResult<T>> => {
  try {
    const callable = httpsCallable(functions, functionName);
    const result = await callable(params);

    return {
      success: true,
      data: result.data as T
    };
  } catch (error: any) {
    console.error(`Error calling AI function ${functionName}:`, error);

    // 使用新的錯誤處理機制
    const errorInfo = handleAiError(error, context || functionName);

    return {
      success: false,
      error: errorInfo
    };
  }
};

/**
 * 帶重試機制的 AI 調用
 * @param functionName Function 名稱
 * @param params 參數
 * @param maxRetries 最大重試次數
 * @param context 錯誤上下文
 * @returns AI 調用結果
 */
export const callAiFunctionWithRetry = async <T = any>(
  functionName: string,
  params: any,
  maxRetries: number = 2,
  context?: string
): Promise<AiCallResult<T>> => {
  let lastError: AiErrorInfo | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await callAiFunction<T>(functionName, params, context);

    if (result.success) {
      return result;
    }

    lastError = result.error;

    // 如果錯誤不可重試，立即返回
    if (!result.error?.canRetry) {
      break;
    }

    // 如果不是最後一次嘗試，等待後重試
    if (attempt < maxRetries) {
      const delay = (result.error?.retryAfterSeconds || 5) * 1000;
      console.log(`[AI Retry] Attempt ${attempt + 1}/${maxRetries + 1} failed. Retrying after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    error: lastError
  };
};

/**
 * 向後兼容：舊版呼叫方式
 * 保留此函數以確保現有代碼不中斷
 */
export const callGemini = async (prompt: string): Promise<string> => {
  try {
    const result = await callAiFunction('generateGrowthReport', { prompt });

    if (!result.success || !result.data) {
      return result.error?.userMessage || "AI 服務暫時無法使用";
    }

    const data: any = result.data;
    return data.report || data.text || (typeof data === 'string' ? data : "");
  } catch (error: any) {
    return "AI 服務發生錯誤，請稍後再試";
  }
};
