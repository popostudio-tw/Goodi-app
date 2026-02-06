
// Benchmark script for Weekly Report Generation
// Simulates sequential vs parallel processing

async function runBenchmark() {
    console.log("🚀 Starting Weekly Report Benchmark...");

    const USER_COUNT = 10;
    const TASK_DELAY_MS = 50; // Firestore latency for tasks
    const JOURNAL_DELAY_MS = 50; // Firestore latency for journals
    const AI_DELAY_MS = 1000; // Gemini API latency
    const BATCH_SIZE = 3;

    // Mock Users
    const users = Array.from({ length: USER_COUNT }, (_, i) => ({
        id: `user_${i}`,
        data: () => ({ displayName: `User ${i}` })
    }));

    console.log(`\nPARAMS: Users=${USER_COUNT}, DB_Delay=${TASK_DELAY_MS*2}ms/user, AI_Delay=${AI_DELAY_MS}ms/user`);

    // --- SEQUENTIAL BASELINE ---
    console.log("\n--- Testing SEQUENTIAL Processing (Baseline) ---");
    const startSeq = Date.now();

    for (const user of users) {
        // console.log(`Processing ${user.id}...`);

        // 1. Fetch Tasks
        await new Promise(r => setTimeout(r, TASK_DELAY_MS));

        // 2. Fetch Journal
        await new Promise(r => setTimeout(r, JOURNAL_DELAY_MS));

        // 3. Call AI
        await new Promise(r => setTimeout(r, AI_DELAY_MS));
    }

    const endSeq = Date.now();
    const durationSeq = (endSeq - startSeq) / 1000;
    console.log(`✅ Sequential Time: ${durationSeq.toFixed(2)}s`);

    // --- PARALLEL BATCHED ---
    console.log("\n--- Testing OPTIMIZED Processing (Batched) ---");
    const startOpt = Date.now();

    // Chunking
    const chunks = [];
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
        chunks.push(users.slice(i, i + BATCH_SIZE));
    }

    for (const chunk of chunks) {
        await Promise.allSettled(chunk.map(async (user) => {
            // Parallel DB Calls
            await Promise.all([
                new Promise(r => setTimeout(r, TASK_DELAY_MS)),
                new Promise(r => setTimeout(r, JOURNAL_DELAY_MS))
            ]);

            // AI Call
            await new Promise(r => setTimeout(r, AI_DELAY_MS));
        }));
    }

    const endOpt = Date.now();
    const durationOpt = (endOpt - startOpt) / 1000;
    console.log(`✅ Optimized Time: ${durationOpt.toFixed(2)}s`);

    // Results
    const speedup = durationSeq / durationOpt;
    console.log(`\n🎉 Speedup: ${speedup.toFixed(2)}x`);
}

runBenchmark();
