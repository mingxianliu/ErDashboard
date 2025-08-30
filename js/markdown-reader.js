// Markdown 檔案讀取和解析器
class MarkdownProjectReader {
    constructor() {
        this.projectsPath = './projects/';
    }

    // 解析 Markdown 專案檔案
    parseMarkdown(content, filename) {
        const lines = content.split('\n');
        const project = {
            id: filename.replace('.md', ''),
            name: '',
            status: '',
            progress: 0,
            lastUpdate: '',
            startDate: '',
            completeDate: '',
            features: {
                completed: [],
                inProgress: [],
                planned: []
            },
            issues: [],
            notes: '',
            milestone: ''
        };

        let currentSection = '';
        let currentFeatureType = '';

        for (let line of lines) {
            line = line.trim();
            
            // 解析專案標題
            if (line.startsWith('# ')) {
                project.name = line.substring(2);
                continue;
            }

            // 解析專案狀態資訊
            if (line.startsWith('**專案狀態：**')) {
                project.status = line.match(/\*\*(.*?)\*\*/g)?.[1]?.replace(/\*\*/g, '') || 
                               line.split('：')[1]?.trim() || '';
                continue;
            }

            if (line.startsWith('**完成度：**')) {
                const match = line.match(/(\d+)%/);
                project.progress = match ? parseInt(match[1]) : 0;
                continue;
            }

            if (line.startsWith('**最後更新：**')) {
                project.lastUpdate = line.split('：')[1]?.trim() || '';
                continue;
            }

            if (line.startsWith('**開始日期：**')) {
                project.startDate = line.split('：')[1]?.trim() || '';
                continue;
            }

            if (line.startsWith('**完成日期：**')) {
                project.completeDate = line.split('：')[1]?.trim() || '';
                continue;
            }

            // 解析功能區塊
            if (line.includes('已完成功能')) {
                currentFeatureType = 'completed';
                continue;
            }

            if (line.includes('進行中功能')) {
                currentFeatureType = 'inProgress';
                continue;
            }

            if (line.includes('待開發功能')) {
                currentFeatureType = 'planned';
                continue;
            }

            // 解析功能項目
            if (line.startsWith('- **') && currentFeatureType) {
                const featureMatch = line.match(/\*\*(.*?)\*\*\s*-\s*(.*)/);
                if (featureMatch) {
                    const feature = {
                        code: featureMatch[1],
                        name: featureMatch[2],
                        status: currentFeatureType,
                        progress: currentFeatureType === 'completed' ? 100 : 0,
                        details: []
                    };
                    project.features[currentFeatureType].push(feature);
                }
                continue;
            }

            // 解析功能詳細內容
            if (line.startsWith('  - ') && currentFeatureType && project.features[currentFeatureType].length > 0) {
                const lastFeature = project.features[currentFeatureType][project.features[currentFeatureType].length - 1];
                lastFeature.details.push(line.substring(4));
                continue;
            }

            // 解析進度資訊
            if (line.includes('進度：') && currentFeatureType === 'inProgress' && project.features.inProgress.length > 0) {
                const progressMatch = line.match(/進度：\s*(\d+)%/);
                if (progressMatch) {
                    const lastFeature = project.features.inProgress[project.features.inProgress.length - 1];
                    lastFeature.progress = parseInt(progressMatch[1]);
                }
                continue;
            }

            // 解析已知問題
            if (line.startsWith('- ') && currentSection === 'issues') {
                project.issues.push(line.substring(2));
                continue;
            }

            // 識別區塊
            if (line.includes('已知問題')) {
                currentSection = 'issues';
                continue;
            }

            if (line.includes('開發筆記')) {
                currentSection = 'notes';
                continue;
            }

            if (line.includes('下個里程碑')) {
                currentSection = 'milestone';
                continue;
            }

            // 解析開發筆記
            if (line.startsWith('- ') && currentSection === 'notes') {
                project.notes += line.substring(2) + '\n';
                continue;
            }

            // 解析里程碑
            if (line.startsWith('**目標') && currentSection === 'milestone') {
                project.milestone += line + '\n';
                continue;
            }
        }

        return project;
    }

    // 讀取所有專案檔案
    async loadAllProjects() {
        try {
            // 獲取專案檔案列表
            const projectFiles = [
                'ErAid-Ecosystem.md',
                'ErTidy.md',
                'ErAI.md',
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
                // 未來可以動態獲取 projects/ 目錄下的所有 .md 檔案
            ];

            const projects = [];

            for (const filename of projectFiles) {
                try {
                    const response = await fetch(`${this.projectsPath}${filename}`);
                    if (response.ok) {
                        const content = await response.text();
                        const project = this.parseMarkdown(content, filename);
                        projects.push(project);
                    }
                } catch (error) {
                    console.warn(`無法載入專案檔案: ${filename}`, error);
                }
            }

            return projects;
        } catch (error) {
            console.error('載入專案資料失敗:', error);
            return [];
        }
    }

    // 計算專案統計資訊
    calculateProjectStats(project) {
        const totalFeatures = 
            project.features.completed.length + 
            project.features.inProgress.length + 
            project.features.planned.length;

        const completedFeatures = project.features.completed.length;
        const inProgressFeatures = project.features.inProgress.length;

        return {
            totalFeatures,
            completedFeatures,
            inProgressFeatures,
            completionRate: totalFeatures > 0 ? Math.round((completedFeatures / totalFeatures) * 100) : 0,
            issuesCount: project.issues.length
        };
    }

    // 取得專案狀態圖示
    getStatusIcon(status) {
        const statusMap = {
            '✅ 已完成': 'fa-check-circle text-success',
            '🚧 進行中': 'fa-cog fa-spin text-warning', 
            '🎯 規劃中': 'fa-bullseye text-info',
            '⏸️ 暫停': 'fa-pause-circle text-secondary',
            '❌ 取消': 'fa-times-circle text-danger'
        };

        // 移除表情符號，只保留狀態文字
        const cleanStatus = status.replace(/^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]\s*/gu, '');
        
        return statusMap[status] || 'fa-question-circle text-muted';
    }
}

// 導出給其他模組使用
if (typeof window !== 'undefined') {
    window.MarkdownProjectReader = MarkdownProjectReader;
}