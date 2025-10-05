/**
 * 統一資料結構 Schema
 * 這是 ErDashboard 所有資料的統一來源
 * 儲存於 Google Drive，作為唯一真實資料源 (Single Source of Truth)
 */

// =============================================================================
// 統一資料結構定義
// =============================================================================

const UnifiedDataSchema = {
  /**
   * 組織架構
   */
  organization: {
    name: "Er 研發組織",
    description: "Er 系列專案研發團隊",
    groups: {
      "groupA": {
        id: "groupA",
        name: "A組",
        description: "A組團隊成員",
        leader: "A-CC", // 組長 member ID
        members: ["A-CC", "A-CA", "A-GI", "A-CI", "A-CS", "A-VC"],
        color: "#3b82f6",
        createdDate: "2025-01-01"
      },
      "groupB": {
        id: "groupB",
        name: "B組",
        description: "B組團隊成員",
        leader: "B-CC",
        members: ["B-CC", "B-CA", "B-GI", "B-CI", "B-CS", "B-VC"],
        color: "#ef4444",
        createdDate: "2025-01-01"
      },
      "groupC": {
        id: "groupC",
        name: "C組",
        description: "C組團隊成員",
        leader: "C-CC",
        members: ["C-CC", "C-CA", "C-GI", "C-CI", "C-CS", "C-VC"],
        color: "#10b981",
        createdDate: "2025-01-01"
      }
    }
  },

  /**
   * 成員資料
   */
  members: {
    "A-CC": {
      id: "A-CC",
      name: "KlauderA",
      email: "",
      skills: ["fullstack", "architecture"],
      avatar: "A-CC",
      joinDate: "2025-01-01",
      group: "groupA",
      personalNotes: [],
      status: "active"
    },
    // ... 其他成員
  },

  /**
   * 角色定義
   */
  roles: {
    "frontend": {
      name: "前端開發",
      icon: "[UI]",
      color: "#3b82f6",
      description: "負責用戶介面設計與前端功能實作",
      requiredSkills: ["html", "css", "javascript", "react"]
    },
    "backend": {
      name: "後端開發",
      icon: "[API]",
      color: "#ef4444",
      description: "負責伺服器邏輯、API 開發與資料庫設計",
      requiredSkills: ["nodejs", "database", "api"]
    },
    "fullstack": {
      name: "全端開發",
      icon: "[FULL]",
      color: "#8b5cf6",
      description: "負責前後端整合開發與系統架構設計",
      requiredSkills: ["frontend", "backend", "architecture"]
    },
    "testing": {
      name: "驗測部署",
      icon: "[TEST]",
      color: "#10b981",
      description: "負責功能測試、品質保證、驗證報告與系統部署",
      requiredSkills: ["testing", "qa", "deployment"]
    }
  },

  /**
   * 專案資料 - 核心數據
   */
  projects: {
    "ErCore": {
      projectId: "ErCore",
      projectName: "ErCore",
      description: "Er 系列核心框架",
      status: "active",
      priority: 1,
      progress: 30,

      // 專案元數據
      metadata: {
        startDate: "2025-01-15",
        lastUpdated: "2025-09-22",
        completeDate: null,
        repository: "https://github.com/mingxianliu/ErCore",
        featurePrefix: "ERC"
      },

      // 專案成員分配
      members: {
        "A-CC": {
          memberId: "A-CC",
          memberName: "KlauderA",
          role: "fullstack",
          assignedDate: "2025-01-15",
          tasks: ["全端開發"],
          personalNotes: [],
          isExecuting: true
        },
        "C-CS": {
          memberId: "C-CS",
          memberName: "KersirC",
          role: "testing",
          assignedDate: "2025-01-20",
          tasks: ["測試"],
          personalNotes: [],
          isExecuting: false
        }
      },

      // 專案歷程記錄
      memberHistory: [],

      // 專案備註 (JSON string)
      notes: "[]",

      // 核心完整度指標
      coreMetrics: {
        frontend: { progress: 30, status: "🚧 進行中", tasks: [] },
        backend: { progress: 35, status: "🚧 進行中", tasks: [] },
        database: { progress: 25, status: "🚧 進行中", tasks: [] },
        deployment: { progress: 40, status: "🚧 進行中", tasks: [] },
        validation: { progress: 20, status: "🎯 規劃中", tasks: [] }
      },

      // 功能清單
      features: {
        completed: [],
        inProgress: [],
        planned: []
      },

      // 已知問題
      issues: [],

      // GitHub 數據 (從 GitHub API 同步)
      github: {
        owner: "mingxianliu",
        repo: "ErCore",
        stars: 0,
        forks: 0,
        openIssues: 0,
        language: "TypeScript",
        lastPush: null
      }
    },

    "ErPP": {
      projectId: "ErPP",
      projectName: "ErPP",
      description: "P2P Communication Platform",
      status: "active",
      priority: 2,
      progress: 45,

      metadata: {
        startDate: "2025-09-01",
        lastUpdated: "2025-10-05",
        completeDate: null,
        repository: "https://github.com/mingxianliu/ErPP",
        featurePrefix: "ERPP"
      },

      members: {
        "A-CI": {
          memberId: "A-CI",
          memberName: "KodesA",
          role: "fullstack",
          assignedDate: "2025-09-01",
          tasks: ["P2P 核心開發"],
          personalNotes: [],
          isExecuting: true
        },
        "C-GI": {
          memberId: "C-GI",
          memberName: "JaymenightC",
          role: "backend",
          assignedDate: "2025-09-01",
          tasks: ["後端微服務"],
          personalNotes: [],
          isExecuting: true
        },
        "B-CA": {
          memberId: "B-CA",
          memberName: "KersirAjenB",
          role: "frontend",
          assignedDate: "2025-09-10",
          tasks: ["前端介面"],
          personalNotes: [],
          isExecuting: false
        }
      },

      memberHistory: [],
      notes: "[]",

      coreMetrics: {
        frontend: { progress: 40, status: "🚧 進行中", tasks: [] },
        backend: { progress: 50, status: "🚧 進行中", tasks: [] },
        database: { progress: 30, status: "🚧 進行中", tasks: [] },
        deployment: { progress: 60, status: "🚧 進行中", tasks: [] },
        validation: { progress: 35, status: "🚧 進行中", tasks: [] }
      },

      features: {
        completed: [
          { code: "ERPP0001", name: "mDNS 自動發現", details: [] },
          { code: "ERPP0002", name: "WebRTC 基礎連接", details: [] },
          { code: "ERPP0003", name: "Docker 容器化", details: [] }
        ],
        inProgress: [
          { code: "ERPP0004", name: "Master/Slave 控制模式", progress: 60, details: [] },
          { code: "ERPP0005", name: "IPFS 分散式文件傳輸", progress: 40, details: [] },
          { code: "ERPP0006", name: "管理介面儀表板", progress: 50, details: [] }
        ],
        planned: [
          { code: "ERPP0007", name: "媒體流傳輸 (音頻/視頻)", details: [] },
          { code: "ERPP0008", name: "屏幕共享功能", details: [] },
          { code: "ERPP0009", name: "Prometheus 監控整合", details: [] }
        ]
      },

      issues: [
        "長時間離線節點重連後指令佇列同步延遲",
        "WebRTC 在某些 NAT 環境下連接失敗率偏高"
      ],

      github: {
        owner: "mingxianliu",
        repo: "ErPP",
        stars: 0,
        forks: 0,
        openIssues: 0,
        language: "TypeScript",
        lastPush: "2025-10-05T11:02:59+08:00"
      }
    }

    // ... 其他專案 (ErNexus, ErShield, ErTidy, SyncBC-Monorepo, iFMS-Frontend, EZOOM, iMonitoring)
  },

  /**
   * 研發記錄簿 (Dev Log)
   */
  devLog: {
    entries: [
      {
        id: "log_20251005_001",
        timestamp: "2025-10-05T10:30:00+08:00",
        author: "KlauderA",
        project: "ErPP",
        type: "feature", // feature | bugfix | note | milestone
        title: "完成 WebRTC 基礎連接實作",
        content: "實作 WebRTC Peer 連接建立機制，整合 simple-peer 函式庫。",
        tags: ["webrtc", "p2p"],
        relatedFeatures: ["ERPP0002"]
      }
      // ... 更多記錄
    ]
  },

  /**
   * 全局配置
   */
  config: {
    constraints: {
      oneRolePerProject: "每個成員在單一專案中只能擔任一個角色",
      availableRoles: ["frontend", "backend", "fullstack", "testing"],
      minMembersPerRole: 1,
      maxMembersPerRole: 3
    },

    statistics: {
      totalAssignments: 18,
      activeProjects: 9,
      completedProjects: 0,
      membersInUse: 18,
      availableMembers: 0
    }
  },

  /**
   * 元數據
   */
  metadata: {
    version: "2.0.0",
    schemaVersion: "unified-v1",
    lastSync: new Date().toISOString(),
    syncSource: "google-drive",
    dataIntegrity: {
      checksums: {},
      validatedAt: new Date().toISOString()
    }
  }
};

