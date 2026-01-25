import React, { createContext, useState, useCallback, useEffect, useRef, useMemo, useContext } from 'react';
import { Page, Task, Reward, JournalEntry, Achievement, Plan, UserProfile, ToastMessage, ScoreEntry, Subject, TestType, InventoryItem, Transaction, GachaponPrize, KeyEvent, FocusSessionCounts, UserData } from './types';
import { getSafeResponse } from './src/services/apiClient';
import { db } from './firebase';
import { User } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

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
  frozenHabitDates: [], referralCount: 0,
  planTrialEndDate: null,
  parentIntroDismissed: false,
};
// --- END INITIAL DATA ---

// --- HELPER FOR FIRESTORE ---
// Recursively remove undefined values from objects to prevent Firestore errors
const removeUndefined = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(v => removeUndefined(v));
  }

  const newObj: any = {};
  Object.keys(obj).forEach(key => {
    const value = removeUndefined(obj[key]);
    if (value !== undefined) {
      newObj[key] = value;
    }
  });
  return newObj;
};

// --- CONTEXT DEFINITION ---
interface UserDataContextType {
  userData: Omit<UserData, 'lastLoginDate'>;
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
  user: User | null;
  addToast: (message: string, type?: 'success' | 'celebrate') => void;
}

const STORAGE_KEY = 'goodi_app_data_v2';

