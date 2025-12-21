import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase";

/**
 * 統一呼叫後端 AI Cloud Function 的介面
 * @param functionName 要呼叫的 Function 名稱 (例如 'generateSafeResponse', 'generateGrowthReport')
 * @param params 傳給 Function 的參數
 * @returns 回傳的結果內容
 */
export const callAiFunction = async (functionName: string, params: any): Promise<any> => {
  try {
    const callable = httpsCallable(functions, functionName);
    const result = await callable(params);
    return result.data;
  } catch (error: any) {
    console.error(`Error calling AI function ${functionName}:`, error);
    // 拋出具體的錯誤訊息給前端顯示
    throw new Error(error.message || "AI 服務暫時無法使用，請稍後再試。");
  }
};

/**
 * 向後兼容舊版呼叫方式
 */
export const callGemini = async (prompt: string): Promise<string> => {
  try {
    const data: any = await callAiFunction('generateGrowthReport', { prompt });
    return data.report || data.text || (typeof data === 'string' ? data : "");
  } catch (error: any) {
    return error.message;
  }
};

