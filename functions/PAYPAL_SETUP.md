# PayPal 環境變數設置指南

## Firebase Functions Config (生產環境)

```bash
# 設置 PayPal Live Credentials
firebase functions:config:set paypal.client_id="YOUR_LIVE_CLIENT_ID"
firebase functions:config:set paypal.secret="YOUR_LIVE_SECRET"
firebase functions:config:set paypal.webhook_id="YOUR_WEBHOOK_ID"

# 查看當前配置
firebase functions:config:get
```

## Firebase Secrets (推薦方式 - 使用 Secret Manager)

```bash
# 設置 PayPal 憑證為 Secrets
firebase functions:secrets:set PAYPAL_CLIENT_ID
# 輸入您的 Client ID

firebase functions:secrets:set PAYPAL_SECRET
# 輸入您的 Secret

firebase functions:secrets:set PAYPAL_WEBHOOK_ID
# 輸入您的 Webhook ID
```

## 本地開發環境

創建 `functions/.env` 檔案：

```env
# PayPal Sandbox Credentials (開發測試)
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_SECRET=your_sandbox_secret
PAYPAL_WEBHOOK_ID=your_webhook_id
NODE_ENV=development

# PayPal Live Credentials (生產環境 - 請勿提交到 Git)
# PAYPAL_CLIENT_ID=your_live_client_id
# PAYPAL_SECRET=your_live_secret
# NODE_ENV=production
```

## 設置步驟

### 1. 獲取 PayPal 憑證

1. 登入 [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. 前往 "Apps & Credentials"
3. 創建或選擇一個 App
4. 複製 "Client ID" 和 "Secret"

### 2. 設置 Webhook

1. 在 PayPal Dashboard 選擇您的 App
2. 前往 "Webhooks" 標籤
3. 點擊 "Add Webhook"
4. Webhook URL: `https://us-central1-goodi-5ec49.cloudfunctions.net/handlePaypalWebhook`
5. 選擇事件類型: `Checkout order approved`
6. 保存並複製 Webhook ID

### 3. 部署到 Firebase

```bash
# 使用 Secrets 部署
firebase deploy --only functions:createPaypalOrder,functions:handlePaypalWebhook

# 或部署所有 functions
firebase deploy --only functions
```

## 測試

### 本地測試 (Sandbox)

```bash
# 啟動 Functions Emulator
npm run serve

# 測試 createPaypalOrder
# 使用 Firebase Functions 測試工具或 Postman
```

### Webhook 本地測試

使用 ngrok 暴露本地端點：

```bash
# 安裝 ngrok
# 下載: https://ngrok.com/

# 啟動 tunnel
ngrok http 5001

# 在 PayPal Dashboard 設置 Webhook URL:
# https://your-ngrok-url.ngrok.io/goodi-5ec49/us-central1/handlePaypalWebhook
```

## 安全提醒

⚠️ **重要**:
- 永遠不要將憑證提交到 Git
- 添加 `functions/.env` 到 `.gitignore`
- 使用 Firebase Secret Manager 存儲敏感資訊
- Sandbox 和 Live 憑證要分開管理

## 驗證配置

```bash
# 檢查 Firebase Config
firebase functions:config:get

# 檢查 Secrets
firebase functions:secrets:access PAYPAL_CLIENT_ID
```
