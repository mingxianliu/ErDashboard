// 基於 Markdown 檔案的專案 Dashboard
class MarkdownProjectDashboard {
    constructor() {
        this.reader = new MarkdownProjectReader();
        this.data = {
            lastUpdate: new Date().toISOString(),
            projects: [],
            summary: {
                totalProjects: 0,
                totalFeatures: 0,
                completedFeatures: 0,
                inProgressFeatures: 0,
                overallProgress: 0
            }
        };
        this.init();
    }

    async init() {
        console.log('🚀 啟動 Markdown Dashboard...');
        
        // 顯示載入中
        this.showLoading();
        
        try {
            // 載入專案資料
            await this.loadProjectsFromMarkdown();
            
            // 計算統計資料
            this.calculateSummary();
            
            // 渲染介面
            this.render();
            
            // 設定事件監聽
            this.setupEventListeners();
            
            console.log('✅ Dashboard 載入完成');
            
        } catch (error) {
            console.error('❌ Dashboard 載入失敗:', error);
            this.showError('載入專案資料失敗: ' + error.message);
        }
    }

    showLoading() {
        document.getElementById('loadingSpinner').style.display = 'block';
        document.getElementById('summaryCards').style.display = 'none';
        document.getElementById('projectsList').style.display = 'none';
    }

    async loadProjectsFromMarkdown() {
        console.log('📖 載入 Markdown 專案檔案...');
        this.data.projects = await this.reader.loadAllProjects();
        console.log(`✅ 載入了 ${this.data.projects.length} 個專案`);
    }

    calculateSummary() {
        const summary = {
            totalProjects: this.data.projects.length,
            totalFeatures: 0,
            completedFeatures: 0,
            inProgressFeatures: 0,
            overallProgress: 0
        };

        for (const project of this.data.projects) {
            const stats = this.reader.calculateProjectStats(project);
            summary.totalFeatures += stats.totalFeatures;
            summary.completedFeatures += stats.completedFeatures;
            summary.inProgressFeatures += stats.inProgressFeatures;
        }

        summary.overallProgress = summary.totalFeatures > 0 ? 
            Math.round((summary.completedFeatures / summary.totalFeatures) * 100) : 0;

        this.data.summary = summary;
    }

    render() {
        // 隱藏載入動畫
        document.getElementById('loadingSpinner').style.display = 'none';
        
        // 渲染統計卡片
        this.renderSummaryCards();
        
        // 渲染專案列表
        this.renderProjectsList();
        
        // 更新最後更新時間
        this.updateLastUpdateTime();
    }

    renderSummaryCards() {
        const summaryCards = document.getElementById('summaryCards');
        const projects = this.data.projects;

        // 計算各領域進度最落後的3個專案
        const getBottomProjects = (metricKey, count = 3) => {
            return projects
                .filter(p => p.coreMetrics && p.coreMetrics[metricKey])
                .sort((a, b) => a.coreMetrics[metricKey].progress - b.coreMetrics[metricKey].progress)
                .slice(0, count);
        };

        const frontendBottom = getBottomProjects('frontend');
        const backendBottom = getBottomProjects('backend');
        const databaseBottom = getBottomProjects('database');
        const deploymentBottom = getBottomProjects('deployment');
        const validationBottom = getBottomProjects('validation');
        const totalProjects = projects.length;
        
        summaryCards.innerHTML = `
            <div class="col-md-2">
                <div class="card border-dark" style="height: 140px;">
                    <div class="card-header bg-dark text-white py-2">
                        <small class="fw-bold">專案總數</small>
                    </div>
                    <div class="card-body p-2 text-center">
                        <h2 class="mb-0">${totalProjects}</h2>
                        <small class="text-muted">個專案</small>
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="card border-info" style="height: 140px;">
                    <div class="card-header bg-info text-white py-2">
                        <small class="fw-bold">前端進度最落後</small>
                    </div>
                    <div class="card-body p-1">
                        ${frontendBottom.map(p => `
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <small class="text-muted">${p.name.split(' - ')[0]}</small>
                                <span class="badge bg-secondary small">${p.coreMetrics.frontend.progress}%</span>
                            </div>
                        `).join('')}
                        ${frontendBottom.length === 0 ? '<small class="text-muted">無數據</small>' : ''}
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="card border-warning" style="height: 140px;">
                    <div class="card-header bg-warning text-white py-2">
                        <small class="fw-bold">後端進度最落後</small>
                    </div>
                    <div class="card-body p-1">
                        ${backendBottom.map(p => `
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <small class="text-muted">${p.name.split(' - ')[0]}</small>
                                <span class="badge bg-secondary small">${p.coreMetrics.backend.progress}%</span>
                            </div>
                        `).join('')}
                        ${backendBottom.length === 0 ? '<small class="text-muted">無數據</small>' : ''}
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="card border-success" style="height: 140px;">
                    <div class="card-header bg-success text-white py-2">
                        <small class="fw-bold">資料庫進度最落後</small>
                    </div>
                    <div class="card-body p-1">
                        ${databaseBottom.map(p => `
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <small class="text-muted">${p.name.split(' - ')[0]}</small>
                                <span class="badge bg-secondary small">${p.coreMetrics.database.progress}%</span>
                            </div>
                        `).join('')}
                        ${databaseBottom.length === 0 ? '<small class="text-muted">無數據</small>' : ''}
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="card border-primary" style="height: 140px;">
                    <div class="card-header bg-primary text-white py-2">
                        <small class="fw-bold">部署進度最落後</small>
                    </div>
                    <div class="card-body p-1">
                        ${deploymentBottom.map(p => `
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <small class="text-muted">${p.name.split(' - ')[0]}</small>
                                <span class="badge bg-secondary small">${p.coreMetrics.deployment.progress}%</span>
                            </div>
                        `).join('')}
                        ${deploymentBottom.length === 0 ? '<small class="text-muted">無數據</small>' : ''}
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="card border-danger" style="height: 140px;">
                    <div class="card-header bg-danger text-white py-2">
                        <small class="fw-bold">驗證進度最落後</small>
                    </div>
                    <div class="card-body p-1">
                        ${validationBottom.map(p => `
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <small class="text-muted">${p.name.split(' - ')[0]}</small>
                                <span class="badge bg-secondary small">${p.coreMetrics.validation.progress}%</span>
                            </div>
                        `).join('')}
                        ${validationBottom.length === 0 ? '<small class="text-muted">無數據</small>' : ''}
                    </div>
                </div>
            </div>
        `;

        summaryCards.style.display = 'flex';
    }

