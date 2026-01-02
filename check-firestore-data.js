const admin = require('firebase-admin');
const serviceAccount = require('./key/goodi-5ec49-firebase-adminsdk-fbsvc-3276111711.json');


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkData() {
    try {
        console.log('=== 檢查 Firestore 數據 ===\n');

        // 1. 檢查 dailyContent
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        console.log(`📅 檢查日期: ${dateStr}\n`);

        const dailyContentRef = db.collection('dailyContent').doc(dateStr);
        const dailyContentDoc = await dailyContentRef.get();

        if (dailyContentDoc.exists()) {
            console.log('✅  dailyContent exists:');
            console.log(JSON.stringify(dailyContentDoc.data(), null, 2));
        } else {
            console.log('❌ dailyContent NOT found for today');
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // 2. 檢查 users collection (取前 3筆)
        const usersSnapshot = await db.collection('users').limit(3).get();
        console.log(`👥 找到 ${usersSnapshot.size} 個用戶\n`);

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            console.log(`用戶 ID: ${userId.substring(0, 10)}...`);

            // 檢查昨日總結
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

            const summaryRef = db.collection('users').doc(userId).collection('dailySummaries').doc(yesterdayStr);
            const summaryDoc = await summaryRef.get();

            if (summaryDoc.exists()) {
                console.log(`  ✅ 昨日總結 (${yesterdayStr}):`);
                const data = summaryDoc.data();
                console.log(`     summary: ${data.summary ? data.summary.substring(0, 50) + '...' : 'N/A'}`);
                console.log(`     text: ${data.text ? data.text.substring(0, 50) + '...' : 'N/A'}`);
            } else {
                console.log(`  ❌ 無昨日總結 (${yesterdayStr})`);
            }

            console.log('');
        }

        console.log('='.repeat(50) + '\n');

        // 3. 檢查 apiUsage
        const todayUsageDoc = await db.collection('apiUsage').doc(`global_${dateStr}`).get();
        if (todayUsageDoc.exists()) {
            console.log('📊 API 使用情況:');
            console.log(JSON.stringify(todayUsageDoc.data(), null, 2));
        } else {
            console.log('ℹ️  今日尚無 API 調用記錄');
        }

        console.log('\n' + '='.repeat(50) + '\n');

        // 4. 檢查 Circuit Breaker 狀態
        const cbDoc = await db.collection('systemStatus').doc('circuitBreaker').get();
        if (cbDoc.exists()) {
            console.log('⚡ Circuit Breaker 狀態:');
            console.log(JSON.stringify(cbDoc.data(), null, 2));
        } else {
            console.log('ℹ️  Circuit Breaker 未初始化 (正常)');
        }

    } catch (error) {
        console.error('❌ 錯誤:', error);
    } finally {
        process.exit(0);
    }
}

checkData();
