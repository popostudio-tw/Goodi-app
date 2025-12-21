
import React, { useState, useEffect, useMemo } from 'react';
import { useUserData } from '../UserContext';
import TestScoreModal from './TestScoreModal';
import { db, functions } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getBaselineForDate } from '../utils/dailyFallbackData';
import { hasPremiumAccess } from '../utils/planUtils';


// Helper: 取得台灣時間的日期字串 (YYYY-MM-DD)
const getTaiwanDate = (): string => {
    const now = new Date();
    const taiwanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
    const year = taiwanTime.getFullYear();
    const month = String(taiwanTime.getMonth() + 1).padStart(2, '0');
    const day = String(taiwanTime.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper: 取得昨天的台灣時間日期字串
const getTaiwanYesterday = (): string => {
    const now = new Date();
    const taiwanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
    taiwanTime.setDate(taiwanTime.getDate() - 1);
    const year = taiwanTime.getFullYear();
    const month = String(taiwanTime.getMonth() + 1).padStart(2, '0');
    const day = String(taiwanTime.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper: 取得台灣時間的小時數
const getTaiwanHour = (): number => {
    const now = new Date();
    const taiwanTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
    return taiwanTime.getHours();
};

// --- Story A: Custom Hook for Stable Content ---
const useDailyContent = () => {
    const [data, setData] = useState({ todayInHistory: "讀取中...", animalTrivia: "讀取中..." });
    const [isLoading, setIsLoading] = useState(true);
    const [isBlocked, setIsBlocked] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
            const todayKey = getTaiwanDate();

            // 1. Check Cache
            const cached = localStorage.getItem(`daily_content_v2_${todayKey}`);
            if (cached) {
                try {
                    setData(JSON.parse(cached));
                    setIsLoading(false);
                    return;
                } catch (e) { localStorage.removeItem(`daily_content_v2_${todayKey}`); }
            }

            // 2. Direct Firestore Read
            try {
                const docRef = doc(db, 'dailyContent', todayKey);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && docSnap.data().status === 'completed') {
                    const firestoreData = docSnap.data();
                    const result = {
                        todayInHistory: firestoreData.todayInHistory,
                        animalTrivia: firestoreData.animalTrivia
                    };
                    setData(result);
                    localStorage.setItem(`daily_content_v2_${todayKey}`, JSON.stringify(result));
                } else {
                    // Story E/F: Fallback
                    const baseline = getBaselineForDate(todayKey);
                    setData(baseline);
                }
            } catch (error: any) {
                console.error("Daily Content Error:", error);

                // Story G: AdBlock Detect
                if (error.message?.includes('BLOCKED_BY_CLIENT') || error.code === 'permission-denied') {
                    setIsBlocked(true);
                }

                setData(getBaselineForDate(todayKey));
            } finally {
                setIsLoading(false);
            }
        };
        fetchAll();
    }, []);

    return { ...data, isLoading, isBlocked };
};

// 小組件: Skeleton 載入樣式
const SkeletonWidget = () => (
    <div className="space-y-2 py-1 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
);


const WidgetCard: React.FC<{
    icon: string;
    title: string;
    children: React.ReactNode;
    color?: 'blue' | 'green' | 'yellow' | 'red';
    className?: string;
}> = ({ icon, title, children, color, className = '' }) => {
    const colorClasses = {
        blue: 'bg-blue-50/40 border-blue-200/50 text-blue-900',
        green: 'bg-green-50/40 border-green-200/50 text-green-900',
        yellow: 'bg-yellow-50/40 border-yellow-200/50 text-yellow-900',
        red: 'bg-red-50/40 border-red-200/50 text-red-900',
    };

    return (
        <div className={`p-4 rounded-2xl shadow-md border backdrop-blur-md transition-all hover:bg-white/70 ${color ? colorClasses[color] : 'bg-white/60 border-white/40'} ${className}`}>
            <h3 className="font-bold text-lg mb-3 flex items-center">
                <img src={icon} alt="" className="w-7 h-7 mr-2 drop-shadow-sm" />
                {title}
            </h3>
            <div className="text-sm leading-relaxed">
                {children}
            </div>
        </div>
    );
};

