// index.ts（TypeScript + v2 Cloud Functions）
// 使用 Firebase v2 https.onCall，並透過 Secret Manager 取得 GEMINI_API_KEY

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GoogleGenAI } from "@google/genai";

// 從環境變數中安全地讀取 API Key
// （GEMINI_API_KEY 來自：firebase functions:secrets:set GEMINI_API_KEY）
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  // 部署時如果沒讀到 key，直接在 log 裡提示，避免之後執行才一堆錯誤
  console.error("環境變數 GEMINI_API_KEY 未設定，請確認 Secret 是否正確設定");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Cloud Function: generateGrowthReport
// 接收前端傳來的 prompt，呼叫 Gemini 產生報告並回傳
export const generateGrowthReport = onCall(
  {
    // 告訴 Cloud Functions：這支 function 會用到 GEMINI_API_KEY 這個 Secret
    secrets: ["GEMINI_API_KEY"],
    // 需要的話可以指定區域（不填也可以）
    // region: "asia-east1",
  },
  async (request) => {
    const { data, auth } = request;

    // 1. 驗證使用者是否登入
    if (!auth) {
      throw new HttpsError(
        "unauthenticated",
        "只有登入使用者才能請求 AI 報告。"
      );
    }

    // 2. 驗證輸入數據
    const { prompt } = (data || {}) as { prompt?: string };
    if (!prompt || typeof prompt !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "缺少必要的 Prompt 參數。"
      );
    }

    try {
      // 3. 呼叫 Gemini API
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      // 4. 返回結果給前端
      return { report: response.text };

    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new HttpsError(
        "internal",
        "AI 服務處理請求時發生錯誤。"
      );
    }
  }
);
