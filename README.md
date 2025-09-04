# ErDashboard - 多專案進度監控中心

自動監控 GitHub 上所有 Er* 開頭專案的進度儀表板。

## 功能特色

- 自動收集所有 Er* 開頭的 Repository 資訊
- 透過 Issue/PR 編號（如 ERC0001）追蹤功能進度
- GitHub Actions 每小時自動更新數據
- 支援私有 Repository（需設定 Token）
- 純前端應用，可部署在 GitHub Pages

## 專案狀態更新

### 🎉 重要里程碑達成
- **ErTidy v2.2.0**: 已達到完全獨立狀態，移除所有外部專案依賴
- **ErCore**: 整合 ErBond 和 ErAid 功能，成為統一的 AI 研發平台
- **ErAid-Ecosystem**: 功能已整合入 ErCore，不再作為獨立專案

### 當前專案架構
```
ErCore (統一平台)
├── AI 研發功能
├── ErBond 封裝功能
└── ErAid 工作流功能

ErTidy (獨立產品)
├── 完全獨立的檔案管理
├── 內部 AI 引擎
└── 專案審計功能
```

## 快速部署

### 1. Fork 此專案

### 2. 啟用 GitHub Pages
- 進入 Settings > Pages
- Source 選擇 "Deploy from a branch"
- Branch 選擇 "main" / "(root)"
- 點擊 Save

### 3. 啟用 GitHub Actions
- 進入 Actions 標籤
- 點擊 "I understand my workflows, go ahead and enable them"

### 4. 訪問您的 Dashboard
- 網址：`https://[您的用戶名].github.io/ErDashboard`

## 設定 Token（監控私有 Repo）

如果要監控私有 Repository：

1. 點擊頁面上的黃色「快速設定 Token」按鈕
2. 按照彈出視窗的指示：
   - 點擊「前往 GitHub 建立 Token」
   - 勾選 `repo` 權限
   - 產生並複製 Token
3. 將 Token 貼入輸入框
4. 點擊「測試連線」確認 Token 有效
5. 點擊「儲存並重新載入」

**注意**：Token 僅儲存在瀏覽器 localStorage，不會傳送到任何伺服器。

## 自訂監控範圍

編輯 `js/config.js` 調整監控設定：

```javascript
repositories: [
    {
        name: "Er 專案群",
        owner: "mingxianliu",  // 改為您的 GitHub 用戶名
        repoPattern: "Er*",     // 改為您要監控的 pattern
        // ...
    }
]
```

## 功能代碼規範

Dashboard 會自動識別 Issue/PR 標題中的功能代碼：

- ErCore 專案：`ERC0001`
- ErTidy 專案：`ERT0001`
- 其他規則見 `js/config.js`

## 技術架構

- **前端**：純 HTML/JS/CSS + Bootstrap
- **資料更新**：GitHub Actions + Node.js
- **部署**：GitHub Pages
- **API**：GitHub REST API v3

## 資料更新頻率

- GitHub Actions 每小時自動執行
- 可手動觸發：Actions > Update Dashboard Data > Run workflow
- 頁面上點擊「重新載入」可立即從 GitHub API 取得最新資料（需 Token）

## 疑難排解

### 沒有看到資料？
1. 確認 GitHub Actions 已執行過（查看 Actions 標籤）
2. 確認 `data/progress.json` 檔案已產生
3. 如果是私有 repo，需設定 Token

### API 速率限制？
- 未認證：60 次/小時
- 已設定 Token：5000 次/小時

### Actions 執行失敗？
檢查 Actions 標籤的錯誤訊息，常見原因：
- Repository 名稱或 owner 錯誤
- API 速率限制（等待下個小時）

---

**最後更新**: 2025年1月27日  
**版本**: v2.0.0  
**狀態**: 監控 ErCore 和 ErTidy 兩個主要專案