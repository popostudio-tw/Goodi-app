import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase";

/**
 * 呼叫後端 Gemini Cloud Function
 * @param prompt 傳給 Gemini 的提示
 * @returns Gemini 回傳的文字
 */
export const callGemini = async (prompt: string): Promise<string> => {
  try {
    const generateGrowthReport = httpsCallable(functions, 'generateGrowthReport');
    const result = await generateGrowthReport({ prompt });
    // HttpsCallableResult 的 data 屬性是 any，我們預期它是 string
    return result.data as string;
  } catch (error) {
    console.error("Error calling Gemini:", error);
    // 你可以根據需求回傳更友善的錯誤訊息
    return "AI 功能暫時無法使用，請稍後再試。";
  }
};
