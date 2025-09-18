# 個別專案加入 ErDashboard 指引

## 🎯 目標
將您的個別專案連接到 ErDashboard，實現自動化進度追蹤

## 📋 準備工作

### 1. 設定環境變數
在您的個別專案中，設定 ErDashboard 的路徑：

```bash
# 在個別專案的 .env 或 .bashrc 中加入
export ER_DASHBOARD_PATH="/Users/erich/Documents/GitHub/ErDashboard"
```

### 2. 複製更新腳本
將 ErDashboard 的更新腳本複製到您的個別專案：

```bash
# 在您的個別專案根目錄執行
cp $ER_DASHBOARD_PATH/scripts/update-dashboard.js ./scripts/
cp $ER_DASHBOARD_PATH/scripts/package.json ./scripts/  # 如果有的話

# 或者建立軟連結（推薦）
ln -s $ER_DASHBOARD_PATH/scripts/update-dashboard.js ./update-dashboard.js
```

### 3. 建立專案對應
首次執行時，腳本會自動建立設定檔並詢問專案對應關係

## 🚀 日常使用

### 完成一個功能時：
```bash
# 在您的個別專案中執行
node update-dashboard.js --auto-detect --feature "ERC0001" --status "completed" --message "完成使用者登入功能"
```

### 更新專案進度時：
```bash
node update-dashboard.js --auto-detect --progress 65 --message "完成核心模組開發"
```

### 新增進行中的功能：
```bash
node update-dashboard.js --auto-detect --feature "ERC0003" --status "in-progress" --message "開發支付系統"
```

## 📁 專案結構建議

將更新腳本整合到您的專案中：

```
您的專案/
├── src/
├── tests/
├── scripts/
│   └── update-dashboard.js     # Dashboard 更新腳本
├── .env                        # 包含 ER_DASHBOARD_PATH
├── package.json
└── README.md
```

## ⚙️ 自動化整合

### 與 Git Hooks 整合

建立 `.git/hooks/post-commit`：
```bash
#!/bin/bash
# 在每次 commit 後詢問是否要更新 Dashboard

echo "🎯 是否要更新 ErDashboard？(y/N)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "📝 請輸入功能代號 (如 ERC0001):"
    read -r feature_code
    echo "📝 請輸入狀態 (completed/in-progress/planned):"
    read -r status
    echo "📝 請輸入描述:"
    read -r message
    
    node scripts/update-dashboard.js --auto-detect --feature "$feature_code" --status "$status" --message "$message"
fi
```

### 與 Package.json Scripts 整合

```json
{
  "scripts": {
    "update-dashboard": "node scripts/update-dashboard.js --auto-detect",
    "complete-feature": "node scripts/update-dashboard.js --auto-detect --status completed",
    "progress-update": "node scripts/update-dashboard.js --auto-detect --progress"
  }
}
```

使用方式：
```bash
npm run complete-feature -- --feature "ERC0001" --message "完成登入系統"
npm run progress-update -- --progress 75 --message "主要功能完成"
```

## 🎯 最佳實踐

### 功能代號命名規則
- **ErProject1**: `ERC0001`, `ERC0002`, `ERC0003`...
- **ErWebsite**: `ERW0001`, `ERW0002`, `ERW0003`...
- **ErAPI**: `ERA0001`, `ERA0002`, `ERA0003`...

### 更新時機
1. **功能完成時**：將功能從 `in-progress` 改為 `completed`
2. **開始新功能時**：新增 `in-progress` 功能
3. **里程碑達成時**：更新專案整體進度百分比
4. **每週回顧時**：更新專案狀態和筆記

### 訊息撰寫建議
- **簡潔明確**：`完成使用者認證系統`
- **包含技術細節**：`完成 OAuth2.0 整合，支援 Google/GitHub 登入`
- **標註影響範圍**：`重構資料庫結構，影響所有使用者相關功能`

## 🔧 故障排除

### 找不到專案對應
如果腳本無法自動檢測您的專案：
1. 檢查 `project-mapping.json` 設定檔
2. 手動加入專案對應關係
3. 或使用 `--project` 參數明確指定

### 權限問題
如果無法寫入 ErDashboard：
1. 檢查檔案權限：`ls -la $ER_DASHBOARD_PATH`
2. 確認路徑正確：`echo $ER_DASHBOARD_PATH`

### Git 操作失敗
如果自動 commit 失敗：
1. 檢查 ErDashboard 是否為 Git repository
2. 確認有 Git 寫入權限
3. 檢查是否有未解決的 merge conflicts

## 📝 範例工作流程

```bash
# 1. 開發新功能
git checkout -b feature/user-login
# ... 寫程式 ...

# 2. 開始時標記為進行中
node update-dashboard.js --auto-detect --feature "ERC0001" --status "in-progress" --message "開始開發使用者登入"

# 3. 開發過程中更新進度
node update-dashboard.js --auto-detect --progress 30 --message "完成登入頁面設計"

# 4. 功能完成
git add .
git commit -m "完成使用者登入功能"
node update-dashboard.js --auto-detect --feature "ERC0001" --status "completed" --message "完成使用者登入功能，包含驗證和session管理"

# 5. 合併到主分支
git checkout main
git merge feature/user-login
```

---

## ⚠️ 注意事項

1. **此指引檔案不會被推送到 Git**：僅供本地參考
2. **更新腳本也建議不推送**：避免在每個專案中都有重複的檔案
3. **設定檔案注意保密**：避免洩露專案路徑等敏感資訊
4. **定期同步腳本**：當 ErDashboard 更新腳本時，記得更新各專案中的副本