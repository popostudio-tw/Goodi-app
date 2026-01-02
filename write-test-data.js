const admin = require('firebase-admin');
const serviceAccount = require('./key/goodi-5ec49-firebase-adminsdk-fbsvc-3276111711.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function writeTestData() {
    try {
        console.log('\n🧪 寫入測試數據到 Firestore\n');
        console.log('='.repeat(70));

        // 獲取所有用戶（限制前3個）
        const usersSnapshot = await db.collection('users').limit(3).get();

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        console.log(`昨日日期: ${yesterdayStr}\n`);

        let count = 0;
        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data();
            const nickname = userData.userProfile?.nickname || '小朋友';
            const email = userData.email || '未知';

            console.log(`\n處理用戶: ${nickname}`);
            console.log(`  Email: ${email.substring(0, 25)}...`);
            console.log(`  UID: ${userId.substring(0, 20)}...`);

            // 寫入明顯的測試數據
            const testSummary = `🧪【測試成功！】${nickname}，這是 ${new Date().toLocaleTimeString('zh-TW')} 直接寫入 Firestore 的測試數據。如果你看到這段話，代表前端可以正確讀取 Firestore 數據！昨天是 ${yesterdayStr}，今天讓我們一起驗證 AI 功能是否正常運作吧！🦖✨`;

            const summaryRef = db.collection('users').doc(userId).collection('dailySummaries').doc(yesterdayStr);

            await summaryRef.set({
                summary: testSummary,
                date: yesterdayStr,
                generatedAt: new Date().toISOString(),
                source: 'manual_test',
                testId: Date.now()
            });

            console.log(`  ✅ 已寫入測試數據`);
            console.log(`  內容: "${testSummary.substring(0, 60)}..."`);

            count++;
        }

        console.log('\n' + '='.repeat(70));
        console.log(`\n✅ 成功為 ${count} 個用戶寫入測試數據！\n`);
        console.log('📋 下一步操作:');
        console.log('1. 打開瀏覽器到 https://goodi-5ec49.web.app');
        console.log('2. 按 Ctrl+Shift+R 硬刷新（清除緩存）');
        console.log('3. 查看「昨日總結」widget');
        console.log('4. 如果看到 🧪【測試成功！】→ 前端讀取正常');
        console.log('5. 如果還是看到舊內容 → 前端有緩存或讀取問題\n');

    } catch (error) {
        console.error('\n❌ 錯誤:', error.message);
        console.error(error.stack);
    } finally {
        process.exit(0);
    }
}

writeTestData();
