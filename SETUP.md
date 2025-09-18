# ErDashboard 設定指南

## 🚀 快速開始

### 1. 設定 Google Drive 整合

1. **複製設定檔案範本**
   ```bash
   cp js/config.example.js js/config.js
   ```

2. **取得 Google Client ID**
   - 前往 [Google Cloud Console](https://console.cloud.google.com/)
   - 建立或選擇專案
   - 啟用 Google Drive API
   - 建立 OAuth 2.0 用戶端 ID
   - 複製 Client ID

3. **編輯設定檔案**
   ```javascript
   // js/config.js
   window.GOOGLE_DRIVE_CONFIG = {
       CLIENT_ID: '您的-client-id.apps.googleusercontent.com',  // 貼上您的 Client ID
       FOLDER_ID: 'YOUR_FOLDER_ID_HERE',
       SCOPES: 'https://www.googleapis.com/auth/drive.file'
   };
   ```

### 2. 啟動服務

```bash
python3 -m http.server 8001
```

開啟瀏覽器訪問：http://localhost:8001

### 3. OAuth 設定

在 Google Cloud Console 中設定：
- **授權的 JavaScript 來源**: `http://localhost:8001`
- **授權的重新導向 URI**: `http://localhost:8001`

⚠️ **注意**: 不要在 URI 後面加斜線 `/`

## 🔒 安全性

- `js/config.js` 檔案已在 `.gitignore` 中排除
- Client ID 不會被提交到版本控制
- 建議定期更換 OAuth 憑證

## 🛠 疑難排解

### 問題：「設定檔案未載入」
**解決**: 確認 `js/config.js` 檔案存在且格式正確

### 問題：「OAuth 初始化失敗」
**解決**: 檢查 Google Cloud Console 中的授權來源設定

### 問題：「來源無效」錯誤
**解決**: 確認授權來源為 `http://localhost:8001` (無結尾斜線)

## 📁 專案結構

```
ErDashboard/
├── js/
│   ├── config.example.js    # 設定檔案範本
│   ├── config.js           # 實際設定檔案 (git ignored)
│   ├── google-drive-api.js # Google Drive API 整合
│   └── team-management.js  # 團隊管理功能
├── .gitignore             # Git 忽略檔案列表
├── GOOGLE_DRIVE_SETUP.md  # 詳細設定指南
└── SETUP.md               # 快速設定指南
```

## 🎯 功能特色

- ✅ 自動同步到 Google Drive
- ✅ 智能更新檢測
- ✅ 團隊協作支援
- ✅ 版本控制管理
- ✅ 安全的憑證管理

需要更多幫助？請參考 `GOOGLE_DRIVE_SETUP.md` 獲得詳細的設定說明。