import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Cloud Function: getSystemStatus
 * 返回系統狀態資訊，包含熔斷器狀態和 API 使用量
 * 供前端監控和顯示
 */
export const getSystemStatus = onCall(
    async (request) => {
        const { auth } = request;

        // 驗證使用者是否登入
        if (!auth) {
            throw new HttpsError(
                "unauthenticated",
                "只有登入使用者才能查詢系統狀態。"
            );
        }

        try {
            const db = getFirestore();
            const today = getTodayDateStr();

            // 1. 讀取 Circuit Breaker 狀態
            let circuitBreakerState = {
                isOpen: false,
                opensAt: null as number | null,
                consecutiveFailures: 0,
            };

            try {
                const cbDoc = await db.collection('systemStatus').doc('circuitBreaker').get();
                if (cbDoc.exists) {
                    const data = cbDoc.data();
                    const now = Date.now();
                    const isOpen = data?.openUntil && data.openUntil > now;
                    circuitBreakerState = {
                        isOpen: isOpen || false,
                        opensAt: isOpen ? data.openUntil : null,
                        consecutiveFailures: data?.consecutiveFailures || 0,
                    };
                }
            } catch (error) {
                console.error('[getSystemStatus] Failed to read circuit breaker:', error);
            }

            // 2. 讀取今日 API 使用量
            let dailyUsage = {
                date: today,
                totalCalls: 0,
                limit: 200, // 從 geminiWrapper.ts 的 GLOBAL_DAILY_LIMIT
                callsPerSource: {} as Record<string, number>,
            };

            try {
                const usageDoc = await db.collection('apiUsage').doc(`global_${today}`).get();
                if (usageDoc.exists) {
                    const data = usageDoc.data();
                    dailyUsage = {
                        date: today,
                        totalCalls: data?.totalCalls || 0,
                        limit: 200,
                        callsPerSource: data?.callsPerSource || {},
                    };
                }
            } catch (error) {
                console.error('[getSystemStatus] Failed to read daily usage:', error);
            }

            // 3. 讀取最近一分鐘的速率限制狀態
            let rateLimit = {
                current: 0,
                limit: 10, // 從 geminiWrapper.ts 的 GLOBAL_RPM_LIMIT
            };

            // 注意：實際的速率限制計數在 geminiWrapper 中管理，這裡只返回配置值
            // 真實的 current 值需要從 geminiWrapper 暴露出來，這裡先返回 0

            return {
                success: true,
                timestamp: new Date().toISOString(),
                circuitBreaker: circuitBreakerState,
                dailyUsage,
                rateLimit,
            };

        } catch (error) {
            console.error('[getSystemStatus] Error:', error);
            throw new HttpsError(
                "internal",
                "無法獲取系統狀態，請稍後再試。"
            );
        }
    }
);

// Helper: 取得今日日期字串（YYYY-MM-DD）
function getTodayDateStr(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
