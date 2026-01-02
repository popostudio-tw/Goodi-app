/**
 * AI Suggestions Cache Module
 * 
 * 實作任務建議快取機制，避免重複調用 Gemini API
 * 快取策略：根據年齡與目標組合，7天有效期
 */

import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

export interface CachedSuggestion {
    age: number;
    goal: 'focus' | 'responsibility' | 'creativity' | 'general';
    suggestions: string[];
    createdAt: string; // ISO timestamp
    expiresAt: string; // 7 days later
}

/**
 * 從快取中獲取建議
 * @param age 兒童年齡
 * @param goal 目標類型
 * @returns 快取的建議陣列，若無快取或已過期返回 null
 */
export async function getCachedSuggestion(
    age: number,
    goal: string
): Promise<string[] | null> {
    try {
        const cacheKey = `${age}_${goal}`;
        const cacheRef = db.doc(`aiSuggestionsCache/${cacheKey}`);

        const snapshot = await cacheRef.get();
        if (!snapshot.exists) {
            console.log(`[Cache] Miss: ${cacheKey}`);
            return null;
        }

        const data = snapshot.data() as CachedSuggestion;
        const now = new Date();
        const expiresAt = new Date(data.expiresAt);

        // 檢查是否過期
        if (now > expiresAt) {
            console.log(`[Cache] Expired: ${cacheKey}`);
            await cacheRef.delete();
            return null;
        }

        console.log(`[Cache] Hit: ${cacheKey}`);
        return data.suggestions;
    } catch (error) {
        console.error("[Cache] Error reading cache:", error);
        return null;
    }
}

/**
 * 將建議存入快取
 * @param age 兒童年齡
 * @param goal 目標類型
 * @param suggestions 建議陣列
 */
export async function setCachedSuggestion(
    age: number,
    goal: string,
    suggestions: string[]
): Promise<void> {
    try {
        const cacheKey = `${age}_${goal}`;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await db.doc(`aiSuggestionsCache/${cacheKey}`).set({
            age,
            goal,
            suggestions,
            createdAt: now.toISOString(),
            expiresAt: expiresAt.toISOString()
        });

        console.log(`[Cache] Saved: ${cacheKey}, expires at ${expiresAt.toISOString()}`);
    } catch (error) {
        console.error("[Cache] Error saving cache:", error);
        // 不拋出錯誤，快取失敗不應影響主流程
    }
}

/**
 * 清除過期的快取項目（可由排程任務調用）
 */
export async function cleanExpiredCache(): Promise<number> {
    try {
        const now = new Date();
        const cacheRef = db.collection('aiSuggestionsCache');
        const snapshot = await cacheRef.get();

        let deletedCount = 0;
        const batch = db.batch();

        snapshot.forEach((doc) => {
            const data = doc.data() as CachedSuggestion;
            const expiresAt = new Date(data.expiresAt);

            if (now > expiresAt) {
                batch.delete(doc.ref);
                deletedCount++;
            }
        });

        if (deletedCount > 0) {
            await batch.commit();
            console.log(`[Cache] Cleaned ${deletedCount} expired items`);
        }

        return deletedCount;
    } catch (error) {
        console.error("[Cache] Error cleaning cache:", error);
        return 0;
    }
}
