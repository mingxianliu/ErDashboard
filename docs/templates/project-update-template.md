# 專案更新模板

## JSON 格式模板

請將以下模板複製並填寫，檔案命名為 `YYYY-MM-DD-update.json`

```json
{
  "updateInfo": {
    "date": "2025-01-18",
    "updatedBy": "您的名字",
    "memberId": "您的員工編號 (如 A-CC)",
    "projectId": "專案ID (如 ErCore)"
  },

  "progressUpdate": {
    "overallProgress": 75,
    "roleProgress": {
      "frontend": 80,
      "backend": 75,
      "testing": 70
    },
    "coreMetrics": {
      "frontend": {
        "progress": 85,
        "status": "進行中",
        "notes": "UI 組件開發完成 85%"
      },
      "backend": {
        "progress": 75,
        "status": "進行中",
        "notes": "API 整合測試中"
      },
      "database": {
        "progress": 90,
        "status": "接近完成",
        "notes": "資料庫架構已定案"
      },
      "deployment": {
        "progress": 60,
        "status": "進行中",
        "notes": "CI/CD 配置中"
      },
      "validation": {
        "progress": 70,
        "status": "進行中",
        "notes": "單元測試覆蓋率 70%"
      }
    }
  },

  "tasksCompleted": [
    {
      "taskId": "TASK-001",
      "description": "完成使用者登入介面",
      "completedDate": "2025-01-18"
    },
    {
      "taskId": "TASK-002",
      "description": "實作 JWT 認證機制",
      "completedDate": "2025-01-18"
    }
  ],

  "currentTasks": [
    {
      "taskId": "TASK-003",
      "description": "優化資料庫查詢效能",
      "status": "進行中",
      "expectedCompletion": "2025-01-20"
    }
  ],

  "blockers": [
    {
      "issue": "需要第三方 API 文件",
      "impact": "中",
      "needsHelp": true,
      "description": "等待供應商提供 API 規格文件"
    }
  ],

  "nextSteps": [
    "完成剩餘的 API 端點開發",
    "進行整合測試",
    "準備部署到測試環境"
  ],

  "notes": "本週重點在完成核心功能開發，下週將進入測試階段"
}
```

## 使用說明

### 1. 複製模板
複製上方 JSON 模板到新檔案

### 2. 填寫資訊
- **updateInfo**: 基本更新資訊
- **progressUpdate**: 進度更新（百分比）
- **tasksCompleted**: 已完成的任務
- **currentTasks**: 進行中的任務
- **blockers**: 遇到的阻礙（選填）
- **nextSteps**: 下一步計劃
- **notes**: 其他備註（選填）

### 3. 檔案位置
儲存到對應專案資料夾：
- ErCore: `config/project-status/ErCore/2025-01-18-update.json`
- ErNexus: `config/project-status/ErNexus/2025-01-18-update.json`
- ErShield: `config/project-status/ErShield/2025-01-18-update.json`
- ErTidy: `config/project-status/ErTidy/2025-01-18-update.json`

### 4. 提交更新
透過 GitHub Web 介面或 Git 命令提交

## 狀態選項

### 整體狀態
- `規劃中`
- `進行中`
- `測試中`
- `接近完成`
- `已完成`
- `暫停`

### 優先級
- `高`
- `中`
- `低`

### 影響程度
- `高` - 阻擋進度
- `中` - 影響部分功能
- `低` - 不影響主要進度

## 範例檔案

查看範例更新：
- [ErCore 更新範例](../../config/project-status/ErCore/example-update.json)
- [ErNexus 更新範例](../../config/project-status/ErNexus/example-update.json)

## 相關連結

- [更新指南](../update-guide.md)
- [成員專案對照表](../member-projects-index.md)
- [回到首頁](../README.md)