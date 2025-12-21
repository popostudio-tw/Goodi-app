import React, { createContext, useState, useCallback, useEffect, useRef, useMemo, useContext } from 'react';
import { Page, Task, Reward, JournalEntry, Achievement, Plan, UserProfile, ToastMessage, ScoreEntry, Subject, TestType, InventoryItem, Transaction, GachaponPrize, KeyEvent, FocusSessionCounts, UserData } from './types';
import { GoogleGenAI } from "@google/genai";
import { FirebaseGenAI } from './services/firebaseAI';
import { db, functions } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from './AuthContext';
import { getLocalGoodiResponse } from './utils/dailyFallbackData';

// --- INITIAL DATA (unchanged) ---
const initialAchievementsData: Achievement[] = [
  { id: 'learn_1', title: '學習新手', description: '完成第 1 個學習任務', icon: 'https://api.iconify.design/twemoji/graduation-cap.svg', unlocked: false },
  { id: 'learn_5', title: '學習達人', description: '完成 5 個學習任務', icon: 'https://api.iconify.design/twemoji/teacher.svg', unlocked: false },
  { id: 'chores_5', title: '家務小達人', description: '完成 5 個家務任務', icon: 'https://api.iconify.design/twemoji/broom.svg', unlocked: false },
  { id: 'life_5', title: '生活小能手', description: '完成 5 個生活任務', icon: 'https://api.iconify.design/twemoji/sun.svg', unlocked: false },
  { id: 'redeem_3', title: '獎勵收藏家', description: '兌換 3 個獎勵', icon: 'https://api.iconify.design/twemoji/wrapped-gift.svg', unlocked: false },
  { id: 'tasks_10', title: '任務大師', description: '完成 10 個總任務', icon: 'https://api.iconify.design/twemoji/trophy.svg', unlocked: false },
  { id: 'score_progress_1', title: '學業進步獎', description: '任一科目成績比上次進步 5 分以上', icon: 'https://api.iconify.design/twemoji/chart-increasing.svg', unlocked: false },
  { id: 'score_perfect_streak_3', title: '滿分連擊', description: '連續 3 次任何科目的考試獲得 100 分', icon: 'https://api.iconify.design/twemoji/1st-place-medal.svg', unlocked: false },
  { id: 'referral_1', title: '推廣大使', description: '成功推薦 1 位朋友使用 Goodi', icon: 'https://api.iconify.design/twemoji/megaphone.svg', unlocked: false },
];
const today = new Date();
const nextWeek = new Date();
nextWeek.setDate(today.getDate() + 7);
const formatDate = (d: Date) => d.toISOString().split('T')[0];
const ALL_DAYS: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const initialTasksData: Task[] = [
  // 生活
  { id: 1, text: '早上刷牙', points: 2, completed: false, category: '生活', description: '用牙刷和牙膏，把牙齒上的細菌都趕跑！', icon: 'https://api.iconify.design/twemoji/toothbrush.svg', isHabit: true, consecutiveCompletions: 0, schedule: ALL_DAYS },
  { id: 2, text: '晚上刷牙', points: 2, completed: false, category: '生活', description: '睡覺前刷牙，才不會蛀牙喔！', icon: 'https://api.iconify.design/twemoji/toothbrush.svg', isHabit: true, consecutiveCompletions: 0, schedule: ALL_DAYS },
  { id: 3, text: '洗臉', points: 2, completed: false, category: '生活', description: '用水把臉洗乾淨，看起來更有精神！', icon: 'https://api.iconify.design/twemoji/soap.svg', isHabit: true, consecutiveCompletions: 0, schedule: ALL_DAYS },
  { id: 4, text: '準時起床', points: 2, completed: false, category: '生活', description: '鬧鐘響了就起床，不賴床的小朋友最棒了！', icon: 'https://api.iconify.design/twemoji/alarm-clock.svg', isHabit: true, consecutiveCompletions: 0, schedule: ALL_DAYS },
  { id: 5, text: '準時上課', points: 2, completed: false, category: '生活', description: '吃完早餐，背好書包，準備出門上學去！', icon: 'https://api.iconify.design/twemoji/school.svg', schedule: ['mon', 'tue', 'wed', 'thu', 'fri'] },
  { id: 6, text: '自己穿衣服', points: 2, completed: false, category: '生活', description: '練習自己穿上衣服和褲子，你做得到的！', icon: 'https://api.iconify.design/twemoji/t-shirt.svg', isHabit: true, consecutiveCompletions: 0, schedule: ALL_DAYS },
  { id: 7, text: '起床折棉被', points: 2, completed: false, category: '生活', description: '把棉被折整齊，讓房間看起來更乾淨。', icon: 'https://api.iconify.design/twemoji/bed.svg', isHabit: true, consecutiveCompletions: 0, schedule: ALL_DAYS },
  { id: 8, text: '放學回家東西全部定位', points: 2, completed: false, category: '生活', description: '書包、鞋子、外套，都放回原來的位置。', icon: 'https://api.iconify.design/twemoji/house.svg', schedule: ['mon', 'tue', 'wed', 'thu', 'fri'] },
  { id: 9, text: '睡前整理書包', points: 2, completed: false, category: '生活', description: '檢查聯絡簿，把明天的課本和文具都放進書包。', icon: 'https://api.iconify.design/twemoji/school-backpack.svg', schedule: ['sun', 'mon', 'tue', 'wed', 'thu'] },
  // 家務
  { id: 10, text: '洗碗', points: 2, completed: false, category: '家務', description: '幫忙把吃完飯的碗洗乾淨。', icon: 'https://api.iconify.design/twemoji/bowl-with-spoon.svg', schedule: ALL_DAYS },
  { id: 11, text: '折衣服', points: 2, completed: false, category: '家務', description: '把洗好的衣服折整齊，放進衣櫃裡。', icon: 'https://api.iconify.design/twemoji/folded-hands.svg', schedule: ['sat', 'sun'] },
  { id: 12, text: '晾衣服', points: 2, completed: false, category: '家務', description: '幫忙把洗好的衣服晾起來。', icon: 'https://api.iconify.design/twemoji/shorts.svg', schedule: ALL_DAYS },
  { id: 13, text: '洗衣服', points: 2, completed: false, category: '家務', description: '學習怎麼用洗衣機洗衣服。', icon: 'https://api.iconify.design/twemoji/basket.svg', schedule: ['sat', 'sun'] },
  { id: 14, text: '擦桌子', points: 2, completed: false, category: '家務', description: '用抹布把餐桌或書桌擦乾淨。', icon: 'https://api.iconify.design/twemoji/sponge.svg', schedule: ALL_DAYS },
  { id: 15, text: '擦地板', points: 2, completed: false, category: '家務', description: '幫忙用拖把把地板拖乾淨。', icon: 'https://api.iconify.design/twemoji/bucket.svg' },
  { id: 16, text: '刷馬桶', points: 2, completed: false, category: '家務', description: '學習怎麼把馬桶刷得亮晶晶。', icon: 'https://api.iconify.design/twemoji/toilet.svg' },
  { id: 17, text: '整理桌子', points: 2, completed: false, category: '家務', description: '把書桌上的東西都收好，看起來好舒服。', icon: 'https://api.iconify.design/twemoji/desktop-computer.svg', schedule: ALL_DAYS },
  { id: 18, text: '擺餐具', points: 2, completed: false, category: '家務', description: '吃飯前，幫忙把碗筷擺好。', icon: 'https://api.iconify.design/twemoji/chopsticks.svg', schedule: ALL_DAYS },
  // 學習
  { id: 19, text: '預習 (25分鐘)', points: 2, completed: false, category: '學習', description: '先看一下明天要上的課，上課會更容易懂喔！', icon: 'https://api.iconify.design/twemoji/books.svg', schedule: ['mon', 'tue', 'wed', 'thu', 'fri'] },
  { id: 20, text: '複習 (25分鐘)', points: 2, completed: false, category: '學習', description: '複習今天老師教的內容，加深印象。', icon: 'https://api.iconify.design/twemoji/open-book.svg', schedule: ['mon', 'tue', 'wed', 'thu', 'fri'] },
  { id: 21, text: '背課文', points: 2, completed: false, category: '學習', description: '把課文的一段背起來，試試看！', icon: 'https://api.iconify.design/twemoji/speaking-head.svg' },
  { id: 22, text: '讀課文', points: 2, completed: false, category: '學習', description: '把課文大聲地念一遍。', icon: 'https://api.iconify.design/twemoji/mouth.svg' },
  { id: 23, text: '看課外書25分鐘', points: 2, completed: false, category: '學習', description: '挑一本喜歡的書，專心看25分鐘。', icon: 'https://api.iconify.design/twemoji/blue-book.svg', schedule: ALL_DAYS },
  { id: 24, text: '完成回家作業', points: 5, completed: false, category: '學習', description: '把今天老師出的作業全部完成。', icon: 'https://api.iconify.design/twemoji/pencil.svg', schedule: ['mon', 'tue', 'wed', 'thu', 'fri'] },
  { id: 25, text: '寫好評量', points: 2, completed: false, category: '學習', description: '認真寫評量，檢查有沒有寫錯。', icon: 'https://api.iconify.design/twemoji/writing-hand.svg' },
  // 每週 & 特殊
  { id: 26, text: '整理自己的房間', points: 10, completed: false, category: '每週', description: '把書桌、玩具和床都整理乾淨，讓房間煥然一新！', icon: 'https://api.iconify.design/twemoji/house-with-garden.svg', isSpecial: true },
  { id: 27, text: '得到老師稱讚', points: 5, completed: false, category: '特殊', description: '今天在學校表現很棒，得到老師的稱讚！快來分享吧！', icon: 'https://api.iconify.design/twemoji/star-struck.svg', isSpecial: true },
  { id: 28, text: '一週運動挑戰', points: 15, completed: false, category: '特殊', description: '這週跟家人一起運動一次吧！', icon: 'https://api.iconify.design/twemoji/person-running.svg', isSpecial: true, dateRange: { start: '2025-11-18', end: '2025-11-25' } },
  { id: 29, text: '主動幫忙一位家人', points: 5, completed: false, category: '特殊', description: '觀察家人有什麼需要幫忙的地方，主動伸出援手吧！', icon: 'https://api.iconify.design/twemoji/red-heart.svg', isSpecial: true },
];
const initialGachaponPrizes: GachaponPrize[] = [
  { id: 1, name: '神秘小玩具', rarity: '稀有', percentage: 20, icon: 'https://api.iconify.design/twemoji/teddy-bear.svg' },
  { id: 2, name: '貼紙 1張', rarity: '普通', percentage: 30, icon: 'https://api.iconify.design/twemoji/page-with-curl.svg' },
  { id: 3, name: '100元文具兌換券', rarity: '傳說', percentage: 1, icon: 'https://api.iconify.design/twemoji/admission-tickets.svg' },
  { id: 5, name: '50 積分', rarity: '史詩', percentage: 5, icon: 'https://api.iconify.design/twemoji/coin.svg' },
  { id: 6, name: '20 積分', rarity: '稀有', percentage: 10, icon: 'https://api.iconify.design/twemoji/coin.svg' },
  { id: 7, name: '10 積分', rarity: '普通', percentage: 34, icon: 'https://api.iconify.design/twemoji/coin.svg' },
];
const initialShopRewards: Reward[] = [
  { id: 201, name: '增加積木時間25分鐘', description: '跟爸媽一起玩積木', cost: 20, costType: 'tokens', icon: 'https://api.iconify.design/twemoji/building-construction.svg', action: 'parent_child_time', durationMinutes: 25 },
  { id: 202, name: '增加桌遊時間25分鐘', description: '跟爸媽一起玩桌遊', cost: 20, costType: 'tokens', icon: 'https://api.iconify.design/twemoji/game-die.svg', action: 'parent_child_time', durationMinutes: 25 },
  { id: 301, name: '桌遊半日券', description: '享受半天的歡樂時光', cost: 50, costType: 'tokens', icon: 'https://api.iconify.design/twemoji:game-die.svg', action: 'add_to_inventory' },
  { id: 302, name: '一包餅乾', description: '一起去選一包餅乾吧', cost: 5, costType: 'tokens', icon: 'https://api.iconify.design/twemoji/cookie.svg', action: 'add_to_inventory' },
  { id: 303, name: '一起逛夜市', description: '去了解夜市文化，吃飽飽', cost: 80, costType: 'tokens', icon: 'https://api.iconify.design/twemoji/ferris-wheel.svg', action: 'add_to_inventory' },
  { id: 305, name: '美術館參訪', description: '把眼睛耳朵的感受放大調', cost: 100, costType: 'tokens', icon: 'https://api.iconify.design/twemoji/artist-palette.svg', action: 'add_to_inventory' },
  { id: 306, name: '公園放風趣', description: '找個好天氣，一起去跑去跳去', cost: 50, costType: 'tokens', icon: 'https://api.iconify.design/twemoji/fountain.svg', action: 'add_to_inventory' },
  { id: 307, name: '跟家人運動趣', description: '騎車/跑步/跳繩...都可以喔', cost: 30, costType: 'tokens', icon: 'https://api.iconify.design/twemoji/person-running.svg', action: 'parent_child_time', durationMinutes: 30 },
  { id: 108, name: '扭蛋券兌換券', description: '購買後 +1 扭蛋券', cost: 50, costType: 'tokens', icon: 'https://api.iconify.design/twemoji/admission-tickets.svg', action: 'add_ticket' },
];
export const commonTasksData: Omit<Task, 'id' | 'completed' | 'isHabit' | 'consecutiveCompletions' | 'isSpecial' | 'dateRange' | 'consecutiveCompletions'>[] = [
  { text: '為植物澆水', points: 2, category: '家務', description: '讓家裡的小植物喝喝水吧！', icon: 'https://api.iconify.design/twemoji/potted-plant.svg' },
  { text: '餵寵物', points: 2, category: '家務', description: '家裡的毛小孩肚子餓了，餵牠吃飯。', icon: 'https://api.iconify.design/twemoji/dog-face.svg' },
  { text: '準備晚餐餐具', points: 3, category: '家務', description: '洗菜、擺碗筷，當個廚房小幫手。', icon: 'https://api.iconify.design/twemoji/cooking.svg' },
];
const initialUserData: Omit<UserData, 'lastLoginDate'> = {
  userProfile: { nickname: '', age: null, onboardingComplete: false },
  points: 0, tokens: 0, gachaponTickets: 1, streak: 0,
  tasks: initialTasksData,
  achievements: initialAchievementsData,
  inventory: [], transactions: [], journalEntries: [], scoreHistory: [], sharedMessages: [], wishes: [],
  plan: 'free', parentPin: null, shopRewards: initialShopRewards, gachaponPrizes: initialGachaponPrizes, keyEvents: [],
  focusSessionCounts: { 5: 0, 10: 0, 15: 0, 25: 0 },
  frozenHabitDates: [],
  referralCount: 0,
  planTrialEndDate: null,
  parentIntroDismissed: false,
  subscriptionType: 'monthly',
  pricingTier: 'free',
  childrenCount: 1,
  maxChildren: 1,
  zhuyinMode: 'auto',
  // Referral System Initial Values
  referralCode: undefined, // Will be generated on first user creation
  redeemCodes: [],
  referredUsers: [],
  canAddReferralCode: true,
  isTrialUser: false,
  createdAt: new Date().toISOString(),
};
// --- END INITIAL DATA ---

