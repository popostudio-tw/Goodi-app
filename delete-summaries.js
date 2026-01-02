/**
 * 刪除所有用戶的昨日總結，讓系統重新生成 AI 版本
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function deleteSummaries() {
    const db = admin.firestore();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    console.log(`刪除所有用戶的昨日總結: ${yesterdayStr}\n`);

    const usersSnapshot = await db.collection('users').get();

    let count = 0;

    for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const nickname = userData.userProfile?.nickname || '未命名';

        const summaryRef = db.collection('users').doc(userId)
            .collection('dailySummaries').doc(yesterdayStr);

        const exists = await summaryRef.get();

        if (exists.exists) {
            await summaryRef.delete();
            console.log(`🗑️  已刪除 ${nickname} 的昨日總結`);
            count++;
        }
    }

    console.log(`\n✅ 完成！已刪除 ${count} 筆昨日總結`);
    console.log(`現在重新整理 Goodi App，系統會自動生成 AI 總結`);
    process.exit(0);
}

deleteSummaries().catch(console.error);
