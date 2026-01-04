// import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { callGemini, shouldUseFallback } from "../geminiWrapper";

/**
 * Fallback 語句庫（三組不同的溫馨回應）
 */
const FALLBACK_MESSAGES = [
    "吼吼～昨天你真的很棒喔！Goodi 有看到你的努力，今天也要一起加油！🦕",
    "嘎～Goodi 的恐龍雷達偵測到你昨天超認真的！繼續保持，我們一起變得更厲害！💪🦖",
    "吼嗚！昨天的你讓 Goodi 好感動～今天也要開開心心地挑戰新任務喔！❤️🦕"
];

/**
 * 核心邏輯：生成指定用戶的昨日總結
 * 
 * 優化重點：
 * 1. Goodi 恐龍個性化語氣（活潑、擬聲詞）
 * 2. 根據任務完成數分層鼓勵
 * 3. 多樣化 Fallback 機制
 */
export async function generateYesterdaySummaryForUser(
    userId: string,
    userData: any,
    yesterdayStr: string
): Promise<string> {
    const nickname = userData.userProfile?.nickname || '小朋友';

    // 計算昨天的範圍 (毫秒)
    const startTime = new Date(yesterdayStr).getTime();
    const endTime = startTime + 24 * 60 * 60 * 1000;

    const yesterdayTasks = (userData.transactions || []).filter((t: any) =>
        t.timestamp >= startTime && t.timestamp < endTime && t.description?.startsWith('完成任務')
    );

    const yesterdayJournals = (userData.journalEntries || []).filter((j: any) =>
        j.author === 'user' && new Date(j.date).getTime() >= startTime && new Date(j.date).getTime() < endTime
    );

    const taskCount = yesterdayTasks.length;

    // === 分層鼓勵邏輯 ===
    let encouragementLevel = '';
    let encouragementTone = '';

    if (taskCount === 0) {
        // 0 個任務：溫暖擁抱
        if (yesterdayJournals.length === 0) {
            return `吼呜～${nickname} 昨天給自己放了一個小長假呢！休息是為了明天更有力氣，Goodi 陪你一起充充電，準備好迎接新挑戰吧！🦖💤`;
        }
        encouragementLevel = 'rest';
        encouragementTone = '溫柔地給予擁抱和支持，告訴孩子休息也很重要，Goodi 永遠陪著他。';
    } else if (taskCount >= 1 && taskCount <= 3) {
        // 1-3 個任務：具體誇獎
        encouragementLevel = 'good';
        encouragementTone = '具體誇獎孩子的努力，用「吼吼～」開頭，說他的進步讓 Goodi 的背鰭都亮起來了！要有活力和親切感。';
    } else if (taskCount >= 4 && taskCount <= 5) {
        // 4-5 個任務：很棒的表現
        encouragementLevel = 'great';
        encouragementTone = '用「嘎～」或「吼嗚！」開頭，超級興奮地誇獎，說 Goodi 看到他的努力整個恐龍尾巴都搖起來了！';
    } else {
        // 5+ 個任務：超級大變身誇獎
        encouragementLevel = 'amazing';
        encouragementTone = '用「吼吼吼！」開頭，超級激動地大變身誇獎，說 Goodi 的恐龍能量條都爆表了！充滿成就感和驕傲！';
    }

    // === 構建 AI Prompt ===
    const prompt = `你是「Goodi 恐龍」，一隻活潑、親切、充滿活力的 AI 恐龍，是 ${nickname} 最好的朋友！

**你的語氣特色**：
- 說話要有恐龍的可愛感，多用擬聲詞：「吼吼～」「嘎～」「吼嗚！」「嘎嗚」
- 像好朋友一樣聊天，溫暖且充滿正能量
- 不要使用條列式，要像一段有溫度的話語
- 適合 5-12 歲的孩子理解

**昨天的小數據**：
- 完成任務：${taskCount} 個
- 提到的心事：${yesterdayJournals.map((j: any) => j.text.substring(0, 30)).join('；') || '無'}

**鼓勵層次**：${encouragementLevel}
${encouragementTone}

**內容要求**（總共 80-120 字）：
1. **開場**：用適合層次的擬聲詞開頭（吼吼/嘎/吼嗚）
2. **具體誇獎**：提到完成了幾個任務，展現你的觀察
3. **心事回應**（如果有）：簡短溫暖地回應孩子分享的心事
4. **恐龍式鼓勵**：用恐龍的方式表達驕傲（例如：背鰭亮了、尾巴搖了、能量條滿了）
5. **溫暖結尾**：充滿希望，鼓勵今天也要開開心心！

**範例語氣**：
- 好的範例：「吼吼～${nickname}！昨天完成了 3 個任務，Goodi 的背鰭都亮起來了！」
- 避免：「你昨天表現很好。」（太正式、沒有恐龍感）

**僅輸出總結文字，不要標題或其他內容。**`;

    try {
        // 使用 wrapper 呼叫 AI
        const result = await callGemini({
            source: 'summary',
            userId,
            prompt,
            model: "gemini-2.0-flash",
            config: {
                temperature: 0.9, // 提高創意度
            },
        });

        if (shouldUseFallback(result)) {
            // 隨機選擇一個 Fallback 訊息
            const randomIndex = Math.floor(Math.random() * FALLBACK_MESSAGES.length);
            return FALLBACK_MESSAGES[randomIndex];
        }

        return result.text || FALLBACK_MESSAGES[0];
    } catch (error) {
        console.error(`Gemini summary generation error for ${userId}:`, error);
        // 隨機選擇一個 Fallback 訊息
        const randomIndex = Math.floor(Math.random() * FALLBACK_MESSAGES.length);
        return FALLBACK_MESSAGES[randomIndex];
    }
}

