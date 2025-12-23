// src/data.ts
// 提供 Goodi 的初始資料（新用戶第一次登入時用）
import {
  UserData,
  Task,
  Reward,
  GachaponPrize,
  Achievement,
  ZhuyinMode,
} from './types';

// ✅ 每日 / 每週 任務（可以自己再加減）
const initialTasksData: Task[] = [
  {
    id: 1,
    text: '早上自己起床',
    points: 2,
    completed: false,
    category: '生活',
    description: '鬧鐘一響自己起床，不賴床、不叫爸媽。',
    icon: 'https://api.iconify.design/twemoji/sunrise.svg',
    isHabit: true,
    consecutiveCompletions: 0,
  },
  {
    id: 2,
    text: '刷牙洗臉',
    points: 1,
    completed: false,
    category: '生活',
    description: '早晚各一次，刷牙滿 2 分鐘。',
    icon: 'https://api.iconify.design/twemoji/toothbrush.svg',
    isHabit: true,
    consecutiveCompletions: 0,
  },
  {
    id: 3,
    text: '整理書包',
    points: 2,
    completed: false,
    category: '家務',
    description: '把今天用不到的東西收好，明天要用的先準備好。',
    icon: 'https://api.iconify.design/twemoji/school-backpack.svg',
    isHabit: true,
    consecutiveCompletions: 0,
  },
  {
    id: 4,
    text: '主動幫忙家事',
    points: 3,
    completed: false,
    category: '家務',
    description: '不用爸媽提醒，自己主動幫忙一件家事。',
    icon: 'https://api.iconify.design/twemoji/broom.svg',
    isHabit: false,
  },
  {
    id: 5,
    text: '寫完今天的作業',
    points: 3,
    completed: false,
    category: '學習',
    description: '按時寫完功課，字體工整、不敷衍。',
    icon: 'https://api.iconify.design/twemoji/pencil.svg',
    isHabit: true,
    consecutiveCompletions: 0,
  },
  {
    id: 6,
    text: '閱讀 20 分鐘',
    points: 2,
    completed: false,
    category: '學習',
    description: '可以是課外書或課本，專心閱讀不中斷。',
    icon: 'https://api.iconify.design/twemoji/open-book.svg',
    isHabit: true,
    consecutiveCompletions: 0,
  },
  {
    id: 7,
    text: '一週運動 3 次',
    points: 5,
    completed: false,
    category: '每週',
    description: '跑步、球類或其他運動都可以，流汗算一次。',
    icon: 'https://api.iconify.design/twemoji/person-running.svg',
    isHabit: false,
    dateRange: undefined,
    schedule: ['mon', 'wed', 'fri'],
  },
  {
    id: 8,
    text: '整理房間',
    points: 4,
    completed: false,
    category: '每週',
    description: '把玩具、書本、衣服歸位，地板保持整齊。',
    icon: 'https://api.iconify.design/twemoji/bed.svg',
    isHabit: false,
  },
  {
    id: 9,
    text: '今天主動稱讚一個家人',
    points: 2,
    completed: false,
    category: '習慣養成',
    description: '觀察家人的優點，真心說出一句鼓勵或謝謝。',
    icon: 'https://api.iconify.design/twemoji/smiling-face-with-hearts.svg',
    isHabit: true,
    consecutiveCompletions: 0,
  },
];

