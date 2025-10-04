# 修復：團隊管理新增專案後研發記錄簿未顯示新專案

## 🔍 問題分析

### 原始問題
在 commit `48b183b` 和 `3b3d834` 中曾經修復過類似問題，但實際上**並未完全解決**：

1. **Commit 48b183b** (2025-09-23)
   - 標題：`fix: 修復研發記錄簿專案列表不完整問題`
   - 修復內容：
     - 擴充預設專案列表從 4 個到 8 個
     - 新增多重資料來源載入機制（teamDataManager → localStorage → config）
   - **問題**：只是增加了資料來源，但沒有實時更新機制

2. **Commit 3b3d834** (2025-10-02)
   - 標題：`fix: 修復新增/編輯/刪除成員與新增專案的 Google Drive 同步問題`
   - 修復內容：
     - 修復新增專案時研發記錄簿未初始化的問題
     - 團隊管理在新增專案時會初始化 devLogManager
   - **問題**：雖然在後端初始化了，但研發記錄簿 UI 沒有監聽更新信號

### 根本原因
**研發記錄簿（dev-log-ui.js）缺少 localStorage 監聽機制**，無法接收團隊管理發送的更新信號。

### 通信流程問題

#### 現有流程（不完整）
```
團隊管理新增專案
  ↓
發送 teamUpdateSignal 到 localStorage
  ↓
❌ 研發記錄簿沒有監聽 → 專案列表不更新
```

#### 修復後的完整流程
```
團隊管理新增專案
  ↓
保存到 dataManager.assignments
  ↓
同步到 Google Drive
  ↓
初始化 devLogManager
  ↓
發送 teamUpdateSignal 到 localStorage
  ↓
✅ 研發記錄簿監聽到信號
  ↓
✅ 重新載入專案列表
  ↓
✅ 新專案出現在下拉選單中
```

## ✅ 修復內容

### 1. 修復 localStorage 鍵名不匹配問題

**檔案：** `js/team-management-main.js`

```javascript
// 修改前（錯誤）
localStorage.setItem('TEAM_UPDATE_SIGNAL', JSON.stringify({
    action: 'FORCE_RELOAD',
    // ...
}));

// 修改後（正確）
localStorage.setItem('teamUpdateSignal', JSON.stringify({
    action: 'teamDataUpdate',
    // ...
}));
```

**原因：** index.html 監聽的是 `teamUpdateSignal`，但團隊管理發送的是 `TEAM_UPDATE_SIGNAL`，造成通信失敗。

### 2. 在研發記錄簿添加更新監聽機制

**檔案：** `js/dev-log-ui.js`

在 `setupEventListeners()` 方法中新增：

```javascript
// 監聽 localStorage 變更（跨視窗通信）
window.addEventListener('storage', async (event) => {
    if (event.key === 'teamUpdateSignal' && event.newValue) {
        try {
            const signal = JSON.parse(event.newValue);
            console.log('🔄 研發記錄簿收到更新信號:', signal);

            if (signal.action === 'teamDataUpdate' && signal.source === 'teamManagement') {
                console.log('🔄 重新載入專案列表...');
                await this.loadProjects();
                console.log('✅ 專案列表已更新');
            }
        } catch (error) {
            console.error('❌ 處理更新信號失敗:', error);
        }
    }
});

// 定期檢查 localStorage 更新（同視窗內的備用機制）
setInterval(async () => {
    try {
        const signal = localStorage.getItem('teamUpdateSignal');
        if (signal) {
            const updateData = JSON.parse(signal);
            const now = Date.now();
            // 如果信號是最近 1 秒內的，執行更新
            if (now - updateData.timestamp < 1000 && updateData.source === 'teamManagement') {
                console.log('🔄 檢測到專案更新信號，重新載入專案列表...');
                await this.loadProjects();
                console.log('✅ 專案列表已更新');
            }
        }
    } catch (e) {
        // 忽略解析錯誤
    }
}, 500);
```

**說明：**
- **storage 事件監聽**：用於跨瀏覽器標籤/視窗的通信
- **定期檢查機制**：用於同一視窗內不同頁面的通信（例如 iframe 或 window.open）
- **500ms 間隔**：確保及時捕捉更新信號

### 3. 更新版本號

**檔案：** `dev-log.html`

```html
<!-- 修改前 -->
<script src="js/dev-log-ui.js?v=20250923g"></script>

<!-- 修改後 -->
<script src="js/dev-log-ui.js?v=20250102a"></script>
```

## 📊 修改檔案清單

```
dev-log.html               |  2 +-
js/dev-log-ui.js           | 37 +++++++++++++++++++++++++++++++++++++
js/team-management-main.js |  6 +++---
js/team-management-main-backup.js |  6 +++---
```

## 🧪 測試步驟

