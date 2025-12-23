# Goodi App 🦖
**兒童成長管理系統 - 讓孩子在遊戲中養成好習慣**

Goodi 是一個專為 5-12 歲兒童設計的任務管理與成長追蹤系統，結合 AI 技術與遊戲化機制，幫助家長與孩子建立更好的親子互動。

---

## ✨ 主要功能

- 📝 **任務系統** - 自定義每日/每週任務，培養良好習慣
- 🎮 **遊戲化設計** - 積分、代幣、扭蛋機制提升參與度
- 🤖 **AI 助手** - Google Gemini 提供個性化建議與成長報告
- 🌳 **心事樹洞** - 安全的情緒抒發空間，AI 陪伴關懷
- 📊 **成長追蹤** - 學業成績、習慣養成、每日亮點記錄
- 👨‍👩‍👧 **家長模式** - 家長可設定任務、查看報告、設置獎勵

---

## 🛠️ 技術棧

### Frontend
- **React 19** + **TypeScript** - 現代化 UI 框架
- **Vite 6** - 快速開發構建工具
- **TailwindCSS 4** - 原子化 CSS 設計系統
- **React Router 7** - 單頁應用路由

### Backend & Services
- **Firebase** - 完整後端服務
  - Authentication - 用戶認證
  - Firestore - 數據存儲
  - Cloud Functions - 伺服器邏輯
  - Hosting - 靜態網站託管
- **Google Gemini AI** - AI 內容生成與分析

---

## 📦 安裝與運行

### 前置需求
- Node.js >= 20.x
- npm >= 10.x
- Firebase CLI (`npm install -g firebase-tools`)

### 1. Clone 專案
```bash
git clone https://github.com/YOUR_USERNAME/Goodi-app.git
cd Goodi-app
```

### 2. 安裝依賴

#### 安裝前端依賴
```bash
cd Goodi-App
npm install
```

#### 安裝 Cloud Functions 依賴
```bash
cd ../functions
npm install
```

### 3. 環境變數配置

在 `Goodi-App/` 目錄創建 `.env` 或 `.env.local` 文件：

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. 本地開發

#### 啟動前端開發服務器
```bash
cd Goodi-App
npm run dev
```
前端將運行在 `http://localhost:9000`

#### 啟動 Firebase Emulators（可選）
```bash
# 在專案根目錄
firebase emulators:start
```

---

## 🚀 部署

### 方法 1: 使用 GitHub Actions（推薦）

1. **設定 Firebase Service Account**
   ```bash
   # 生成 Service Account Key
   firebase login
   firebase projects:list
   
   # 創建並下載 Service Account JSON
   # 在 Firebase Console > Project Settings > Service Accounts
   ```

2. **添加 GitHub Secrets**
   - 前往 GitHub Repository > Settings > Secrets and variables > Actions
   - 添加 `FIREBASE_SERVICE_ACCOUNT` - 貼上 Service Account JSON 內容

3. **推送到 main 分支自動部署**
   ```bash
   git push origin main
   ```

### 方法 2: 手動部署

#### 構建前端
```bash
cd Goodi-App
npm run build
```

#### 部署到 Firebase
```bash
# 在專案根目錄
firebase deploy
```

或分別部署特定服務：
```bash
firebase deploy --only hosting        # 僅部署前端
firebase deploy --only functions       # 僅部署 Cloud Functions
firebase deploy --only firestore:rules # 僅部署 Firestore 規則
```

---

## 📁 專案結構

```
Goodi-app/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions 自動部署
├── Goodi-App/                  # 前端應用
│   ├── components/             # React 組件
│   ├── pages/                  # 頁面組件
│   ├── services/               # API 服務層
│   ├── utils/                  # 工具函數
│   ├── types.ts                # TypeScript 類型定義
│   ├── firebase.ts             # Firebase 配置
│   └── index.html              # 入口 HTML
├── functions/                  # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts            # 主入口
│   │   ├── geminiWrapper.ts    # AI 呼叫封裝
│   │   └── deleteUserAccount.ts # 帳號刪除（Apple 合規）
│   └── package.json
├── public/                     # 靜態資源
│   ├── privacy.html            # 隱私政策
│   └── index.html              # Hosting 入口
├── firebase.json               # Firebase 配置
├── firestore.rules             # Firestore 安全規則
└── README.md                   # 本文件
```

---

## 🔒 環境變數說明

| 變數名稱 | 說明 | 必填 |
|---------|------|------|
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key | ✅ |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | ✅ |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | ✅ |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | ✅ |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | ✅ |
| `GEMINI_API_KEY` | Google Gemini API Key (Cloud Functions) | ✅ |

**注意**：Cloud Functions 的 `GEMINI_API_KEY` 需透過 Firebase Secrets 配置：
```bash
firebase functions:secrets:set GEMINI_API_KEY
```

---

## 🧪 開發工具

### 可用的 npm scripts

#### Frontend (Goodi-App/)
```bash
npm run dev      # 啟動開發服務器
npm run build    # 構建生產版本
npm run preview  # 預覽構建結果
```

#### Functions (functions/)
```bash
npm run serve    # 本地運行 Functions
npm run deploy   # 部署 Functions
npm run logs     # 查看 Functions 日誌
```

---

## 📝 重要注意事項

### Apple App Store 合規
- ✅ 已實現「刪除帳號」功能（`deleteUserAccount` Cloud Function）
- ✅ 已整合 Error Boundary 錯誤攔截
- ✅ 隱私政策頁面：`/privacy.html`

### Firebase Secrets 配置
```bash
# 設定 Gemini API Key
firebase functions:secrets:set GEMINI_API_KEY

# 查看已設定的 Secrets
firebase functions:secrets:access GEMINI_API_KEY
```

### Firestore 安全規則
請確保 `firestore.rules` 已正確配置，避免數據洩露。

---

## 🤝 貢獻指南

1. Fork 本專案
2. 創建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

---

## 📄 授權

Copyright © 2024 Goodi Team. All rights reserved.

---

## 📧 聯繫方式

- **Email**: popo.studio@msa.hinet.net
- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/Goodi-app/issues)

---

## 🎯 Roadmap

- [ ] iOS / Android 原生應用開發
- [ ] 多語言支援（英文、日文）
- [ ] 進階數據分析與視覺化
- [ ] 社群功能（家長交流）
- [ ] AI 語音互動

---

**Made with ❤️ for every family**
