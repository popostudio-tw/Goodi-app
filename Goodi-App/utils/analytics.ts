import { analytics } from '../firebase';
import { logEvent, setUserProperties } from 'firebase/analytics';

// === 用戶行為追蹤 ===

/**
 * 追蹤用戶註冊
 */
export const trackSignUp = (method: string) => {
    if (!analytics) return;
    logEvent(analytics, 'sign_up', {
        method, // 'google'
    });
};

/**
 * 追蹤用戶登入
 */
export const trackLogin = (method: string) => {
    if (!analytics) return;
    logEvent(analytics, 'login', {
        method, // 'google'
    });
};

/**
 * 追蹤頁面瀏覽
 */
export const trackPageView = (pageName: string) => {
    if (!analytics) return;
    logEvent(analytics, 'page_view', {
        page_name: pageName,
        page_location: window.location.href,
        page_path: window.location.pathname,
    });
};

/**
 * 追蹤任務完成
 */
export const trackTaskComplete = (taskType: string) => {
    if (!analytics) return;
    logEvent(analytics, 'task_complete', {
        task_type: taskType,
    });
};

/**
 * 追蹤獎勵兌換
 */
export const trackRewardRedeem = (rewardName: string, cost: number) => {
    if (!analytics) return;
    logEvent(analytics, 'reward_redeem', {
        reward_name: rewardName,
        cost,
        currency: 'coins', // 代幣
    });
};

/**
 * 追蹤番茄鐘使用
 */
export const trackPomodoroComplete = (duration: number) => {
    if (!analytics) return;
    logEvent(analytics, 'pomodoro_complete', {
        duration_minutes: duration / 60,
    });
};

/**
 * 追蹤樹洞使用
 */
export const trackWhisperTreeUse = () => {
    if (!analytics) return;
    logEvent(analytics, 'whisper_tree_use');
};

/**
 * 追蹤成長報告生成
 */
export const trackGrowthReport = () => {
    if (!analytics) return;
    logEvent(analytics, 'growth_report_generate');
};

/**
 * 追蹤推薦碼使用
 */
export const trackReferralCodeUse = (success: boolean) => {
    if (!analytics) return;
    logEvent(analytics, 'referral_code_use', {
        success,
    });
};

/**
 * 追蹤方案查看（用戶查看付費方案）
 */
export const trackPlanView = (plan: string) => {
    if (!analytics) return;
    logEvent(analytics, 'plan_view', {
        plan_type: plan,
    });
};

/**
 * 追蹤錯誤
 */
export const trackError = (errorMessage: string, errorContext?: string) => {
    if (!analytics) return;
    logEvent(analytics, 'exception', {
        description: errorMessage,
        context: errorContext,
        fatal: false,
    });
};

/**
 * 設置用戶屬性
 */
export const setUserAnalyticsProperties = (properties: {
    plan?: string;
    age?: number;
    isTrialUser?: boolean;
}) => {
    if (!analytics) return;
    setUserProperties(analytics, properties);
};

// === 自動追蹤錯誤 ===
// 全局錯誤處理
if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
        trackError(event.error?.message || 'Unknown error', event.filename);
    });

    window.addEventListener('unhandledrejection', (event) => {
        trackError(event.reason?.message || 'Unhandled promise rejection', 'Promise');
    });
}