### 準備工作
1. 清除瀏覽器快取（確保載入新版本的 JS 檔案）
2. 開啟首頁（index.html）
3. 開啟研發記錄簿（dev-log.html）
4. 開啟瀏覽器開發者工具查看 Console

### 測試流程

#### 測試 1：跨視窗更新（不同標籤）
1. 在一個標籤開啟研發記錄簿
2. 在另一個標籤開啟團隊管理
3. 在團隊管理中新增一個測試專案（例如 "TestProject2025"）
4. **預期結果**：
   - 團隊管理 Console 顯示：`✅ localStorage 強制更新信號已發送`
   - 研發記錄簿 Console 顯示：
     ```
     🔄 研發記錄簿收到更新信號: {action: 'teamDataUpdate', timestamp: ..., source: 'teamManagement'}
     🔄 重新載入專案列表...
     📊 使用 teamDataManager 專案資料
     ✅ 專案列表載入完成: ['ErCore', 'ErNexus', ..., 'TestProject2025']
     ✅ 專案列表已更新
     ```
   - 研發記錄簿的專案下拉選單中出現新專案 "TestProject2025"

#### 測試 2：同視窗更新（window.open）
1. 在首頁點擊「團隊管理」按鈕（使用 window.open）
2. 在團隊管理視窗中新增專案
3. 回到首頁查看研發記錄簿
4. **預期結果**：同上，但會透過定期檢查機制（500ms 輪詢）捕捉更新

#### 測試 3：手動刷新按鈕
1. 在研發記錄簿中點擊「重新載入專案列表」按鈕
2. **預期結果**：
   - Console 顯示：`📊 使用 teamDataManager 專案資料`
   - 專案列表更新，包含所有最新專案

## 🔧 技術細節

### localStorage 通信機制

#### 為什麼需要兩種監聽方式？

1. **storage 事件（跨標籤/視窗）**
   - 只在不同瀏覽器上下文間觸發
   - 不會在同一個頁面內觸發
   - 適用於多標籤場景

2. **定期輪詢（同視窗）**
   - 用於同一視窗內的頁面間通信
   - 例如：iframe、window.open、同一標籤內的頁面切換
   - 500ms 間隔平衡了即時性和性能

### 資料載入優先級

研發記錄簿的專案資料來源優先級（dev-log-ui.js line 226-270）：

1. **teamDataManager**（記憶體）
   - 最快，已載入到記憶體
   - 由 team-data-manager.js 管理

2. **localStorage**（瀏覽器儲存）
   - 次快，本地儲存
   - 離線可用

3. **config 檔案**（網路請求）
   - 較慢，需要網路請求
   - 備用方案

4. **預設專案列表**（硬編碼）
   - 最後手段
   - 包含 8 個常用專案

## 📝 與之前修復的關係

### Commit 48b183b 的補充
- **之前**：只增加了資料來源，但缺少實時更新
- **現在**：添加了實時監聽，新增專案後自動更新

### Commit 3b3d834 的完善
- **之前**：後端有初始化，但前端不知道
- **現在**：前端能接收後端的更新通知

## 🎯 預期效果

### 用戶體驗改善
1. ✅ 新增專案後，**無需手動刷新**研發記錄簿
2. ✅ 跨標籤操作時，資料**自動同步**
3. ✅ 提供清晰的 Console 日誌，方便除錯

### 系統穩定性提升
1. ✅ 統一 localStorage 鍵名，避免通信失敗
2. ✅ 雙重監聽機制，確保不同場景都能正常工作
3. ✅ 錯誤處理完善，不會因為解析失敗而中斷

## 🚀 後續建議

### 進一步優化
1. **考慮使用 BroadcastChannel API**
   - 更現代的跨標籤通信方式
   - 不需要輪詢，更高效
   - 需要檢查瀏覽器相容性

2. **優化輪詢機制**
   - 可以在收到更新後暫停輪詢一段時間
   - 或者使用指數退避（exponential backoff）

3. **統一更新機制**
   - 考慮建立一個統一的事件管理系統
   - 所有模組都使用同一套更新通知機制

### 測試覆蓋
- 建議增加自動化測試
- 測試不同瀏覽器的 localStorage 行為
- 測試高頻率更新的情況

## 📚 相關檔案

- `js/team-management-main.js` - 團隊管理主控制器
- `js/dev-log-ui.js` - 研發記錄簿 UI
- `js/team-data-manager.js` - 團隊資料管理器
- `dev-log.html` - 研發記錄簿頁面
- `index.html` - 首頁（也有 localStorage 監聽）

## ✅ 總結

這次修復不僅解決了研發記錄簿無法即時顯示新專案的問題，也修正了之前修復中遺漏的 localStorage 鍵名不匹配問題。透過雙重監聽機制（storage 事件 + 定期輪詢），確保在各種使用場景下都能正常工作。

---

**修復日期：** 2025-01-02  
**修復人員：** Claude & Erich Liu  
**相關 Commits：** 48b183b, 3b3d834
