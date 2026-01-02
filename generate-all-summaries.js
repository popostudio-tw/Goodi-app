/**
 * 手動為所有用戶生成昨日總結
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// 模擬 generateYesterdaySummaryForUser 函數
async function generateSummaryForUser(userId, userData, yesterdayStr) {
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

    // 簡單的總結生成邏輯（不調用 AI）
    if (yesterdayTasks.length === 0 && yesterdayJournals.length === 0) {
        return `昨天 ${nickname} 給自己放了一個小長假呢！休息是為了走更長遠的路，今天 Goodi 陪你一起重新出發吧！🦖`;
    }

    return `${nickname}，昨天你完成了 ${yesterdayTasks.length} 個任務，真的很棒！Goodi 看到了你的努力，繼續保持這份熱情，今天也要開開心心喔！🦕`;
}

async function generateAllSummaries() {
    const db = admin.firestore();

    // 計算昨日日期
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    console.log(`為所有用戶生成昨日總結: ${yesterdayStr}\n`);

    // 獲取所有用戶
    const usersSnapshot = await db.collection('users').get();

    console.log(`找到 ${usersSnapshot.size} 個用戶\n`);

    let count = 0;

    for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const nickname = userData.userProfile?.nickname || '未命名';

        try {
            // 檢查是否已存在
            const existingDoc = await db.collection('users').doc(userId)
                .collection('dailySummaries').doc(yesterdayStr).get();

            if (existingDoc.exists) {
                console.log(`⏭️  跳過 ${nickname} (已有總結)`);
                continue;
            }

            // 生成總結
            const summary = await generateSummaryForUser(userId, userData, yesterdayStr);

            // 儲存到 Firestore
            await db.collection('users').doc(userId)
                .collection('dailySummaries').doc(yesterdayStr)
                .set({
                    summary: summary,
                    date: yesterdayStr,
                    generatedAt: new Date().toISOString(),
                });

            console.log(`✅ 生成 ${nickname} 的昨日總結`);
            console.log(`   ${summary.substring(0, 50)}...\n`);

            count++;

        } catch (err) {
            console.error(`❌ 錯誤 ${nickname}:`, err.message);
        }
    }

    console.log(`\n✅ 完成！成功生成 ${count} 筆昨日總結`);
    process.exit(0);
}

generateAllSummaries().catch(console.error);
