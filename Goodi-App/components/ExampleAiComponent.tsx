/**
 * AI 功能組件使用新錯誤處理機制的範例
 * 
 * 此文件展示如何在組件中使用新的 AI 錯誤處理機制
 */

import React, { useState } from 'react';
import { callAiFunctionWithRetry, AiCallResult } from '../src/services/aiClient';
import AiErrorMessage from './AiErrorMessage';
import { AiErrorInfo } from '../services/aiErrorHandler';

/**
 * 範例：使用新錯誤處理的 AI 組件
 */
export const ExampleAiComponent: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState<string>('');
    const [error, setError] = useState<AiErrorInfo | null>(null);
    const [retrying, setRetrying] = useState(false);

    // 主要的 AI 調用函數
    const fetchAiContent = async () => {
        setLoading(true);
        setError(null);

        // 使用帶重試機制的 AI 調用
        const result: AiCallResult = await callAiFunctionWithRetry(
            'generateDailyContent',  // Cloud Function 名稱
            { date: new Date().toISOString().split('T')[0] },  // 參數
            2,  // 最多重試2次
            'ExampleAiComponent'  // 錯誤上下文
        );

        setLoading(false);

        if (result.success && result.data) {
            setContent(result.data.todayInHistory || result.data.animalTrivia || '');
            setError(null);
        } else if (result.error) {
            setError(result.error);
        }
    };

    // 重試函數
    const handleRetry = async () => {
        setRetrying(true);
        await fetchAiContent();
        setRetrying(false);
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">AI 內容範例</h2>

            {/* 載入狀態 */}
            {loading && (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    <p className="mt-2 text-gray-600">Goodi 正在努力中...</p>
                </div>
            )}

            {/* 錯誤訊息 - 使用新的錯誤組件 */}
            {error && !loading && (
                <AiErrorMessage
                    error={error}
                    onRetry={handleRetry}
                    isRetrying={retrying}
                />
            )}

            {/* 內容顯示 */}
            {content && !error && !loading && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-gray-700">{content}</p>
                </div>
            )}

            {/* 初始載入按鈕 */}
            {!content && !error && !loading && (
                <button
                    onClick={fetchAiContent}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                >
                    載入 AI 內容
                </button>
            )}
        </div>
    );
};

/**
 * 使用指南：
 * 
 * 1. Import 必要的模組：
 *    - callAiFunctionWithRetry (帶重試的 AI 調用)
 *    - AiErrorMessage (錯誤提示組件)
 *    - AiErrorInfo (錯誤信息類型)
 * 
 * 2. 在組件中設置狀態：
 *    - error: AiErrorInfo | null (錯誤信息)
 *    - loading: boolean (載入狀態)
 *    - retrying: boolean (重試狀態)
 * 
 * 3. 使用 callAiFunctionWithRetry 調用 AI：
 *    const result = await callAiFunctionWithRetry(
 *      'functionName',
 *      params,
 *      maxRetries,
 *      context
 *    );
 * 
 * 4. 處理結果：
 *    if (result.success) {
 *      // 使用 result.data
 *    } else {
 *      // 設置 error 狀態為 result.error
 *    }
 * 
 * 5. 顯示錯誤（如果有）：
 *    {error && (
 *      <AiErrorMessage 
 *        error={error} 
 *        onRetry={handleRetry}
 *        isRetrying={retrying}
 *      />
 *    )}
 */

export default ExampleAiComponent;
