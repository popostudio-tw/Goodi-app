import { getFirestore, doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';

// ==========================================
// 金流服務層 - 統一的付款入口
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
 * 啟動 Premium 結帳流程
 * 
 * 這是所有金流的統一入口
 * 未來接 PayPal / Stripe / 綠界都只改這裡
 */
export async function startPremiumCheckout(
    userId: string,
    plan: BillingCycle
): Promise<{ success: boolean; message?: string }> {
    try {
        const db = getFirestore();
        const checkoutIntentRef = doc(db, 'users', userId, 'checkoutIntents', Date.now().toString());

        // 1. 記錄結帳意圖到 Firestore（用於追蹤轉化）
        await setDoc(checkoutIntentRef, {
            plan,
            createdAt: new Date().toISOString(),
            status: 'pending',
            amount: getPlanAmount(plan),
            currency: 'TWD'
        });

        console.log('[Billing] Checkout intent created:', { userId, plan });

        // TODO: 未來在此處整合真實金流
        // 選項 1: PayPal
        // const paypalUrl = await createPayPalCheckout(plan, userId);
        // window.location.href = paypalUrl;

        // 選項 2: Stripe
        // const stripeSession = await createStripeSession(plan, userId);
        // window.location.href = stripeSession.url;

        // 選項 3: 綠界 / 藍新
        // const ecpayForm = await createECPayCheckout(plan, userId);
        // submitECPayForm(ecpayForm);

        // 目前行為：直接導向說明頁（Coming Soon）
        return {
            success: true,
            message: 'checkout_intent_created'
        };

    } catch (error) {
        console.error('[Billing] Failed to start checkout:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        };
    }
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

function getPlanAmount(plan: BillingCycle): number {
    const pricing = {
        monthly: 599,
        yearly: 5990,
        lifetime: 19999
    };
    return pricing[plan];
}

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
