import React, { useMemo, useState } from 'react';
import { Task } from '../types';
import { useUserData } from '../UserContext';
import SidebarWidgets from '../components/SidebarWidgets';
<<<<<<< HEAD
import { hasPremiumAccess } from '../utils/planUtils';
=======
import OnboardingModal from '../components/OnboardingModal';

// ... (保持 FeaturedTaskListItem, DailyTaskCard, and other components不變)
>>>>>>> e24192df9de42c5aa82ba8dcf978b459e560fade

// Standardized Button Styles
const BTN_BASE = "flex-1 h-10 px-3 flex items-center justify-center gap-1.5 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95";
const BTN_COMPLETE = "bg-emerald-500 text-white hover:bg-emerald-600";
const BTN_PROACTIVE = "bg-blue-500 text-white hover:bg-blue-600";

<<<<<<< HEAD
// List item for special/weekly tasks (horizontal layout)
const FeaturedTaskListItem: React.FC<{ task: Task; onCompleteTask: (taskId: number, isProactive: boolean) => void; onReportPraise: (info: { taskId: number, isProactive: boolean }) => void; tag: string; }> = ({ task, onCompleteTask, onReportPraise, tag }) => {
=======
const FeaturedTaskListItem: React.FC<{ task: Task; onCompleteTask: (taskId: number, isProactive: boolean) => void; onReportPraise: (info: {taskId: number, isProactive: boolean}) => void; tag: string; }> = ({ task, onCompleteTask, onReportPraise, tag }) => {
>>>>>>> e24192df9de42c5aa82ba8dcf978b459e560fade
    const isPraiseTask = task.id === 27;
    const handleComplete = (isProactive: boolean) => {
        if (isPraiseTask) onReportPraise({ taskId: task.id, isProactive }); else onCompleteTask(task.id, isProactive);
    };
    const tagColor = tag === '每週任務' ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800';

    return (
        <div className={`p-4 rounded-2xl flex items-center transition-all border-b last:border-b-0 border-white/40 hover:bg-white/50 ${task.completed ? 'opacity-70' : ''}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 flex-shrink-0 ${task.completed ? 'bg-gray-200 grayscale' : 'bg-white shadow-sm border border-white/50'}`}>
                <img src={task.icon} alt={task.text} className="h-8 w-8 object-contain" />
            </div>
<<<<<<< HEAD

=======
>>>>>>> e24192df9de42c5aa82ba8dcf978b459e560fade
            <div className="flex-grow min-w-0 mr-4">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className={`font-bold text-lg leading-tight ${task.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{task.text}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${tagColor}`}>{tag}</span>
                </div>
                <p className="text-sm text-gray-500 break-words">{task.description}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 w-[180px] sm:w-[200px]">
                {task.completed ? (
                    <div className="w-full h-10 bg-gray-100 text-gray-500 font-bold rounded-xl flex items-center justify-center gap-2">
                        <img src="https://api.iconify.design/solar/check-circle-bold.svg" alt="完成" className="w-5 h-5 opacity-50" />
                        <span>已完成</span>
                    </div>
                ) : (
                    <>
                        <button onClick={() => handleComplete(false)} className={`${BTN_BASE} ${BTN_COMPLETE}`}>
                            <img src="https://api.iconify.design/solar/check-circle-bold.svg" alt="完成" className="w-5 h-5" style={{ filter: 'invert(1)' }} />
                            <span>完成</span>
                        </button>
                        <button onClick={() => handleComplete(true)} className={`${BTN_BASE} ${BTN_PROACTIVE}`}>
                            <img src="https://api.iconify.design/solar/like-bold.svg" alt="主動" className="w-5 h-5" style={{ filter: 'invert(1)' }} />
                            <span>主動</span>
                        </button>
                    </>
                )}
            </div>
            <div className="ml-3 flex-shrink-0 font-bold text-indigo-600 w-10 text-right">
                +{task.points}
            </div>
        </div>
    );
};

<<<<<<< HEAD

// Card for daily tasks (vertical layout)
const DailyTaskCard: React.FC<{ task: Task; onCompleteTask: (taskId: number, isProactive: boolean) => void; onReportPraise: (info: { taskId: number, isProactive: boolean }) => void; }> = ({ task, onCompleteTask, onReportPraise }) => {
=======
const DailyTaskCard: React.FC<{ task: Task; onCompleteTask: (taskId: number, isProactive: boolean) => void; onReportPraise: (info: {taskId: number, isProactive: boolean}) => void; }> = ({ task, onCompleteTask, onReportPraise }) => {
>>>>>>> e24192df9de42c5aa82ba8dcf978b459e560fade
    const isPraiseTask = task.id === 27;
    const handleComplete = (isProactive: boolean) => {
        if (isPraiseTask) onReportPraise({ taskId: task.id, isProactive }); else onCompleteTask(task.id, isProactive);
    };

    return (
        <div className={`p-4 rounded-2xl flex flex-col justify-between h-full border-2 transition-all duration-200 ${task.completed ? 'bg-gray-50/50 border-transparent backdrop-blur-sm' : 'bg-white/70 backdrop-blur-md border-white/40 hover:border-blue-300 hover:shadow-md'}`}>
            <div className="flex items-start gap-3 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${task.completed ? 'bg-gray-200 grayscale' : 'bg-blue-50'}`}>
                    <img src={task.icon} alt={task.text} className="h-8 w-8 object-contain" />
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`font-bold text-base leading-tight mb-1 break-words ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{task.text}</h4>
                        {task.mastered && (
                            <span className="bg-yellow-100 text-yellow-700 text-[10px] px-1.5 py-0.5 rounded font-bold border border-yellow-200 flex items-center gap-0.5">
                                <img src="https://api.iconify.design/twemoji/crown.svg" className="w-3 h-3" /> 大師
                            </span>
                        )}
                    </div>
<<<<<<< HEAD

=======
>>>>>>> e24192df9de42c5aa82ba8dcf978b459e560fade
                    <p className="text-indigo-600 font-bold text-xs">
                        +{task.mastered ? Math.floor(task.points * 1.5) : task.points} 積分
                        {task.mastered && <span className="text-[10px] ml-1 text-yellow-600">(x1.5)</span>}
                    </p>
                    {task.isHabit && !task.completed && !task.mastered && (
                        <div className="mt-1 text-[10px] text-gray-500 bg-gray-100/50 px-1.5 py-0.5 rounded w-fit">
                            連續 {task.consecutiveCompletions}/21 天
                        </div>
                    )}
                </div>
            </div>
<<<<<<< HEAD

=======
>>>>>>> e24192df9de42c5aa82ba8dcf978b459e560fade
            <div className="mt-auto">
                {task.completed ? (
                    <div className="w-full h-10 bg-gray-100/50 text-gray-400 font-bold rounded-xl flex items-center justify-center gap-2 cursor-default backdrop-blur-sm">
                        <img src="https://api.iconify.design/solar/check-circle-bold.svg" alt="完成" className="w-5 h-5 opacity-40" />
                        <span>已完成</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleComplete(false)} className={`${BTN_BASE} ${BTN_COMPLETE}`}>
                            <img src="https://api.iconify.design/solar/check-circle-bold.svg" alt="完成" className="w-5 h-5" style={{ filter: 'invert(1)' }} />
                            <span>完成</span>
                        </button>
                        <button onClick={() => handleComplete(true)} className={`${BTN_BASE} ${BTN_PROACTIVE}`}>
                            <img src="https://api.iconify.design/solar/like-bold.svg" alt="主動" className="w-5 h-5" style={{ filter: 'invert(1)' }} />
                            <span>主動</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

interface HomePageProps {
    setPraiseTaskInfo: (info: { taskId: number, isProactive: boolean } | null) => void;
}

const CustomTaskModal: React.FC<{
    onClose: () => void;
    onSubmit: (text: string, frequency: 'today' | 'everyday' | 'schooldays') => void;
}> = ({ onClose, onSubmit }) => {
    const [text, setText] = useState('');
    const [frequency, setFrequency] = useState<'today' | 'everyday' | 'schooldays'>('today');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            onSubmit(text.trim(), frequency);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl p-6 max-w-md w-full transform transition-all animate-fade-in scale-95" onClick={e => e.stopPropagation()}>
                <div className="text-center mb-6">
                    <div className="bg-blue-100 p-4 rounded-full inline-block mb-3 shadow-inner">
                        <img src="https://api.iconify.design/twemoji/magic-wand.svg" alt="Magic" className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-700">自訂學習任務</h2>
                    <p className="text-gray-500 text-sm">自己設定任務，完成後可得 2 分喔！</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">任務名稱</label>
                        <input
                            type="text"
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="例如：練習跳繩 100 下"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none bg-white"
                            autoFocus
                        />
                    </div>
<<<<<<< HEAD

=======
>>>>>>> e24192df9de42c5aa82ba8dcf978b459e560fade
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">頻率</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'today', label: '只有今天' },
                                { id: 'everyday', label: '每天' },
                                { id: 'schooldays', label: '上學日' }
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setFrequency(opt.id as any)}
                                    className={`py-2 px-1 rounded-lg text-sm font-bold border transition-all ${frequency === opt.id ? 'bg-blue-500 text-white border-blue-600 shadow-md' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors">
                            取消
                        </button>
                        <button type="submit" disabled={!text.trim()} className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:bg-gray-300 disabled:shadow-none">
                            確認新增
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const HomePage: React.FC<HomePageProps> = ({ setPraiseTaskInfo }) => {
<<<<<<< HEAD
    const { userData, handleCompleteTask, handleChildAddTask, addToast } = useUserData();

    if (!userData) {
        return <div className="flex items-center justify-center h-full">載入中...</div>;
=======
  const { userData, userDataLoading, handleCompleteTask, handleChildAddTask, addToast } = useUserData();
  
  const [dailyTab, setDailyTab] = useState<'life' | 'chore' | 'learning'>('life');
  const [showCustomTaskModal, setShowCustomTaskModal] = useState(false);
  
  // Immediately show loading if either auth or user data is loading
  if (userDataLoading) {
    return <div className="h-full flex items-center justify-center"><p>讀取使用者資料中...</p></div>;
  }

  // If loading is finished but there's still no user data, it's an error or logged-out state
  if (!userData) {
    return <div className="h-full flex items-center justify-center"><p>無法載入使用者資料，請重新登入。</p></div>;
  }

  const { tasks, plan, planTrialEndDate, userProfile } = userData;

  // Moved this check after userData is confirmed to exist
  const showOnboarding = userProfile && (!userProfile.onboardingComplete || !userProfile.nickname);

  const isTrialActive = planTrialEndDate && new Date(planTrialEndDate) > new Date();
  const effectivePlan = (isTrialActive && plan === 'free') ? 'paid199' : plan;
  const isPremium = effectivePlan === 'paid499';

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const dayOfWeekMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const currentDayKey = dayOfWeekMap[today.getDay()] as 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

  const { weeklyTasks, specialTasks, lifeTasks, choreTasks, learningTasks } = useMemo(() => {
    const weekly: Task[] = [], special: Task[] = [], life: Task[] = [], chore: Task[] = [], learning: Task[] = [];
    // Ensure tasks exist before trying to loop
    (tasks || []).forEach(t => {
        let isVisible = true;
        if (t.schedule && t.schedule.length > 0) {
            if (!t.schedule.includes(currentDayKey)) isVisible = false;
        }
        if (t.dateRange) {
            if (todayStr < t.dateRange.start || todayStr > t.dateRange.end) isVisible = false;
        }
        if (isVisible) {
            if (t.category === '每週') weekly.push(t);
            else if (t.category === '特殊') special.push(t);
            else if (t.category === '生活') life.push(t);
            else if (t.category === '家務') chore.push(t);
            else if (t.category === '學習') learning.push(t);
        }
    });
    return { weeklyTasks: weekly, specialTasks: special, lifeTasks: life, choreTasks: chore, learningTasks: learning };
  }, [tasks, currentDayKey, todayStr]);
  
  const dailyTabConfig = {
      life: { label: '生活', icon: 'https://api.iconify.design/twemoji/sun.svg', tasks: lifeTasks },
      chore: { label: '家務', icon: 'https://api.iconify.design/twemoji/broom.svg', tasks: choreTasks },
      learning: { label: '學習', icon: 'https://api.iconify.design/twemoji/books.svg', tasks: learningTasks },
  };

  const currentDailyTasks = dailyTabConfig[dailyTab].tasks;
  const featuredTasks = [...weeklyTasks, ...specialTasks];

  const handleAddChildTaskClick = () => {
    if (!isPremium) {
        addToast('這是高級方案功能喔！請爸爸媽媽幫你解鎖。');
        return;
>>>>>>> e24192df9de42c5aa82ba8dcf978b459e560fade
    }

    const { tasks, plan, planTrialEndDate } = userData;

<<<<<<< HEAD
    const [dailyTab, setDailyTab] = useState<'life' | 'chore' | 'learning'>('life');
    const [showCustomTaskModal, setShowCustomTaskModal] = useState(false);

    // Check for active plan or active trial
    const isTrialActive = planTrialEndDate && new Date(planTrialEndDate) > new Date();
    const effectivePlan = (isTrialActive && plan === 'free') ? 'paid199' : plan;
    // Child added task is a Premium feature
    const isPremium = hasPremiumAccess(effectivePlan);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const dayOfWeekMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDayKey = dayOfWeekMap[today.getDay()] as 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

    const { weeklyTasks, specialTasks, lifeTasks, choreTasks, learningTasks } = useMemo(() => {
        const weekly: Task[] = [], special: Task[] = [], life: Task[] = [], chore: Task[] = [], learning: Task[] = [];
        tasks.forEach(t => {
            // Filter Logic: Show task only if it matches today's schedule or if it has no specific schedule constraints
            let isVisible = true;

            // Check Schedule (e.g. Mon, Tue...)
            if (t.schedule && t.schedule.length > 0) {
                if (!t.schedule.includes(currentDayKey)) {
                    isVisible = false;
                }
            }

            // Check Date Range (e.g. specific dates)
            if (t.dateRange) {
                if (todayStr < t.dateRange.start || todayStr > t.dateRange.end) {
                    isVisible = false;
                }
            }

            if (isVisible) {
                if (t.category === '每週') weekly.push(t);
                else if (t.category === '特殊') special.push(t);
                else if (t.category === '生活') life.push(t);
                else if (t.category === '家務') chore.push(t);
                else if (t.category === '學習') learning.push(t);
            }
        });
        return { weeklyTasks: weekly, specialTasks: special, lifeTasks: life, choreTasks: chore, learningTasks: learning };
    }, [tasks, currentDayKey, todayStr]);

    const dailyTabConfig = {
        life: { label: '生活', icon: 'https://api.iconify.design/twemoji/sun.svg', tasks: lifeTasks },
        chore: { label: '家務', icon: 'https://api.iconify.design/twemoji/broom.svg', tasks: choreTasks },
        learning: { label: '學習', icon: 'https://api.iconify.design/twemoji/books.svg', tasks: learningTasks },
    };

    const currentDailyTasks = dailyTabConfig[dailyTab].tasks;
    const featuredTasks = [...weeklyTasks, ...specialTasks];

    const handleAddChildTaskClick = () => {
        if (!isPremium) {
            addToast('這是高級方案功能喔！請爸爸媽媽幫你解鎖。');
            return;
        }
        setShowCustomTaskModal(true);
    };

    const handleCustomTaskSubmit = (text: string, frequency: 'today' | 'everyday' | 'schooldays') => {
        handleChildAddTask(text, frequency);
        setShowCustomTaskModal(false);
        setDailyTab('learning');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 h-full">
            {showCustomTaskModal && <CustomTaskModal onClose={() => setShowCustomTaskModal(false)} onSubmit={handleCustomTaskSubmit} />}

            <div className="lg:col-span-3 space-y-4 sm:space-y-6 flex flex-col">

                {/* Featured Section (Weekly + Special) */}
=======
  return (
    <>
        {showOnboarding && <OnboardingModal />}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 h-full">
            {showCustomTaskModal && <CustomTaskModal onClose={() => setShowCustomTaskModal(false)} onSubmit={handleCustomTaskSubmit} />}
            <div className="lg:col-span-3 space-y-4 sm:space-y-6 flex flex-col">
>>>>>>> e24192df9de42c5aa82ba8dcf978b459e560fade
                {(featuredTasks.length > 0) && (
                    <div className="bg-white/60 backdrop-blur-md rounded-3xl shadow-xl p-4 sm:p-6 flex-shrink-0 border border-white/30">
                        <h3 className="font-black text-xl text-slate-700 mb-4 flex items-center gap-2">
                            <img src="https://api.iconify.design/twemoji/glowing-star.svg" alt="" className="w-6 h-6" />
                            特別挑戰
                        </h3>
                        <div className="flex flex-col">
                            {featuredTasks.map(task => (
<<<<<<< HEAD
                                <FeaturedTaskListItem
                                    key={task.id}
                                    task={task}
                                    onCompleteTask={handleCompleteTask}
                                    onReportPraise={setPraiseTaskInfo}
                                    tag={task.category === '每週' ? '每週任務' : '特殊任務'}
=======
                                 <FeaturedTaskListItem 
                                    key={task.id} 
                                    task={task} 
                                    onCompleteTask={handleCompleteTask} 
                                    onReportPraise={setPraiseTaskInfo} 
                                    tag={task.category === '每週' ? '每週任務' : '特殊任務'} 
>>>>>>> e24192df9de42c5aa82ba8dcf978b459e560fade
                                />
                            ))}
                        </div>
                    </div>
                )}
<<<<<<< HEAD

                {/* Daily Tasks Section */}
                <div className="bg-white/60 backdrop-blur-md rounded-3xl shadow-xl p-4 sm:p-6 flex-grow flex flex-col border border-white/30 min-h-[400px]">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 flex-shrink-0">
=======
                <div className="bg-white/60 backdrop-blur-md rounded-3xl shadow-xl p-4 sm:p-6 flex-grow flex flex-col border border-white/30 min-h-[400px]">
                     <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 flex-shrink-0">
>>>>>>> e24192df9de42c5aa82ba8dcf978b459e560fade
                        <h3 className="font-black text-xl text-slate-700 flex items-center gap-2 self-start sm:self-center">
                            <img src="https://api.iconify.design/solar/calendar-mark-bold-duotone.svg" alt="" className="w-6 h-6 text-orange-400" />
                            每日任務
                        </h3>
                        <div className="flex p-1 bg-white/40 backdrop-blur-sm rounded-xl self-stretch sm:self-auto shadow-inner border border-white/50">
<<<<<<< HEAD
                            {Object.entries(dailyTabConfig).map(([key, { label, icon }]) => (
                                <button
                                    key={key}
                                    onClick={() => setDailyTab(key as any)}
                                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${dailyTab === key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <span className={dailyTab === key ? '' : 'grayscale opacity-70'}>
                                        <img src={icon} className="w-4 h-4" alt="" />
=======
                            {Object.entries(dailyTabConfig).map(([key, {label, icon}]) => (
                                <button 
                                    key={key} 
                                    onClick={() => setDailyTab(key as any)} 
                                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${dailyTab === key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <span className={dailyTab === key ? '' : 'grayscale opacity-70'}>
                                         <img src={icon} className="w-4 h-4" alt=""/>
>>>>>>> e24192df9de42c5aa82ba8dcf978b459e560fade
                                    </span>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
<<<<<<< HEAD

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 flex-grow content-start overflow-y-auto pr-1 pb-2">
                        {currentDailyTasks.map((task) => (
=======
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 flex-grow content-start overflow-y-auto pr-1 pb-2">
                        {(currentDailyTasks || []).map((task) => (
>>>>>>> e24192df9de42c5aa82ba8dcf978b459e560fade
                            <div key={task.id} className="h-full">
                                <DailyTaskCard task={task} onCompleteTask={handleCompleteTask} onReportPraise={setPraiseTaskInfo} />
                            </div>
                        ))}
                        {dailyTab === 'learning' && (
                            <div className="h-full">
<<<<<<< HEAD
                                <button
=======
                                <button 
>>>>>>> e24192df9de42c5aa82ba8dcf978b459e560fade
                                    onClick={handleAddChildTaskClick}
                                    className="w-full h-full min-h-[140px] p-4 rounded-2xl border-2 border-dashed border-gray-400/50 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 group backdrop-blur-sm"
                                >
                                    <div className="w-12 h-12 rounded-full bg-white/50 group-hover:bg-blue-100 flex items-center justify-center mb-3 transition-colors shadow-sm">
<<<<<<< HEAD
                                        <img src="https://api.iconify.design/solar/magic-stick-3-bold.svg" alt="Add" className="w-6 h-6 opacity-50 group-hover:opacity-100 group-hover:text-blue-500 transition-opacity" />
=======
                                         <img src="https://api.iconify.design/solar/magic-stick-3-bold.svg" alt="Add" className="w-6 h-6 opacity-50 group-hover:opacity-100 group-hover:text-blue-500 transition-opacity" />
>>>>>>> e24192df9de42c5aa82ba8dcf978b459e560fade
                                    </div>
                                    <h4 className="font-bold text-base">自訂學習任務</h4>
                                    <span className="text-xs text-gray-400 mt-1">(完成可獲得 +2 分)</span>
                                    {!isPremium && (
                                        <div className="mt-2 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
<<<<<<< HEAD
                                            <img src="https://api.iconify.design/solar/lock-keyhole-minimalistic-bold.svg" alt="lock" className="w-3 h-3 opacity-50" />
=======
                                             <img src="https://api.iconify.design/solar/lock-keyhole-minimalistic-bold.svg" alt="lock" className="w-3 h-3 opacity-50"/>
>>>>>>> e24192df9de42c5aa82ba8dcf978b459e560fade
                                            高級版解鎖
                                        </div>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                    {currentDailyTasks.length === 0 && dailyTab !== 'learning' && (
                        <div className="text-center py-12 text-gray-400 flex-grow flex flex-col items-center justify-center">
                            <img src="https://api.iconify.design/solar/sleeping-square-line-duotone.svg" className="w-16 h-16 mb-2 opacity-50" alt="Empty" />
                            <p>這個分類目前沒有任務喔！</p>
                        </div>
                    )}
                </div>
            </div>
<<<<<<< HEAD

            {/* Sidebar */}
=======
>>>>>>> e24192df9de42c5aa82ba8dcf978b459e560fade
            <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-1 custom-scrollbar">
                <SidebarWidgets />
            </div>
        </div>
<<<<<<< HEAD
    );
=======
    </>
  );
>>>>>>> e24192df9de42c5aa82ba8dcf978b459e560fade
};

export default HomePage;
