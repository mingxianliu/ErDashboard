# ErDashboard 文件索引

## 🗂️ 快速導覽

### 📋 成員查詢入口
- **[成員專案對照表](./member-projects-index.md)** - 查詢您負責的專案
- **[專案成員對照表](./project-members-index.md)** - 查詢專案的團隊成員

### 📝 專案更新
- **[專案更新模板](./templates/project-update-template.md)** - 標準更新格式
- **[更新指南](./update-guide.md)** - 如何更新專案資料

### 📊 資料檔案位置
```
config/
├── team-members.json         # 團隊成員資料
├── project-assignments.json  # 專案分配資料
└── project-status/           # 專案狀態更新
    ├── ErCore/              # ErCore 專案更新記錄
    ├── ErNexus/             # ErNexus 專案更新記錄
    ├── ErShield/            # ErShield 專案更新記錄
    └── ErTidy/              # ErTidy 專案更新記錄
```

## 🔍 如何使用

### Step 1: 找到您的專案
1. 開啟 **[成員專案對照表](./member-projects-index.md)**
2. 使用 Ctrl+F 搜尋您的名字或員工編號
3. 查看您負責的專案列表

### Step 2: 更新專案資料
1. 進入對應專案的資料夾 (如 `config/project-status/ErCore/`)
2. 使用 **[專案更新模板](./templates/project-update-template.md)** 建立更新檔案
3. 檔案命名格式：`YYYY-MM-DD-update.json`

### Step 3: 提交更新
1. 透過 GitHub Web 介面直接編輯
2. 或使用 Git 提交變更
3. 系統會自動同步到 Dashboard

## 📌 重要連結

### 內部文件
- [團隊成員資料](../config/team-members.json)
- [專案分配資料](../config/project-assignments.json)

### 外部資源
- [ErDashboard 主頁](https://mingxianliu.github.io/ErDashboard/)
- [GitHub Repository](https://github.com/mingxianliu/ErDashboard)

## 💡 小提示

- 使用瀏覽器書籤儲存常用頁面
- 定期查看專案更新狀態
- 有問題請查看 [常見問題](./faq.md)

---
更新時間：2025-01-18