// =============================================================================
// 資料遷移工具
// =============================================================================

class DataMigrationTool {
  /**
   * 從舊格式遷移到統一格式
   */
  static async migrateFromLegacy() {
    console.log('🔄 開始資料遷移...');

    const unifiedData = {
      organization: UnifiedDataSchema.organization,
      members: {},
      roles: {},
      projects: {},
      devLog: { entries: [] },
      config: { constraints: {}, statistics: {} },
      metadata: {
        version: "2.0.0",
        schemaVersion: "unified-v1",
        lastSync: new Date().toISOString(),
        syncSource: "migration",
        dataIntegrity: {
          checksums: {},
          validatedAt: new Date().toISOString()
        }
      }
    };

    try {
      // 1. 遷移成員資料
      console.log('📦 遷移成員資料...');
      const teamMembersResponse = await fetch('config/team-members.json');
      if (teamMembersResponse.ok) {
        const teamData = await teamMembersResponse.json();
        unifiedData.members = teamData.members || {};
        unifiedData.roles = teamData.roles || {};
        unifiedData.organization.groups = teamData.groups || {};
        console.log('✅ 成員資料遷移完成');
      }

      // 2. 遷移專案分配
      console.log('📦 遷移專案分配資料...');
      const assignmentsResponse = await fetch('config/project-assignments.json');
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();

        // 轉換專案格式
        for (const [projectId, projectData] of Object.entries(assignmentsData.assignments || {})) {
          unifiedData.projects[projectId] = {
            projectId: projectData.projectId,
            projectName: projectData.projectName,
            description: "",
            status: projectData.status,
            priority: 1,
            progress: projectData.progress,

            metadata: {
              startDate: projectData.assignedDate || projectData.lastUpdated,
              lastUpdated: projectData.lastUpdated,
              completeDate: null,
              repository: `https://github.com/mingxianliu/${projectId}`,
              featurePrefix: this.getFeaturePrefix(projectId)
            },

            members: projectData.members || {},
            memberHistory: projectData.memberHistory || [],
            notes: projectData.notes || "[]",

            coreMetrics: {
              frontend: { progress: 0, status: "🎯 規劃中", tasks: [] },
              backend: { progress: 0, status: "🎯 規劃中", tasks: [] },
              database: { progress: 0, status: "🎯 規劃中", tasks: [] },
              deployment: { progress: 0, status: "🎯 規劃中", tasks: [] },
              validation: { progress: 0, status: "🎯 規劃中", tasks: [] }
            },

            features: {
              completed: [],
              inProgress: [],
              planned: []
            },

            issues: [],

            github: {
              owner: "mingxianliu",
              repo: projectId,
              stars: 0,
              forks: 0,
              openIssues: 0,
              language: "",
              lastPush: null
            }
          };
        }

        unifiedData.config.constraints = assignmentsData.constraints || {};
        unifiedData.config.statistics = assignmentsData.statistics || {};
        console.log('✅ 專案分配遷移完成');
      }

      // 3. 從 Markdown 檔案提取詳細資料
      console.log('📦 從 Markdown 檔案提取專案詳細資料...');
      for (const projectId of Object.keys(unifiedData.projects)) {
        try {
          const mdResponse = await fetch(`projects/${projectId}.md`);
          if (mdResponse.ok) {
            const mdContent = await mdResponse.text();
            const parsedData = this.parseMarkdownProject(mdContent);

            // 合併 Markdown 資料
            if (parsedData) {
              unifiedData.projects[projectId].coreMetrics = parsedData.coreMetrics || unifiedData.projects[projectId].coreMetrics;
              unifiedData.projects[projectId].features = parsedData.features || unifiedData.projects[projectId].features;
              unifiedData.projects[projectId].issues = parsedData.issues || [];
              unifiedData.projects[projectId].description = parsedData.description || "";
            }
          }
        } catch (error) {
          console.warn(`⚠️ 無法讀取 ${projectId}.md:`, error.message);
        }
      }

      console.log('✅ 資料遷移完成！');
      return unifiedData;

    } catch (error) {
      console.error('❌ 資料遷移失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取專案特徵前綴
   */
  static getFeaturePrefix(projectId) {
    const prefixMap = {
      'ErCore': 'ERC',
      'ErNexus': 'ERN',
      'ErShield': 'ERSH',
      'ErTidy': 'ERT',
      'ErPP': 'ERPP',
      'SyncBC-Monorepo': 'SBC',
      'iFMS-Frontend': 'IFMS',
      'EZOOM': 'EZ',
      'iMonitoring': 'IMON'
    };
    return prefixMap[projectId] || 'ER';
  }

  /**
   * 簡化的 Markdown 解析（複用 markdown-reader.js 的邏輯）
   */
  static parseMarkdownProject(content) {
    // 這裡可以複用 MarkdownProjectReader 的解析邏輯
    // 為簡化，暫時返回基本結構
    return {
      coreMetrics: {},
      features: { completed: [], inProgress: [], planned: [] },
      issues: [],
      description: ""
    };
  }

  /**
   * 驗證統一資料結構的完整性
   */
  static validateUnifiedData(data) {
    const errors = [];

    // 檢查必要欄位
    if (!data.organization) errors.push('缺少 organization');
    if (!data.members) errors.push('缺少 members');
    if (!data.projects) errors.push('缺少 projects');
    if (!data.metadata) errors.push('缺少 metadata');

    // 檢查專案完整性
    for (const [projectId, project] of Object.entries(data.projects || {})) {
      if (!project.projectId) errors.push(`專案 ${projectId} 缺少 projectId`);
      if (!project.members) errors.push(`專案 ${projectId} 缺少 members`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// 匯出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UnifiedDataSchema, DataMigrationTool };
}

if (typeof window !== 'undefined') {
  window.UnifiedDataSchema = UnifiedDataSchema;
  window.DataMigrationTool = DataMigrationTool;
}
