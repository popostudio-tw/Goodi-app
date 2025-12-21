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
  // Referral System: Trial period task tracking
  createdDuringTrial?: boolean;  // Whether task was created during trial period
  trialExpiryDate?: string;      // Trial expiry date (ISO string)
  disabled?: boolean;            // Whether task is disabled (trial expired)
  disabledReason?: string;       // Reason for disabling
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

// Referral System Interfaces
export interface RedeemCode {
  code: string;                       // Redeem code (e.g., REWARD-X3K9M2)
  type: 'referral_reward' | 'promotion' | 'other';
  description: string;                // Reward description
  rewardMonths: number;               // Number of months to redeem (fixed at 1)
  createdAt: string;                  // Creation timestamp (ISO string)
  expiresAt: string;                  // Expiry timestamp (45 days after creation)
  used: boolean;                      // Whether code has been used
  usedAt?: string;                    // Usage timestamp (ISO string)
}

export interface ReferralCodeDocument {
  code: string;                       // Referral code (e.g., GD-A3K7M9)
  userId: string;                     // Referrer's userId
  prefix: string;                     // Prefix (GD, FB, IG, etc.)
  createdAt: string;                  // Creation timestamp (ISO string)
  usedCount: number;                  // Number of times used
  usedBy: string[];                   // List of user IDs who used this code
  active: boolean;                    // Whether code is active
}

export interface ReferralRewardLog {
  id: string;                         // Log ID
  userId: string;                     // User who received the reward
  milestone: number;                  // Milestone reached (5, 10, 15, etc.)
  redeemCode: string;                 // Generated redeem code
  createdAt: string;                  // Creation timestamp (ISO string)
  claimed: boolean;                   // Whether reward has been claimed
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
  // Referral System Fields
  referralCode?: string;              // User's unique referral code (e.g., GD-A3K7M9)
  referredBy?: string;                // Referrer's userId
  referredByCode?: string;            // Referral code used
  referredAt?: string;                // Referral timestamp (ISO string)
  referralStatus?: 'pending' | 'completed';  // Referral status
  canAddReferralCode?: boolean;       // Whether user can add referral code (within 7 days)
  referredUsers?: string[];           // List of successfully referred user IDs
  redeemCodes?: RedeemCode[];         // List of owned redeem codes
  isTrialUser?: boolean;              // Whether user is on trial
  trialSource?: 'referral' | 'promotion' | 'other';  // Source of trial
  createdAt?: string;                 // Account creation timestamp (ISO string)
  // Pricing System Fields
  geminiApiKey?: string;              // Gemini API Key for lifetime users
  promoCode?: string;                 // Applied promotional code
  discountPercentage?: number;        // Discount percentage from promo code
  originalPrice?: number;             // Original price before discount
  discountedPrice?: number;           // Price after discount applied

  // Subscription Management Fields
  subscriptionStatus?: 'active' | 'expired' | 'cancelled' | 'trial';  // Current subscription status
  subscriptionStartDate?: string;     // Subscription start date (ISO string)
  subscriptionEndDate?: string;       // Subscription end date (ISO string, null for lifetime)
  autoRenew?: boolean;                // Whether subscription auto-renews (for monthly)
  nextBillingDate?: string;           // Next billing date (ISO string, for monthly plans)
  lastPaymentDate?: string;           // Last payment date (ISO string)
  paymentMethod?: string;             // Payment method identifier
  subscriptionCancelledAt?: string;   // When subscription was cancelled (ISO string)
}

// Usage Analytics (for product improvement, privacy-compliant)
export interface UsageAnalytics {
  userId: string;                      // User ID
  date: string;                        // Date (YYYY-MM-DD)
  plan: Plan;                          // User's plan
  metrics: {
    tasksCompleted: number;            // Tasks completed today
    focusMinutes: number;              // Focus session minutes
    aiQueriesCount: number;            // AI queries made
    pagesVisited: string[];            // Pages visited
    featuresUsed: string[];            // Features used
  };
  sessionDuration?: number;            // Session duration in minutes
  createdAt: string;                   // Creation timestamp (ISO string)
}

