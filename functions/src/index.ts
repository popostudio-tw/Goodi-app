import { onCall, HttpsError } from "firebase-functions/v2/https";
import { callGemini, shouldUseFallback } from "./geminiWrapper";

import { initializeApp as initAdmin } from "firebase-admin/app";
initAdmin();


// === 注意：舊版 API 追蹤系統已移除 ===
// 所有 API 用量追蹤現在統一由 geminiWrapper.ts 處理
// 舊的 apiUsage/{userId}_{date} collection 為歷史資料，只讀不寫
// 新的用量記錄在 apiUsage/global_{date}

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

    // API 使用量檢查由 geminiWrapper 統一處理

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
      let requestConfig: any = undefined;
      if (schema || responseMimeType) {
        requestConfig = {};
        if (responseMimeType) {
          requestConfig.responseMimeType = responseMimeType;
        }
        if (schema) {
          requestConfig.responseSchema = schema;
        }
      }

      // 4. 呼叫 Gemini API via wrapper
      const result = await callGemini({
        source: 'task',
        userId: auth.uid,
        prompt,
        model: model || "gemini-1.5-flash",
        config: requestConfig
      });

      // 5. 檢查是否需要 fallback
      if (shouldUseFallback(result)) {
        throw new HttpsError(
          "resource-exhausted",
          result.rateLimited ? "API 使用量已達上限，請稍後再試" : "AI 服務暫時無法使用"
        );
      }

      // 6. 返回結果給前端
      return { text: result.text || "" };

    } catch (error: any) {
      console.error("Gemini API Error details:", error);
      throw new HttpsError(
        "internal",
        `AI 服務處理請求時發生錯誤: ${error.message || "未知錯誤"}`
      );
    }
  }
);

