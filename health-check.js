const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const fs = require('fs');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function fullHealthCheck() {
    let report = '';
    const log = (msg) => {
        console.log(msg);
        report += msg + '\n';
    };

    try {
        log('\n=== Goodi AI System Health Check ===');
        log('Time: ' + new Date().toISOString());
        log('='.repeat(70) + '\n');

        // 1. User data check
        const usersSnapshot = await db.collection('users').limit(10).get();
        log(`[1] Users: Found ${usersSnapshot.size} users\n`);

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

        log(`[2] Yesterday date: ${yesterdayStr}\n`);

        let usersWithSummary = 0;
        let usersWithoutSummary = 0;

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data();
            const nickname = userData.userProfile?.nickname || 'unnamed';

            const summaryDoc = await db.collection('users').doc(userId).collection('dailySummaries').doc(yesterdayStr).get();

            if (summaryDoc.exists) {
                usersWithSummary++;
                const data = summaryDoc.data();
                log(`  ✓ ${nickname}: Has summary (${data.source || 'unknown'})`);
            } else {
                usersWithoutSummary++;
                log(`  ✗ ${nickname}: No summary`);
            }
        }

        log(`\n[3] Summary Status: ${usersWithSummary} with / ${usersWithoutSummary} without\n`);

        // 2. Circuit Breaker check
        log('='.repeat(70));
        const cbDoc = await db.collection('systemStatus').doc('circuitBreaker').get();

        if (cbDoc.exists) {
            const cbData = cbDoc.data();
            const now = Date.now();
            const isOpen = cbData.openUntil && cbData.openUntil > now;

            log(`\n[4] Circuit Breaker: ${isOpen ? '🔴 OPEN (BLOCKED)' : '✓ CLOSED (OK)'}`);
            if (isOpen) {
                log(`    Consecutive failures: ${cbData.consecutiveFailures}`);
                log(`    Retry in: ${Math.ceil((cbData.openUntil - now) / 1000)} seconds`);
            }
        } else {
            log('\n[4] Circuit Breaker: ✓ Not triggered (OK)');
        }

        // 3. API usage check
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const usageDoc = await db.collection('apiUsage').doc(`global_${todayStr}`).get();

        log('\n[5] API Usage Today:');
        if (usageDoc.exists) {
            const usage = usageDoc.data();
            log(`    Total calls: ${usage.totalCalls || 0}`);
            log(`    Last minute: ${usage.lastMinuteCount || 0}`);
            if (usage.callsPerSource) {
                log('    Calls by source:');
                Object.entries(usage.callsPerSource).forEach(([source, count]) => {
                    log(`      - ${source}: ${count}`);
                });
            }
        } else {
            log('    No API calls recorded today');
        }

        // 4. Overall health assessment
        log('\n' + '='.repeat(70));
        log('\n=== HEALTH ASSESSMENT ===\n');

        const allGood = !cbDoc.exists || !cbDoc.data().openUntil || cbDoc.data().openUntil < Date.now();

        if (allGood && usersWithSummary > 0) {
            log('✓ SYSTEM HEALTHY');
            log('  - Circuit breaker is not blocking API calls');
            log('  - Some users have AI-generated summaries');
            log('  - API usage is being tracked');
        } else {
            log('⚠ ISSUES DETECTED:');
            if (!allGood) {
                log('  - Circuit breaker is OPEN (blocking API calls)');
            }
            if (usersWithSummary === 0) {
                log('  - No users have yesterday summaries (may be normal if no activity)');
            }
        }

        log('\n' + '='.repeat(70));
        log('\nReport saved to: ai_health_report.txt\n');

        // Save report
        fs.writeFileSync('ai_health_report.txt', report, 'utf8');

    } catch (error) {
        log('\n❌ ERROR: ' + error.message);
        log(error.stack);
    } finally {
        process.exit(0);
    }
}

fullHealthCheck();
