
import React, { useState, useEffect } from 'react';
import { Page, ActiveParentChildTimeSession, InventoryItem, ZhuyinMode, Plan, PricingTier } from './types';
import { useUserData } from './UserContext';
import Header from './components/Header';
import TopNav from './components/TopNav';
import HomePage from './pages/HomePage';
import GachaponPage from './pages/RewardsPage';
import RewardShopPage from './pages/RewardShopPage';
import WalletPage from './pages/WalletPage';
import WhisperTreePage from './pages/WhisperTreePage';
import { ParentModePage } from './pages/ParentModePage';
import AchievementsPage from './pages/AchievementsPage';
import FocusTimerPage from './pages/FocusTimerPage';
import ParentChildTimePage from './pages/ParentChildTimePage';
import ParentPinModal from './components/ParentPinModal';
import PraiseModal from './components/PraiseModal';

const AppContent: React.FC = () => {
  const { userData, updateUserData, handleUseItem, addToast } = useUserData();
  
  // ... (useState and other hooks remain the same)
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [isParentMode, setIsParentMode] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [praiseTaskInfo, setPraiseTaskInfo] = useState<{ taskId: number; isProactive: boolean; } | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveParentChildTimeSession | null>(null);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);

  if (!userData) {
    return <div className="h-screen flex items-center justify-center">讀取使用者設定中...</div>;
  }

  const { userProfile, plan, zhuyinMode } = userData;

  const handleSetZhuyinMode = (mode: ZhuyinMode) => updateUserData({ zhuyinMode: mode });

  const getPricingTier = (plan: Plan): PricingTier => {
    if (plan.includes('advanced')) return 'advanced';
    if (plan.includes('premium')) return 'premium';
    return 'free';
  };

  const pricingTier = getPricingTier(plan);
  const hasAdvancedAccess = pricingTier !== 'free';
  const hasPremiumAccess = pricingTier === 'premium';

  // ... (useEffect and other handlers remain the same)

  const renderPage = () => {
    if (isParentMode) {
        return <ParentModePage onExit={() => setIsParentMode(false)} currentZhuyinMode={zhuyinMode} onSetZhuyinMode={handleSetZhuyinMode} />;
    }
    switch (currentPage) {
      case Page.Home:
        // ✅ Pass all required props to HomePage
        return <HomePage setPraiseTaskInfo={setPraiseTaskInfo} zhuyinMode={zhuyinMode} userAge={userProfile?.age ?? 0} />;
      case Page.Gachapon: 
        return <GachaponPage />;
      case Page.RewardShop: 
        return <RewardShopPage />;
      case Page.Backpack: 
        return <WalletPage onUseItem={() => {}} />;
      case Page.Tree: 
        return <WhisperTreePage />;
      case Page.Achievements: 
        return <AchievementsPage />;
      case Page.FocusTimer: 
        return <FocusTimerPage />;
      case Page.ParentChildTime:
        return <ParentChildTimePage session={activeSession} timeLeft={sessionTimeLeft} isActive={isSessionActive} onToggle={() => {}} onReset={() => {}} onComplete={() => {}} onExit={() => {}} />;
      default:
        // ✅ Pass all required props to HomePage
        return <HomePage setPraiseTaskInfo={setPraiseTaskInfo} zhuyinMode={zhuyinMode} userAge={userProfile?.age ?? 0} />;
    }
  };

  return (
    <div className="h-screen max-h-screen flex flex-col p-2 sm:p-4 gap-3 sm:gap-4 font-sans text-slate-800 overflow-hidden transition-all duration-500 bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9]">
        <div className="relative z-10 flex flex-col h-full max-w-7xl mx-auto w-full">
            <Header onLogoClick={() => setCurrentPage(Page.Home)} />
            {!isParentMode && (
                <div className="flex-shrink-0">
                    <TopNav currentPage={currentPage} setCurrentPage={setCurrentPage} onParentNav={() => setShowPinModal(true)} plan={plan} isSessionInProgress={!!activeSession} />
                </div>
            )}
            <main className="flex-grow overflow-y-auto pr-1 overflow-x-hidden rounded-xl custom-scrollbar mt-2">{renderPage()}</main>
        </div>
        {showPinModal && <ParentPinModal onClose={() => setShowPinModal(false)} onCorrectPin={() => { setShowPinModal(false); setIsParentMode(true);}} />}
        {praiseTaskInfo && <PraiseModal taskInfo={praiseTaskInfo} onClose={() => setPraiseTaskInfo(null)} />}
    </div>
  );
};

export default AppContent;