// Helper function to generate common daily content
async function generateAndStoreDailyContent(dateStr: string): Promise<{ todayInHistory: string; animalTrivia: string }> {
  const { getFirestore } = await import("firebase-admin/firestore");
  const db = getFirestore();

  try {
    const dateObj = new Date(dateStr);
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const year = dateObj.getFullYear();
    const seed = year * 10000 + month * 100 + day;

    // --- Story B: Existence Check ---
    const existingDoc = await db.collection('dailyContent').doc(dateStr).get();
    if (existingDoc.exists && existingDoc.data()?.status === 'completed') {
      console.log(`[Skip] Content for ${dateStr} already exists.`);
      return existingDoc.data() as { todayInHistory: string; animalTrivia: string };
    }

    // Fetch recent topics to avoid repetition
    let recentAnimals: string[] = [];
    let recentEvents: string[] = [];
    const recentDates: string[] = [];
    for (let i = 1; i <= 7; i++) {
      const pastDate = new Date(dateObj);
      pastDate.setDate(pastDate.getDate() - i);
      recentDates.push(pastDate.toISOString().split('T')[0]);
    }

    const docs = await Promise.all(recentDates.map(d => db.collection('dailyContent').doc(d).get()));
    docs.forEach(doc => {
      if (doc.exists) {
        const data = doc.data();
        if (data?.animalTrivia) recentAnimals.push(data.animalTrivia.substring(0, 30));
        if (data?.todayInHistory) recentEvents.push(data.todayInHistory.substring(0, 30));
      }
    });

    // Use a transaction or strict check to prevent double AI calls
    return await db.runTransaction(async (transaction) => {
      const docRef = db.collection('dailyContent').doc(dateStr);
      const freshDoc = await transaction.get(docRef);
      const freshData = freshDoc.data();

      if (freshDoc.exists && freshData?.status === 'completed') {
        return freshData as { todayInHistory: string; animalTrivia: string };
      }

      // Concurrency check
      if (freshDoc.exists && freshData?.status === 'generating') {
        const generatedAt = freshData.generatedAt ? new Date(freshData.generatedAt).getTime() : 0;
        if (Date.now() - generatedAt < 60000) { // 延長至 1 分鐘
          console.log(`Generation for ${dateStr} is already in progress...`);
          throw new Error('GENERATION_IN_PROGRESS');
        }
      }

      transaction.set(docRef, { status: 'generating', generatedAt: new Date().toISOString() }, { merge: true });

      // Story C: AI Retry & Backoff logic
      console.log(`Starting AI generation for ${dateStr} with retry logic`);

      const combinedPrompt = `
你是 Goodi，一隻可愛的小恐龍 AI 夥伴，專門為 5-12 歲的小朋友提供有趣的知識。
請為 ${month}月${day}日 生成兩段內容：

【格式要求】
- 每段內容約 80-100 個中文字
- 只使用繁體中文，禁止拼音或英文
- 語氣親切、有趣、適合小朋友閱讀
- 內容要有明確的知識點，讓孩子學到東西

【內容要求】
1. todayInHistory（歷史的今天）：選一個 ${month}/${day} 發生過的有趣歷史事件，用說故事的方式介紹，讓小朋友覺得「哇，好酷！」
2. animalTrivia（動物冷知識）：介紹一個有趣的動物知識，可以是動物的特殊能力、有趣行為或驚人事實。

【避免重複這些最近的主題】
- 歷史: ${recentEvents.join(', ') || '無'}
- 動物: ${recentAnimals.join(', ') || '無'}

輸出 JSON 格式，key 為 "todayInHistory" 和 "animalTrivia"。
隨機種子: ${seed}`;

      let response;
      let retries = 0;
      const maxRetries = 3;
      const retryDelays = [2000, 5000, 10000]; // 2s, 5s, 10s backoff

      while (retries <= maxRetries) {
        try {
          // 使用 wrapper 呼叫 AI
          const aiResult = await callGemini({
            source: 'daily',
            userId: 'system',
            prompt: combinedPrompt,
            model: "gemini-1.5-flash",
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "object",
                properties: {
                  todayInHistory: { type: "string" },
                  animalTrivia: { type: "string" }
                },
                required: ["todayInHistory", "animalTrivia"]
              }
            }
          });

          if (shouldUseFallback(aiResult)) {
            throw new Error(aiResult.error || "AI call failed");
          }

          response = { text: aiResult.text };
          break; // Success!
        } catch (aiError: any) {
          if (retries < maxRetries) {
            console.warn(`AI Error for ${dateStr}, retry #${retries + 1} after ${retryDelays[retries]}ms...`, aiError.message);
            await new Promise(resolve => setTimeout(resolve, retryDelays[retries]));
            retries++;
          } else {
            // Log final error to dailyContentStatus
            await db.collection('dailyContentStatus').doc(dateStr).set({
              error: aiError.message,
              lastAttempt: new Date().toISOString(),
              retries
            }, { merge: true });
            throw aiError;
          }
        }
      }

      const contentStr = response?.text || "{}";
      const content = JSON.parse(contentStr);

      const result = {
        todayInHistory: content.todayInHistory || "歷史上今天發生了許多奇妙的事呢！",
        animalTrivia: content.animalTrivia || "大自然有很多神秘的動物朋友等待我們去發現！",
        generatedAt: new Date().toISOString(),
        status: 'completed'
      };

      transaction.set(docRef, result);
      return result;
    });

  } catch (error: any) {
    if (error.message === 'GENERATION_IN_PROGRESS') throw error;
    console.error(`Final content generation failed for ${dateStr}:`, error);
    // Story E: Fallback in backend if AI fails eventually
    const fallback = {
      todayInHistory: "歷史上的今天，世界各地的人們都在努力創造更美好的未來。每一天都是新的開始，讓我們一起加油！",
      animalTrivia: "動物世界充滿驚奇！雖然 Goodi 暫時斷線了，但你可以觀察身邊的小昆蟲，牠們也有很酷的生存技巧喔！",
      generatedAt: new Date().toISOString(),
      status: 'completed'
    };
    await db.collection('dailyContent').doc(dateStr).set(fallback);
    return fallback;
  }
}

// === 每日內容生成排程（優化版）===

