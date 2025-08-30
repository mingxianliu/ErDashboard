class ProjectDashboard {
    constructor() {
        this.github = new GitHubAPI(CONFIG.github.token);
        this.data = {
            lastUpdate: null,
            projects: [],
            summary: {
                totalProjects: 0,
                totalFeatures: 0,
                completedFeatures: 0,
                inProgressFeatures: 0,
                overallProgress: 0
            },
            recentActivity: []
        };
        this.init();
    }

    async init() {
        // 先嘗試載入本地資料
        await this.loadLocalData();

        // 如果沒有本地資料，即時收集
        if (!this.data.projects.length) {
            await this.collectData();
        }

        this.render();
        this.setupEventListeners();
        this.startAutoRefresh();
    }

    async loadLocalData() {
        try {
            const response = await fetch('data/progress.json?t=' + Date.now());
            if (response.ok) {
                this.data = await response.json();
                console.log('載入本地資料成功');
            }
        } catch (error) {
            console.log('本地資料載入失敗，將即時收集資料');
        }
    }

    async collectData() {
        console.log('開始收集專案資料...');
        this.showLoading(true);

        const projects = [];
        const allActivity = [];

        // 先解析萬用字元（repoPattern）成具體 repo 清單
        const resolvedRepos = await this.resolveRepositories(CONFIG.repositories);

        for (const repoConfig of resolvedRepos) {
            try {
                console.log(`收集 ${repoConfig.name} 的資料...`);

                // 並行取得 repository 資訊和 issues
                const [repoInfo, issues] = await Promise.all([
                    this.github.getRepository(repoConfig.owner, repoConfig.repo),
                    this.github.getAllIssues(repoConfig.owner, repoConfig.repo)
                ]);

                // 分析功能進度
                const features = this.github.analyzeFeatureProgress(issues, repoConfig.featurePrefix);

                // 計算專案統計
                const stats = this.calculateProjectStats(features);

                // 收集最近活動（近 7 天）
                const recentIssues = issues
                    .filter(issue => {
                        const updatedDate = new Date(issue.updated_at);
                        const sevenDaysAgo = new Date();
                        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                        return updatedDate > sevenDaysAgo;
                    })
                    .slice(0, 5);

                recentIssues.forEach(issue => {
                    allActivity.push({
                        project: repoConfig.name,
                        title: issue.title,
                        action: issue.state === 'closed' ? '完成' : '更新',
                        url: issue.html_url,
                        updated: issue.updated_at,
                        assignee: issue.assignee ? issue.assignee.login : null
                    });
                });

                projects.push({
                    config: repoConfig,
                    info: {
                        name: repoInfo.name,
                        description: repoInfo.description,
                        stars: repoInfo.stargazers_count,
                        forks: repoInfo.forks_count,
                        openIssues: repoInfo.open_issues_count,
                        language: repoInfo.language,
                        lastPush: repoInfo.pushed_at
                    },
                    features: features,
                    stats: stats
                });

            } catch (error) {
                console.error(`收集 ${repoConfig.name} 資料失敗:`, error);
                // 即使失敗也要加入基本資訊
                projects.push({
                    config: repoConfig,
                    info: { name: repoConfig.name, description: repoConfig.description },
                    features: {},
                    stats: { total: 0, completed: 0, inProgress: 0, progress: 0 },
                    error: error.message
                });
            }
        }

        // 排序活動按時間
        allActivity.sort((a, b) => new Date(b.updated) - new Date(a.updated));

        this.data = {
            lastUpdate: new Date().toISOString(),
            projects: projects,
            summary: this.calculateOverallSummary(projects),
            recentActivity: allActivity.slice(0, 10)
        };

        this.showLoading(false);
        console.log('資料收集完成');
    }

    async resolveRepositories(repos) {
        const resolved = [];
        // 萬用字元匹配工具
        const match = (name, pattern) => {
            const escaped = pattern.replace(/[.+^${}()|\[\]\\]/g, '\\$&');
            const regex = new RegExp('^' + escaped.replace(/\*/g, '.*') + '$');
            return regex.test(name);
        };

        for (const item of repos) {
            if (item.repoPattern && item.owner) {
                try {
                    const allRepos = await this.github.listOwnerReposAll(item.owner);
                    const matched = this.github.filterReposByPattern(allRepos, item.repoPattern);
                    matched.forEach(r => {
                        // 依規則決定前綴與顏色
                        let prefix = item.featurePrefix || 'ER';
                        if (Array.isArray(item.prefixRules)) {
                            for (const rule of item.prefixRules) {
                                if (match(r.name, rule.pattern)) { prefix = rule.prefix; break; }
                            }
                        }
                        let color = item.color || '#36b9cc';
                        if (Array.isArray(item.colorRules)) {
                            for (const rule of item.colorRules) {
                                if (match(r.name, rule.pattern)) { color = rule.color; break; }
                            }
                        }
                        resolved.push({
                            name: item.name ? `${item.name} - ${r.name}` : r.name,
                            owner: item.owner,
                            repo: r.name,
                            description: item.description || r.description || '',
                            featurePrefix: prefix,
                            color: color,
                            priority: item.priority || 999
                        });
                    });
                } catch (e) {
                    console.error('解析 repoPattern 失敗:', e);
                }
            } else {
                resolved.push(item);
            }
        }
        return resolved;
    }

    calculateProjectStats(features) {
        const total = Object.keys(features).length;
        const completed = Object.values(features).filter(f => f.status === 'closed').length;
        const inProgress = Object.values(features).filter(f => f.status === 'open').length;
        return {
            total,
            completed,
            inProgress,
            progress: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }

    calculateOverallSummary(projects) {
        const totalProjects = projects.length;
        const totalFeatures = projects.reduce((sum, p) => sum + p.stats.total, 0);
        const completedFeatures = projects.reduce((sum, p) => sum + p.stats.completed, 0);
        const inProgressFeatures = projects.reduce((sum, p) => sum + p.stats.inProgress, 0);
        const overallProgress = totalFeatures > 0 ? Math.round((completedFeatures / totalFeatures) * 100) : 0;
        return {
            totalProjects,
            totalFeatures,
            completedFeatures,
            inProgressFeatures,
            overallProgress
        };
    }

    render() {
        this.renderSummary();
        this.renderProjects();
        this.renderRecentActivity();
        this.updateLastUpdateTime();
        // 顯示內容，隱藏載入狀態
        document.getElementById('summaryCards').style.display = 'flex';
        document.getElementById('projectsList').style.display = 'flex';
        document.getElementById('recentActivity').style.display = 'block';
    }

    renderSummary() {
        const summary = this.data.summary;
        document.getElementById('totalProjects').textContent = summary.totalProjects;
        document.getElementById('completedFeatures').textContent = summary.completedFeatures;
        document.getElementById('inProgressFeatures').textContent = summary.inProgressFeatures;
        document.getElementById('overallProgress').textContent = summary.overallProgress + '%';
    }

    renderProjects() {
        const container = document.getElementById('projectsList');
        container.innerHTML = '';
        this.data.projects.forEach(project => {
            const projectCard = this.createProjectCard(project);
            container.appendChild(projectCard);
        });
    }

    createProjectCard(project) {
        const card = document.createElement('div');
        card.className = 'col-xl-6 col-lg-6 mb-4';

        const progressBarColor = project.stats.progress >= 80 ? 'success' :
                                project.stats.progress >= 50 ? 'warning' : 'info';

        const featuresHtml = Object.entries(project.features).map(([code, feature]) => {
            const statusInfo = CONFIG.statusMapping[feature.status] || { status: feature.status, color: '#6c757d', icon: '❓' };
            return `
                <div class="col-md-6 mb-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge" style="background-color: ${project.config.color}">${code}</span>
                        <small class="text-muted">${statusInfo.icon} ${statusInfo.status}</small>
                    </div>
                    <small class="d-block text-truncate" title="${feature.title}">
                        ${feature.title || '未命名功能'}
                    </small>
                </div>
            `;
        }).join('');

        card.innerHTML = `
            <div class="card shadow h-100">
                <div class="card-header" style="background-color: ${project.config.color}; color: white;">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="mb-0 text-white">
                            <i class="fas fa-project-diagram me-2"></i>
                            ${project.config.name}
                        </h6>
                        <small class="text-white-50">
                            ${project.stats.completed}/${project.stats.total} 完成
                        </small>
                    </div>
                </div>
                <div class="card-body">
                    <p class="text-muted small mb-3">${project.config.description || ''}</p>

                    <div class="mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <span class="text-sm font-weight-bold">進度</span>
                            <span class="text-sm font-weight-bold">${project.stats.progress}%</span>
                        </div>
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar bg-${progressBarColor}" style="width: ${project.stats.progress}%"></div>
                        </div>
                    </div>

                    ${Object.keys(project.features).length > 0 ? `
                        <div class="row">
                            ${featuresHtml}
                        </div>
                    ` : `
                        <div class="text-center text-muted py-3">
                            <i class="fas fa-info-circle me-2"></i>
                            尚未發現功能代碼
                        </div>
                    `}

                    ${project.error ? `
                        <div class="alert alert-warning mt-2" role="alert">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            ${project.error}
                        </div>
                    ` : ''}
                </div>
                <div class="card-footer text-muted">
                    <div class="row">
                        <div class="col-6">
                            <small><i class="fas fa-star me-1"></i> ${project.info.stars || 0}</small>
                        </div>
                        <div class="col-6 text-end">
                            <small><i class="fas fa-code-branch me-1"></i> ${project.info.forks || 0}</small>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return card;
    }

    renderRecentActivity() {
        const container = document.getElementById('activityList');
        if (this.data.recentActivity.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">暫無最近活動</p>';
            return;
        }
        const activityHtml = this.data.recentActivity.map(activity => {
            const timeAgo = this.getTimeAgo(activity.updated);
            return `
                <div class="d-flex align-items-center py-2 border-bottom">
                    <div class="me-3">
                        <i class="fas fa-${activity.action === '完成' ? 'check-circle text-success' : 'edit text-primary'}"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="fw-bold">${activity.project}</div>
                        <div class="text-muted small">${activity.title}</div>
                    </div>
                    <div class="text-end">
                        <div class="badge bg-light text-dark">${activity.action}</div>
                        <div class="text-muted small">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');
        container.innerHTML = activityHtml;
    }

    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} 分鐘前`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} 小時前`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} 天前`;
        }
    }

    updateLastUpdateTime() {
        if (this.data.lastUpdate) {
            const updateTime = new Date(this.data.lastUpdate).toLocaleString('zh-TW');
            document.getElementById('lastUpdate').textContent = `最後更新: ${updateTime}`;
        }
    }

    showLoading(show) {
        document.getElementById('loadingSpinner').style.display = show ? 'block' : 'none';
    }

    setupEventListeners() {
        const btn = document.getElementById('refreshBtn');
        if (!btn) return;
        btn.addEventListener('click', async () => {
            await this.collectData();
            this.render();
        });
        
        // 添加鍵盤快捷鍵支援
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + E: 導出數據
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                this.exportData();
            }
            // Ctrl/Cmd + R: 重新載入
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.collectData().then(() => this.render());
            }
        });
    }
    
    exportData() {
        const exportData = {
            exportTime: new Date().toISOString(),
            ...this.data
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        // 顯示導出成功提示
        this.showNotification('數據已成功導出！', 'success');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} position-fixed top-0 start-50 translate-middle-x mt-3`;
        notification.style.zIndex = '9999';
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'} me-2"></i>
            ${message}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    startAutoRefresh() {
        if (CONFIG.autoRefresh.enabled) {
            setInterval(async () => {
                console.log('自動重新載入資料...');
                await this.loadLocalData();
                this.render();
            }, CONFIG.autoRefresh.interval);
        }
    }
}

// 啟動 Dashboard
document.addEventListener('DOMContentLoaded', () => {
    new ProjectDashboard();
});
