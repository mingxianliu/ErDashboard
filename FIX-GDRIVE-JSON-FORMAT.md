# Google Drive 設定 JSON 格式錯誤解決方案

## 🔍 錯誤訊息

```
Google Drive 設定格式錯誤：Unexpected non-whitespace character after JSON at position 213 (line 6 column 2)
```

## 📋 常見原因

### 1️⃣ 多餘的逗號

**錯誤範例：**
```json
{
  "CLIENT_ID": "xxx.apps.googleusercontent.com",
  "FOLDER_ID": "your-folder-id",
  "SCOPES": "https://www.googleapis.com/auth/drive.file",  ← 最後一項不應有逗號
}
```

**正確範例：**
```json
{
  "CLIENT_ID": "xxx.apps.googleusercontent.com",
  "FOLDER_ID": "your-folder-id",
  "SCOPES": "https://www.googleapis.com/auth/drive.file"
}
```

### 2️⃣ 使用單引號

**錯誤範例：**
```json
{
  'CLIENT_ID': 'xxx.apps.googleusercontent.com',  ← JSON 不支援單引號
  'FOLDER_ID': 'your-folder-id',
  'SCOPES': 'https://www.googleapis.com/auth/drive.file'
}
```

**正確範例：**
```json
{
  "CLIENT_ID": "xxx.apps.googleusercontent.com",
  "FOLDER_ID": "your-folder-id",
  "SCOPES": "https://www.googleapis.com/auth/drive.file"
}
```

### 3️⃣ 包含註解

**錯誤範例：**
```json
{
  // 這是 Client ID
  "CLIENT_ID": "xxx.apps.googleusercontent.com",  ← JSON 不支援註解
  "FOLDER_ID": "your-folder-id",
  "SCOPES": "https://www.googleapis.com/auth/drive.file"
}
```

**正確範例：**
```json
{
  "CLIENT_ID": "xxx.apps.googleusercontent.com",
  "FOLDER_ID": "your-folder-id",
  "SCOPES": "https://www.googleapis.com/auth/drive.file"
}
```

### 4️⃣ 缺少引號

**錯誤範例：**
```json
{
  CLIENT_ID: "xxx.apps.googleusercontent.com",  ← 鍵名必須有引號
  "FOLDER_ID": "your-folder-id",
  "SCOPES": "https://www.googleapis.com/auth/drive.file"
}
```

**正確範例：**
```json
{
  "CLIENT_ID": "xxx.apps.googleusercontent.com",
  "FOLDER_ID": "your-folder-id",
  "SCOPES": "https://www.googleapis.com/auth/drive.file"
}
```

## ✅ 正確的格式

```json
{
  "CLIENT_ID": "您的-client-id.apps.googleusercontent.com",
  "FOLDER_ID": "您的-google-drive-folder-id",
  "SCOPES": "https://www.googleapis.com/auth/drive.file"
}
```

### 格式要求

- ✅ 使用雙引號 `"` 包圍鍵名和字串值
- ✅ 最後一個屬性後**不要**加逗號
- ✅ 不要有任何註解（`//` 或 `/* */`）
- ✅ 確保所有大括號、引號都正確配對
- ✅ 可以有縮排和換行（不影響解析）

## 🛠️ 快速修復步驟

1. **複製正確的範本**
   - 點擊「填入範本」按鈕
   - 或直接複製上方的正確格式

2. **替換您的實際值**
   ```json
   {
     "CLIENT_ID": "123456789-abcdefg.apps.googleusercontent.com",  ← 替換成您的實際 Client ID
     "FOLDER_ID": "1A2B3C4D5E6F7G8H9I0J",  ← 替換成您的實際 Folder ID
     "SCOPES": "https://www.googleapis.com/auth/drive.file"  ← 保持不變
   }
   ```

3. **驗證 JSON 格式**
   - 使用線上工具驗證：https://jsonlint.com/
   - 或在瀏覽器 Console 中測試：
     ```javascript
     JSON.parse('您的JSON字串')
     ```

## 🔑 如何取得設定值

### CLIENT_ID

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇或建立專案
3. 啟用 Google Drive API
4. 建立 OAuth 2.0 用戶端 ID
5. 複製 Client ID（格式：`xxx-xxx.apps.googleusercontent.com`）

### FOLDER_ID

1. 在 Google Drive 中開啟目標資料夾
2. 複製 URL 中的資料夾 ID
3. URL 格式：`https://drive.google.com/drive/folders/{FOLDER_ID}`
4. FOLDER_ID 是一串英數字組合

### SCOPES

固定值，不需修改：
```
https://www.googleapis.com/auth/drive.file
```

## 💡 使用圖形化界面

如果不想手動編輯 JSON，可以使用圖形化設定界面：

1. 點擊「使用圖形化設定界面」按鈕
2. 或直接開啟 `setup-gdrive.html`
3. 在表單中填入各項設定
4. 自動產生正確的 JSON 格式

## 🧪 測試您的設定

貼上 JSON 後，系統會自動驗證：

- ✅ 格式正確 → 顯示「設定已儲存」
- ❌ 格式錯誤 → 顯示詳細錯誤訊息和修復建議

## 📝 常見錯誤位置提示

如果錯誤訊息顯示：
- `position 213 (line 6 column 2)` → 第 6 行第 2 個字符有問題
- 通常是上一行末尾有多餘的逗號
- 或當前行開頭有非法字符

## ✨ 改進內容

本次更新改進了：

1. ✅ 更詳細的錯誤提示
2. ✅ 新增「填入範本」按鈕
3. ✅ 提供常見錯誤和解決方案
4. ✅ 自動格式化錯誤訊息顯示

---

**文檔日期：** 2025-01-03  
**相關檔案：** index.html
