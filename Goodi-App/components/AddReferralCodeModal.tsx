import React, { useState } from 'react';
import { getRemainingDaysToAddReferral } from '../utils/referralUtils';
import { UserData } from '../types';

interface AddReferralCodeModalProps {
    userData: Partial<UserData>;
    onSubmit: (code: string) => Promise<{ success: boolean; message: string }>;
    onClose: () => void;
}

const AddReferralCodeModal: React.FC<AddReferralCodeModalProps> = ({
    userData,
    onSubmit,
    onClose
}) => {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const remainingDays = getRemainingDaysToAddReferral(userData);
    const canAdd = remainingDays > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!code.trim()) {
            setError('請輸入推薦碼');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await onSubmit(code);

            if (result.success) {
                // 成功，關閉 Modal
                onClose();
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('系統錯誤，請稍後再試');
        } finally {
            setIsLoading(false);
        }
    };

    if (!canAdd) {
        return (
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <div
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-white/50 overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-6 text-center">
                        <img
                            src="https://api.iconify.design/twemoji/hourglass-done.svg"
                            className="w-16 h-16 mx-auto mb-4"
                            alt="時間已過"
                        />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">補登期限已過</h2>
                        <p className="text-gray-600 mb-6">
                            推薦碼只能在註冊後 7 天內補登，<br />
                            您的帳號已超過補登期限。
                        </p>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-500 text-white rounded-lg font-bold hover:bg-gray-600 transition-colors"
                        >
                            我知道了
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-white/50 overflow-hidden animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <img
                            src="https://api.iconify.design/solar/close-circle-bold.svg"
                            className="w-6 h-6 brightness-0 invert"
                            alt="關閉"
                        />
                    </button>

                    <div className="flex items-center gap-3">
                        <img
                            src="https://api.iconify.design/twemoji/ticket.svg"
                            className="w-10 h-10"
                            alt="推薦碼"
                        />
                        <div>
                            <h2 className="text-2xl font-bold">補登推薦碼</h2>
                            <p className="text-sm text-white/90">獲得 7 天試用 + 幫助朋友</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* 倒數提示 */}
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <img
                                src="https://api.iconify.design/twemoji/alarm-clock.svg"
                                className="w-8 h-8"
                                alt="時間"
                            />
                            <div className="flex-1">
                                <div className="font-bold text-amber-900 mb-1">
                                    ⏰ 剩餘時間：{remainingDays} 天
                                </div>
                                <div className="text-sm text-amber-800">
                                    推薦碼只能在註冊後 7 天內補登，請把握時間！
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 獎勵說明 */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                        <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                            <img
                                src="https://api.iconify.design/twemoji/wrapped-gift.svg"
                                className="w-5 h-5"
                                alt="獎勵"
                            />
                            使用推薦碼的好處
                        </h3>
                        <ul className="space-y-2 text-sm text-blue-800">
                            <li className="flex items-start gap-2">
                                <img
                                    src="https://api.iconify.design/twemoji/check-mark.svg"
                                    className="w-4 h-4 mt-0.5"
                                    alt="勾選"
                                />
                                <span>您會獲得 <strong className="text-blue-900">7 天高級功能試用</strong></span>
                            </li>
                            <li className="flex items-start gap-2">
                                <img
                                    src="https://api.iconify.design/twemoji/check-mark.svg"
                                    className="w-4 h-4 mt-0.5"
                                    alt="勾選"
                                />
                                <span>推薦您的朋友也會獲得獎勵</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <img
                                    src="https://api.iconify.design/twemoji/check-mark.svg"
                                    className="w-4 h-4 mt-0.5"
                                    alt="勾選"
                                />
                                <span>試用期間可以<strong className="text-blue-900">完整使用所有功能</strong></span>
                            </li>
                        </ul>
                    </div>

                    {/* 輸入推薦碼 */}
                    <div>
                        <label className="block font-bold text-gray-800 mb-2">
                            請輸入朋友的推薦碼
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value.toUpperCase());
                                setError('');
                            }}
                            placeholder="例如: GD-ABC123"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-lg font-mono text-center tracking-wider transition-all"
                            disabled={isLoading}
                            maxLength={20}
                        />
                        <div className="mt-2 text-xs text-gray-500 text-center">
                            推薦碼格式：XX-XXXXXX（例如 GD-A3K7M9）
                        </div>
                    </div>

                    {/* 錯誤訊息 */}
                    {error && (
                        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 flex items-center gap-2">
                            <img
                                src="https://api.iconify.design/twemoji/cross-mark.svg"
                                className="w-5 h-5"
                                alt="錯誤"
                            />
                            <span className="text-sm text-red-800 font-medium">{error}</span>
                        </div>
                    )}

                    {/* 重要提醒 */}
                    <details className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <summary className="font-bold text-gray-800 cursor-pointer flex items-center gap-2">
                            <img
                                src="https://api.iconify.design/twemoji/warning.svg"
                                className="w-5 h-5"
                                alt="注意"
                            />
                            <span>重要提醒</span>
                        </summary>
                        <ul className="mt-3 space-y-2 text-sm text-gray-600">
                            <li className="flex gap-2">
                                <span className="text-gray-400">•</span>
                                <span>每個帳號只能使用<strong className="text-gray-800">一次</strong>推薦碼</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-gray-400">•</span>
                                <span>不能使用自己的推薦碼</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-gray-400">•</span>
                                <span>推薦碼必須是真實存在且有效的</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-gray-400">•</span>
                                <span>試用期間創建的任務，試用結束後會被禁用（可升級解鎖）</span>
                            </li>
                        </ul>
                    </details>

                    {/* 按鈕 */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                            disabled={isLoading}
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            disabled={isLoading || !code.trim()}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>驗證中...</span>
                                </>
                            ) : (
                                <>
                                    <img
                                        src="https://api.iconify.design/twemoji/check-mark.svg"
                                        className="w-5 h-5"
                                        alt="確認"
                                    />
                                    <span>確認使用</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddReferralCodeModal;
