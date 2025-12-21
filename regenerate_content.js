// Script to regenerate daily content for specific dates
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // You'll need to provide this

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const functions = admin.functions();

async function regenerateDates() {
    const dates = ['2025-12-20', '2025-12-21', '2025-12-22', '2025-12-23'];

    for (const date of dates) {
        console.log(`Regenerating content for ${date}...`);
        try {
            const manualGenerate = functions.httpsCallable('manualGenerateDailyContent');
            const result = await manualGenerate({ date, force: true });
            console.log(`✅ ${date} regenerated successfully`);
            console.log('Preview:', {
                history: result.data.todayInHistory?.substring(0, 50) + '...',
                animal: result.data.animalTrivia?.substring(0, 50) + '...'
            });
        } catch (error) {
            console.error(`❌ Failed to regenerate ${date}:`, error.message);
        }
        // Wait 3 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('Done!');
    process.exit(0);
}

regenerateDates();