const LOGO_OPTIONS = [
    "https://static.wixstatic.com/media/ec806c_7b1f40d3524d45e6a3a0462c7d522b8a~mv2.png",
    "https://static.wixstatic.com/media/ec806c_0b0899d59d8544da9269e16ce8b12d25~mv2.png",
    "https://static.wixstatic.com/media/ec806c_0d8d9d4c54074b94b9fccb10e3c003d5~mv2.png",
    "https://static.wixstatic.com/media/ec806c_3f83758cf14647d2a1d6127f1a92b000~mv2.png"
];

const GreetingCard: React.FC = () => {
    const { userData } = useUserData();
    const { userProfile, tasks } = userData;
    const [logoUrl, setLogoUrl] = useState(LOGO_OPTIONS[0]);

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * LOGO_OPTIONS.length);
        setLogoUrl(LOGO_OPTIONS[randomIndex]);
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return '早安';
        if (hour < 18) return '午安';
        return '晚安';
    };
    const remaining = tasks.filter(t => !t.completed).length;
    return (
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 flex items-center space-x-4 shadow-md border border-white/40">
            <img src={logoUrl} alt="Mascot" className="h-20 w-20 flex-shrink-0 object-contain drop-shadow-md" />
            <div>
                <p className="text-base font-semibold text-green-700">{getGreeting()}，{userProfile.nickname}！</p>
                <h2 className="text-xl font-bold text-gray-800">嘿，進步囉！</h2>
                <p className="text-gray-600 text-sm">今天還有 <span className="font-bold text-green-600">{remaining} 個</span> 任務，加油！</p>
            </div>
        </div>
    );
};

