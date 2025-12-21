import React from 'react';

// ==========================================
// 亮點視覺卡組件
// ==========================================

export interface HighlightData {
    date: string;              // "2024-12-21"
    action: string;            // "主動完成數學作業"
    meaning: string;           // "他開始不害怕困難了"
    improvement: string;       // "專注時長 +34%"
    category: 'learning' | 'habit' | 'emotion' | 'social';
    metrics?: {
        courage?: number;        // 勇氣值
        focus?: number;          // 專注值
        discipline?: number;     // 自律值
    };
}

interface HighlightCardProps {
    data: HighlightData;
    isPremium: boolean;
    onSave?: () => void;
    onShare?: () => void;
    showMissedMessage?: boolean;  // 是否顯示「而你沒看到」
}

const HighlightCard: React.FC<HighlightCardProps> = ({
    data,
    isPremium,
    onSave,
    onShare,
    showMissedMessage = false
}) => {
    // 類別對應的圖標和顏色
    const categoryConfig = {
        learning: { icon: '📚', color: 'bg-blue-50 border-blue-200', emoji: '✓' },
        habit: { icon: '🔥', color: 'bg-orange-50 border-orange-200', emoji: '🔥' },
        emotion: { icon: '💚', color: 'bg-green-50 border-green-200', emoji: '💚' },
        social: { icon: '🤝', color: 'bg-purple-50 border-purple-200', emoji: '🌟' }
    };

    const config = categoryConfig[data.category];

    // 格式化日期
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}/${day}`;
    };

    return (
        <div className={`rounded-2xl border-2 p-6 ${config.color} shadow-md transition-all hover:shadow-lg`}>
            {/* 頂部：日期 + 類別圖標 */}
            <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-600 font-medium">
                    {formatDate(data.date)}
                </span>
                <span className="text-2xl">{config.icon}</span>
            </div>

            {/* 主要內容：今日亮點 */}
            <div className="mb-4">
                <div className="flex items-start gap-2 mb-2">
                    <span className="text-xl">{config.emoji}</span>
                    <div className="flex-1">
                        <p className="text-gray-800 font-semibold text-lg leading-tight">
                            {data.action}
                        </p>
                    </div>
                </div>

                {/* 「而你沒看到」提示（Free 用戶或特殊場景） */}
                {showMissedMessage && !isPremium && (
                    <p className="text-sm text-gray-500 italic mt-2 pl-8">
                        而你沒看到
                    </p>
                )}
            </div>

            {/* Premium 內容：這代表 + 進步指標 */}
            {isPremium ? (
                <>
                    <div className="mb-4 pl-8">
                        <p className="text-sm text-gray-700 leading-relaxed">
                            <span className="font-medium">這代表：</span>
                            {data.meaning}
                        </p>
                    </div>

                    {/* 微指標 */}
                    {data.metrics && (
                        <div className="flex gap-3 mb-4 pl-8">
                            {data.metrics.courage !== undefined && (
                                <div className="flex items-center gap-1 text-xs">
                                    <span className="text-orange-500">🦖</span>
                                    <span className="text-gray-600">勇氣</span>
                                    <span className="font-semibold text-orange-600">+{data.metrics.courage}</span>
                                </div>
                            )}
                            {data.metrics.focus !== undefined && (
                                <div className="flex items-center gap-1 text-xs">
                                    <span className="text-blue-500">👁️</span>
                                    <span className="text-gray-600">專注</span>
                                    <span className="font-semibold text-blue-600">{data.metrics.focus}分</span>
                                </div>
                            )}
                            {data.metrics.discipline !== undefined && (
                                <div className="flex items-center gap-1 text-xs">
                                    <span className="text-green-500">💪</span>
                                    <span className="text-gray-600">自律</span>
                                    <span className="font-semibold text-green-600">{data.metrics.discipline}次</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 進步提示 */}
                    <div className="bg-white bg-opacity-60 rounded-lg p-3 mb-4">
                        <p className="text-sm text-gray-700 font-medium">
                            你做得比上週好：{data.improvement}
                        </p>
                    </div>

                    {/* 操作按鈕 */}
                    <div className="flex gap-2">
                        {onSave && (
                            <button
                                onClick={onSave}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                                💾 收藏這一刻
                            </button>
                        )}
                        {onShare && (
                            <button
                                onClick={onShare}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                            >
                                📤 分享
                            </button>
                        )}
                    </div>
                </>
            ) : (
                /* Free 用戶：模糊預覽 + 升級提示 */
                <div className="relative">
                    <div className="blur-sm pointer-events-none select-none mb-4">
                        <p className="text-sm text-gray-400 leading-relaxed">
                            這代表：{data.meaning.substring(0, 10)}...
                        </p>
                        <div className="bg-white bg-opacity-40 rounded-lg p-3 mt-2">
                            <p className="text-sm text-gray-400">
                                你做得比上週好：***
                            </p>
                        </div>
                    </div>

                    {/* 升級 CTA */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <button
                            onClick={() => {
                                // 觸發升級流程（由父組件處理）
                                window.dispatchEvent(new CustomEvent('openPremiumUpgrade', {
                                    detail: { trigger: 'highlight_card' }
                                }));
                            }}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all transform hover:scale-105"
                        >
                            替孩子把這一刻留下來
                        </button>
                    </div>
                </div>
            )}

            {/* Free 用戶底部提示 */}
            {!isPremium && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        這張卡片 7 天後會永久消失
                    </p>
                </div>
            )}
        </div>
    );
};

export default HighlightCard;
