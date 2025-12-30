/**
 * 手動整合步驟 - 將 V2 函式加入 index.ts
 * 
 * 由於 index.ts 編碼問題，請按照以下步驟手動整合
 */

## 步驟 1: 在 index.ts 開頭新增 Imports

在第 2 行（`import { callGemini, shouldUseFallback } from "./geminiWrapper";` 之後）添加：

```typescript
import { 
  analyzeSafetyRisk, 
  logSafetyFlag, 
  hasRecentSafetyFlags,
  getTrustModePrompt,
  getEncouragementPrompt 
} from "./safetyHelpers";
import { getCachedSuggestion, setCachedSuggestion } from "./aiSuggestionsCache";
```

---

## 步驟 2: 在 index.ts 末尾新增 Exports

在檔案末尾（最後一個 export 之後）添加：

```typescript
// === AI 優化新函式 (V2) ===
export { generateSafeResponseV2 } from "./generateSafeResponseV2";
export { scheduledWeeklyReportsV2 } from "./scheduledWeeklyReportsV2";
export { scheduledDailySummariesV2 } from "./scheduledDailySummariesV2";
```

---

## 步驟 3: （可選）修改 generateSafeResponse 的 timeout

如果要升級現有函式而非新增 V2，找到約 590 行的 `generateSafeResponse`:

```typescript
export const generateSafeResponse = onCall(
  {
    secrets: ["GEMINI_API_KEY"],
    timeoutSeconds: 60, // 👈 新增這行
  },
  async (request) => {
    // ... 現有代碼
  }
);
```

---

## 步驟 4: 建置測試

```bash
cd functions
npm run build
```

如果有編譯錯誤，請檢查：
- import 路徑是否正確
- 新檔案是否都在 `functions/src/` 目錄
- TypeScript 語法是否正確

---

## 步驟 5: 本地測試

```bash
# 啟動 emulators
firebase emulators:start

# 在另一個終端測試
firebase functions:shell
> generateSafeResponseV2({ data: { userMessage: "測試" }, auth: { uid: "test" } })
```

---

## 快速整合方式（推薦）

如果希望快速替換現有函式，可以用別名 export：

```typescript
// 方式 A: 完全替換（新版覆蓋舊版）
export { generateSafeResponseV2 as generateSafeResponse } from "./generateSafeResponseV2";

// 方式 B: 並行運行（前端可選擇版本）
export { generateSafeResponse }; // 舊版保留
export { generateSafeResponseV2 }; // 新版
```

這樣前端不需修改，直接使用改進後的版本。
