// 基於 Markdown 檔案的專案 Dashboard
class MarkdownProjectDashboard {
    constructor() {
        // 嚴格驗證：未通過 session 驗證時禁止載入任何資料
        const isAuthenticated = sessionStorage.getItem('KEY_AUTHENTICATED') === 'true';
        if (!isAuthenticated) {
            console.warn('未通過私鑰驗證，禁止載入專案資料');
            // 清空資料，並不執行 init
            this.reader = null;
            this.data = {
                lastUpdate: null,
                projects: [],
                summary: {
                    totalProjects: 0,
                    totalFeatures: 0,
                    completedFeatures: 0,
                    inProgressFeatures: 0,
                    overallProgress: 0
                }
            };
            return;
        }
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
            
            console.log('[OK] Dashboard 載入完成');
            
        } catch (error) {
            console.error('[ERROR] Dashboard 載入失敗:', error);
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
        // 移除硬編碼的進度覆蓋，使用 Markdown 檔案中的實際進度資料
        console.log(`[OK] 載入了 ${this.data.projects.length} 個專案，使用 Markdown 檔案中的實際進度資料`);
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
                <div class="col-xl-3 col-lg-6 col-md-6 col-sm-12 mb-4">
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
                            
                            <!-- 團隊成員資訊 -->
                            ${(() => {
                                const projectId = project.name.split(' - ')[0];
                                const projectMembers = window.teamDataManager && window.teamDataManager.isReady()
                                    ? window.teamDataManager.getProjectAssignments(projectId) : null;

                                if (projectMembers && projectMembers.members) {
                                    const membersByRole = {
                                        frontend: [],
                                        backend: [],
                                        testing: []
                                    };

                                    Object.values(projectMembers.members).forEach(member => {
                                        if (member.role && membersByRole[member.role]) {
                                            const memberName = window.teamDataManager.members[member.memberId]
                                                ? window.teamDataManager.members[member.memberId].name
                                                : member.memberId;
                                            membersByRole[member.role].push(memberName);
                                        }
                                    });

                                    let html = '';
                                    if (membersByRole.frontend.length > 0) {
                                        html += `<div class="mb-1"><small class="text-muted">前端 (${membersByRole.frontend.join(', ')})</small></div>`;
                                    }
                                    if (membersByRole.backend.length > 0) {
                                        html += `<div class="mb-1"><small class="text-muted">後端 (${membersByRole.backend.join(', ')})</small></div>`;
                                    }
                                    if (membersByRole.testing.length > 0) {
                                        html += `<div class="mb-1"><small class="text-muted">測試 (${membersByRole.testing.join(', ')})</small></div>`;
                                    }

                                    if (html) {
                                        return `<div class="border-top pt-2 mt-2">${html}</div>`;
                                    }
                                }
                                return '';
                            })()}

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

    // 載入團隊成員分工
    loadTeamAssignments(projectId) {
        const section = document.getElementById('teamAssignmentSection');
        if (!section || !window.teamManagement) return;

        try {
            const teamCard = window.teamManagement.renderProjectTeamCard(projectId);
            section.innerHTML = teamCard;
        } catch (error) {
            console.error('載入團隊分工失敗:', error);
            section.innerHTML = `
                <div class="card mt-3">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="fas fa-users me-2"></i>
                            專案團隊
                        </h6>
                    </div>
                    <div class="card-body">
                        <p class="text-muted">團隊資料載入中...</p>
                    </div>
                </div>
            `;
        }
    }

    // 載入驗測報告
    loadTestingReports(projectId) {
        const section = document.getElementById('testingReportsSection');
        if (!section) return;

        // 模擬驗測報告資料
        const reports = this.generateMockTestingReports(projectId);

        section.innerHTML = `
            <div class="card mt-3">
                <div class="card-header">
                    <h6 class="mb-0">
                        <i class="fas fa-clipboard-check me-2"></i>
                        驗測報告 (${reports.length})
                    </h6>
                </div>
                <div class="card-body">
                    ${reports.length > 0 ? `
                        <div class="row">
                            ${reports.map(report => `
                                <div class="col-md-6 mb-3">
                                    <div class="border rounded p-3">
                                        <div class="d-flex justify-content-between align-items-start mb-2">
                                            <h6 class="mb-1">${report.title}</h6>
                                            <span class="badge ${report.status === 'pass' ? 'bg-success' : report.status === 'fail' ? 'bg-danger' : 'bg-warning'}">${report.statusText}</span>
                                        </div>
                                        <div class="small text-muted mb-2">
                                            <i class="fas fa-user me-1"></i>${report.tester} |
                                            <i class="fas fa-calendar me-1"></i>${report.date}
                                        </div>
                                        <p class="mb-2 small">${report.description}</p>
                                        ${report.issues.length > 0 ? `
                                            <div class="small">
                                                <strong>發現問題:</strong>
                                                <ul class="mb-0 mt-1">
                                                    ${report.issues.map(issue => `<li>${issue}</li>`).join('')}
                                                </ul>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="text-muted">尚無驗測報告</p>'}
                </div>
            </div>
        `;
    }

    // 載入詳細進度追蹤
    loadDetailedProgress(projectId) {
        const section = document.getElementById('detailedProgressSection');
        if (!section) return;

        // 模擬詳細進度資料
        const progress = this.generateMockDetailedProgress(projectId);

        section.innerHTML = `
            <div class="card mt-3">
                <div class="card-header">
                    <h6 class="mb-0">
                        <i class="fas fa-chart-line me-2"></i>
                        詳細進度追蹤
                    </h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        ${Object.entries(progress).map(([role, data]) => `
                            <div class="col-md-4 mb-3">
                                <h6 class="text-center" style="color: ${data.color}">
                                    <span class="me-1">${data.icon}</span>
                                    ${data.name}
                                </h6>
                                <div class="progress mb-2" style="height: 10px;">
                                    <div class="progress-bar" style="width: ${data.progress}%; background-color: ${data.color}"></div>
                                </div>
                                <div class="small text-center mb-2">${data.progress}% 完成</div>
                                <div class="small">
                                    <strong>負責人:</strong> ${data.assignee}<br>
                                    <strong>任務:</strong>
                                    <ul class="mb-0 mt-1">
                                        ${data.tasks.map(task => `<li>${task}</li>`).join('')}
                                    </ul>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // 生成模擬驗測報告
    generateMockTestingReports(projectId) {
        if (!window.teamManagement) return [];

        const assignment = window.teamManagement.getProjectAssignments(projectId);
        if (!assignment) return [];

        const testerAssignment = Object.values(assignment.members).find(m => m.role === 'testing');
        const testerName = testerAssignment ? `成員${testerAssignment.memberId}` : '驗測A';

        const reports = [
            {
                title: '功能測試報告',
                status: 'pass',
                statusText: '通過',
                tester: testerName,
                date: '2025-09-15',
                description: '核心功能測試完成，所有主要功能運作正常',
                issues: []
            },
            {
                title: '整合測試報告',
                status: 'pending',
                statusText: '進行中',
                tester: testerName,
                date: '2025-09-17',
                description: '正在進行各模組間的整合測試',
                issues: ['API 回應時間偶爾超過預期', '部分邊界條件需要進一步驗證']
            }
        ];

        return reports;
    }

    // 生成模擬詳細進度
    generateMockDetailedProgress(projectId) {
        if (!window.teamManagement) {
            return {
                frontend: { name: '前端開發', icon: '[UI]', color: '#3b82f6', progress: 85, assignee: '前端A', tasks: ['UI 組件開發', '狀態管理', '響應式設計'] },
                backend: { name: '後端開發', icon: '[API]', color: '#ef4444', progress: 75, assignee: '後端A', tasks: ['API 開發', '資料庫設計', '服務架構'] },
                testing: { name: '測試驗證', icon: '[TEST]', color: '#10b981', progress: 60, assignee: '驗測A', tasks: ['功能測試', '效能測試', '安全測試'] }
            };
        }

        const assignment = window.teamManagement.getProjectAssignments(projectId);
        const roles = window.teamManagement.roles;
        const progress = {};

        if (assignment) {
            Object.entries(assignment.members).forEach(([memberId, memberData]) => {
                const role = roles[memberData.role];
                progress[memberData.role] = {
                    name: role.name,
                    icon: role.icon,
                    color: role.color,
                    progress: Math.floor(Math.random() * 30) + 70, // 70-99%
                    assignee: `成員${memberId}`,
                    tasks: memberData.tasks
                };
            });
        }

        return progress;
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

                        <!-- 團隊成員分工 -->
                        <div id="teamAssignmentSection"></div>

                        <!-- 驗測報告 -->
                        <div id="testingReportsSection"></div>

                        <!-- 詳細進度追蹤 -->
                        <div id="detailedProgressSection"></div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="openMarkdownEditor('${project.id}')">
                            <i class="fas fa-edit me-2"></i>線上編輯
                        </button>
                        <a href="projects/${project.id}.md" target="_blank" class="btn btn-outline-secondary">
                            <i class="fas fa-external-link-alt me-2"></i>檢視原檔
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

    // 載入團隊成員資料
    if (window.teamManagement) {
        setTimeout(() => {
            dashboard.loadTeamAssignments(project.id);
            dashboard.loadTestingReports(project.id);
            dashboard.loadDetailedProgress(project.id);
        }, 100);
    }
}

// 線上 Markdown 編輯器功能
function openMarkdownEditor(projectId) {
    const editorModal = document.createElement('div');
    editorModal.className = 'modal fade';
    editorModal.id = 'markdownEditorModal';
    editorModal.innerHTML = `
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-edit me-2"></i>編輯 ${projectId}.md
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-6">
                            <label class="form-label">Markdown 編輯器</label>
                            <textarea id="markdownEditor" class="form-control" rows="20"
                                      style="font-family: 'Consolas', 'Monaco', monospace;"
                                      placeholder="載入中..."></textarea>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">即時預覽</label>
                            <div id="markdownPreview" class="border p-3"
                                 style="height: 500px; overflow-y: auto; background: #f8f9fa;">
                                <div class="text-center text-muted">
                                    <i class="fas fa-spinner fa-spin"></i> 載入中...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-success" id="saveMarkdownBtn">
                        <i class="fas fa-save me-2"></i>儲存到 Google Drive
                    </button>
                    <button class="btn btn-outline-primary" id="downloadMarkdownBtn">
                        <i class="fas fa-download me-2"></i>下載檔案
                    </button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(editorModal);

    // 初始化 Bootstrap Modal
    const modal = new bootstrap.Modal(editorModal);

    // 載入現有檔案內容
    loadMarkdownContent(projectId);

    // 設定即時預覽
    const editor = document.getElementById('markdownEditor');
    const preview = document.getElementById('markdownPreview');

    editor.addEventListener('input', () => {
        updateMarkdownPreview(editor.value, preview);
    });

    // 儲存功能
    document.getElementById('saveMarkdownBtn').addEventListener('click', () => {
        saveMarkdownToGoogleDrive(projectId, editor.value);
    });

    // 下載功能
    document.getElementById('downloadMarkdownBtn').addEventListener('click', () => {
        downloadMarkdownFile(projectId, editor.value);
    });

    // 當 modal 關閉時移除
    editorModal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(editorModal);
    });

    modal.show();
}

// 載入 Markdown 檔案內容
async function loadMarkdownContent(projectId) {
    const editor = document.getElementById('markdownEditor');
    const preview = document.getElementById('markdownPreview');

    try {
        const response = await fetch(`projects/${projectId}.md`);
        if (response.ok) {
            const content = await response.text();
            editor.value = content;
            updateMarkdownPreview(content, preview);
        } else {
            // 如果檔案不存在，建立預設內容
            const defaultContent = createDefaultMarkdownContent(projectId);
            editor.value = defaultContent;
            updateMarkdownPreview(defaultContent, preview);
        }
    } catch (error) {
        console.error('載入 Markdown 檔案失敗:', error);
        const defaultContent = createDefaultMarkdownContent(projectId);
        editor.value = defaultContent;
        updateMarkdownPreview(defaultContent, preview);
    }
}

// 建立預設 Markdown 內容
function createDefaultMarkdownContent(projectId) {
    return `# ${projectId} 專案

## 專案概述
請在此描述專案的基本資訊...

## 目標
- [ ] 目標 1
- [ ] 目標 2
- [ ] 目標 3

## 進度
### 已完成
- [x] 初始化專案

### 進行中
- [ ] 功能開發

### 待辦事項
- [ ] 測試
- [ ] 部署

## 團隊成員
| 姓名 | 角色 | 負責項目 |
|------|------|----------|
| 成員1 | 開發 | 前端開發 |
| 成員2 | 開發 | 後端開發 |

## 技術架構
請描述技術選型和架構...

## 備註
其他相關資訊...
`;
}

// 更新 Markdown 預覽
function updateMarkdownPreview(content, previewElement) {
    // 簡單的 Markdown 轉 HTML（基本功能）
    let html = content
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/^- (.*$)/gim, '<li>$1</li>')
        .replace(/^\- \[x\] (.*$)/gim, '<li style="list-style: none;"><input type="checkbox" checked disabled> $1</li>')
        .replace(/^\- \[ \] (.*$)/gim, '<li style="list-style: none;"><input type="checkbox" disabled> $1</li>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');

    // 處理表格
    html = html.replace(/\|(.+)\|/g, (match, content) => {
        const cells = content.split('|').map(cell => `<td>${cell.trim()}</td>`).join('');
        return `<tr>${cells}</tr>`;
    });

    if (html.includes('<tr>')) {
        html = html.replace(/(<tr>.*<\/tr>)/g, '<table class="table table-bordered">$1</table>');
    }

    previewElement.innerHTML = html;
}

// 儲存到 Google Drive
async function saveMarkdownToGoogleDrive(projectId, content) {
    try {
        if (window.googleDriveAPI && window.googleDriveAPI.isConfigured) {
            const fileName = `${projectId}_project.md`;
            await window.googleDriveAPI.saveFile(fileName, content, 'markdown');

            // 顯示成功訊息
            const toast = document.createElement('div');
            toast.className = 'toast align-items-center text-white bg-success border-0';
            toast.style.position = 'fixed';
            toast.style.top = '20px';
            toast.style.right = '20px';
            toast.style.zIndex = '9999';
            toast.innerHTML = `
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="fas fa-check me-2"></i>檔案已儲存到 Google Drive
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            `;
            document.body.appendChild(toast);

            const toastBootstrap = new bootstrap.Toast(toast);
            toastBootstrap.show();

            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 5000);
        } else {
            alert('Google Drive 未設定，無法儲存');
        }
    } catch (error) {
        console.error('儲存失敗:', error);
        alert(`儲存失敗：${error.message}`);
    }
}

// 下載檔案
function downloadMarkdownFile(projectId, content) {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}