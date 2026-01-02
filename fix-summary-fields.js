/**
 * 修正 Firestore 中昨日總結的欄位名稱
 * 將 'text' 欄位改為 'summary'
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function fixSummaryFieldNames() {
    const db = admin.firestore();

    console.log('🔧 開始修正昨日總結欄位名稱...\n');

    // 獲取所有用戶
    const usersSnapshot = await db.collection('users').get();

    console.log(`找到 ${usersSnapshot.size} 個用戶\n`);

    let fixedCount = 0;
    let checkedCount = 0;

    for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const nickname = userData.userProfile?.nickname || '未命名';

        // 獲取該用戶所有的 dailySummaries
        const summariesSnapshot = await db.collection('users').doc(userId)
            .collection('dailySummaries').get();

        if (summariesSnapshot.empty) continue;

        for (const summaryDoc of summariesSnapshot.docs) {
            checkedCount++;
            const data = summaryDoc.data();

            // 如果有 'text' 欄位但沒有 'summary' 欄位
            if (data.text && !data.summary) {
                console.log(`修正: ${nickname} - ${summaryDoc.id}`);

                // 更新文檔
                await summaryDoc.ref.update({
                    summary: data.text,
                    text: admin.firestore.FieldValue.delete() // 刪除舊欄位
                });

                fixedCount++;
            }
        }
    }

    console.log(`\n✅ 完成！`);
    console.log(`   檢查: ${checkedCount} 筆記錄`);
    console.log(`   修正: ${fixedCount} 筆記錄`);

    process.exit(0);
}

fixSummaryFieldNames().catch(console.error);
