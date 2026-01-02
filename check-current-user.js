/**
 * 檢查當前用戶的昨日總結
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function checkCurrentUser() {
    const db = admin.firestore();

    // 計算昨日日期
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    console.log(`今天: ${new Date().toISOString().split('T')[0]}`);
    console.log(`昨天: ${yesterdayStr}\n`);

    // 找到 admin email 的用戶
    const usersSnapshot = await db.collection('users')
        .where('email', '==', 'popo.studio@msa.hinet.net')
        .get();

    if (usersSnapshot.empty) {
        console.log('❌ 找不到用戶 popo.studio@msa.hinet.net');

        // 列出所有用戶
        const allUsers = await db.collection('users').limit(10).get();
        console.log('\n前 10 個用戶:');
        allUsers.forEach(doc => {
            const data = doc.data();
            console.log(`  - ${data.userProfile?.nickname || '未命名'} (${data.email || 'no email'})`);
        });

        process.exit(0);
        return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    console.log(`用戶: ${userData.userProfile?.nickname || '未命名'}`);
    console.log(`Email: ${userData.email}`);
    console.log(`Plan: ${userData.plan}`);
    console.log(`User ID: ${userId}\n`);

    // 檢查昨日總結
    const summaryDoc = await db.collection('users').doc(userId)
        .collection('dailySummaries').doc(yesterdayStr).get();

    if (summaryDoc.exists) {
        const data = summaryDoc.data();
        console.log('✅ 有昨日總結');
        console.log(`欄位: ${Object.keys(data).join(', ')}`);
        console.log(`\n內容 (summary): ${data.summary || '(空)'}`);
        console.log(`內容 (text): ${data.text || '(空)'}`);
        console.log(`\n生成時間: ${data.generatedAt}`);
    } else {
        console.log('❌ 沒有昨日總結');
        console.log('\n檢查過去 7 天的總結:');

        for (let i = 1; i <= 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const doc = await db.collection('users').doc(userId)
                .collection('dailySummaries').doc(dateStr).get();

            console.log(`  ${dateStr}: ${doc.exists ? '✅' : '❌'}`);
        }
    }

    // 檢查用戶的昨日活動
    console.log('\n--- 昨日活動數據 ---');
    const startTime = new Date(yesterdayStr).getTime();
    const endTime = startTime + 24 * 60 * 60 * 1000;

    const yesterdayTasks = (userData.transactions || []).filter(t =>
        t.timestamp >= startTime && t.timestamp < endTime && t.description?.startsWith('完成任務')
    );

    console.log(`完成任務: ${yesterdayTasks.length} 個`);

    process.exit(0);
}

checkCurrentUser().catch(console.error);
