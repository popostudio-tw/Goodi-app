export enum Page {
  Home = 'Home',
  Gachapon = 'Gachapon',
  RewardShop = 'RewardShop',
  Backpack = 'Backpack',
  Tree = 'Tree',
  Achievements = 'Achievements',
  Parent = 'Parent',
  FocusTimer = 'FocusTimer',
  ParentChildTime = 'ParentChildTime',
}

export type ParentView = 'dashboard' | 'tasks' | 'gachapon' | 'rewards';

// Plan types: supporting both old (paid199, paid499) and new naming conventions
export type Plan =
  | 'free'
  | 'paid199'  // Legacy: Advanced plan
  | 'paid499'  // Legacy: Premium plan
  | 'advanced_monthly'
  | 'advanced_lifetime'
  | 'premium_monthly'
  | 'premium_lifetime';

export type SubscriptionType = 'monthly' | 'lifetime';
export type ZhuyinMode = 'auto' | 'on' | 'off';
export type PricingTier = 'free' | 'advanced' | 'premium';

export interface Task {
  id: number;
  text: string;
  points: number;
  completed: boolean;
  category: '生活' | '家務' | '學習' | '每週' | '特殊' | '習慣養成';
  description: string;
  icon: string;
  isSpecial?: boolean;
  isHabit?: boolean;
  consecutiveCompletions?: number;
  mastered?: boolean; // New: Mastery status
  dateRange?: { start: string; end: string };
  addedBy?: 'parent' | 'child';
  schedule?: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
}

export interface Reward {
  id: number;
  name: string;
  description: string;
  cost: number;
  costType: 'tokens';
  icon: string;
  action?: 'add_ticket' | 'add_to_inventory' | 'parent_child_time';
  durationMinutes?: number;
}

export interface GachaponPrize {
  id: number;
  name: string;
  rarity: '普通' | '稀有' | '史詩' | '傳說';
  percentage: number;
  icon: string;
}

export interface JournalEntry {
  id: number;
  text: string;
  date: string;
  author: 'user' | 'goodi';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  videoId?: string; // New: Video to play upon unlocking/viewing
  isMastery?: boolean; // New: Flag for mastery achievements
}

export interface UserProfile {
  nickname: string;
  age: number | null;
  onboardingComplete?: boolean;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'celebrate';
}

export type Subject = '國語' | '英語' | '數學' | '社會' | '自然';
export type TestType = '小考' | '大考';

export interface ScoreEntry {
  id: number;
  date: string;
  subject: Subject;
  testType: TestType;
  score: number;
}

export interface InventoryItem {
  id: number;
  name: string;
  description: string;
  timestamp: number;
  used: boolean;
  durationMinutes?: number;
  action?: 'add_ticket' | 'add_to_inventory' | 'parent_child_time';
}

export interface Transaction {
  id: number;
  description: string;
  amount: string;
  timestamp: number;
}

export interface KeyEvent {
  id: number;
  date: string;
  text: string;
}

export type FocusSessionCounts = {
  [duration: number]: number;
};

export interface ActiveParentChildTimeSession {
  itemId: number;
  itemName: string;
  itemIcon: string;
  totalDurationSeconds: number;
}

export interface UserData {
  userProfile: UserProfile;
  points: number;
  tokens: number;
  gachaponTickets: number;
  streak: number;
  tasks: Task[];
  achievements: Achievement[];
  inventory: InventoryItem[];
  transactions: Transaction[];
  journalEntries: JournalEntry[];
  scoreHistory: ScoreEntry[];
  sharedMessages: string[];
  wishes: string[];
  plan: Plan;
  parentPin: string | null;
  shopRewards: Reward[];
  gachaponPrizes: GachaponPrize[];
  keyEvents: KeyEvent[];
  focusSessionCounts: FocusSessionCounts;
  frozenHabitDates: string[];
  referralCount: number;
  lastLoginDate?: string;
  planTrialEndDate?: string | null;
  parentIntroDismissed?: boolean;
  subscriptionType?: 'monthly' | 'yearly';
  pricingTier?: PricingTier;
  childrenCount?: number;
  maxChildren?: number;
  zhuyinMode?: ZhuyinMode;
}
