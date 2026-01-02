/**
 * User Transaction Handler
 * 
 * 統一處理用戶交易記錄和積分變動的 Cloud Function
 * 確保積分和代幣的安全性，防止前端竄改
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const db = getFirestore();

export interface TransactionData {
    description: string;
    amount: string;
    pointsDelta?: number;    // 積分變動（正數增加，負數減少）
    tokensDelta?: number;    // 代幣變動（正數增加，負數減少）
    gachaponTicketsDelta?: number; // 扭蛋券變動
}

/**
 * Cloud Function: handleUserTransaction
 * 
 * 處理用戶交易記錄和資源變動
 * 
 * @param data.description - 交易描述
 * @param data.amount - 顯示金額（字符串，如 "+10 積分"）
 * @param data.pointsDelta - 積分變動量（可選）
 * @param data.tokensDelta - 代幣變動量（可選）
 * @param data.gachaponTicketsDelta - 扭蛋券變動量（可選）
 */
export const handleUserTransaction = onCall(
    async (request) => {
        const { data, auth } = request;

        // 1. 驗證用戶登入
        if (!auth) {
            throw new HttpsError(
                "unauthenticated",
                "請先登入才能進行交易。"
            );
        }

        const userId = auth.uid;

        // 2. 驗證輸入數據
        const {
            description,
            amount,
            pointsDelta,
            tokensDelta,
            gachaponTicketsDelta
        } = (data || {}) as TransactionData;

        if (!description || typeof description !== "string") {
            throw new HttpsError(
                "invalid-argument",
                "缺少必要的 description 參數。"
            );
        }

        if (!amount || typeof amount !== "string") {
            throw new HttpsError(
                "invalid-argument",
                "缺少必要的 amount 參數。"
            );
        }

        try {
            // 3. 使用 Firestore Transaction 確保原子性
            await db.runTransaction(async (transaction) => {
                const userRef = db.collection("users").doc(userId);
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists) {
                    throw new HttpsError(
                        "not-found",
                        "用戶資料不存在。"
                    );
                }

                const userData = userDoc.data();
                const currentPoints = Number(userData?.points || 0);
                const currentTokens = Number(userData?.tokens || 0);
                const currentTickets = Number(userData?.gachaponTickets || 0);

                // 4. 計算新的資源數值
                const updates: any = {};

                if (pointsDelta !== undefined && pointsDelta !== 0) {
                    const newPoints = currentPoints + pointsDelta;
                    if (newPoints < 0) {
                        throw new HttpsError(
                            "failed-precondition",
                            "積分不足，無法完成交易。"
                        );
                    }
                    updates.points = newPoints;
                }

                if (tokensDelta !== undefined && tokensDelta !== 0) {
                    const newTokens = currentTokens + tokensDelta;
                    if (newTokens < 0) {
                        throw new HttpsError(
                            "failed-precondition",
                            "代幣不足，無法完成交易。"
                        );
                    }
                    updates.tokens = newTokens;
                }

                if (gachaponTicketsDelta !== undefined && gachaponTicketsDelta !== 0) {
                    const newTickets = currentTickets + gachaponTicketsDelta;
                    if (newTickets < 0) {
                        throw new HttpsError(
                            "failed-precondition",
                            "扭蛋券不足，無法完成交易。"
                        );
                    }
                    updates.gachaponTickets = newTickets;
                }

                // 5. 創建交易記錄
                const transactionRecord = {
                    id: Date.now(),
                    description,
                    amount,
                    timestamp: Date.now(),
                    createdAt: FieldValue.serverTimestamp(),
                };

                const transactionsRef = userRef.collection("transactions");
                const newTransactionRef = transactionsRef.doc();

                // 6. 批量寫入：更新用戶資源 + 創建交易記錄
                if (Object.keys(updates).length > 0) {
                    transaction.update(userRef, updates);
                }

                transaction.set(newTransactionRef, transactionRecord);
            });

            console.log(`[Transaction] Success for user ${userId}: ${description}`);

            return {
                success: true,
                message: "交易完成",
            };

        } catch (error: any) {
            console.error(`[Transaction] Error for user ${userId}:`, error);

            if (error instanceof HttpsError) {
                throw error;
            }

            throw new HttpsError(
                "internal",
                `交易處理失敗: ${error.message || "未知錯誤"}`
            );
        }
    }
);
