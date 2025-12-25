import React, { useState, useEffect } from 'react';
import { ApiError } from '../src/services/apiClient';

// ==========================================
// ErrorDisplay - 統一的錯誤 UI 組件
// ==========================================

interface ErrorDisplayProps {
    error: ApiError;
    onRetry?: () => void | Promise<void>;
    showRetryButton?: boolean;
    compact?: boolean; // 緊湊模式（用於卡片內）
    className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
    error,
    onRetry,
    showRetryButton = true,
    compact = false,
    className = ''
}) => {
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);

    // 如果有 retryAfter，啟動倒數計時
    useEffect(() => {
        if (error.retryAfter && error.canRetry) {
            setCountdown(error.retryAfter);

            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev === null || prev <= 1) {
                        clearInterval(timer);
                        return null;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [error.retryAfter, error.canRetry]);

    // 自動重試（當倒數結束時）
    useEffect(() => {
        if (countdown === 0 && onRetry && error.canRetry && showRetryButton) {
            handleRetry();
        }
    }, [countdown]);

    const handleRetry = async () => {
        if (!onRetry) return;

        setIsRetrying(true);
        try {
            await onRetry();
        } finally {
            setIsRetrying(false);
        }
    };

    // 根據錯誤類型選擇顏色主題
    const getColorTheme = () => {
        switch (error.type) {
            case 'rate_limit':
            case 'daily_limit':
                return {
                    bg: 'bg-yellow-50/80',
                    border: 'border-yellow-200',
                    text: 'text-yellow-800',
                    icon: '⏱️',
                    buttonBg: 'bg-yellow-500 hover:bg-yellow-600'
                };

            case 'circuit_breaker':
                return {
                    bg: 'bg-orange-50/80',
                    border: 'border-orange-200',
                    text: 'text-orange-800',
                    icon: '🔧',
                    buttonBg: 'bg-orange-500 hover:bg-orange-600'
                };

            case 'network':
                return {
                    bg: 'bg-red-50/80',
                    border: 'border-red-200',
                    text: 'text-red-800',
                    icon: '📡',
                    buttonBg: 'bg-red-500 hover:bg-red-600'
                };

            case 'auth':
                return {
                    bg: 'bg-purple-50/80',
                    border: 'border-purple-200',
                    text: 'text-purple-800',
                    icon: '🔐',
                    buttonBg: 'bg-purple-500 hover:bg-purple-600'
                };

            case 'timeout':
                return {
                    bg: 'bg-indigo-50/80',
                    border: 'border-indigo-200',
                    text: 'text-indigo-800',
                    icon: '⏰',
                    buttonBg: 'bg-indigo-500 hover:bg-indigo-600'
                };

            default:
                return {
                    bg: 'bg-gray-50/80',
                    border: 'border-gray-200',
                    text: 'text-gray-800',
                    icon: '⚠️',
                    buttonBg: 'bg-gray-500 hover:bg-gray-600'
                };
        }
    };

    const theme = getColorTheme();

    // 緊湊模式（用於小卡片）
    if (compact) {
        return (
            <div className={`rounded-lg border p-3 backdrop-blur-sm ${theme.bg} ${theme.border} ${className}`}>
                <div className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">{theme.icon}</span>
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${theme.text}`}>
                            {error.message}
                        </p>
                        {countdown !== null && countdown > 0 && (
                            <p className="text-xs text-gray-600 mt-1">
                                {countdown} 秒後自動重試...
                            </p>
                        )}
                    </div>
                </div>
                {showRetryButton && error.canRetry && onRetry && (
                    <button
                        onClick={handleRetry}
                        disabled={isRetrying || (countdown !== null && countdown > 0)}
                        className={`mt-2 w-full text-xs font-bold text-white py-1.5 px-3 rounded-lg transition-all ${theme.buttonBg} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isRetrying ? '重試中...' : countdown !== null && countdown > 0 ? `${countdown}秒後重試` : '🔄 立即重試'}
                    </button>
                )}
            </div>
        );
    }

    // 完整模式（用於獨立顯示）
    return (
        <div className={`rounded-2xl border-2 p-6 backdrop-blur-md shadow-lg ${theme.bg} ${theme.border} ${className}`}>
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center text-2xl shadow-sm">
                        {theme.icon}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className={`text-lg font-bold mb-2 ${theme.text}`}>
                        {getErrorTitle(error.type)}
                    </h3>

                    <p className={`text-sm leading-relaxed mb-4 ${theme.text}`}>
                        {error.message}
                    </p>

                    {/* 倒數計時進度條 */}
                    {countdown !== null && countdown > 0 && error.retryAfter && (
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-600">自動重試倒數</span>
                                <span className="text-xs font-bold text-gray-800">{countdown} 秒</span>
                            </div>
                            <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${theme.buttonBg.replace('hover:', '')}`}
                                    style={{
                                        width: `${((error.retryAfter - countdown) / error.retryAfter) * 100}%`
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* 操作按鈕 */}
                    <div className="flex gap-2">
                        {showRetryButton && error.canRetry && onRetry && (
                            <button
                                onClick={handleRetry}
                                disabled={isRetrying || (countdown !== null && countdown > 0)}
                                className={`flex-1 text-sm font-bold text-white py-2.5 px-4 rounded-xl transition-all shadow-md ${theme.buttonBg} disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
                            >
                                {isRetrying ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="animate-spin">⚙️</span>
                                        重試中...
                                    </span>
                                ) : countdown !== null && countdown > 0 ? (
                                    `${countdown} 秒後自動重試`
                                ) : (
                                    '🔄 立即重試'
                                )}
                            </button>
                        )}

                        {!error.canRetry && (
                            <div className="flex-1 text-center py-2 text-sm text-gray-600">
                                {getHelpText(error.type)}
                            </div>
                        )}
                    </div>

                    {/* 開發者資訊（僅在開發環境顯示） */}
                    {process.env.NODE_ENV === 'development' && error.technicalDetails && (
                        <details className="mt-4 text-xs">
                            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                                開發者資訊
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-900 text-green-400 rounded overflow-x-auto">
                                {error.technicalDetails}
                            </pre>
                        </details>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper: 獲取錯誤標題
function getErrorTitle(type: string): string {
    switch (type) {
        case 'rate_limit':
            return '系統使用量較高';
        case 'daily_limit':
            return '今日配額已用完';
        case 'circuit_breaker':
            return 'Goodi 暫時維護中';
        case 'network':
            return '網路連線問題';
        case 'auth':
            return '需要重新登入';
        case 'timeout':
            return '請求超時';
        default:
            return '發生錯誤';
    }
}

// Helper: 獲取幫助文字（不可重試時顯示）
function getHelpText(type: string): string {
    switch (type) {
        case 'daily_limit':
            return '明天會自動恢復，或聯繫客服升級方案';
        case 'auth':
            return '請重新整理頁面並重新登入';
        default:
            return '若問題持續，請聯繫客服協助';
    }
}

export default ErrorDisplay;
