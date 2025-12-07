# Goodi App 定價方案修改指令
## 給 Google AI Studio 的完整 Prompt

---

## 📋 任務概述

請修改 Goodi App 的定價系統，將現有的定價方案（進階 $49/月、高級 $99/月）更新為新的 MVP 版本定價方案（進階 $99/月、高級 $199/月），並添加買斷版本和促銷碼系統。

**項目 URL**：https://idx.google.com/goodi-app-55859871

---

## 🎯 新定價方案

### 月費方案

| 方案 | 舊定價 | 新定價 | 買斷版 | 限制 |
| :--- | :--- | :--- | :--- | :--- |
| **免費版** | NT$0 | NT$0 | - | - |
| **進階版** | NT$49/月 | **NT$99/月** | **NT$1,499** | 1 個孩子 |
| **高級版** | NT$99/月 | **NT$199/月** | **NT$1,999** | 1 個孩子 |

### 買斷版本說明

- **進階版買斷**：NT$1,499（一次性支付，限 1 個孩子）
- **高級版買斷**：NT$1,999（一次性支付，限 1 個孩子）
- 買斷版用戶需要自帶 Gemini API Key（用戶出費用）
- 月費版用戶使用 Goodi 的 Gemini API（Goodi 出費用）

---

## 🔧 需要修改的文件和邏輯

### 1. 修改 `types.ts`

**當前代碼**：
```typescript
export type Plan = 'free' | 'paid199' | 'paid499';
```

**新代碼**：
```typescript
export type Plan = 'free' | 'advanced_monthly' | 'premium_monthly' | 'advanced_lifetime' | 'premium_lifetime';
export type SubscriptionType = 'monthly' | 'lifetime';
export type PricingTier = 'free' | 'advanced' | 'premium';

export interface UserData {
    // ... 現有字段 ...
    plan: Plan;
    subscriptionType?: SubscriptionType;
    pricingTier: PricingTier;
    geminiApiKey?: string; // 買斷版用戶自帶的 API Key
    childrenCount: number; // MVP 階段固定為 1
    maxChildren: number; // MVP 階段固定為 1，未來可擴展
    promoCode?: string; // 使用的促銷碼
    discountPercentage?: number; // 折扣百分比
    originalPrice?: number; // 原始價格
    discountedPrice?: number; // 折扣後價格
}
```

### 2. 修改 `components/PlanSelector.tsx`

**主要改動**：
- 更新定價數字：進階 $99/月、高級 $199/月
- 添加買斷版本的展示（可選：在月費版下方或單獨頁面）
- 更新功能列表（根據下方的功能差異表）
- 添加「選擇訂閱類型」的邏輯（月費 vs 買斷）

**新的 PlanCard 結構**：
```typescript
interface PlanCardProps {
    title: string;
    price: string;
    priceSub?: string;
    features: FeatureItem[];
    plan: Plan;
    currentPlan: Plan;
    onSelectPlan: (plan: Plan) => void;
    highlight: boolean;
    subscriptionType: 'monthly' | 'lifetime'; // 新增
    lifetimePrice?: string; // 新增
}

interface FeatureItem {
    text: string;
    included: boolean;
    highlighted?: boolean;
    apiKeyRequired?: boolean; // 新增：標記需要用戶自帶 API Key
}
```

### 3. 修改 `App.tsx` 中的計畫邏輯

**當前邏輯**：
```typescript
const hasAdvancedAccess = effectivePlan !== 'free';
const hasPremiumAccess = effectivePlan === 'paid499';
```

**新邏輯**：
```typescript
const getPricingTier = (plan: Plan): PricingTier => {
    if (plan.includes('advanced')) return 'advanced';
    if (plan.includes('premium')) return 'premium';
    return 'free';
};

const hasAdvancedAccess = !plan.includes('free');
const hasPremiumAccess = plan.includes('premium');
const isLifetimePlan = plan.includes('lifetime');
const needsGeminiApiKey = isLifetimePlan; // 買斷版需要用戶自帶 API Key

// 檢查 Gemini API 可用性
const hasGeminiAccess = () => {
    if (!hasPremiumAccess) return false; // 進階版不支持 AI 功能
    if (isLifetimePlan) return !!userData.geminiApiKey; // 買斷版需要用戶提供 Key
    return true; // 月費版使用 Goodi 的 Key
};
```

