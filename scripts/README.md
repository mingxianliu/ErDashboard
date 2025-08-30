# ErDashboard 自動化腳本

> ⚠️ **重要說明**：此目錄中的腳本檔案不會被推送到 Git repository，僅供本地使用。

## 📁 目錄說明

- `update-dashboard.js` - 通用 Dashboard 更新腳本
- `PROJECT_ONBOARDING.md` - 個別專案接入指引
- `project-mapping.json` - 專案對應設定檔（自動生成）

## 🚀 快速開始

### 1. 設定環境
```bash
# 設定 ErDashboard 路徑（加入到您的 .bashrc 或 .zshrc）
export ER_DASHBOARD_PATH="/Users/erich/Documents/GitHub/ErDashboard"
```

### 2. 在其他專案中使用
```bash
# 方法 1: 建立軟連結
ln -s $ER_DASHBOARD_PATH/scripts/update-dashboard.js ./update-dashboard.js

# 方法 2: 複製檔案
cp $ER_DASHBOARD_PATH/scripts/update-dashboard.js ./scripts/
```

### 3. 使用範例
```bash
# 自動檢測並更新功能狀態
node update-dashboard.js --auto-detect --feature "ERC0001" --status "completed" --message "完成使用者登入"

# 更新專案進度
node update-dashboard.js --auto-detect --progress 75 --message "核心功能開發完成"

# 檢視幫助
node update-dashboard.js --help
```

## 🔧 設定說明

首次使用時，腳本會自動建立 `project-mapping.json` 設定檔：

```json
{
  "description": "專案目錄名稱對應到 Dashboard 的 markdown 檔案", 
  "mapping": {
    "MyApp": "ErProject1.md",
    "MyWebsite": "ErProject2.md",
    "MyAPI": "ErAI-Assistant.md"
  }
}
```

## 📖 詳細說明

完整的接入指引請參考 `PROJECT_ONBOARDING.md`