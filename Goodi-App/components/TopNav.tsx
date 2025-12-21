
import React from 'react';
import { Page, Plan, PricingTier } from '../types';
import { getPricingTier, hasAdvancedAccess, hasPremiumAccess } from '../utils/planUtils';

interface TopNavProps {
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
    onParentNav: () => void;
    plan: Plan;
    isSessionInProgress: boolean;
}

const NAV_ITEMS: Array<{
    page: Page | 'PARENT';
    label: string;
    icon: string;
    color: string;
    lockedColor: string;
    requiredTier?: PricingTier;
}> = [
        // Macaron Color Scheme: Pink -> Sky -> Emerald -> Amber
        { page: Page.Home, label: '任務', icon: 'https://api.iconify.design/twemoji/clipboard.svg', color: 'bg-pink-400 hover:bg-pink-500', lockedColor: 'bg-gray-200' },
        { page: Page.Gachapon, label: '扭蛋', icon: 'https://static.wixstatic.com/media/ec806c_06542b0096b548309242e2a2406200e4~mv2.png', color: 'bg-sky-400 hover:bg-sky-500', lockedColor: 'bg-gray-200' },
        { page: Page.RewardShop, label: '商店', icon: 'https://api.iconify.design/twemoji/convenience-store.svg', color: 'bg-emerald-400 hover:bg-emerald-500', lockedColor: 'bg-gray-200' },
        { page: Page.Backpack, label: '背包', icon: 'https://api.iconify.design/twemoji/school-backpack.svg', color: 'bg-amber-400 hover:bg-amber-500', lockedColor: 'bg-gray-200' },

        // Secondary items: Teal -> Orange -> Purple -> Slate
        { page: Page.FocusTimer, label: '番茄鐘', icon: 'https://api.iconify.design/twemoji/timer-clock.svg', requiredTier: 'advanced', color: 'bg-orange-400 hover:bg-orange-500', lockedColor: 'bg-gray-200' },
        { page: Page.Tree, label: '樹洞', icon: 'https://api.iconify.design/twemoji/deciduous-tree.svg', requiredTier: 'premium', color: 'bg-teal-400 hover:bg-teal-500', lockedColor: 'bg-gray-200' },
        { page: Page.Achievements, label: '成就', icon: 'https://api.iconify.design/twemoji/trophy.svg', requiredTier: 'premium', color: 'bg-purple-400 hover:bg-purple-500', lockedColor: 'bg-gray-200' },
        { page: 'PARENT', label: '家長', icon: 'https://api.iconify.design/twemoji/family-man-woman-girl-boy.svg', color: 'bg-slate-600 hover:bg-slate-700', lockedColor: 'bg-gray-200' },
    ];

const TopNav: React.FC<TopNavProps> = ({ currentPage, setCurrentPage, onParentNav, plan, isSessionInProgress }) => {
    return (
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3">
            {NAV_ITEMS.map((item) => {
                const isParentBtn = item.page === 'PARENT';
                const targetPage = isParentBtn ? null : (item.page as Page);

                // Lock logic using plan utilities
                let isLocked = false;
                const userTier = getPricingTier(plan);
                if (item.requiredTier === 'premium' && !hasPremiumAccess(plan)) isLocked = true;
                if (item.requiredTier === 'advanced' && !hasAdvancedAccess(plan)) isLocked = true;

                const isActive = !isParentBtn && currentPage === targetPage;

                const handleClick = () => {
                    if (isLocked) return; // Prevent clicking if locked
                    if (isParentBtn) {
                        onParentNav();
                    } else if (targetPage) {
                        setCurrentPage(targetPage);
                    }
                };

                return (
                    <button
                        key={item.label}
                        onClick={handleClick}
                        className={`
                        relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl shadow-sm transition-all duration-200
                        ${isLocked
                                ? `${item.lockedColor} cursor-not-allowed`
                                : `${item.color} active:scale-95 hover:shadow-md`
                            }
                        ${isActive ? 'ring-2 ring-offset-1 ring-blue-300 scale-105' : ''}
                    `}
                    >
                        <img
                            src={item.icon}
                            alt={item.label}
                            className={`w-7 h-7 mb-0.5 sm:w-9 sm:h-9 ${isLocked ? 'grayscale opacity-40' : 'drop-shadow-sm object-contain'}`}
                        />
                        <span className={`text-[10px] sm:text-xs font-bold ${isLocked ? 'text-gray-400' : 'text-white drop-shadow-md'}`}>
                            {item.label}
                        </span>
                        {isLocked && (
                            <div className="absolute top-1 right-1 bg-black/10 rounded-full p-0.5">
                                <img src="https://api.iconify.design/solar/lock-keyhole-minimalistic-bold.svg" alt="locked" className="w-3 h-3 text-gray-500 opacity-60" />
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default TopNav;
