# Firestore Data Structure Documentation

## Collections

### `users/{userId}`
用戶主數據集合

**Fields:**
```typescript
{
  // User Profile
  userProfile: {
    nickname: string;
    age: number | null;
    onboardingComplete?: boolean;
  };
  
  // Points and Currency
  points: number;
  tokens: number;
  gachaponTickets: number;
  streak: number;
  
  // Tasks and Achievements
  tasks: Task[];
  achievements: Achievement[];
  inventory: InventoryItem[];
  
  // Plan and Subscription
  plan: Plan;  // 'free' | 'paid199' | 'paid499' | 'advanced_monthly' | 'advanced_lifetime' | 'premium_monthly' | 'premium_lifetime'
  subscriptionStatus?: 'active' | 'expired' | 'cancelled' | 'trial';
  subscriptionStartDate?: string;  // ISO string
  subscriptionEndDate?: string;    // ISO string
  autoRenew?: boolean;
  nextBillingDate?: string;        // ISO string
  
  // Gemini API (for lifetime users)
  geminiApiKey?: string;           // Encrypted at-rest by Firebase
  
  // Promo Code
  promoCode?: string;
  discountPercentage?: number;
  originalPrice?: number;
  discountedPrice?: number;
  
  // Other fields...
}
```

**Security Rules:**
```javascript
match /users/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow create: if request.auth != null && request.auth.uid == userId;
  allow update: if request.auth != null && request.auth.uid == userId
                 && (!request.resource.data.keys().hasAny(['geminiApiKey']) 
                     || request.resource.data.geminiApiKey is string);
  allow delete: if request.auth != null && request.auth.uid == userId;
}
```

---

### `promoCodes/{code}`
促銷碼集合

**Fields:**
```typescript
{
  code: string;                    // 促銷碼（大寫）
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  validUntil: Date;                // 有效期限
  applicablePlans: PricingTier[];  // 適用方案
  description: string;
  active: boolean;
}
```

**Security Rules:**
```javascript
match /promoCodes/{code} {
  allow read: if request.auth != null;
  allow write: if false;  // 僅透過 Firebase Console 管理
}
```

**Note:** 目前使用 hardcoded 促銷碼（簡化 MVP）

---

### `usageAnalytics/{userId}_{date}`
使用分析集合

**Document ID Format:** `{userId}_{YYYY-MM-DD}`

**Fields:**
```typescript
{
  userId: string;
  date: string;                    // YYYY-MM-DD
  plan: Plan;
  metrics: {
    tasksCompleted: number;
    focusMinutes: number;
    aiQueriesCount: number;
    pagesVisited: string[];
    featuresUsed: string[];
  };
  sessionDuration?: number;
  createdAt: string;               // ISO string
}
```

**Security Rules:**
```javascript
match /usageAnalytics/{analyticsId} {
  allow read: if request.auth != null && analyticsId.matches('^' + request.auth.uid + '_.*');
  allow write: if request.auth != null && analyticsId.matches('^' + request.auth.uid + '_.*');
}
```

**Privacy Compliance:**
- 僅用於產品改進
- 不含個人識別信息
- 符合 GDPR 規範

---

### `dailyContent/{date}`
每日內容集合（歷史今天、動物冷知識）

**Document ID Format:** `YYYY-MM-DD`

**Fields:**
```typescript
{
  date: string;
  todayInHistory: string;
  animalTrivia: string;
  createdAt: string;
  createdBy: string;  // userId
}
```

**Security Rules:**
```javascript
match /dailyContent/{date} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```

---

### `referralCodes/{code}`
推薦碼集合

**Fields:**
```typescript
{
  code: string;                    // 推薦碼（如 GD-A3K7M9）
  userId: string;                  // 推薦人 ID
  prefix: string;                  // 前綴（GD, FB, IG）
  createdAt: string;
  usedCount: number;
  usedBy: string[];                // 使用者 ID 列表
  active: boolean;
}
```

---

## Indexes

### Recommended Indexes

#### `usageAnalytics`
- Collection: `usageAnalytics`
- Fields: `userId` (Ascending), `date` (Descending)
- Use: 快速查詢用戶的使用歷史

#### `promoCodes`
- Collection: `promoCodes`
- Fields: `active` (Ascending), `validUntil` (Descending)
- Use: 查詢有效的促銷碼

---

## Data Migration

### Legacy Plans → New Plans
```typescript
'paid199' → 'advanced_monthly'
'paid499' → 'premium_monthly'
```

**Migration Strategy:** 保持向後兼容，`planUtils.ts` 處理舊格式

---

## Backup Strategy

**Recommendation:**
1. 啟用 Firebase 自動備份
2. 定期匯出重要數據
3. 保留 30 天備份

**Critical Collections:**
- `users` - 每日備份
- `promoCodes` - 每次修改後備份
