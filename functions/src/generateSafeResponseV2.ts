/**
 * Enhanced Generate Safe Response Function (Optimized)
 * 
 * 替換 index.ts 中的 generateSafeResponse
 * 實作單次 AI 呼叫整合安全檢查與溫暖回覆
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { callGemini } from "./geminiWrapper";
import {
    analyzeSafetyRisk,
    logSafetyFlag,
    hasRecentSafetyFlags
} from "./safetyHelpers";

interface CombinedAiResponse {
    riskLevel: 'none' | 'low' | 'medium' | 'high';
    response: string;
    detectedTopics?: string[];
}

export const generateSafeResponseV2 = onCall(
    {
        secrets: ["GEMINI_API_KEY"],
        timeoutSeconds: 60,
    },
    async (request) => {
        const { data, auth } = request;
        const { userMessage } = data;
        const userId = auth?.uid;

        // 1. 驗證請求
        if (!auth || !userId) {
            throw new HttpsError(
                "unauthenticated",
                "只有登入使用者才能使用悄悄話樹。"
            );
        }

        if (!userMessage || typeof userMessage !== "string") {
            throw new HttpsError(
                "invalid-argument",
                "缺少必要的 userMessage 參數。"
            );
        }

        try {
            console.log(`[TreeHouse] Processing message for user ${userId} (Optimized Flow)`);

            // 2. 檢查用戶是否有近期安全標記
            const hasRecentFlags = await hasRecentSafetyFlags(userId, 7);
            const recentFlagNote = hasRecentFlags
                ? "注意：此用戶近期有安全標記，請採取較謹慎的態度（預設風險等級至少為低）。"
                : "";

            console.log(`[TreeHouse] Recent safety flags: ${hasRecentFlags}`);

            // 3. 建構綜合 Prompt (取代原有的兩階段 Prompt)
            const combinedPrompt = `你是一個溫暖、充滿同理心的 AI 朋友 Goodi。你的任務是分析孩子的訊息並產生合適的回覆。

請執行以下步驟：
1. **安全風險分析**：判斷訊息是否包含自殺、自傷、霸凌、家庭暴力等高風險內容。
2. **決定回覆策略**：
   - 若有風險（高/中/低）：使用「信任模式」，引導孩子向大人求助。
     - 高風險：溫柔但堅定地建議找大人幫忙，強調不是他們的錯。
     - 中/低風險：驗證感受，提供情緒調節建議，鼓勵跟信任的人聊聊。
   - 若無風險：使用「一般鼓勵模式」，給予溫暖陪伴，認可感受，保持輕鬆友善。
3. **生成回覆**：根據策略撰寫 60-120 字的回覆。
${recentFlagNote}

使用者訊息：「${userMessage}」

請以嚴格的 JSON 格式輸出，不要包含 Markdown 標記 (如 \`\`\`json ...)：
{
  "riskLevel": "none" | "low" | "medium" | "high",
  "response": "給孩子的溫暖回覆內容",
  "detectedTopics": ["議題1", "議題2"]
}`;

            // 4. 單次呼叫 AI
            const aiResult = await callGemini({
                source: 'treehouse',
                userId,
                prompt: combinedPrompt,
                model: 'gemini-1.5-flash', // 使用較高效的模型
            });

            // 5. 解析結果
            let parsedResult: CombinedAiResponse = {
                riskLevel: 'none',
                response: '',
                detectedTopics: []
            };

            if (aiResult.success && aiResult.text) {
                try {
                    // 清理 markdown 標記以便解析
                    const cleanText = aiResult.text.replace(/```json/g, '').replace(/```/g, '').trim();
                    parsedResult = JSON.parse(cleanText);
                } catch (e) {
                    console.error("[TreeHouse] Failed to parse JSON response:", e);
                    // Fallback: 如果解析失敗，假設整個文本是回覆，風險等級設為 unknown (或 safe)
                    // 為了安全起見，如果無法解析，我們使用 AI 的原始文本作為回覆，並進行本地關鍵詞檢查
                    parsedResult.response = aiResult.text;
                }
            } else {
                // API 呼叫失敗的 Fallback
                console.warn("[TreeHouse] AI call failed, using fallback response.");
                parsedResult.response = "Goodi 聽到了喔！謝謝你跟我分享。現在 Goodi 有點忙碌，等等再好好跟你聊聊！";
                // 不直接 return，讓流程繼續執行本地安全檢查與風險合併
            }

            // 6. 使用本地分析進行二次確認（雙重保險）
            const localSafetyCheck = analyzeSafetyRisk(userMessage, parsedResult.response);
            const riskLevels = ['none', 'low', 'medium', 'high'];

            // 決定最終風險等級 (取 AI 與本地檢測較高者)
            let initialRisk: 'none' | 'low' | 'medium' | 'high' = hasRecentFlags ? 'low' : 'none';

            // 比較 AI 判斷、本地檢測、初始設定，取最大值
            let finalRiskLevel: 'none' | 'low' | 'medium' | 'high' = parsedResult.riskLevel || 'none';
            if (riskLevels.indexOf(localSafetyCheck.riskLevel) > riskLevels.indexOf(finalRiskLevel)) {
                finalRiskLevel = localSafetyCheck.riskLevel;
            }
            if (riskLevels.indexOf(initialRisk) > riskLevels.indexOf(finalRiskLevel)) {
                finalRiskLevel = initialRisk;
            }

            // 合併議題
            const combinedTopics = Array.from(new Set([
                ...(parsedResult.detectedTopics || []),
                ...(localSafetyCheck.detectedTopics || [])
            ]));

            const needsAttention = finalRiskLevel !== 'none';

            console.log(`[TreeHouse] Result - AI Risk: ${parsedResult.riskLevel}, Local Risk: ${localSafetyCheck.riskLevel}, Final: ${finalRiskLevel}`);

            // 7. 如果需要關注，記錄安全標記
            if (needsAttention) {
                await logSafetyFlag(userId, userMessage, {
                    needsAttention: true,
                    riskLevel: finalRiskLevel,
                    concerns: [
                        ...localSafetyCheck.concerns,
                        ...(parsedResult.riskLevel && parsedResult.riskLevel !== 'none' ? [`AI 檢測風險: ${parsedResult.riskLevel}`] : [])
                    ],
                    detectedTopics: combinedTopics
                });
            }

            // 8. 返回結果
            return {
                response: parsedResult.response,
                needsAttention,
                riskLevel: finalRiskLevel,
                trustModeTriggered: needsAttention
            };

        } catch (error: any) {
            console.error("WhisperTree error:", error);
            throw new HttpsError(
                "internal",
                `處理訊息時發生錯誤: ${error.message || "系統忙碌中"}`
            );
        }
    }
);