// Scheduled Function: 每週日批量生成整週內容（節省 API 費用）
import { onSchedule } from "firebase-functions/v2/scheduler";
export const scheduledWeeklyDailyContent = onSchedule(
  {
    schedule: "0 1 * * 0", // 每週日凌晨 01:00 台灣時間
    timeZone: "Asia/Taipei",
    secrets: ["GEMINI_API_KEY"],
  },
  async (event) => {
    const baseDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));

    console.log(`[Weekly Generation] Starting weekly batch generation for ${baseDate.toISOString().split('T')[0]}`);

    // 生成整週內容（7天）
    for (let i = 0; i <= 6; i++) {
      const target = new Date(baseDate);
      target.setDate(target.getDate() + i);

      const year = target.getFullYear();
      const month = String(target.getMonth() + 1).padStart(2, '0');
      const day = String(target.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      console.log(`[Weekly Generation] Processing ${dateStr} (Day ${i + 1}/7)`);
      try {
        await generateAndStoreDailyContent(dateStr);
        console.log(`[Weekly Generation] ✅ Successfully generated content for ${dateStr}`);
      } catch (err) {
        console.error(`[Weekly Generation] ❌ Failed to generate content for ${dateStr}:`, err);
      }

      // Wait 2s between dates to space out API calls
      await new Promise(r => setTimeout(r, 2000));
    }

    console.log(`[Weekly Generation] Completed weekly batch generation`);
  }
);

// Scheduled Function: 每日檢查機制（輕量級備援）
export const dailyContentCheck = onSchedule(
  {
    schedule: "30 1 * * *", // 每天凌晨 01:30 台灣時間（在週報之後）
    timeZone: "Asia/Taipei",
    secrets: ["GEMINI_API_KEY"],
  },
  async (event) => {
    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore();
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    console.log(`[Daily Check] Checking content for ${dateStr}`);

    try {
      const doc = await db.collection('dailyContent').doc(dateStr).get();

      if (!doc.exists || doc.data()?.status !== 'completed') {
        console.log(`[Daily Check] ⚠️ Missing or incomplete content for ${dateStr}, generating now...`);
        await generateAndStoreDailyContent(dateStr);
        console.log(`[Daily Check] ✅ Successfully generated missing content for ${dateStr}`);
      } else {
        console.log(`[Daily Check] ✅ Content for ${dateStr} exists and is complete`);
      }
    } catch (err) {
      console.error(`[Daily Check] ❌ Error checking/generating content for ${dateStr}:`, err);
    }
  }
);


