import { PricingTier, SubscriptionType } from '../types';
import { PromoCodeDiscount } from '../components/PromoCodeInput';

export interface PromoCodeValidation {
    isValid: boolean;
    reason?: string; // Reason for invalidity
    discount?: {
        originalPrice: number;
        discountAmount: number;
        finalPrice: number;
        discountPercentage: number;
    };
}

// Hardcoded promo codes for MVP
// In production, these should be fetched from Firestore
const PROMO_CODES: Record<string, PromoCodeDiscount> = {
    WELCOME30: {
        code: 'WELCOME30',
        discountType: 'percentage',
        discountValue: 30,
        validUntil: new Date('2026-12-31'),
        applicablePlans: ['advanced', 'premium'],
        description: '首次購買享 30% 折扣，僅限新用戶'
    },
    LUNAR15: {
        code: 'LUNAR15',
        discountType: 'percentage',
        discountValue: 15,
        validUntil: new Date('2026-02-15'),
        applicablePlans: ['advanced', 'premium'],
        description: '春節期間，月費版享 15% 折扣'
    },
    SUMMER20: {
        code: 'SUMMER20',
        discountType: 'percentage',
        discountValue: 20,
        validUntil: new Date('2026-08-31'),
        applicablePlans: ['advanced', 'premium'],
        description: '暑假特惠，享 20% 折扣'
    },
    EDUCATOR15: {
        code: 'EDUCATOR15',
        discountType: 'percentage',
        discountValue: 15,
        validUntil: new Date('2026-12-31'),
        applicablePlans: ['advanced', 'premium'],
        description: '教育工作者專享 15% 折扣'
    }
};

/**
 * Validate a promo code and calculate discount
 */
export const validatePromoCode = async (
    code: string,
    plan: PricingTier,
    subscriptionType: SubscriptionType,
    userId: string,
    currentPrice: number
): Promise<PromoCodeValidation> => {
    // Convert to uppercase for case-insensitive matching
    const upperCode = code.toUpperCase().trim();

    // 1. Check if promo code exists
    const promoData = PROMO_CODES[upperCode];
    if (!promoData) {
        return {
            isValid: false,
            reason: '無效的促銷碼'
        };
    }

    // 2. Check if expired
    const now = new Date();
    if (now > promoData.validUntil) {
        return {
            isValid: false,
            reason: '促銷碼已過期'
        };
    }

    // 3. Check if applicable to the selected plan
    if (!promoData.applicablePlans.includes(plan)) {
        return {
            isValid: false,
            reason: '此促銷碼不適用於所選方案'
        };
    }

    // 4. Calculate discount
    const discount = calculateDiscountedPrice(currentPrice, promoData);

    return {
        isValid: true,
        discount
    };
};

/**
 * Calculate discounted price based on promo code
 */
export const calculateDiscountedPrice = (
    originalPrice: number,
    promoCode: PromoCodeDiscount
): {
    originalPrice: number;
    discountAmount: number;
    finalPrice: number;
    discountPercentage: number;
} => {
    let discountAmount = 0;
    let discountPercentage = 0;

    if (promoCode.discountType === 'percentage') {
        discountPercentage = promoCode.discountValue;
        discountAmount = Math.round(originalPrice * (promoCode.discountValue / 100));
    } else if (promoCode.discountType === 'fixed') {
        discountAmount = promoCode.discountValue;
        discountPercentage = Math.round((discountAmount / originalPrice) * 100);
    }

    const finalPrice = Math.max(0, originalPrice - discountAmount);

    return {
        originalPrice,
        discountAmount,
        finalPrice,
        discountPercentage
    };
};

/**
 * Get promo code by code string (for testing)
 */
export const getPromoCode = (code: string): PromoCodeDiscount | undefined => {
    return PROMO_CODES[code.toUpperCase().trim()];
};

/**
 * Get all available promo codes (for admin/testing)
 */
export const getAllPromoCodes = (): PromoCodeDiscount[] => {
    return Object.values(PROMO_CODES);
};

