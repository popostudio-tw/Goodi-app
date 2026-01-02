/**
 * 檢查用戶昨天的實際活動數據
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function checkYesterdayActivity() {
    const db = admin.firestore();

    // 找到小猴仔
    const usersSnapshot = await db.collection('users')
        .where('userProfile.nickname', '==', '小猴仔')
        .get();

    if (usersSnapshot.empty) {
        console.log('找不到小猴仔');
        process.exit(0);
        return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    console.log('用戶: 小猴仔');
    console.log(`User ID: ${userId}\n`);

    // 計算昨日範圍
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const startTime = new Date(yesterdayStr).getTime();
    const endTime = startTime + 24 * 60 * 60 * 1000;

    console.log(`檢查日期: ${yesterdayStr}`);
    console.log(`時間範圍: ${startTime} - ${endTime}\n`);

    // 檢查任務
    const yesterdayTasks = (userData.transactions || []).filter(t =>
        t.timestamp >= startTime && t.timestamp < endTime && t.description?.startsWith('完成任務')
    );

    console.log(`昨日完成任務: ${yesterdayTasks.length} 個`);
    if (yesterdayTasks.length > 0) {
        yesterdayTasks.forEach(t => {
            const date = new Date(t.timestamp);
            console.log(`  - ${t.description} (${date.toLocaleString()})`);
        });
    }

    // 檢查日誌
    const yesterdayJournals = (userData.journalEntries || []).filter(j =>
        j.author === 'user' && new Date(j.date).getTime() >= startTime && new Date(j.date).getTime() < endTime
    );

    console.log(`\n昨日日誌: ${yesterdayJournals.length} 筆`);
    if (yesterdayJournals.length > 0) {
        yesterdayJournals.forEach(j => {
            console.log(`  - ${j.text}`);
        });
    }

    // 檢查所有交易
    console.log(`\n所有交易 (最近 10 筆):`);
    const allTransactions = userData.transactions || [];
    allTransactions.slice(0, 10).forEach(t => {
        const date = new Date(t.timestamp);
        console.log(`  - ${t.description} (${date.toLocaleString()})`);
    });

    process.exit(0);
}

checkYesterdayActivity().catch(console.error);
