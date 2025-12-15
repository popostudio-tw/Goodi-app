/**
 * AI 使用限制工具
 * 追蹤和管理 AI 功能的使用頻率限制
 */

export interface UsageLimitConfig {
    dailyLimit: number;    // 每日使用次數限制
    cooldownMs: number;    // 冷卻時間（毫秒）
}

export interface UsageRecord {
    count: number;         // 今日使用次數
    lastUsed: number;      // 最後使用時間戳記
    date: string;          // 記錄日期 (YYYY-MM-DD)
}

/**
 * 檢查是否可以使用 AI 功能
 * @param featureName - 功能名稱（用於 localStorage key）
 * @param config - 限制配置
 * @returns { allowed: boolean, reason?: string, remainingUses?: number, cooldownRemaining?: number }
 */
export const checkAiUsageLimit = (
    featureName: string,
    config: UsageLimitConfig
): {
    allowed: boolean;
    reason?: string;
    remainingUses?: number;
    cooldownRemaining?: number;
} => {
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `ai_usage_${featureName}`;

    // 取得使用記錄
    const storedData = localStorage.getItem(storageKey);
    let record: UsageRecord = storedData
        ? JSON.parse(storedData)
        : { count: 0, lastUsed: 0, date: today };

    // 如果日期不同，重置計數
    if (record.date !== today) {
        record = { count: 0, lastUsed: 0, date: today };
    }

    const now = Date.now();
    const timeSinceLastUse = now - record.lastUsed;

    // 檢查冷卻時間
    if (timeSinceLastUse < config.cooldownMs) {
        const cooldownRemaining = Math.ceil((config.cooldownMs - timeSinceLastUse) / 1000);
        return {
            allowed: false,
            reason: `請稍候 ${cooldownRemaining} 秒後再試`,
            cooldownRemaining
        };
    }

    // 檢查每日限制
    if (record.count >= config.dailyLimit) {
        return {
            allowed: false,
            reason: `今日使用次數已達上限 (${config.dailyLimit} 次)`,
            remainingUses: 0
        };
    }

    return {
        allowed: true,
        remainingUses: config.dailyLimit - record.count
    };
};

/**
 * 記錄 AI 功能使用
 * @param featureName - 功能名稱
 */
export const recordAiUsage = (featureName: string): void => {
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `ai_usage_${featureName}`;

    const storedData = localStorage.getItem(storageKey);
    let record: UsageRecord = storedData
        ? JSON.parse(storedData)
        : { count: 0, lastUsed: 0, date: today };

    // 如果日期不同，重置計數
    if (record.date !== today) {
        record = { count: 0, lastUsed: 0, date: today };
    }

    record.count += 1;
    record.lastUsed = Date.now();

    localStorage.setItem(storageKey, JSON.stringify(record));
};

/**
 * 取得剩餘使用次數
 * @param featureName - 功能名稱
 * @param dailyLimit - 每日限制
 */
export const getRemainingUses = (featureName: string, dailyLimit: number): number => {
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `ai_usage_${featureName}`;

    const storedData = localStorage.getItem(storageKey);
    if (!storedData) return dailyLimit;

    const record: UsageRecord = JSON.parse(storedData);

    // 如果日期不同，返回完整限制
    if (record.date !== today) return dailyLimit;

    return Math.max(0, dailyLimit - record.count);
};

// 預設配置
export const AI_USAGE_CONFIGS = {
    taskSuggester: {
        dailyLimit: 5,
        cooldownMs: 60000  // 1 分鐘
    },
    goalTaskGenerator: {
        dailyLimit: 5,
        cooldownMs: 60000  // 1 分鐘
    }
} as const;
