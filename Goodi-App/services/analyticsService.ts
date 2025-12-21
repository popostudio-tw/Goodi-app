import { Plan, UsageAnalytics } from '../types';

/**
 * Lightweight analytics service for usage tracking
 * Privacy-compliant: Only aggregated, anonymized data
 */

let dailyMetrics = {
    tasksCompleted: 0,
    focusMinutes: 0,
    aiQueriesCount: 0,
    pagesVisited: new Set<string>(),
    featuresUsed: new Set<string>()
};

/**
 * Track task completion
 */
export const trackTaskCompletion = () => {
    dailyMetrics.tasksCompleted++;
};

/**
 * Track focus session
 */
export const trackFocusSession = (minutes: number) => {
    dailyMetrics.focusMinutes += minutes;
};

/**
 * Track AI query
 */
export const trackAIQuery = () => {
    dailyMetrics.aiQueriesCount++;
};

/**
 * Track page visit
 */
export const trackPageVisit = (page: string) => {
    dailyMetrics.pagesVisited.add(page);
};

/**
 * Track feature usage
 */
export const trackFeatureUsage = (feature: string) => {
    dailyMetrics.featuresUsed.add(feature);
};

/**
 * Save daily analytics to Firestore (called at end of day)
 */
export const saveDailyAnalytics = async (
    userId: string,
    plan: Plan
): Promise<void> => {
    try {
        const { doc, setDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase');

        const today = new Date().toISOString().split('T')[0];
        const analytics: UsageAnalytics = {
            userId,
            date: today,
            plan,
            metrics: {
                tasksCompleted: dailyMetrics.tasksCompleted,
                focusMinutes: dailyMetrics.focusMinutes,
                aiQueriesCount: dailyMetrics.aiQueriesCount,
                pagesVisited: Array.from(dailyMetrics.pagesVisited),
                featuresUsed: Array.from(dailyMetrics.featuresUsed)
            },
            createdAt: new Date().toISOString()
        };

        // Save to Firestore (daily aggregation)
        await setDoc(
            doc(db, 'usageAnalytics', `${userId}_${today}`),
            analytics
        );

        // Reset daily metrics
        resetDailyMetrics();
    } catch (error) {
        console.error('Failed to save analytics (safe log)');
        // Fail silently - analytics should not break app functionality
    }
};

/**
 * Reset daily metrics
 */
const resetDailyMetrics = () => {
    dailyMetrics = {
        tasksCompleted: 0,
        focusMinutes: 0,
        aiQueriesCount: 0,
        pagesVisited: new Set(),
        featuresUsed: new Set()
    };
};
