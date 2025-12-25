import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { BillingCycle } from '../services/billing';

// ==========================================
// Premium 三段式升級流程
// ==========================================

type FlowStep = 'shock' | 'empathy' | 'commitment';

interface PremiumUpgradeFlowProps {
    onComplete?: (plan: BillingCycle) => Promise<void>;
}

const PremiumUpgradeFlow: React.FC<PremiumUpgradeFlowProps> = ({ onComplete }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const [currentStep, setCurrentStep] = useState<FlowStep>('shock');
    const [selectedPlan, setSelectedPlan] = useState<BillingCycle>(
        location.state?.selectedPlan || 'yearly'
    );
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Mock 數據：過去錯過的瞬間
    const missedMoments = [
        { date: '12/15 16:32', text: '今天數學考不好，我不敢跟媽媽說...' },
        { date: '12/18 17:45', text: 'Goodi，我想媽媽了' },
        { date: '12/20 15:20', text: 'Goodi，我做到了！' }
    ];

    const handleNext = () => {
        if (currentStep === 'shock') {
            setCurrentStep('empathy');
        } else if (currentStep === 'empathy') {
            setCurrentStep('commitment');
        }
    };

    const handleConfirm = async () => {
        // 導向 App Store 或 Google Play 訂閱
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);

        let message = '請前往應用程式商店訂閱高級方案：\n\n';
        if (isIOS) {
            message += '• iOS 用戶：請前往 App Store 進行訂閱';
        } else if (isAndroid) {
            message += '• Android 用戶：請前往 Google Play 進行訂閱';
        } else {
            message += '• 請在您的手機 App 中進行訂閱\n• iOS：前往 App Store\n• Android：前往 Google Play';
        }

        alert(message);
        navigate('/');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">

                {/* ============ Step 1: 震盪 ============ */}
                {currentStep === 'shock' && (
                    <div className="p-8">
                        <div className="text-center mb-6">
                            <div className="text-5xl mb-4">💔</div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                你錯過了這些時刻
                            </h2>
                        </div>

                        <div className="space-y-4 mb-6">
                            {missedMoments.map((moment, index) => (
                                <div
                                    key={index}
                                    className="bg-gray-50 rounded-lg p-4 border-l-4 border-orange-400"
                                >
                                    <p className="text-xs text-gray-500 mb-1">{moment.date}</p>
                                    <p className="text-gray-700 leading-relaxed">
                                        「{moment.text}」
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-gray-700 text-center">
                                這些對話 <span className="font-bold text-orange-600">7 天後會永久消失</span>
                            </p>
                        </div>

                        <button
                            onClick={handleNext}
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-6 rounded-xl transition-all"
                        >
                            繼續
                        </button>
                    </div>
                )}

                {/* ============ Step 2: 共鳴 ============ */}
                {currentStep === 'empathy' && (
                    <div className="p-8">
                        <div className="text-center mb-6">
                            <div className="text-5xl mb-4">💚</div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                你不是一個人
                            </h2>
                        </div>

                        <p className="text-gray-700 leading-relaxed text-center mb-6">
                            每個忙碌的家長都會錯過瞬間
                            <br />
                            但你可以選擇不再遺憾
                        </p>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-start gap-3 bg-green-50 rounded-lg p-4">
                                <span className="text-xl">✓</span>
                                <div>
                                    <p className="font-semibold text-gray-800">完整保存每次對話</p>
                                    <p className="text-sm text-gray-600">
                                        孩子跟 Goodi 說的每一句話，永遠不會消失
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 bg-green-50 rounded-lg p-4">
                                <span className="text-xl">✓</span>
                                <div>
                                    <p className="font-semibold text-gray-800">每晚推送今日時刻</p>
                                    <p className="text-sm text-gray-600">
                                        睡前 10 分鐘，看見他白天的努力
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 bg-green-50 rounded-lg p-4">
                                <span className="text-xl">✓</span>
                                <div>
                                    <p className="font-semibold text-gray-800">每月生成成長證據</p>
                                    <p className="text-sm text-gray-600">
                                        精美報告，證明你的陪伴是有效的
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleNext}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl transition-all"
                        >
                            我準備好了
                        </button>

                        <button
                            onClick={() => setCurrentStep('shock')}
                            className="w-full mt-3 text-gray-500 hover:text-gray-700 text-sm"
                        >
                            ← 返回
                        </button>
                    </div>
                )}

                {/* ============ Step 3: 承諾 ============ */}
                {currentStep === 'commitment' && (
                    <div className="p-8">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                讓我陪你走完 30 天
                            </h2>
                        </div>

                        <div className="space-y-3 mb-6">
                            {/* 月繳 */}
                            <button
                                onClick={() => setSelectedPlan('monthly')}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedPlan === 'monthly'
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-green-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-800">月繳 $599</p>
                                        <p className="text-sm text-gray-600">
                                            每天 20 元，
                                            <br />
                                            換來不遺憾的育兒時光
                                        </p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 ${selectedPlan === 'monthly'
                                        ? 'border-green-500 bg-green-500'
                                        : 'border-gray-300'
                                        }`}>
                                        {selectedPlan === 'monthly' && (
                                            <div className="w-full h-full flex items-center justify-center text-white text-xs">✓</div>
                                        )}
                                    </div>
                                </div>
                            </button>

                            {/* 年繳（推薦） */}
                            <button
                                onClick={() => setSelectedPlan('yearly')}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all relative ${selectedPlan === 'yearly'
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-green-300'
                                    }`}
                            >
                                <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold py-1 px-2 rounded-full">
                                    省 17%
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-800">年繳 $5,990</p>
                                        <p className="text-sm text-gray-600">
                                            長期陪伴，看見改變
                                        </p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 ${selectedPlan === 'yearly'
                                        ? 'border-green-500 bg-green-500'
                                        : 'border-gray-300'
                                        }`}>
                                        {selectedPlan === 'yearly' && (
                                            <div className="w-full h-full flex items-center justify-center text-white text-xs">✓</div>
                                        )}
                                    </div>
                                </div>
                            </button>

                            {/* 終身 */}
                            <button
                                onClick={() => setSelectedPlan('lifetime')}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedPlan === 'lifetime'
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-green-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-800">終身 $19,999</p>
                                        <p className="text-sm text-gray-600">
                                            永遠記得，他怎麼長大的
                                        </p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 ${selectedPlan === 'lifetime'
                                        ? 'border-green-500 bg-green-500'
                                        : 'border-gray-300'
                                        }`}>
                                        {selectedPlan === 'lifetime' && (
                                            <div className="w-full h-full flex items-center justify-center text-white text-xs">✓</div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* 錯誤訊息 */}
                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                                <p className="text-red-600 text-sm">❌ {error}</p>
                            </div>
                        )}

                        <button
                            onClick={handleConfirm}
                            disabled={isProcessing}
                            className={`w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg transform hover:scale-105 mb-4 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {isProcessing ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    處理中...
                                </span>
                            ) : '開始記錄，不再遺憾'}
                        </button>

                        <p className="text-center text-xs text-gray-500 mb-4">
                            付款功能開發中，敬請期待
                            <br />
                            我們理解，育兒本來就很難。
                        </p>

                        <button
                            onClick={() => setCurrentStep('empathy')}
                            className="w-full text-gray-500 hover:text-gray-700 text-sm"
                        >
                            ← 返回
                        </button>
                    </div>
                )}

                {/* 關閉按鈕 */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
                >
                    ×
                </button>
            </div>
        </div>
    );
};

export default PremiumUpgradeFlow;
