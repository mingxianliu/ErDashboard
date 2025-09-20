/**
 * 簡化版 Dashboard - 直接使用 JSON 資料
 */

class MarkdownProjectDashboard {
    constructor() {
        this.data = { projects: [] };
        this.init();
    }

    async init() {
        try {
            console.log('🚀 初始化簡化版 Dashboard...');

            // 等待 teamDataManager 初始化
            await this.waitForTeamDataManager();

            // 載入專案資料
            this.loadProjectsFromJSON();

            // 渲染介面
            this.render();

            console.log('[OK] Dashboard 載入完成');
        } catch (error) {
            console.error('[ERROR] Dashboard 載入失敗:', error);
        }
    }

    async waitForTeamDataManager() {
        let attempts = 0;
        const maxAttempts = 50;

        while (attempts < maxAttempts) {
            if (window.teamDataManager && window.teamDataManager.isReady()) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        console.warn('⚠️ teamDataManager 初始化超時');
    }

    loadProjectsFromJSON() {
        console.log('📖 從 JSON 載入專案資料...');

        const assignments = window.teamDataManager && window.teamDataManager.isReady()
            ? window.teamDataManager.getAllAssignments()
            : {};

        this.data.projects = Object.values(assignments).map(project => {
            const memberCount = Object.keys(project.members || {}).length;
            // 使用手動設定的進度，如果沒有設定則使用自動計算
            const progress = project.progress !== undefined ? project.progress :
                Math.min(Math.round((memberCount / 4) * 100), 100);

            // 取得成員名稱列表
            const memberNames = Object.values(project.members || {}).map(member => {
                const memberInfo = window.teamDataManager.getAllMembers()[member.memberId];
                return memberInfo ? `${memberInfo.name}(${member.role})` : member.memberId;
            });

            return {
                id: project.projectId,
                name: project.projectName,
                status: project.status,
                progress: progress,
                memberCount: memberCount,
                members: project.members || {},
                memberNames: memberNames
            };
        });

        console.log(`✅ 載入了 ${this.data.projects.length} 個專案`);
    }

    render() {
        this.renderSummaryCards();
        this.renderProjectsList();

        // 隱藏載入狀態
        document.getElementById('loadingSpinner').style.display = 'none';
    }

    renderSummaryCards() {
        const summaryCards = document.getElementById('summaryCards');
        const projects = this.data.projects;

        const totalProjects = projects.length;
        const activeProjects = projects.filter(p => p.status === 'active').length;
        const totalMembers = projects.reduce((sum, p) => sum + p.memberCount, 0);
        const avgProgress = projects.length > 0 ?
            Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length) : 0;

        summaryCards.innerHTML = `
            <div class="col-lg-3 col-md-6 mb-4">
                <div class="card bg-primary text-white h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <div class="h4 mb-0">${totalProjects}</div>
                                <div>總專案數</div>
                            </div>
                            <div class="h1 opacity-50">
                                <i class="fas fa-project-diagram"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-4">
                <div class="card bg-success text-white h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <div class="h4 mb-0">${activeProjects}</div>
                                <div>進行中專案</div>
                            </div>
                            <div class="h1 opacity-50">
                                <i class="fas fa-cog fa-spin"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-4">
                <div class="card bg-info text-white h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <div class="h4 mb-0">${totalMembers}</div>
                                <div>總成員數</div>
                            </div>
                            <div class="h1 opacity-50">
                                <i class="fas fa-users"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6 mb-4">
                <div class="card bg-warning text-white h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <div class="h4 mb-0">${avgProgress}%</div>
                                <div>平均進度</div>
                            </div>
                            <div class="h1 opacity-50">
                                <i class="fas fa-chart-line"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        summaryCards.style.display = 'flex';
        console.log('✅ Summary Cards 渲染完成');
    }

    renderProjectsList() {
        const projectsList = document.getElementById('projectsList');
        const projects = this.data.projects;

        if (projects.length === 0) {
            projectsList.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <h5>沒有專案資料</h5>
                </div>
            `;
            projectsList.style.display = 'block';
            return;
        }

        let html = '';
        projects.forEach(project => {
            html += `
                <div class="col-xl-3 col-lg-6 col-md-6 col-sm-12 mb-4">
                    <div class="card h-100">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6 class="mb-0">
                                <i class="fas fa-project-diagram me-2"></i>
                                ${project.name.split(' - ')[0]}
                            </h6>
                            <span class="badge bg-primary">${project.progress}%</span>
                        </div>
                        <div class="card-body">
                            <div class="progress mb-3" style="height: 8px;">
                                <div class="progress-bar" style="width: ${project.progress}%"></div>
                            </div>
                            <p class="text-muted small mb-2">狀態: ${project.status}</p>
                            <p class="text-muted small mb-2">團隊成員: ${project.memberCount} 人</p>
                            ${project.memberNames.length > 0 ? `
                                <div class="small">
                                    ${project.memberNames.map(name => `
                                        <span class="badge bg-light text-dark me-1 mb-1">${name}</span>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });

        projectsList.innerHTML = `<div class="row">${html}</div>`;
        projectsList.style.display = 'block';
        console.log('✅ Projects List 渲染完成');
    }
}

// 全域初始化
window.markdownDashboard = new MarkdownProjectDashboard();