const admin = require('firebase-admin');
const serviceAccount = require('./key/goodi-5ec49-firebase-adminsdk-fbsvc-3276111711.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function verifyData() {
    try {
        console.log('\n🔍 驗證 Firestore 數據是否真的寫入\n');

        const usersSnapshot = await db.collection('users').limit(3).get();

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        console.log(`昨日日期: ${yesterdayStr}\n`);

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data();
            const nickname = userData.userProfile?.nickname || '未知';

            const summaryRef = db.collection('users').doc(userId).collection('dailySummaries').doc(yesterdayStr);
            const summaryDoc = await summaryRef.get();

            console.log(`用戶: ${nickname}`);
            console.log(`UID: ${userId}`);

            if (summaryDoc.exists) {
                const data = summaryDoc.data();
                console.log(`✅ Firestore 有數據:`);
                console.log(`   summary: "${data.summary?.substring(0, 80)}"`);
                console.log(`   source: ${data.source}`);
                console.log(`   testId: ${data.testId || '無'}`);

                if (data.summary?.includes('🧪')) {
                    console.log(`   ✅ 這是測試數據！`);
                } else if (data.summary?.includes('小長假')) {
                    console.log(`   ⚠️  這是舊數據！`);
                }
            } else {
                console.log(`❌ 無數據`);
            }
            console.log('');
        }

        console.log('\n結論:');
        console.log('如果上面顯示測試數據存在，但前端還是顯示舊內容，');
        console.log('那問題100%在前端：');
        console.log('1. localStorage 緩存');
        console.log('2. Firestore listener 沒有正確訂閱');
        console.log('3. 用戶UID不匹配\n');

    } catch (error) {
        console.error('錯誤:', error.message);
    } finally {
        process.exit(0);
    }
}

verifyData();
