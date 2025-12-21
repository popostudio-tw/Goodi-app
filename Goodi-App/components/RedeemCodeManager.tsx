import React, { useState } from 'react';
import { RedeemCode } from '../types';
import { isRedeemCodeExpired, getRedeemCodeRemainingDays } from '../utils/referralUtils';

interface RedeemCodeManagerProps {
    redeemCodes: RedeemCode[];
    onUseCode: (code: string, months: number) => Promise<{ success: boolean; message: string }>;
    onClose: () => void;
}

const RedeemCodeManager: React.FC<RedeemCodeManagerProps> = ({
    redeemCodes,
    onUseCode,
    onClose
}) => {
    const [selectedCode, setSelectedCode] = useState<string | null>(null);
    const [monthsToRedeem, setMonthsToRedeem] = useState(1);
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [error, setError] = useState('');

    const handleRedeem = async () => {
        if (!selectedCode) return;

        setIsRedeeming(true);
        setError('');

        try {
            const result = await onUseCode(selectedCode, monthsToRedeem);

            if (result.success) {
                setSelectedCode(null);
                setMonthsToRedeem(1);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('系統錯誤，請稍後再試');
        } finally {
            setIsRedeeming(false);
        }
    };

    // 分類兌換碼
    const availableCodes = redeemCodes.filter(code => !code.used && !isRedeemCodeExpired(code));
    const usedCodes = redeemCodes.filter(code => code.used);
    const expiredCodes = redeemCodes.filter(code => !code.used && isRedeemCodeExpired(code));

    const getStatusBadge = (code: RedeemCode) => {
        if (code.used) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-600 text-xs font-bold rounded-full">
                    <img src="https://api.iconify.design/twemoji/check-mark.svg" className="w-3 h-3" alt="" />
                    已使用
                </span>
            );
        }

        if (isRedeemCodeExpired(code)) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-200 text-red-700 text-xs font-bold rounded-full">
                    <img src="https://api.iconify.design/twemoji/cross-mark.svg" className="w-3 h-3" alt="" />
                    已過期
                </span>
            );
        }

        const remainingDays = getRedeemCodeRemainingDays(code);
        const isExpiringSoon = remainingDays <= 7;

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full ${isExpiringSoon
                    ? 'bg-amber-200 text-amber-800'
                    : 'bg-green-200 text-green-800'
                }`}>
                <img src="https://api.iconify.design/twemoji/sparkles.svg" className="w-3 h-3" alt="" />
                可使用 ({remainingDays} 天)
            </span>
        );
    };

    const CodeCard: React.FC<{ code: RedeemCode; index: number }> = ({ code, index }) => {
        const isExpired = isRedeemCodeExpired(code);
        const isUsed = code.used;
        const isAvailable = !isUsed && !isExpired;
        const remainingDays = getRedeemCodeRemainingDays(code);
        const isSelected = selectedCode === code.code;

        return (
            <div
                className={`border-2 rounded-xl p-4 transition-all ${isAvailable && isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : isAvailable
                            ? 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm cursor-pointer'
                            : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                onClick={() => isAvailable && setSelectedCode(isSelected ? null : code.code)}
            >
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <img
                            src="https://api.iconify.design/twemoji/ticket.svg"
                            className="w-6 h-6"
                            alt="兌換碼"
                        />
                        <span className="font-bold text-gray-800">兌換碼 #{index + 1}</span>
                    </div>
                    {getStatusBadge(code)}
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3 mb-3">
                    <div className="text-xs text-purple-700 mb-1">代碼</div>
                    <div className="text-lg font-bold text-purple-900 tracking-wider font-mono">{code.code}</div>
                </div>

                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">獎勵內容：</span>
                        <span className="font-bold text-gray-800">{code.description}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">建立日期：</span>
                        <span className="text-gray-700">{new Date(code.createdAt).toLocaleDateString()}</span>
                    </div>
                    {isUsed ? (
                        <div className="flex justify-between">
                            <span className="text-gray-600">使用日期：</span>
                            <span className="text-gray-700">{code.usedAt ? new Date(code.usedAt).toLocaleDateString() : '-'}</span>
                        </div>
                    ) : (
                        <div className="flex justify-between">
                            <span className="text-gray-600">到期日期：</span>
                            <span className={`font-medium ${remainingDays <= 7 ? 'text-amber-700' : 'text-gray-700'}`}>
                                {new Date(code.expiresAt).toLocaleDateString()}
                                {remainingDays <= 7 && remainingDays > 0 && (
                                    <span className="ml-1 text-xs text-amber-600">⏰ 即將過期</span>
                                )}
                            </span>
                        </div>
                    )}
                </div>

                {isAvailable && isSelected && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                        <div className="text-sm font-bold text-blue-900 mb-2">兌換數量（單次最多 2 個月）</div>
                        <div className="flex gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMonthsToRedeem(1);
                                }}
                                className={`flex-1 py-2 rounded-lg font-bold transition-all ${monthsToRedeem === 1
                                        ? 'bg-blue-500 text-white shadow-md'
                                        : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-300'
                                    }`}
                            >
                                1 個月
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMonthsToRedeem(2);
                                }}
                                className={`flex-1 py-2 rounded-lg font-bold transition-all ${monthsToRedeem === 2
                                        ? 'bg-blue-500 text-white shadow-md'
                                        : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-300'
                                    }`}
                            >
                                2 個月
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-white/50 overflow-hidden animate-fade-in max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white flex-shrink-0">
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
                            src="https://api.iconify.design/twemoji/wrapped-gift.svg"
                            className="w-10 h-10"
                            alt="兌換碼"
                        />
                        <div>
                            <h2 className="text-2xl font-bold">我的兌換碼</h2>
                            <p className="text-sm text-white/90">
                                共 {redeemCodes.length} 個兌換碼
                                {availableCodes.length > 0 && ` · ${availableCodes.length} 個可用`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                    {redeemCodes.length === 0 ? (
                        <div className="text-center py-12">
                            <img
                                src="https://api.iconify.design/twemoji/disappointed-face.svg"
                                className="w-16 h-16 mx-auto mb-4"
                                alt="無兌換碼"
                            />
                            <h3 className="text-xl font-bold text-gray-800 mb-2">尚無兌換碼</h3>
                            <p className="text-gray-600 mb-4">
                                推薦 5 位朋友成功註冊，<br />
                                即可獲得 1 個兌換碼！
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* 可用兌換碼 */}
                            {availableCodes.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        <img
                                            src="https://api.iconify.design/twemoji/sparkles.svg"
                                            className="w-5 h-5"
                                            alt="可用"
                                        />
                                        可使用的兌換碼 ({availableCodes.length})
                                    </h3>
                                    <div className="grid gap-3">
                                        {availableCodes.map((code, index) => (
                                            <CodeCard key={code.code} code={code} index={index} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 已使用兌換碼 */}
                            {usedCodes.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-gray-600 mb-3 flex items-center gap-2">
                                        <img
                                            src="https://api.iconify.design/twemoji/check-mark-button.svg"
                                            className="w-5 h-5"
                                            alt="已使用"
                                        />
                                        已使用 ({usedCodes.length})
                                    </h3>
                                    <div className="grid gap-3">
                                        {usedCodes.map((code, index) => (
                                            <CodeCard key={code.code} code={code} index={availableCodes.length + index} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 已過期兌換碼 */}
                            {expiredCodes.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-gray-600 mb-3 flex items-center gap-2">
                                        <img
                                            src="https://api.iconify.design/twemoji/hourglass-done.svg"
                                            className="w-5 h-5"
                                            alt="已過期"
                                        />
                                        已過期 ({expiredCodes.length})
                                    </h3>
                                    <div className="grid gap-3">
                                        {expiredCodes.map((code, index) => (
                                            <CodeCard key={code.code} code={code} index={availableCodes.length + usedCodes.length + index} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* 使用說明 */}
                    {availableCodes.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                <img
                                    src="https://api.iconify.design/twemoji/information.svg"
                                    className="w-5 h-5"
                                    alt="說明"
                                />
                                使用說明
                            </h3>
                            <ul className="space-y-1 text-sm text-blue-800">
                                <li className="flex gap-2">
                                    <span>1.</span>
                                    <span>點選要使用的兌換碼</span>
                                </li>
                                <li className="flex gap-2">
                                    <span>2.</span>
                                    <span>選擇要兌換的月數（1 或 2 個月）</span>
                                </li>
                                <li className="flex gap-2">
                                    <span>3.</span>
                                    <span>點擊下方「立即兌換」按鈕</span>
                                </li>
                                <li className="flex gap-2">
                                    <span>4.</span>
                                    <span>兌換碼有效期為 45 天，請盡快使用</span>
                                </li>
                            </ul>
                        </div>
                    )}

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
                </div>

                {/* Footer */}
                {selectedCode && (
                    <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                        <button
                            onClick={handleRedeem}
                            disabled={isRedeeming}
                            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isRedeeming ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>兌換中...</span>
                                </>
                            ) : (
                                <>
                                    <img
                                        src="https://api.iconify.design/twemoji/party-popper.svg"
                                        className="w-5 h-5"
                                        alt="兌換"
                                    />
                                    <span>立即兌換 {monthsToRedeem} 個月高級功能</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RedeemCodeManager;
