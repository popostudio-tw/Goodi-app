import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

/**
 * 獲取當天的「歷史上的今天」和「動物冷知識」
 * 從 Firestore facts/{year}/daily/{MMDD} 讀取靜態資料
 */
export const getDailyFacts = onCall<{ date?: string }>(async (request) => {
    try {
        const { date } = request.data || {};

        // 取得當前日期或使用傳入的日期
        const targetDate = date ? new Date(date) : new Date();
        const month = String(targetDate.getMonth() + 1).padStart(2, "0");
        const day = String(targetDate.getDate()).padStart(2, "0");
        const mmdd = `${month}${day}`;

        console.log(`📖 Fetching daily facts for ${mmdd}`);

        // 從 Firestore 讀取資料 - 優先檢查 2026 年的資料
        const db = getFirestore();

        // 先嘗試 2026 年的資料 (主要資料集)
        let factsDoc = await db
            .collection("facts")
            .doc("2026")
            .collection("daily")
            .doc(mmdd)
            .get();

        let year = "2026";

        // 如果 2026 沒有，嘗試 2025 年
        if (!factsDoc.exists) {
            console.log(`⚠️ No facts found in 2026/${mmdd}, trying 2025...`);
            factsDoc = await db
                .collection("facts")
                .doc("2025")
                .collection("daily")
                .doc(mmdd)
                .get();
            year = "2025";
        }

        if (!factsDoc.exists) {
            console.warn(`⚠️ No facts found for ${mmdd} in both 2025 and 2026`);
            return {
                success: false,
                error: "NO_DATA",
                message: `找不到 ${month}月${day}日 的資料`,
            };
        }

        const data = factsDoc.data();
        console.log(`✅ Successfully fetched facts for ${year}/${mmdd}`);

        return {
            success: true,
            data: {
                date: `${year}-${month}-${day}`,
                history: data?.history || "",
                animalFact: data?.animalFact || "",
            },
        };
    } catch (error: any) {
        console.error("❌ Error fetching daily facts:", error);
        throw new HttpsError("internal", `讀取每日內容失敗: ${error.message}`);
    }
}
);
