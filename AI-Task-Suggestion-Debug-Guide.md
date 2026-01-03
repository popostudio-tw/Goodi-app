# AI 任務建議功能代碼分析 - For Jules

## 問題位置

**文件**: [`ParentModePage.tsx`](file:///c:/Users/88695/Goodi-app/Goodi-App/pages/ParentModePage.tsx)

**錯誤訊息**: "發生錯誤，請稍後再試"

**涉及組件**: `AISuggestedTasksModal` (Lines 150-224 附近)

---

## 關鍵代碼片段

### 1. Modal 入口 (Line 257)
```typescript
<Modal onClose={onClose} title={`AI 任務建議 (${userAge}歲)`} maxWidth="max-w-2xl">
```

### 2. 錯誤顯示 (Line 261)
```typescript
{error && <div className="text-center p-8 text-red-500">{error}</div>}
```

### 3. fetchSuggestions 函式 (Lines 150-224)

這個函式負責調用 AI 生成任務建議。關鍵流程：

```typescript
const fetchSuggestions = async () => {
  try {
    // 1. 檢查快取
    const cachedTemplates = await getTemplates(userAge);
    
    // 2. 如果有快取且在 7 天內，直接使用
    if (cachedTemplates.length > 0) {
      const latestTemplate = cachedTemplates[0];
      const cacheAge = Date.now() - latestTemplate.createdAt;
      if (cacheAge < 7 * 24 * 60 * 60 * 1000) {
        setSuggestedTasks(latestTemplate.suggestions);
        return;
      }
    }
    
    // 3. 沒有快取或過期，調用 AI
    const result = await ai.generateTaskSuggestions(userAge, existingTasks);
    
    // 4. 儲存結果
    setSuggestedTasks(result.tasks);
    
    // 5. 儲存到範本庫供未來使用
    await addTemplate(ageMin, ageMax, '責任感', tasks);
    
  } catch (err: any) {
    console.error("AI suggestion error:", err);
    setError(err.message || "無法獲取 AI 建議，請稍後再試。");
  }
};
```

---

## 問題診斷

### 可能原因 1: `ai.generateTaskSuggestions` 函式不存在或失敗

**檢查點**:
- 這個函式定義在哪裡？（可能在 `UserContext.tsx` 或 `aiClient.ts`）
- 它調用哪個 Cloud Function？
- 該 Cloud Function 是否已部署？

### 可能原因 2: Cloud Function 調用失敗

**檢查**:
```typescript
// 在 apiClient.ts 中，錯誤會被映射到通用訊息
getFriendlyMessage(type) {
  switch (type) {
    ...
    default:
      return '發生錯誤，請稍後再試';  // ← 這裡！
  }
}
```

**可能的錯誤類型**:
- `unknown` - 未知錯誤
- API 調用異常
- 網路問題

### 可能原因 3: V2 函式未部署

根據之前的分析，`index.ts` 已經正確匯出所有 V2 函式，但需要確認：
- `generateGeminiContent` 是否正常運作
- 是否有特定的任務生成函式

---

## 下一步調查

### Step 1: 找到 `ai.generateTaskSuggestions` 的定義

**搜尋位置**:
```typescript
// 可能在 UserContext.tsx
grep "generateTaskSuggestions" UserContext.tsx

// 或在 aiClient.ts
grep "generateTaskSuggestions" src/services/aiClient.ts
```

### Step 2: 確認調用的 Cloud Function

**可能的函式名稱**:
- `generateGeminiContent` (通用 AI 生成)
- `generateTaskSuggestions` (專用任務生成)
- 其他自訂函式

### Step 3: 檢查 Firebase Functions Logs

**查看**:
- 最近的 `generateGeminiContent` 調用記錄
- 錯誤訊息
- 堆疊追蹤

### Step 4: 檢查前端 Console

**用戶應該看到**:
```
console.error("AI suggestion error:", err);
```

**查看**:
- `err.message` 的具體內容
- 完整的錯誤物件

---

## 如何導航到這個畫面

1. 打開應用程式：https://goodi-5ec49.web.app
2. 進入**家長模式** (輸入 PIN 碼)
3. 點擊**「任務」**標籤
4. 在任務管理區，點擊 **「AI 任務建議」按鈕**
5. Modal 彈出，標題顯示 `AI 任務建議 (X歲)`

---

## 建議修復方案

### 臨時方案：增強錯誤日誌

```typescript
} catch (err: any) {
  console.error("AI suggestion error:", err);
  console.error("Error details:", {
    message: err.message,
    stack: err.stack,
    response: err.response
  });
  setError(err.message || "無法獲取 AI 建議，請稍後再試。");
}
```

### 長期方案：處理不同錯誤類型

```typescript
} catch (err: any) {
  console.error("AI suggestion error:", err);
  
  let errorMessage = "無法獲取 AI 建議，請稍後再試。";
  
  if (err.code === 'unauthenticated') {
    errorMessage = "請重新登入後再試";
  } else if (err.message?.includes('quota')) {
    errorMessage = "AI 配額已用完，請明天再試";
  } else if (err.message) {
    errorMessage = err.message;
  }
  
  setError(errorMessage);
}
```

---

## 需要的資訊

為了進一步診斷，Jules 需要：

1. **`ai.generateTaskSuggestions` 的定義位置**
2. **該函式調用的 Cloud Function 名稱**
3. **Firebase Functions 的最近錯誤日誌**
4. **前端 Console 的完整錯誤訊息**

我可以幫忙搜尋這些資訊。
