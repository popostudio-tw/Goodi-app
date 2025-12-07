
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
import { ParentModePage } from './pages/ParentModePage'; // ✅ Corrected import
import AchievementsPage from './pages/AchievementsPage';
import FocusTimerPage from './pages/FocusTimerPage';
import ParentChildTimePage from './pages/ParentChildTimePage';
import OnboardingModal from './components/OnboardingModal';
import ParentPinModal from './components/ParentPinModal';
import PraiseModal from './components/PraiseModal';

// This component contains the entire UI that was previously in App.tsx
const AppContent: React.FC = () => {
  const { userData, updateUserData, handleUseItem, addToast } = useUserData();

  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [isParentMode, setIsParentMode] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [praiseTaskInfo, setPraiseTaskInfo] = useState<{ taskId: number; isProactive: boolean; } | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveParentChildTimeSession | null>(null);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // This should not happen if ProtectedRoute is working, but as a safeguard.
  if (!userData) {
    return (
      <div className="h-screen flex items-center justify-center">
        讀取使用者設定中...
      </div>
    );
  }
  
  const handleSetZhuyinMode = (mode: ZhuyinMode) => updateUserData({ zhuyinMode: mode });

  const getPricingTier = (plan: Plan): PricingTier => {
    if (plan.includes('advanced')) return 'advanced';
    if (plan.includes('premium')) return 'premium';
    return 'free';
  };

  const pricingTier = getPricingTier(userData.plan);
  const hasAdvancedAccess = pricingTier !== 'free';
  const hasPremiumAccess = pricingTier === 'premium';

  useEffect(() => {
    let interval: number | null = null;
    if (isSessionActive && sessionTimeLeft > 0) {
      interval = window.setInterval(() => setSessionTimeLeft((time) => time - 1), 1000);
    } else if (sessionTimeLeft === 0 && isSessionActive) {
      setIsSessionActive(false);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isSessionActive, sessionTimeLeft]);

  const handleStartParentChildTime = (item: InventoryItem) => {
    if (item.action === 'parent_child_time' && item.durationMinutes) {
      setActiveSession({
        itemId: item.id,
        itemName: item.name,
        itemIcon: item.description,
        totalDurationSeconds: item.durationMinutes * 60,
      });
      setSessionTimeLeft(item.durationMinutes * 60);
      setIsSessionActive(false);
      setCurrentPage(Page.ParentChildTime);
    }
  };

  const handleLocalUseItem = (itemId: number) => {
    const item = userData.inventory.find((i) => i.id === itemId);
    if (item) {
      handleUseItem(itemId, {
        onStartParentChildTime: () => handleStartParentChildTime(item),
      });
    }
  };

  const handleSessionComplete = () => {
    if (!activeSession) return;
    addToast(`親子時光完成！獎勵 5 積分！`, 'celebrate');
    updateUserData({
      points: userData.points + 5,
      inventory: userData.inventory.map((i) => i.id === activeSession.itemId ? { ...i, used: true } : i),
    });
    setActiveSession(null);
    setSessionTimeLeft(0);
    setIsSessionActive(false);
    setCurrentPage(Page.Backpack);
  };

  const handleSetCurrentPage = (page: Page) => {
    if (page === Page.ParentChildTime && !activeSession) return;
    if (([Page.FocusTimer, Page.ParentChildTime].includes(page) && !hasAdvancedAccess) || 
        ([Page.Tree, Page.Achievements, Page.Parent].includes(page) && !hasPremiumAccess)) {
      addToast('升級方案以解鎖此功能！');
      return;
    }
    setCurrentPage(page);
  };

  const handleLogoClick = () => {
    if (isParentMode) setIsParentMode(false);
    handleSetCurrentPage(Page.Home);
  };

  if (userData.userProfile && !userData.userProfile.onboardingComplete) {
    return <OnboardingModal />;
  }

  const renderPage = () => {
    if (isParentMode) return <ParentModePage onExit={() => setIsParentMode(false)} currentZhuyinMode={userData.zhuyinMode} onSetZhuyinMode={handleSetZhuyinMode} />;
    switch (currentPage) {
      case Page.Home: return <HomePage setPraiseTaskInfo={setPraiseTaskInfo} zhuyinMode={userData.zhuyinMode} userAge={userData.userProfile?.age ?? 0} />;
      case Page.Gachapon: return <GachaponPage />;
      case Page.RewardShop: return <RewardShopPage />;
      case Page.Backpack: return <WalletPage onUseItem={handleLocalUseItem} />;
      case Page.Tree: return <WhisperTreePage />;
      case Page.Achievements: return <AchievementsPage />;
      case Page.FocusTimer: return <FocusTimerPage />;
      case Page.ParentChildTime: return <ParentChildTimePage session={activeSession} timeLeft={sessionTimeLeft} isActive={isSessionActive} onToggle={() => setIsSessionActive((p) => !p)} onReset={() => { if (activeSession) { setSessionTimeLeft(activeSession.totalDurationSeconds); setIsSessionActive(false); } }} onComplete={handleSessionComplete} onExit={() => setCurrentPage(Page.Backpack)} />;
      default: return <HomePage setPraiseTaskInfo={setPraiseTaskInfo} zhuyinMode={userData.zhuyinMode} userAge={userData.userProfile?.age ?? 0} />;
    }
  };

  return (
    <div className="h-screen max-h-screen flex flex-col p-2 sm:p-4 gap-3 sm:gap-4 font-sans text-slate-800 overflow-hidden transition-all duration-500 bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9]">
      <div className="relative z-10 flex flex-col h-full max-w-7xl mx-auto w-full">
        <Header onLogoClick={handleLogoClick} />
        {!isParentMode && (
          <div className="flex-shrink-0">
            <TopNav currentPage={currentPage} setCurrentPage={handleSetCurrentPage} onParentNav={() => setShowPinModal(true)} plan={userData.plan} isSessionInProgress={!!activeSession} />
          </div>
        )}
        <main className="flex-grow overflow-y-auto pr-1 overflow-x-hidden rounded-xl custom-scrollbar mt-2">{renderPage()}</main>
      </div>
      {showPinModal && <ParentPinModal onClose={() => setShowPinModal(false)} onCorrectPin={() => { setShowPinModal(false); setIsParentMode(true); setCurrentPage(Page.Parent);}} />}
      {praiseTaskInfo && <PraiseModal taskInfo={praiseTaskInfo} onClose={() => setPraiseTaskInfo(null)} />}
    </div>
  );
};

export default AppContent;
