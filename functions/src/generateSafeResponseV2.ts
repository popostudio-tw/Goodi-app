/**
 * Enhanced Generate Safe Response Function
 * 
 * 替換 index.ts 中的 generateSafeResponse
 * 實作兩階段安全檢查：快速篩選 → 溫暖回覆
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { callGemini } from "./geminiWrapper";
import {
    analyzeSafetyRisk,
    logSafetyFlag,
    hasRecentSafetyFlags,
    getTrustModePrompt,
    getEncouragementPrompt
} from "./safetyHelpers";

export const generateSafeResponseV2 = onCall(
    {
        secrets: ["GEMINI_API_KEY"],
        timeoutSeconds: 60, // 延長至 60 秒支援兩階段處理
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
            console.log(`[TreeHouse] Processing message for user ${userId}`);

            // 2. 檢查用戶是否有近期安全標記（自動啟動信任模式）
            const hasRecentFlags = await hasRecentSafetyFlags(userId, 7);
            let initialRiskLevel: 'none' | 'low' | 'medium' | 'high' = hasRecentFlags ? 'low' : 'none';

            console.log(`[TreeHouse] Recent safety flags: ${hasRecentFlags}, initial risk: ${initialRiskLevel}`);

            // 3. 階段一：快速安全檢查（使用較簡單的 prompt）
            console.log("[TreeHouse] Stage 1: Safety screening");

            const safetyPrompt = `分析以下孩子的訊息，判斷是否包含需要注意的內容（自傷、霸凌、家庭問題等）：

訊息：「${userMessage}」

僅回答：
1. 風險等級（無/低/中/高）
2. 檢測到的議題（如有）

範例回答：「風險等級：中，檢測到：情緒困擾」
範例回答：「風險等級：無」`;

            const safetyCheckResult = await callGemini({
                source: 'treehouse',
                userId,
                prompt: safetyPrompt,
                model: 'gemini-2.0-flash', // 使用較快的模型進行初步檢查
            });

            // 解析安全檢查結果
            let aiIdentifiedRisk: 'none' | 'low' | 'medium' | 'high' = 'none';
            if (safetyCheckResult.success && safetyCheckResult.text) {
                const resultText = safetyCheckResult.text.toLowerCase();
                if (resultText.includes('高')) {
                    aiIdentifiedRisk = 'high';
                } else if (resultText.includes('中')) {
                    aiIdentifiedRisk = 'medium';
                } else if (resultText.includes('低')) {
                    aiIdentifiedRisk = 'low';
                }
            }

            // 取最高風險等級
            const riskLevels = ['none', 'low', 'medium', 'high'];
            const finalRiskLevel = riskLevels.indexOf(aiIdentifiedRisk) > riskLevels.indexOf(initialRiskLevel)
                ? aiIdentifiedRisk
                : initialRiskLevel;

            console.log(`[TreeHouse] AI risk: ${aiIdentifiedRisk}, Final risk: ${finalRiskLevel}`);

            // 4. 階段二：生成溫暖回覆
            console.log("[TreeHouse] Stage 2: Generating warm response");

            const responsePrompt = finalRiskLevel === 'none'
                ? getEncouragementPrompt(userMessage)
                : getTrustModePrompt(userMessage, finalRiskLevel);

            const responseResult = await callGemini({
                source: 'treehouse',
                userId,
                prompt: responsePrompt,
                model: 'gemini-2.0-flash',
            });

            if (!responseResult.success || !responseResult.text) {
                // Fallback 回覆
                return {
                    response: "Goodi 聽到了喔！謝謝你跟我分享。現在 Goodi 有點忙碌，等等再好好跟你聊聊！",
                    needsAttention: finalRiskLevel !== 'none',
                    riskLevel: finalRiskLevel
                };
            }

            const finalResponse = responseResult.text;

            // 5. 使用本地分析進行二次確認（基於關鍵詞）
            const localSafetyCheck = analyzeSafetyRisk(userMessage, finalResponse);

            // 合併 AI 和本地檢測結果
            const needsAttention = finalRiskLevel !== 'none' || localSafetyCheck.needsAttention;
            const combinedRiskLevel = riskLevels.indexOf(localSafetyCheck.riskLevel) > riskLevels.indexOf(finalRiskLevel)
                ? localSafetyCheck.riskLevel
                : finalRiskLevel;

            // 6. 如果需要關注，記錄安全標記
            if (needsAttention) {
                await logSafetyFlag(userId, userMessage, {
                    needsAttention: true,
                    riskLevel: combinedRiskLevel,
                    concerns: localSafetyCheck.concerns,
                    detectedTopics: localSafetyCheck.detectedTopics
                });
            }

            console.log(`[TreeHouse] Response generated. Risk: ${combinedRiskLevel}, Needs attention: ${needsAttention}`);

            // 7. 返回結果
            return {
                response: finalResponse,
                needsAttention,
                riskLevel: combinedRiskLevel,
                trustModeTriggered: needsAttention
            };

        } catch (error: any) {
            console.error("WhisperTree error:", error);

            // 安全 fallback
            throw new HttpsError(
                "internal",
                `處理訊息時發生錯誤: ${error.message || "系統忙碌中"}`
            );
        }
    }
);