// --- HELPER FOR FIRESTORE ---
// Recursively remove undefined values from objects to prevent Firestore errors
const removeUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;  // Convert undefined to null
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(v => removeUndefined(v)).filter(v => v !== undefined);
  }

  const newObj: any = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    // Skip undefined values entirely
    if (value !== undefined) {
      const cleanedValue = removeUndefined(value);
      if (cleanedValue !== undefined) {
        newObj[key] = cleanedValue;
      }
    }
  });
  return newObj;
};

// --- CONTEXT DEFINITION ---
interface UserDataContextType {
  userData: Omit<UserData, 'lastLoginDate'> | null;
  userDataLoading: boolean;
  isPointsAnimating: boolean;
  updateUserData: (updates: Partial<Omit<UserData, 'lastLoginDate'>>) => void;
  addToast: (message: string, type?: 'success' | 'celebrate') => void;
  gainPoints: (amount: number) => void;
  addTransaction: (description: string, amount: string) => void;
  unlockAchievement: (id: string, customTitle?: string, customIcon?: string, videoId?: string) => void;
  handleCompleteTask: (taskId: number, isProactive: boolean) => void;
  handlePlayGachapon: () => InventoryItem | null;
  handleExchange: (pointsToSpend: number, tokensToGet: number) => boolean;
  handleBuyReward: (reward: Reward) => boolean;
  handleUseItem: (id: number, callbacks: { onStartParentChildTime: () => void }) => void;
  handleAddEntry: (text: string) => Promise<void>;
  handleReportScore: (details: { subject: Subject; testType: TestType; score: number }) => void;
  handleAddTask: (task: Omit<Task, 'id' | 'completed' | 'isHabit' | 'consecutiveCompletions'>) => void;
  handleAddMultipleTasks: (newTasks: Omit<Task, 'id' | 'completed' | 'isHabit' | 'consecutiveCompletions'>[]) => void;
  handleOverwriteTasks: (newTasks: Omit<Task, 'id' | 'completed' | 'isHabit' | 'consecutiveCompletions'>[]) => void;
  handleEditTask: (task: Task) => void;
  handleDeleteTask: (id: number) => void;
  handleChildAddTask: (text: string, frequency: 'today' | 'everyday' | 'schooldays') => void;
  handlePraiseSubmit: (taskId: number, isProactive: boolean, praiseText: string) => void;
  handleFocusSessionComplete: (durationInSeconds: number) => void;
  handleShareMessage: (message: string) => void;
  handleSetGachaponPrizes: (prizes: GachaponPrize[]) => void;
  handleSetShopRewards: (rewards: Reward[]) => void;
  handleSetScoreHistory: (scores: ScoreEntry[]) => void;
  handleUpdateUserProfile: (profile: UserProfile) => void;
  handleSetFrozenHabitDates: (dates: string[]) => void;
  handleReferral: () => void;
  handleFeedbackSubmit: (feedback: string) => void;
  handleDismissParentIntro: () => void;
  handleManualPointAdjustment: (amount: number, reason: string) => void;
  handleAddKeyEvent: (text: string, date: string) => void;
  handleDeleteKeyEvent: (id: number) => void;
  handleMakeWish: (wish: string) => boolean;
  // Referral System Handlers
  handleApplyReferralCode: (code: string) => Promise<{ success: boolean; message: string }>;
  handleUseRedeemCode: (code: string, monthsToRedeem?: number) => Promise<{ success: boolean; message: string }>;
  handleCheckTrialExpiry: () => void;
  // Gemini API Key Management (for lifetime premium users)
  handleSetGeminiApiKey: (key: string) => Promise<void>;
  handleValidateGeminiApiKey: () => Promise<boolean>;
  handleTriggerYesterdaySummary: () => Promise<boolean>;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};
