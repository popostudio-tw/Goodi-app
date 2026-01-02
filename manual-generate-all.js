const admin = require('firebase-admin');
const serviceAccount = require('./key/goodi-5ec49-firebase-adminsdk-fbsvc-3276111711.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function manualTriggerAll() {
    try {
        console.log('\n🔧 手動觸發所有 AI 生成任務\n');
        console.log('='.repeat(70));

        // 獲取所有用戶
        const usersSnapshot = await db.collection('users').get();
        console.log(`找到 ${usersSnapshot.size} 個用戶\n`);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        // 獲取本週 key
        const now = new Date();
        const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        const weekKey = `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;

        console.log(`昨日日期: ${yesterdayStr}`);
        console.log(`本週 Key: ${weekKey}\n`);

        let summaryCount = 0;
        let weeklyCount = 0;

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data();
            const nickname = userData.userProfile?.nickname || '小朋友';

            console.log(`處理: ${nickname}`);

            // 1. 生成昨日總結
            try {
                const startTime = new Date(yesterdayStr).getTime();
                const endTime = startTime + 24 * 60 * 60 * 1000;

                const yesterdayTasks = (userData.transactions || []).filter(t =>
                    t.timestamp >= startTime && t.timestamp < endTime && t.description?.startsWith('完成任務')
                );

                const yesterdayJournals = (userData.journalEntries || []).filter(j =>
                    j.author === 'user' && new Date(j.date).getTime() >= startTime && new Date(j.date).getTime() < endTime
                );

                const hasActivity = yesterdayTasks.length > 0 || yesterdayJournals.length > 0;

                const summary = hasActivity
                    ? `${nickname}，昨天你完成了 ${yesterdayTasks.length} 個任務！${yesterdayJournals.length > 0 ? '也記錄了心情，' : ''}每一步努力 Goodi 都看到了，今天也要繼續加油喔！🦖✨`
                    : `${nickname}，昨天是休息日呢！適當的休息能讓我們走得更遠，今天讓我們一起重新出發，創造美好的回憶吧！🦖💚`;

                await db.collection('users').doc(userId)
                    .collection('dailySummaries').doc(yesterdayStr)
                    .set({
                        summary: summary,
                        date: yesterdayStr,
                        generatedAt: new Date().toISOString(),
                        source: 'manual_generation'
                    });

                summaryCount++;
                console.log(`  ✅ 昨日總結已生成`);
            } catch (err) {
                console.log(`  ❌ 昨日總結失敗: ${err.message}`);
            }

            // 2. 生成週報
            try {
                const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

                const weeklyTasks = (userData.transactions || []).filter(t =>
                    t.timestamp >= sevenDaysAgo && t.description?.startsWith('完成任務')
                );

                const weeklyReport = `### ✨ ${nickname} 的本週成長報告\n\n本週完成了 ${weeklyTasks.length} 個任務，每一天的努力都在累積成長的能量。繼續保持這份熱情，Goodi 永遠支持你！🦖\n\n下週讓我們一起設定新目標，創造更多美好的回憶吧！`;

                await db.collection('users').doc(userId)
                    .collection('weeklyReports').doc(weekKey)
                    .set({
                        content: weeklyReport,
                        weekKey: weekKey,
                        generatedAt: new Date().toISOString(),
                        stats: {
                            tasksCompleted: weeklyTasks.length,
                            scoresReported: 0,
                            journalEntries: 0
                        }
                    });

                weeklyCount++;
                console.log(`  ✅ 週報已生成`);
            } catch (err) {
                console.log(`  ❌ 週報失敗: ${err.message}`);
            }

            console.log('');
        }

        console.log('='.repeat(70));
        console.log(`\n✅ 生成完成！`);
        console.log(`   昨日總結: ${summaryCount} 個`);
        console.log(`   週報: ${weeklyCount} 個\n`);
        console.log('請刷新網頁 (Ctrl+Shift+R) 查看結果\n');

    } catch (error) {
        console.error('\n❌ 錯誤:', error);
        console.error(error.stack);
    } finally {
        process.exit(0);
    }
}

manualTriggerAll();
