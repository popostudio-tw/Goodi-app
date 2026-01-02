const admin = require('firebase-admin');
const serviceAccount = require('./key/goodi-5ec49-firebase-adminsdk-fbsvc-3276111711.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkParentMode() {
    try {
        console.log('\n🔍 檢查家長模式 AI 功能\n');
        console.log('='.repeat(70));

        const usersSnapshot = await db.collection('users').limit(3).get();

        console.log(`檢查 ${usersSnapshot.size} 個用戶的週報數據\n`);

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data();
            const nickname = userData.userProfile?.nickname || '未知';
            const plan = userData.plan || 'free';

            console.log(`用戶: ${nickname}`);
            console.log(`  方案: ${plan}`);

            // 檢查週報
            const weeklyReports = await db.collection('users')
                .doc(userId)
                .collection('weeklyReports')
                .orderBy('generatedAt', 'desc')
                .limit(3)
                .get();

            if (weeklyReports.empty) {
                console.log(`  ❌ 沒有週報數據`);
            } else {
                console.log(`  ✅ 有 ${weeklyReports.size} 份週報`);
                weeklyReports.docs.forEach(doc => {
                    const data = doc.data();
                    console.log(`     - ${doc.id}: ${data.generatedAt}`);
                });
            }
            console.log('');
        }

        console.log('='.repeat(70));
        console.log('\n結論:');
        console.log('如果週報數據為空，家長模式的 AI 功能也會顯示為「沒有可用功能」');
        console.log('這和昨日總結是同樣的問題 - 定時任務沒有生成數據\n');

    } catch (error) {
        console.error('錯誤:', error.message);
    } finally {
        process.exit(0);
    }
}

checkParentMode();
