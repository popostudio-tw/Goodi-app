---
description: App Store Review Simulation - 模擬 Apple 審核流程
---

# App Store Review Simulation

此工作流程模擬 Apple App Store 的審核流程，檢查常見的拒絕原因。

## 1. 隱私權政策檢查

### 1.1 檢查隱私權政策是否存在且完整
- ✅ 檔案位置: `Goodi-App/public/privacy.html`
- ✅ 包含公司聯絡資訊
- ✅ 說明數據收集用途
- ✅ 包含兒童隱私保護說明
- ✅ 包含帳號刪除說明

## 2. IAP (In-App Purchase) 合規性

### 2.1 檢查是否移除所有第三方支付 SDK
```powershell
# 檢查 package.json 中是否有 PayPal 相關依賴
Get-Content "Goodi-App/package.json" | Select-String -Pattern "paypal|stripe|square" -CaseSensitive:$false
```

### 2.2 檢查原始碼中是否有 PayPal 殘留
```powershell
# 搜尋所有 TypeScript/JavaScript 檔案
Get-ChildItem -Path "Goodi-App" -Recurse -Include *.ts,*.tsx,*.js,*.jsx | Select-String -Pattern "paypal" -CaseSensitive:$false
```

### 2.3 檢查 Cloud Functions 中是否有第三方支付
```powershell
Get-ChildItem -Path "functions" -Recurse -Include *.ts,*.js | Select-String -Pattern "paypal|stripe" -CaseSensitive:$false
```

## 3. 帳號刪除功能

### 3.1 確認 UI 存在
- ✅ 檢查 `SettingsPage.tsx` 是否有刪除帳號按鈕
- ✅ 確認有二次確認機制

### 3.2 確認後端功能
```powershell
# 檢查是否有 deleteAccount Cloud Function
Get-Content "functions/src/index.ts" | Select-String -Pattern "deleteAccount|deleteUser" -CaseSensitive:$false
```

## 4. Crashlytics & 錯誤處理

### 4.1 檢查是否整合 Firebase Crashlytics
```powershell
Get-Content "Goodi-App/package.json" | Select-String -Pattern "crashlytics|@firebase"
```

### 4.2 檢查關鍵 API 呼叫的錯誤處理
- 檢查 `fetchDailyContent` 是否有 fallback 機制
- 檢查 Gemini API 呼叫是否有 try-catch

## 5. 內容審查

### 5.1 檢查是否有適齡內容
- ✅ AI 生成內容是否適合 5-12 歲兒童
- ✅ 是否有內容過濾機制

### 5.2 檢查是否有違規關鍵字
```powershell
# 檢查是否有賭博、暴力等違規內容
Get-ChildItem -Path "Goodi-App" -Recurse -Include *.ts,*.tsx | Select-String -Pattern "賭博|暴力|色情" -CaseSensitive:$false
```

## 6. 權限說明

### 6.1 檢查是否說明所需權限
- ✅ 網路權限 (Firebase, Gemini API)
- ✅ 本地儲存權限

## 7. 測試基本功能

### 7.1 啟動開發伺服器
```powershell
cd Goodi-App
npm run dev
```

### 7.2 測試關鍵流程
- [ ] Google 登入
- [ ] 免費用戶可以使用基本功能
- [ ] 付費功能有明確標示
- [ ] 帳號刪除流程完整
- [ ] 隱私權政策可訪問

## 8. 安全性檢查

### 8.1 檢查是否有 API Key 外露
```powershell
# 檢查前端程式碼是否有 hardcoded secrets
Get-ChildItem -Path "Goodi-App/src" -Recurse -Include *.ts,*.tsx | Select-String -Pattern "AIza[0-9A-Za-z-_]{35}|sk-[a-zA-Z0-9]{20,}" -CaseSensitive:$false
```

### 8.2 檢查 .gitignore
```powershell
Get-Content ".gitignore" | Select-String -Pattern "\.env|secrets|api.*key" -CaseSensitive:$false
```

## 9. 建置檢查

### 9.1 確認可以成功建置
```powershell
cd Goodi-App
npm run build
```

## 10. 文件完整性

### 10.1 檢查 README.md
- ✅ 專案說明
- ✅ 安裝指南
- ✅ 部署流程

## 審核報告

執行完成後，將結果整理成報告：
- ✅ Pass - 通過檢查
- ⚠️ Warning - 有潛在問題但不致命
- ❌ Fail - 需要立即修正

