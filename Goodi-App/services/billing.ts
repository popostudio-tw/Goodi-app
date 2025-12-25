import { getFirestore, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';

// ==========================================
// 金流服務層 - 會員管理
// ==========================================

export type BillingCycle = 'monthly' | 'yearly' | 'lifetime';
export type PlanType = 'free' | 'premium';

export interface MembershipData {
    plan: PlanType;
    billingCycle: BillingCycle | null;
    upgradedAt: Timestamp | null;
    expiresAt: Timestamp | null;
    checkoutIntents?: Array<{
        plan: BillingCycle;
        createdAt: string;
        status: 'pending' | 'completed' | 'failed';
    }>;
}

/**
 * 升級用戶為 Premium（僅供測試/後台使用）
 * 
 * 實際生產環境應該由後端 webhook 呼叫
 * 但在金流接通前，可以手動升級用戶來測試 Premium 功能
 */
export async function upgradeToPremium(
    userId: string,
    billingCycle: BillingCycle
): Promise<void> {
    const db = getFirestore();
    const membershipRef = doc(db, 'users', userId, 'membership', 'current');

    const now = Timestamp.now();
    const expiresAt = billingCycle === 'lifetime'
        ? null
        : Timestamp.fromDate(new Date(Date.now() + getDurationInMs(billingCycle)));

    await setDoc(membershipRef, {
        plan: 'premium' as PlanType,
        billingCycle,
        upgradedAt: now,
        expiresAt,
        lastUpdated: new Date().toISOString()
    });

    console.log('[Billing] User upgraded to Premium:', { userId, billingCycle });
}

/**
 * 獲取用戶的 Premium 狀態
 */
export async function getUserMembership(userId: string): Promise<MembershipData | null> {
    try {
        const db = getFirestore();
        const membershipRef = doc(db, 'users', userId, 'membership', 'current');
        const membershipSnap = await getDoc(membershipRef);

        if (membershipSnap.exists()) {
            return membershipSnap.data() as MembershipData;
        }

        // 如果沒有 membership 文件，返回預設的 free
        return {
            plan: 'free',
            billingCycle: null,
            upgradedAt: null,
            expiresAt: null
        };
    } catch (error) {
        console.error('[Billing] Failed to get membership:', error);
        return null;
    }
}

/**
 * 檢查用戶是否為 Premium
 */
export async function isPremiumUser(userId: string): Promise<boolean> {
    const membership = await getUserMembership(userId);
    if (!membership) return false;

    // 檢查是否過期
    if (membership.expiresAt) {
        const now = Date.now();
        const expiresAtMs = membership.expiresAt.toMillis();
        if (now > expiresAtMs) {
            return false; // 已過期
        }
    }

    return membership.plan === 'premium';
}

// ==========================================
// Helper Functions
// ==========================================

function getDurationInMs(billingCycle: BillingCycle): number {
    const durations = {
        monthly: 30 * 24 * 60 * 60 * 1000,  // 30 天
        yearly: 365 * 24 * 60 * 60 * 1000,  // 365 天
        lifetime: 999 * 365 * 24 * 60 * 60 * 1000  // 999 年（實際上是終身）
    };
    return durations[billingCycle];
}

/**
 * 測試模式：直接完成結帳（僅開發環境）
 * 
 * 生產環境應該透過 webhook 完成
 */
export async function testCompleteCheckout(
    userId: string,
    plan: BillingCycle
): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Test checkout is not allowed in production');
    }

    await upgradeToPremium(userId, plan);
    console.log('[Billing] Test checkout completed:', { userId, plan });
}
