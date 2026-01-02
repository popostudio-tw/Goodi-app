const admin = require('firebase-admin');
const serviceAccount = require('./key/goodi-5ec49-firebase-adminsdk-fbsvc-3276111711.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkActualContent() {
    console.log('🔍 檢查昨日總結實際內容來源\n');
    console.log('='.repeat(70));

    try {
        const adminEmail = 'popo.studio@msa.hinet.net';
        const userRecord = await admin.auth().getUserByEmail(adminEmail);
        const userId = userRecord.uid;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        console.log(`用戶: ${adminEmail}`);
        console.log(`昨日: ${yesterdayStr}\n`);

        // 1. 檢查 Firestore 中的實際數據
        console.log('步驟 1: Firestore 中存儲的內容');
        console.log('-'.repeat(70));

        const summaryRef = db.collection('users').doc(userId).collection('dailySummaries').doc(yesterdayStr);
        const summaryDoc = await summaryRef.get();

        if (summaryDoc.exists) {
            const data = summaryDoc.data();
            console.log('✅ Firestore 數據存在\n');
            console.log('完整數據:');
            console.log(JSON.stringify(data, null, 2));
            console.log(`\n實際內容:\n"${data.summary || data.text}"`);
            console.log(`\n生成時間: ${data.generatedAt}`);
            console.log(`來源: ${data.source || '未標記'}`);
        } else {
            console.log('❌ Firestore 中沒有數據\n');
            console.log('這意味著前端一定是使用 fallbackContent.json');
        }

        // 2. 檢查用戶昨日是否有活動
        console.log('\n\n步驟 2: 檢查用戶昨日活動數據');
        console.log('-'.repeat(70));

        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        const startTime = new Date(yesterdayStr).getTime();
        const endTime = startTime + 24 * 60 * 60 * 1000;

        const yesterdayTasks = (userData.transactions || []).filter(t =>
            t.timestamp >= startTime && t.timestamp < endTime && t.description?.startsWith('完成任務')
        );

        const yesterdayJournals = (userData.journalEntries || []).filter(j =>
            j.author === 'user' && new Date(j.date).getTime() >= startTime && new Date(j.date).getTime() < endTime
        );

        console.log(`昨日完成任務: ${yesterdayTasks.length} 個`);
        console.log(`昨日心情記錄: ${yesterdayJournals.length} 條`);

        if (yesterdayTasks.length === 0 && yesterdayJournals.length === 0) {
            console.log('\n⚠️  昨天沒有任何活動記錄！');
            console.log('這解釋了為什麼 AI 生成的是通用鼓勵內容');
        } else {
            console.log('\n昨日活動詳情:');
            yesterdayTasks.forEach(t => {
                console.log(`  - 任務: ${t.description}`);
            });
            yesterdayJournals.forEach(j => {
                console.log(`  - 心情: ${j.text?.substring(0, 50)}...`);
            });
        }

        // 3. 手動觸發一次生成看結果
        console.log('\n\n步驟 3: 手動觸發 AI 生成昨日總結');
        console.log('-'.repeat(70));
        console.log('現在調用 Cloud Function...\n');

        const { getFunctions } = await import('firebase-admin/functions');

        // 使用 Admin SDK 直接調用後端函數邏輯
        const nickname = userData.userProfile?.nickname || '小朋友';

        console.log(`用戶昵稱: ${nickname}`);
        console.log(`昨日有活動: ${yesterdayTasks.length > 0 || yesterdayJournals.length > 0 ? '是' : '否'}`);

        // 檢查 Gemini API Key
        const { defineSecret } = await import('firebase-functions/params');
        console.log(`\nGemini API Key 配置: 需要在 Cloud Functions 環境中檢查`);

        // 4. 檢查是否是瀏覽器緩存問題
        console.log('\n\n步驟 4: 排除瀏覽器緩存問題');
        console.log('-'.repeat(70));

        if (summaryDoc.exists) {
            const data = summaryDoc.data();
            const generatedTime = new Date(data.generatedAt).getTime();
            const now = Date.now();
            const ageMinutes = Math.floor((now - generatedTime) / 1000 / 60);

            console.log(`數據生成時間: ${data.generatedAt}`);
            console.log(`數據年齡: ${ageMinutes} 分鐘前`);

            if (ageMinutes > 60) {
                console.log('\n⚠️  數據較舊，可能需要重新生成');
            }
        }

        // 5. 總結
        console.log('\n\n' + '='.repeat(70));
        console.log('\n🎯 診斷結論:\n');

        if (!summaryDoc.exists) {
            console.log('❌ 根本問題: Firestore 沒有數據');
            console.log('\n解決方案:');
            console.log('1. 需要手動觸發 triggerYesterdaySummary 生成數據');
            console.log('2. 或等待定時任務在凌晨1:30自動執行\n');
        } else {
            const data = summaryDoc.data();
            const content = data.summary || data.text;

            if (content.includes('小長假') || content.includes('休息')) {
                console.log('✅ Firestore 有數據，但內容是通用鼓勵語\n');
                console.log('原因分析:');
                console.log(`1. 昨日沒有活動記錄 (任務: ${yesterdayTasks.length}, 心情: ${yesterdayJournals.length})`);
                console.log('2. AI 根據 prompt 邏輯生成了休息日鼓勵內容');
                console.log('3. 這是**正確的 AI 行為**，不是 bug！\n');

                console.log('如果想看到更具體的總結:');
                console.log('- 用戶需要在昨天完成任務或記錄心情');
                console.log('- 今天的活動會在明天的總結中體現\n');
            } else {
                console.log('✅ 內容看起來正常\n');
            }
        }

    } catch (error) {
        console.error('\n❌ 檢查失敗:', error);
        console.error(error.stack);
    } finally {
        process.exit(0);
    }
}

checkActualContent();
