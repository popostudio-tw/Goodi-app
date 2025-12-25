import React from 'react';
import { AiErrorInfo } from '../services/aiErrorHandler';

interface AiErrorMessageProps {
    error: AiErrorInfo;
    onRetry?: () => void;
    isRetrying?: boolean;
}

/**
 * AI 錯誤提示組件
 * 統一的、用戶友善的錯誤顯示 UI
 */
const AiErrorMessage: React.FC<AiErrorMessageProps> = ({
    error,
    onRetry,
    isRetrying = false
}) => {
    return (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 my-4 animate-fade-in">
            {/* 錯誤圖示和主訊息 */}
            <div className="flex items-start gap-3 mb-3">
                <div className="text-3xl flex-shrink-0 mt-1">
                    {error.type === 'network_error' && '📡'}
                    {error.type === 'not_found' && '🔍'}
                    {(error.type === 'daily_limit' ||
                        error.type === 'rate_limit' ||
                        error.type === 'circuit_breaker' ||
                        error.type === 'concurrency_limit') && '🦖'}
                    {(error.type === 'api_error' || error.type === 'unknown') && '⚠️'}
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-lg mb-1">
                        {error.userMessage}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        {error.action}
                    </p>
                </div>
            </div>

            {/* 重試按鈕 */}
            {error.canRetry && onRetry && (
                <div className="mt-4 flex justify-center">
                    <button
                        onClick={onRetry}
                        disabled={isRetrying}
                        className={`
              px-6 py-2.5 rounded-lg font-semibold text-sm
              transition-all duration-200
              ${isRetrying
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg transform hover:scale-105'
                            }
            `}
                    >
                        {isRetrying ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                處理中...
                            </span>
                        ) : (
                            <>
                                🔄 重試
                                {error.retryAfterSeconds && error.retryAfterSeconds > 10 && (
                                    <span className="text-xs ml-1">({error.retryAfterSeconds}秒後)</span>
                                )}
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* 技術詳情（僅開發環境） */}
            {process.env.NODE_ENV === 'development' && (
                <details className="mt-3 text-xs">
                    <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                        技術詳情（僅開發環境顯示）
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-gray-700 overflow-auto">
                        {JSON.stringify({
                            type: error.type,
                            message: error.technicalMessage
                        }, null, 2)}
                    </pre>
                </details>
            )}
        </div>
    );
};

export default AiErrorMessage;