// Cloud Function: generateDailyContent
export const generateDailyContent = onCall(
  {
    secrets: ["GEMINI_API_KEY"],
  },
  async (request) => {
    const { data, auth } = request;

    if (!auth) {
      throw new HttpsError("unauthenticated", "只有登入使用者才能請求每日內容。");
    }

    const { date } = (data || {}) as { date?: string };
    if (!date) {
      throw new HttpsError("invalid-argument", "缺少必要的 date 參數。");
    }

    const normalizedDate = date.replace(/\//g, '-');

    try {
      const { getFirestore } = await import("firebase-admin/firestore");
      const db = getFirestore();

      // 1. 嘗試從 Firestore 讀取快取
      const docSnap = await db.collection('dailyContent').doc(normalizedDate).get();
      if (docSnap.exists && docSnap.data()?.status === 'completed') {
        return docSnap.data();
      }

      // 2. 如果沒資料，觸發「第一個用戶」生成邏輯（Fallback）
      console.log(`[Fallback] Daily content for ${normalizedDate} not found. Triggering generation for the first user.`);
      try {
        return await generateAndStoreDailyContent(normalizedDate);
      } catch (genError: any) {
        if (genError.message === 'GENERATION_IN_PROGRESS') {
          // 如果正在生成中，請用戶稍後再試，暫不返回 500
          return {
            historyEvent: "Goodi 正在努力查閱資料中，請過幾秒鐘再重新整理喔！",
            animalTrivia: "Goodi 正在觀察小動物，請稍等一下下！",
            status: 'pending'
          };
        }
        throw genError;
      }

    } catch (error: any) {
      console.error("Daily Content Retrieval/Generation Error:", error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError("internal", "資料連線異常，請檢查網路");
    }
  }
);

// 臨時手動觸發器：用來幫今天「點火」生成資料，確認 UI 正常後可刪除
export const manualGenerateDailyContent = onCall(
  {
    secrets: ["GEMINI_API_KEY"],
  },
  async (request) => {
    const { data, auth } = request;
    if (!auth) throw new HttpsError("unauthenticated", "Auth required");

    // 管理員權限檢查：只允許特定 email 觸發
    const ADMIN_EMAILS = [
      'popo.studio@msa.hinet.net',  // 主要管理員
      // 可以在此處添加更多管理員 email
    ];

    if (!ADMIN_EMAILS.includes(auth.token.email || '')) {
      console.warn(`[Security] Unauthorized manual trigger attempt by ${auth.token.email}`);
      throw new HttpsError(
        "permission-denied",
        "此功能僅限管理員使用。如需手動觸發，請聯繫系統管理員。"
      );
    }

    const { date, force } = (data || {}) as { date: string; force?: boolean };
    const normalizedDate = date.replace(/\//g, '-');

    console.log(`Manual trigger for ${normalizedDate}, force=${force}, by admin: ${auth.token.email}`);

    // 如果設置 force=true，先刪除既有資料強制重新生成
    if (force) {
      const { getFirestore } = await import("firebase-admin/firestore");
      const db = getFirestore();
      try {
        await db.collection('dailyContent').doc(normalizedDate).delete();
        console.log(`Force deleted existing content for ${normalizedDate}`);
      } catch (e) {
        console.log(`No existing content to delete for ${normalizedDate}`);
      }
    }

    return await generateAndStoreDailyContent(normalizedDate);
  }
);


// Helper: 為單一用戶生成昨日總結
async function generateYesterdaySummaryForUser(
  userId: string,
  userData: any,
  yesterdayStr: string
): Promise<string> {
  const nickname = userData.userProfile?.nickname || '小朋友';

  // 計算昨天的範圍 (毫秒)
  const startTime = new Date(yesterdayStr).getTime();
  const endTime = startTime + 24 * 60 * 60 * 1000;

  const yesterdayTasks = (userData.transactions || []).filter((t: any) =>
    t.timestamp >= startTime && t.timestamp < endTime && t.description?.startsWith('完成任務')
  );

  const yesterdayJournals = (userData.journalEntries || []).filter((j: any) =>
    j.author === 'user' && new Date(j.date).getTime() >= startTime && new Date(j.date).getTime() < endTime
  );

  if (yesterdayTasks.length === 0 && yesterdayJournals.length === 0) {
    return `昨天 ${nickname} 給自己放了一個小長假呢！休息是為了走更長遠的路，今天 Goodi 陪你一起重新出發吧！🦖`;
  }

  const prompt = `
你是一位溫暖、耐心的 AI 恐龍 Goodi，是孩子最好的朋友。
請根據「${nickname}」昨天的表現，寫一段 80-120 字的溫暖鼓勵與總結（繁體中文）。

昨天的小數據：
- 完成任務：${yesterdayTasks.length} 個
- 提到的心事：${yesterdayJournals.map((j: any) => j.text).join('; ') || '無'}

要求：
1. 語氣像好朋友在聊天，溫柔且充滿正能量。
2. 不要使用條列式，像一段溫暖的話語。
3. 具體提到孩子完成任務的努力。
4. 如果有提過心事，給予簡短的暖心回應。
5. 最後給一句充滿希望的結尾，鼓勵今天也開開心心！
`;

  try {
    // 使用 wrapper 呼叫 AI
    const result = await callGemini({
      source: 'summary',
      userId,
      prompt,
      model: "gemini-1.5-flash",
      config: {
        temperature: 0.8,
      },
    });

    if (shouldUseFallback(result)) {
      return "昨天你真的很棒喔！Goodi 有看到你的努力，今天也要一起加油！🦕";
    }

    return result.text || "昨天你真的很棒喔！Goodi 有看到你的努力，今天也要一起加油！🦕";
  } catch (error) {
    console.error(`Gemini summary generation error for ${userId}:`, error);
    return "昨天你真的很棒喔！Goodi 永遠支持你！🦖";
  }
}

// Cloud Function: generateYesterdaySummary
// 為單一用戶生成昨日總結，主動從 Firestore 讀取預生成的資料
export const generateYesterdaySummary = onCall(
  {
    secrets: ["GEMINI_API_KEY"],
  },
  async (request) => {
    const { auth } = request;
    if (!auth) {
      throw new HttpsError("unauthenticated", "請登入後再試。");
    }

    const userId = auth.uid;
    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore();

    // 1. 取得昨天的日期字串 (台灣時間)
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-ZA', {
      timeZone: 'Asia/Taipei',
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
    const parts = formatter.formatToParts(now);
    const todayStr = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`;

    // 計算昨日
    const d = new Date(todayStr);
    d.setDate(d.getDate() - 1);
    const yesterdayStr = d.toISOString().split('T')[0];

    // 2. 檢查資料庫快取
    const cacheRef = db.collection('users').doc(userId).collection('dailySummaries').doc(yesterdayStr);
    const cacheSnap = await cacheRef.get();
    if (cacheSnap.exists) {
      console.log(`Returning cached summary for user ${userId} context date ${yesterdayStr}`);
      return cacheSnap.data();
    }

    // 嚴格模式：沒資料報錯（由前端顯示統一錯誤訊息）
    throw new HttpsError("not-found", "資料連線異常，請檢查網路");
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

    // API 使用量檢查由 geminiWrapper 統一處理

    // 2. 驗證輸入數據
    const { prompt } = (data || {}) as { prompt?: string };
    if (!prompt || typeof prompt !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "缺少必要的 Prompt 參數。"
      );
    }

    try {
      // 3. 呼叫 Gemini API via wrapper
      const result = await callGemini({
        source: 'growth',
        userId: auth.uid,
        prompt,
        model: "gemini-1.5-flash"
      });

      if (shouldUseFallback(result)) {
        throw new HttpsError(
          "resource-exhausted",
          result.rateLimited ? "API 使用量已達上限，請稍後再試" : "AI 服務暫時無法使用"
        );
      }

      // 4. 返回結果給前端
      return { report: result.text || "報告生成中..." };

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

    // API 使用量檢查由 geminiWrapper 統一處理

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
      // 3. 進行更嚴格的安全檢查
      // 我們要求 AI 如果偵測到任何負面情緒、威脅、自傷或霸凌，立即標記
      const safetyPrompt = `
You are a child safety and psychology expert. 
Analyze the following message from a child for any signs of:
- Sadness, depression, or distress
- Bullying or social isolation
- Self-harm or suicidal thoughts
- Aggression, threats, or violence ("打人", "殺", "恨")
- Explicit or inappropriate content

Respond with ONLY "FLAG" if ANY of the above are detected, even if subtle. 
Otherwise respond with ONLY "SAFE".

Child's message: "${userMessage}"`;

      // 使用 wrapper 進行安全檢查
      const safetyCheckResult = await callGemini({
        source: 'treehouse',
        userId: auth.uid,
        prompt: safetyPrompt,
        model: "gemini-1.5-flash"
      });

      const safetyResult = (safetyCheckResult.text || "SAFE").trim().toUpperCase();
      console.log(`Safety check result for "${userMessage.substring(0, 20)}...": ${safetyResult}`);

      // 4. 如果內容需要關注，返回警示
      if (safetyResult.includes("FLAG") || safetyResult === "FLAG") {
        return {
          needsAttention: true,
          response: "",
        };
      }

      // 5. 通過安全檢查，生成回應
      const nickname = userNickname || "小朋友";
      const conversationPrompt = `
You are Goodi, a warm, patient, and friendly AI dinosaur companion for children. 
${nickname} just shared: "${userMessage}". 
Please respond in Traditional Chinese (繁體中文).
Your tone should be very supportive, encouraging, and age-appropriate (5-12 years old).
Length: 50-100 words.
Focus on being a good listener and a best friend.`;

      const responseResult = await callGemini({
        source: 'treehouse',
        userId: auth.uid,
        prompt: conversationPrompt,
        model: "gemini-1.5-flash",
        config: {
          temperature: 0.8,
        },
      });

      if (shouldUseFallback(responseResult)) {
        return {
          needsAttention: false,
          response: "謝謝你的分享，Goodi 聽到了喔！跟 Goodi 一起加油吧！",
        };
      }

      console.log("Goodi response generated successfully");

      // 6. 返回正常回應
      return {
        needsAttention: false,
        response: responseResult.text || "謝謝你的分享，Goodi 聽到了喔！跟 Goodi 一起加油吧！",
      };

    } catch (error: any) {
      console.error("WhisperTree Error:", error);
      throw new HttpsError(
        "internal",
        `處理訊息時發生錯誤: ${error.message || "系統忙碌中"}`
      );
    }
  }
);

// === 週報排程生成 ===

// Helper: 取得週次 key（例如 2024-W51）
function getWeekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// Helper: 為單一用戶生成週報
async function generateWeeklyReportForUser(
  userId: string,
  userData: any
): Promise<string> {
  const { userProfile, transactions, scoreHistory, journalEntries } = userData;
  const nickname = userProfile?.nickname || '小朋友';
  const age = userProfile?.age || '未知';

  // 計算過去 7 天的資料
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const weeklyTasks = (transactions || []).filter((t: any) =>
    t.timestamp >= sevenDaysAgo && t.description?.startsWith('完成任務')
  );

  const weeklyScores = (scoreHistory || []).filter((s: any) =>
    new Date(s.date).getTime() >= sevenDaysAgo
  );

  const weeklyJournals = (journalEntries || []).filter((j: any) =>
    j.author === 'user' && new Date(j.date).getTime() >= sevenDaysAgo
  );

  const prompt = `
你是一位溫暖、有洞察力的兒童發展專家 Goodi。請根據以下資料，為一位名叫「${nickname}」(${age}歲) 的孩子家長撰寫一份富有溫度的成長週報。

本週行為數據：
- 完成任務次數：${weeklyTasks.length} 次
- 學業成績表現：${weeklyScores.map((s: any) => `${s.subject}:${s.score}`).join(', ') || '本週無回報紀錄'}
- 心情分享紀錄：${weeklyJournals.slice(0, 3).map((j: any) => j.text).join('; ') || '無文字紀錄'}

報告撰寫要求：
1. 使用繁體中文，保持溫柔且專業的口吻。
2. 使用 Markdown 格式。
3. 表達對孩子本週努力的肯定，並將數據轉化為成長的視覺化描述。
4. 提供一個專屬於下週的「高品質親子時光」具體建議。

內容結構：
### ✨ 成長光芒記錄
[描述孩子本週最大的進步或完成任務的毅力]

### 🎓 智慧果實觀察
[針對成績或學習狀況給予鼓勵，並建議如何保持動力]

### 🌱 心靈小苗關懷
[如果孩子的心情紀錄中有情緒，請溫柔分析；若無則鼓勵家長本週安排一次深度對話]

### 🦖 Goodi 的暖心家務建議
[提供一個具體的親子互動或鼓勵策略]
  `;

  // 使用 wrapper 呼叫 AI
  const result = await callGemini({
    source: 'weekly',
    userId,
    prompt,
    model: "gemini-1.5-flash"
  });

  if (shouldUseFallback(result)) {
    return "本週報告生成中，請稍候...";
  }

  return result.text || "本週報告生成中，請稍候...";
}

// 排程函數：每週六凌晨 1:00（台灣時間）為所有 Premium 用戶生成週報
export const scheduledWeeklyReports = onSchedule(
  {
    schedule: "0 2 * * 6", // 每週六凌晨 2:00 (錯開每日內容生成)
    timeZone: "Asia/Taipei",
    secrets: ["GEMINI_API_KEY"],
  },
  async () => {
    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore();
    const weekKey = getWeekKey();

    console.log(`Starting weekly report generation for week: ${weekKey}`);

    try {
      // 取得所有 Premium 用戶
      const usersSnapshot = await db.collection('users')
        .where('plan', 'in', ['premium_monthly', 'premium_lifetime', 'advanced_monthly', 'advanced_lifetime'])
        .get();

      console.log(`Found ${usersSnapshot.size} premium users`);

      let successCount = 0;
      let errorCount = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();

        try {
          // 生成週報
          const reportContent = await generateWeeklyReportForUser(userId, userData);

          // 計算統計數據
          const now = Date.now();
          const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
          const weeklyTasks = (userData.transactions || []).filter((t: any) =>
            t.timestamp >= sevenDaysAgo && t.description?.startsWith('完成任務')
          );
          const weeklyScores = (userData.scoreHistory || []).filter((s: any) =>
            new Date(s.date).getTime() >= sevenDaysAgo
          );
          const weeklyJournals = (userData.journalEntries || []).filter((j: any) =>
            j.author === 'user' && new Date(j.date).getTime() >= sevenDaysAgo
          );

          // 儲存到 Firestore
          await db.collection('users').doc(userId)
            .collection('weeklyReports').doc(weekKey)
            .set({
              content: reportContent,
              weekKey,
              generatedAt: new Date().toISOString(),
              stats: {
                tasksCompleted: weeklyTasks.length,
                scoresReported: weeklyScores.length,
                journalEntries: weeklyJournals.length,
              }
            });

          successCount++;
          console.log(`Generated report for user: ${userId}`);

        } catch (userError) {
          errorCount++;
          console.error(`Failed to generate report for user ${userId}:`, userError);
        }

        // 避免 API 速率限制，每個用戶間隔 1 秒
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`Weekly reports completed. Success: ${successCount}, Errors: ${errorCount}`);

    } catch (error) {
      console.error("Scheduled weekly reports error:", error);
    }
  }
);

// === 手動觸發週報生成（用於測試）===
export const triggerWeeklyReport = onCall(
  {
    secrets: ["GEMINI_API_KEY"],
  },
  async (request) => {
    const { auth } = request;

    // 1. 驗證使用者是否登入
    if (!auth) {
      throw new HttpsError(
        "unauthenticated",
        "只有登入使用者才能觸發週報生成。"
      );
    }

    const userId = auth.uid;
    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore();

    try {
      // 取得用戶資料
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new HttpsError("not-found", "找不到用戶資料。");
      }

      const userData = userDoc.data();
      const weekKey = getWeekKey();

      console.log(`Manually triggering weekly report for user: ${userId}, week: ${weekKey}`);

      // 生成週報
      const reportContent = await generateWeeklyReportForUser(userId, userData);

      // 計算統計數據
      const now = Date.now();
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      const weeklyTasks = (userData?.transactions || []).filter((t: any) =>
        t.timestamp >= sevenDaysAgo && t.description?.startsWith('完成任務')
      );
      const weeklyScores = (userData?.scoreHistory || []).filter((s: any) =>
        new Date(s.date).getTime() >= sevenDaysAgo
      );
      const weeklyJournals = (userData?.journalEntries || []).filter((j: any) =>
        j.author === 'user' && new Date(j.date).getTime() >= sevenDaysAgo
      );

      // 儲存到 Firestore
      await db.collection('users').doc(userId)
        .collection('weeklyReports').doc(weekKey)
        .set({
          content: reportContent,
          weekKey,
          generatedAt: new Date().toISOString(),
          stats: {
            tasksCompleted: weeklyTasks.length,
            scoresReported: weeklyScores.length,
            journalEntries: weeklyJournals.length,
          }
        });

      console.log(`Weekly report generated successfully for user: ${userId}`);

      // 直接返回報告資料，前端不需要再查詢 Firestore
      return {
        success: true,
        fromCache: false,
        weekKey,
        report: {
          content: reportContent,
          stats: {
            tasksCompleted: weeklyTasks.length,
            scoresReported: weeklyScores.length,
            journalEntries: weeklyJournals.length,
          },
          generatedAt: new Date().toISOString()
        },
        message: "週報已成功生成！",
      };

    } catch (error) {
      console.error("Manual weekly report generation error:", error);
      throw new HttpsError(
        "internal",
        "生成週報時發生錯誤。"
      );
    }
  }
);

