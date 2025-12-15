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

// Cloud Function: generateGeminiContent
// 通用的內容生成函數，支援文字和 JSON 輸出
export const generateGeminiContent = onCall(
  {
    secrets: ["GEMINI_API_KEY"],
  },
  async (request) => {
    const { data, auth } = request;

    // 1. 驗證使用者是否登入
    if (!auth) {
      throw new HttpsError(
        "unauthenticated",
        "只有登入使用者才能使用 AI 服務。"
      );
    }

    // 2. 驗證輸入數據
    const { prompt, model, schema, responseMimeType } = (data || {}) as {
      prompt?: string;
      model?: string;
      schema?: any;
      responseMimeType?: string;
    };

    if (!prompt || typeof prompt !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "缺少必要的 prompt 參數。"
      );
    }

    try {
      // 3. 準備請求配置
      const requestConfig: any = {
        model: model || "gemini-2.5-flash",
        contents: prompt,
      };

      // 如果有指定 schema，加入 config
      if (schema || responseMimeType) {
        requestConfig.config = {};
        if (responseMimeType) {
          requestConfig.config.responseMimeType = responseMimeType;
        }
        if (schema) {
          requestConfig.config.responseSchema = schema;
        }
      }

      // 4. 呼叫 Gemini API
      const response = await ai.models.generateContent(requestConfig);

      // 5. 返回結果給前端
      return { text: response.text };

    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new HttpsError(
        "internal",
        "AI 服務處理請求時發生錯誤。"
      );
    }
  }
);

// Cloud Function: generateDailyContent
// 生成每日共用內容（歷史的今天 + 動物冷知識）
export const generateDailyContent = onCall(
  {
    secrets: ["GEMINI_API_KEY"],
  },
  async (request) => {
    const { data, auth } = request;

    // 1. 驗證使用者是否登入
    if (!auth) {
      throw new HttpsError(
        "unauthenticated",
        "只有登入使用者才能請求每日內容。"
      );
    }

    // 2. 取得今天日期
    const { date } = (data || {}) as { date?: string };
    if (!date || typeof date !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "缺少必要的 date 參數。"
      );
    }

    try {
      const dateObj = new Date(date);
      const month = dateObj.getMonth() + 1;
      const day = dateObj.getDate();
      const year = dateObj.getFullYear();
      const seed = year * 10000 + month * 100 + day;

      // 3. 生成歷史的今天
      const historyPrompt = `Find a fun, educational, and positive historical event from this day (${month}/${day}) suitable for children aged 5-12. Explain it in Traditional Chinese in an engaging way. Length: approximately 100 words. Ensure it is factually correct. Use seed ${seed} for uniqueness.`;
      const historyResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: historyPrompt,
      });

      // 4. 生成動物冷知識
      const triviaPrompt = `Tell me a fun and educational animal trivia fact suitable for children aged 5-12. Explain it in Traditional Chinese. Make it interesting! Length: approximately 100 words. Use seed ${seed} to ensure different content each day.`;
      const triviaResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: triviaPrompt,
      });

      // 5. 返回結果
      return {
        historyEvent: historyResponse.text,
        animalTrivia: triviaResponse.text,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error("Daily Content Generation Error:", error);
      throw new HttpsError(
        "internal",
        "生成每日內容時發生錯誤。"
      );
    }
  }
);

// Cloud Function: generateGrowthReport (保留向後兼容)
// 接收前端傳來的 prompt，呼叫 Gemini 產生報告並回傳
export const generateGrowthReport = onCall(
  {
    secrets: ["GEMINI_API_KEY"],
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

// Cloud Function: generateSafeResponse
// 優化的悄悄話樹函數，將安全檢查和回應生成合併為單一呼叫
export const generateSafeResponse = onCall(
  {
    secrets: ["GEMINI_API_KEY"],
  },
  async (request) => {
    const { data, auth } = request;

    // 1. 驗證使用者是否登入
    if (!auth) {
      throw new HttpsError(
        "unauthenticated",
        "只有登入使用者才能使用悄悄話樹。"
      );
    }

    // 2. 驗證輸入數據
    const { userMessage, userNickname } = (data || {}) as {
      userMessage?: string;
      userNickname?: string;
    };

    if (!userMessage || typeof userMessage !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "缺少必要的 userMessage 參數。"
      );
    }

    try {
      // 3. 先進行安全檢查
      const safetyPrompt = `You are a child safety expert. Analyze the following text from a child for any signs of sadness, distress, bullying, self-harm, or other negative emotions. Respond with ONLY "FLAG" if any such content is found, otherwise respond with ONLY "SAFE". Text: "${userMessage}"`;

      const safetyCheck = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: safetyPrompt,
      });

      const safetyResult = (safetyCheck.text || "SAFE").trim().toUpperCase();

      // 4. 如果內容需要關注，返回警示
      if (safetyResult.includes("FLAG")) {
        return {
          needsAttention: true,
          response: "",
        };
      }

      // 5. 通過安全檢查，生成回應
      const nickname = userNickname || "小朋友";
      const conversationPrompt = `You are Goodi, a warm and friendly AI companion for children. ${nickname} just shared: "${userMessage}". Please respond in Traditional Chinese (50-100 words) with warmth and encouragement. Keep your response age-appropriate, positive, and supportive.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: conversationPrompt,
        config: {
          temperature: 0.8,
        },
      });

      // 6. 返回正常回應
      return {
        needsAttention: false,
        response: response.text,
      };

    } catch (error) {
      console.error("WhisperTree Error:", error);
      throw new HttpsError(
        "internal",
        "處理訊息時發生錯誤。"
      );
    }
  }
);
