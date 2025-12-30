/**
 * Integration Guide - AI Architecture Optimization
 * 
 * 將新功能整合到現有 codebase 的步驟指南
 */

# AI 架構優化整合指南

## 一、Backend Functions 整合

### 1. 更新 index.ts

在 `functions/src/index.ts` 添加新函式的 export：

```typescript
// === 新增 Imports ===
import { generateSafeResponseV2 } from "./generateSafeResponseV2";
import { scheduledWeeklyReportsV2 } from "./scheduledWeeklyReportsV2";
import { scheduledDailySummariesV2 } from "./scheduledDailySummariesV2";

// === 新增 Exports (檔案末尾) ===
export { generateSafe ResponseV2 };
export { scheduledWeeklyReportsV2 };
export { scheduledDailySummariesV2 };
```

### 2. 選項：替換現有函式 (推薦)

如果要完全替換舊函式，可以：

```typescript
// 方式A：直接重命名 V2 為原名
export { generateSafeResponseV2 as generateSafeResponse };

// 方式B：保留兩者，讓前端逐步遷移
export { generateSafeResponse }; // 舊版
export { generateSafeResponseV2 }; // 新版
```

### 3. 部署 Cloud Functions

```bash
cd functions
npm run build
firebase deploy --only functions
```

---

## 二、Firestore Rules 更新

在 `firestore.rules` 的 `match /users/{userId}` 區塊內添加：

```javascript
// === 新增集合規則 ===

// 1. 昨日總結 - 僅用戶本人可讀，Cloud Function 可寫
match /dailySummaries/{date} {
  allow read: if request.auth.uid == userId;
  allow write: if false; // 僅 Cloud Function
}

// 2. 安全標記 - 用戶本人與家長可讀，Cloud Function 可寫
match /safetyFlags/{flagId} {
  allow read: if request.auth.uid == userId || 
                 (exists(/databases/$(database)/documents/users/$(userId)) &&
                  request.auth.uid in get(/databases/$(database)/documents/users/$(userId))data.parentIds);
  allow write: if false; // 僅 Cloud Function
}
```

在全局層級 (users 外) 添加：

```javascript
// 3. AI 建議快取 - 全局讀取，Cloud Function 可寫
match /aiSuggestionsCache/{cacheKey} {
  allow read: if true;
  allow write: if false;
}
```

部署規則：

```bash
firebase deploy --only firestore:rules
```

---

## 三、Frontend 修改

### 1. HomeComponent - 昨日總結秒開

參考 `HomeComponent-YesterdaySummary-Guide.tsx` 進行修改：

**關鍵步驟：**
1. 使用 `useYesterdaySummary()` hook
2. 移除舊的 `callAiFunction('generateYesterdaySummary')` 調用
3. 改用 Firestore onSnapshot 即時監聽

**好處：**
- ✅ 秒開（< 1秒）
- ✅ 即時更新
- ✅ 降低 API 成本

### 2. 心事樹洞 - 調用新函式

如果前端需要調用新版本：

```typescript
// 舊版
const result = await callAiFunction('generateSafeResponse', { userMessage });

// 新版 (如果使用 V2 名稱)
const result = await callAiFunction('generateSafeResponseV2', { userMessage });

// 回傳格式：
{
  response: string,
  needsAttention: boolean,
  riskLevel: 'none' | 'low' | 'medium' | 'high',
  trustModeTriggered: boolean
}
```

---

## 四、Testing 步驟

### 1. 本地測試

```bash
# 啟動 Emulators
firebase emulators:start

# 測試心事樹洞
curl -X POST http://localhost:5001/goodi-app/us-central1/generateSafeResponseV2 \
  -H "Content-Type: application/json" \
  -d '{"data":{"userMessage":"我今天有點難過"}}'

# 測試手動觸發週報
firebase functions:shell
> scheduledWeeklyReportsV2()

# 測試手動觸發昨日總結
> scheduledDailySummariesV2()
```

### 2. 驗證 Firestore 資料

檢查以下集合是否正確創建：

- `users/{userId}/dailySummaries/{date}`
- `users/{userId}/weeklyReports/{weekKey}`
- `users/{userId}/safetyFlags/{flagId}`
- `aiSuggestionsCache/{cacheKey}`

### 3. Frontend 測試

1. **昨日總結**：進入首頁，確認總結立即顯示（< 1秒）
2. **心事樹洞**：輸入包含負面情緒的訊息，檢查 `safetyFlags` 是否記錄
3. **週報**：手動觸發後，檢查 `weeklyReports` 集合的 JSON 格式

---

## 五、快取整合 (可選)

若要在任務建議中使用快取：

```typescript
import { getCachedSuggestion, setCachedSuggestion } from './aiSuggestionsCache';

async function generateTaskSuggestions(age: number, goal: string) {
  // 1. 先檢查快取
  const cached = await getCachedSuggestion(age, goal);
  if (cached) {
    console.log('[Cache] Hit');
    return { suggestions: cached, fromCache: true };
  }

  // 2. 無快取，調用 AI
  const result = await callGemini({...});
  const suggestions = parseSuggestions(result.text);

  // 3. 存入快取
  await setCachedSuggestion(age, goal, suggestions);

  return { suggestions, fromCache: false };
}
```

---

## 六、Monitoring & Alerts

建議設置以下監控：

1. **Cloud Monitoring**：
   - 監控 `scheduledWeeklyReportsV2` 和 `scheduledDailySummariesV2` 執行狀態
   - 設置失敗告警

2. **Firestore Usage**：
   - 監控 `dailySummaries` 集合的寫入量
   - 確認每日生成數量正常

3. **Logs**：
```bash
# 查看 Cloud Functions logs
firebase functions:log --only scheduledDailySummariesV2
firebase functions:log --only generateSafeResponseV2
```

---

## 七、回滾計劃

如果新版本出現問題：

1. **立即回滾到舊函式**：
   ```bash
   # 使用舊版本
   git revert <commit-hash>
   firebase deploy --only functions
   ```

2. **修復 Firestore 資料**：
   - 檢查是否有錯誤資料寫入
   - 清理測試資料

3. **通知用戶**：
   - 若有資料遺失，手動觸發生成

---

## 八、效能目標

| 功能 | 目標延遲 | 成功率 |
|------|---------|--------|
| 昨日總結載入 | < 1秒 | > 99% |
| 心事樹洞回覆 | < 15秒 | > 95% |
| 週報生成 | < 5分鐘/用戶 | > 98% |
| 快取命中率 | > 60% | - |

---

## 九、完成檢查清單

- [ ] `index.ts` 新增 exports
- [ ] `firestore.rules` 更新完成
- [ ] Cloud Functions 部署成功
- [ ] Firestore Rules 部署成功
- [ ] HomeComponent 修改並測試
- [ ] 心事樹洞測試通過
- [ ] 手動觸發週報測試
- [ ] 手動觸發昨日總結測試
- [ ] Monitoring 設置完成
- [ ] 文檔更新完成

---

**如有問題，請檢查：**
1. Cloud Functions logs: `firebase functions:log`
2. Firestore security rules: Firebase Console → Firestore → Rules
3. Frontend console errors: Browser DevTools
