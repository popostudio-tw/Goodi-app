# Pricing System API Documentation

## Services

### `promoCodeService.ts`

#### `validatePromoCode(code, plan, subscriptionType, userId, currentPrice): Promise<PromoCodeValidation>`
驗證促銷碼並計算折扣。

**Parameters:**
- `code: string` - 促銷碼
- `plan: PricingTier` - 用戶選擇的方案
- `subscriptionType: SubscriptionType` - 訂閱類型（monthly/lifetime）
- `userId: string` - 用戶 ID
- `currentPrice: number` - 原價

**Returns:** `PromoCodeValidation`
- `isValid: boolean` - 是否有效
- `reason?: string` - 無效原因
- `discount?: object` - 折扣詳情

**Available Promo Codes:**
- `WELCOME30` - 新用戶 30% 折扣
- `LUNAR15` - 春節 15% 折扣
- `SUMMER20` - 暑假 20% 折扣
- `EDUCATOR15` - 教育工作者 15% 折扣

---

### `geminiApiService.ts`

#### `validateGeminiApiKey(key: string): Promise<boolean>`
驗證 Gemini API Key 是否有效。

**Parameters:**
- `key: string` - Gemini API Key

**Returns:** `Promise<boolean>` - API Key 是否有效

**Note:** 會進行實際 API 調用測試

---

#### `getGeminiApiConfig(userData: UserData): Promise<GeminiApiConfig | null>`
獲取 Gemini API 配置。

**Parameters:**
- `userData: UserData` - 用戶數據

**Returns:** `GeminiApiConfig | null`
- 買斷版：使用用戶提供的 API Key
- 月費版：使用 Goodi 的 API Key

---

### `analyticsService.ts`

#### `trackTaskCompletion(): void`
追蹤任務完成。

#### `trackFocusSession(minutes: number): void`
追蹤專注時間。

**Parameters:**
- `minutes: number` - 專注分鐘數

#### `trackAIQuery(): void`
追蹤 AI 查詢次數。

#### `saveDailyAnalytics(userId: string, plan: Plan): Promise<void>`
保存每日分析數據到 Firestore。

**Parameters:**
- `userId: string` - 用戶 ID
- `plan: Plan` - 用戶方案

**Note:** 自動重置每日指標

**Privacy:** 數據僅用於產品改進，符合隱私規範

---

## Utils

### `planUtils.ts`

#### `getPricingTier(plan: Plan): PricingTier`
從 Plan 提取定價層級。

**Parameters:**
- `plan: Plan` - 用戶方案

**Returns:** `'free' | 'advanced' | 'premium'`

---

#### `hasPremiumAccess(plan: Plan): boolean`
檢查用戶是否有高級功能存取權限。

**Parameters:**
- `plan: Plan` - 用戶方案

**Returns:** `boolean`

---

#### `needsGeminiApiKey(plan: Plan): boolean`
檢查用戶是否需要提供自己的 API Key（買斷版高級用戶）。

**Parameters:**
- `plan: Plan` - 用戶方案

**Returns:** `boolean`

---

#### `hasGeminiAccess(userData: UserData): boolean`
檢查用戶是否可使用 Gemini AI 功能。

**Parameters:**
- `userData: UserData` - 用戶數據

**Returns:** `boolean`
- 月費高級版：總是 true
- 買斷高級版：需提供有效 API Key

---

## Data Structures

### Firestore Collections

#### `users/{userId}`
用戶主數據，包含：
- `plan: Plan` - 用戶方案
- `geminiApiKey?: string` - API Key（買斷版）
- `subscriptionStatus?: string` - 訂閱狀態
- `subscriptionEndDate?: string` - 訂閱結束日期
- `autoRenew?: boolean` - 是否自動續訂

**Security:** 僅用戶本人可讀寫

---

#### `promoCodes/{code}`
促銷碼數據：
- `code: string` - 促銷碼
- `discountType: 'percentage' | 'fixed'`
- `discountValue: number`
- `validUntil: Date`
- `applicablePlans: PricingTier[]`

**Security:** 用戶可讀，管理員可寫

---

#### `usageAnalytics/{userId}_{date}`
使用分析數據：
- `userId: string`
- `date: string` - YYYY-MM-DD
- `metrics: object` - 使用指標
- `plan: Plan`

**Security:** 僅用戶本人可讀寫

---

## Security & Privacy

### API Key Protection
- ✅ 實際驗證 API Key
- ✅ 日誌不含敏感信息
- ✅ Security Rules 限制存取
- ✅ Firebase at-rest encryption

### Analytics Privacy
- ✅ 僅用於產品改進
- ✅ 不含個人識別信息
- ✅ 用戶可讀寫自己的數據
- ✅ 符合 GDPR 規範

### Subscription Compliance
- ✅ 清晰的訂閱狀態顯示
- ✅ 到期提醒機制
- ✅ 符合 App Store / Google Play 規範
