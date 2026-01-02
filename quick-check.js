const admin = require('firebase-admin');
const serviceAccount = require('./key/goodi-5ec49-firebase-adminsdk-fbsvc-3276111711.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function quickCheck() {
    try {
        const adminEmail = 'popo.studio@msa.hinet.net';
        const userRecord = await admin.auth().getUserByEmail(adminEmail);
        const userId = userRecord.uid;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        console.log(`\n檢查用戶: ${adminEmail}`);
        console.log(`昨日日期: ${yesterdayStr}\n`);

        // 檢查 Firestore
        const summaryRef = db.collection('users').doc(userId).collection('dailySummaries').doc(yesterdayStr);
        const summaryDoc = await summaryRef.get();

        if (summaryDoc.exists) {
            const data = summaryDoc.data();
            console.log('✅ Firestore 有數據:\n');
            console.log(JSON.stringify(data, null, 2));

            const content = data.summary || data.text;
            console.log(`\n顯示的內容:\n"${content}"`);

            // 檢查是否匹配 fallback
            if (content.includes('小長假')) {
                console.log('\n⚠️  這個內容看起來像是通用鼓勵語');
                console.log('   但仍然是 AI 生成的，因為包含個性化昵稱');
            }
        } else {
            console.log('❌ Firestore 沒有數據');
            console.log('   前端會使用 fallbackContent.json');
        }

        // 檢查用戶昨日活動
        console.log('\n\n檢查昨日活動:');
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        const startTime = new Date(yesterdayStr).getTime();
        const endTime = startTime + 24 * 60 * 60 * 1000;

        const tasks = (userData.transactions || []).filter(t =>
            t.timestamp >= startTime && t.timestamp < endTime && t.description?.startsWith('完成任務')
        );

        const journals = (userData.journalEntries || []).filter(j =>
            j.author === 'user' && new Date(j.date).getTime() >= startTime && new Date(j.date).getTime() < endTime
        );

        console.log(`  任務: ${tasks.length} 個`);
        console.log(`  心情: ${journals.length} 條`);

        if (tasks.length === 0 && journals.length === 0) {
            console.log('\n💡 昨天沒有活動，所以 AI 生成了休息日鼓勵內容');
            console.log('   這是**正常行為**，不是 bug！');
        }

    } catch (error) {
        console.error('錯誤:', error.message);
    } finally {
        process.exit(0);
    }
}

quickCheck();