    renderProjectsList() {
        const projectsList = document.getElementById('projectsList');
        
        if (this.data.projects.length === 0) {
            projectsList.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <h5>沒有找到專案資料</h5>
                    <p class="text-muted">請在 projects/ 資料夾中新增專案的 Markdown 檔案</p>
                </div>
            `;
            projectsList.style.display = 'block';
            return;
        }

        let html = '';
        
        for (const project of this.data.projects) {
            const stats = this.reader.calculateProjectStats(project);
            const statusIcon = this.reader.getStatusIcon(project.status);
            
            html += `
                <div class="col mb-4" style="flex: 0 0 14.28%;">
                    <div class="card h-100 project-card" data-project-id="${project.id}">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6 class="mb-0">
                                <i class="fas ${statusIcon} me-2"></i>
                                ${project.name.split(' - ')[0]}
                            </h6>
                            <span class="badge bg-primary">${project.progress || stats.completionRate}%</span>
                        </div>
                        <div class="card-body">
                            <div class="progress mb-3" style="height: 8px;">
                                <div class="progress-bar" role="progressbar" 
                                     style="width: ${project.progress || stats.completionRate}%" 
                                     aria-valuenow="${project.progress || stats.completionRate}" 
                                     aria-valuemin="0" aria-valuemax="100">
                                </div>
                            </div>
                            
                            <!-- 5個核心完整度指標 -->
                            ${project.coreMetrics ? Object.entries(project.coreMetrics).map(([key, metric]) => {
                                const names = {
                                    frontend: '前端',
                                    backend: '後端',
                                    database: '資料庫', 
                                    deployment: '部署',
                                    validation: '驗證'
                                };
                                const progressColor = metric.progress === 100 ? 'bg-success' : 
                                                    metric.progress >= 50 ? 'bg-warning' : 'bg-info';
                                return `
                                    <div class="d-flex justify-content-between align-items-center mb-1">
                                        <small class="text-muted">${names[key]}</small>
                                        <small class="fw-bold">${metric.progress}%</small>
                                    </div>
                                    <div class="progress mb-2" style="height: 6px;">
                                        <div class="progress-bar ${progressColor}" style="width: ${metric.progress}%"></div>
                                    </div>
                                `;
                            }).join('') : `
                                <div class="text-center text-muted py-3">
                                    <small>尚未配置核心指標</small>
                                </div>
                            `}
                            
                            ${project.lastUpdate ? `
                                <small class="text-muted">
                                    <i class="fas fa-clock me-1"></i>
                                    最後更新：${project.lastUpdate}
                                </small>
                            ` : ''}
                        </div>
                        <div class="card-footer">
                            <button class="btn btn-sm btn-outline-primary w-100" onclick="showProjectDetails('${project.id}')">
                                <i class="fas fa-eye me-2"></i>查看詳情
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        projectsList.innerHTML = `<div class="row">${html}</div>`;
        projectsList.style.display = 'block';
    }

    updateLastUpdateTime() {
        const lastUpdateElement = document.getElementById('lastUpdate');
        if (lastUpdateElement) {
            const now = new Date();
            lastUpdateElement.textContent = `最後更新：${now.toLocaleDateString('zh-TW')} ${now.toLocaleTimeString('zh-TW', {hour: '2-digit', minute: '2-digit'})}`;
        }
    }

    showError(message) {
        document.getElementById('loadingSpinner').style.display = 'none';
        
        const errorHtml = `
            <div class="alert alert-danger text-center">
                <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                <h5>載入失敗</h5>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-refresh me-2"></i>重新載入
                </button>
            </div>
        `;
        
        document.getElementById('summaryCards').innerHTML = errorHtml;
        document.getElementById('summaryCards').style.display = 'block';
    }

    setupEventListeners() {
        // 重新載入按鈕
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                location.reload();
            });
        }

        // 過濾按鈕暫時隱藏，因為不需要複雜的過濾功能
        const filterBtn = document.getElementById('filterBtn');
        if (filterBtn) {
            filterBtn.style.display = 'none';
        }

        // Token 設定按鈕暫時隱藏，因為不需要 GitHub API
        const quickTokenBtn = document.getElementById('quickTokenBtn');
        if (quickTokenBtn) {
            quickTokenBtn.style.display = 'none';
        }
    }

    // 取得特定專案資料
    getProject(projectId) {
        return this.data.projects.find(p => p.id === projectId);
    }
}

