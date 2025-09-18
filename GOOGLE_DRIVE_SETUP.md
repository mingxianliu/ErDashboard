# Google Drive API 設定指南

為了讓 ErDashboard 能夠直接與 Google Drive 同步，您需要設定 Google Drive API 認證。

## 步驟 1: 建立 Google Cloud Project

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 專案名稱建議：`ErDashboard-GoogleDrive`

## 步驟 2: 啟用 Google Drive API

1. 在 Google Cloud Console 中，前往「API 和服務」>「程式庫」
2. 搜尋「Google Drive API」
3. 點擊「啟用」

## 步驟 3: 建立 OAuth 2.0 認證

1. 前往「API 和服務」>「憑證」
2. 點擊「建立憑證」>「OAuth 用戶端 ID」
3. 應用程式類型選擇「網路應用程式」
4. 名稱：`ErDashboard-WebApp`
5. 授權的 JavaScript 來源：
   - `http://localhost:8001` (開發環境)
   - 您的實際網域 (正式環境)
6. 授權的重新導向 URI：
   - `http://localhost:8001` (開發環境)
   - 您的實際網域 (正式環境)

## 步驟 4: 取得 Client ID

1. 建立完成後，複製您的 Client ID
2. 開啟 `js/google-drive-api.js`
3. 找到這一行：
   ```javascript
   client_id: '你的-client-id.apps.googleusercontent.com'
   ```
4. 替換為您的實際 Client ID

## 步驟 5: 設定 OAuth 同意畫面

1. 前往「API 和服務」>「OAuth 同意畫面」
2. 選擇「外部」使用者類型
3. 填寫應用程式資訊：
   - 應用程式名稱：`ErDashboard`
   - 使用者支援電子郵件：您的 Gmail
   - 開發人員聯絡資訊：您的 Gmail
4. 範圍設定：
   - 新增「../auth/drive.file」範圍
5. 測試使用者：
   - 新增您的 Gmail 帳號

## 步驟 6: 發布應用程式 (可選)

如果要供其他人使用：
1. 在 OAuth 同意畫面中點擊「發布應用程式」
2. 提交 Google 審核 (可能需要幾天時間)

## 設定完成後的使用方式

1. 開啟 ErDashboard
2. 進入團隊管理
3. 首次使用時會提示登入 Google Drive
4. 授權後，所有變更都會自動同步到 Google Drive
5. 系統每 5 分鐘檢查一次更新

## 安全注意事項

- Client ID 是公開的，這是正常的
- 您的 Google Drive 資料只能由授權的使用者存取
- 應用程式只能存取它建立的檔案，不能存取您的其他檔案
- 您可以隨時在 Google 帳戶設定中撤銷應用程式權限

## 疑難排解

### 問題：無法登入 Google Drive
- 檢查 Client ID 是否正確
- 確認授權的來源網域設定正確
- 檢查瀏覽器是否封鎖彈出視窗

### 問題：無法儲存檔案
- 確認已授權「Google Drive API」權限
- 檢查 Google Drive 資料夾權限

### 問題：找不到更新
- 確認檔案命名格式：`ErDashboard_[類型]_[日期]_[時間].json`
- 檢查檔案是否在正確的資料夾中

## 檔案結構

同步後的 Google Drive 資料夾結構：
```
ErDashboard-Sync/
├── ErDashboard_Members_2025-09-18_143022.json
├── ErDashboard_Groups_2025-09-18_143022.json
├── ErDashboard_Assignments_2025-09-18_143022.json
└── ErDashboard_Customizations_2025-09-18_143022.json
```

每次儲存都會建立新版本的檔案，保持完整的版本歷史。