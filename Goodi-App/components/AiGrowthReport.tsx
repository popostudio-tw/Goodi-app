
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useUserData } from '../UserContext';
import { Task, JournalEntry, Achievement } from '../types';

const Modal: React.FC<{ children: React.ReactNode; onClose: () => void; title: string; }> = ({ children, onClose, title }) => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl p-6 max-w-lg w-full transform transition-all animate-fade-in scale-95" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-700">{title}</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full text-2xl leading-none">&times;</button>
            </div>
            {children}
        </div>
    </div>
);

const AiGrowthReport: React.FC<{ onClose: () => void; }> = ({ onClose }) => {
    const { userData } = useUserData();
    const { userProfile, tasks, journalEntries, achievements } = userData;
    const [report, setReport] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY as string }), []);

    useEffect(() => {
        const generateReport = async () => {
            const recentCompletedTasks = tasks
                .filter(t => t.completed)
                .slice(0, 10)
                .map(t => `- ${t.text} (${t.category})`);

            const recentJournalThemes = journalEntries
                .slice(-5)
                .filter(j => j.author === 'user')
                .map(j => `- "${j.text}"`);
            
            const recentAchievements = achievements
                .filter(a => a.unlocked)
                .slice(-5)
                .map(a => `- ${a.title}`);

            const prompt = `
                你是一位溫暖、有洞察力的兒童發展專家，名叫 Goodi。請根據以下資料，為一位名叫「${userProfile.nickname}」(${userProfile.age || '未知'}歲) 的孩子的家長，撰寫一份約 200-300 字的繁體中文成長週報。

                報告應包含以下部分，並使用 Markdown 格式化 (例如用 **標題** 和 - 列表)：
                1.  **開頭問候**：親切地問候家長。
                2.  **本週亮點**：根據孩子最近完成的任務和成就，給予具體、正面的讚美。強調他們的努力和進步。
                3.  **心情悄悄話 (如果有的話)**：如果孩子有分享心事，請溫和地總結其中的情緒主題（不要直接引用原文），並建議家長可以如何關心與討論。如果沒有心事分享，可以鼓勵家長多與孩子聊天。
                4.  **鼓勵與建議**：根據孩子的表現，提供 1-2 個具體、可行的鼓勵方向或親子互動建議。
                5.  **結尾**：用一句溫暖的話語作結。

                請保持語氣正向、 supportive、並且充滿鼓勵。避免使用負面或指責的詞語。

                ---
                **近期完成的任務：**
                ${recentCompletedTasks.length > 0 ? recentCompletedTasks.join('\n') : '無'}

                **近期解鎖的成就：**
                ${recentAchievements.length > 0 ? recentAchievements.join('\n') : '無'}

                **近期心事分享的主題：**
                ${recentJournalThemes.length > 0 ? recentJournalThemes.join('\n') : '無'}
                ---
            `;

            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                });
                setReport(response.text);
            } catch (error) {
                console.error("AI Growth Report Error:", error);
                setReport("抱歉，產生報告時發生錯誤。請稍後再試。");
            } finally {
                setIsLoading(false);
            }
        };

        generateReport();
    }, [ai, userProfile, tasks, journalEntries, achievements]);

    const renderMarkdown = (text: string) => {
        const html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-800">$1</strong>')
            .replace(/^- (.*$)/gm, '<li class="list-disc ml-4">$1</li>')
            .replace(/<\/li><br \/>/g, '</li>')
            .replace(/\n/g, '<br />');
        return <div dangerouslySetInnerHTML={{ __html: html }} />;
    };

    return (
        <Modal onClose={onClose} title={`${userProfile.nickname} 的 AI 成長報告`}>
            <div className="max-h-[60vh] overflow-y-auto pr-2 text-base leading-relaxed text-gray-600 custom-scrollbar">
                {isLoading ? (
                    <div className="text-center p-8">
                        <img src="https://static.wixstatic.com/media/ec806c_e706428e2f4d41c1b58f889f8d0efbe8~mv2.png" alt="Loading..." className="w-16 h-16 mx-auto animate-bounce"/>
                        <p className="mt-4 font-semibold text-gray-600">Goodi 正在為您分析與撰寫報告...</p>
                    </div>
                ) : (
                    <div className="prose prose-sm max-w-none space-y-2">
                        {renderMarkdown(report)}
                    </div>
                )}
            </div>
            <div className="flex justify-end mt-4">
                <button onClick={onClose} className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors">關閉</button>
            </div>
        </Modal>
    );
};

export default AiGrowthReport;
