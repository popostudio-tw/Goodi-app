import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

/**
 * Delete User Account - Apple App Store Compliance
 * 
 * Permanently deletes a user's account and all associated data.
 * This function is required for Apple App Store compliance.
 * 
 * @requires Authentication - User must be logged in
 * @returns Success status or throws error
 */
export const deleteUserAccount = onCall(async (request) => {
  const { auth } = request;

  // 1. Verify user is authenticated
  if (!auth) {
    throw new HttpsError(
      "unauthenticated",
      "必須登入才能刪除帳號"
    );
  }

  const userId = auth.uid;
  console.log(`[Account Deletion] Starting deletion for user: ${userId}`);

  try {
    const db = getFirestore();
    const authService = getAuth();

    // 2. Delete all Firestore subcollections
    const subcollections = [
      "highlights",
      "dailySummaries",
      "weeklyReports",
      "tasks",
      "journals",
    ];

    for (const subcollection of subcollections) {
      const collectionRef = db
        .collection("users")
        .doc(userId)
        .collection(subcollection);

      const snapshot = await collectionRef.get();

      if (!snapshot.empty) {
        console.log(
          `[Account Deletion] Deleting ${snapshot.size} documents from ${subcollection}`
        );

        // Delete in batches of 500 (Firestore limit)
        const batches = [];
        let batch = db.batch();
        let count = 0;

        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
          count++;

          if (count === 500) {
            batches.push(batch.commit());
            batch = db.batch();
            count = 0;
          }
        });

        if (count > 0) {
          batches.push(batch.commit());
        }

        await Promise.all(batches);
      }
    }

    // 3. Delete main user document
    await db.collection("users").doc(userId).delete();
    console.log(`[Account Deletion] Deleted main user document`);

    // 4. Log deletion for compliance (retain for 30 days)
    await db.collection("deletedAccounts").doc(userId).set({
      deletedAt: new Date().toISOString(),
      email: auth.token.email || "unknown",
      reason: "user_requested",
    });

    // 5. Delete Firebase Auth account (must be last)
    await authService.deleteUser(userId);
    console.log(`[Account Deletion] Deleted Firebase Auth account`);

    return {
      success: true,
      message: "帳號已成功刪除",
    };
  } catch (error: any) {
    console.error(`[Account Deletion] Error for user ${userId}:`, error);

    throw new HttpsError(
      "internal",
      `刪除帳號時發生錯誤: ${error.message || "未知錯誤"}`
    );
  }
});
