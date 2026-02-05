/**
 * Enhanced Daily Summary Pre-generation (每日凌晨)
 * 
 * 在凌晨自動生成昨日總結，實現前端「秒開」
 * - 分析昨日任務完成狀況（分類、成績、情緒）
 * - 以 Goodi 恐龍的個性生成鼓勵文字
 * - 存入 Firestore 供前端直接讀取
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { callGemini } from "./geminiWrapper";

const db = getFirestore();

/**
 * Goodi 恐龍風格 Fallback 語句庫（三組不同的溫馨回應）
 */
const GOODI_FALLBACK_MESSAGES = [
    (nickname: string, completedTasks: number, totalTasks: number) =>
        `吼吼～${nickname}！昨天完成了 ${completedTasks}/${totalTasks} 個任務，Goodi 的背鰭都亮起來了！今天也要一起加油喔！🦕✨`,
    (nickname: string, completedTasks: number, totalTasks: number) =>
        `嘎～Goodi 的恐龍雷達偵測到你昨天超認真的！完成了 ${completedTasks} 個任務，繼續保持，我們一起變得更厲害！💪🦖`,
    (nickname: string, completedTasks: number, totalTasks: number) =>
        `吼嗚！${nickname}～昨天的你讓 Goodi 的尾巴搖個不停！完成了 ${completedTasks} 個任務，今天也要開開心心地挑戰喔！❤️🦕`
];

