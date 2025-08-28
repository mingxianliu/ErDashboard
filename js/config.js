// 專案監控配置（依需求調整 repositories）
const CONFIG = {
    // 要監控的專案清單
    repositories: [
        // 使用萬用字元（自動展開為多個 repo）
        {
            name: "Er 專案群",
            owner: "mingxianliu",
            repoPattern: "Er*",      // 使用 * 做前綴匹配
            description: "自動匹配所有以 Er 開頭的 repo",
            featurePrefix: "ER",     // 套用統一的功能代碼前綴
            color: "#17a2b8",
            priority: 1
        },
        {
            name: "裝備管理系統",
            owner: "your-org",
            repo: "equipment-management",
            description: "消防裝備管理與維護系統",
            featurePrefix: "EMSB",
            color: "#28a745",
            priority: 1
        },
        {
            name: "證照管理系統",
            owner: "your-org",
            repo: "license-management",
            description: "人員證照追蹤與管理系統",
            featurePrefix: "EMST",
            color: "#007bff",
            priority: 2
        },
        {
            name: "人員管理系統",
            owner: "your-org",
            repo: "personnel-management",
            description: "人員資料與排班管理系統",
            featurePrefix: "EMSP",
            color: "#ffc107",
            priority: 3
        }
    ],

    // 功能狀態對應
    statusMapping: {
        "open": { status: "進行中", color: "#ffc107", icon: "⚠️" },
        "closed": { status: "完成", color: "#28a745", icon: "✅" },
        "draft": { status: "待開發", color: "#6c757d", icon: "📝" }
    },

    // GitHub API 設定
    github: {
        apiUrl: "https://api.github.com",
        // 如果是私有 repo，需要設定 token（可使用 localStorage.setItem('PD_TOKEN','ghp_...')）
        token: (typeof localStorage !== 'undefined' && localStorage.getItem('PD_TOKEN')) || null
    },

    // 更新設定
    autoRefresh: {
        enabled: true,
        interval: 5 * 60 * 1000 // 5分鐘
    }
};
