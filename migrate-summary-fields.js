/**
 * 遷移腳本：統一 dailySummaries 欄位名稱
 * 將舊的 `text` 欄位重命名為 `summary`
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateSummaryFields() {
    console.log('[Migration] Starting dailySummaries field migration...\n');

    try {
        const usersSnapshot = await db.collection('users').get();
        console.log(`[Migration] Found ${usersSnapshot.size} users\n`);

        let totalMigrated = 0;
        let totalSkipped = 0;
        let totalErrors = 0;

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;

            try {
                const summariesSnapshot = await db
                    .collection(`users/${userId}/dailySummaries`)
                    .get();

                if (summariesSnapshot.empty) {
                    continue;
                }

                console.log(`[User: ${userId}] Found ${summariesSnapshot.size} summaries`);

                for (const summaryDoc of summariesSnapshot.docs) {
                    const data = summaryDoc.data();
                    const dateId = summaryDoc.id;

                    // 檢查是否需要遷移
                    if (data.text && !data.summary) {
                        // 遷移：將 text 改為 summary，並刪除 text 欄位
                        await summaryDoc.ref.update({
                            summary: data.text,
                            text: admin.firestore.FieldValue.delete(),
                            migratedAt: new Date().toISOString(),
                            migratedFrom: 'text'
                        });

                        console.log(`  ✓ Migrated ${dateId}: "${data.text.substring(0, 40)}..."`);
                        totalMigrated++;
                    } else if (data.summary) {
                        // 已經有 summary 欄位，跳過
                        totalSkipped++;
                    } else {
                        console.log(`  ⚠️ ${dateId}: No text or summary field found`);
                    }
                }
            } catch (userError) {
                console.error(`  ✗ Error processing user ${userId}:`, userError.message);
                totalErrors++;
            }
        }

        console.log('\n[Migration] Completed!');
        console.log(`  ✓ Migrated: ${totalMigrated}`);
        console.log(`  ○ Skipped: ${totalSkipped}`);
        console.log(`  ✗ Errors: ${totalErrors}`);

    } catch (error) {
        console.error('[Migration] Fatal error:', error);
        throw error;
    } finally {
        await admin.app().delete();
    }
}

// 執行遷移
migrateSummaryFields()
    .then(() => {
        console.log('\n✅ Migration completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });
