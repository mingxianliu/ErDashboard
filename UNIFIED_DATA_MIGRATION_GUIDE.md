# ErDashboard 統一資料結構遷移指南

## 概述

ErDashboard 現在支援**統一資料結構 (Unified Data Structure)**，整合了以下三個系統的所有資料：

1. **首頁 (Dashboard)** - 專案概覽、進度追蹤
2. **研發記錄簿 (Dev Log)** - 開發日誌、里程碑記錄
3. **團隊管理系統 (Team Management)** - 成員、組織、專案分配

所有資料統一儲存在 **Google Drive** 的 `unified-data.json` 檔案中，作為**唯一真實資料源 (Single Source of Truth)**。

---

## 為什麼需要統一資料結構？

### 問題背景
在統一之前，資料分散在 **3 個不同地方**：

```
❌ 舊架構問題:
├── Google Drive
│   ├── team-members.json       (成員資料)
│   └── project-assignments.json (專案分配)
├── localStorage
│   ├── cachedTeamMembers
│   └── teamAssignments
└── 本地檔案 (config/)
    ├── team-members.json
    └── project-assignments.json

問題:
- 資料不一致 (8個專案記錄簿，實際有9個專案)
- 同步困難 (3個地方可能有不同的資料)
- 維護複雜 (修改要同時更新多處)
```

### 統一後的架構

```
✅ 新架構優勢:
Google Drive (唯一真實資料源)
└── unified-data.json
    ├── organization    (組織架構)
    ├── members         (成員資料)
    ├── roles          (角色定義)
    ├── projects       (專案完整資料)
    │   ├── ErCore
    │   ├── ErPP
    │   ├── ErNexus
    │   └── ... (共9個專案)
    ├── devLog         (研發記錄簿)
    └── config         (全局配置)

優勢:
✓ 單一真實資料源
✓ 自動同步所有系統
✓ 資料完整性保證
✓ 易於備份和遷移
```

---

## 統一資料結構說明

### 完整結構

```json
{
  "organization": {
    "name": "Er 研發組織",
    "groups": {
      "groupA": { "name": "A組", "members": [...] },
      "groupB": { "name": "B組", "members": [...] },
      "groupC": { "name": "C組", "members": [...] }
    }
  },

  "members": {
    "A-CC": {
      "id": "A-CC",
      "name": "KlauderA",
      "group": "groupA",
      "skills": ["fullstack"],
      "status": "active"
    }
    // ... 18個成員
  },

  "roles": {
    "frontend": { "name": "前端開發", "color": "#3b82f6" },
    "backend": { "name": "後端開發", "color": "#ef4444" },
    "fullstack": { "name": "全端開發", "color": "#8b5cf6" },
    "testing": { "name": "驗測部署", "color": "#10b981" }
  },

  "projects": {
    "ErPP": {
      "projectId": "ErPP",
      "projectName": "ErPP",
      "description": "P2P Communication Platform",
      "status": "active",
      "progress": 45,

      "metadata": {
        "startDate": "2025-09-01",
        "lastUpdated": "2025-10-05",
        "repository": "https://github.com/mingxianliu/ErPP",
        "featurePrefix": "ERPP"
      },

      "members": {
        "A-CI": { "role": "fullstack", "tasks": ["P2P 核心開發"] },
        "C-GI": { "role": "backend", "tasks": ["後端微服務"] },
        "B-CA": { "role": "frontend", "tasks": ["前端介面"] }
      },

      "coreMetrics": {
        "frontend": { "progress": 40, "status": "🚧 進行中" },
        "backend": { "progress": 50, "status": "🚧 進行中" },
        // ... 更多指標
      },

      "features": {
        "completed": [
          { "code": "ERPP0001", "name": "mDNS 自動發現" }
        ],
        "inProgress": [
          { "code": "ERPP0004", "name": "Master/Slave 控制模式", "progress": 60 }
        ],
        "planned": [
          { "code": "ERPP0007", "name": "媒體流傳輸" }
        ]
      },

      "github": {
        "owner": "mingxianliu",
        "repo": "ErPP",
        "stars": 0,
        "language": "TypeScript"
      }
    }
    // ... 其他8個專案 (ErCore, ErNexus, ErShield, ErTidy, SyncBC-Monorepo, iFMS-Frontend, EZOOM, iMonitoring)
  },

  "devLog": {
    "entries": [
      {
        "id": "log_20251005_001",
        "timestamp": "2025-10-05T10:30:00+08:00",
        "author": "KlauderA",
        "project": "ErPP",
        "type": "feature",
        "title": "完成 WebRTC 基礎連接實作",
        "content": "...",
        "tags": ["webrtc", "p2p"]
      }
    ]
  },

  "config": {
    "constraints": {
      "oneRolePerProject": "每個成員在單一專案中只能擔任一個角色",
      "availableRoles": ["frontend", "backend", "fullstack", "testing"]
    },
    "statistics": {
      "totalAssignments": 18,
      "activeProjects": 9
    }
  },

  "metadata": {
    "version": "2.0.0",
    "schemaVersion": "unified-v1",
    "lastSync": "2025-10-05T19:30:00+08:00"
  }
}
```

---

## 遷移步驟

### 前置準備

1. **備份現有資料**
   ```bash
   # 在 ErDashboard 目錄下
   mkdir backup-$(date +%Y%m%d)
   cp config/team-members.json backup-*/
   cp config/project-assignments.json backup-*/
   ```

2. **確認 Google Drive 設定**
   - 確保 `js/config.js` 已正確設定 Google Drive Client ID 和 Folder ID
   - 或在 sessionStorage 中設定 `GOOGLE_DRIVE_CONFIG`

3. **開啟團隊管理系統**
   ```
   在瀏覽器中開啟: team-management.html
   ```

### 執行遷移

#### 方法 1: 使用瀏覽器 Console (推薦)

1. **載入遷移腳本**
   ```javascript
   // 在瀏覽器開發者工具 Console 中執行
   const script = document.createElement('script');
   script.src = 'scripts/migrate-to-unified-structure.js';
   document.head.appendChild(script);
   ```

2. **執行遷移**
   ```javascript
   // 等待腳本載入後
   const manager = new MigrationManager();
   await manager.runMigration();
   ```

3. **查看遷移結果**
   ```
   遷移過程會在 Console 顯示詳細日誌:

   ═══════════════════════════════════════════
   🚀 開始資料遷移到統一結構
   ═══════════════════════════════════════════

   📦 步驟 1/6: 備份現有資料...
   ✅ 資料備份完成

   📊 步驟 2/6: 收集所有資料來源...
   ✅ 成員數: 18
   ✅ 專案數: 9

   🔄 步驟 3/6: 轉換為統一格式...
   ✅ 統一格式轉換完成

   ✅ 步驟 4/6: 驗證資料完整性...
   📊 錯誤: 0, 警告: 0

   ☁️  步驟 5/6: 上傳到 Google Drive...
   ✅ unified-data.json 上傳成功
   ✅ team-members.json 更新成功 (向後兼容)
   ✅ project-assignments.json 更新成功 (向後兼容)

   🔍 步驟 6/6: 驗證同步資料...
   ✅ 資料同步驗證成功

   ═══════════════════════════════════════════
   ✅ 資料遷移完成！
   ═══════════════════════════════════════════
   ```

#### 方法 2: 在 HTML 中載入腳本

在 `team-management.html` 的 `<head>` 中加入：

```html
<script src="scripts/unified-data-schema.js"></script>
<script src="scripts/migrate-to-unified-structure.js"></script>
```

然後在 Console 執行：
```javascript
const manager = new MigrationManager();
await manager.runMigration();
```

---

## 遷移後驗證

### 1. 檢查 Google Drive

登入 Google Drive，確認以下檔案存在：

- ✅ `unified-data.json` (新增的統一資料檔案)
- ✅ `team-members.json` (為向後兼容保留)
- ✅ `project-assignments.json` (為向後兼容保留)

### 2. 檢查系統功能

1. **團隊管理系統**
   - 重新整理頁面
   - 確認所有成員顯示正常
   - 確認所有專案(9個)都顯示正常
   - 嘗試新增/修改成員，確認可以同步

2. **首頁 Dashboard**
   - 開啟 `index.html`
   - 確認9個專案都顯示
   - 確認專案進度正確

3. **研發記錄簿**
   - 開啟 `dev-log.html`
   - 確認可以新增記錄
   - 確認記錄與專案關聯正確

