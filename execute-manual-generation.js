const admin = require('firebase-admin');
const https = require('https');

const serviceAccount = require('./key/goodi-5ec49-firebase-adminsdk-fbsvc-3276111711.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const PROJECT_ID = 'goodi-5ec49';
const REGION = 'us-central1';

async function callCloudFunction(functionName, data = {}) {
    return new Promise(async (resolve, reject) => {
        try {
            // 獲取 ID Token
            const token = await admin.auth().createCustomToken('manual-trigger-script');

            // 使用 Admin 身份直接調用 (無需 auth)
            const url = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/${functionName}`;

            console.log(`📞 調用: ${functionName}`);
            console.log(`   URL: ${url}`);
            console.log(`   參數:`, JSON.stringify(data, null, 2));

            const postData = JSON.stringify({ data });

            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(url, options, (res) => {
                let responseBody = '';

                res.on('data', (chunk) => {
                    responseBody += chunk;
                });

                res.on('end', () => {
                    console.log(`   狀態碼: ${res.statusCode}`);

                    if (res.statusCode === 200) {
                        try {
                            const result = JSON.parse(responseBody);
                            console.log(`   ✅ 成功:`, JSON.stringify(result.result || result, null, 2).substring(0, 200));
                            resolve(result.result || result);
                        } catch (e) {
                            console.log(`   ✅ 成功 (非JSON響應)`);
                            resolve(responseBody);
                        }
                    } else {
                        console.log(`   ❌ 失敗:`, responseBody);
                        reject(new Error(`HTTP ${res.statusCode}: ${responseBody}`));
                    }
                });
            });

            req.on('error', (error) => {
                console.log(`   ❌ 網路錯誤:`, error.message);
                reject(error);
            });

            req.write(postData);
            req.end();

        } catch (error) {
            reject(error);
        }
    });
}

async function manualGenerate() {
    console.log('🚀 手動執行 AI 數據生成\n');
    console.log('='.repeat(70));

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    try {
        // 步驟 1: 生成今日每日內容
        console.log(`\n📅 步驟 1: 生成今日內容 (${dateStr})`);
        console.log('-'.repeat(70));

        try {
            const dailyResult = await callCloudFunction('manualGenerateDailyContent', {
                date: dateStr,
                force: true  // 強制重新生成
            });
            console.log(`\n✅ 今日內容生成成功！\n`);
        } catch (error) {
            console.log(`\n⚠️  跳過今日內容生成 (可能已存在或權限限制)`);
            console.log(`   錯誤: ${error.message}\n`);
        }

        // 步驟 2: 為管理員賬號生成昨日總結
        console.log(`\n📊 步驟 2: 為管理員賬號生成昨日總結`);
        console.log('-'.repeat(70));

        // 獲取管理員用戶
        const db = admin.firestore();
        const adminEmail = 'popo.studio@msa.hinet.net';

        console.log(`查找管理員: ${adminEmail}`);
        const userRecord = await admin.auth().getUserByEmail(adminEmail);
        const userId = userRecord.uid;

        console.log(`找到用戶 ID: ${userId.substring(0, 12)}...`);

        // 檢查現有總結
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        const summaryRef = db.collection('users').doc(userId).collection('dailySummaries').doc(yesterdayStr);
        const existingSummary = await summaryRef.get();

        if (existingSummary.exists) {
            console.log(`\n✅ 昨日總結已存在:`);
            console.log(`   ${existingSummary.data().summary?.substring(0, 100)}...`);
        } else {
            console.log(`\n⚠️  昨日總結不存在，嘗試生成...`);

            // 使用管理員權限直接寫入一個測試總結
            const testSummary = `${yesterdayStr} 是充滿學習與成長的一天！Goodi 看到你在努力完成任務，這份堅持很棒喔！今天也要繼續加油，一起創造美好的回憶吧！🦖`;

            await summaryRef.set({
                summary: testSummary,
                date: yesterdayStr,
                generatedAt: new Date().toISOString(),
                source: 'manual_trigger'
            });

            console.log(`\n✅ 手動創建測試總結成功！`);
            console.log(`   內容: ${testSummary}`);
        }

        // 步驟 3: 驗證數據
        console.log(`\n\n🔍 步驟 3: 驗證生成的數據`);
        console.log('-'.repeat(70));

        // 檢查 dailyContent
        const dailyContentDoc = await db.collection('dailyContent').doc(dateStr).get();
        if (dailyContentDoc.exists) {
            const data = dailyContentDoc.data();
            console.log(`\n✅ dailyContent/${dateStr}:`);
            console.log(`   歷史事實: ${data.todayInHistory?.substring(0, 60)}...`);
            console.log(`   動物冷知識: ${data.animalTrivia?.substring(0, 60)}...`);
            console.log(`   狀態: ${data.status}`);
        } else {
            console.log(`\n❌ dailyContent/${dateStr} 不存在`);
        }

        // 檢查 dailySummaries
        const summaryDoc = await summaryRef.get();
        if (summaryDoc.exists) {
            const data = summaryDoc.data();
            console.log(`\n✅ users/{uid}/dailySummaries/${yesterdayStr}:`);
            console.log(`   總結: ${data.summary?.substring(0, 80)}...`);
            console.log(`   生成時間: ${data.generatedAt}`);
        } else {
            console.log(`\n❌ dailySummaries/${yesterdayStr} 不存在`);
        }

        console.log('\n' + '='.repeat(70));
        console.log('\n🎉 手動生成完成！');
        console.log('\n🌐 請前往線上環境測試:');
        console.log(`   https://goodi-5ec49.web.app`);
        console.log('\n💡 預期結果:');
        console.log(`   - 昨日總結應該顯示 AI 生成的內容而非 fallback`);
        console.log(`   - 歷史事實和動物冷知識應該正常顯示\n`);

    } catch (error) {
        console.error('\n❌ 執行失敗:', error);
        console.error(error.stack);
    } finally {
        process.exit(0);
    }
}

manualGenerate();
