# Premium 升級功能實作說明

## ✅ 已完成的組件

### 1. HighlightCard 組件
**路徑**: `Goodi-App/components/HighlightCard.tsx`

**功能**:
- 可重複使用的亮點視覺卡組件
- 支援 Free/Premium 兩種顯示模式
- 包含微指標（勇氣、專注、自律）
- 收藏/分享按鈕（Premium 用戶）
- 模糊預覽 + 升級 CTA（Free 用戶）

**Props**:
```typescript
interface HighlightCardProps {
  data: HighlightData;          // 卡片數據（日期、行為、意義、進步）
  isPremium: boolean;           // 是否為 Premium 用戶
  onSave?: () => void;          // 收藏回調
  onShare?: () => void;         // 分享回調
  showMissedMessage?: boolean;  // 是否顯示「而你沒看到」
}
```

**Mock 或 Real**:
- ✅ 可接真實數據（`HighlightData` interface）
- ⚠️ 目前 mock：升級觸發使用 CustomEvent（需整合到父組件）

---

### 2. PremiumUpgradePage 組件
**路徑**: `Goodi-App/pages/PremiumUpgradePage.tsx`

**功能**:
- Premium 升級主頁面
- 顯示「你不在的那些瞬間」核心文案
- 今日亮點卡預覽（模糊）
- 三大核心價值說明
- 定價方案選擇（月/年/終身）
- 情感化 CTA：「替孩子把這一刻留下來」

**Routes**:
- 路徑: `/premium`
- 需要登入（已包裹在 ProtectedRoute 中）

**Mock 或 Real**:
- ⚠️ Mock：mockHighlight（模擬今天的亮點）
- ✅ 可接真實：`onUpgrade` 回調函數
- ⚠️ Mock：「過去 7 天錯過 11 個瞬間」的數字

**接入真實數據時需要**:
```typescript
// 從後端獲取今日亮點
const todayHighlight = await fetchTodayHighlight(userId);

// 從後端獲取錯過的瞬間數量
const missedCount = await fetchMissedMomentsCount(userId, 7);
```

---

### 3. PremiumUpgradeFlow 組件
**路徑**: `Goodi-App/pages/PremiumUpgradeFlow.tsx`

**功能**:
- 三段式升級流程
  - Step 1 (震盪): 顯示錯過的瞬間
  - Step 2 (共鳴): 同理心 + Premium 價值
  - Step 3 (承諾): 選擇方案 + 確認

**Routes**:
- 路徑: `/premium/upgrade-flow`
- 需要登入（已包裹在 ProtectedRoute 中）

**狀態管理**:
- 使用 React local state 管理 3 個步驟切換
- 支援前後返回導航

**Mock 或 Real**:
- ⚠️ Mock：missedMoments（過去錯過的 3 個對話）
- ✅ 可接真實：`onComplete` 回調函數
- ⚠️ Mock：目前點擊「確認」只是 console.log

**接入真實數據時需要**:
```typescript
// 從後端獲取過去錯過的對話
const missedMoments = await fetchMissedConversations(userId, 3);

// 處理支付
const handleConfirm = async () => {
  await processPayment(userId, selectedPlan);
  await updateUserPlan(userId, selectedPlan);
  navigate('/');
};
```

---

## 🛣️ Route 結構

已在 `App.tsx` 中加入以下路由：

```typescript
/premium                  → PremiumUpgradePage
/premium/upgrade-flow     → PremiumUpgradeFlow（全屏 modal 式流程）
```

**導航方式**:
```typescript
// 從任何頁面導航到升級頁
navigate('/premium');

// 導航到三段式流程
navigate('/premium/upgrade-flow', { 
  state: { selectedPlan: 'yearly' } 
});

// 從 PremiumUpgradePage 點擊「替孩子把這一刻留下來」
// → 內部會導航到 /premium/upgrade-flow
```

---

## 🔌 接入真實數據的指南

### 需要的後端 API

#### 1. 獲取今日亮點
```typescript
GET /api/highlights/today
Response: {
  date: string;
  action: string;
  meaning: string;
  improvement: string;
  category: 'learning' | 'habit' | 'emotion' | 'social';
  metrics?: {
    courage?: number;
    focus?: number;
    discipline?: number;
  }
}
```

#### 2. 獲取錯過的瞬間
```typescript
GET /api/highlights/missed?days=7
Response: {
  count: number;
  moments: Array<{
    date: string;
    text: string;
  }>
}
```

