
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Admin SDK first
try {
    initializeApp();
} catch (e) {
    console.log("App already initialized or initialization failed", e);
}

const db = getFirestore();

async function runBenchmark() {
    console.log("🚀 Starting Benchmark: Daily Summary Generation");

    // Dynamic import to avoid "default Firebase app does not exist" error
    // because scheduledDailySummariesV2 initializes db at top level.
    const { processUserDailySummary } = await import("./scheduledDailySummariesV2.js");

    // 1. Setup Test User
    const testUserId = "test_benchmark_user_" + Date.now();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];

    console.log(`👤 Creating test user: ${testUserId}`);
    await db.collection("users").doc(testUserId).set({
        displayName: "Benchmark Test User",
        userProfile: { nickname: "Benchy" },
        email: "benchmark@example.com"
    });

    // 2. Create Dummy Tasks for Yesterday
    console.log(`📝 Creating dummy tasks for ${yesterdayDate}`);
    const tasksRef = db.collection(`users/${testUserId}/tasks`);
    await tasksRef.add({
        description: "Benchmark Task 1",
        completed: true,
        points: 10,
        category: "life",
        date: yesterdayDate
    });
    await tasksRef.add({
        description: "Benchmark Task 2",
        completed: true,
        points: 20,
        category: "study",
        date: yesterdayDate
    });
     await tasksRef.add({
        description: "Benchmark Task 3",
        completed: false,
        points: 10,
        category: "household",
        date: yesterdayDate
    });

    // 3. Measure Execution Time
    console.log("⏱️  Running processUserDailySummary...");
    const start = process.hrtime();

    const result = await processUserDailySummary(testUserId, {
        displayName: "Benchmark Test User",
        userProfile: { nickname: "Benchy" }
    }, yesterdayDate, db);

    const end = process.hrtime(start);
    const durationMs = (end[0] * 1000 + end[1] / 1e6).toFixed(2);

    console.log(`✅ Execution completed in ${durationMs}ms`);
    console.log("📊 Result:", JSON.stringify(result, null, 2));

    // 4. Verify Output
    if (result.status === 'processed') {
        const summaryDoc = await db.doc(`users/${testUserId}/dailySummaries/${yesterdayDate}`).get();
        if (summaryDoc.exists) {
            console.log("🎉 Summary Document Created:");
            console.log(summaryDoc.data()?.summary);
        } else {
            console.error("❌ Summary document NOT found!");
        }
    } else {
        console.warn("⚠️  Process status was not 'processed' (Likely missing API Key or Error)");
    }

    // 5. Cleanup
    console.log("🧹 Cleaning up test data...");
    await db.collection("users").doc(testUserId).delete();

    console.log("🏁 Benchmark Finished");
}

// Check if we are in an environment where we can run this
// We try to run it anyway to verify logic flow
runBenchmark().catch(console.error);
