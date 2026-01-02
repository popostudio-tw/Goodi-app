const admin = require('firebase-admin');
const serviceAccount = require('./key/goodi-5ec49-firebase-adminsdk-fbsvc-3276111711.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deepCheck() {
    console.log('🔍 深度检查昨日总结数据流\n');
    console.log('='.repeat(70));

    try {
        // 1. 获取管理员用户信息
        const adminEmail = 'popo.studio@msa.hinet.net';
        const userRecord = await admin.auth().getUserByEmail(adminEmail);
        const userId = userRecord.uid;

        console.log(`\n👤 用户信息:`);
        console.log(`   Email: ${adminEmail}`);
        console.log(`   UID: ${userId}`);

        // 2. 检查用户文档
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            console.log('\n❌ 用户文档不存在！');
            return;
        }

        const userData = userDoc.data();
        console.log(`   昵称: ${userData.userProfile?.nickname || '无'}`);
        console.log(`   方案: ${userData.plan || '无'}`);

        // 3. 计算昨日日期
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        console.log(`\n📅 昨日日期: ${yesterdayStr}`);

        // 4. 检查 dailySummaries collection
        console.log(`\n📊 检查 dailySummaries collection:`);
        console.log('-'.repeat(70));

        const summaryRef = db.collection('users').doc(userId).collection('dailySummaries').doc(yesterdayStr);
        const summaryDoc = await summaryRef.get();

        if (summaryDoc.exists) {
            const data = summaryDoc.data();
            console.log(`✅ 文档存在!`);
            console.log(`   总结: ${data.summary?.substring(0, 100)}...`);
            console.log(`   生成时间: ${data.generatedAt}`);
            console.log(`   来源: ${data.source || '未知'}`);
        } else {
            console.log(`❌ 文档不存在: users/${userId}/dailySummaries/${yesterdayStr}`);
        }

        // 5. 列出所有 dailySummaries
        console.log(`\n📋 所有历史总结:`);
        console.log('-'.repeat(70));
        const allSummaries = await db.collection('users').doc(userId).collection('dailySummaries').get();

        if (allSummaries.empty) {
            console.log('❌ 没有任何历史总结记录');
        } else {
            console.log(`找到 ${allSummaries.size} 条记录:\n`);
            allSummaries.docs.forEach(doc => {
                const data = doc.data();
                console.log(`   ${doc.id}:`);
                console.log(`      ${data.summary?.substring(0, 60)}...`);
            });
        }

        // 6. 检查用户昨日活动数据
        console.log(`\n\n📈 检查用户昨日活动数据 (用于生成总结):`);
        console.log('-'.repeat(70));

        const startTime = new Date(yesterdayStr).getTime();
        const endTime = startTime + 24 * 60 * 60 * 1000;

        // 检查 transactions
        const transactions = userData.transactions || [];
        const yesterdayTasks = transactions.filter(t =>
            t.timestamp >= startTime && t.timestamp < endTime && t.description?.startsWith('完成任務')
        );
        console.log(`   完成任务: ${yesterdayTasks.length} 个`);

        // 检查 journalEntries
        const journals = userData.journalEntries || [];
        const yesterdayJournals = journals.filter(j =>
            j.author === 'user' && new Date(j.date).getTime() >= startTime && new Date(j.date).getTime() < endTime
        );
        console.log(`   心情记录: ${yesterdayJournals.length} 条`);
        if (yesterdayJournals.length > 0) {
            yesterdayJournals.forEach(j => {
                console.log(`      "${j.text?.substring(0, 40)}..."`);
            });
        }

        // 7. 检查前端 localStorage fallback
        console.log(`\n\n💾 前端可能使用的 Fallback:`);
        console.log('-'.repeat(70));
        console.log('前端 SidebarWidgets.tsx 的 fallback 逻辑:');
        console.log('1. 尝试从 Firestore 实时读取');
        console.log('2. 如果没有 → 尝试从 localStorage 读取');
        console.log('3. 如果没有 → 调用 getYesterdaySummary() API');
        console.log('4. 如果失败 → 使用 fallbackContent.json');

        // 8. 检查 API 使用量
        console.log(`\n\n📊 检查 API 使用量:`);
        console.log('-'.repeat(70));

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const usageDoc = await db.collection('apiUsage').doc(`global_${todayStr}`).get();
        if (usageDoc.exists) {
            const data = usageDoc.data();
            console.log(`今日 API 调用统计:`);
            console.log(`   总调用: ${data.totalCalls || 0}`);
            if (data.callsPerSource) {
                console.log(`   调用来源:`);
                Object.entries(data.callsPerSource).forEach(([source, count]) => {
                    console.log(`      ${source}: ${count}`);
                });
            }
        } else {
            console.log('今日无 API 调用记录');
        }

        // 9. 建议的修复方案
        console.log(`\n\n${'='.repeat(70)}`);
        console.log('\n🎯 诊断结论:\n');

        if (!summaryDoc.exists) {
            console.log('问题确认: Firestore 中没有昨日总结数据\n');
            console.log('可能原因:');
            console.log('1. ❌ 定时任务未执行 (scheduledDailySummaries)');
            console.log('2. ❌ 前端 lazy loading 未触发 API 调用');
            console.log('3. ❌ API 调用时生成失败但没有抛出错误');
            console.log('4. ❌ Circuit Breaker 熔断导致无法生成\n');

            console.log('建议解决方案:');
            console.log('A. 手动调用 Cloud Function 生成数据');
            console.log('B. 检查 Cloud Functions 日志查看错误');
            console.log('C. 添加前端调试确认是否真的调用了 API');
            console.log('D. 检查 Gemini API 配额是否用尽\n');
        } else {
            console.log('✅ Firestore 数据存在，问题可能在前端缓存或读取逻辑\n');
        }

    } catch (error) {
        console.error('\n❌ 检查失败:', error.message);
        console.error(error.stack);
    } finally {
        process.exit(0);
    }
}

deepCheck();