// 專案詳情顯示功能
function showProjectDetails(projectId) {
    const dashboard = window.markdownDashboard;
    const project = dashboard.getProject(projectId);
    
    if (!project) {
        alert('找不到專案資料');
        return;
    }

    // 建立詳情模態視窗內容
    const modalContent = `
        <div class="modal fade" id="projectDetailModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas ${dashboard.reader.getStatusIcon(project.status)} me-2"></i>
                            ${project.name}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <strong>專案狀態：</strong> ${project.status}<br>
                                <strong>完成度：</strong> ${project.progress}%<br>
                                <strong>最後更新：</strong> ${project.lastUpdate}
                            </div>
                            <div class="col-md-6">
                                ${project.startDate ? `<strong>開始日期：</strong> ${project.startDate}<br>` : ''}
                                ${project.completeDate ? `<strong>完成日期：</strong> ${project.completeDate}<br>` : ''}
                            </div>
                        </div>

                        ${project.features.completed.length > 0 ? `
                            <h6 class="text-success"><i class="fas fa-check-circle me-2"></i>已完成功能</h6>
                            <ul class="list-group list-group-flush mb-3">
                                ${project.features.completed.map(f => `
                                    <li class="list-group-item">
                                        <strong>${f.code}</strong> - ${f.name}
                                        ${f.details.length > 0 ? `<ul class="mt-2">${f.details.map(d => `<li>${d}</li>`).join('')}</ul>` : ''}
                                    </li>
                                `).join('')}
                            </ul>
                        ` : ''}

                        ${project.features.inProgress.length > 0 ? `
                            <h6 class="text-warning"><i class="fas fa-cog me-2"></i>進行中功能</h6>
                            <ul class="list-group list-group-flush mb-3">
                                ${project.features.inProgress.map(f => `
                                    <li class="list-group-item">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong>${f.code}</strong> - ${f.name}
                                                ${f.details.length > 0 ? `<ul class="mt-2">${f.details.map(d => `<li>${d}</li>`).join('')}</ul>` : ''}
                                            </div>
                                            ${f.progress ? `<span class="badge bg-warning">${f.progress}%</span>` : ''}
                                        </div>
                                    </li>
                                `).join('')}
                            </ul>
                        ` : ''}

                        ${project.features.planned.length > 0 ? `
                            <h6 class="text-info"><i class="fas fa-list me-2"></i>待開發功能</h6>
                            <ul class="list-group list-group-flush mb-3">
                                ${project.features.planned.map(f => `
                                    <li class="list-group-item">
                                        <strong>${f.code}</strong> - ${f.name}
                                    </li>
                                `).join('')}
                            </ul>
                        ` : ''}

                        ${project.issues.length > 0 ? `
                            <h6 class="text-danger"><i class="fas fa-bug me-2"></i>已知問題</h6>
                            <ul class="list-group list-group-flush mb-3">
                                ${project.issues.map(issue => `<li class="list-group-item">${issue}</li>`).join('')}
                            </ul>
                        ` : ''}

                        ${project.notes ? `
                            <h6><i class="fas fa-sticky-note me-2"></i>開發筆記</h6>
                            <div class="bg-light p-3 rounded mb-3">
                                ${project.notes.split('\n').map(note => note ? `<div>${note}</div>` : '').join('')}
                            </div>
                        ` : ''}

                        ${project.milestone ? `
                            <h6><i class="fas fa-flag-checkered me-2"></i>下個里程碑</h6>
                            <div class="bg-primary bg-opacity-10 p-3 rounded">
                                ${project.milestone.split('\n').map(line => line ? `<div>${line}</div>` : '').join('')}
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <a href="projects/${project.id}.md" target="_blank" class="btn btn-outline-primary">
                            <i class="fas fa-external-link-alt me-2"></i>編輯 Markdown
                        </a>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 移除現有的模態視窗（如果存在）
    const existingModal = document.getElementById('projectDetailModal');
    if (existingModal) {
        existingModal.remove();
    }

    // 加入新的模態視窗
    document.body.insertAdjacentHTML('beforeend', modalContent);

    // 顯示模態視窗
    const modal = new bootstrap.Modal(document.getElementById('projectDetailModal'));
    modal.show();
}