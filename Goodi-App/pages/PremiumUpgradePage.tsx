import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import HighlightCard, { HighlightData } from '../components/HighlightCard';
import { getTodayHighlight, getMissedMomentsCount } from '../services/highlights';
import { getUserMembership, BillingCycle } from '../services/billing';

// ==========================================
// Premium 升級頁面
// ==========================================

interface PremiumUpgradePageProps {
    onUpgrade?: (plan: BillingCycle) => Promise<void>;
}

const PremiumUpgradePage: React.FC<PremiumUpgradePageProps> = ({ onUpgrade }) => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState<BillingCycle>('yearly');
    const [todayHighlight, setTodayHighlight] = useState<HighlightData | null>(null);
    const [missedCount, setMissedCount] = useState<number>(0);
    const [isPremium, setIsPremium] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    // 從 Firestore 獲取真實數據
    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;

            try {
                setLoading(true);

                // 並行獲取數據
                const [highlight, missed, membership] = await Promise.all([
                    getTodayHighlight(currentUser.uid),
                    getMissedMomentsCount(currentUser.uid, 7),
                    getUserMembership(currentUser.uid)
                ]);

                setTodayHighlight(highlight);
                setMissedCount(missed);
                setIsPremium(membership?.plan === 'premium');
            } catch (error) {
                console.error('[PremiumUpgradePage] Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

    const handleUpgradeClick = async () => {
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
    };

    const currentHour = new Date().getHours();
    const isGoldenHour = currentHour >= 20 && currentHour <= 22;

    // Loading 狀態
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-cream-50 via-white to-cream-100 p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">🦖</div>
                    <p className="text-gray-600">Goodi 正在為你準備...</p>
                </div>
            </div>
        );
    }

    // Premium 用戶的專屬頁面
    if (isPremium) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-cream-50 via-white to-cream-100 p-6">
                <div className="max-w-2xl mx-auto">
                    <button onClick={() => navigate(-1)} className="mb-6 text-gray-500 hover:text-gray-700 transition-colors">
                        ← 返回
                    </button>

                    <div className="text-center mb-8">
                        <div className="text-5xl mb-4">💚</div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-3">
                            你已經在為孩子留下這些時刻
                        </h1>
                        <p className="text-gray-600 text-lg">
                            感謝你選擇 Goodi Premium，一起記錄成長的每一天
                        </p>
                    </div>

                    {todayHighlight ? (
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">今天的亮點</h2>
                            <HighlightCard
                                data={todayHighlight}
                                isPremium={true}
                                onSave={() => console.log('Save highlight')}
                                onShare={() => console.log('Share highlight')}
                            />
                        </div>
                    ) : (
                        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center mb-8">
                            <div className="text-4xl mb-4">🌱</div>
                            <p className="text-gray-700 leading-relaxed mb-2">
                                今天也可以成為一個被記住的開始。
                            </p>
                            <p className="text-sm text-gray-600">
                                完成第一個任務，Goodi 會為你生成亮點卡
                            </p>
                        </div>
                    )}

                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl transition-all"
                    >
                        回到首頁
                    </button>
                </div>
            </div>
        );
    }

    // Free 用戶的升級頁面
    return (
        <div className="min-h-screen bg-gradient-to-b from-cream-50 via-white to-cream-100 p-6">
            <div className="max-w-2xl mx-auto">
                <button onClick={() => navigate(-1)} className="mb-6 text-gray-500 hover:text-gray-700 transition-colors">
                    ← 返回
                </button>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-3">你不在的那些瞬間</h1>
                    <p className="text-gray-600 text-lg">
                        {isGoldenHour ? '孩子睡了，但今天他的努力還記得嗎？' : '每一天，他都在成長'}
                    </p>
                </div>

                <div className="mb-8">
                    {todayHighlight ? (
                        <>
                            <p className="text-gray-700 font-medium mb-4 text-center">
                                今天，{todayHighlight.action}，
                                <br />
                                <span className="text-gray-500">而你沒看到。</span>
                            </p>
                            <HighlightCard data={todayHighlight} isPremium={false} showMissedMessage={true} />
                        </>
                    ) : (
                        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-8 text-center">
                            <div className="text-4xl mb-4">🌱</div>
                            <p className="text-gray-700 leading-relaxed mb-2">
                                今天也可以成為一個被記住的開始。
                            </p>
                            <p className="text-sm text-gray-600">完成第一個任務，Goodi 會為你生成亮點卡</p>
                        </div>
                    )}
                </div>

                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 mb-8">
                    <p className="text-gray-700 leading-relaxed text-center">
                        孩子在進步，而你缺席了。
                        <br />
                        <span className="font-semibold text-green-700">但今天還不算太晚。</span>
                    </p>
                </div>

                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Premium 讓你做到三件事</h2>
                    <div className="space-y-4">
                        <div className="bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">💎</span>
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-1">完整記錄孩子的每個亮點</h3>
                                    <p className="text-sm text-gray-600">不只是數字，而是每一次「他做到了」的瞬間</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">🎁</span>
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-1">每天生成一張亮點視覺卡</h3>
                                    <p className="text-sm text-gray-600">可收藏、可分享，讓你驕傲地說「你看，他在進步」</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">📊</span>
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-1">30 天成長證據永久保存</h3>
                                    <p className="text-sm text-gray-600">每月精美報告，證明你的陪伴是有效的</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">選擇你的陪伴方式</h2>
                    <div className="space-y-3">
                        <button
                            onClick={() => setSelectedPlan('monthly')}
                            className={`w-full p-5 rounded-xl border-2 transition-all ${selectedPlan === 'monthly' ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200 bg-white hover:border-green-300'
                                }`}
                        >
                            <div className="flex justify-between items-center">
                                <div className="text-left">
                                    <p className="font-semibold text-gray-800">月繳 $599</p>
                                    <p className="text-sm text-gray-600">每天 20 元，換來不遺憾的育兒時光</p>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 ${selectedPlan === 'monthly' ? 'border-green-500 bg-green-500' : 'border-gray-300'
                                    }`}>
                                    {selectedPlan === 'monthly' && <div className="w-full h-full flex items-center justify-center text-white text-sm">✓</div>}
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => setSelectedPlan('yearly')}
                            className={`w-full p-5 rounded-xl border-2 transition-all relative ${selectedPlan === 'yearly' ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200 bg-white hover:border-green-300'
                                }`}
                        >
                            <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold py-1 px-3 rounded-full">省 17%</div>
                            <div className="flex justify-between items-center">
                                <div className="text-left">
                                    <p className="font-semibold text-gray-800">年繳 $5,990</p>
                                    <p className="text-sm text-gray-600">長期陪伴，看見改變（月均 $499）</p>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 ${selectedPlan === 'yearly' ? 'border-green-500 bg-green-500' : 'border-gray-300'
                                    }`}>
                                    {selectedPlan === 'yearly' && <div className="w-full h-full flex items-center justify-center text-white text-sm">✓</div>}
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => setSelectedPlan('lifetime')}
                            className={`w-full p-5 rounded-xl border-2 transition-all ${selectedPlan === 'lifetime' ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200 bg-white hover:border-green-300'
                                }`}
                        >
                            <div className="flex justify-between items-center">
                                <div className="text-left">
                                    <p className="font-semibold text-gray-800">終身 $19,999</p>
                                    <p className="text-sm text-gray-600">永遠記得，他怎麼長大的</p>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 ${selectedPlan === 'lifetime' ? 'border-green-500 bg-green-500' : 'border-gray-300'
                                    }`}>
                                    {selectedPlan === 'lifetime' && <div className="w-full h-full flex items-center justify-center text-white text-sm">✓</div>}
                                </div>
                            </div>
                        </button>
                    </div>
                </div>

                <button
                    onClick={handleUpgradeClick}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all transform hover:scale-105 mb-4"
                >
                    替孩子把這一刻留下來
                </button>

                <p className="text-center text-sm text-gray-500 mb-6">
                    隨時可取消 | 7 天無條件退款
                    <br />
                    我們理解，育兒本來就很難。
                </p>

                {missedCount > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <p className="text-sm text-gray-700 text-center">
                            ⚠️ 過去 7 天，你錯過了 <span className="font-bold text-orange-600">{missedCount} 個瞬間</span>
                            <br />
                            Free 方案只保留 30 天，這些回憶即將永久消失
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PremiumUpgradePage;