// ✅ 商店獎勵
const initialShopRewards: Reward[] = [
  {
    id: 1,
    name: '10 分鐘玩電玩時間',
    description: '由爸媽同意後使用，一次 10 分鐘。',
    cost: 10,
    costType: 'tokens',
    icon: 'https://api.iconify.design/twemoji/video-game.svg',
    action: 'add_to_inventory',
    durationMinutes: 10,
  },
  {
    id: 2,
    name: '親子聊天時間',
    description: '關掉 3C，陪你聊聊天或一起散步 20 分鐘。',
    cost: 8,
    costType: 'tokens',
    icon: 'https://api.iconify.design/twemoji/people-holding-hands.svg',
    action: 'parent_child_time',
    durationMinutes: 20,
  },
  {
    id: 3,
    name: '週末點心任選一份',
    description: '在爸媽同意範圍內選一樣點心。',
    cost: 12,
    costType: 'tokens',
    icon: 'https://api.iconify.design/twemoji/doughnut.svg',
    action: 'add_to_inventory',
  },
  {
    id: 4,
    name: '抽一顆扭蛋',
    description: '兌換 1 張扭蛋券，可以去扭一次。',
    cost: 6,
    costType: 'tokens',
    icon: 'https://api.iconify.design/twemoji/crystal-ball.svg',
    action: 'add_ticket',
  },
];

// ✅ 扭蛋獎品池
const initialGachaponPrizes: GachaponPrize[] = [
  {
    id: 1,
    name: '貼紙小禮包',
    rarity: '普通',
    percentage: 50,
    icon: 'https://api.iconify.design/twemoji/sticker.svg',
  },
  {
    id: 2,
    name: '晚餐指定一道菜',
    rarity: '普通',
    percentage: 25,
    icon: 'https://api.iconify.design/twemoji/shallow-pan-of-food.svg',
  },
  {
    id: 3,
    name: '爸媽幫做一件家事',
    rarity: '稀有',
    percentage: 15,
    icon: 'https://api.iconify.design/twemoji/sparkles.svg',
  },
  {
    id: 4,
    name: '一起看一集卡通',
    rarity: '稀有',
    percentage: 7,
    icon: 'https://api.iconify.design/twemoji/television.svg',
  },
  {
    id: 5,
    name: '小小禮物驚喜',
    rarity: '史詩',
    percentage: 2,
    icon: 'https://api.iconify.design/twemoji/wrapped-gift.svg',
  },
  {
    id: 6,
    name: 'Goodi 祝福特別勳章',
    rarity: '傳說',
    percentage: 1,
    icon: 'https://api.iconify.design/twemoji/star-struck.svg',
  },
];

// ✅ 成就（先給幾個基本的）
const initialAchievementsData: Achievement[] = [
  {
    id: 'first-task',
    title: '第一步小勇士',
    description: '完成第一個任務。',
    icon: 'https://api.iconify.design/twemoji/party-popper.svg',
    unlocked: false,
  },
  {
    id: 'one-week-streak',
    title: '連續七天不放棄',
    description: '連續 7 天都有完成任務。',
    icon: 'https://api.iconify.design/twemoji/fire.svg',
    unlocked: false,
  },
  {
    id: 'helper',
    title: '家務小幫手',
    description: '完成 10 次家務相關任務。',
    icon: 'https://api.iconify.design/twemoji/broom.svg',
    unlocked: false,
  },
  {
    id: 'reader',
    title: '閱讀小書蟲',
    description: '完成 10 次閱讀任務。',
    icon: 'https://api.iconify.design/twemoji/books.svg',
    unlocked: false,
  },
];

// ✅ 初始 userData
const initialUserData: UserData = {
  userProfile: {
    nickname: '猴仔',
    age: 10,
    onboardingComplete: false,
  },
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
  childrenCount: 1,
  maxChildren: 1,
  parentPin: null,
  shopRewards: initialShopRewards,
  gachaponPrizes: initialGachaponPrizes,
  keyEvents: [],
  focusSessionCounts: { 5: 0, 10: 0, 15: 0, 25: 0 },
  frozenHabitDates: [],
  referralCount: 0,
  planTrialEndDate: null,
  parentIntroDismissed: false,
};

/**
 * 包一層函式，未來如果要根據不同 userId 給不同初始資料，可以在這裡擴充。
 */
export const getInitialUserData = (uid: string): UserData => {
  // 目前先直接回傳一份初始資料拷貝
  return {
    ...initialUserData,
    // lastLoginDate 可以順便記一下今天
    lastLoginDate: new Date().toISOString().split('T')[0],
  };
};
