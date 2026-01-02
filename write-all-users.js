const admin = require('firebase-admin');
const serviceAccount = require('./key/goodi-5ec49-firebase-adminsdk-fbsvc-3276111711.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function writeToAll() {
    try {
        console.log('\n🎯 為所有用戶寫入明顯測試數據\n');

        // 獲取所有用戶
        const usersSnapshot = await db.collection('users').get();

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        console.log(`為 ${usersSnapshot.size} 個用戶寫入數據`);
        console.log(`昨日日期: ${yesterdayStr}\n`);

        let count = 0;
        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data();
            const nickname = userData.userProfile?.nickname || '小朋友';
            const email = userData.email || '未知';

            const testSummary = `✅【FIRESTORE數據讀取成功】${nickname}，現在時間是 ${new Date().toLocaleTimeString('zh-TW', { timeZone: 'Asia/Taipei' })}。如果你看到這段話，證明前端能夠正確從 Firestore 讀取數據！問題不在前端緩存或讀取邏輯。🦖`;

            const summaryRef = db.collection('users').doc(userId).collection('dailySummaries').doc(yesterdayStr);

            await summaryRef.set({
                summary: testSummary,
                date: yesterdayStr,
                generatedAt: new Date().toISOString(),
                source: 'final_test',
                testTimestamp: Date.now()
            });

            console.log(`${count + 1}. ${nickname} (${email.substring(0, 20)}...)`);
            count++;
        }

        console.log(`\n✅ 成功為 ${count} 個用戶寫入測試數據！`);
        console.log('\n請用任何賬號登錄 https://goodi-5ec49.web.app');
        console.log('按 Ctrl+Shift+R 刷新，應該看到 ✅【FIRESTORE數據讀取成功】\n');

    } catch (error) {
        console.error('錯誤:', error.message);
    } finally {
        process.exit(0);
    }
}

writeToAll();
