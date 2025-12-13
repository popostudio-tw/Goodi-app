// src/AppContent.tsx
import React, { useState, useEffect } from 'react';
import { Page, ActiveParentChildTimeSession, InventoryItem } from './types';
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
  const { userData, updateUserData, handleUseItem } = useUserData();

  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [isParentMode, setIsParentMode] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  const [praiseTaskInfo, setPraiseTaskInfo] = useState<{
    taskId: number;
    isProactive: boolean;
  } | null>(null);

  const [activeSession, setActiveSession] =
    useState<ActiveParentChildTimeSession | null>(null);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0); // 秒
  const [isSessionActive, setIsSessionActive] = useState(false);

  if (!userData) {
    return (
      <div className="h-screen flex items-center justify-center">
        讀取使用者設定中...
      </div>
    );
  }

  const { userProfile, plan, zhuyinMode } = userData;

  // --- 注音模式切換 --- //
  const handleSetZhuyinMode = (mode: typeof zhuyinMode) => {
    updateUserData({ zhuyinMode: mode });
  };

  const getPricingTier = (planValue: string): 'free' | 'advanced' | 'premium' => {
    if (planValue.includes('advanced')) return 'advanced';
    if (planValue.includes('premium')) return 'premium';
    return 'free';
  };

  const pricingTier = getPricingTier(plan);
  const hasAdvancedAccess = pricingTier !== 'free';
  const hasPremiumAccess = pricingTier === 'premium';

  // --- 親子時光：啟動計時 --- //
  const handleStartParentChildTime = (item: InventoryItem) => {
    if (!item.durationMinutes) return;

    // 這裡照你 zip 版本邏輯：
    // item.name 當作名稱，item.description 目前被當成 icon URL 使用
    const totalSeconds = item.durationMinutes * 60;

    setActiveSession({
      itemId: item.id,
      itemName: item.name,
      itemIcon: item.description, // 你的 WalletPage 是用 description 當圖片 URL
      totalDurationSeconds: totalSeconds,
    });
    setSessionTimeLeft(totalSeconds);
    setIsSessionActive(true);
    setCurrentPage(Page.ParentChildTime);
  };

  // --- 親子時光：包一層給 WalletPage 用 --- //
  const handleUseItemWithSession = (itemId: number) => {
    if (!userData) return;

    const item = userData.inventory.find((i) => i.id === itemId);
    if (!item) return;

    handleUseItem(itemId, {
      onStartParentChildTime: () => handleStartParentChildTime(item),
    });
  };

  // --- 親子時光：倒數計時 --- //
  useEffect(() => {
    if (!isSessionActive || !activeSession) return;
    if (sessionTimeLeft <= 0) {
      handleSessionComplete();
      return;
    }

    const interval = window.setInterval(() => {
      setSessionTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSessionActive, sessionTimeLeft, activeSession]);

  // --- 親子時光：完成 --- //
  const handleSessionComplete = () => {
    if (!activeSession) return;

    // 這裡沿用你 zip 版本的邏輯：結束後把 item 標記為 used
    const updatedInventory = userData.inventory.map((item) =>
      item.id === activeSession.itemId ? { ...item, used: true } : item
    );

    updateUserData({ inventory: updatedInventory });
    setIsSessionActive(false);
    setActiveSession(null);
    setSessionTimeLeft(0);
  };

  // --- 切換頁面時，如果在 ParentChildTime，保留 session 狀態 --- //
  const handleSetCurrentPage = (page: Page) => {
    setCurrentPage(page);
  };

  // --- 頁面渲染 --- //
  const renderPage = () => {
    if (isParentMode) {
      return (
        <ParentModePage
          onExit={() => setIsParentMode(false)}
          currentZhuyinMode={zhuyinMode}
          onSetZhuyinMode={handleSetZhuyinMode}
          hasAdvancedAccess={hasAdvancedAccess}
          hasPremiumAccess={hasPremiumAccess}
        />
      );
    }

    switch (currentPage) {
      case Page.Home:
        return <HomePage setPraiseTaskInfo={setPraiseTaskInfo} />;
      case Page.Gachapon:
        return <GachaponPage />;
      case Page.RewardShop:
        return <RewardShopPage />;
      case Page.Backpack:
        return <WalletPage onUseItem={handleUseItemWithSession} />;
      case Page.Tree:
        return <WhisperTreePage />;
      case Page.Achievements:
        return <AchievementsPage />;
      case Page.FocusTimer:
        return <FocusTimerPage />;
      case Page.ParentChildTime:
        return (
          <ParentChildTimePage
            session={activeSession}
            timeLeft={sessionTimeLeft}
            isActive={isSessionActive}
            onToggle={() => setIsSessionActive((prev) => !prev)}
            onReset={() => {
              if (activeSession) {
                setSessionTimeLeft(activeSession.totalDurationSeconds);
                setIsSessionActive(false);
              }
            }}
            onComplete={handleSessionComplete}
            onExit={() => {
              setCurrentPage(Page.Home);
            }}
          />
        );
      default:
        return <HomePage setPraiseTaskInfo={setPraiseTaskInfo} />;
    }
  };

  return (
    <div className="h-screen max-h-screen flex flex-col p-2 sm:p-4 gap-3 sm:gap-4 font-sans text-slate-800 overflow-hidden transition-all duration-500 bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9]">
      <div className="relative z-10 flex flex-col h-full max-w-7xl mx-auto w-full">
        <Header onLogoClick={() => handleSetCurrentPage(Page.Home)} />
        {!isParentMode && (
          <div className="flex-shrink-0">
            <TopNav
              currentPage={currentPage}
              setCurrentPage={handleSetCurrentPage}
              onParentNav={() => setShowPinModal(true)}
              plan={plan}
              isSessionInProgress={!!activeSession}
            />
          </div>
        )}
        <main className="flex-grow overflow-y-auto pr-1 overflow-x-hidden rounded-xl custom-scrollbar mt-2">
          {renderPage()}
        </main>
      </div>

      {showPinModal && (
        <ParentPinModal
          onClose={() => setShowPinModal(false)}
          onCorrectPin={() => {
            setShowPinModal(false);
            setIsParentMode(true);
          }}
        />
      )}

      {praiseTaskInfo && (
        <PraiseModal
          taskInfo={praiseTaskInfo}
          onClose={() => setPraiseTaskInfo(null)}
        />
      )}
    </div>
  );
};

export default AppContent;