// --- END CONTEXT DEFINITION ---


// --- PROVIDER COMPONENT ---
interface UserDataProviderProps {
  children: React.ReactNode;
  addToast: (message: string, type?: 'success' | 'celebrate') => void;
}

const STORAGE_KEY = 'goodi_app_data_v2';

export const UserDataProvider: React.FC<UserDataProviderProps> = ({ children, addToast }) => {
  const { currentUser, authLoading } = useAuth();

  const [userData, setUserData] = useState<Omit<UserData, 'lastLoginDate'> | null>(null);
  const [userDataLoading, setUserDataLoading] = useState(true);
  const [isPointsAnimating, setIsPointsAnimating] = useState(false);

  const ai = useMemo(() => new FirebaseGenAI(), []);

  // --- FIRESTORE SYNC ---
  useEffect(() => {
    if (authLoading) {
      console.log('[UserContext] Auth is loading. Waiting...');
      setUserDataLoading(true);
      return;
    }

    if (!currentUser) {
      console.log('[UserContext] Auth complete, no user. Resetting state.');
      setUserData(null);
      setUserDataLoading(false);
      return;
    }

    console.log(`[UserContext] User ${currentUser.uid} authenticated. Setting up Firestore listener.`);
    setUserDataLoading(true);

    const docRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(docRef, async (snapshot) => {
      if (snapshot.exists()) {
        console.log('[UserContext] Firestore document snapshot received.');
        const firestoreData = snapshot.data() as UserData;
        // Merge with localStorage if needed (optional)
        setUserData(firestoreData);
      } else {
        console.log('[UserContext] Firestore document does not exist. Creating it...');
        try {
          // Generate referral code for new users
          const { generateReferralCode } = await import('./utils/referralUtils');
          const newReferralCode = generateReferralCode('GD'); // GD prefix for Goodi Default

          const initialDataWithReferralCode = {
            ...initialUserData,
            referralCode: newReferralCode,
            createdAt: new Date().toISOString(),
          };

          const cleanData = removeUndefined(initialDataWithReferralCode);
          const fullData: UserData = { ...cleanData, lastLoginDate: new Date().toISOString().split('T')[0] };
          await setDoc(docRef, fullData);

          console.log('[UserContext] Created new user with referral code:', newReferralCode);
        } catch (error) {
          console.error('[UserContext] Error creating initial user document:', error);
          addToast('建立使用者資料時發生錯誤');
        }
      }
      setUserDataLoading(false);
      console.log('[UserContext] userDataLoading set to false.');
    }, (error) => {
      console.error('[UserContext] Firestore snapshot listener error:', error);
      addToast('讀取使用者資料時發生錯誤');
      setUserDataLoading(false);
    });

    return () => {
      console.log('[UserContext] Cleaning up Firestore listener.');
      unsubscribe();
    };
  }, [currentUser, authLoading, addToast]);

  // Save to Firestore when userData changes
  useEffect(() => {
    if (userData && currentUser) {
      const saveToFirestore = async () => {
        try {
          const cleanData = removeUndefined(userData);
          const fullData: UserData = { ...cleanData, lastLoginDate: new Date().toISOString().split('T')[0] };
          await setDoc(doc(db, 'users', currentUser.uid), fullData, { merge: true });
        } catch (error) {
          console.error("Error saving user data:", error);
        }
      };
      saveToFirestore();
    }
  }, [userData, currentUser]);

  // Daily Reset Logic
  useEffect(() => {
    if (!userData) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const lastCheckDate = localStorage.getItem('goodi_last_daily_check');

    if (lastCheckDate !== todayStr) {
      const yesterdayStr = new Date(Date.now() - 864e5).toISOString().split('T')[0];
      const wasYesterdayFrozen = (userData.frozenHabitDates || []).includes(yesterdayStr);

      const resetTasks = userData.tasks.map(task => {
        let newConsecutive = task.consecutiveCompletions || 0;

        if (task.isHabit || task.category === '生活' || task.category === '家務') {
          if (!task.completed && !wasYesterdayFrozen && !task.mastered) {
            newConsecutive = 0;
          }
        }

        return {
          ...task,
          completed: false,
          consecutiveCompletions: newConsecutive
        };
      });

      setUserData(prev => prev ? ({
        ...prev,
        tasks: resetTasks
      }) : null);

      // Check trial expiry (disable trial tasks if needed)
      if (userData.isTrialUser && userData.planTrialEndDate) {
        const trialEndDate = new Date(userData.planTrialEndDate);
        if (new Date() > trialEndDate) {
          // Trial has expired, disable trial tasks
          const updatedTasks = resetTasks.map(task => {
            if (task.createdDuringTrial && new Date() > new Date(task.trialExpiryDate!)) {
              return {
                ...task,
                disabled: true,
                disabledReason: '試用期已結束，升級至高級版本以繼續使用此任務'
              };
            }
            return task;
          });

          setUserData(prev => prev ? ({
            ...prev,
            tasks: updatedTasks,
            isTrialUser: false
          }) : null);
        }
      }

      localStorage.setItem('goodi_last_daily_check', todayStr);
    }
  }, [userData]);

  const updateUserData = useCallback((updates: Partial<Omit<UserData, 'lastLoginDate'>>) => {
    setUserData(prevData => prevData ? { ...prevData, ...updates } : null);
  }, []);

  // --- UTILITY & HELPER FUNCTIONS ---
  const addTransaction = useCallback((description: string, amount: string) => {
    if (!userData) return;
    const newTransaction: Transaction = { id: Date.now(), description, amount, timestamp: Date.now() };
    updateUserData({ transactions: [newTransaction, ...userData.transactions] });
  }, [userData, updateUserData]);

  const gainPoints = useCallback((amount: number) => {
    if (!userData) return;
    updateUserData({ points: Number(userData.points || 0) + amount });
    setIsPointsAnimating(true);
    setTimeout(() => setIsPointsAnimating(false), 600);
  }, [userData, updateUserData]);

  const unlockAchievement = useCallback((id: string, customTitle?: string, customIcon?: string, videoId?: string) => {
    if (!userData) return;
    const existingAch = userData.achievements.find(a => a.id === id);

    if (existingAch) {
      if (!existingAch.unlocked) {
        addToast(`成就解鎖：${existingAch.title}`, 'celebrate');
        const newItem: InventoryItem = { id: Date.now() + Math.random(), name: '成就獎勵寶箱', description: 'https://api.iconify.design/twemoji/gem-stone.svg', timestamp: Date.now(), used: false };
        updateUserData({
          achievements: userData.achievements.map(a => a.id === id ? { ...a, unlocked: true, videoId: videoId || a.videoId } : a),
          inventory: [newItem, ...userData.inventory]
        });
        addTransaction('獲得成就獎勵', '成就獎勵寶箱');
      }
    } else if (customTitle && customIcon) {
      addToast(`解鎖大師徽章：${customTitle}`, 'celebrate');
      const newItem: InventoryItem = { id: Date.now() + Math.random(), name: '大師獎勵寶箱', description: 'https://api.iconify.design/twemoji/crown.svg', timestamp: Date.now(), used: false };

      updateUserData({
        inventory: [newItem, ...userData.inventory]
      });
      addTransaction('獲得大師獎勵', '大師獎勵寶箱');
    }
  }, [userData, updateUserData, addToast, addTransaction]);

  const checkAchievements = useCallback(() => {
    if (!userData) return;
    const completedTasks = userData.tasks.filter(t => t.completed);
    const check = (id: string, condition: boolean) => {
      if (!userData.achievements.find(a => a.id === id)?.unlocked && condition) unlockAchievement(id);
    };
    check('learn_1', completedTasks.filter(t => t.category === '學習').length >= 1);
    check('tasks_10', completedTasks.length >= 10);
    check('referral_1', userData.referralCount >= 1);
  }, [userData, unlockAchievement]);

  useEffect(() => { checkAchievements(); }, [checkAchievements]);

  // --- MAIN HANDLERS ---
  const handleCompleteTask = (taskId: number, isProactive: boolean) => {
    if (!userData) return;
    const task = userData.tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;

    const basePoints = Number(task.points);
    let pointsGained = isProactive ? Math.floor(basePoints * 1.5) : basePoints;

    if (task.mastered) {
      pointsGained = Math.floor(pointsGained * 1.5);
    }

    const newTransaction: Transaction = { id: Date.now(), description: `完成任務: ${task.text} ${isProactive ? '(主動)' : ''} ${task.mastered ? '(大師加成)' : ''}`, amount: `+${pointsGained} 積分`, timestamp: Date.now() };

    const newTasks = userData.tasks.map(t => {
      if (t.id === taskId) {
        const updatedTask = { ...t, completed: true };

        if (updatedTask.isHabit || updatedTask.category === '生活' || updatedTask.category === '家務') {
          updatedTask.consecutiveCompletions = (updatedTask.consecutiveCompletions || 0) + 1;

          if (updatedTask.consecutiveCompletions >= 21 && !updatedTask.mastered) {
            updatedTask.mastered = true;

            setTimeout(() => {
              unlockAchievement(
                `mastery_${updatedTask.id}`,
                `${updatedTask.text}大師`,
                updatedTask.icon,
                "https://video.wixstatic.com/video/ec806c_0aad9d677de244edbf8c44d351133f58/720p/mp4/file.mp4"
              );
            }, 500);
          }
        }
        return updatedTask;
      }
      return t;
    });

    setIsPointsAnimating(true);
    setTimeout(() => setIsPointsAnimating(false), 600);

    updateUserData({
      tasks: newTasks,
      streak: userData.streak + 1,
      points: Number(userData.points || 0) + pointsGained,
      transactions: [newTransaction, ...userData.transactions],
    });

    const praiseMsg = task.mastered
      ? `大師級表現！獲得 ${pointsGained} 積分 (含加成)！`
      : `任務完成！獲得 ${pointsGained} 積分！`;
    addToast(praiseMsg, 'success');
  };

  const handlePraiseSubmit = (taskId: number, isProactive: boolean, praiseText: string) => {
    if (!userData) return;
    const targetId = 27;
    let task = userData.tasks.find(t => t.id === targetId);
    if (!task) { task = initialTasksData.find(t => t.id === 27); }
    if (!task) { task = { id: 27, text: '得到老師稱讚', points: 5, completed: false, category: '特殊', description: '今天在學校表現很棒！', icon: 'https://api.iconify.design/twemoji/star-struck.svg' } as Task; }

    if (task.completed) { addToast('今天已經領過獎勵囉！明天再來吧！'); return; }

    const pointsGained = isProactive ? Math.floor(Number(task.points) * 1.5) : Number(task.points);
    const updatedTasks = userData.tasks.map(t => t.id === targetId ? { ...t, completed: true } : t);
    const transactionDescription = `完成任務: ${task.text} ${isProactive ? '(主動)' : ''}`;
    const newTransaction: Transaction = { id: Date.now(), description: transactionDescription, amount: `+${pointsGained} 積分`, timestamp: Date.now() };

    setIsPointsAnimating(true);
    setTimeout(() => setIsPointsAnimating(false), 600);

    updateUserData({
      points: Number(userData.points || 0) + pointsGained,
      tasks: updatedTasks,
      streak: userData.streak + 1,
      sharedMessages: [`老師稱讚「${userData.userProfile.nickname}」因為：${praiseText}`, ...userData.sharedMessages],
      transactions: [newTransaction, ...userData.transactions],
    });
    addToast(`太棒了！獲得 ${pointsGained} 積分！`, 'celebrate');
  };

  const handlePlayGachapon = (): InventoryItem | null => {
    if (!userData) return null;
    if (userData.gachaponTickets < 1) { addToast('扭蛋券不足！'); return null; }
    const rand = Math.random() * userData.gachaponPrizes.reduce((s, p) => s + p.percentage, 0);
    let cumulative = 0;
    const prize = userData.gachaponPrizes.find(p => (cumulative += p.percentage) >= rand) || userData.gachaponPrizes[0];
    if (!prize) return null;

    let updates: Partial<Omit<UserData, 'lastLoginDate'>> = { gachaponTickets: userData.gachaponTickets - 1 };
    const newItem: InventoryItem = { id: Date.now(), name: prize.name, description: prize.icon, timestamp: Date.now(), used: false };

    if (prize.name.includes('積分')) {
      const pointsWon = parseInt(prize.name.match(/\d+/)?.[0] || '0', 10);
      if (pointsWon > 0) {
        updates.points = Number(userData.points || 0) + pointsWon;
        newItem.used = true;
        addToast(`恭喜抽中 ${pointsWon} 積分！`, 'celebrate');
        addTransaction('神奇扭蛋機', `+${pointsWon} 積分`);
      }
    } else {
      addToast(`恭喜獲得 ${prize.rarity} 獎品：${prize.name}!`, 'celebrate');
      addTransaction('神奇扭蛋機', '獲得獎品');
    }

    updates.inventory = [newItem, ...userData.inventory];
    updateUserData(updates);
    return newItem;
  };

  const handleExchange = (pointsToSpend: number, tokensToGet: number) => {
    if (!userData) return false;
    if (userData.points < pointsToSpend) { addToast('積分不足！'); return false; }
    updateUserData({ points: userData.points - pointsToSpend, tokens: userData.tokens + tokensToGet });
    addTransaction('積分兌換', `-${pointsToSpend} 積分, +${tokensToGet} 代幣`);
    addToast(`成功兌換 ${tokensToGet} 代幣！`, 'success');
    return true;
  };

  const handleBuyReward = (reward: Reward) => {
    if (!userData) return false;
    if (userData.tokens < reward.cost) { addToast('代幣不足！'); return false; }
    addTransaction(`購買獎勵: ${reward.name}`, `-${reward.cost} 代幣`);
    let updates: Partial<Omit<UserData, 'lastLoginDate'>> = { tokens: userData.tokens - reward.cost };
    if (reward.action === 'add_ticket') {
      updates.gachaponTickets = userData.gachaponTickets + 1;
      addToast('成功購買扭蛋券！', 'success');
    } else {
      const newItem: InventoryItem = { id: Date.now(), name: reward.name, description: reward.icon, timestamp: Date.now(), used: false, action: reward.action, durationMinutes: reward.durationMinutes };
      updates.inventory = [newItem, ...userData.inventory];
      addToast(`成功購買 ${reward.name}！`, 'success');
    }
    updateUserData(updates);
    return true;
  };

  const handleMakeWish = (wish: string): boolean => {
    if (!userData) return false;
    const cost = 50;
    if (userData.tokens < cost) { addToast('代幣不足！'); return false; }
    addTransaction('許願池', `-${cost} 代幣`);
    updateUserData({
      tokens: userData.tokens - cost,
      wishes: [wish, ...userData.wishes]
    });
    addToast('願望已送出！', 'success');
    return true;
  };

  const handleUseItem = (id: number, callbacks: { onStartParentChildTime: () => void }) => {
    if (!userData) return;
    const item = userData.inventory.find(i => i.id === id);
    if (!item || item.used) return;
    if (item.action === 'parent_child_time' && item.durationMinutes) { callbacks.onStartParentChildTime(); return; }

    let usedSuccessfully = false;
    let updates: Partial<Omit<UserData, 'lastLoginDate'>> = {};
    if (item.name === '成就獎勵寶箱' || item.name === '大師獎勵寶箱') {
      const pointsWon = Math.floor(Math.random() * 30) + 20;
      updates.points = userData.points + pointsWon;
      addToast(`打開寶箱！獲得 ${pointsWon} 積分！`, 'celebrate');
      addTransaction(`開啟${item.name}`, `+${pointsWon} 積分`);
      usedSuccessfully = true;
    }
    if (!usedSuccessfully) { addToast('獎品已核銷！'); }
    updates.inventory = userData.inventory.map(i => (i.id === id ? { ...i, used: true } : i));
    updateUserData(updates);
  };

  const handleAddEntry = async (text: string) => {
    if (!userData) return;
    const userEntry: JournalEntry = { id: Date.now(), text, date: new Date().toISOString(), author: 'user' };
    updateUserData({ journalEntries: [...userData.journalEntries, userEntry] });

    try {
      // 使用統一的 AI 調用服務
      const { callAiFunction } = await import('./src/services/aiClient');

      const data = await callAiFunction('generateSafeResponse', {
        userMessage: text,
        userNickname: userData.userProfile.nickname || '小朋友'
      }) as { needsAttention: boolean; response: string };

      // 如果需要關注,發送警示給家長，同時給孩子一個溫暖的回應
      if (data.needsAttention) {
        // 1. 發送警示給家長
        updateUserData({
          sharedMessages: [`【安全警示】孩子在心事樹洞中提到了可能令人擔憂的內容：「${text}」`, ...userData.sharedMessages]
        });

        // 2. 同時給孩子一個溫暖、關懷的回應（不讓孩子感到被忽略）
        const supportiveResponse = "謝謝你願意把心事告訴我，我知道有時候生活不太容易。不管發生什麼事，Goodi 都會在這裡陪伴你喔。你很勇敢，願意說出來就是很棒的一步！❤️";
        const goodiEntry: JournalEntry = {
          id: Date.now() + 1,
          text: supportiveResponse,
          date: new Date().toISOString(),
          author: 'goodi'
        };
        // Update journalEntries again to include the Goodi's supportive response
        updateUserData({ journalEntries: [...userData.journalEntries, userEntry, goodiEntry] });
        return;
      }

      // 正常回應
      const goodiEntry: JournalEntry = {
        id: Date.now() + 1,
        text: data.response,
        date: new Date().toISOString(),
        author: 'goodi'
      };
      updateUserData({ journalEntries: [...userData.journalEntries, userEntry, goodiEntry] });

    } catch (e: any) {
      console.error("WhisperTree network/cloud error, using local fallback:", e);
      // 網路斷線或雲端異常時，啟用「本地溫暖引擎」
      const errorMsg = e.message || "";
      const localResponse = getLocalGoodiResponse(text);
      const displayText = errorMsg.includes('次數已達上限')
        ? "Goodi 今天說了好多話，休息一下，明天再陪你聊更多好嗎？"
        : localResponse;

      const goodiEntry: JournalEntry = {
        id: Date.now() + 1,
        text: displayText,
        date: new Date().toISOString(),
        author: 'goodi'
      };
      updateUserData({ journalEntries: [...userData.journalEntries, userEntry, goodiEntry] });
    }
  };

  const handleReportScore = (details: { subject: Subject; testType: TestType; score: number }) => {
    if (!userData) return;
    const newEntry: ScoreEntry = { id: Date.now(), date: new Date().toISOString().split('T')[0], ...details };
    if (details.score === 100) {
      const recentScores = [...userData.scoreHistory].slice(0, 2);
      if (recentScores.length === 2 && recentScores.every(s => s.score === 100)) unlockAchievement('score_perfect_streak_3');
    }
    const newScoreHistory = [newEntry, ...userData.scoreHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    updateUserData({ scoreHistory: newScoreHistory });
    gainPoints(2);
    addToast('謝謝你的分享！獲得 2 積分！');
    addTransaction('回報考卷成績', '+2 積分');
  };

  const handleAddTask = (taskData: Omit<Task, 'id' | 'completed' | 'isHabit' | 'consecutiveCompletions'>) => {
    if (!userData) return;
    const newTask: Task = {
      ...taskData,
      id: Date.now(),
      completed: false,
      isHabit: !['學習', '特殊', '每週'].includes(taskData.category),
      consecutiveCompletions: 0,
      addedBy: 'parent'
    };

    // 如果是試用用戶且在試用期內，標記任務
    if (userData.isTrialUser && userData.planTrialEndDate) {
      const trialEndDate = new Date(userData.planTrialEndDate);
      if (new Date() < trialEndDate) {
        newTask.createdDuringTrial = true;
        newTask.trialExpiryDate = userData.planTrialEndDate;
      }
    }

    updateUserData({ tasks: [...userData.tasks, newTask] });
    addToast('任務已新增！');
  };

  const handleEditTask = (updatedTask: Task) => {
    if (!userData) return;
    updateUserData({ tasks: userData.tasks.map(t => t.id === updatedTask.id ? updatedTask : t) });
    addToast('任務已更新！');
  };

  const handleDeleteTask = (taskId: number) => {
    if (!userData) return;
    updateUserData({ tasks: userData.tasks.filter(t => t.id !== taskId) });
    addToast('任務已刪除！');
  };

  const handleAddMultipleTasks = (newTasks: Omit<Task, 'id' | 'completed' | 'isHabit' | 'consecutiveCompletions'>[]) => {
    if (!userData) return;

    const tasksToAdd = newTasks.map(task => {
      const newTask: Task = {
        ...task,
        id: Date.now() + Math.random(),
        completed: false,
        isHabit: task.category !== '學習' && task.category !== '特殊',
        consecutiveCompletions: 0,
        addedBy: 'parent' as const
      };

      // 如果是試用用戶且在試用期內，標記任務
      if (userData.isTrialUser && userData.planTrialEndDate) {
        const trialEndDate = new Date(userData.planTrialEndDate);
        if (new Date() < trialEndDate) {
          newTask.createdDuringTrial = true;
          newTask.trialExpiryDate = userData.planTrialEndDate;
        }
      }

      return newTask;
    });

    updateUserData({ tasks: [...userData.tasks, ...tasksToAdd] });
    addToast(`成功匯入 ${newTasks.length} 個任務！`);
  };

  const handleOverwriteTasks = (newTasks: Omit<Task, 'id' | 'completed' | 'isHabit' | 'consecutiveCompletions'>[]) => {
    if (!userData) return;

    const tasksToAdd = newTasks.map(task => {
      const newTask: Task = {
        ...task,
        id: Date.now() + Math.random(),
        completed: false,
        isHabit: task.category !== '學習' && task.category !== '特殊',
        consecutiveCompletions: 0,
        addedBy: 'parent' as const
      };

      // 如果是試用用戶且在試用期內，標記任務
      if (userData.isTrialUser && userData.planTrialEndDate) {
        const trialEndDate = new Date(userData.planTrialEndDate);
        if (new Date() < trialEndDate) {
          newTask.createdDuringTrial = true;
          newTask.trialExpiryDate = userData.planTrialEndDate;
        }
      }

      return newTask;
    });

    updateUserData({ tasks: tasksToAdd });
    addToast(`成功匯入並覆蓋了 ${newTasks.length} 個任務！`);
  };

  const handleChildAddTask = (text: string, frequency: 'today' | 'everyday' | 'schooldays') => {
    if (!userData) return;
    const todayStr = new Date().toISOString().split('T')[0];
    let schedule: Task['schedule'] = undefined;
    let dateRange: Task['dateRange'] = undefined;

    if (frequency === 'everyday') {
      schedule = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    } else if (frequency === 'schooldays') {
      schedule = ['mon', 'tue', 'wed', 'thu', 'fri'];
    } else if (frequency === 'today') {
      dateRange = { start: todayStr, end: todayStr };
    }

    const newTask: Task = {
      id: Date.now(),
      text,
      points: 2,
      completed: false,
      category: '學習',
      description: '這是你自己用魔法棒新增的學習任務喔！',
      icon: 'https://api.iconify.design/twemoji/magic-wand.svg',
      isHabit: frequency !== 'today',
      consecutiveCompletions: 0,
      addedBy: 'child',
      ...(schedule ? { schedule } : {}),
      ...(dateRange ? { dateRange } : {})
    };

    // 如果是試用用戶且在試用期內，標記任務
    if (userData.isTrialUser && userData.planTrialEndDate) {
      const trialEndDate = new Date(userData.planTrialEndDate);
      if (new Date() < trialEndDate) {
        newTask.createdDuringTrial = true;
        newTask.trialExpiryDate = userData.planTrialEndDate;
      }
    }
    updateUserData({ tasks: [...userData.tasks, newTask] });
    addToast(`新增任務：「${text}」！`);
  };

  const handleFocusSessionComplete = (durationInSeconds: number) => {
    if (!userData) return;
    const durationInMins = durationInSeconds / 60;
    const newCounts = { ...userData.focusSessionCounts, [durationInMins]: (userData.focusSessionCounts[durationInMins] || 0) + 1 };
    gainPoints(2);
    updateUserData({ focusSessionCounts: newCounts });
    addToast('專注時間完成！獎勵 2 積分！');
    addTransaction('完成專注番茄鐘', '+2 積分');

    const totalSessions = (Object.values(newCounts) as number[]).reduce((a, b) => a + b, 0);
    const milestones = [10, 20, 40, 80, 160, 320];
    const milestoneIndex = milestones.indexOf(totalSessions);
    if (milestoneIndex !== -1) {
      const bonus = 10 * (milestoneIndex + 1);
      gainPoints(bonus);
      addToast(`達成 ${totalSessions} 次專注！額外獎勵 ${bonus} 積分！`, 'celebrate');
      addTransaction(`達成 ${totalSessions} 次專注里程碑`, `+${bonus} 積分`);
    }
  };

  const handleShareMessage = (message: string) => {
    if (!userData || !message.trim()) return;
    updateUserData({
      sharedMessages: [message.trim(), ...userData.sharedMessages]
    });
    gainPoints(5);
    addTransaction('想跟家人分享的事', `+5 積分`);
    addToast('訊息已分享！獲得 5 積分！', 'success');
  };

  const handleDismissParentIntro = useCallback(() => {
    updateUserData({ parentIntroDismissed: true });
  }, [updateUserData]);

  const handleManualPointAdjustment = useCallback((amount: number, reason: string) => {
    if (!userData || isNaN(amount) || amount === 0) return;

    const currentPoints = Number(userData.points || 0);
    const newPoints = currentPoints + amount;

    if (newPoints < 0) {
      addToast('積分不能為負數！');
      return;
    }

    updateUserData({ points: newPoints });
    const amountStr = `${amount > 0 ? '+' : ''}${amount} 積分`;
    const reasonText = reason.trim() ? `(${reason.trim()})` : '';
    addTransaction(`家長手動調整 ${reasonText}`, amountStr);
    addToast(`積分已調整！`);

  }, [userData, updateUserData, addTransaction, addToast]);

  const handleAddKeyEvent = useCallback((text: string, date: string) => {
    if (!userData || !text.trim()) return;
    const newEvent: KeyEvent = {
      id: Date.now(),
      date: date,
      text: text.trim(),
    };
    updateUserData({ keyEvents: [...userData.keyEvents, newEvent].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) });
    addToast('紀事已新增！');
  }, [userData, updateUserData, addToast]);

  const handleDeleteKeyEvent = useCallback((id: number) => {
    if (!userData) return;
    if (window.confirm('確定要刪除這筆紀事嗎？')) {
      updateUserData({ keyEvents: userData.keyEvents.filter(e => e.id !== id) });
      addToast('紀事已刪除。');
    }
  }, [userData, updateUserData, addToast]);

  const handleSetGachaponPrizes = (prizes: GachaponPrize[]) => updateUserData({ gachaponPrizes: prizes });
  const handleSetShopRewards = (rewards: Reward[]) => updateUserData({ shopRewards: rewards });
  const handleSetScoreHistory = (scores: ScoreEntry[]) => updateUserData({ scoreHistory: scores });
  const handleUpdateUserProfile = (profile: UserProfile) => updateUserData({ userProfile: profile });
  const handleSetFrozenHabitDates = (dates: string[]) => updateUserData({ frozenHabitDates: dates });
  const handleReferral = () => {
    if (!userData) return;
    const newCount = (userData.referralCount || 0) + 1;
    updateUserData({ referralCount: newCount });
    if (newCount >= 1) unlockAchievement('referral_1');
  };

  // === REFERRAL SYSTEM HANDLERS ===

  /**
   * Apply a referral code (for new users or补登)
   */
  const handleApplyReferralCode = useCallback(async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!userData || !currentUser) {
      return { success: false, message: '用戶資料未載入' };
    }

    try {
      const { validateReferralCode, normalizeReferralCode, canAddReferralCode, calculateTrialEndDate } =
        await import('./utils/referralUtils');

      const normalizedCode = normalizeReferralCode(code);

      // 🧪 TEST MODE: Check for test code FIRST before format validation
      if (normalizedCode === 'GD-TEST01') {
        // 檢查是否已使用過推薦碼
        if (userData.referredBy) {
          return { success: false, message: '您已經使用過推薦碼了，每個帳號只能使用一次' };
        }

        // 檢查是否可以補登（7天內）
        if (!canAddReferralCode(userData)) {
          return { success: false, message: '推薦碼補登期限已過（僅限註冊後 7 天內）' };
        }

        const trialEndDate = calculateTrialEndDate();

        updateUserData({
          referredBy: 'test-user-id',
          referredByCode: normalizedCode,
          referralStatus: 'completed',
          isTrialUser: true,
          trialSource: 'referral',
          planTrialEndDate: trialEndDate,
        });

        addToast('✅ 測試推薦碼已啟用！獲得 7 天試用期', 'success');
        addTransaction('使用測試推薦碼', '獲得 7 天試用');
        return { success: true, message: '成功啟用 7 天高級功能試用期！' };
      }

      // 驗證推薦碼格式（僅用於真實推薦碼）
      if (!validateReferralCode(normalizedCode)) {
        return { success: false, message: '推薦碼格式不正確' };
      }

      // 檢查是否已使用過推薦碼
      if (userData.referredBy) {
        return { success: false, message: '您已經使用過推薦碼了，每個帳號只能使用一次' };
      }

      // 檢查是否可以補登（7天內）
      if (!canAddReferralCode(userData)) {
        return { success: false, message: '推薦碼補登期限已過（僅限註冊後 7 天內）' };
      }

      // 驗證推薦碼是否存在（真實 Firestore 驗證）
      const { doc: firestoreDoc, getDoc } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      const codeDoc = await getDoc(firestoreDoc(db, 'referralCodes', normalizedCode));

      if (!codeDoc.exists()) {
        return { success: false, message: '推薦碼不存在或已失效' };
      }

      const codeData = codeDoc.data();

      // 防止自我推薦
      if (codeData.userId === currentUser.uid) {
        return { success: false, message: '不能使用自己的推薦碼' };
      }

      // 計算試用期結束時間（7天後）
      const trialEndDate = calculateTrialEndDate();

      // 更新用戶資料
      updateUserData({
        referredBy: codeData.userId,
        referredByCode: normalizedCode,
        referredAt: new Date().toISOString(),
        referralStatus: 'pending',  // 完成1個任務後才會變成 completed
        canAddReferralCode: false,
        isTrialUser: true,
        trialSource: 'referral',
        planTrialEndDate: trialEndDate,
        plan: 'premium_monthly',  // 試用期使用高級功能
      });

      addToast('🎉 推薦碼使用成功！您已獲得 7 天高級功能試用！', 'celebrate');
      addTransaction('使用推薦碼', '獲得 7 天試用');

      return { success: true, message: '推薦碼使用成功！' };
    } catch (error) {
      console.error('Apply referral code error:', error);

      // 針對不同錯誤類型提供友善的中文訊息
      let errorMessage = '推薦碼驗證失敗，請檢查推薦碼是否正確';

      if (error instanceof Error) {
        const errMsg = error.message.toLowerCase();

        // Firebase 權限錯誤
        if (errMsg.includes('permission') || errMsg.includes('insufficient')) {
          errorMessage = '推薦碼不存在或已失效';
        }
        // 網路錯誤
        else if (errMsg.includes('network') || errMsg.includes('timeout')) {
          errorMessage = '網路連線錯誤，請檢查網路後重試';
        }
        // 其他已知錯誤直接使用
        else if (error.message.includes('不能') || error.message.includes('已經') || error.message.includes('格式')) {
          errorMessage = error.message;
        }
      }

      return { success: false, message: errorMessage };
    }
  }, [userData, currentUser, updateUserData, addToast, addTransaction]);

  /**
   * Use a redeem code to extend premium access
   */
  const handleUseRedeemCode = useCallback(async (code: string, monthsToRedeem: number = 1): Promise<{ success: boolean; message: string }> => {
    if (!userData) {
      return { success: false, message: '用戶資料未載入' };
    }

    try {
      const { isRedeemCodeExpired, getRedeemCodeRemainingDays } = await import('./utils/referralUtils');

      // 查找兌換碼
      const redeemCode = userData.redeemCodes?.find(rc => rc.code === code);

      if (!redeemCode) {
        return { success: false, message: '兌換碼不存在' };
      }

      if (redeemCode.used) {
        return { success: false, message: '此兌換碼已被使用' };
      }

      if (isRedeemCodeExpired(redeemCode)) {
        const remainingDays = getRedeemCodeRemainingDays(redeemCode);
        return { success: false, message: `此兌換碼已過期（有效期 45 天）` };
      }

      // 驗證兌換數量
      if (monthsToRedeem < 1 || monthsToRedeem > 2) {
        return { success: false, message: '單次只能兌換 1-2 個月' };
      }

      // 計算新的方案結束日期
      const currentEndDate = userData.planTrialEndDate
        ? new Date(userData.planTrialEndDate)
        : new Date();

      const newEndDate = new Date(currentEndDate);
      newEndDate.setMonth(newEndDate.getMonth() + monthsToRedeem);

      // 更新兌換碼狀態
      const updatedRedeemCodes = userData.redeemCodes?.map(rc =>
        rc.code === code
          ? { ...rc, used: true, usedAt: new Date().toISOString() }
          : rc
      );

      // 更新用戶資料
      updateUserData({
        plan: 'premium_monthly',
        planTrialEndDate: newEndDate.toISOString(),
        redeemCodes: updatedRedeemCodes,
        isTrialUser: false,  // 兌換後不再是試用用戶
      });

      addToast(`🎉 成功兌換 ${monthsToRedeem} 個月高級功能！`, 'celebrate');
      addTransaction(`兌換碼: ${code}`, `+${monthsToRedeem} 個月高級功能`);

      return { success: true, message: `成功兌換 ${monthsToRedeem} 個月！` };
    } catch (error) {
      console.error('Use redeem code error:', error);
      return { success: false, message: '系統錯誤，請稍後再試' };
    }
  }, [userData, updateUserData, addToast, addTransaction]);

  /**
   * Check and handle trial/subscription expiry (called in daily reset)
   */
  const handleCheckTrialExpiry = useCallback(() => {
    if (!userData) return;

    const { isTrialExpired } = require('./utils/referralUtils');
    const now = new Date();

    // Check trial expiry
    if (isTrialExpired(userData)) {
      // 試用期已結束，禁用試用期間創建的任務
      const tasksToDisable = userData.tasks.filter(
        t => t.createdDuringTrial && new Date() > new Date(t.trialExpiryDate!)
      );

      if (tasksToDisable.length > 0) {
        const updatedTasks = userData.tasks.map(task => {
          if (task.createdDuringTrial && new Date() > new Date(task.trialExpiryDate!)) {
            return {
              ...task,
              disabled: true,
              disabledReason: '試用期已結束，升級至高級版本以繼續使用此任務'
            };
          }
          return task;
        });

        updateUserData({
          tasks: updatedTasks,
          isTrialUser: false,  // 標記試用期已結束
          subscriptionStatus: 'expired'
        });

        addToast(`您的試用期已結束，${tasksToDisable.length} 個任務已被禁用。升級以解鎖所有功能！`);
      }
    }

    // Check subscription expiry (for monthly plans)
    if (userData.subscriptionEndDate) {
      const endDate = new Date(userData.subscriptionEndDate);
      if (now > endDate && userData.subscriptionStatus !== 'expired') {
        // Subscription expired
        updateUserData({
          subscriptionStatus: 'expired',
          autoRenew: false  // Stop auto-renewal
        });
        addToast('您的訂閱已到期，請續訂以繼續使用高級功能。');
      }
    }

    // Check for upcoming expiry (7 days, 3 days, 1 day reminders)
    if (userData.subscriptionEndDate && userData.subscriptionStatus === 'active') {
      const endDate = new Date(userData.subscriptionEndDate);
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysLeft === 7 || daysLeft === 3 || daysLeft === 1) {
        addToast(`提醒：您的訂閱將在 ${daysLeft} 天後到期`);
      }
    }
  }, [userData, updateUserData, addToast]);

  // === GEMINI API KEY MANAGEMENT (for lifetime premium users) ===

  /**
   * Set and save Gemini API key for lifetime premium users
   */
  const handleSetGeminiApiKey = useCallback(async (key: string): Promise<void> => {
    if (!userData) {
      throw new Error('用戶資料未載入');
    }

    try {
      // Basic validation to prevent storing obviously invalid keys
      if (!key || key.trim().length < 20) {
        throw new Error('API Key 格式不正確（至少需要 20 個字符）');
      }

      // Update user data with the new API key
      updateUserData({ geminiApiKey: key.trim() });
      addToast('✅ API Key 已保存！', 'success');

      // Log the operation (without logging the key itself for security)
      addTransaction('更新 Gemini API Key', '已更新');
    } catch (error) {
      // Safe logging - do not expose API key in logs
      console.error('Set Gemini API key error (safe log - key not shown)');
      addToast('❌ 保存 API Key 時發生錯誤');
      throw error;
    }
  }, [userData, updateUserData, addToast, addTransaction]);

  /**
   * Validate the current Gemini API key
   */
  const handleValidateGeminiApiKey = useCallback(async (): Promise<boolean> => {
    if (!userData?.geminiApiKey) {
      return false;
    }

    try {
      const { validateGeminiApiKey } = await import('./services/geminiApiService');
      return await validateGeminiApiKey(userData.geminiApiKey);
    } catch (e) {
      console.error('Validate Gemini API key error:', e);
      return false;
    }
  }, [userData]);

  const handleTriggerYesterdaySummary = async () => {
    try {
      // Assuming `functions` and `httpsCallable` are available in this scope
      // If not, they would need to be imported, e.g., `import { getFunctions, httpsCallable } from 'firebase/functions';`
      // For this change, I'll assume they are already available or will be made available.
      // For a complete solution, you might need to add:
      // const functions = getFunctions(); // if not already defined
      addToast('⏳ 正在生成昨日總結，請稍後...', 'info');
      const trigger = httpsCallable(functions, 'triggerYesterdaySummary');
      const result = await trigger();
      const data = result.data as { success: boolean; summary: string };
      if (data.success) {
        addToast('✅ 昨日總結生成成功！', 'celebrate');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Trigger yesterday summary error:', error);
      addToast(`❌ 生成失敗: ${error.message || '未知錯誤'}`, 'error');
      return false;
    }
  };


  const handleFeedbackSubmit = (feedback: string) => addToast('感謝您的回饋！', 'success');


  const value = {
    userData,
    userDataLoading,
    isPointsAnimating,
    updateUserData,
    addToast,
    gainPoints,
    addTransaction,
    unlockAchievement,
    handleCompleteTask,
    handlePlayGachapon,
    handleExchange,
    handleBuyReward,
    handleUseItem,
    handleAddEntry,
    handleReportScore,
    handleAddTask,
    handleAddMultipleTasks,
    handleOverwriteTasks,
    handleEditTask,
    handleDeleteTask,
    handleChildAddTask,
    handlePraiseSubmit,
    handleFocusSessionComplete,
    handleShareMessage,
    handleSetGachaponPrizes,
    handleSetShopRewards,
    handleSetScoreHistory,
    handleUpdateUserProfile,
    handleSetFrozenHabitDates,
    handleReferral,
    handleFeedbackSubmit,
    handleDismissParentIntro,
    handleManualPointAdjustment,
    handleAddKeyEvent,
    handleDeleteKeyEvent,
    handleMakeWish,
    // Referral System Handlers
    handleApplyReferralCode,
    handleUseRedeemCode,
    handleCheckTrialExpiry,
    // Gemini API Key Management
    handleSetGeminiApiKey,
    handleValidateGeminiApiKey,
    handleTriggerYesterdaySummary,
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};
