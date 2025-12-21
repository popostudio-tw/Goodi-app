import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createReferralLink, getReferralProgress, getNextMilestone } from '../utils/referralUtils';

interface ReferralShareModalProps {
    referralCode: string;
    referralCount: number;
    referredUsers?: string[];
    onClose: () => void;
}

const ReferralShareModal: React.FC<ReferralShareModalProps> = ({
    referralCode,
    referralCount,
    referredUsers = [],
    onClose
}) => {
    const [copiedText, setCopiedText] = useState<'code' | 'link' | null>(null);

    const referralLink = createReferralLink(referralCode);
    const progress = getReferralProgress(referralCount);
    const nextMilestone = getNextMilestone(referralCount);
    const remaining = nextMilestone - referralCount;

    // 複製到剪貼簿
    const copyToClipboard = async (text: string, type: 'code' | 'link') => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedText(type);
            setTimeout(() => setCopiedText(null), 2000);
        } catch (err) {
            console.error('複製失敗:', err);
            alert('複製失敗，請手動複製');
        }
    };

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
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
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

                    <div className="flex items-center gap-3 mb-2">
                        <img
                            src="https://api.iconify.design/twemoji/megaphone.svg"
                            className="w-10 h-10"
                            alt="推薦"
                        />
                        <div>
                            <h2 className="text-2xl font-bold">邀請好友</h2>
                            <p className="text-sm text-white/90">分享 Goodi，一起成長！</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">

                    {/* 推薦獎勵說明 */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4">
                        <div className="flex items-start gap-3">
                            <img
                                src="https://api.iconify.design/twemoji/wrapped-gift.svg"
                                className="w-8 h-8 mt-1"
                                alt="獎勵"
                            />
                            <div className="flex-1">
                                <h3 className="font-bold text-amber-900 mb-2">🎁 推薦獎勵</h3>
                                <ul className="text-sm text-amber-800 space-y-1">
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-600 mt-0.5">•</span>
                                        <span><strong>推薦人（您）</strong>：每推薦 5 人，獲得 <strong className="text-amber-900">1 個月高級功能</strong></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-amber-600 mt-0.5">•</span>
                                        <span><strong>被推薦人</strong>：註冊即享 <strong className="text-amber-900">7 天試用</strong></span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* 推薦進度 */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-blue-900">📊 推薦進度</h3>
                            <span className="text-2xl font-bold text-blue-600">{referralCount}/{nextMilestone}</span>
                        </div>

                        {/* 進度條 */}
                        <div className="relative h-4 bg-blue-100 rounded-full overflow-hidden mb-2">
                            <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </div>
                        </div>

                        <p className="text-sm text-blue-700 text-center">
                            {remaining === 0
                                ? '🎉 恭喜達成里程碑！繼續推薦可獲得更多獎勵'
                                : `再推薦 ${remaining} 人，即可獲得 1 個月高級功能！`}
                        </p>
                    </div>

                    {/* 分享方式 */}
                    <div>
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <img
                                src="https://api.iconify.design/twemoji/mobile-phone.svg"
                                className="w-5 h-5"
                                alt="分享"
                            />
                            分享方式（選一種）
                        </h3>

                        {/* 方式 1: QR Code */}
                        <div className="bg-white border-2 border-gray-200 rounded-xl p-4 mb-3">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                                    <QRCodeSVG
                                        value={referralLink}
                                        size={120}
                                        level="M"
                                        includeMargin={true}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded">方式 1</span>
                                        <h4 className="font-bold text-gray-800">掃 QR Code</h4>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                        朋友用手機掃描後，會自動帶入您的推薦碼
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                                        <img
                                            src="https://api.iconify.design/twemoji/check-mark.svg"
                                            className="w-3 h-3"
                                            alt="推薦"
                                        />
                                        <span>最方便！用手機直接掃</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 方式 2: 推薦連結 */}
                        <div className="bg-white border-2 border-gray-200 rounded-xl p-4 mb-3">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded">方式 2</span>
                                <h4 className="font-bold text-gray-800">分享連結</h4>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                                複製連結後，用 LINE、Messenger 等分享給朋友
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={referralLink}
                                    readOnly
                                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
                                />
                                <button
                                    onClick={() => copyToClipboard(referralLink, 'link')}
                                    className="px-4 py-2 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-600 transition-colors shadow-md flex items-center gap-2"
                                >
                                    {copiedText === 'link' ? (
                                        <>
                                            <img
                                                src="https://api.iconify.design/twemoji/check-mark.svg"
                                                className="w-4 h-4"
                                                alt="已複製"
                                            />
                                            <span>已複製</span>
                                        </>
                                    ) : (
                                        <>
                                            <img
                                                src="https://api.iconify.design/solar/copy-bold.svg"
                                                className="w-4 h-4 brightness-0 invert"
                                                alt="複製"
                                            />
                                            <span>複製</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* 方式 3: 推薦碼 */}
                        <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">方式 3</span>
                                <h4 className="font-bold text-gray-800">推薦碼</h4>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                                告訴朋友這組代碼，讓他們在註冊時輸入
                            </p>
                            <div className="flex gap-2">
                                <div className="flex-1 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
                                    <div className="text-center">
                                        <div className="text-xs text-green-700 mb-1">您的推薦碼</div>
                                        <div className="text-2xl font-bold text-green-800 tracking-wider">{referralCode}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(referralCode, 'code')}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors shadow-md flex items-center gap-2"
                                >
                                    {copiedText === 'code' ? (
                                        <>
                                            <img
                                                src="https://api.iconify.design/twemoji/check-mark.svg"
                                                className="w-4 h-4"
                                                alt="已複製"
                                            />
                                            <span>已複製</span>
                                        </>
                                    ) : (
                                        <>
                                            <img
                                                src="https://api.iconify.design/solar/copy-bold.svg"
                                                className="w-4 h-4 brightness-0 invert"
                                                alt="複製"
                                            />
                                            <span>複製</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 已推薦用戶列表 */}
                    {referralCount > 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <img
                                    src="https://api.iconify.design/twemoji/busts-in-silhouette.svg"
                                    className="w-5 h-5"
                                    alt="用戶"
                                />
                                已成功推薦 {referralCount} 人
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <img
                                    src="https://api.iconify.design/twemoji/party-popper.svg"
                                    className="w-4 h-4"
                                    alt="慶祝"
                                />
                                <span>太棒了！感謝您幫助更多家庭使用 Goodi！</span>
                            </div>
                        </div>
                    )}

                    {/* 使用說明 */}
                    <details className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <summary className="font-bold text-blue-900 cursor-pointer flex items-center gap-2">
                            <img
                                src="https://api.iconify.design/twemoji/light-bulb.svg"
                                className="w-5 h-5"
                                alt="提示"
                            />
                            <span>推薦規則說明</span>
                        </summary>
                        <div className="mt-3 space-y-2 text-sm text-blue-800">
                            <div className="flex gap-2">
                                <span className="font-bold">1.</span>
                                <span>朋友使用您的推薦碼註冊後，<strong>完成 1 個任務</strong>即算推薦成功</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="font-bold">2.</span>
                                <span>每推薦 5 人，您會獲得一個<strong>兌換碼</strong>（可兌換 1 個月高級功能）</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="font-bold">3.</span>
                                <span>兌換碼有效期為 <strong>45 天</strong>，記得盡快使用</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="font-bold">4.</span>
                                <span>被推薦的朋友可以在註冊後 <strong>7 天內</strong>補登推薦碼</span>
                            </div>
                        </div>
                    </details>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                    >
                        關閉
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReferralShareModal;