// === 昨日總結排程與手動觸發 ===

// 排程函數：每天凌晨 1:30（台灣時間）為所有 Premium 用戶生成昨日總結
export const scheduledYesterdaySummaries = onSchedule(
  {
    schedule: "30 1 * * *",
    timeZone: "Asia/Taipei",
    secrets: ["GEMINI_API_KEY"],
  },
  async () => {
    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore();

    // 1. 取得昨天的日期字串 (台灣時間)
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-ZA', {
      timeZone: 'Asia/Taipei',
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
    const parts = formatter.formatToParts(now);
    const todayStr = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`;

    const d = new Date(todayStr);
    d.setDate(d.getDate() - 1);
    const yesterdayStr = d.toISOString().split('T')[0];

    console.log(`Starting scheduled yesterday summaries for date: ${yesterdayStr}`);

    try {
      const usersSnapshot = await db.collection('users')
        .where('plan', 'in', ['premium_monthly', 'premium_lifetime', 'advanced_monthly', 'advanced_lifetime'])
        .get();

      console.log(`Found ${usersSnapshot.size} premium users for daily summary`);

      let count = 0;
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();

        try {
          const summary = await generateYesterdaySummaryForUser(userId, userData, yesterdayStr);

          await db.collection('users').doc(userId)
            .collection('dailySummaries').doc(yesterdayStr)
            .set({
              text: summary,
              date: yesterdayStr,
              generatedAt: new Date().toISOString(),
            });

          count++;
          // 避免速率限制
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
          console.error(`Failed summary for user ${userId}:`, err);
        }
      }
      console.log(`Completed scheduled summaries. Successfully generated ${count} summaries.`);
    } catch (error) {
      console.error("Scheduled yesterday summaries error:", error);
    }
  }
);

// 手動觸發器：立即為當前用戶生成昨日總結（用於測試）
export const triggerYesterdaySummary = onCall(
  {
    secrets: ["GEMINI_API_KEY"],
  },
  async (request) => {
    const { auth } = request;
    if (!auth) throw new HttpsError("unauthenticated", "Auth required");

    const userId = auth.uid;
    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore();

    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-ZA', {
      timeZone: 'Asia/Taipei',
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
    const parts = formatter.formatToParts(now);
    const todayStr = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`;
    const d = new Date(todayStr);
    d.setDate(d.getDate() - 1);
    const yesterdayStr = d.toISOString().split('T')[0];

    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) throw new HttpsError("not-found", "User not found");

      const summary = await generateYesterdaySummaryForUser(userId, userDoc.data(), yesterdayStr);

      await db.collection('users').doc(userId)
        .collection('dailySummaries').doc(yesterdayStr)
        .set({
          text: summary,
          date: yesterdayStr,
          generatedAt: new Date().toISOString(),
        });

      return { success: true, summary };
    } catch (error: any) {
      console.error("Manual summary trigger error:", error);
      throw new HttpsError("internal", error.message || "Failed to trigger summary");
    }
  }
);

// Account Deletion - Apple App Store Compliance Requirement
export { deleteUserAccount } from './deleteUserAccount';

// === �t�Ϊ��A�ʱ� ===
export { getSystemStatus } from './getSystemStatus';