export const UserDataProvider: React.FC<UserDataProviderProps> = ({ children, user, addToast }) => {
  // Initialize from LocalStorage if available, otherwise use initialUserData
  const [userData, setUserData] = useState<Omit<UserData, 'lastLoginDate'>>(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Migration: Remove Zoo Adventure (ID 304) if present from older data
        if (parsed.shopRewards) {
          parsed.shopRewards = parsed.shopRewards.filter((r: Reward) => r.id !== 304);
        }
        return parsed;
      } catch (e) {
        console.error("Failed to parse local storage data", e);
        return initialUserData;
      }
    }
    return initialUserData;
  });

  const [isPointsAnimating, setIsPointsAnimating] = useState(false);
  const userDataRef = useRef(userData);

  // Update ref whenever userData changes
  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);

  // Removed: Direct GoogleGenAI usage to prevent API key exposure
  // TODO: Migrate WhisperTree AI功能to Cloud Function

  // --- LOCAL STORAGE SYNC ---
  // Whenever userData changes, save it to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  }, [userData]);

  // Daily Reset Logic using LocalStorage Data
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastCheckDate = localStorage.getItem('goodi_last_daily_check');

    if (lastCheckDate !== todayStr) {
      const yesterdayStr = new Date(Date.now() - 864e5).toISOString().split('T')[0];
      const wasYesterdayFrozen = (userData.frozenHabitDates || []).includes(yesterdayStr);

      const resetTasks = userData.tasks.map(task => {
        // Only reset completions if it's a habit/daily task
        // Logic: If it's a habit, it resets daily.
        // However, we track 'consecutiveCompletions' for mastery.
        // If user missed yesterday and it wasn't frozen, reset consecutive count.
        // BUT, we only know if they missed it if we check completed status from "yesterday" (which is current state before reset).

        // NOTE: The state in 'userData' right now represents "Yesterday" (since it hasn't been reset for today yet).
        // If task.completed is false, and it's a habit, reset consecutive.

        let newConsecutive = task.consecutiveCompletions || 0;

        if (task.isHabit || task.category === '生活' || task.category === '家務') {
          if (!task.completed && !wasYesterdayFrozen && !task.mastered) {
            // If failed yesterday and not frozen, and not yet mastered, reset streak
            newConsecutive = 0;
          }
        }

        return {
          ...task,
          completed: false,
          consecutiveCompletions: newConsecutive
        };
      });

      setUserData(prev => ({
        ...prev,
        tasks: resetTasks
      }));
      localStorage.setItem('goodi_last_daily_check', todayStr);
    }
  }, []);

  const saveData = useCallback(async (dataToSave: Omit<UserData, 'lastLoginDate'>) => {
    if (user) {
      try {
        const fullData: UserData = { ...dataToSave, lastLoginDate: new Date().toISOString().split('T')[0] };
        // Use removeUndefined to clean data before saving to Firestore
        const cleanData = removeUndefined(fullData);
        await setDoc(doc(db, 'users', user.uid), cleanData, { merge: true });
      } catch (error) { console.error("Error saving user data:", error); }
    }
  }, [user]);

  // --- FIRESTORE SYNC ---
  // Load user data from Firestore when user logs in
  useEffect(() => {
    if (!user) {
      console.log('[UserDataProvider] No user, skipping Firestore sync');
      return;
    }

    console.log('[UserDataProvider] Setting up Firestore sync for user:', user.uid);

    const userDocRef = doc(db, 'users', user.uid);

    // Subscribe to real-time updates from Firestore
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        console.log('[UserDataProvider] Loaded data from Firestore');
        const firestoreData = docSnapshot.data() as UserData;

        // Merge Firestore data with any local changes, Firestore takes priority
        setUserData(prevData => {
          // If this is the first load (data is still initial), use Firestore data completely
          const isInitialLoad = prevData.userProfile.nickname === initialUserData.userProfile.nickname;

          if (isInitialLoad) {
            console.log('[UserDataProvider] First load, using Firestore data');
            return firestoreData;
          } else {
            // Otherwise, keep local changes but update with any Firestore changes
            return { ...firestoreData };
          }
        });
      } else {
        console.log('[UserDataProvider] No data in Firestore, creating initial document');
        // If no data exists in Firestore, save initial data
        saveData(userData);
      }
    }, (error) => {
      console.error('[UserDataProvider] Error loading from Firestore:', error);
    });

    return () => {
      console.log('[UserDataProvider] Cleaning up Firestore sync');
      unsubscribe();
    };
  }, [user]); // Only re-run when user changes

  const updateUserData = useCallback((updates: Partial<Omit<UserData, 'lastLoginDate'>>) => {
    setUserData(prevData => {
      const newData = { ...prevData, ...updates };
      saveData(newData);
      return newData;
    });
  }, [saveData]);

  // --- UTILITY & HELPER FUNCTIONS ---
  const addTransaction = useCallback((description: string, amount: string) => {
    const newTransaction: Transaction = { id: Date.now(), description, amount, timestamp: Date.now() };
    const currentTransactions = userDataRef.current.transactions;
    updateUserData({ transactions: [newTransaction, ...currentTransactions] });
  }, [updateUserData]);

  const gainPoints = useCallback((amount: number) => {
    const currentPoints = Number(userDataRef.current.points || 0);
    updateUserData({ points: currentPoints + amount });
    setIsPointsAnimating(true);
    setTimeout(() => setIsPointsAnimating(false), 600);
  }, [updateUserData]);

  const unlockAchievement = useCallback((id: string, customTitle?: string, customIcon?: string, videoId?: string) => {
    // Check if achievement exists
    const currentData = userDataRef.current;
    const existingAch = currentData.achievements.find(a => a.id === id);

    if (existingAch) {
      if (!existingAch.unlocked) {
        // Unlock existing
        addToast(`成就解鎖：${existingAch.title}`, 'celebrate');
        const newItem: InventoryItem = { id: Date.now() + Math.random(), name: '成就獎勵寶箱', description: 'https://api.iconify.design/twemoji/gem-stone.svg', timestamp: Date.now(), used: false };
        updateUserData({
          achievements: currentData.achievements.map(a => a.id === id ? { ...a, unlocked: true, videoId: videoId || a.videoId } : a),
          inventory: [newItem, ...currentData.inventory]
        });
        addTransaction('獲得成就獎勵', '成就獎勵寶箱');
      }
    } else if (customTitle && customIcon) {
      // Create new dynamic achievement (for mastery)
      addToast(`解鎖大師徽章：${customTitle}`, 'celebrate');
      const newItem: InventoryItem = { id: Date.now() + Math.random(), name: '大師獎勵寶箱', description: 'https://api.iconify.design/twemoji/crown.svg', timestamp: Date.now(), used: false };

      updateUserData({
        inventory: [newItem, ...currentData.inventory]
      });
      addTransaction('獲得大師獎勵', '大師獎勵寶箱');
    }
  }, [updateUserData, addToast, addTransaction]);

  const checkAchievements = useCallback(() => {
    const currentData = userDataRef.current;
    const completedTasks = currentData.tasks.filter(t => t.completed);
    const check = (id: string, condition: boolean) => {
      if (!currentData.achievements.find(a => a.id === id)?.unlocked && condition) unlockAchievement(id);
    };
    check('learn_1', completedTasks.filter(t => t.category === '學習').length >= 1);
    check('tasks_10', completedTasks.length >= 10);
    check('referral_1', currentData.referralCount >= 1);
  }, [unlockAchievement]);

  useEffect(() => { checkAchievements(); }, [checkAchievements, userData.tasks, userData.referralCount]); // Dependencies kept for effect trigger

  // --- MAIN HANDLERS ---
  const handleCompleteTask = useCallback((taskId: number, isProactive: boolean) => {
    const currentData = userDataRef.current;
    const task = currentData.tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;

    // Logic for Mastery: 1.5x points
    const basePoints = Number(task.points);
    let pointsGained = isProactive ? Math.floor(basePoints * 1.5) : basePoints;

    if (task.mastered) {
      pointsGained = Math.floor(pointsGained * 1.5);
    }

    const newTransaction: Transaction = { id: Date.now(), description: `完成任務: ${task.text} ${isProactive ? '(主動)' : ''} ${task.mastered ? '(大師加成)' : ''}`, amount: `+${pointsGained} 積分`, timestamp: Date.now() };

    const newTasks = currentData.tasks.map(t => {
      if (t.id === taskId) {
        const updatedTask = { ...t, completed: true };

        // Habit Logic (Daily/Chore/Life/Habit)
        if (updatedTask.isHabit || updatedTask.category === '生活' || updatedTask.category === '家務') {
          updatedTask.consecutiveCompletions = (updatedTask.consecutiveCompletions || 0) + 1;

          // Mastery Unlock Condition (21 days)
          if (updatedTask.consecutiveCompletions >= 21 && !updatedTask.mastered) {
            updatedTask.mastered = true;

            // Trigger unlocking the specific mastery achievement event
            setTimeout(() => {
              unlockAchievement(
                `mastery_${updatedTask.id}`,
                `${updatedTask.text}大師`,
                updatedTask.icon,
                // Placeholder video for mastery unlock
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
      streak: currentData.streak + 1,
      points: Number(currentData.points || 0) + pointsGained,
      transactions: [newTransaction, ...currentData.transactions],
    });

    const praiseMsg = task.mastered
      ? `大師級表現！獲得 ${pointsGained} 積分 (含加成)！`
      : `任務完成！獲得 ${pointsGained} 積分！`;
    addToast(praiseMsg, 'success');
  }, [updateUserData, addToast, unlockAchievement]);

  const handlePraiseSubmit = useCallback((taskId: number, isProactive: boolean, praiseText: string) => {
    const currentData = userDataRef.current;
    const targetId = 27;
    let task = currentData.tasks.find(t => t.id === targetId);
    if (!task) { task = initialTasksData.find(t => t.id === 27); }
    if (!task) { task = { id: 27, text: '得到老師稱讚', points: 5, completed: false, category: '特殊', description: '今天在學校表現很棒！', icon: 'https://api.iconify.design/twemoji/star-struck.svg' } as Task; }

    if (task.completed) { addToast('今天已經領過獎勵囉！明天再來吧！'); return; }

    const pointsGained = isProactive ? Math.floor(Number(task.points) * 1.5) : Number(task.points);
    const updatedTasks = currentData.tasks.map(t => t.id === targetId ? { ...t, completed: true } : t);
    const transactionDescription = `完成任務: ${task.text} ${isProactive ? '(主動)' : ''}`;
    const newTransaction: Transaction = { id: Date.now(), description: transactionDescription, amount: `+${pointsGained} 積分`, timestamp: Date.now() };

    setIsPointsAnimating(true);
    setTimeout(() => setIsPointsAnimating(false), 600);

    updateUserData({
      points: Number(currentData.points || 0) + pointsGained,
      tasks: updatedTasks,
      streak: currentData.streak + 1,
      sharedMessages: [`老師稱讚「${currentData.userProfile.nickname}」因為：${praiseText}`, ...currentData.sharedMessages],
      transactions: [newTransaction, ...currentData.transactions],
    });
    addToast(`太棒了！獲得 ${pointsGained} 積分！`, 'celebrate');
  }, [updateUserData, addToast]);

  const handlePlayGachapon = useCallback((): InventoryItem | null => {
    const currentData = userDataRef.current;
    if (currentData.gachaponTickets < 1) { addToast('扭蛋券不足！'); return null; }
    const rand = Math.random() * currentData.gachaponPrizes.reduce((s, p) => s + p.percentage, 0);
    let cumulative = 0;
    const prize = currentData.gachaponPrizes.find(p => (cumulative += p.percentage) >= rand) || currentData.gachaponPrizes[0];
    if (!prize) return null;

    let updates: Partial<Omit<UserData, 'lastLoginDate'>> = { gachaponTickets: currentData.gachaponTickets - 1 };
    const newItem: InventoryItem = { id: Date.now(), name: prize.name, description: prize.icon, timestamp: Date.now(), used: false };

    if (prize.name.includes('積分')) {
      const pointsWon = parseInt(prize.name.match(/\d+/)?.[0] || '0', 10);
      if (pointsWon > 0) {
        updates.points = Number(currentData.points || 0) + pointsWon;
        newItem.used = true;
        addToast(`恭喜抽中 ${pointsWon} 積分！`, 'celebrate');
        addTransaction('神奇扭蛋機', `+${pointsWon} 積分`);
      }
    } else {
      addToast(`恭喜獲得 ${prize.rarity} 獎品：${prize.name}!`, 'celebrate');
      addTransaction('神奇扭蛋機', '獲得獎品');
    }

    updates.inventory = [newItem, ...currentData.inventory];
    updateUserData(updates);
    return newItem;
  }, [updateUserData, addToast, addTransaction]);

  const handleExchange = useCallback((pointsToSpend: number, tokensToGet: number) => {
    const currentData = userDataRef.current;
    if (currentData.points < pointsToSpend) { addToast('積分不足！'); return false; }
    updateUserData({ points: currentData.points - pointsToSpend, tokens: currentData.tokens + tokensToGet });
    addTransaction('積分兌換', `-${pointsToSpend} 積分, +${tokensToGet} 代幣`);
    addToast(`成功兌換 ${tokensToGet} 代幣！`, 'success');
    return true;
  }, [updateUserData, addToast, addTransaction]);

  const handleBuyReward = useCallback((reward: Reward) => {
    const currentData = userDataRef.current;
    if (currentData.tokens < reward.cost) { addToast('代幣不足！'); return false; }
    addTransaction(`購買獎勵: ${reward.name}`, `-${reward.cost} 代幣`);
    let updates: Partial<Omit<UserData, 'lastLoginDate'>> = { tokens: currentData.tokens - reward.cost };
    if (reward.action === 'add_ticket') {
      updates.gachaponTickets = currentData.gachaponTickets + 1;
      addToast('成功購買扭蛋券！', 'success');
    } else {
      const newItem: InventoryItem = { id: Date.now(), name: reward.name, description: reward.icon, timestamp: Date.now(), used: false, action: reward.action, durationMinutes: reward.durationMinutes };
      updates.inventory = [newItem, ...currentData.inventory];
      addToast(`成功購買 ${reward.name}！`, 'success');
    }
    updateUserData(updates);
    return true;
  }, [updateUserData, addToast, addTransaction]);

  const handleMakeWish = useCallback((wish: string): boolean => {
    const currentData = userDataRef.current;
    const cost = 50;
    if (currentData.tokens < cost) { addToast('代幣不足！'); return false; }
    addTransaction('許願池', `-${cost} 代幣`);
    updateUserData({
      tokens: currentData.tokens - cost,
      wishes: [wish, ...currentData.wishes]
    });
    addToast('願望已送出！', 'success');
    return true;
  }, [updateUserData, addToast, addTransaction]);

  const handleUseItem = useCallback((id: number, callbacks: { onStartParentChildTime: () => void }) => {
    const currentData = userDataRef.current;
    const item = currentData.inventory.find(i => i.id === id);
    if (!item || item.used) return;
    if (item.action === 'parent_child_time' && item.durationMinutes) { callbacks.onStartParentChildTime(); return; }

    let usedSuccessfully = false;
    let updates: Partial<Omit<UserData, 'lastLoginDate'>> = {};
    if (item.name === '成就獎勵寶箱' || item.name === '大師獎勵寶箱') {
      const pointsWon = Math.floor(Math.random() * 30) + 20;
      updates.points = currentData.points + pointsWon;
      addToast(`打開寶箱！獲得 ${pointsWon} 積分！`, 'celebrate');
      addTransaction(`開啟${item.name}`, `+${pointsWon} 積分`);
      usedSuccessfully = true;
    }
    if (!usedSuccessfully) { addToast('獎品已核銷！'); }
    updates.inventory = currentData.inventory.map(i => (i.id === id ? { ...i, used: true } : i));
    updateUserData(updates);
  }, [updateUserData, addToast, addTransaction]);

  const handleAddEntry = useCallback(async (text: string) => {
    const currentData = userDataRef.current;
    const userEntry: JournalEntry = { id: Date.now(), text, date: new Date().toISOString(), author: 'user' };
    updateUserData({ journalEntries: [...currentData.journalEntries, userEntry] });

    try {
      console.log('[TreeHole] Calling getSafeResponse API...');
      // 調用後端 Cloud Function (安全的方式)
      const result = await getSafeResponse(text, currentData.userProfile?.nickname);

      // 處理返回結果
      if (result.success && result.data) {
        const { response, needsAttention } = result.data;

        console.log('[TreeHole] API response received:', { needsAttention });

        // 如果需要家長關注，添加到 sharedMessages
        if (needsAttention) {
          updateUserData({
            journalEntries: [...currentData.journalEntries, userEntry],
            sharedMessages: [`【安全警示】孩子在心事樹洞中提到了可能令人擔憂的內容：「${text}」`, ...currentData.sharedMessages]
          });
        }

        // 添加 AI 回覆
        const goodiEntry: JournalEntry = {
          id: Date.now() + 1,
          text: response,
          date: new Date().toISOString(),
          author: 'goodi'
        };
        updateUserData({ journalEntries: [...currentData.journalEntries, userEntry, goodiEntry] });

      } else {
        // API 失敗，使用 fallback
        console.warn('[TreeHole] API call failed, using fallback');
        const fallbackEntry: JournalEntry = {
          id: Date.now() + 1,
          text: "謝謝你跟我分享！Goodi會一直陪著你的 💚",
          date: new Date().toISOString(),
          author: 'goodi'
        };
        updateUserData({ journalEntries: [...currentData.journalEntries, userEntry, fallbackEntry] });
      }

    } catch (error) {
      console.error('[TreeHole] API call error:', error);
      // 錯誤發生，使用 fallback
      const errorEntry: JournalEntry = {
        id: Date.now() + 1,
        text: "嗚，Goodi 的訊號好像不太好，等一下再試一次好嗎？",
        date: new Date().toISOString(),
        author: 'goodi'
      };
      updateUserData({ journalEntries: [...currentData.journalEntries, userEntry, errorEntry] });
    }
  }, [updateUserData]);

  const handleReportScore = useCallback((details: { subject: Subject; testType: TestType; score: number }) => {
    const currentData = userDataRef.current;
    const newEntry: ScoreEntry = { id: Date.now(), date: new Date().toISOString().split('T')[0], ...details };
    if (details.score === 100) {
      const recentScores = [...currentData.scoreHistory].slice(0, 2);
      if (recentScores.length === 2 && recentScores.every(s => s.score === 100)) unlockAchievement('score_perfect_streak_3');
    }
    const newScoreHistory = [newEntry, ...currentData.scoreHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    updateUserData({ scoreHistory: newScoreHistory });
    gainPoints(2);
    addToast('謝謝你的分享！獲得 2 積分！');
    addTransaction('回報考卷成績', '+2 積分');
  }, [updateUserData, gainPoints, addToast, addTransaction, unlockAchievement]);

  const handleAddTask = useCallback((taskData: Omit<Task, 'id' | 'completed' | 'isHabit' | 'consecutiveCompletions'>) => {
    const currentData = userDataRef.current;
    const newTask: Task = {
      ...taskData,
      id: Date.now(),
      completed: false,
      isHabit: !['學習', '特殊', '每週'].includes(taskData.category),
      consecutiveCompletions: 0,
      addedBy: 'parent'
    };
    updateUserData({ tasks: [...currentData.tasks, newTask] });
    addToast('任務已新增！');
  }, [updateUserData, addToast]);

  const handleEditTask = useCallback((updatedTask: Task) => {
    const currentData = userDataRef.current;
    updateUserData({ tasks: currentData.tasks.map(t => t.id === updatedTask.id ? updatedTask : t) });
    addToast('任務已更新！');
  }, [updateUserData, addToast]);

  const handleDeleteTask = useCallback((taskId: number) => {
    const currentData = userDataRef.current;
    updateUserData({ tasks: currentData.tasks.filter(t => t.id !== taskId) });
    addToast('任務已刪除！');
  }, [updateUserData, addToast]);

  const handleAddMultipleTasks = useCallback((newTasks: Omit<Task, 'id' | 'completed' | 'isHabit' | 'consecutiveCompletions'>[]) => {
    const currentData = userDataRef.current;
    const tasksToAdd = newTasks.map(task => ({ ...task, id: Date.now() + Math.random(), completed: false, isHabit: task.category !== '學習' && task.category !== '特殊', consecutiveCompletions: 0, addedBy: 'parent' as const }));
    updateUserData({ tasks: [...currentData.tasks, ...tasksToAdd] });
    addToast(`成功匯入 ${newTasks.length} 個任務！`);
  }, [updateUserData, addToast]);

  const handleOverwriteTasks = useCallback((newTasks: Omit<Task, 'id' | 'completed' | 'isHabit' | 'consecutiveCompletions'>[]) => {
    const tasksToAdd = newTasks.map(task => ({ ...task, id: Date.now() + Math.random(), completed: false, isHabit: task.category !== '學習' && task.category !== '特殊', consecutiveCompletions: 0, addedBy: 'parent' as const }));
    updateUserData({ tasks: tasksToAdd });
    addToast(`成功匯入並覆蓋了 ${newTasks.length} 個任務！`);
  }, [updateUserData, addToast]);

  const handleChildAddTask = useCallback((text: string, frequency: 'today' | 'everyday' | 'schooldays') => {
    const currentData = userDataRef.current;
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
    updateUserData({ tasks: [...currentData.tasks, newTask] });
    addToast(`新增任務：「${text}」！`);
  }, [updateUserData, addToast]);

  const handleFocusSessionComplete = useCallback((durationInSeconds: number) => {
    const currentData = userDataRef.current;
    const durationInMins = durationInSeconds / 60;
    const newCounts = { ...currentData.focusSessionCounts, [durationInMins]: (currentData.focusSessionCounts[durationInMins] || 0) + 1 };
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
  }, [updateUserData, gainPoints, addToast, addTransaction]);

  const handleShareMessage = useCallback((message: string) => {
    const currentData = userDataRef.current;
    if (!message.trim()) return;
    updateUserData({
      sharedMessages: [message.trim(), ...currentData.sharedMessages]
    });
    gainPoints(5);
    addTransaction('想跟家人分享的事', `+5 積分`);
    addToast('訊息已分享！獲得 5 積分！', 'success');
  }, [updateUserData, gainPoints, addTransaction, addToast]);

  const handleDismissParentIntro = useCallback(() => {
    updateUserData({ parentIntroDismissed: true });
  }, [updateUserData]);

  const handleManualPointAdjustment = useCallback((amount: number, reason: string) => {
    const currentData = userDataRef.current;
    if (isNaN(amount) || amount === 0) return;

    const currentPoints = Number(currentData.points || 0);
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

  }, [updateUserData, addTransaction, addToast]);

  const handleAddKeyEvent = useCallback((text: string, date: string) => {
    const currentData = userDataRef.current;
    if (!text.trim()) return;
    const newEvent: KeyEvent = {
      id: Date.now(),
      date: date,
      text: text.trim(),
    };
    updateUserData({ keyEvents: [...currentData.keyEvents, newEvent].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) });
    addToast('紀事已新增！');
  }, [updateUserData, addToast]);

  const handleDeleteKeyEvent = useCallback((id: number) => {
    const currentData = userDataRef.current;
    if (window.confirm('確定要刪除這筆紀事嗎？')) {
      updateUserData({ keyEvents: currentData.keyEvents.filter(e => e.id !== id) });
      addToast('紀事已刪除。');
    }
  }, [updateUserData, addToast]);

  const handleSetGachaponPrizes = useCallback((prizes: GachaponPrize[]) => updateUserData({ gachaponPrizes: prizes }), [updateUserData]);
  const handleSetShopRewards = useCallback((rewards: Reward[]) => updateUserData({ shopRewards: rewards }), [updateUserData]);
  const handleSetScoreHistory = useCallback((scores: ScoreEntry[]) => updateUserData({ scoreHistory: scores }), [updateUserData]);
  const handleUpdateUserProfile = useCallback((profile: UserProfile) => updateUserData({ userProfile: profile }), [updateUserData]);
  const handleSetFrozenHabitDates = useCallback((dates: string[]) => updateUserData({ frozenHabitDates: dates }), [updateUserData]);
  const handleReferral = useCallback(() => {
    const currentData = userDataRef.current;
    const newCount = (currentData.referralCount || 0) + 1;
    updateUserData({ referralCount: newCount });
    if (newCount >= 1) unlockAchievement('referral_1');
  }, [updateUserData, unlockAchievement]);
  const handleFeedbackSubmit = useCallback((feedback: string) => addToast('感謝您的回饋！', 'success'), [addToast]);


  const value = useMemo(() => ({
    userData, isPointsAnimating, updateUserData, addToast, gainPoints, addTransaction, unlockAchievement,
    handleCompleteTask, handlePlayGachapon, handleExchange, handleBuyReward, handleUseItem, handleAddEntry,
    handleReportScore, handleAddTask, handleAddMultipleTasks, handleOverwriteTasks, handleEditTask,
    handleDeleteTask, handleChildAddTask, handlePraiseSubmit, handleFocusSessionComplete, handleShareMessage,
    handleSetGachaponPrizes, handleSetShopRewards, handleSetScoreHistory, handleUpdateUserProfile,
    handleSetFrozenHabitDates, handleReferral, handleFeedbackSubmit,
    handleDismissParentIntro, handleManualPointAdjustment,
    handleAddKeyEvent,
    handleDeleteKeyEvent,
    handleMakeWish,
  }), [
    userData, isPointsAnimating, updateUserData, addToast, gainPoints, addTransaction, unlockAchievement,
    handleCompleteTask, handlePlayGachapon, handleExchange, handleBuyReward, handleUseItem, handleAddEntry,
    handleReportScore, handleAddTask, handleAddMultipleTasks, handleOverwriteTasks, handleEditTask,
    handleDeleteTask, handleChildAddTask, handlePraiseSubmit, handleFocusSessionComplete, handleShareMessage,
    handleSetGachaponPrizes, handleSetShopRewards, handleSetScoreHistory, handleUpdateUserProfile,
    handleSetFrozenHabitDates, handleReferral, handleFeedbackSubmit,
    handleDismissParentIntro, handleManualPointAdjustment,
    handleAddKeyEvent,
    handleDeleteKeyEvent,
    handleMakeWish
  ]);

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};
