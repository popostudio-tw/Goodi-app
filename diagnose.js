const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function diagnose() {
    try {
        console.log('\n🔍 AI API 根本原因診斷\n');
        console.log('='.repeat(70));

        // 獲取所有用戶（限制5個）
        const usersSnapshot = await db.collection('users').limit(5).get();
        console.log(`\n找到 ${usersSnapshot.size} 個用戶\n`);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        console.log(`昨日日期: ${yesterdayStr}\n`);

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data();
            const email = userData.email || '未知';
            const nickname = userData.userProfile?.nickname || '未知';

            console.log(`\n用戶: ${nickname} (${email.substring(0, 20)}...)`);
            console.log(`UID: ${userId.substring(0, 15)}...`);

            // 檢查昨日總結
            const summaryRef = db.collection('users').doc(userId).collection('dailySummaries').doc(yesterdayStr);
            const summaryDoc = await summaryRef.get();

            if (summaryDoc.exists) {
                const data = summaryDoc.data();
                console.log(`  ✅ 有昨日總結`);
                console.log(`     內容: "${data.summary?.substring(0, 60)}..."`);
                console.log(`     生成時間: ${data.generatedAt}`);
                console.log(`     來源: ${data.source || '未標記'}`);

                // 檢查活動
                const startTime = new Date(yesterdayStr).getTime();
                const endTime = startTime + 24 * 60 * 60 * 1000;

                const tasks = (userData.transactions || []).filter(t =>
                    t.timestamp >= startTime && t.timestamp < endTime && t.description?.startsWith('完成任務')
                );

                const journals = (userData.journalEntries || []).filter(j =>
                    j.author === 'user' && new Date(j.date).getTime() >= startTime && new Date(j.date).getTime() < endTime
                );

                console.log(`     昨日任務: ${tasks.length} 個`);
                console.log(`     昨日心情記錄: ${journals.length} 條`);
                if (journals.length > 0) {
                    journals.forEach(j => {
                        console.log(`        - "${j.text?.substring(0, 40)}..."`);
                    });
                }

            } else {
                console.log(`  ❌ 沒有昨日總結`);
            }
        }

        // 檢查 Circuit Breaker
        console.log('\n\n' + '='.repeat(70));
        console.log('\n檢查系統狀態:');

        const cbDoc = await db.collection('systemStatus').doc('circuitBreaker').get();
        if (cbDoc.exists) {
            const cbData = cbDoc.data();
            const now = Date.now();
            const isOpen = cbData.openUntil && cbData.openUntil > now;

            console.log(`\nCircuit Breaker: ${isOpen ? '🔴 OPEN (熔斷中)' : '🟢 CLOSED'}`);
            if (isOpen) {
                console.log(`  失敗次數: ${cbData.consecutiveFailures}`);
                console.log(`  重試時間: ${Math.ceil((cbData.openUntil - now) / 1000)} 秒後`);
            }
        } else {
            console.log('\nCircuit Breaker: ✅ 未觸發');
        }

        // 檢查 API 使用量
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const usageDoc = await db.collection('apiUsage').doc(`global_${todayStr}`).get();

        console.log('\nAPI 使用量:');
        if (usageDoc.exists) {
            const usage = usageDoc.data();
            console.log(`  總調用: ${usage.totalCalls || 0}`);
            console.log(`  每分鐘: ${usage.lastMinuteCount || 0}`);
            if (usage.callsPerSource) {
                console.log(`  調用來源:`);
                Object.entries(usage.callsPerSource).forEach(([source, count]) => {
                    console.log(`    ${source}: ${count}`);
                });
            }
        } else {
            console.log('  今日無調用記錄');
        }

        console.log('\n' + '='.repeat(70));
        console.log('\n💡 診斷結論:\n');
        console.log('檢查以上輸出，看看是否:');
        console.log('1. Firestore 有數據但前端讀不到 → 前端問題');
        console.log('2. Firestore 沒數據 → 後端生成問題');
        console.log('3. Circuit Breaker 熔斷 → API 調用被阻止');
        console.log('4. 數據是通用內容 → 用戶昨日無活動\n');

    } catch (error) {
        console.error('\n❌ 錯誤:', error.message);
        console.error(error.stack);
    } finally {
        process.exit(0);
    }
}

diagnose();
