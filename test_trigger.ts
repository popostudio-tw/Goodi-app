
import { initializeApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";

const firebaseConfig = {
    projectId: "goodi-5ec49",
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, "us-central1");

async function trigger() {
    const generate = httpsCallable(functions, 'generateDailyContent');
    const dates = ["2025-12-19", "2025-12-20"];

    for (const date of dates) {
        console.log(`Triggering for ${date}...`);
        try {
            const result = await generate({ date });
            console.log(`Success for ${date}:`, result.data);
        } catch (err) {
            console.error(`Error for ${date}:`, err);
        }
    }
}

trigger();
