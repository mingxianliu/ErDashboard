#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectsDir = '../projects';
const projectFiles = [
    'ErAid-Ecosystem.md',
    'ErTidy.md',
    'ErAPI.md',
    'ErStarters.md',
    'ErSlice.md',
    'ErForge.md',
    'ErProphet.md',
    'ErShowcase.md',
    'ErGrant.md',
    'ErShield.md',
    'ErStore.md',
    'ErUI.md',
    'ErCore.md'
];

// 不同專案的特定內容配置
const projectConfigs = {
    'ErAid-Ecosystem.md': {
        title: 'ErAid-Ecosystem - AI輔助生態系統',
        frontend: ['生態系統管理界面', '多AI模型整合介面', '使用者Dashboard', '系統監控面板'],
        backend: ['AI模型協調服務', '資源調度引擎', '數據處理管道', '系統集成API'],
        database: ['模型註冊表', '任務執行記錄', '用戶行為數據', '系統性能指標'],
        deployment: ['多容器編排', '服務發現配置', '負載均衡設置', '自動故障恢復'],
        validation: ['生態系統整合測試', 'AI模型協作驗證', '系統穩定性測試', '用戶體驗測試'],
        features: ['EAE0001 - 核心生態系統架構設計', 'EAE0002 - AI模型整合介面', 'EAE0003 - 使用者管理系統', 'EAE0004 - 資料處理管線', 'EAE0005 - API閘道器']
    },
    'ErTidy.md': {
        title: 'ErTidy - 智能整理工具',
        frontend: ['檔案管理界面', '智能分類展示', '批量操作介面', '設定管理頁面'],
        backend: ['檔案分析引擎', '智能分類算法', '批量處理服務', '系統配置API'],
        database: ['檔案元數據', '分類規則庫', '用戶設定', '操作歷史記錄'],
        deployment: ['本地部署方案', '雲端服務配置', '跨平台支持', '自動更新機制'],
        validation: ['檔案處理準確性測試', '大數據量壓力測試', '多平台兼容性測試', '使用者工作流測試'],
        features: ['ETD0001 - 檔案自動分類功能', 'ETD0002 - 重複檔案偵測與清理', 'ETD0003 - 智能命名建議', 'ETD0004 - 批次處理介面', 'ETD0005 - 備份與還原機制']
    },
    'ErAPI.md': {
        title: 'ErAPI - 統一API閘道器',
        frontend: ['API管理控制台', '監控儀表板', '開發者文檔界面', '測試工具介面'],
        backend: ['請求路由引擎', '認證授權服務', '速率限制系統', 'API版本管理'],
        database: ['API註冊表', '請求日誌', '用戶憑證', '配置數據'],
        deployment: ['高可用部署', '容器化配置', 'API網關集群', '監控告警系統'],
        validation: ['API功能測試', '性能壓力測試', '安全性滲透測試', '兼容性測試'],
        features: ['ERA0001 - RESTful API框架', 'ERA0002 - GraphQL整合', 'ERA0003 - 認證與授權系統', 'ERA0004 - 速率限制與快取', 'ERA0005 - API文檔自動生成']
    },
    'ErStarters.md': {
        title: 'ErStarters - 專案啟動器',
        frontend: ['模板管理界面', '專案配置頁面', '生成進度顯示', '歷史記錄查看'],
        backend: ['模板引擎', '專案生成器', '配置管理服務', 'CLI工具核心'],
        database: ['模板庫', '專案配置', '使用統計', '版本記錄'],
        deployment: ['CLI工具發佈', '模板CDN分發', '更新機制', '跨平台支持'],
        validation: ['模板生成測試', '配置正確性驗證', '跨平台兼容性測試', 'CLI工具集成測試'],
        features: ['ESR0001 - 專案模板管理系統', 'ESR0002 - 自動化專案初始化', 'ESR0003 - 配置檔案生成器', 'ESR0004 - 依賴管理工具', 'ESR0005 - CLI工具開發']
    }
};

function updateProjectFile(filename) {
    const filePath = path.join(__dirname, projectsDir, filename);
    
    if (!fs.existsSync(filePath)) {
        console.log(`❌ 找不到檔案: ${filename}`);
        return;
    }

    const config = projectConfigs[filename];
    if (!config) {
        console.log(`⚠️ 沒有找到 ${filename} 的配置，跳過更新`);
        return;
    }

    const originalContent = fs.readFileSync(filePath, 'utf8');
    const lines = originalContent.split('\n');
    
    // 找到狀態、完成度等基本資訊
    let projectStatus = '🎯 規劃中';
    let lastUpdate = '2025-08-30';
    let startDate = '2025-08-30';
    
    for (const line of lines) {
        if (line.includes('**專案狀態：**')) {
            const match = line.match(/\*\*(.*?)\*\*/g);
            if (match && match[1]) {
                projectStatus = match[1].replace(/\*\*/g, '');
            }
        }
        if (line.includes('**最後更新：**')) {
            lastUpdate = line.split('：')[1]?.trim() || '2025-08-30';
        }
        if (line.includes('**開始日期：**')) {
            startDate = line.split('：')[1]?.trim() || '2025-08-30';
        }
    }

    const newContent = `# ${config.title}

**專案狀態：** ${projectStatus}  
**整體完成度：** 0%  
**最後更新：** ${lastUpdate}  
**開始日期：** ${startDate}  

## 🏗️ 核心完整度指標

### 1. 🎨 前端開發
**完成度：** 0%  
**狀態：** 🎯 規劃中  
${config.frontend.map(item => `- [ ] ${item}`).join('\n')}

### 2. ⚙️ 後端開發  
**完成度：** 0%  
**狀態：** 🎯 規劃中  
${config.backend.map(item => `- [ ] ${item}`).join('\n')}

### 3. 🗃️ 資料庫
**完成度：** 0%  
**狀態：** 🎯 規劃中  
${config.database.map(item => `- [ ] ${item}`).join('\n')}

### 4. 🚀 部署
**完成度：** 0%  
**狀態：** 🎯 規劃中  
${config.deployment.map(item => `- [ ] ${item}`).join('\n')}

### 5. ✅ 驗證
**完成度：** 0%  
**狀態：** 🎯 規劃中  
${config.validation.map(item => `- [ ] ${item}`).join('\n')}

## 📋 功能清單

### ✅ 已完成功能
- 待新增已完成功能

### 🚧 進行中功能  
- 待新增進行中功能

### 📝 待開發功能
${config.features.map(item => `- **${item}`).join('\n')}

## 🐛 已知問題
- 待發現並記錄問題

## 📝 開發筆記
- 使用的技術棧：待確認
- 重要的設計決策：待記錄
- 學習到的經驗：待累積

## 🎯 下個里程碑
**目標日期：** 2025-09-30  
**目標功能：** 完成核心功能架構設計與基礎模組開發
`;

    fs.writeFileSync(filePath, newContent);
    console.log(`✅ 已更新: ${filename}`);
}

// 執行更新
console.log('🚀 開始批量更新專案檔案...');
projectFiles.forEach(updateProjectFile);
console.log('🎉 批量更新完成！');