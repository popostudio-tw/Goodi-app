const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable, connectFunctionsEmulator } = require('firebase/functions');

const firebaseConfig = {
    apiKey: "AIzaSyDWo4uCrhmP6utqG-3__qf1aiE1h8XzX2g",
    authDomain: "goodi-5ec49.firebaseapp.com",
    projectId: "goodi-5ec49",
    storageBucket: "goodi-5ec49.firebasestorage.app",
    messagingSenderId: "368247732471",
    appId: "1:368247732471:web:7880acfa0c59075cbf3bf2",
    measurementId: "G-H0TFMWY2JP"
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, 'us-central1');

async function triggerGeneration() {
    const dates = ['2025-12-20', '2025-12-21', '2025-12-22', '2025-12-23'];

    const manualGenerate = httpsCallable(functions, 'manualGenerateDailyContent');

    for (const date of dates) {
        console.log(`\n🔄 Generating content for ${date}...`);
        try {
            const result = await manualGenerate({ date, force: true });
            console.log(`✅ ${date} Success!`);
            console.log('History:', result.data.todayInHistory?.substring(0, 80) + '...');
            console.log('Animal:', result.data.animalTrivia?.substring(0, 80) + '...');
        } catch (error) {
            console.error(`❌ ${date} Failed:`, error.message);
        }
        // Wait 3 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('\n✅ All done!');
    process.exit(0);
}

triggerGeneration();
