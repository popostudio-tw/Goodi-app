import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore } from "firebase-admin/firestore";
import { callGemini, shouldUseFallback } from "./geminiWrapper";

/**
 * Cloud Function: createAiTask
 * 創建異步 AI 任務，返回 taskId 供前端輪詢或監聽
 */
export const createAiTask = onCall(
    {
        secrets: ["GEMINI_API_KEY"],
    },
    async (request) => {
        const { data, auth } = request;

        // 1. 驗證使用者是否登入
        if (!auth) {
            throw new HttpsError(
                "unauthenticated",
                "只有登入使用者才能創建 AI 任務。"
            );
        }

        const userId = auth.uid;
        const { prompt, source, model, config } = (data || {}) as {
            prompt?: string;
            source?: string;
            model?: string;
            config?: any;
        };

        // 2. 驗證輸入數據
        if (!prompt || typeof prompt !== "string") {
            throw new HttpsError(
                "invalid-argument",
                "缺少必要的 prompt 參數。"
            );
        }

        try {
            const db = getFirestore();

            // 3. 創建任務文檔
            const taskData = {
                userId,
                prompt,
                source: source || 'task',
                model: model || 'gemini-1.5-flash', // 預設使用較快速的模型
                config: config || {},
                status: 'pending',
                createdAt: new Date().toISOString(),
                result: null,
                error: null
            };

            const docRef = await db.collection('aiTasks').add(taskData);

            console.log(`[createAiTask] Created task ${docRef.id} for user ${userId}`);

            return { taskId: docRef.id };

        } catch (error: any) {
            console.error("[createAiTask] Error creating task:", error);
            throw new HttpsError(
                "internal",
                `創建任務時發生錯誤: ${error.message || "未知錯誤"}`
            );
        }
    }
);

/**
 * Firestore Trigger: processAiTask
 * 監聽 aiTasks/{taskId} 的創建事件，自動處理 AI 生成
 */
export const processAiTask = onDocumentCreated(
    {
        document: "aiTasks/{taskId}",
        secrets: ["GEMINI_API_KEY"],
        timeoutSeconds: 300, // 設置較長的超時時間以容納重試
    },
    async (event) => {
        const snapshot = event.data;
        if (!snapshot) {
            console.log("[processAiTask] No data associated with the event");
            return;
        }

        const taskId = event.params.taskId;
        const taskData = snapshot.data();

        // 檢查任務狀態，避免重複處理
        if (taskData.status !== 'pending') {
            console.log(`[processAiTask] Task ${taskId} is already ${taskData.status}, skipping.`);
            return;
        }

        console.log(`[processAiTask] Processing task ${taskId}...`);

        const db = getFirestore();
        const taskRef = db.collection('aiTasks').doc(taskId);

        try {
            // 更新狀態為 processing
            await taskRef.update({
                status: 'processing',
                processedAt: new Date().toISOString()
            });

            // 呼叫 Gemini API
            const result = await callGemini({
                source: (taskData.source as any) || 'task',
                userId: taskData.userId || 'system',
                prompt: taskData.prompt,
                model: taskData.model || 'gemini-1.5-flash',
                config: taskData.config
            });

            if (shouldUseFallback(result)) {
                // 如果失敗，標記為 failed
                throw new Error(result.error || "AI 生成失敗 (Fallback triggered)");
            }

            // 更新結果
            await taskRef.update({
                status: 'completed',
                result: result.text,
                completedAt: new Date().toISOString()
            });

            console.log(`[processAiTask] Task ${taskId} completed successfully.`);

        } catch (error: any) {
            console.error(`[processAiTask] Task ${taskId} failed:`, error);

            // 更新錯誤狀態
            await taskRef.update({
                status: 'failed',
                error: error.message || 'Unknown error',
                failedAt: new Date().toISOString()
            });
        }
    }
);
