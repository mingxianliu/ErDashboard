# 修復：避免 config.js 404 錯誤顯示在 Console

## 🔍 問題描述

在 GitHub Pages 或沒有本地 `js/config.js` 的環境中，瀏覽器 Console 會顯示：

```
GET https://mingxianliu.github.io/ErDashboard/js/config.js?v=20250918t net::ERR_ABORTED 404 (Not Found)
```

### 原因

- `js/config.js` 包含敏感的 Google API 金鑰，因此被加入 `.gitignore`
- 本地開發時存在，但 GitHub Pages 上不存在
- 原本使用 `<script>` 標籤的 `onerror` 事件處理，但仍會在 Console 顯示 404 錯誤

## ✅ 解決方案

使用 `fetch` API 的 HEAD 請求先檢查檔案是否存在，再決定是否載入。

### 修改前（會顯示 404 錯誤）

```javascript
// 嘗試載入 config.js
const configScript = document.createElement('script');
configScript.src = 'js/config.js?v=20250918t';
configScript.onerror = () => {
    console.log('⚠️ config.js 未找到，將使用手動設定模式');
};
document.head.appendChild(configScript);
```

**問題：** 即使有 `onerror` 處理，瀏覽器仍會在 Console 顯示紅色的 404 錯誤訊息。

### 修改後（靜默處理）

```javascript
// 嘗試靜默載入 config.js（避免 404 錯誤顯示在 Console）
fetch('js/config.js?v=20250918t', { method: 'HEAD' })
    .then(response => {
        if (response.ok) {
            // 檔案存在，動態載入
            const configScript = document.createElement('script');
            configScript.src = 'js/config.js?v=20250918t';
            document.head.appendChild(configScript);
            console.log('✅ 已載入本地 config.js');
        } else {
            console.log('ℹ️ 本地 config.js 未找到，將使用手動設定模式');
        }
    })
    .catch(() => {
        console.log('ℹ️ 本地 config.js 未找到，將使用手動設定模式');
    });
```

**優點：**
- ✅ 使用 HEAD 請求，不下載檔案內容（節省頻寬）
- ✅ 檔案不存在時不會顯示 404 錯誤
- ✅ 提供清晰的 Console 訊息
- ✅ 檔案存在時才動態載入

## 📊 修改檔案

```
 M index.html      (改用 fetch HEAD 檢查)
 M dev-log.html    (改用 fetch HEAD 檢查)
```

## 🧪 測試結果

### 本地環境（有 config.js）
```
Console 輸出：
✅ 已載入本地 config.js
```

### GitHub Pages（沒有 config.js）
```
Console 輸出：
ℹ️ 本地 config.js 未找到，將使用手動設定模式
```

**無 404 錯誤！** ✅

## 🔐 關於 config.js

### 為什麼需要 config.js？

`js/config.js` 用於儲存敏感的 Google Drive API 設定：

```javascript
window.GOOGLE_DRIVE_CONFIG = {
    CLIENT_ID: 'your-client-id.apps.googleusercontent.com',
    FOLDER_ID: 'YOUR_FOLDER_ID_HERE',
    SCOPES: 'https://www.googleapis.com/auth/drive.file'
};
```

### 本地開發設定

1. 複製範例檔案：
   ```bash
   cp js/config.example.js js/config.js
   ```

2. 編輯 `js/config.js`，填入您的實際 Client ID 和 Folder ID

3. `js/config.js` 會被 `.gitignore` 忽略，不會提交到 Git

### 線上部署（GitHub Pages）

- **不需要** `js/config.js`
- 使用「雲端設定」按鈕手動輸入 API 金鑰
- 設定儲存在 `sessionStorage`，不會外洩

## 📝 其他頁面

### settings.html

已經使用 `fetch` 並有正確的錯誤處理，不需要修改：

```javascript
async function loadRepoConfig() {
    try {
        const response = await fetch('js/config.js');
        const text = await response.text();
        // ...
    } catch (error) {
        // 錯誤處理
    }
}
```

## 🎯 總結

- ✅ 修復了 Console 中顯示的 404 錯誤
- ✅ 改善用戶體驗，Console 更乾淨
- ✅ 提供更清晰的訊息提示
- ✅ 保持原有功能不變

---

**修復日期：** 2025-01-03  
**影響範圍：** index.html, dev-log.html  
**相容性：** 完全向後相容