### 3. 檢查 Console 日誌

重新整理頁面後，Console 應該顯示：

```
☁️ 優先從 Google Drive 載入統一資料結構...
✅ 發現統一資料結構，使用統一格式
✅ 統一資料結構載入成功
📦 從統一資料結構提取專案配置...
✅ 從統一資料結構提取專案配置成功 (9 個專案)
```

如果看到這些訊息，表示系統已成功切換到統一資料結構！

---

## 常見問題

### Q1: 遷移失敗怎麼辦？

遷移腳本會自動備份資料。如果失敗：

```javascript
// Console 會顯示
❌ 遷移失敗: [錯誤訊息]
🔄 正在恢復備份資料...
```

系統會自動恢復到遷移前的狀態。

### Q2: 如何手動恢復備份？

如果需要手動恢復：

```javascript
// 從 localStorage 恢復
const backup = JSON.parse(localStorage.getItem('cachedTeamMembers'));
console.log('備份資料:', backup);

// 或從本地檔案恢復
// 將 backup-YYYYMMDD/ 中的檔案複製回 config/
```

### Q3: 遷移後舊系統還能用嗎？

可以！遷移腳本會同時更新：
- `unified-data.json` (新格式)
- `team-members.json` (舊格式，向後兼容)
- `project-assignments.json` (舊格式，向後兼容)

所以即使在沒有更新的舊版本系統中，資料仍然可以正常讀取。

### Q4: 如何確認使用的是統一結構？

檢查 Console 日誌：

```javascript
// 使用統一結構
✅ 發現統一資料結構，使用統一格式

// 使用舊格式
ℹ️ 統一資料結構不存在，使用舊格式
```

或者在 Console 執行：

```javascript
console.log('使用統一結構:', window.teamDataManager.useUnifiedStructure);
```

### Q5: 如何新增專案？

新增專案後，資料會自動同步到 `unified-data.json`。

在團隊管理系統中：
1. 新增專案分配
2. 系統自動儲存到 Google Drive
3. `unified-data.json` 自動更新

---

## 技術說明

### 資料同步流程

```
1. 讀取優先順序:
   Google Drive (unified-data.json)
   → localStorage (快取)
   → 本地檔案 (config/)

2. 寫入流程:
   修改資料
   → 更新 unifiedData
   → 同步到 Google Drive (unified-data.json)
   → 同時更新舊格式檔案 (向後兼容)
   → 更新 localStorage 快取
```

### 向後兼容策略

TeamDataManager 同時支援兩種格式：

```javascript
// 檢測並載入
if (unified-data.json 存在) {
    使用統一結構
} else {
    使用舊格式 (team-members.json + project-assignments.json)
}

// 儲存時同時更新兩種格式
await saveUnifiedData();    // 新格式
await saveLegacyData();     // 舊格式 (向後兼容)
```

---

## 維護建議

### 定期備份

建議每週手動下載 Google Drive 的 `unified-data.json` 作為備份：

1. 登入 Google Drive
2. 下載 `unified-data.json`
3. 保存到 `backup-YYYYMMDD/` 目錄

### 資料驗證

定期在 Console 執行資料驗證：

```javascript
const validation = window.DataMigrationTool.validateUnifiedData(
    window.teamDataManager.unifiedData
);

console.log('驗證結果:', validation);
// { valid: true, errors: [], warnings: [] }
```

---

## 相關文件

- `scripts/unified-data-schema.js` - 統一資料結構定義
- `scripts/migrate-to-unified-structure.js` - 遷移腳本
- `js/team-data-manager.js` - 資料管理器 (已更新支援統一結構)
- `js/google-drive-api.js` - Google Drive API 整合

---

## 完成！

恭喜！你已經成功完成 ErDashboard 統一資料結構的遷移。

現在所有 **9個專案** 的資料都統一儲存在 Google Drive 的 `unified-data.json` 中，並且自動同步到：
- ✅ 首頁 (Dashboard)
- ✅ 研發記錄簿 (Dev Log)
- ✅ 團隊管理系統 (Team Management)

如有任何問題，請檢查 Console 日誌或聯繫開發團隊。

---

**ErDashboard Team** © 2024-2025
