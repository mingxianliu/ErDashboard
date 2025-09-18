/**
 * Google Drive API 設定檔案範例
 * 複製此檔案為 config.js 並填入您的實際 Client ID
 */

window.GOOGLE_DRIVE_CONFIG = {
    // 請將此 Client ID 替換為您的實際 Google Client ID
    CLIENT_ID: '你的-client-id.apps.googleusercontent.com',

    // Google Drive 資料夾 ID
    FOLDER_ID: 'YOUR_FOLDER_ID_HERE',

    // OAuth 範圍
    SCOPES: 'https://www.googleapis.com/auth/drive.file'
};

// 設定說明：
// 1. 前往 Google Cloud Console (https://console.cloud.google.com/)
// 2. 建立或選擇專案
// 3. 啟用 Google Drive API
// 4. 建立 OAuth 2.0 用戶端 ID
// 5. 將 Client ID 貼上到上方的 CLIENT_ID 欄位
// 6. 儲存為 config.js (移除 .example)