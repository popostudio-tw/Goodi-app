import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Benchmark User Deletion
 *
 * Provides tools to setup a heavy user account and measure deletion performance.
 *
 * ACTIONS:
 * - 'setup': Creates a test user with a specified number of documents (default 2000) distributed across subcollections.
 * - 'test_legacy': (Not implemented here as we replaced the code, but conceptually comparison point)
 * - 'test_recursive': Deletes the test user using the optimized recursiveDelete logic.
 */
export const benchmarkDelete = onCall(
  {
    timeoutSeconds: 540, // Maximize timeout for heavy setup
    memory: "1GiB",      // Give it some room for setup
  },
  async (request) => {
    const { auth, data } = request;

    // Security: Only allow admins or specific test users (for now, simplistic check)
    if (!auth) {
        throw new HttpsError("unauthenticated", "Auth required");
    }

    // In a real scenario, you'd check for an admin claim here.
    // const isAdmin = auth.token.admin === true;
    // if (!isAdmin) throw new HttpsError("permission-denied", "Admins only");

    const action = data.action; // 'setup' | 'delete'
    const docCount = data.docCount || 2000;
    const testUserId = "benchmark_test_user_" + Date.now();

    const db = getFirestore();

    if (action === 'setup') {
        console.log(`[Benchmark] Setting up test user ${testUserId} with ${docCount} documents...`);
        const startTime = Date.now();

        try {
            // Create main user doc
            const userRef = db.collection('users').doc(testUserId);
            await userRef.set({
                createdAt: new Date().toISOString(),
                isBenchmark: true,
                profile: { name: "Benchmark Bot", age: 99 }
            });

            // Create subcollections with dummy data
            const subcollections = ["highlights", "dailySummaries", "tasks", "journals"];
            const batchSize = 500;
            let currentBatch = db.batch();
            let operationCount = 0;
            let totalCreated = 0;

            for (let i = 0; i < docCount; i++) {
                const subcol = subcollections[i % subcollections.length];
                const docRef = userRef.collection(subcol).doc();

                currentBatch.set(docRef, {
                    data: "x".repeat(100), // Some payload
                    index: i,
                    timestamp: Date.now()
                });

                operationCount++;
                totalCreated++;

                if (operationCount >= batchSize) {
                    await currentBatch.commit();
                    currentBatch = db.batch();
                    operationCount = 0;
                    console.log(`[Benchmark] Created ${totalCreated}/${docCount} documents...`);
                }
            }

            if (operationCount > 0) {
                await currentBatch.commit();
            }

            const duration = (Date.now() - startTime) / 1000;
            return {
                success: true,
                message: `Setup complete. Created user ${testUserId} with ${totalCreated} docs.`,
                userId: testUserId,
                durationSeconds: duration
            };

        } catch (e: any) {
            console.error(e);
            throw new HttpsError("internal", "Setup failed: " + e.message);
        }
    }

    else if (action === 'delete') {
        const targetUserId = data.targetUserId;
        if (!targetUserId) throw new HttpsError("invalid-argument", "targetUserId required for delete");

        console.log(`[Benchmark] Deleting user ${targetUserId} using recursiveDelete...`);
        const startTime = Date.now();

        try {
             const userRef = db.collection("users").doc(targetUserId);
             await db.recursiveDelete(userRef);

             const duration = Date.now() - startTime;
             console.log(`[Benchmark] Deletion complete in ${duration}ms`);

             return {
                 success: true,
                 message: "Deletion complete",
                 userId: targetUserId,
                 durationMs: duration,
                 method: "recursiveDelete"
             };
        } catch (e: any) {
             console.error(e);
             throw new HttpsError("internal", "Delete failed: " + e.message);
        }
    }

    else {
        throw new HttpsError("invalid-argument", "Invalid action. Use 'setup' or 'delete'.");
    }
});
