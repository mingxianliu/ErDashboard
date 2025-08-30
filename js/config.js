// 專案監控配置（依需求調整 repositories）
const CONFIG = {
    // 要監控的專案清單 - 支援動態過濾設定
    repositories: (function() {
        // 從 localStorage 讀取過濾設定
        const filterConfig = JSON.parse(localStorage.getItem('REPO_FILTER') || '{}');
        const pattern = filterConfig.pattern || "Er*";
        const name = filterConfig.name || "Er 專案群";
        
        return [
            // 使用萬用字元（自動展開為多個 repo）
            {
                name: name,
                owner: "mingxianliu",
                repoPattern: pattern,      // 使用動態 pattern
                description: `自動匹配所有符合 ${pattern} 模式的 repo`,
                color: "#17a2b8",
                priority: 1,
            prefixRules: [
                { pattern: "ErCore*",    prefix: "ERC" },
                { pattern: "ErAI*",      prefix: "ERA" },
                { pattern: "ErAid-Ecosystem*", prefix: "ERAI" },
                { pattern: "ErForge*",   prefix: "ERF" },
                { pattern: "ErTidy*",    prefix: "ERT" },
                { pattern: "ErGrant*",   prefix: "ERG" },
                { pattern: "ErStore*",   prefix: "ERS" },
                { pattern: "ErSlice*",   prefix: "ERSL" },
                { pattern: "ErShield*",  prefix: "ERSH" },
                { pattern: "ErShowcase*",prefix: "ERSC" },
                { pattern: "ErProphet*", prefix: "ERP" },
                { pattern: "*",          prefix: "ER" }
            ],
            colorRules: [
                { pattern: "ErCore*",    color: "#ff6b6b" },
                { pattern: "ErAI*",      color: "#845ef7" },
                { pattern: "ErAid-Ecosystem*", color: "#fd7e14" },
                { pattern: "ErForge*",   color: "#6f42c1" },
                { pattern: "ErTidy*",    color: "#20c997" },
                { pattern: "ErGrant*",   color: "#e83e8c" },
                { pattern: "ErStore*",   color: "#007bff" },
                { pattern: "ErSlice*",   color: "#dc3545" },
                { pattern: "ErShield*",  color: "#343a40" },
                { pattern: "ErShowcase*",color: "#ffc107" },
                { pattern: "ErProphet*", color: "#6610f2" },
                { pattern: "*",          color: "#17a2b8" }
            ]
            }
        ];
    })(),

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