export const scheduledDailySummariesV2 = onSchedule(
    {
        schedule: "0 1 * * *", // 每日 01:00 (台灣時間)
        timeZone: "Asia/Taipei",
        timeoutSeconds: 540, // 9 分鐘
    },
    async (event) => {
        console.log("[DailySummary] Starting scheduled daily summaries generation");

        try {
            // 取得所有用戶
            const usersSnapshot = await db.collection("users").get();

            // 計算昨日日期
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayDate = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

            console.log(`[DailySummary] Generating summaries for ${yesterdayDate}`);

            let processedCount = 0;
            let errorCount = 0;
            let skippedCount = 0;

            for (const userDoc of usersSnapshot.docs) {
                const userId = userDoc.id;
                const userData = userDoc.data();

                try {
                    // 跳過測試帳號或未啟用用戶
                    if (userId.startsWith('test_') || !userData.displayName) {
                        skippedCount++;
                        continue;
                    }

                    // === 1. 檢查是否已經生成過 ===
                    const existingSummary = await db
                        .doc(`users/${userId}/dailySummaries/${yesterdayDate}`)
                        .get();

                    if (existingSummary.exists && existingSummary.data()?.generated) {
                        console.log(`[DailySummary] Summary already exists for ${userId}, skipping`);
                        skippedCount++;
                        continue;
                    }

                    // === 2. 取得昨日任務數據（含分類統計）===
                    console.log(`[DailySummary] Processing user ${userId}`);

                    const tasksSnapshot = await db
                        .collection(`users/${userId}/tasks`)
                        .where('date', '==', yesterdayDate)
                        .get();

                    let totalTasks = 0;
                    let completedTasks = 0;
                    let totalPoints = 0;

                    // 分類統計
                    const categoryStats = {
                        life: { total: 0, completed: 0 },      // 生活
                        household: { total: 0, completed: 0 }, // 家務
                        study: { total: 0, completed: 0 }      // 學習
                    };

                    tasksSnapshot.forEach((doc) => {
                        const task = doc.data();
                        totalTasks++;

                        // 分類任務
                        const category = task.category?.toLowerCase() || 'life';
                        if (category in categoryStats) {
                            categoryStats[category as keyof typeof categoryStats].total++;
                            if (task.completed) {
                                categoryStats[category as keyof typeof categoryStats].completed++;
                            }
                        }

                        if (task.completed) {
                            completedTasks++;
                            totalPoints += task.points || 0;
                        }
                    });

                    // 如果昨天沒有任何任務，跳過
                    if (totalTasks === 0) {
                        console.log(`[DailySummary] No tasks for ${userId} on ${yesterdayDate}, skipping`);
                        skippedCount++;
                        continue;
                    }

                    const completionRate = (completedTasks / totalTasks) * 100;

                    // === 3. 分析特殊表現 ===
                    const specialAchievements: string[] = [];
                    if (categoryStats.household.total > 0 && categoryStats.household.completed === categoryStats.household.total) {
                        specialAchievements.push('家務全數完成');
                    }
                    if (categoryStats.study.total > 0 && categoryStats.study.completed === categoryStats.study.total) {
                        specialAchievements.push('學習任務全數完成');
                    }
                    if (categoryStats.life.total > 0 && categoryStats.life.completed === categoryStats.life.total) {
                        specialAchievements.push('生活任務全數完成');
                    }

                    // === 4. 取得成績對比（最近7天）===
                    const sevenDaysAgo = new Date(yesterday);
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                    const recentGradesSnapshot = await db
                        .collection(`users/${userId}/grades`)
                        .where('date', '>=', sevenDaysAgo.toISOString().split('T')[0])
                        .orderBy('date', 'desc')
                        .limit(10)
                        .get();

                    let gradesTrend = 'unknown';
                    let latestScore = 0;
                    let previousScore = 0;

                    if (recentGradesSnapshot.size >= 2) {
                        const grades = recentGradesSnapshot.docs.map(doc => doc.data().score || 0);
                        latestScore = grades[0];
                        previousScore = grades[1];

                        if (latestScore > previousScore) {
                            gradesTrend = 'improved';
                        } else if (latestScore < previousScore) {
                            gradesTrend = 'declined';
                        } else {
                            gradesTrend = 'stable';
                        }
                    }

                    // === 5. 取得樹洞情緒狀態 ===
                    const treeHoleSnapshot = await db
                        .collection(`users/${userId}/treeHole`)
                        .where('date', '==', yesterdayDate)
                        .limit(1)
                        .get();

                    let treeHoleEmotion = 'none';
                    if (!treeHoleSnapshot.empty) {
                        const treeHoleData = treeHoleSnapshot.docs[0].data();
                        treeHoleEmotion = treeHoleData.emotion || treeHoleData.sentiment || 'neutral';
                    }

                    // === 6. 取得日記（如果有）===
                    const journalSnapshot = await db
                        .collection(`users/${userId}/journalEntries`)
                        .where('date', '==', yesterdayDate)
                        .limit(1)
                        .get();

                    const hasJournal = !journalSnapshot.empty;

                    // === 7. 動態分析數據並生成 Goodi 恐龍的反應 ===

                    // 取得用戶暱稱
                    const nickname = userData.userProfile?.nickname || userData.displayName || '小朋友';

                    // 計算鼓勵層級
                    let encouragementLevel = 'normal';
                    let danceMove = '';

                    if (completionRate >= 90) {
                        encouragementLevel = 'super';
                        danceMove = 'Goodi 高興得跳起了恐龍舞';
                    } else if (completionRate >= 70) {
                        encouragementLevel = 'great';
                        danceMove = 'Goodi 的尾巴搖個不停';
                    } else if (completionRate >= 50) {
                        encouragementLevel = 'good';
                        danceMove = 'Goodi 的背鰭都亮起來了';
                    } else {
                        encouragementLevel = 'warm';
                        danceMove = 'Goodi 給你一個大大的恐龍擁抱';
                    }

                    // 特殊成就描述
                    let specialPraise = '';
                    if (specialAchievements.length >= 2) {
                        specialPraise = `你是 Goodi 的超人恐龍夥伴！${specialAchievements.join('、')}都做到了！`;
                    } else if (specialAchievements.length === 1) {
                        specialPraise = `${specialAchievements[0]}，這真的太厲害了！`;
                    }

                    // 成績反應
                    let gradeReaction = '';
                    if (gradesTrend === 'improved') {
                        gradeReaction = 'Goodi 高興得跳恐龍舞！你的成績進步了！';
                    } else if (gradesTrend === 'declined') {
                        gradeReaction = 'Goodi 陪你一起把不會的題目變成會的！';
                    }

                    // 情緒關懷
                    let emotionCare = '';
                    if (treeHoleEmotion !== 'none') {
                        emotionCare = `Goodi 感受到你的心情，要記得 Goodi 永遠在這裡陪著你喔！`;
                    }

                    const prompt = `你是「Goodi 恐龍」，一隻活潑、親切、充滿活力的 AI 恐龍，是 ${nickname} 最好的朋友！

**你的語氣特色**：
- 說話要有恐龍的可愛感，多用擬聲詞：「吼吼～」「嘎～」「吼嗚！」「嘎嗚」
- 像好朋友一樣聊天，溫暖且充滿正能量
- 不要使用條列式，要像一段有溫度的對話
- 適合 5-12 歲的孩子理解

**昨日數據**：
- 完成任務：${completedTasks}/${totalTasks} 項（${completionRate.toFixed(0)}%）
- 獲得代幣：${totalPoints}
- 生活任務：${categoryStats.life.completed}/${categoryStats.life.total}
- 家務任務：${categoryStats.household.completed}/${categoryStats.household.total}
- 學習任務：${categoryStats.study.completed}/${categoryStats.study.total}
${specialAchievements.length > 0 ? `- 🌟 特殊表現：${specialAchievements.join('、')}` : ''}
${gradesTrend !== 'unknown' ? `- 成績趨勢：${gradesTrend === 'improved' ? '進步' : gradesTrend === 'declined' ? '退步' : '持平'}（${previousScore}→${latestScore}）` : ''}
${treeHoleEmotion !== 'none' ? `- 樹洞情緒：${treeHoleEmotion}` : ''}

**鼓勵層級**：${encouragementLevel}
- 開場方式：${encouragementLevel === 'super' ? '用「吼吼吼！」超激動開場' : encouragementLevel === 'great' ? '用「吼嗚！」興奮開場' : encouragementLevel === 'good' ? '用「吼吼～」開心開場' : '用「嘎～」溫暖開場'}
- Goodi 的反應：${danceMove}

**動態內容要求**（總共 60-80 字）：
1. **開場擬聲詞**：用適合層級的恐龍聲音（吼吼/嘎/吼嗚）+ ${nickname}
2. **任務誇獎**：具體提到完成了 ${completedTasks} 個任務，${danceMove}
3. **特殊表現**：${specialPraise || '鼓勵繼續努力'}
4. **成績建議**：${gradeReaction || (gradesTrend !== 'unknown' ? '繼續保持！' : '')}
5. **情緒關懷**：${emotionCare || '給予溫暖支持'}
6. **結尾**：充滿希望，鼓勵今天也要開開心心！

**恐龍視角範例**：
- 好的範例：「吼吼～${nickname}！昨天完成了 ${completedTasks} 個任務，${danceMove}，真的太棒了！」
- 避免：「你昨天完成了任務，表現很好。」（太正式、沒有恐龍感）

**語氣要求**：
- 溫暖、鼓勵、正向
- 充滿 Goodi 恐龍的活力
- 具體且有溫度

**僅輸出總結文字，不要標題或分號或其他格式。**`;

                    const aiResult = await callGemini({
                        source: 'summary',
                        userId,
                        prompt,
                        model: 'gemini-1.5-flash',
                        config: {
                            temperature: 0.9, // 提高創意度
                        }
                    });

                    let summaryText: string;

                    if (aiResult.success && aiResult.text) {
                        summaryText = aiResult.text.trim();
                    } else {
                        // Fallback：隨機選擇一個恐龍風格訊息
                        const randomIndex = Math.floor(Math.random() * GOODI_FALLBACK_MESSAGES.length);
                        summaryText = GOODI_FALLBACK_MESSAGES[randomIndex](nickname, completedTasks, totalTasks);
                    }

                    // === 8. 儲存總結到 Firestore ===
                    await db.doc(`users/${userId}/dailySummaries/${yesterdayDate}`).set({
                        summary: summaryText,
                        date: yesterdayDate,
                        completionRate: completionRate,
                        tasksCompleted: completedTasks,
                        totalTasks: totalTasks,
                        pointsEarned: totalPoints,
                        categoryStats: categoryStats,
                        specialAchievements: specialAchievements,
                        gradesTrend: gradesTrend,
                        latestScore: latestScore,
                        previousScore: previousScore,
                        treeHoleEmotion: treeHoleEmotion,
                        hasJournal: hasJournal,
                        generatedAt: FieldValue.serverTimestamp(),
                        generated: true,
                    });

                    processedCount++;
                    console.log(`[DailySummary] ✓ Generated summary for ${userId}: "${summaryText.substring(0, 40)}..."`);

                } catch (userError: any) {
                    errorCount++;
                    console.error(`[DailySummary] Error processing user ${userId}:`, userError);
                }
            }

            console.log(`[DailySummary] Completed. Processed: ${processedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);

        } catch (error: any) {
            console.error("[DailySummary] Global error:", error);
            throw error;
        }
    }
);

