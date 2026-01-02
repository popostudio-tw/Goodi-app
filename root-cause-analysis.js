const admin = require('firebase-admin');
const serviceAccount = require('./key/goodi-5ec49-firebase-adminsdk-fbsvc-3276111711.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function rootCauseAnalysis() {
    console.log('🔍 AI API 底層根本原因分析\n');
    console.log('='.repeat(80));

    try {
        const adminEmail = 'popo.studio@msa.hinet.net';
        const userRecord = await admin.auth().getUserByEmail(adminEmail);
        const userId = userRecord.uid;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        console.log(`\n📋 測試環境:`);
        console.log(`   用戶 Email: ${adminEmail}`);
        console.log(`   用戶 UID: ${userId}`);
        console.log(`   昨日日期: ${yesterdayStr}\n`);

        // 1. 檢查 Firestore 實際數據
        console.log('步驟 1: 檢查 Firestore 實際存儲的數據');
        console.log('-'.repeat(80));

        const summaryRef = db.collection('users').doc(userId).collection('dailySummaries').doc(yesterdayStr);
        const summaryDoc = await summaryRef.get();

        if (summaryDoc.exists) {
            const data = summaryDoc.data();
            console.log('✅ Firestore 數據存在');
            console.log('   完整數據結構:');
            console.log(JSON.stringify(data, null, 2));
            console.log(`\n   summary 欄位: ${data.summary ? '✅ 存在' : '❌ 不存在'}`);
            console.log(`   text 欄位: ${data.text ? '✅ 存在' : '❌ 不存在'}`);
            console.log(`   實際內容: "${data.summary || data.text || '無'}"`);
        } else {
            console.log('❌ Firestore 中沒有昨日總結數據');
            console.log('   這是為什麼前端會顯示 fallback 的原因！\n');
        }

        // 2. 測試直接調用 Cloud Function
        console.log('\n\n步驟 2: 測試直接調用 triggerYesterdaySummary');
        console.log('-'.repeat(80));

        const https = require('https');
        const PROJECT_ID = 'goodi-5ec49';
        const REGION = 'us-central1';

        // 獲取認證 token
        const token = await admin.auth().createCustomToken(userId);
        const userToken = await new Promise((resolve, reject) => {
            const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=AIzaSyAWe3GH5fKH6MH0fkO99yH4a8TrTpw`;
            const postData = JSON.stringify({ token, returnSecureToken: true });

            const req = https.request(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        resolve(result.idToken);
                    } catch (e) {
                        reject(e);
                    }
                });
            });
            req.on('error', reject);
            req.write(postData);
            req.end();
        });

        console.log('✅ 獲取用戶認證 token 成功');

        // 調用 Cloud Function
        const functionUrl = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/triggerYesterdaySummary`;
        console.log(`\n調用函數: ${functionUrl}`);

        const callResult = await new Promise((resolve, reject) => {
            const postData = JSON.stringify({ data: {} });
            const req = https.request(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Length': Buffer.byteLength(postData)
                }
            }, (res) => {
                let responseData = '';
                res.on('data', chunk => responseData += chunk);
                res.on('end', () => {
                    console.log(`   HTTP 狀態碼: ${res.statusCode}`);
                    console.log(`   響應數據:`);
                    try {
                        const parsed = JSON.parse(responseData);
                        console.log(JSON.stringify(parsed, null, 2));
                        resolve({ status: res.statusCode, data: parsed });
                    } catch (e) {
                        console.log(responseData);
                        resolve({ status: res.statusCode, data: responseData });
                    }
                });
            });
            req.on('error', (err) => {
                console.error(`   ❌ 調用失敗: ${err.message}`);
                reject(err);
            });
            req.write(postData);
            req.end();
        });

        // 3. 再次檢查 Firestore (看數據是否已生成)
        console.log('\n\n步驟 3: 驗證數據是否已寫入 Firestore');
        console.log('-'.repeat(80));

        await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒

        const verifyDoc = await summaryRef.get();
        if (verifyDoc.exists) {
            const data = verifyDoc.data();
            console.log('✅ Firestore 數據確認存在');
            console.log(`   summary: "${data.summary?.substring(0, 80)}..."`);
            console.log(`   生成時間: ${data.generatedAt}`);
        } else {
            console.log('❌ Firestore 仍然沒有數據！');
            console.log('   問題: Cloud Function 可能執行失敗或沒有寫入數據');
        }

        // 4. 檢查 Cloud Functions 日誌
        console.log('\n\n步驟 4: 檢查可能的問題根源');
        console.log('-'.repeat(80));

        // 檢查 Circuit Breaker
        const cbDoc = await db.collection('systemStatus').doc('circuitBreaker').get();
        if (cbDoc.exists) {
            const cbData = cbDoc.data();
            const now = Date.now();
            const isOpen = cbData.openUntil && cbData.openUntil > now;

            if (isOpen) {
                console.log('🔴 Circuit Breaker 狀態: OPEN (熔斷中)');
                console.log(`   連續失敗次數: ${cbData.consecutiveFailures}`);
                console.log(`   重試時間: ${Math.ceil((cbData.openUntil - now) / 1000)} 秒後`);
                console.log('\n⚠️  這會阻止 AI 調用！');
            } else {
                console.log('✅ Circuit Breaker 狀態: CLOSED (正常)');
            }
        }

        // 檢查 API 配額
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const usageDoc = await db.collection('apiUsage').doc(`global_${todayStr}`).get();

        if (usageDoc.exists) {
            const usage = usageDoc.data();
            console.log(`\n📊 今日 API 使用情況:`);
            console.log(`   總調用次數: ${usage.totalCalls || 0}`);
            console.log(`   每分鐘計數: ${usage.lastMinuteCount || 0}`);
            if (usage.callsPerSource) {
                console.log(`   調用來源分布:`);
                Object.entries(usage.callsPerSource).forEach(([source, count]) => {
                    console.log(`      ${source}: ${count}`);
                });
            }
        }

        // 5. 總結診斷
        console.log('\n\n' + '='.repeat(80));
        console.log('\n🎯 根本原因分析總結:\n');

        if (!summaryDoc.exists) {
            console.log('❌ 核心問題: Firestore 中沒有昨日總結數據\n');
            console.log('可能的根本原因:');
            console.log('1. 定時任務 (scheduledYesterdaySummaries) 未執行');
            console.log('2. 前端 lazy loading 未觸發或觸發失敗');
            console.log('3. Circuit Breaker 熔斷阻止了生成');
            console.log('4. Gemini API 配額用盡或密鑰失效');
            console.log('5. Cloud Function 執行失敗但未拋出明顯錯誤\n');

            console.log('建議排查步驟:');
            console.log('A. 檢查 Firebase Console > Functions > Logs');
            console.log('B. 手動運行一次 triggerYesterdaySummary (上方已執行)');
            console.log('C. 檢查 Gemini API 密鑰是否有效');
            console.log('D. 查看是否有網路或權限限制\n');
        } else {
            console.log('✅ Firestore 數據正常，前端應該能讀取\n');
            console.log('如果前端仍顯示 fallback:');
            console.log('1. 清除瀏覽器緩存 (Ctrl+Shift+R 硬刷新)');
            console.log('2. 檢查前端 Console 是否有 JavaScript 錯誤');
            console.log('3. 確認部署的版本是否是最新的\n');
        }

        console.log('查看 Cloud Functions 日誌:');
        console.log(`https://console.firebase.google.com/project/${PROJECT_ID}/functions/logs\n`);

    } catch (error) {
        console.error('\n❌ 底層檢查失敗:', error);
        console.error(error.stack);
    } finally {
        process.exit(0);
    }
}

rootCauseAnalysis();
