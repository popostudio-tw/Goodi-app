import React, { useState } from 'react';
import { validateGeminiApiKey } from '../services/geminiApiService';

interface GeminiApiKeyManagerProps {
    currentKey?: string;
    onSave: (key: string) => void;
    onValidate?: () => void;
}

const GeminiApiKeyManager: React.FC<GeminiApiKeyManagerProps> = ({
    currentKey,
    onSave,
    onValidate,
}) => {
    const [apiKey, setApiKey] = useState(currentKey || '');
    const [isValidating, setIsValidating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [validationStatus, setValidationStatus] = useState<'valid' | 'invalid' | 'pending' | null>(
        currentKey ? 'valid' : null
    );
    const [showKey, setShowKey] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleValidate = async () => {
        if (!apiKey.trim()) {
            setError('請輸入 API Key');
            return;
        }

        setIsValidating(true);
        setError(null);

        try {
            const isValid = await validateGeminiApiKey(apiKey.trim());
            setValidationStatus(isValid ? 'valid' : 'invalid');

            if (!isValid) {
                setError('API Key 無效，請檢查是否正確');
            }
        } catch (err) {
            console.error('API Key validation error:', err);
            setError('驗證 API Key 時發生錯誤');
            setValidationStatus('invalid');
        } finally {
            setIsValidating(false);
        }
    };

    const handleSave = async () => {
        if (validationStatus !== 'valid') {
            setError('請先驗證 API Key');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await onSave(apiKey.trim());
            if (onValidate) onValidate();
        } catch (err) {
            console.error('API Key save error:', err);
            setError('保存 API Key 時發生錯誤');
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusIcon = () => {
        switch (validationStatus) {
            case 'valid':
                return '✅';
            case 'invalid':
                return '❌';
            case 'pending':
                return '⏳';
            default:
                return '⚠️';
        }
    };

    const getStatusText = () => {
        switch (validationStatus) {
            case 'valid':
                return '已驗證';
            case 'invalid':
                return '無效';
            case 'pending':
                return '驗證中';
            default:
                return '未驗證';
        }
    };

    const getStatusColor = () => {
        switch (validationStatus) {
            case 'valid':
                return 'text-green-600';
            case 'invalid':
                return 'text-red-600';
            case 'pending':
                return 'text-amber-600';
            default:
                return 'text-gray-500';
        }
    };

    return (
        <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md p-6 border border-white/50 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-gray-700 flex items-center gap-2">
                    <img
                        src="https://api.iconify.design/twemoji/key.svg"
                        alt="key"
                        className="w-5 h-5"
                    />
                    Gemini API Key 管理
                </h3>
                <div className={`text-sm font-semibold ${getStatusColor()}`}>
                    {getStatusIcon()} {getStatusText()}
                </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <p className="font-semibold mb-1">💡 買斷版用戶需提供自己的 Gemini API Key</p>
                <p className="text-xs text-blue-700">
                    您可以在
                    <a
                        href="https://aistudio.google.com/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-semibold mx-1 hover:text-blue-900"
                    >
                        Google AI Studio
                    </a>
                    免費取得 API Key
                </p>
            </div>

            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        API Key
                    </label>
                    <div className="relative">
                        <input
                            type={showKey ? 'text' : 'password'}
                            value={apiKey}
                            onChange={(e) => {
                                setApiKey(e.target.value);
                                setValidationStatus(null);
                                setError(null);
                            }}
                            placeholder="輸入您的 Gemini API Key"
                            className="w-full px-3 py-2 pr-20 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white"
                            disabled={isValidating || isSaving}
                        />
                        <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xs font-semibold px-2 py-1"
                        >
                            {showKey ? '隱藏' : '顯示'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-300 rounded-lg p-3 flex items-start gap-2">
                        <span className="text-red-500 text-sm">⚠️</span>
                        <p className="text-red-700 text-sm flex-1">{error}</p>
                    </div>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={handleValidate}
                        disabled={isValidating || !apiKey.trim() || isSaving}
                        className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm shadow-md flex items-center justify-center gap-2"
                    >
                        {isValidating && (
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isValidating ? '驗證中...' : '驗證 API Key'}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={validationStatus !== 'valid' || isValidating || isSaving}
                        className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm shadow-md flex items-center justify-center gap-2"
                    >
                        {isSaving && (
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isSaving ? '保存中...' : '保存'}
                    </button>
                </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                <p className="font-semibold text-gray-700">📌 注意事項：</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>API Key 將安全地儲存在您的帳戶中</li>
                    <li>請勿與他人分享您的 API Key</li>
                    <li>Google AI Studio 提供免費的 API 配額</li>
                    <li>如需更換 API Key，請先驗證新的 Key 再保存</li>
                </ul>
            </div>
        </div>
    );
};

export default GeminiApiKeyManager;
