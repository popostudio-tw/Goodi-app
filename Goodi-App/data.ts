
import { Achievement, Task, GachaponPrize, Reward, UserData, ZhuyinMode } from './types';

// --- INITIAL STATIC DATA ---

export const initialAchievementsData: Achievement[] = [
  { id: 1, name: '初來乍到', description: '首次完成一個任務', unlocked: false, dateUnlocked: null },
  { id: 2, name: '任務新手', description: '完成 10 個任務', unlocked: false, dateUnlocked: null },
  { id: 3, name: '任務達人', description: '完成 50 個任務', unlocked: false, dateUnlocked: null },
  { id: 4, name: '連續簽到', description: '連續 3 天完成習慣', unlocked: false, dateUnlocked: null },
  { id: 5, name: '習慣之力', description: '連續 7 天完成習慣', unlocked: false, dateUnlocked: null },
  { id: 6, name: '堅持不懈', description: '連續 21 天完成習慣', unlocked: false, dateUnlocked: null },
  { id: 7, name: '扭蛋初體驗', description: '第一次使用扭蛋機', unlocked: false, dateUnlocked: null },
  { id: 8, name: '收藏家', description: '從扭蛋機獲得 10 個不同獎品', unlocked: false, dateUnlocked: null },
  { id: 9, name: '購物愉快', description: '在獎品商店兌換第一個獎勵', unlocked: false, dateUnlocked: null },
  { id: 10, name: '小小理財家', description: '累積獲得 1000 積分', unlocked: false, dateUnlocked: null },
  { id: 11, name: '萬元戶', description: '累積獲得 10000 積分', unlocked: false, dateUnlocked: null },
  { id: 12, name: '心事分享', description: '第一次在心事樹洞許願', unlocked: false, dateUnlocked: null },
];

const ALL_DAYS: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[] = [
  'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun',
];

export const initialTasksData: Task[] = [
  { id: 1, name: '起床摺棉被', completed: false, category: '生活', isHabit: true, frequency: ALL_DAYS, consecutiveCompletions: 0, mastered: false },
  { id: 2, name: '刷牙洗臉', completed: false, category: '生活', isHabit: true, frequency: ALL_DAYS, consecutiveCompletions: 0, mastered: false },
  { id: 3, name: '吃早餐', completed: false, category: '生活', isHabit: true, frequency: ALL_DAYS, consecutiveCompletions: 0, mastered: false },
  { id: 4, name: '幫忙洗碗', completed: false, category: '家務', isHabit: false },
  { id: 5, name: '寫作業', completed: false, category: '學習', isHabit: true, frequency: ['mon', 'tue', 'wed', 'thu', 'fri'], consecutiveCompletions: 0, mastered: false },
];

export const initialGachaponPrizes: GachaponPrize[] = [
  { id: 1, name: '貼紙一張', probability: 0.5, type: 'item', isCollected: false },
  { id: 2, name: '糖果一顆', probability: 0.3, type: 'item', isCollected: false },
  { id: 3, name: '50 積分', probability: 0.1, type: 'points', value: 50, isCollected: false },
  { id: 4, name: '神秘玩具', probability: 0.05, type: 'item', isCollected: false },
  { id: 5, name: '100 積分', probability: 0.05, type: 'points', value: 100, isCollected: false },
];

export const initialShopRewards: Reward[] = [
  { id: 101, name: '看卡通 30 分鐘', cost: 100, category: '娛樂' },
  { id: 102, name: '買一個小玩具', cost: 500, category: '購物' },
  { id: 103, name: '公園玩', cost: 200, category: '戶外活動' },
];

export const commonTasksData: Omit<Task, 'id' | 'completed' | 'isHabit' | 'consecutiveCompletions'>[] = [
  { name: '收拾書包', category: '生活' },
  { name: '閱讀 20 分鐘', category: '學習' },
  { name: '倒垃圾', category: '家務' },
  { name: '練習樂器 15 分鐘', category: '才藝' },
];

export const getInitialUserData = (uid: string): UserData => ({
  userProfile: { nickname: '', age: null, onboardingComplete: false },
  points: 0,
  tokens: 0,
  gachaponTickets: 1,
  streak: 0,
  tasks: initialTasksData,
  achievements: initialAchievementsData,
  inventory: [],
  transactions: [],
  journalEntries: [],
  scoreHistory: [],
  sharedMessages: [],
  wishes: [],
  plan: 'free',
  parentPin: null,
  shopRewards: initialShopRewards,
  gachaponPrizes: initialGachaponPrizes,
  keyEvents: [],
  focusSessionCounts: { 5: 0, 10: 0, 15: 0, 25: 0 },
  frozenHabitDates: [],
  referralCount: 0,
  lastLoginDate: new Date().toISOString().split('T')[0],
  planTrialEndDate: null,
  parentIntroDismissed: false,
  subscriptionType: 'monthly',
  pricingTier: 'free',
  geminiApiKey: undefined,
  childrenCount: 1,
  maxChildren: 1,
  promoCode: undefined,
  discountPercentage: undefined,
  originalPrice: undefined,
  discountedPrice: undefined,
  zhuyinMode: 'auto',
});