### 4. 新增 `components/SubscriptionTypeSelector.tsx`

在用戶選擇計畫後，顯示「月費 vs 買斷」的選擇：

```typescript
interface SubscriptionTypeSelectorProps {
    plan: PricingTier; // 'advanced' | 'premium'
    monthlyPrice: number;
    lifetimePrice: number;
    onSelect: (type: 'monthly' | 'lifetime') => void;
}

// 顯示邏輯
// 月費版：NT$99/月（進階）或 NT$199/月（高級）
// 買斷版：NT$1,499（進階）或 NT$1,999（高級）
// 包含 Gemini API Key 的說明
```

### 5. 新增 `components/PromoCodeInput.tsx`

添加促銷碼輸入和驗證：

```typescript
interface PromoCodeInputProps {
    onApplyCode: (code: string, discount: PromoCodeDiscount) => void;
    currentPrice: number;
}

interface PromoCodeDiscount {
    code: string;
    discountType: 'percentage' | 'fixed'; // 百分比或固定金額
    discountValue: number;
    validUntil: Date;
    maxUses?: number;
    applicablePlans: PricingTier[]; // 適用的計畫
    description: string;
}
```

### 6. 新增 `services/geminiApiService.ts`

處理 Gemini API Key 的邏輯：

```typescript
interface GeminiApiConfig {
    apiKey: string;
    source: 'goodi' | 'user'; // Goodi 的 Key 或用戶自帶的 Key
    isValid: boolean;
    lastValidated: Date;
}

// 函數
- validateGeminiApiKey(key: string): Promise<boolean>
- getGeminiApiConfig(userId: string): Promise<GeminiApiConfig>
- setUserGeminiApiKey(userId: string, key: string): Promise<void>
- callGeminiApi(config: GeminiApiConfig, prompt: string): Promise<string>
```

---

## 📊 功能差異表

### 免費方案（NT$0）

V 每日任務
V 神秘扭蛋機
V 獎品錢包
V 成績回報功能
X 修改每日任務
X 修改扭蛋機獎品
X 家長管理(基礎)
X 番茄鐘
X 讓孩子自訂學習任務
X 成就徽章
X 樹洞
X 親子時光
X 習慣養成任務
X 成績紀錄功能
X AI 輔助撰寫任務

### 進階方案（NT$99/月 或 NT$1,499 買斷）

V 每日任務
V 神秘扭蛋機
V 獎品錢包
V 成績回報功能
V 修改每日任務
V 修改扭蛋機獎品
V 家長管理(基礎)
V 番茄鐘
X 讓孩子自訂學習任務
X 成就徽章
X 樹洞
X 親子時光
X 習慣養成任務
X 成績紀錄功能
X AI 輔助撰寫任務

### 高級方案（NT$199/月 或 NT$1,999 買斷）

V 每日任務
V 神秘扭蛋機
V 獎品錢包
V 成績回報功能
V 修改每日任務
V 修改扭蛋機獎品
V 家長管理(基礎)
V 番茄鐘
V 讓孩子自訂學習任務 (推薦)
V 成就徽章
V 樹洞 (推薦)
V 親子時光
V 習慣養成任務
V 成績紀錄功能
V AI 輔助撰寫任務 (推薦) (賣斷需自備 API Key)

---

## 🎟️ 促銷碼策略框架

### 促銷碼類型

#### 1. 新用戶促銷碼

**代碼示例**：`WELCOME30`、`WELCOME25`

```typescript
{
    code: 'WELCOME30',
    name: '新用戶歡迎碼',
    discountType: 'percentage',
    discountValue: 30, // 30% 折扣
    validUntil: new Date('2025-12-31'),
    maxUses: 1000,
    applicablePlans: ['advanced', 'premium'],
    subscriptionTypes: ['monthly', 'lifetime'],
    description: '首次購買享 30% 折扣，僅限新用戶'
}
```

**應用場景**：
- 進階版月費：NT$99 × 70% = NT$69
- 進階版買斷：NT$1,499 × 70% = NT$1,049
- 高級版月費：NT$199 × 70% = NT$139
- 高級版買斷：NT$1,999 × 70% = NT$1,399