const KeyEventsWidget: React.FC = () => {
    const { userData, handleAddKeyEvent, handleDeleteKeyEvent } = useUserData();
    const { keyEvents } = userData;
    const [text, setText] = useState('');
    const [date, setDate] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const sortedEvents = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return keyEvents
            .filter(e => e.date >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 3);
    }, [keyEvents]);

    const handleAdd = () => {
        if (text.trim() && date) {
            handleAddKeyEvent(text, date);
            setText('');
            setDate('');
            setIsAdding(false);
        }
    };

    return (
        <WidgetCard icon="https://api.iconify.design/twemoji/pushpin.svg" title="重要紀事" color="red">
            <div className="space-y-3">
                {sortedEvents.length > 0 ? (
                    <ul className="space-y-2">
                        {sortedEvents.map(event => {
                            const isToday = event.date === new Date().toISOString().split('T')[0];
                            return (
                                <li key={event.id} className="flex justify-between items-center bg-white/50 backdrop-blur-sm p-2 rounded-lg border border-white/40">
                                    <div>
                                        <div className={`text-xs font-bold ${isToday ? 'text-red-600' : 'text-gray-500'}`}>
                                            {event.date.replace(/-/g, '/')}
                                            {isToday && <span className="ml-1 bg-red-100 text-red-600 px-1 rounded text-[10px]">今天</span>}
                                        </div>
                                        <div className="font-semibold text-gray-800">{event.text}</div>
                                    </div>
                                    <button onClick={() => handleDeleteKeyEvent(event.id)} className="text-gray-400 hover:text-red-500">
                                        <img src="https://api.iconify.design/solar/trash-bin-minimalistic-bold.svg" className="w-4 h-4" />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-gray-500 text-center py-2">目前沒有接下來的活動</p>
                )}

                {isAdding ? (
                    <div className="bg-white/60 p-2 rounded-lg border border-red-100 space-y-2 animate-fade-in backdrop-blur-sm">
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full p-1.5 border border-white/50 bg-white rounded-lg text-sm focus:ring-2 focus:ring-red-200 transition-colors text-gray-800"
                        />
                        <input
                            type="text"
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="例如: 運動會"
                            className="w-full p-1.5 border border-white/50 bg-white rounded-lg text-sm focus:ring-2 focus:ring-red-200 transition-colors placeholder-gray-500 text-gray-800"
                        />
                        <div className="flex gap-2">
                            <button onClick={handleAdd} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors">新增</button>
                            <button onClick={() => setIsAdding(false)} className="flex-1 bg-white/50 hover:bg-white/80 text-gray-600 py-1.5 rounded-lg text-xs font-bold transition-colors border border-white/60">取消</button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full py-2 border-2 border-dashed border-red-300/50 text-red-500/70 rounded-lg font-bold hover:bg-red-50/50 hover:text-red-500 transition-colors text-sm flex items-center justify-center gap-1 backdrop-blur-sm"
                    >
                        + 新增記事
                    </button>
                )}
            </div>
        </WidgetCard>
    );
}

const ScoreWidget: React.FC = () => {
    const { userData, handleReportScore } = useUserData();
    const [showModal, setShowModal] = useState(false);
    const lastScore = userData.scoreHistory[0];

    return (
        <>
            <WidgetCard icon="https://api.iconify.design/twemoji/scroll.svg" title="成績單" color="blue">
                <div className="flex items-center justify-between">
                    <div>
                        {lastScore ? (
                            <div className="text-sm">
                                <p className="text-gray-500">上次成績</p>
                                <p className="font-bold text-blue-600">{lastScore.subject}: {lastScore.score}分</p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">還沒有成績紀錄喔</p>
                        )}
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-blue-600 transition-colors flex items-center gap-1"
                    >
                        <img src="https://api.iconify.design/solar/pen-new-square-bold.svg" className="w-3 h-3 invert" />
                        回報成績
                    </button>
                </div>
            </WidgetCard>
            {showModal && (
                <TestScoreModal
                    onClose={() => setShowModal(false)}
                    onReport={(details) => {
                        handleReportScore(details);
                        setShowModal(false);
                    }}
                />
            )}
        </>
    );
};

const DailyStats: React.FC = () => {
    const { userData } = useUserData();
    const { transactions } = userData;

    const stats = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const isToday = (timestamp: number) => new Date(timestamp).toISOString().split('T')[0] === todayStr;

        const todaysTaskCompletions = transactions.filter(t =>
            isToday(t.timestamp) && t.description.startsWith('完成任務:')
        );

        const proactive = todaysTaskCompletions.filter(t => t.description.includes('(主動)')).length;
        const normal = todaysTaskCompletions.length - proactive;

        return { proactive, normal };
    }, [transactions]);

    return (
        <WidgetCard icon="https://api.iconify.design/twemoji/trophy.svg" title="今日戰績" className="bg-white/60">
            <div className="flex justify-around items-center text-center py-2">
                <div className="flex items-center gap-3">
                    <span className="text-4xl font-black text-green-600 tabular-nums leading-none drop-shadow-sm">{stats.normal}</span>
                    <div className="bg-green-500 text-white px-2 py-1.5 rounded-lg flex items-center gap-1 shadow-sm shadow-green-200">
                        <img src="https://api.iconify.design/solar/check-circle-bold.svg" alt="完成" className="w-3.5 h-3.5 filter brightness-0 invert" />
                        <span className="text-xs font-bold tracking-wide">完成</span>
                    </div>
                </div>

                <div className="h-10 w-px bg-gray-400/30 mx-2"></div>

                <div className="flex items-center gap-3">
                    <span className="text-4xl font-black text-blue-600 tabular-nums leading-none drop-shadow-sm">{stats.proactive}</span>
                    <div className="bg-blue-600 text-white px-2 py-1.5 rounded-lg flex items-center gap-1 shadow-sm shadow-blue-200">
                        <img src="https://api.iconify.design/solar/like-bold.svg" alt="主動" className="w-3.5 h-3.5 filter brightness-0 invert" />
                        <span className="text-xs font-bold tracking-wide">主動</span>
                    </div>
                </div>
            </div>
        </WidgetCard>
    );
}

const AiYesterdaySummary: React.FC = () => {
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const { userData } = useUserData();

    useEffect(() => {
        const fetchSummary = async () => {
            // 檢查是否已過中午12點（台灣時間）
            const taiwanHour = getTaiwanHour();
            if (taiwanHour < 12) {
                setSummary('');
                setIsLoading(false);
                return; // 中午12點前不顯示昨日總結
            }

            const yesterdayStr = getTaiwanYesterday();
            const cacheKey = `goodi_summary_${yesterdayStr}`;
            const cachedData = localStorage.getItem(cacheKey);

            // 如果有快取，直接使用（不呼叫 API）
            if (cachedData) {
                setSummary(cachedData);
                setIsLoading(false);
                return;
            }

            // 只有在沒有快取時才呼叫 API
            try {
                const yesterdayTasks = userData.transactions
                    .filter(t => new Date(t.timestamp).toISOString().split('T')[0] === yesterdayStr && t.description.startsWith('完成任務'))
                    .map(t => t.description)
                    .join(', ');

                const prompt = `You are AI partner Goodi. Write a warm summary and encouragement based on child ${userData.userProfile.nickname}'s activity yesterday (in Traditional Chinese, 80-120 words). Completed tasks: ${yesterdayTasks || 'No records'}`;

                // 使用 Firebase Functions
                const generateContent = httpsCallable(functions, 'generateGeminiContent');
                const result = await generateContent({ prompt, model: 'gemini-2.5-flash' });
                const data = result.data as { text: string };

                setSummary(data.text);
                localStorage.setItem(cacheKey, data.text); // 儲存快取
            } catch (error) {
                console.error("Summary Error:", error);
                setSummary("昨天也是很棒的一天！繼續加油喔！");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSummary();
    }, []); // ⬅️ 移除依賴，只在組件載入時執行一次

    // 如果還沒過中午12點，不顯示widget
    if (!summary && !isLoading) return null;

    return (
        <WidgetCard icon="https://api.iconify.design/twemoji/spiral-notepad.svg" title="昨日總結" className="bg-white/60">
            <p className="text-gray-700">{isLoading ? "Goodi 正在回想昨天..." : summary}</p>
        </WidgetCard>
    );
};


const TodayInHistory: React.FC<{ content: string; isLoading: boolean; isBlocked: boolean }> = ({ content, isLoading, isBlocked }) => {
    return (
        <WidgetCard icon="https://api.iconify.design/twemoji/spiral-calendar.svg" title="歷史的今天" color="yellow">
            {isBlocked && (
                <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded mb-2 border border-orange-100">
                    偵測到連線阻擋，請關閉 AdBlock。
                </div>
            )}
            {isLoading ? <SkeletonWidget /> : <p className="text-gray-700">{content}</p>}
        </WidgetCard>
    );
};


const AnimalTrivia: React.FC<{ content: string; isLoading: boolean; isBlocked: boolean }> = ({ content, isLoading, isBlocked }) => {
    return (
        <WidgetCard icon="https://api.iconify.design/twemoji/paw-prints.svg" title="動物冷知識" color="green">
            {isBlocked && (
                <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded mb-2 border border-orange-100">
                    偵測到連線阻擋，請關閉 AdBlock。
                </div>
            )}
            {isLoading ? <SkeletonWidget /> : <p className="text-gray-700">{content}</p>}
        </WidgetCard>
    );
};


const SidebarWidgets: React.FC = () => {
    const { userData } = useUserData();
    const isPremium = hasPremiumAccess(userData?.plan || 'free');
    const { todayInHistory, animalTrivia, isLoading, isBlocked } = useDailyContent();

    return (
        <div className="space-y-4 pb-4">
            <GreetingCard />
            <DailyStats />
            {isPremium && <AiYesterdaySummary />}
            <ScoreWidget />
            <TodayInHistory content={todayInHistory} isLoading={isLoading} isBlocked={isBlocked} />
            <AnimalTrivia content={animalTrivia} isLoading={isLoading} isBlocked={isBlocked} />
            <KeyEventsWidget />
        </div>
    );
};


export default SidebarWidgets;
