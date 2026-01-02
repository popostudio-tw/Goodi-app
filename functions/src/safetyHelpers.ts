/**
 * Safety Helpers for Tree Hole Feature
 * 
 * 兩階段安全檢查機制：
 * 1. 快速安全篩選（5-10秒）
 * 2. 生成溫暖回覆
 */

import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

export interface SafetyCheckResult {
    needsAttention: boolean;
    riskLevel: 'none' | 'low' | 'medium' | 'high';
    concerns: string[];
    detectedTopics: string[];
}

/**
 * 第一階段：快速安全檢查
 * 分析用戶訊息中的負面情緒、自傷風險、霸凌等內容
 */
export function analyzeSafetyRisk(message: string, aiResponse: string): SafetyCheckResult {
    const result: SafetyCheckResult = {
        needsAttention: false,
        riskLevel: 'none',
        concerns: [],
        detectedTopics: []
    };

    // 關鍵字詞檢測
    const highRiskKeywords = [
        '自殺', '死了算了', '不想活', '傷害自己', '割腕',
        '跳樓', '想死', '活著沒意義'
    ];

    const mediumRiskKeywords = [
        '霸凌', '被欺負', '被打', '被罵', '孤單',
        '沒有朋友', '很討厭自己', '很難過', '很痛苦',
        '爸媽吵架', '家暴', '被罵很兇'
    ];

    // 檢查高風險關鍵詞
    for (const keyword of highRiskKeywords) {
        if (message.includes(keyword)) {
            result.needsAttention = true;
            result.riskLevel = 'high';
            result.concerns.push('檢測到自傷風險');
            result.detectedTopics.push('selfHarm');
            break;
        }
    }

    // 檢查中風險關鍵詞
    if (result.riskLevel !== 'high') {
        for (const keyword of mediumRiskKeywords) {
            if (message.includes(keyword)) {
                result.needsAttention = true;
                result.riskLevel = 'medium';
                result.concerns.push('檢測到情緒困擾或人際問題');
                result.detectedTopics.push('emotionalDistress');
                break;
            }
        }
    }

    // 分析 AI 回覆中是否包含信任模式觸發詞
    const trustModeIndicators = [
        '跟爸爸媽媽說', '告訴大人', '需要幫助',
        '這很重要', '一起面對', '不是你的錯'
    ];

    for (const indicator of trustModeIndicators) {
        if (aiResponse.includes(indicator)) {
            result.needsAttention = true;
            if (result.riskLevel === 'none') {
                result.riskLevel = 'low';
            }
            break;
        }
    }

    return result;
}

/**
 * 記錄安全標記事件至 Firestore
 */
export async function logSafetyFlag(
    userId: string,
    message: string,
    safetyCheck: SafetyCheckResult
): Promise<void> {
    try {
        const flagRef = db.collection(`users/${userId}/safetyFlags`).doc();

        await flagRef.set({
            timestamp: new Date().toISOString(),
            message: message.substring(0, 200), // 僅保存前 200 字
            riskLevel: safetyCheck.riskLevel,
            concerns: safetyCheck.concerns,
            detectedTopics: safetyCheck.detectedTopics,
            trustModeTriggered: true,
            reviewed: false // 供家長端查看
        });

        console.log(`[Safety] Logged flag for user ${userId}, risk level: ${safetyCheck.riskLevel}`);
    } catch (error) {
        console.error("[Safety] Error logging safety flag:", error);
        // 不拋出錯誤，記錄失敗不應影響主流程
    }
}

/**
 * 檢查用戶近期是否有安全標記
 * 用於判斷是否應自動啟動信任模式
 */
export async function hasRecentSafetyFlags(userId: string, daysBack: number = 7): Promise<boolean> {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysBack);

        const flagsSnapshot = await db
            .collection(`users/${userId}/safetyFlags`)
            .where('timestamp', '>=', cutoffDate.toISOString())
            .limit(1)
            .get();

        return !flagsSnapshot.empty;
    } catch (error) {
        console.error("[Safety] Error checking recent flags:", error);
        return false;
    }
}

/**
 * 生成信任模式 prompt
 * 當檢測到風險時使用更溫暖、引導性的 prompt
 */
export function getTrustModePrompt(userMessage: string, riskLevel: string): string {
    const basePrompt = `你是 Goodi，一個溫暖、充滿同理心的 AI 朋友。孩子剛剛跟你分享了他們的心事：

「${userMessage}」

重要指引：
1. **情感連結優先**：先讓孩子感受到被理解和接納
2. **溫柔引導**：用「聽起來...」、「感覺...」等同理性語言
3. **鼓勵求助**：`;

    if (riskLevel === 'high') {
        return basePrompt + `這是一個需要大人幫忙的情況。溫柔但堅定地告訴孩子：
   - 這不是他們的錯
   - 有大人可以幫忙
   - 鼓勵他們向信任的大人（爸媽、老師、輔導老師）求助
   - 強調「一起面對會更好」

4. **長度**：80-120 字
5. **語氣**：溫暖、理解、不批判、給予希望`;
    } else if (riskLevel === 'medium') {
        return basePrompt + `孩子可能正經歷一些情緒困擾。回應時：
   - 驗證他們的感受（「這樣感覺確實不舒服」）
   - 提供簡單的情緒調節建議
   - 建議可以跟信任的人聊聊
   - 給予鼓勵和希望

4. **長度**：80-100 字
5. **語氣**：溫暖、支持、樂觀`;
    } else {
        return basePrompt + `給予溫暖的陪伴回應：
   - 認可他們願意分享的勇氣
   - 提供適當的鼓勵或建議
   - 保持正向、支持的態度

4. **長度**：60-80 字
5. **語氣**：友善、鼓勵、陪伴`;
    }
}

/**
 * 生成一般鼓勵 prompt（無風險情況）
 */
export function getEncouragementPrompt(userMessage: string): string {
    return `你是 Goodi，孩子的 AI 好朋友。孩子跟你分享：「${userMessage}」

請給予溫暖、鼓勵的回應：
- 認可他們的感受或想法
- 提供正向的觀點或建議
- 保持輕鬆、友善的語氣

長度：50-80 字`;
}