#### 2. 季節性促銷碼

**代碼示例**：`LUNAR15`（春節）、`SUMMER20`（暑假）、`YEAREND25`（年終）

```typescript
{
    code: 'LUNAR15',
    name: '春節特惠',
    discountType: 'percentage',
    discountValue: 15,
    validUntil: new Date('2026-02-15'),
    maxUses: 5000,
    applicablePlans: ['advanced', 'premium'],
    subscriptionTypes: ['monthly'],
    description: '春節期間，月費版享 15% 折扣'
}
```

#### 3. 推薦獎勵碼

**代碼示例**：`REFER10`

```typescript
{
    code: 'REFER10',
    name: '推薦朋友獎勵',
    discountType: 'percentage',
    discountValue: 10,
    validUntil: new Date('2026-12-31'),
    maxUses: null, // 無限制
    applicablePlans: ['advanced', 'premium'],
    subscriptionTypes: ['monthly', 'lifetime'],
    description: '推薦朋友成功訂閱，雙方各享 10% 折扣'
}
```

#### 4. 教育工作者折扣

**代碼示例**：`EDUCATOR15`

```typescript
{
    code: 'EDUCATOR15',
    name: '教育工作者折扣',
    discountType: 'percentage',
    discountValue: 15,
    validUntil: new Date('2026-12-31'),
    maxUses: null,
    applicablePlans: ['advanced', 'premium'],
    subscriptionTypes: ['monthly', 'lifetime'],
    description: '教育工作者專享 15% 折扣（需驗證身份）'
}
```

#### 5. 年度訂閱折扣

**代碼示例**：`ANNUAL15`

```typescript
{
    code: 'ANNUAL15',
    name: '年度訂閱折扣',
    discountType: 'percentage',
    discountValue: 15,
    validUntil: new Date('2026-12-31'),
    maxUses: null,
    applicablePlans: ['advanced', 'premium'],
    subscriptionTypes: ['monthly'],
    description: '年度訂閱享 15% 折扣'
}
```

### 促銷碼驗證邏輯

```typescript
interface PromoCodeValidation {
    isValid: boolean;
    reason?: string; // 無效的原因
    discount?: {
        originalPrice: number;
        discountAmount: number;
        finalPrice: number;
        discountPercentage: number;
    };
}

async function validatePromoCode(
    code: string,
    plan: PricingTier,
    subscriptionType: SubscriptionType,
    userId: string
): Promise<PromoCodeValidation> {
    // 1. 檢查促銷碼是否存在
    // 2. 檢查是否過期
    // 3. 檢查是否超過使用次數限制
    // 4. 檢查是否適用於該計畫
    // 5. 檢查用戶是否已使用過該促銷碼（如果有限制）
    // 6. 計算折扣金額
    // 7. 返回驗證結果
}
```

### 促銷碼存儲

在 Firebase Firestore 中創建 `promoCodes` 集合：

```
promoCodes/
├─ WELCOME30/
│   ├─ code: 'WELCOME30'
│   ├─ name: '新用戶歡迎碼'
│   ├─ discountType: 'percentage'
│   ├─ discountValue: 30
│   ├─ validUntil: timestamp
│   ├─ maxUses: 1000
│   ├─ currentUses: 150
│   ├─ applicablePlans: ['advanced', 'premium']
│   ├─ subscriptionTypes: ['monthly', 'lifetime']
│   └─ createdAt: timestamp
│
├─ LUNAR15/
│   └─ ...
│
└─ ...
```

---

## 🔐 Gemini API Key 處理

### 月費版（Goodi 出費用）

- 使用 Goodi 的 Gemini API Key
- 存儲在環境變量中：`VITE_GEMINI_API_KEY`
- 用戶無需配置

### 買斷版（用戶出費用）

- 用戶需要提供自己的 Gemini API Key
- 在設置頁面添加「API Key 管理」部分
- 驗證 API Key 的有效性
- 存儲在 Firebase 中（加密）

**UI 流程**：
```
用戶選擇買斷版
  ↓
提示「需要 Gemini API Key」
  ↓
引導用戶到 Google AI Studio 獲取 Key
  ↓
在設置頁面輸入 API Key
  ↓
驗證 API Key
  ↓
保存並啟用 AI 功能
```