/**
 * 核心邏輯：生成指定用戶的週報
 */
export async function generateWeeklyReportForUser(
    userId: string,
    userData: any
): Promise<string> {
    const { userProfile, transactions, scoreHistory, journalEntries } = userData;
    const nickname = userProfile?.nickname || '小朋友';
    const age = userProfile?.age || '未知';

    // 計算過去 7 天的資料
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const weeklyTasks = (transactions || []).filter((t: any) =>
        t.timestamp >= sevenDaysAgo && t.description?.startsWith('完成任務')
    );

    const weeklyScores = (scoreHistory || []).filter((s: any) =>
        new Date(s.date).getTime() >= sevenDaysAgo
    );

    const weeklyJournals = (journalEntries || []).filter((j: any) =>
        j.author === 'user' && new Date(j.date).getTime() >= sevenDaysAgo
    );

    const prompt = `
你是一位溫暖、有洞察力的兒童發展專家 Goodi。請根據以下資料，為一位名叫「${nickname}」(${age}歲) 的孩子家長撰寫一份富有溫度的成長週報。

本週行為數據：
- 完成任務次數：${weeklyTasks.length} 次
- 學業成績表現：${weeklyScores.map((s: any) => `${s.subject}:${s.score}`).join(', ') || '本週無回報紀錄'}
- 心情分享紀錄：${weeklyJournals.slice(0, 3).map((j: any) => j.text).join('; ') || '無文字紀錄'}

報告撰寫要求：
1. 使用繁體中文，保持溫柔且專業的口吻。
2. 使用 Markdown 格式。
3. 表達對孩子本週努力的肯定，並將數據轉化為成長的視覺化描述。
4. 提供一個專屬於下週的「高品質親子時光」具體建議。

內容結構：
### ✨ 成長光芒記錄
[描述孩子本週最大的進步或完成任務的毅力]

### 🎓 智慧果實觀察
[針對成績或學習狀況給予鼓勵，並建議如何保持動力]

### 🌱 心靈小苗關懷
[如果孩子的心情紀錄中有情緒，請溫柔分析；若無則鼓勵家長本週安排一次深度對話]

### 🦖 Goodi 的暖心家務建議
[提供一個具體的親子互動或鼓勵策略]
  `;

    // 使用 wrapper 呼叫 AI
    const result = await callGemini({
        source: 'weekly',
        userId,
        prompt,
        model: "gemini-2.0-flash"
    });

    if (shouldUseFallback(result)) {
        return "本週報告生成中，請稍候...";
    }

    return result.text || "本週報告生成中，請稍候...";
}

// Helper: 計算週 Key
export function getWeekKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const start = new Date(year, 0, 1);
    const diff = now.getTime() - start.getTime() + ((start.getDay() + 1) * 24 * 60 * 60 * 1000);
    const oneWeek = 604800000;
    const weekNumber = Math.floor(diff / oneWeek);
    return `${year}-W${weekNumber}`;
}
