import { Plan, PricingTier, SubscriptionType, UserData } from '../types';

/**
 * Extract pricing tier from plan
 */
export const getPricingTier = (plan: Plan): PricingTier => {
    if (plan === 'free') return 'free';
    if (plan.includes('advanced') || plan === 'paid199') return 'advanced';
    if (plan.includes('premium') || plan === 'paid499') return 'premium';
    return 'free';
};

/**
 * Extract subscription type from plan
 */
export const getSubscriptionType = (plan: Plan): SubscriptionType => {
    if (plan.includes('lifetime')) return 'lifetime';
    return 'monthly';
};

/**
 * Check if user has advanced or premium access (not free)
 */
export const hasAdvancedAccess = (plan: Plan): boolean => {
    return plan !== 'free';
};

/**
 * Check if user has premium access
 */
export const hasPremiumAccess = (plan: Plan): boolean => {
    const tier = getPricingTier(plan);
    return tier === 'premium';
};

/**
 * Check if plan is a lifetime plan
 */
export const isLifetimePlan = (plan: Plan): boolean => {
    return plan.includes('lifetime');
};

/**
 * Check if user needs to provide their own Gemini API Key
 * (Lifetime premium users need to provide their own key)
 */
export const needsGeminiApiKey = (plan: Plan): boolean => {
    return isLifetimePlan(plan) && hasPremiumAccess(plan);
};

/**
 * Check if user has access to Gemini AI features
 * Premium users have access if:
 * - Monthly plan: always (Goodi provides API key)
 * - Lifetime plan: only if they provided a valid API key
 */
export const hasGeminiAccess = (userData: UserData): boolean => {
    const { plan, geminiApiKey } = userData;

    // Only premium users have AI features
    if (!hasPremiumAccess(plan)) return false;

    // Monthly premium users always have access (Goodi's API key)
    if (!isLifetimePlan(plan)) return true;

    // Lifetime premium users need to provide their own API key
    return !!geminiApiKey && geminiApiKey.length > 0;
};

/**
 * Get plan display name in Chinese
 */
export const getPlanDisplayName = (plan: Plan): string => {
    const tier = getPricingTier(plan);
    const type = getSubscriptionType(plan);

    const tierNames: Record<PricingTier, string> = {
        free: '免費版',
        advanced: '進階版',
        premium: '高級版'
    };

    const typeNames: Record<SubscriptionType, string> = {
        monthly: '月費',
        lifetime: '買斷'
    };

    if (tier === 'free') return tierNames.free;
    return `${tierNames[tier]} (${typeNames[type]})`;
};

/**
 * Get monthly price for a plan
 */
export const getMonthlyPrice = (tier: PricingTier): number => {
    switch (tier) {
        case 'advanced': return 99;
        case 'premium': return 199;
        case 'free': return 0;
        default: return 0;
    }
};

/**
 * Get lifetime price for a plan
 */
export const getLifetimePrice = (tier: PricingTier): number => {
    switch (tier) {
        case 'advanced': return 1499;
        case 'premium': return 1999;
        case 'free': return 0;
        default: return 0;
    }
};
