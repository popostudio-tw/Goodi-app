const admin = require('firebase-admin');
const serviceAccount = require('./key/goodi-5ec49-firebase-adminsdk-fbsvc-3276111711.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function directGenerate() {
    console.log('🚀 直接寫入測試數據到 Firestore\n');
    console.log('='.repeat(70));

    try {
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        console.log(`📅 今日: ${dateStr}`);
        console.log(`📅 昨日: ${yesterdayStr}\n`);

        // 步驟 1: 檢查並寫入今日內容
        console.log('步驟 1: 寫入今日內容');
        console.log('-'.repeat(70));

        const dailyContentRef = db.collection('dailyContent').doc(dateStr);
        const existingDaily = await dailyContentRef.get();

        if (existingDaily.exists && existingDaily.data().status === 'completed') {
            console.log('✅ 今日內容已存在，跳過');
        } else {
            const todayContent = {
                todayInHistory: `在2002年的今天，歐元紙幣與硬幣開始在12個歐盟國家正式流通，標誌著歐洲貨幣統一的重要里程碑。這是歷史上最大規模的貨幣轉換之一，影響了超過3億人的日常生活。`,
                animalTrivia: `藍鯨是地球上最大的動物，牠們的心臟就有一輛小汽車那麼大！藍鯨的叫聲可以傳播超過1000公里，是動物界中最響亮的聲音之一。雖然體型龐大，但藍鯨主要以小型磷蝦為食。`,
                generatedAt: new Date().toISOString(),
                status: 'completed',
                source: 'manual_test'
            };

            await dailyContentRef.set(todayContent);
            console.log('✅ 今日內容寫入成功');
        }

        // 步驟 2: 為管理員寫入昨日總結
        console.log('\n步驟 2: 寫入管理員昨日總結');
        console.log('-'.repeat(70));

        const adminEmail = 'popo.studio@msa.hinet.net';
        const userRecord = await admin.auth().getUserByEmail(adminEmail);
        const userId = userRecord.uid;

        console.log(`管理員 UID: ${userId.substring(0, 15)}...`);

        const summaryRef = db.collection('users').doc(userId).collection('dailySummaries').doc(yesterdayStr);
        const existingSummary = await summaryRef.get();

        if (existingSummary.exists) {
            console.log('✅ 昨日總結已存在');
            console.log(`   ${existingSummary.data().summary?.substring(0, 80)}...`);
        } else {
            const testSummary = `昨天是充滿學習與成長的一天！即使沒有完成所有任務，Goodi 也看到你在努力嘗試。休息是為了走更長遠的路，每一天都是新的開始。今天讓我們一起繼續前進，創造更多美好的回憶吧！🦖✨`;

            await summaryRef.set({
                summary: testSummary,
                date: yesterdayStr,
                generatedAt: new Date().toISOString(),
                source: 'manual_test'
            });

            console.log('✅ 昨日總結寫入成功');
            console.log(`   ${testSummary}`);
        }

        // 步驟 3: 驗證寫入
        console.log('\n步驟 3: 驗證數據');
        console.log('-'.repeat(70));

        const verifyDaily = await dailyContentRef.get();
        const verifySummary = await summaryRef.get();

        console.log(`\n📊 dailyContent/${dateStr}:`);
        if (verifyDaily.exists) {
            console.log(`   ✅ 存在`);
            console.log(`   歷史: ${verifyDaily.data().todayInHistory?.substring(0, 50)}...`);
            console.log(`   動物: ${verifyDaily.data().animalTrivia?.substring(0, 50)}...`);
        } else {
            console.log(`   ❌ 不存在`);
        }

        console.log(`\n📊 users/{uid}/dailySummaries/${yesterdayStr}:`);
        if (verifySummary.exists) {
            console.log(`   ✅ 存在`);
            console.log(`   總結: ${verifySummary.data().summary?.substring(0, 70)}...`);
        } else {
            console.log(`   ❌ 不存在`);
        }

        console.log('\n' + '='.repeat(70));
        console.log('\n🎉 測試數據生成完成！\n');
        console.log('🌐 現在可以前往線上環境測試:');
        console.log('   https://goodi-5ec49.web.app\n');
        console.log('💡 預期結果:');
        console.log('   - 昨日總結顯示測試總結內容');
        console.log('   - 歷史事實/動物冷知識正常顯示');
        console.log('   - 無 fallback 提示\n');

    } catch (error) {
        console.error('\n❌ 錯誤:', error.message);
        console.error(error.stack);
    } finally {
        process.exit(0);
    }
}

directGenerate();
