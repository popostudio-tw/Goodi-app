/**
 * 檢查 Firestore 中的昨日總結資料
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function checkYesterdaySummaries() {
    const db = admin.firestore();

    // 計算昨日日期
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    console.log(`檢查日期: ${yesterdayStr}\n`);

    // 獲取所有用戶
    const usersSnapshot = await db.collection('users').limit(5).get();

    console.log(`檢查前 5 個用戶的昨日總結...\n`);

    for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const nickname = userData.userProfile?.nickname || '未命名';

        const summaryDoc = await db.collection('users').doc(userId)
            .collection('dailySummaries').doc(yesterdayStr).get();

        console.log(`用戶: ${nickname} (${userId})`);

        if (summaryDoc.exists) {
            const data = summaryDoc.data();
            console.log(`  ✅ 有昨日總結`);
            console.log(`     欄位: ${Object.keys(data).join(', ')}`);

            // 檢查欄位名稱
            if (data.summary) {
                console.log(`     ✅ 使用 'summary' 欄位`);
                console.log(`     內容: ${data.summary.substring(0, 50)}...`);
            } else if (data.text) {
                console.log(`     ⚠️  使用 'text' 欄位 (需要修正!)`);
                console.log(`     內容: ${data.text.substring(0, 50)}...`);
            }
        } else {
            console.log(`  ❌ 沒有昨日總結`);
        }
        console.log('');
    }

    process.exit(0);
}

checkYesterdaySummaries().catch(console.error);
