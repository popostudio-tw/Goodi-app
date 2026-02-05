/**
 * Enhanced Weekly Report Generation (每週六 00:00)
 * 
 * 自動分析用戶一週數據並生成完整報告
 * - 任務達成率
 * - 情緒分析
 * - 學習成就
 * - 給家長的建議
 *
 * Optimization Update:
 * - Batched processing (3 users at a time) to respect rate limits
 * - Parallel data fetching for tasks and journals
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { callGemini } from "./geminiWrapper";

const db = getFirestore();
const BATCH_SIZE = 3; // Parallel Limit (tripled throughput vs sequential)

export const scheduledWeeklyReportsV2 = onSchedule(
    {
        schedule: "0 0 * * 6", // 每週六 00:00 (台灣時間需調整為 UTC)
        timeZone: "Asia/Taipei",
        timeoutSeconds: 540, // 9 分鐘
    },
    async (event) => {
        console.log("[WeeklyReport] Starting scheduled weekly reports generation (Optimized Batch Mode)");

        try {
            // 取得所有用戶
            const usersSnapshot = await db.collection("users").get();
            const now = new Date();

            // 計算本週範圍 (週一到週日)
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay() - 6); // 上週一
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6); // 上週日
            weekEnd.setHours(23, 59, 59, 999);

            // 生成 weekKey (格式: 2026-W01)
            const year = weekStart.getFullYear();
            const weekNumber = getWeekNumber(weekStart);
            const weekKey = `${year}-W${String(weekNumber).padStart(2, '0')}`;

            console.log(`[WeeklyReport] Processing week ${weekKey} (${weekStart.toISOString()} to ${weekEnd.toISOString()})`);

            // Chunk users for batch processing
            const userDocs = usersSnapshot.docs;
            const chunks = [];
            for (let i = 0; i < userDocs.length; i += BATCH_SIZE) {
                chunks.push(userDocs.slice(i, i + BATCH_SIZE));
            }

            console.log(`[WeeklyReport] Found ${userDocs.length} users. Processing in ${chunks.length} batches.`);

            let processedCount = 0;
            let errorCount = 0;

            for (const [index, chunk] of chunks.entries()) {
                console.log(`[WeeklyReport] Processing Batch ${index + 1}/${chunks.length}`);

                const results = await Promise.allSettled(chunk.map(userDoc =>
                    processUserReport(userDoc, weekStart, weekEnd, weekKey)
                ));

                results.forEach(result => {
                    if (result.status === 'fulfilled') {
                        if (result.value === 'skipped') {
                            // Skipped users (test accounts, etc) don't count as processed or error
                        } else {
                            processedCount++;
                        }
                    } else {
                        errorCount++;
                        console.error(`[WeeklyReport] Batch processing error:`, result.reason);
                    }
                });
            }

            console.log(`[WeeklyReport] Completed. Processed: ${processedCount}, Errors: ${errorCount}`);

        } catch (error: any) {
            console.error("[WeeklyReport] Global error:", error);
            throw error;
        }
    }
);

// Extracted User Processing Logic
async function processUserReport(
    userDoc: FirebaseFirestore.QueryDocumentSnapshot,
    weekStart: Date,
    weekEnd: Date,
    weekKey: string
): Promise<'processed' | 'skipped'> {
    const userId = userDoc.id;
    const userData = userDoc.data();

    // 跳過測試帳號或未啟用用戶
    if (userId.startsWith('test_') || !userData.displayName) {
        return 'skipped';
    }

    // === 1. 並行取得數據 (Optimization) ===
    // console.log(`[WeeklyReport] Processing user ${userId}`);

    const [tasksSnapshot, journalSnapshot] = await Promise.all([
        db.collection(`users/${userId}/tasks`)
            .where('date', '>=', weekStart.toISOString().split('T')[0])
            .where('date', '<=', weekEnd.toISOString().split('T')[0])
            .get(),

        db.collection(`users/${userId}/journalEntries`)
            .where('timestamp', '>=', weekStart.getTime())
            .where('timestamp', '<=', weekEnd.getTime())
            .get()
    ]);

    // === 2. 分析任務 ===
    let totalTasks = 0;
    let completedTasks = 0;
    let tokensEarned = 0;

    tasksSnapshot.forEach((doc) => {
        const task = doc.data();
        totalTasks++;
        if (task.completed) {
            completedTasks++;
            tokensEarned += task.points || 0;
        }
    });

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // === 3. 分析情緒 ===
    const emotions: { [key: string]: number } = {};
    let journalCount = 0;

    journalSnapshot.forEach((doc) => {
        const entry = doc.data();
        journalCount++;
        if (entry.emotion) {
            emotions[entry.emotion] = (emotions[entry.emotion] || 0) + 1;
        }
    });

    let dominantMood = 'neutral';
    let maxCount = 0;
    for (const [emotion, count] of Object.entries(emotions)) {
        if (count > maxCount) {
            dominantMood = emotion;
            maxCount = count;
        }
    }

    // === 4. 使用 AI 生成週報 ===
    const prompt = `你是 Goodi，正在為孩子生成一週成長報告。

**本週數據：**
- 任務完成率：${completionRate.toFixed(1)}%（完成 ${completedTasks}/${totalTasks} 項任務）
- 獲得代幣：${tokensEarned} 個
- 寫了 ${journalCount} 篇日記
- 主要情緒：${dominantMood}

**要求：**
請生成一份 JSON 格式的報告，包含以下欄位：

1. \`overview\`：用 80 字總結本週表現，語氣溫暖鼓勵
2. \`achievements\`：一個對象，包含：
   - \`tasksCompleted\`: ${completedTasks}
   - \`tokensEarned\`: ${tokensEarned}
   - \`streakDays\`: 連續完成天數（估算）
   - \`highlights\`: 陣列，列出 2-3 個亮點（如「完成率超過 80%」）
3. \`emotionalAnalysis\`: 對象，包含：
   - \`dominantMood\`: "${dominantMood}"
   - \`concerns\`: 陣列，可能的困擾點（如情緒低落、任務完成率低）
   - \`positives\`: 陣列，正面觀察（如情緒穩定、積極寫日記）
4. \`adviceForParents\`：給家長的建議，80-100 字，具體可行

**輸出純 JSON，不要任何其他文字。**`;

    const aiResult = await callGemini({
        source: 'weekly',
        userId,
        prompt,
        model: 'gemini-1.5-flash',
    });

    let reportData: any;

    if (aiResult.success && aiResult.text) {
        try {
            const jsonMatch = aiResult.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                reportData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in AI response');
            }
        } catch (parseError) {
            console.warn(`[WeeklyReport] Failed to parse AI response for ${userId}, using fallback`);
            reportData = createFallbackReport(completedTasks, totalTasks, tokensEarned, dominantMood);
        }
    } else {
        console.warn(`[WeeklyReport] AI call failed for ${userId}, using fallback`);
        reportData = createFallbackReport(completedTasks, totalTasks, tokensEarned, dominantMood);
    }

    // === 5. 儲存報告到 Firestore ===
    await db.doc(`users/${userId}/weeklyReports/${weekKey}`).set({
        ...reportData,
        weekKey,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        generatedAt: FieldValue.serverTimestamp(),
        generated: true,
    });

    console.log(`[WeeklyReport] ✓ Generated report for ${userId}`);
    return 'processed';
}

// Helper: 取得週數
function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Helper: 建立 fallback 報告
function createFallbackReport(
    completed: number,
    total: number,
    tokens: number,
    mood: string
): any {
    const rate = total > 0 ? (completed / total) * 100 : 0;

    return {
        overview: `本週完成了 ${completed} 項任務，獲得 ${tokens} 個代幣。繼續保持這樣的努力！`,
        achievements: {
            tasksCompleted: completed,
            tokensEarned: tokens,
            streakDays: Math.min(completed, 7),
            highlights: [
                rate >= 80 ? "完成率超過 80%！" : "持續在進步中",
                tokens > 0 ? `賺到了 ${tokens} 個代幣` : "開始累積成就"
            ]
        },
        emotionalAnalysis: {
            dominantMood: mood,
            concerns: rate < 50 ? ["任務完成率較低，可能需要調整難度"] : [],
            positives: ["願意持續參與", "保持學習動力"]
        },
        adviceForParents: "建議與孩子一起回顧本週的任務完成情況，給予鼓勵並討論是否需要調整任務難度。"
    };
}
