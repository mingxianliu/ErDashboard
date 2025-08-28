# 多專案監控 Dashboard（簡化版、可部署 GitHub Pages）

此專案是一個純靜態的 GitHub Repository 監控儀表板，集中呈現多個專案的功能進度、整體統計與近期活動。資料來源由 GitHub Actions 定期收集並寫入 `data/progress.json`，頁面由 GitHub Pages 提供。

## 結構

```
project-dashboard/
├── index.html
├── css/
│   └── dashboard.css
├── js/
│   ├── config.js
│   ├── github-api.js
│   └── dashboard.js
├── data/
│   └── progress.json
└── .github/workflows/
    └── update-data.yml
```

## 設定步驟

1) 編輯 `js/config.js`
- 在 `repositories` 陣列中新增或調整要監控的專案。
- 每個專案請設定 `owner`, `repo`, `featurePrefix`（功能代碼前綴），與 `color`。

2) 啟用 GitHub Pages
- Repository Settings → Pages → Branch 選擇 `main` 與 `/(root)`，儲存。

3) 啟用 GitHub Actions
- 檢查 `.github/workflows/update-data.yml` 已存在，首次合併到 main 後將自動排程執行（每 2 小時、可手動觸發）。
- Workflow 使用 `GITHUB_TOKEN` 呼叫 GitHub API 並提交更新檔案。

4) 首次本地預覽
- 直接開啟 `index.html`。
- 若 `data/progress.json` 尚未由 Actions 產出，頁面會嘗試即時呼叫 GitHub API（可能受限於 API rate limit）。

## 功能代碼規範（範例）

- Issue 標題包含 `[PREFIX+4位數]`：例如 `EMSB0101 使用者登入功能`。
- 以 Issue 狀態判斷進度：`open=進行中`、`closed=完成`。

## 常見問題

- 工作流程無法提交：請確認 repo 允許 Actions 使用 `GITHUB_TOKEN` 進行寫入。此專案已於 workflow 設定 `permissions: contents: write`。
- 私有 Repo：前端頁面可於瀏覽器 `localStorage` 設定 token：`localStorage.setItem('PD_TOKEN', 'ghp_xxx')`。
- 頁面無法載入資料：先確認 `data/progress.json` 是否存在，或查看 Actions 執行紀錄。

## 授權

此專案範本僅供示範，可自由調整使用。