#### 3. 處理升級
```typescript
POST /api/upgrade
Body: {
  plan: 'monthly' | 'yearly' | 'lifetime'
}
```

### 整合示例

**在 PremiumUpgradePage.tsx 中**:
```typescript
// 替換 mock 數據
useEffect(() => {
  const fetchData = async () => {
    const highlight = await fetch('/api/highlights/today').then(r => r.json());
    const missed = await fetch('/api/highlights/missed?days=7').then(r => r.json());
    
    setMockHighlight(highlight);
    setMissedCount(missed.count);
  };
  fetchData();
}, []);
```

**在 PremiumUpgradeFlow.tsx 中**:
```typescript
// 替換 mock 對話
useEffect(() => {
  const fetchMissed = async () => {
    const { moments } = await fetch('/api/highlights/missed?days=7').then(r => r.json());
    setMissedMoments(moments.slice(0, 3));
  };
  fetchMissed();
}, []);

// 實作真實支付
const handleConfirm = async () => {
  try {
    await fetch('/api/upgrade', {
      method: 'POST',
      body: JSON.stringify({ plan: selectedPlan })
    });
    navigate('/');
  } catch (error) {
    console.error('Upgrade failed:', error);
  }
};
```

---

## 🎨 樣式說明

使用 **Tailwind CSS** classes，配色方案：

| 用途 | 顏色 | Tailwind Class |
|------|------|---------------|
| 主要背景 | 奶油色 | `bg-cream-50` |
| 成長綠 | 柔和綠 | `bg-green-500`, `text-green-600` |
| 強調橘 | 溫暖橘 | `bg-orange-500`, `text-orange-600` |
| 卡片背景 | 根據類別 | `bg-blue-50`, `bg-orange-50`, `bg-green-50`, `bg-purple-50` |

**響應式設計**: 已支援 mobile-first 設計

---

## 🚀 測試方式

### 開發環境測試

1. 啟動開發伺服器
```bash
npm run dev
```

2. 訪問頁面
- Premium 升級頁: `http://localhost:3000/premium`
- 三段式流程: `http://localhost:3000/premium/upgrade-flow`

3. 測試流程
- ✅ Free 用戶看到模糊預覽
- ✅ 點擊「替孩子把這一刻留下來」
- ✅ 三段式流程可前後導航
- ✅ 選擇方案並確認

### 需要整合的測試

- [ ] 連接真實的 highlight 數據
- [ ] 連接真實的 missed moments 數據
- [ ] 整合支付流程（Stripe/綠界等）
- [ ] 整合 UserContext 的 plan 狀態更新

---

## 📋 後續 TODO

### 短期（功能完整）
- [ ] 整合 UserContext，讀取真實的 `userData.plan`
- [ ] 連接後端 API 獲取 highlight 數據
- [ ] 實作真實的支付流程
- [ ] 在其他頁面加入「升級 CTA」（例如 HomePage、TasksPage）

### 中期（體驗優化）
- [ ] 加入 loading 狀態
- [ ] 加入錯誤處理
- [ ] 加入 A/B 測試框架（測試不同文案）
- [ ] 加入 analytics tracking（升級漏斗）

### 長期（數據驅動）
- [ ] 建立 Dashboard 監控轉化率
- [ ] 根據用戶行為智能觸發升級提示
- [ ] 個人化文案（根據孩子實際數據）

---

## 💬 關鍵決策點

### 為什麼使用 3 個分離的組件？

1. **HighlightCard**: 可重複使用，未來可在多處顯示（首頁、儀表板、歷史記錄）
2. **PremiumUpgradePage**: 主要升級入口，可從導航列直接訪問
3. **PremiumUpgradeFlow**: 獨立的全屏流程，可從多處觸發（卡片、推播、儀表板）

### 為什麼不直接整合支付？

- 目前專注在「情感觸發」和「UI 流程」
- 支付邏輯依賴具體的金流服務（Stripe/綠界/藍新）
- 留下清晰的 `onUpgrade` 和 `onComplete` 接口，方便後續整合

---

## 🎯 核心價值回顧

這三個組件實現了：

1. **情感價值** — 「替孩子把這一刻留下來」
2. **視覺證據** — 亮點視覺卡可收藏、可分享
3. **三段式轉化** — 震盪 → 共鳴 → 承諾

**不是賣功能，是賣救贖。**

---

*實作完成日期: 2025-12-21*
*下一步: 整合真實數據並測試完整流程*
