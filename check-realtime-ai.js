const admin = require('firebase-admin');
const serviceAccount = require('./key/goodi-5ec49-firebase-adminsdk-fbsvc-3276111711.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkRealtimeAI() {
    try {
        console.log('\n🔍 檢查實時 AI 功能狀態\n');
        console.log('='.repeat(70));

        // 1. 檢查 Circuit Breaker
        console.log('步驟 1: Circuit Breaker 狀態');
        console.log('-'.repeat(70));

        const cbDoc = await db.collection('systemStatus').doc('circuitBreaker').get();
        if (cbDoc.exists) {
            const cbData = cbDoc.data();
            const now = Date.now();
            const isOpen = cbData.openUntil && cbData.openUntil > now;

            if (isOpen) {
                console.log('🔴 Circuit Breaker: OPEN (熔斷中)');
                console.log(`   連續失敗: ${cbData.consecutiveFailures}`);
                console.log(`   重試時間: ${Math.ceil((cbData.openUntil - now) / 1000)} 秒`);
                console.log('\n⚠️  這會阻止所有 AI 調用！');
                console.log('需要重置 Circuit Breaker\n');
            } else {
                console.log('✅ Circuit Breaker: CLOSED (正常)');
            }
        } else {
            console.log('✅ Circuit Breaker: 未初始化 (正常)');
        }

        // 2. 檢查 API 使用量
        console.log('\n步驟 2: API 使用量');
        console.log('-'.repeat(70));

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const usageDoc = await db.collection('apiUsage').doc(`global_${todayStr}`).get();
        if (usageDoc.exists) {
            const usage = usageDoc.data();
            console.log(`今日總調用: ${usage.totalCalls || 0}`);
            console.log(`每分鐘計數: ${usage.lastMinuteCount || 0}`);

            if (usage.callsPerSource) {
                console.log('調用來源:');
                Object.entries(usage.callsPerSource).forEach(([source, count]) => {
                    console.log(`  ${source}: ${count}`);
                });
            }
        } else {
            console.log('今日無 API 調用記錄');
        }

        // 3. 檢查 Gemini API Key
        console.log('\n步驟 3: Gemini API Key');
        console.log('-'.repeat(70));
        console.log('Key 已配置: AIzaSyAWe3GH5fKH6MH0fkO99yH4a8TrTpw');
        console.log('（需在 Cloud Functions 環境中驗證有效性）');

        // 4. 建議
        console.log('\n' + '='.repeat(70));
        console.log('\n💡 診斷結論:\n');

        if (cbDoc.exists && cbData.openUntil > Date.now()) {
            console.log('❌ 主要問題: Circuit Breaker 熔斷');
            console.log('\n解決方案:');
            console.log('1. 刪除 systemStatus/circuitBreaker 文檔');
            console.log('2. 或等待自動恢復');
            console.log('3. 檢查為何頻繁失敗觸發熔斷\n');
        } else {
            console.log('可能原因:');
            console.log('1. Gemini API 密鑰失效');
            console.log('2. API 配額用盡');
            console.log('3. 網路連接問題');
            console.log('4. Cloud Functions 代碼錯誤\n');

            console.log('建議測試:');
            console.log('1. 在瀏覽器控制台查看具體錯誤訊息');
            console.log('2. 檢查 Cloud Functions 日誌');
            console.log('3. 手動調用 API 測試\n');
        }

    } catch (error) {
        console.error('錯誤:', error.message);
    } finally {
        process.exit(0);
    }
}

checkRealtimeAI();
