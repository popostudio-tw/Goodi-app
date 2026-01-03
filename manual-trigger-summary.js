/**
 * 手動觸發昨日總結重新生成（簡化版）
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function manualTriggerYesterdaySummary() {
    console.log('[Manual Trigger] Starting yesterday summary regeneration...\n');

    try {
        // 指定用戶 UID
        const targetUserId = 'Cu2iElCu02eIsCn7YhIhuB753';

        console.log(`[Target User] ${targetUserId}\n`);

        // 計算昨日日期
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = yesterday.toISOString().split('T')[0];

        console.log(`[Date] ${yesterdayDate}\n`);

        // 直接刪除舊文檔並重新生成
        const summaryRef = db.doc(`users/${targetUserId}/dailySummaries/${yesterdayDate}`);

        // 先檢查現有資料
        const existingDoc = await summaryRef.get();
        if (existingDoc.exists) {
            console.log('[Existing Data]', existingDoc.data());
            console.log('\n[Action] Deleting old document...\n');
            await summaryRef.delete();
        }

        // 生成新的總結（基於實際任務數據）
        const userDoc = await db.collection('users').doc(targetUserId).get();
        const userData = userDoc.data();
        const nickname = userData?.userProfile?.nickname || '小猴仔';

        // 計算昨日任務
        const startTime = new Date(yesterdayDate).getTime();
        const endTime = startTime + 24 * 60 * 60 * 1000;

        const yesterdayTasks = (userData?.transactions || []).filter((t) =>
            t.timestamp >= startTime && t.timestamp < endTime && t.description?.startsWith('完成任務')
        );

        console.log(`[Activity] Nickname: ${nickname}, Tasks completed: ${yesterdayTasks.length}\n`);

        // 生成鼓勵文字
        let summaryText;
        const taskCount = yesterdayTasks.length;

        if (taskCount === 0) {
            summaryText = `吼呜～${nickname} 昨天給自己放了一個小長假呢！休息是為了走更長遠的路，Goodi 陪你充充電，今天一起重新出發吧！🦖💤`;
        } else if (taskCount >= 5) {
            summaryText = `吼吼吼！${nickname}！昨天完成了 ${taskCount} 個任務，Goodi 的恐龍能量條都爆表了！你真的太厲害了，今天也要繼續閃閃發光喔！✨🦕`;
        } else {
            summaryText = `吼吼～${nickname}！昨天完成了 ${taskCount} 個任務，Goodi 的背鰭都亮起來了！繼續保持，我們一起變得更厲害！💪🦖`;
        }

        console.log(`[Generated Summary] "${summaryText}"\n`);

        // 儲存新文檔（使用 summary 欄位）
        await summaryRef.set({
            summary: summaryText,
            date: yesterdayDate,
            tasksCompleted: taskCount,
            generatedAt: new Date().toISOString(),
            generated: true,
            manuallyTriggered: true
        });

        console.log('✅ Successfully regenerated and saved yesterday summary!\n');

        // 驗證
        const newDoc = await summaryRef.get();
        console.log('[New Document]', newDoc.data());

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        throw error;
    } finally {
        await admin.app().delete();
    }
}

// 執行
manualTriggerYesterdaySummary()
    .then(() => {
        console.log('\n✅ Manual trigger completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Manual trigger failed');
        process.exit(1);
    });