---

## 📝 實施檢查清單

### Phase 1：數據模型和類型定義
- [x] 更新 `types.ts` 中的 `Plan` 類型
- [x] 添加 `SubscriptionType`、`PricingTier` 類型
- [x] 在 `UserData` 中添加新字段

### Phase 2：UI 組件修改
- [x] 修改 `PlanSelector.tsx` 中的定價數字
- [x] 更新功能列表
- [ ] 新增 `SubscriptionTypeSelector.tsx`
- [ ] 新增 `PromoCodeInput.tsx`

### Phase 3：業務邏輯
- [ ] 修改 `App.tsx` 中的計畫邏輯
- [ ] 新增 `geminiApiService.ts`
- [ ] 新增 `promoCodeService.ts`
- [ ] 新增 Gemini API Key 驗證邏輯

### Phase 4：Firebase 集成
- [ ] 創建 `promoCodes` 集合
- [ ] 創建促銷碼驗證 Cloud Function
- [ ] 添加 API Key 加密存儲邏輯

### Phase 5：測試和部署
- [ ] 測試所有計畫的購買流程
- [ ] 測試促銷碼應用
- [ ] 測試 Gemini API Key 驗證
- [ ] 部署到生產環境

---

## 🎨 UI 改動預覽

### 定價頁面（新版）

```
┌─────────────────────────────────────────────┐
│           升級方案                           │
├─────────────────────────────────────────────┤
│  [月費版] [買斷版]  ← 新增選擇卡             │
├─────────────────────────────────────────────┤
│
│  月費版：
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  │ 免費方案     │  │ 進階方案     │  │ 高級方案 ⭐  │
│  │ NT$0         │  │ NT$99/月     │  │ NT$199/月    │
│  │              │  │ NT$1,499/買斷│  │ NT$1,999/買斷│
│  │ [功能列表]   │  │ [功能列表]   │  │ [功能列表]   │
│  │              │  │ [選擇方案]   │  │ [選擇方案]   │
│  └──────────────┘  └──────────────┘  └──────────────┘
│
│  買斷版：
│  ┌──────────────┐  ┌──────────────┐
│  │ 進階版買斷   │  │ 高級版買斷   │
│  │ NT$1,499     │  │ NT$1,999     │
│  │ 限 1 個孩子  │  │ 限 1 個孩子  │
│  │ 需自帶 API Key│ │ 需自帶 API Key│
│  │ [功能列表]   │  │ [功能列表]   │
│  │ [選擇方案]   │  │ [選擇方案]   │
│  └──────────────┘  └──────────────┘
│
│  ┌─────────────────────────────────┐
│  │ 有促銷碼？ [輸入促銷碼]          │
│  │ 折扣：-NT$30（-30%）            │
│  │ 最終價格：NT$69                 │
│  └─────────────────────────────────┘
└─────────────────────────────────────────────┘
```

### 設置頁面（新增 API Key 管理）

```
┌─────────────────────────────────────────────┐
│           設置                               │
├─────────────────────────────────────────────┤
│ 訂閱方案：高級版買斷                         │
│ 購買日期：2025-12-03                        │
│ 剩餘天數：365 天                            │
│
│ [Gemini API Key 管理]
│ ┌─────────────────────────────────┐
│ │ API Key 狀態：✅ 已驗證          │
│ │ [更換 API Key]                  │
│ │ [查看使用量]                    │
│ └─────────────────────────────────┘
└─────────────────────────────────────────────┘
```

---

## 📞 支持和文檔

- **Gemini API 文檔**：https://ai.google.dev/
- **Firebase 文檔**：https://firebase.google.com/docs
- **促銷碼最佳實踐**：參考 Stripe、Shopify 的實現

---

## ✅ 完成標準

1. ✅ 所有定價數字已更新（進階 $99、高級 $199）
2. ✅ 買斷版本已實現（$1,499、$1,999）
3. ✅ 功能差異表已正確應用
4. ✅ Gemini API Key 邏輯已實現
5. ✅ 促銷碼系統已集成
6. ✅ 所有購買流程已測試
7. ✅ UI/UX 符合設計規範
8. ✅ 代碼已部署到生產環境

---

## 📧 聯繫方式

如有任何問題或需要澄清，請隨時提問。
