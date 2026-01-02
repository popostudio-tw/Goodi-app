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
        console.log('\n=== AI API Root Cause Diagnosis ===\n');

        // Get users
        const usersSnapshot = await db.collection('users').limit(5).get();
        console.log(`Found ${usersSnapshot.size} users\n`);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        console.log(`Yesterday date: ${yesterdayStr}\n`);

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data();
            const email = userData.email || 'unknown';
            const nickname = userData.userProfile?.nickname || 'unknown';

            console.log(`\nUser: ${nickname} (${email.substring(0, 25)}...)`);
            console.log(`UID: ${userId.substring(0, 20)}...`);

            // Check yesterday summary
            const summaryRef = db.collection('users').doc(userId).collection('dailySummaries').doc(yesterdayStr);
            const summaryDoc = await summaryRef.get();

            if (summaryDoc.exists) {
                const data = summaryDoc.data();
                console.log(`  ✓ Has yesterday summary`);
                console.log(`    Content: "${data.summary?.substring(0, 60)}..."`);
                console.log(`    Generated at: ${data.generatedAt}`);
                console.log(`    Source: ${data.source || 'not marked'}`);

                // Check activities
                const startTime = new Date(yesterdayStr).getTime();
                const endTime = startTime + 24 * 60 * 60 * 1000;

                const tasks = (userData.transactions || []).filter(t =>
                    t.timestamp >= startTime && t.timestamp < endTime && t.description?.startsWith('完成任務')
                );

                const journals = (userData.journalEntries || []).filter(j =>
                    j.author === 'user' && new Date(j.date).getTime() >= startTime && new Date(j.date).getTime() < endTime
                );

                console.log(`    Tasks: ${tasks.length}`);
                console.log(`    Journals: ${journals.length}`);
                if (journals.length > 0) {
                    journals.forEach(j => {
                        console.log(`      - "${j.text?.substring(0, 40)}..."`);
                    });
                }

            } else {
                console.log(`  ✗ No yesterday summary`);
            }
        }

        // Check Circuit Breaker
        console.log('\n\n=== System Status ===\n');

        const cbDoc = await db.collection('systemStatus').doc('circuitBreaker').get();
        if (cbDoc.exists) {
            const cbData = cbDoc.data();
            const now = Date.now();
            const isOpen = cbData.openUntil && cbData.openUntil > now;

            console.log(`Circuit Breaker: ${isOpen ? 'OPEN (blocked)' : 'CLOSED'}`);
            if (isOpen) {
                console.log(`  Failures: ${cbData.consecutiveFailures}`);
                console.log(`  Retry in: ${Math.ceil((cbData.openUntil - now) / 1000)}s`);
            }
        } else {
            console.log('Circuit Breaker: Not triggered');
        }

        // Check API usage
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const usageDoc = await db.collection('apiUsage').doc(`global_${todayStr}`).get();

        console.log('\nAPI Usage:');
        if (usageDoc.exists) {
            const usage = usageDoc.data();
            console.log(`  Total calls: ${usage.totalCalls || 0}`);
            console.log(`  Last minute: ${usage.lastMinuteCount || 0}`);
            if (usage.callsPerSource) {
                console.log(`  Calls by source:`);
                Object.entries(usage.callsPerSource).forEach(([source, count]) => {
                    console.log(`    ${source}: ${count}`);
                });
            }
        } else {
            console.log('  No API calls today');
        }

        console.log('\n\n=== Diagnostic Conclusion ===\n');
        console.log('Check the above output to see:');
        console.log('1. Firestore has data but frontend cannot read -> Frontend issue');
        console.log('2. Firestore has no data -> Backend generation issue');
        console.log('3. Circuit Breaker is open -> API calls blocked');
        console.log('4. Data is generic content -> User had no activity yesterday\n');

    } catch (error) {
        console.error('\nError:', error.message);
        console.error(error.stack);
    } finally {
        process.exit(0);
    }
}

diagnose();
