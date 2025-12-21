import { UserData, RedeemCode } from '../types';

/**
 * 生成唯一的推薦碼
 * @param prefix 前綴（如 GD, FB, IG）
 * @returns 推薦碼字符串（格式: PREFIX-XXXXXX）
 */
export function generateReferralCode(prefix: string = 'GD'): string {
    // 排除易混淆字符：0/O, 1/I
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';

    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return `${prefix}-${code}`;
}

/**
 * 生成兌換碼
 * @returns 兌換碼字符串（格式: REWARD-XXXXXX）
 */
export function generateRedeemCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';

    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return `REWARD-${code}`;
}

/**
 * 驗證推薦碼格式是否正確
 * @param code 推薦碼
 * @returns 是否有效
 */
export function validateReferralCode(code: string): boolean {
    if (!code) return false;

    // 轉換為大寫
    const upperCode = code.toUpperCase().trim();

    // 格式: PREFIX-XXXXXX (PREFIX 為 2-3 個字母，XXXXXX 為 6 個字母或數字)
    const pattern = /^[A-Z]{2,3}-[A-Z0-9]{6}$/;

    if (!pattern.test(upperCode)) return false;

    // 檢查是否包含易混淆字符
    const forbidden = /[01IO]/;
    if (forbidden.test(upperCode)) return false;

    return true;
}

/**
 * 標準化推薦碼（轉換為大寫並去除空格）
 * @param code 推薦碼
 * @returns 標準化後的推薦碼
 */
export function normalizeReferralCode(code: string): string {
    return code.toUpperCase().trim();
}

/**
 * 檢查用戶是否可以補登推薦碼（註冊後7天內）
 * @param userData 用戶資料
 * @returns 是否可以補登
 */
export function canAddReferralCode(userData: Partial<UserData>): boolean {
    // 如果已經有推薦人，不能再補登
    if (userData.referredBy) return false;

    // 如果沒有註冊時間，無法判斷
    if (!userData.createdAt) return false;

    const registrationDate = new Date(userData.createdAt);
    const now = new Date();

    // 計算天數差異
    const daysSinceRegistration = Math.floor(
        (now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceRegistration <= 7;
}

/**
 * 計算補登推薦碼剩餘天數
 * @param userData 用戶資料
 * @returns 剩餘天數（如果無法補登則返回 0）
 */
export function getRemainingDaysToAddReferral(userData: Partial<UserData>): number {
    if (!userData.createdAt) return 0;
    if (userData.referredBy) return 0;

    const registrationDate = new Date(userData.createdAt);
    const now = new Date();

    const daysSinceRegistration = Math.floor(
        (now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const remainingDays = 7 - daysSinceRegistration;
    return Math.max(0, remainingDays);
}

/**
 * 計算試用期結束日期（7天後）
 * @param startDate 開始日期（可選，預設為當前時間）
 * @returns 試用期結束日期（ISO string）
 */
export function calculateTrialEndDate(startDate?: Date): string {
    const start = startDate || new Date();
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + 7);
    return endDate.toISOString();
}

/**
 * 計算兌換碼過期時間（45天後）
 * @param startDate 開始日期（可選，預設為當前時間）
 * @returns 過期時間（ISO string）
 */
export function calculateRedeemCodeExpiry(startDate?: Date): string {
    const start = startDate || new Date();
    const expiryDate = new Date(start);
    expiryDate.setDate(expiryDate.getDate() + 45);
    return expiryDate.toISOString();
}

/**
 * 檢查兌換碼是否過期
 * @param redeemCode 兌換碼
 * @returns 是否過期
 */
export function isRedeemCodeExpired(redeemCode: RedeemCode): boolean {
    return new Date() > new Date(redeemCode.expiresAt);
}

/**
 * 獲取兌換碼剩餘天數
 * @param redeemCode 兌換碼
 * @returns 剩餘天數（如果已過期則返回 0）
 */
export function getRedeemCodeRemainingDays(redeemCode: RedeemCode): number {
    const now = new Date();
    const expiryDate = new Date(redeemCode.expiresAt);

    if (now > expiryDate) return 0;

    const remainingDays = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return Math.max(0, remainingDays);
}

/**
 * 檢查試用期是否已結束
 * @param userData 用戶資料
 * @returns 試用期是否已結束
 */
export function isTrialExpired(userData: Partial<UserData>): boolean {
    if (!userData.isTrialUser || !userData.planTrialEndDate) return false;
    return new Date() > new Date(userData.planTrialEndDate);
}

/**
 * 獲取試用期剩餘天數
 * @param userData 用戶資料
 * @returns 剩餘天數（如果不是試用用戶或已過期則返回 0）
 */
export function getTrialRemainingDays(userData: Partial<UserData>): number {
    if (!userData.isTrialUser || !userData.planTrialEndDate) return 0;

    const now = new Date();
    const endDate = new Date(userData.planTrialEndDate);

    if (now > endDate) return 0;

    const remainingDays = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return Math.max(0, remainingDays);
}

/**
 * 計算推薦進度百分比
 * @param referralCount 當前推薦數
 * @param milestone 目標里程碑（預設為5）
 * @returns 進度百分比（0-100）
 */
export function getReferralProgress(referralCount: number, milestone: number = 5): number {
    const currentMilestone = referralCount % milestone;
    return Math.round((currentMilestone / milestone) * 100);
}

/**
 * 獲取下一個里程碑
 * @param referralCount 當前推薦數
 * @param milestone 里程碑間隔（預設為5）
 * @returns 下一個里程碑數字
 */
export function getNextMilestone(referralCount: number, milestone: number = 5): number {
    return Math.ceil(referralCount / milestone) * milestone;
}

/**
 * 檢查是否達到里程碑
 * @param referralCount 推薦數
 * @param milestone 里程碑間隔（預設為5）
 * @returns 是否達到里程碑
 */
export function isAtMilestone(referralCount: number, milestone: number = 5): boolean {
    return referralCount > 0 && referralCount % milestone === 0;
}

/**
 * 格式化推薦碼（添加破折號）
 * 例如: GDA3K7M9 -> GD-A3K7M9
 * @param code 原始推薦碼
 * @returns 格式化後的推薦碼
 */
export function formatReferralCode(code: string): string {
    const upperCode = code.toUpperCase().trim();

    // 如果已經有破折號，直接返回
    if (upperCode.includes('-')) return upperCode;

    // 查找第一個數字或第三個字母的位置，在那裡插入破折號
    const match = upperCode.match(/^([A-Z]{2,3})([A-Z0-9]{6})$/);
    if (match) {
        return `${match[1]}-${match[2]}`;
    }

    return upperCode;
}

/**
 * 創建推薦連結
 * @param referralCode 推薦碼
 * @param baseUrl 基礎 URL（可選，預設為 production URL）
 * @returns 完整的推薦連結
 */
export function createReferralLink(
    referralCode: string,
    baseUrl: string = 'https://goodi-app.web.app'
): string {
    return `${baseUrl}?ref=${referralCode}`;
}

/**
 * 從 URL 中提取推薦碼
 * @param url URL 字符串或 window.location
 * @returns 推薦碼（如果存在）
 */
export function extractReferralCodeFromUrl(url?: string): string | null {
    try {
        const urlObj = url ? new URL(url) : new URL(window.location.href);
        const refParam = urlObj.searchParams.get('ref');

        if (refParam && validateReferralCode(refParam)) {
            return normalizeReferralCode(refParam);
        }

        return null;
    } catch (error) {
        console.error('Error extracting referral code from URL:', error);
        return null;
    }
}
