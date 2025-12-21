// Manual trigger script for daily content
// Run with: node trigger_content.js

const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json'); // You need to download this from Firebase Console

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function triggerGeneration() {
    const dateStr = '2025-12-20';

    // Check if document exists
    const doc = await db.collection('dailyContent').doc(dateStr).get();
    if (doc.exists) {
        console.log('Document already exists:', doc.data());
        return;
    }

    console.log('Document does not exist. Please run the scheduled function manually from Firebase Console or wait for the next scheduled run.');
    console.log('Alternatively, you can call the Cloud Function directly via HTTPS with proper authentication.');
}

triggerGeneration().then(() => process.exit(0)).catch(console.error);
