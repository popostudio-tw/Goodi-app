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

    // 2. Recursively delete all data in the user document and its subcollections
    // This is more memory efficient than loading all documents into memory
    const userRef = db.collection("users").doc(userId);

    // Check if document exists first to avoid unnecessary operations (optional but good for logging)
    const userDoc = await userRef.get();
    if (userDoc.exists) {
        console.log(`[Account Deletion] Found user document, starting recursive delete...`);
        await db.recursiveDelete(userRef);
        console.log(`[Account Deletion] Recursive delete completed for user: ${userId}`);
    } else {
        console.log(`[Account Deletion] User document not found in Firestore (might be already deleted or auth-only user)`);
        // We still proceed to ensure auth account is deleted
    }

    // 4. Log deletion for compliance (retain for 30 days)
    await db.collection("deletedAccounts").doc(userId).set({
      deletedAt: new Date().toISOString(),
      email: auth.token.email || "unknown",
      reason: "user_requested",
    });

    // 5. Delete Firebase Auth account (must be last)
    try {
        await authService.deleteUser(userId);
        console.log(`[Account Deletion] Deleted Firebase Auth account`);
    } catch (authError: any) {
        // If the user is not found in Auth (already deleted), we consider it a success
        if (authError.code === 'auth/user-not-found') {
             console.log(`[Account Deletion] User not found in Auth, skipping.`);
        } else {
            throw authError;
        }
    }

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
