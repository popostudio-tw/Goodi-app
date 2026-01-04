/**
 * 調用 Cloud Function 生成真正的 AI 昨日總結
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function triggerAISummaries() {
    const db = admin.firestore();

    // 計算昨日日期
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    console.log(`為所有用戶調用 AI 生成昨日總結: ${yesterdayStr}\n`);

    // 獲取所有 Premium 用戶
    const usersSnapshot = await db.collection('users')
        .where('plan', 'in', ['premium_monthly', 'premium_lifetime', 'advanced_monthly', 'advanced_lifetime', 'paid199'])
        .get();

    console.log(`找到 ${usersSnapshot.size} 個 Premium 用戶\n`);

    if (usersSnapshot.empty) {
        console.log('找不到 Premium 用戶，改為所有用戶：');
        const allUsers = await db.collection('users').get();
        console.log(`找到 ${allUsers.size} 個用戶\n`);

        for (const userDoc of allUsers.docs) {
            await processUser(userDoc, yesterdayStr, db);
        }
    } else {
        for (const userDoc of usersSnapshot.docs) {
            await processUser(userDoc, yesterdayStr, db);
        }
    }

    console.log(`\n✅ 完成！請檢查 Firebase Console 的 Functions 日誌`);
    process.exit(0);
}

async function processUser(userDoc, yesterdayStr, db) {
    const userId = userDoc.id;
    const userData = userDoc.data();
    const nickname = userData.userProfile?.nickname || '未命名';

    try {
        // 刪除現有的總結（如果有）
        const existingDoc = await db.collection('users').doc(userId)
            .collection('dailySummaries').doc(yesterdayStr);

        await existingDoc.delete();
        console.log(`🗑️  刪除 ${nickname} 的舊總結`);

        // 直接調用 triggerYesterdaySummary 的邏輯
        console.log(`🤖 正在為 ${nickname} 生成 AI 總結...`);

        // 使用與 Cloud Function 相同的邏輯
        const summary = await generateYesterdaySummaryForUser(userId, userData, yesterdayStr);

        // 儲存
        await db.collection('users').doc(userId)
            .collection('dailySummaries').doc(yesterdayStr)
            .set({
                summary: summary,
                date: yesterdayStr,
                generatedAt: new Date().toISOString(),
            });

        console.log(`✅ ${nickname}: ${summary.substring(0, 60)}...\n`);

    } catch (err) {
        console.error(`❌ ${nickname} 錯誤:`, err.message);
    }
}

// 從 Cloud Function 複製的邏輯
async function generateYesterdaySummaryForUser(userId, userData, yesterdayStr) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('GEMINI_API_KEY not found in environment');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const nickname = userData.userProfile?.nickname || '小朋友';

    // 計算昨天的範圍
    const startTime = new Date(yesterdayStr).getTime();
    const endTime = startTime + 24 * 60 * 60 * 1000;

    const yesterdayTasks = (userData.transactions || []).filter(t =>
        t.timestamp >= startTime && t.timestamp < endTime && t.description?.startsWith('完成任務')
    );

    const yesterdayJournals = (userData.journalEntries || []).filter(j =>
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
- 提到的心事：${yesterdayJournals.map(j => j.text).join('; ') || '無'}

要求：
1. 語氣像好朋友在聊天，溫柔且充滿正能量。
2. 不要使用條列式，像一段溫暖的話語。
3. 具體提到孩子完成任務的努力。
4. 如果有提過心事，給予簡短的暖心回應。
5. 最後給一句充滿希望的結尾，鼓勵今天也開開心心！
`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        return text || `昨天你真的很棒喔！Goodi 有看到你的努力，今天也要一起加油！🦕`;
    } catch (error) {
        console.error(`Gemini API 錯誤:`, error);
        return `昨天你真的很棒喔！Goodi 永遠支持你！🦖`;
    }
}

triggerAISummaries().catch(console.error);
