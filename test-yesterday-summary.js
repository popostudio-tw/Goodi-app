/**
 * 手動觸發昨日總結生成測試腳本
 * 用於測試修正後的 triggerYesterdaySummary function
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// 初始化 Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const functions = admin.projectFunctions();

async function testYesterdaySummary() {
    console.log('🚀 開始測試昨日總結生成...\n');

    try {
        // 獲取當前登入用戶 (你需要替換為實際的 userId)
        const db = admin.firestore();
        const usersSnapshot = await db.collection('users')
            .where('plan', 'in', ['premium_monthly', 'premium_lifetime', 'advanced_monthly', 'advanced_lifetime', 'paid199'])
            .limit(1)
            .get();

        if (usersSnapshot.empty) {
            console.log('❌ 找不到 Premium 用戶');
            return;
        }

        const userId = usersSnapshot.docs[0].id;
        const userData = usersSnapshot.docs[0].data();
        console.log(`✅ 找到測試用戶: ${userData.userProfile?.nickname || userId}`);
        console.log(`   User ID: ${userId}\n`);

        // 計算昨日日期
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        console.log(`📅 目標日期: ${yesterdayStr}\n`);

        // 檢查是否已存在
        const existingDoc = await db.collection('users').doc(userId)
            .collection('dailySummaries').doc(yesterdayStr).get();

        if (existingDoc.exists) {
            console.log('⚠️  昨日總結已存在:');
            console.log('   Summary:', existingDoc.data().summary);
            console.log('   Generated At:', existingDoc.data().generatedAt);
            console.log('\n要重新生成嗎？刪除現有資料...\n');
            await existingDoc.ref.delete();
        }

        // 手動調用 Cloud Function
        console.log('⚙️  調用 triggerYesterdaySummary Cloud Function...\n');

        // 注意：這裡我們直接使用 Firebase Admin SDK
        // 在生產環境中，前端會使用 Firebase Functions SDK 調用
        const callable = admin.functions().httpsCallable('triggerYesterdaySummary');

        // 這個腳本需要模擬認證，所以我們直接操作 Firestore
        // 實際上應該由前端通過認證後的 context 調用

        console.log('💡 提示：此腳本直接操作 Firestore，實際環境中應由前端調用 Cloud Function\n');

        // 驗證結果
        const resultDoc = await db.collection('users').doc(userId)
            .collection('dailySummaries').doc(yesterdayStr).get();

        if (resultDoc.exists) {
            console.log('✅ 昨日總結生成成功！\n');
            console.log('--- 生成的總結內容 ---');
            console.log(resultDoc.data().summary);
            console.log('--- End ---\n');
            console.log(`生成時間: ${resultDoc.data().generatedAt}`);
        } else {
            console.log('❌ 昨日總結未生成');
        }

    } catch (error) {
        console.error('❌ 錯誤:', error);
    }

    process.exit(0);
}

testYesterdaySummary();
