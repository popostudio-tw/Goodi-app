const admin = require('firebase-admin');
const { getFunctions } = require('firebase-admin/functions');

const serviceAccount = require('./key/goodi-5ec49-firebase-adminsdk-fbsvc-3276111711.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function manualTrigger() {
    console.log('🚀 開始手動觸發 AI 數據生成\n');
    console.log('='.repeat(60));

    try {
        // 1. 生成今日每日內容 (歷史事實 + 動物冷知識)
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        console.log(`\n📅 步驟 1: 生成今日內容 (${dateStr})`);
        console.log('-'.repeat(60));

        // 檢查是否已存在
        const dailyContentRef = db.collection('dailyContent').doc(dateStr);
        const dailyContentDoc = await dailyContentRef.get();

        if (dailyContentDoc.exists && dailyContentDoc.data().status === 'completed') {
            console.log(`✅ 今日內容已存在，跳過生成`);
            console.log(`   歷史事實: ${dailyContentDoc.data().todayInHistory?.substring(0, 50)}...`);
            console.log(`   動物冷知識: ${dailyContentDoc.data().animalTrivia?.substring(0, 50)}...`);
        } else {
            console.log(`⚠️  今日內容不存在或未完成，需要手動調用 Cloud Function`);
            console.log(`   請在 Firebase Console 中調用: manualGenerateDailyContent`);
            console.log(`   參數: { "date": "${dateStr}", "force": false }`);
        }

        // 2. 為所有用戶生成昨日總結
        console.log(`\n📊 步驟 2: 為所有用戶生成昨日總結`);
        console.log('-'.repeat(60));

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        console.log(`昨日日期: ${yesterdayStr}\n`);

        // 獲取所有用戶 (限制前 5 個用於測試)
        const usersSnapshot = await db.collection('users').limit(5).get();
        console.log(`找到 ${usersSnapshot.size} 個用戶 (限制顯示前 5 個)\n`);

        let generatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data();
            const nickname = userData.userProfile?.nickname || '小朋友';

            console.log(`處理用戶: ${nickname} (${userId.substring(0, 8)}...)`);

            // 檢查是否已有昨日總結
            const summaryRef = db.collection('users').doc(userId).collection('dailySummaries').doc(yesterdayStr);
            const summaryDoc = await summaryRef.get();

            if (summaryDoc.exists) {
                console.log(`  ✅ 已存在昨日總結，跳過`);
                console.log(`     內容: ${summaryDoc.data().summary?.substring(0, 40)}...`);
                skippedCount++;
            } else {
                console.log(`  ⚠️  無昨日總結，需要調用 Cloud Function`);
                console.log(`     建議: 使用前端「家長模式」中的測試按鈕觸發`);
                console.log(`     或在 Firebase Console 調用: triggerYesterdaySummary (需登入為該用戶)`);
                generatedCount++;
            }
            console.log('');
        }

        console.log('='.repeat(60));
        console.log('\n📈 總結:');
        console.log(`  - 已存在總結: ${skippedCount} 個用戶`);
        console.log(`  - 需要生成: ${generatedCount} 個用戶`);
        console.log(`  - 發生錯誤: ${errorCount} 個用戶`);

        // 3. 檢查 API 使用量
        console.log(`\n💡 步驟 3: 檢查今日 API 使用量`);
        console.log('-'.repeat(60));

        const usageDoc = await db.collection('apiUsage').doc(`global_${dateStr}`).get();
        if (usageDoc.exists) {
            const data = usageDoc.data();
            console.log(`  總調用次數: ${data.totalCalls || 0}`);
            console.log(`  每分鐘計數: ${data.lastMinuteCount || 0}`);
            console.log(`  調用來源:`);
            if (data.callsPerSource) {
                Object.entries(data.callsPerSource).forEach(([source, count]) => {
                    console.log(`    - ${source}: ${count}`);
                });
            }
        } else {
            console.log(`  ℹ️  今日尚無 API 調用記錄`);
        }

        // 4. 檢查 Circuit Breaker 狀態
        console.log(`\n⚡ 步驟 4: 檢查 Circuit Breaker 狀態`);
        console.log('-'.repeat(60));

        const cbDoc = await db.collection('systemStatus').doc('circuitBreaker').get();
        if (cbDoc.exists) {
            const data = cbDoc.data();
            const now = Date.now();
            const isOpen = data.openUntil && data.openUntil > now;

            console.log(`  狀態: ${isOpen ? '🔴 OPEN (熔斷中)' : '🟢 CLOSED (正常)'}`);
            console.log(`  連續失敗次數: ${data.consecutiveFailures || 0}`);
            if (isOpen) {
                const waitTime = Math.ceil((data.openUntil - now) / 1000);
                console.log(`  重試時間: ${waitTime} 秒後`);
            }
        } else {
            console.log(`  ✅ Circuit Breaker 未初始化 (正常狀態)`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('\n🎯 下一步行動:');
        console.log('1. 在 Firebase Console 中手動調用以下 Cloud Functions:');
        console.log(`   - manualGenerateDailyContent({ "date": "${dateStr}", "force": false })`);
        console.log(`   - triggerYesterdaySummary() (需以用戶身份登入)`);
        console.log('\n2. 或使用前端「家長模式」的測試按鈕 (如已添加)');
        console.log('\n3. 等待 1-2 分鐘後刷新線上環境驗證\n');

    } catch (error) {
        console.error('\n❌ 執行過程中發生錯誤:', error);
        console.error(error.stack);
    } finally {
        process.exit(0);
    }
}

manualTrigger();
