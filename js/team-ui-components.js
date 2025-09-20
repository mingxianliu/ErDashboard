/**
 * 團隊管理 UI 組件模組
 * 負責所有用戶介面組件和模態框的生成與管理
 */

class TeamUIComponents {
    constructor(dataManager, statistics) {
        this.dataManager = dataManager;
        this.statistics = statistics;
    }

    // 生成團隊管理主模態框
    generateTeamManagementModal() {
        return `
            <style>
                #teamManagementModal .modal-body {
                    overflow: visible !important;
                }
                #teamManagementModal .tab-content {
                    overflow: visible !important;
                }
                #teamManagementModal .tab-pane {
                    overflow: visible !important;
                }
                #teamManagementModal .dropdown-menu {
                    z-index: 9999 !important;
                }
                .dropdown-toggle::after {
                    display: none !important;
                }
            </style>
            <div class="modal fade" id="teamManagementModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content" style="overflow: visible !important;">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-users-cog me-2"></i>團隊管理中心
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-0">
                            <!-- 分頁導航 -->
                            <ul class="nav nav-tabs" id="teamManagementTabs" role="tablist">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link active" id="overview-tab" data-bs-toggle="tab" data-bs-target="#overview" type="button" role="tab">
                                        <i class="fas fa-chart-pie me-1"></i>團隊總覽
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="members-tab" data-bs-toggle="tab" data-bs-target="#members" type="button" role="tab">
                                        <i class="fas fa-users me-1"></i>成員管理
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="projects-tab" data-bs-toggle="tab" data-bs-target="#projects" type="button" role="tab">
                                        <i class="fas fa-project-diagram me-1"></i>專案管理
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="settings-tab" data-bs-toggle="tab" data-bs-target="#settings" type="button" role="tab">
                                        <i class="fas fa-cog me-1"></i>系統設定
                                    </button>
                                </li>
                            </ul>

                            <!-- 分頁內容 -->
                            <div class="tab-content" id="teamManagementTabContent">
                                <div class="tab-pane fade show active" id="overview" role="tabpanel">
                                    <div class="p-4" id="teamOverviewContent">
                                        <div class="text-center">
                                            <div class="spinner-border text-primary" role="status">
                                                <span class="visually-hidden">載入中...</span>
                                            </div>
                                            <div class="mt-2">載入團隊總覽中...</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="tab-pane fade" id="members" role="tabpanel">
                                    <div class="p-4" id="teamMembersContent">
                                        <!-- 成員管理內容將在此載入 -->
                                    </div>
                                </div>
                                <div class="tab-pane fade" id="projects" role="tabpanel">
                                    <div class="p-4" id="teamProjectsContent">
                                        <!-- 專案管理內容將在此載入 -->
                                    </div>
                                </div>
                                <div class="tab-pane fade" id="settings" role="tabpanel">
                                    <div class="p-4" id="teamSettingsContent">
                                        <!-- 系統設定內容將在此載入 -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 生成團隊總覽內容
    generateTeamOverviewContent(stats) {
        const utilization = stats.memberUtilization;
        const workloadReport = this.statistics.getWorkloadReport();

        return `
            <div class="row g-4">
                <!-- 基本統計 -->
                <div class="col-md-3">
                    <div class="card bg-primary text-white h-100">
                        <div class="card-body text-center">
                            <i class="fas fa-users fa-2x mb-2"></i>
                            <h3 class="card-title">${stats.totalMembers}</h3>
                            <p class="card-text">總成員數</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-white h-100">
                        <div class="card-body text-center">
                            <i class="fas fa-project-diagram fa-2x mb-2"></i>
                            <h3 class="card-title">${stats.activeProjects}</h3>
                            <p class="card-text">進行中專案</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-info text-white h-100">
                        <div class="card-body text-center">
                            <i class="fas fa-check-circle fa-2x mb-2"></i>
                            <h3 class="card-title">${stats.completedProjects}</h3>
                            <p class="card-text">已完成專案</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning text-white h-100">
                        <div class="card-body text-center">
                            <i class="fas fa-tasks fa-2x mb-2"></i>
                            <h3 class="card-title">${stats.totalProjects}</h3>
                            <p class="card-text">總專案數</p>
                        </div>
                    </div>
                </div>

                <!-- 成員工作負載 -->
                <div class="col-12">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <div>
                                <h5 class="card-title mb-0">
                                    <i class="fas fa-chart-bar me-2"></i>成員工作負載
                                </h5>
                                <small class="text-muted">
                                    ${this.getActualProjectParticipants()} 位成員參與專案，
                                    ${stats.totalMembers - this.getActualProjectParticipants()} 位成員尚未分配專案
                                </small>
                            </div>
                            <div class="text-muted small">
                                總計 ${stats.totalMembers} 位團隊成員
                            </div>
                        </div>
                        <div class="card-body">
                            ${this.generateWorkloadContent(workloadReport)}
                        </div>
                    </div>
                </div>

                <!-- 成員技能分佈 -->
                <div class="col-md-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h5 class="card-title mb-0">
                                <i class="fas fa-users me-2"></i>成員技能分佈
                            </h5>
                            <small class="text-muted">基於18位成員的技能統計</small>
                        </div>
                        <div class="card-body">
                            ${this.generateRoleDistributionContent(stats.roleDistribution)}
                        </div>
                    </div>
                </div>

                <!-- 專案角色分配 -->
                <div class="col-md-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h5 class="card-title mb-0">
                                <i class="fas fa-project-diagram me-2"></i>專案角色分配
                            </h5>
                            <small class="text-muted">實際專案中的角色分配</small>
                        </div>
                        <div class="card-body">
                            ${this.generateProjectRoleDistributionContent(this.statistics.calculateProjectRoleDistribution())}
                        </div>
                    </div>
                </div>

                <!-- 專案狀態 -->
                <div class="col-md-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h5 class="card-title mb-0">
                                <i class="fas fa-chart-donut me-2"></i>專案狀態分佈
                            </h5>
                        </div>
                        <div class="card-body">
                            ${this.generateProjectStatusContent(stats.projectStatusDistribution)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 生成工作負載內容
    generateWorkloadContent(workloadReport) {
        if (Object.keys(this.dataManager.members).length === 0) {
            return `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    尚無成員資料
                </div>
            `;
        }

        // 先顯示詳細的專案分配清單
        let content = this.generateProjectMemberList();
        content += '<div class="row g-3 mt-3">';

        // 工作過多的成員
        if (workloadReport.overloaded.length > 0) {
            content += `
                <div class="col-md-4">
                    <h6 class="text-danger"><i class="fas fa-exclamation-triangle me-1"></i>工作負載過重</h6>
                    <div class="list-group list-group-flush">
            `;
            workloadReport.overloaded.forEach(member => {
                content += `
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        <span>${member.name}</span>
                        <span class="badge bg-danger">${member.activeProjects} 個專案</span>
                    </div>
                `;
            });
            content += '</div></div>';
        }

        // 工作適中的成員
        if (workloadReport.balanced.length > 0) {
            content += `
                <div class="col-md-4">
                    <h6 class="text-success"><i class="fas fa-check-circle me-1"></i>工作負載適中</h6>
                    <div class="list-group list-group-flush">
            `;
            workloadReport.balanced.forEach(member => {
                content += `
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        <span>${member.name}</span>
                        <span class="badge bg-success">${member.activeProjects} 個專案</span>
                    </div>
                `;
            });
            content += '</div></div>';
        }

        // 工作較少的成員
        if (workloadReport.underutilized.length > 0) {
            content += `
                <div class="col-md-4">
                    <h6 class="text-warning"><i class="fas fa-clock me-1"></i>可承接更多工作</h6>
                    <div class="list-group list-group-flush">
            `;
            workloadReport.underutilized.forEach(member => {
                content += `
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        <span>${member.name}</span>
                        <span class="badge bg-warning">${member.activeProjects} 個專案</span>
                    </div>
                `;
            });
            content += '</div></div>';
        }

        content += '</div>';
        return content;
    }

    // 生成成員技能分佈內容
    generateRoleDistributionContent(roleDistribution) {
        const roles = this.dataManager.roles;
        let content = '<div class="row g-2">';

        Object.keys(roleDistribution).forEach(roleKey => {
            const role = roles[roleKey];
            const count = roleDistribution[roleKey];

            content += `
                <div class="col-12">
                    <div class="d-flex align-items-center p-2 border rounded">
                        <div class="flex-shrink-0 me-3">
                            <div class="badge" style="background-color: ${role?.color || '#6c757d'}">${role?.icon || '[?]'}</div>
                        </div>
                        <div class="flex-grow-1">
                            <div class="fw-bold">${role?.name || roleKey}</div>
                            <div class="text-muted small">${count} 位成員具備此技能</div>
                        </div>
                    </div>
                </div>
            `;
        });

        content += '</div>';
        return content;
    }

    // 生成專案角色分配內容
    generateProjectRoleDistributionContent(projectRoleDistribution) {
        const roles = this.dataManager.roles;
        let content = '<div class="row g-2">';

        if (Object.keys(projectRoleDistribution).length === 0) {
            return '<div class="alert alert-info">尚無專案角色分配</div>';
        }

        Object.keys(projectRoleDistribution).forEach(roleKey => {
            const role = roles[roleKey];
            const count = projectRoleDistribution[roleKey];

            content += `
                <div class="col-12">
                    <div class="d-flex align-items-center p-2 border rounded">
                        <div class="flex-shrink-0 me-3">
                            <div class="badge" style="background-color: ${role?.color || '#6c757d'}">${role?.icon || '[?]'}</div>
                        </div>
                        <div class="flex-grow-1">
                            <div class="fw-bold">${role?.name || roleKey}</div>
                            <div class="text-muted small">${count} 個專案分配</div>
                        </div>
                    </div>
                </div>
            `;
        });

        content += '</div>';
        return content;
    }

    // 生成專案狀態內容
    generateProjectStatusContent(statusDistribution) {
        const statusConfig = {
            active: { name: '進行中', color: '#28a745', icon: 'fas fa-play-circle' },
            completed: { name: '已完成', color: '#007bff', icon: 'fas fa-check-circle' },
            paused: { name: '已暫停', color: '#ffc107', icon: 'fas fa-pause-circle' },
            cancelled: { name: '已取消', color: '#dc3545', icon: 'fas fa-times-circle' }
        };

        let content = '<div class="row g-2">';

        Object.keys(statusDistribution).forEach(status => {
            const config = statusConfig[status] || { name: status, color: '#6c757d', icon: 'fas fa-question-circle' };
            const count = statusDistribution[status];

            content += `
                <div class="col-sm-6">
                    <div class="d-flex align-items-center p-3 border rounded">
                        <div class="flex-shrink-0 me-3">
                            <i class="${config.icon} fa-2x" style="color: ${config.color}"></i>
                        </div>
                        <div class="flex-grow-1">
                            <div class="fw-bold">${config.name}</div>
                            <div class="h4 mb-0">${count}</div>
                        </div>
                    </div>
                </div>
            `;
        });

        content += '</div>';
        return content;
    }

    // 生成成員管理內容
    generateMemberManagementContent() {
        const members = this.dataManager.getAllMembers();
        const groups = this.dataManager.teamConfig.groups || {};

        if (Object.keys(members).length === 0) {
            return `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    尚無成員資料
                </div>
            `;
        }

        let content = `
            <div class="row g-4">
                <!-- 成員總覽 -->
                <div class="col-12">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="card-title mb-0">
                                <i class="fas fa-users me-2"></i>團隊成員 (${Object.keys(members).length} 人)
                            </h5>
                            <button class="btn btn-primary btn-sm" onclick="teamManagement.addNewMember()">
                                <i class="fas fa-plus me-1"></i>新增成員
                            </button>
                        </div>
                        <div class="card-body">
                            <div class="row g-3">
        `;

        // 按組織顯示成員
        Object.values(groups).forEach(group => {
            const groupMembers = group.members || [];
            content += `
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-header" style="background-color: ${group.color}20; border-left: 4px solid ${group.color}">
                            <h6 class="card-title mb-0" style="color: ${group.color}">
                                <i class="fas fa-layer-group me-2"></i>${group.name}
                            </h6>
                            <small class="text-muted">${groupMembers.length} 位成員</small>
                        </div>
                        <div class="card-body p-0">
                            <div class="list-group list-group-flush">
            `;

            groupMembers.forEach(memberId => {
                const member = members[memberId];
                if (member) {
                    const memberUtilization = this.statistics.calculateMemberUtilization()[memberId];
                    const activeProjects = memberUtilization?.activeProjects || 0;
                    const roles = memberUtilization?.roles || [];

                    content += `
                        <div class="list-group-item">
                            <div class="d-flex justify-content-between align-items-start">
                                <div class="flex-grow-1">
                                    <div class="d-flex align-items-center mb-1">
                                        <div class="avatar-placeholder me-2" style="width: 32px; height: 32px; background: ${group.color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">
                                            ${member.name.slice(-2)}
                                        </div>
                                        <div>
                                            <div class="fw-bold">${member.name}</div>
                                            <small class="text-muted">${member.id}</small>
                                        </div>
                                    </div>
                                    <div class="d-flex flex-wrap gap-1 mb-2">
                                        ${roles.map(role => {
                                            const roleInfo = this.dataManager.roles[role];
                                            return `<span class="badge" style="background-color: ${roleInfo?.color || '#6c757d'}">${roleInfo?.name || role}</span>`;
                                        }).join('')}
                                    </div>
                                    <div class="small text-muted">
                                        <i class="fas fa-project-diagram me-1"></i>
                                        ${this.getMemberProjectInfo(memberId, activeProjects)}
                                    </div>
                                </div>
                                <div class="btn-group">
                                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="teamManagement.editMember('${member.id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button type="button" class="btn btn-sm btn-outline-info" onclick="teamManagement.viewMemberProjects('${member.id}')">
                                        <i class="fas fa-project-diagram"></i>
                                    </button>
                                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="teamManagement.removeMember('${member.id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }
            });

            content += `
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        content += `
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 成員技能統計 -->
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="card-title mb-0">
                                <i class="fas fa-chart-bar me-2"></i>技能分佈統計
                            </h6>
                        </div>
                        <div class="card-body">
                            ${this.generateSkillDistributionContent()}
                        </div>
                    </div>
                </div>

                <!-- 成員加入時間統計 -->
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="card-title mb-0">
                                <i class="fas fa-calendar me-2"></i>團隊成長歷程
                            </h6>
                        </div>
                        <div class="card-body">
                            ${this.generateJoinDateContent()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        return content;
    }

    // 生成技能分佈內容
    generateSkillDistributionContent() {
        const members = this.dataManager.getAllMembers();
        const skillCount = {};

        Object.values(members).forEach(member => {
            if (member.skills) {
                member.skills.forEach(skill => {
                    skillCount[skill] = (skillCount[skill] || 0) + 1;
                });
            }
        });

        let content = '<div class="row g-2">';
        Object.entries(skillCount).forEach(([skill, count]) => {
            const percentage = (count / Object.keys(members).length * 100).toFixed(1);
            content += `
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="text-capitalize">${skill}</span>
                        <span class="badge bg-primary">${count} 人 (${percentage}%)</span>
                    </div>
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        });
        content += '</div>';

        return content;
    }

    // 生成加入時間內容
    generateJoinDateContent() {
        const members = this.dataManager.getAllMembers();
        const joinDates = Object.values(members)
            .map(member => ({
                name: member.name,
                date: new Date(member.joinDate || '2025-01-01')
            }))
            .sort((a, b) => a.date - b.date);

        let content = '<div class="timeline">';
        joinDates.slice(0, 10).forEach(member => {
            content += `
                <div class="d-flex align-items-center mb-2">
                    <div class="flex-shrink-0 me-3">
                        <div class="bg-primary rounded-circle" style="width: 8px; height: 8px;"></div>
                    </div>
                    <div class="flex-grow-1">
                        <div class="fw-bold">${member.name}</div>
                        <small class="text-muted">${member.date.toLocaleDateString('zh-TW')}</small>
                    </div>
                </div>
            `;
        });

        if (joinDates.length > 10) {
            content += `
                <div class="text-center mt-3">
                    <small class="text-muted">還有 ${joinDates.length - 10} 位成員...</small>
                </div>
            `;
        }

        content += '</div>';
        return content;
    }

    // 生成系統設定內容
    generateSystemSettingsContent() {
        return `
            <div class="row g-4">
                <!-- 資料管理 -->
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="card-title mb-0">
                                <i class="fas fa-database me-2"></i>資料管理
                            </h6>
                        </div>
                        <div class="card-body">
                            <div class="d-grid gap-2">
                                <button class="btn btn-outline-primary" onclick="teamManagement.exportData()">
                                    <i class="fas fa-download me-2"></i>匯出團隊資料
                                </button>
                                <button class="btn btn-outline-secondary" onclick="teamManagement.importData()">
                                    <i class="fas fa-upload me-2"></i>匯入團隊資料
                                </button>
                                <button class="btn btn-outline-info" onclick="teamManagement.reloadData()">
                                    <i class="fas fa-sync me-2"></i>重新載入資料
                                </button>
                                <hr>
                                <button class="btn btn-outline-warning" onclick="teamManagement.clearLocalData()">
                                    <i class="fas fa-trash me-2"></i>清除本地快取
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Google Drive 同步 -->
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="card-title mb-0">
                                <i class="fab fa-google-drive me-2"></i>Google Drive 同步
                            </h6>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="autoSyncSwitch" ${this.getAutoSyncStatus() ? 'checked' : ''}>
                                    <label class="form-check-label" for="autoSyncSwitch">
                                        自動同步
                                    </label>
                                </div>
                                <small class="text-muted">每30分鐘自動檢查 Google Drive 更新</small>
                            </div>
                            <div class="d-grid gap-2">
                                <button class="btn btn-outline-primary" onclick="teamManagement.checkGoogleDriveStatus()">
                                    <i class="fas fa-link me-2"></i>檢查 Google Drive 連線狀態
                                </button>
                                <div class="alert alert-info mt-2" style="font-size: 0.9em;">
                                    <i class="fas fa-info-circle me-2"></i>
                                    系統會自動從 Google Drive 載入資料，並在儲存時自動同步
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 系統資訊 -->
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="card-title mb-0">
                                <i class="fas fa-info-circle me-2"></i>系統資訊
                            </h6>
                        </div>
                        <div class="card-body">
                            <table class="table table-sm">
                                <tbody>
                                    <tr>
                                        <td><strong>版本</strong></td>
                                        <td>v1.0.0</td>
                                    </tr>
                                    <tr>
                                        <td><strong>最後更新</strong></td>
                                        <td>${new Date().toLocaleDateString('zh-TW')}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>成員數量</strong></td>
                                        <td>${Object.keys(this.dataManager.getAllMembers()).length} 人</td>
                                    </tr>
                                    <tr>
                                        <td><strong>專案數量</strong></td>
                                        <td>${Object.keys(this.dataManager.getAllAssignments()).length} 個</td>
                                    </tr>
                                    <tr>
                                        <td><strong>初始化狀態</strong></td>
                                        <td>
                                            ${this.dataManager.isReady() ?
                                                '<span class="badge bg-success">已完成</span>' :
                                                '<span class="badge bg-danger">未完成</span>'
                                            }
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- 偏好設定 -->
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="card-title mb-0">
                                <i class="fas fa-cog me-2"></i>偏好設定
                            </h6>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label class="form-label">介面主題</label>
                                <select class="form-select" id="themeSelect">
                                    <option value="light">淺色主題</option>
                                    <option value="dark">深色主題</option>
                                    <option value="auto">跟隨系統</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">時間格式</label>
                                <select class="form-select" id="timeFormatSelect">
                                    <option value="12h">12小時制</option>
                                    <option value="24h">24小時制</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="enableNotifications" checked>
                                    <label class="form-check-label" for="enableNotifications">
                                        啟用通知
                                    </label>
                                </div>
                            </div>
                            <div class="d-grid">
                                <button class="btn btn-primary" onclick="teamManagement.saveSettings()">
                                    <i class="fas fa-save me-2"></i>儲存設定
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 工具箱 -->
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="card-title mb-0">
                                <i class="fas fa-tools me-2"></i>開發者工具箱
                            </h6>
                        </div>
                        <div class="card-body">
                            <div class="row g-3">
                                <div class="col-md-3">
                                    <button class="btn btn-outline-secondary w-100" onclick="teamManagement.generateTestData()">
                                        <i class="fas fa-flask me-2"></i>生成測試資料
                                    </button>
                                </div>
                                <div class="col-md-3">
                                    <button class="btn btn-outline-secondary w-100" onclick="teamManagement.validateData()">
                                        <i class="fas fa-check-circle me-2"></i>驗證資料完整性
                                    </button>
                                </div>
                                <div class="col-md-3">
                                    <button class="btn btn-outline-secondary w-100" onclick="teamManagement.showDebugInfo()">
                                        <i class="fas fa-bug me-2"></i>顯示除錯資訊
                                    </button>
                                </div>
                                <div class="col-md-3">
                                    <button class="btn btn-outline-secondary w-100" onclick="teamManagement.resetSystem()">
                                        <i class="fas fa-redo me-2"></i>重設系統
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 生成成員編輯模態框
    generateMemberEditModal(memberId) {
        const member = this.dataManager.getAllMembers()[memberId];
        if (!member) {
            return `<div class="alert alert-danger">找不到成員 ${memberId}</div>`;
        }

        const roles = this.dataManager.getAllRoles();
        const groups = this.dataManager.teamConfig.groups || {};

        // 找出成員所屬的組
        let memberGroup = '';
        Object.values(groups).forEach(group => {
            if (group.members && group.members.includes(memberId)) {
                memberGroup = group.id;
            }
        });

        return `
            <div class="modal fade" id="editMemberModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-user-edit me-2"></i>編輯成員資料
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editMemberForm">
                                <div class="row g-3">
                                    <!-- 基本資訊 -->
                                    <div class="col-12">
                                        <h6 class="text-primary border-bottom pb-2">
                                            <i class="fas fa-info-circle me-2"></i>基本資訊
                                        </h6>
                                    </div>

                                    <div class="col-md-6">
                                        <label class="form-label">成員 ID</label>
                                        <input type="text" class="form-control" id="memberId" value="${member.id}" readonly>
                                        <small class="text-muted">成員 ID 無法修改</small>
                                    </div>

                                    <div class="col-md-6">
                                        <label class="form-label">姓名 <span class="text-danger">*</span></label>
                                        <input type="text" class="form-control" id="memberName" value="${member.name}" required>
                                    </div>

                                    <div class="col-md-6">
                                        <label class="form-label">所屬組織</label>
                                        <select class="form-select" id="memberGroup">
                                            <option value="">請選擇組織</option>
                                            ${Object.values(groups).map(group =>
                                                `<option value="${group.id}" ${memberGroup === group.id ? 'selected' : ''}>${group.name}</option>`
                                            ).join('')}
                                        </select>
                                    </div>

                                    <div class="col-md-6">
                                        <label class="form-label">主要角色</label>
                                        <select class="form-select" id="memberPrimaryRole">
                                            <option value="">請選擇主要角色</option>
                                            ${Object.entries(roles).map(([roleKey, role]) =>
                                                `<option value="${roleKey}" ${member.primaryRole === roleKey ? 'selected' : ''}>${role.name}</option>`
                                            ).join('')}
                                        </select>
                                    </div>

                                    <div class="col-md-6">
                                        <label class="form-label">加入日期</label>
                                        <input type="date" class="form-control" id="memberJoinDate" value="${member.joinDate || '2025-01-01'}">
                                    </div>

                                    <div class="col-md-6">
                                        <label class="form-label">頭像代碼</label>
                                        <input type="text" class="form-control" id="memberAvatar" value="${member.avatar || member.id}">
                                        <small class="text-muted">用於顯示頭像的代碼</small>
                                    </div>

                                    <!-- 技能資訊 -->
                                    <div class="col-12 mt-4">
                                        <h6 class="text-primary border-bottom pb-2">
                                            <i class="fas fa-cogs me-2"></i>技能資訊
                                        </h6>
                                    </div>

                                    <div class="col-12">
                                        <label class="form-label">擅長技能</label>
                                        <div class="row g-2" id="skillsContainer">
                                            ${Object.keys(roles).map(roleKey => {
                                                const role = roles[roleKey];
                                                const isChecked = member.skills && member.skills.includes(roleKey);
                                                return `
                                                    <div class="col-md-4">
                                                        <div class="form-check">
                                                            <input class="form-check-input" type="checkbox" id="skill_${roleKey}" value="${roleKey}" ${isChecked ? 'checked' : ''}>
                                                            <label class="form-check-label" for="skill_${roleKey}">
                                                                <span class="badge me-2" style="background-color: ${role.color}">${role.icon}</span>
                                                                ${role.name}
                                                            </label>
                                                        </div>
                                                    </div>
                                                `;
                                            }).join('')}
                                        </div>
                                    </div>

                                    <!-- 備註 -->
                                    <div class="col-12 mt-3">
                                        <label class="form-label">備註</label>
                                        <textarea class="form-control" id="memberNotes" rows="3" placeholder="成員的備註資訊...">${member.notes || ''}</textarea>
                                    </div>

                                    <!-- 專案參與情況 -->
                                    <div class="col-12 mt-4">
                                        <h6 class="text-primary border-bottom pb-2">
                                            <i class="fas fa-project-diagram me-2"></i>專案參與情況
                                        </h6>
                                        <div id="memberProjectsInfo">
                                            ${this.generateMemberProjectsInfo(memberId)}
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-2"></i>取消
                            </button>
                            <button type="button" class="btn btn-danger me-2" onclick="teamManagement.deleteMemberConfirm('${member.id}')">
                                <i class="fas fa-trash me-2"></i>刪除成員
                            </button>
                            <button type="button" class="btn btn-primary" onclick="teamManagement.saveMemberEdit('${member.id}')">
                                <i class="fas fa-save me-2"></i>儲存變更
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 生成成員專案參與資訊
    generateMemberProjectsInfo(memberId) {
        const assignments = this.dataManager.getAllAssignments();
        const memberProjects = [];

        Object.values(assignments).forEach(project => {
            if (project.members && project.members[memberId]) {
                const memberRole = project.members[memberId];
                memberProjects.push({
                    projectName: project.projectName,
                    status: project.status,
                    role: memberRole.role,
                    assignedDate: memberRole.assignedDate,
                    tasks: memberRole.tasks || []
                });
            }
        });

        if (memberProjects.length === 0) {
            return '<div class="alert alert-info">此成員目前未參與任何專案</div>';
        }

        let content = '<div class="row g-3">';
        memberProjects.forEach(project => {
            const statusBadge = project.status === 'active' ? 'bg-success' :
                               project.status === 'completed' ? 'bg-primary' : 'bg-secondary';

            content += `
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body p-3">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h6 class="card-title mb-0">${project.projectName}</h6>
                                <span class="badge ${statusBadge}">${project.status}</span>
                            </div>
                            <div class="mb-2">
                                <small class="text-muted">角色：</small>
                                <span class="badge bg-info">${project.role}</span>
                            </div>
                            <div class="mb-2">
                                <small class="text-muted">加入日期：${project.assignedDate}</small>
                            </div>
                            ${project.tasks.length > 0 ? `
                                <div>
                                    <small class="text-muted">負責任務：</small>
                                    <ul class="list-unstyled mb-0">
                                        ${project.tasks.slice(0, 3).map(task => `<li><small>• ${task}</small></li>`).join('')}
                                        ${project.tasks.length > 3 ? `<li><small>... 還有 ${project.tasks.length - 3} 項</small></li>` : ''}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        content += '</div>';

        return content;
    }

    // 生成成員專案查看模態框
    generateMemberProjectsModal(memberId) {
        const member = this.dataManager.getAllMembers()[memberId];
        if (!member) {
            return `<div class="alert alert-danger">找不到成員 ${memberId}</div>`;
        }

        const assignments = this.dataManager.getAllAssignments();
        const memberProjects = [];
        const memberUtilization = this.statistics.calculateMemberUtilization()[memberId];

        // 收集成員參與的專案
        Object.values(assignments).forEach(project => {
            if (project.members && project.members[memberId]) {
                const memberRole = project.members[memberId];
                memberProjects.push({
                    projectId: project.projectId,
                    projectName: project.projectName,
                    status: project.status,
                    role: memberRole.role,
                    assignedDate: memberRole.assignedDate,
                    tasks: memberRole.tasks || [],
                    lastUpdated: project.lastUpdated
                });
            }
        });

        return `
            <div class="modal fade" id="memberProjectsModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header bg-info text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-project-diagram me-2"></i>${member.name} 的專案參與情況
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <!-- 成員概況 -->
                            <div class="row g-4 mb-4">
                                <div class="col-md-8">
                                    <div class="card bg-light">
                                        <div class="card-body">
                                            <div class="d-flex align-items-center">
                                                <div class="avatar-placeholder me-3" style="width: 60px; height: 60px; background: #007bff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">
                                                    ${member.name.slice(-2)}
                                                </div>
                                                <div>
                                                    <h5 class="mb-1">${member.name}</h5>
                                                    <p class="text-muted mb-1">成員 ID: ${member.id}</p>
                                                    <p class="text-muted mb-0">加入日期: ${member.joinDate || '2025-01-01'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="card bg-primary text-white">
                                        <div class="card-body text-center">
                                            <h3 class="mb-1">${memberProjects.length}</h3>
                                            <p class="mb-0">參與專案總數</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 工作負載統計 -->
                            <div class="row g-4 mb-4">
                                <div class="col-md-3">
                                    <div class="card bg-success text-white">
                                        <div class="card-body text-center">
                                            <h4 class="mb-1">${memberUtilization?.activeProjects || 0}</h4>
                                            <small>進行中專案</small>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card bg-info text-white">
                                        <div class="card-body text-center">
                                            <h4 class="mb-1">${memberUtilization?.completedProjects || 0}</h4>
                                            <small>已完成專案</small>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card bg-warning text-white">
                                        <div class="card-body text-center">
                                            <h4 class="mb-1">${memberUtilization?.roles?.length || 0}</h4>
                                            <small>擔任角色數</small>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card bg-secondary text-white">
                                        <div class="card-body text-center">
                                            <h4 class="mb-1">${memberProjects.reduce((total, p) => total + p.tasks.length, 0)}</h4>
                                            <small>總任務數</small>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 專案詳細列表 -->
                            <div class="mb-3">
                                <h6 class="border-bottom pb-2">
                                    <i class="fas fa-list me-2"></i>專案詳細資訊
                                </h6>
                            </div>

                            ${memberProjects.length === 0 ?
                                '<div class="alert alert-info"><i class="fas fa-info-circle me-2"></i>此成員目前未參與任何專案</div>' :
                                this.generateDetailedProjectsList(memberProjects, memberId)
                            }

                            <!-- 時間軸 -->
                            ${memberProjects.length > 0 ? `
                                <div class="mt-4">
                                    <h6 class="border-bottom pb-2">
                                        <i class="fas fa-history me-2"></i>專案參與時間軸
                                    </h6>
                                    ${this.generateProjectTimeline(memberProjects)}
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-2"></i>關閉
                            </button>
                            <button type="button" class="btn btn-success me-2" onclick="teamManagement.assignMemberToProject('${memberId}')">
                                <i class="fas fa-plus me-2"></i>分配專案
                            </button>
                            <button type="button" class="btn btn-primary" onclick="teamManagement.editMember('${memberId}')">
                                <i class="fas fa-edit me-2"></i>編輯成員資料
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 生成詳細專案列表
    generateDetailedProjectsList(memberProjects, memberId) {
        let content = '<div class="row g-3">';

        memberProjects.forEach(project => {
            const statusConfig = {
                active: { name: '進行中', color: 'success', icon: 'fas fa-play-circle' },
                completed: { name: '已完成', color: 'primary', icon: 'fas fa-check-circle' },
                paused: { name: '已暫停', color: 'warning', icon: 'fas fa-pause-circle' },
                cancelled: { name: '已取消', color: 'danger', icon: 'fas fa-times-circle' }
            };

            const status = statusConfig[project.status] || statusConfig.active;
            const roleInfo = this.dataManager.getAllRoles()[project.role];

            content += `
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6 class="card-title mb-0">${project.projectName}</h6>
                            <span class="badge bg-${status.color}">
                                <i class="${status.icon} me-1"></i>${status.name}
                            </span>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <div class="d-flex align-items-center mb-2">
                                    <i class="fas fa-user-tag me-2 text-muted"></i>
                                    <strong>擔任角色：</strong>
                                    <span class="badge ms-2" style="background-color: ${roleInfo?.color || '#6c757d'}">
                                        ${roleInfo?.icon || '[?]'} ${roleInfo?.name || project.role}
                                    </span>
                                </div>
                                <div class="d-flex align-items-center mb-2">
                                    <i class="fas fa-calendar-plus me-2 text-muted"></i>
                                    <strong>加入日期：</strong>
                                    <span class="ms-2">${project.assignedDate}</span>
                                </div>
                                <div class="d-flex align-items-center">
                                    <i class="fas fa-clock me-2 text-muted"></i>
                                    <strong>最後更新：</strong>
                                    <span class="ms-2">${project.lastUpdated}</span>
                                </div>
                            </div>

                            ${project.tasks.length > 0 ? `
                                <div>
                                    <strong class="d-flex align-items-center mb-2">
                                        <i class="fas fa-tasks me-2 text-muted"></i>
                                        負責任務 (${project.tasks.length} 項)
                                    </strong>
                                    <ul class="list-group list-group-flush">
                                        ${project.tasks.map(task => `
                                            <li class="list-group-item px-0 py-1">
                                                <i class="fas fa-check-circle me-2 text-success"></i>
                                                ${task}
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                            ` : `
                                <div class="alert alert-light mb-3">
                                    <i class="fas fa-info-circle me-2"></i>
                                    尚未指派具體任務
                                </div>
                            `}

                            <!-- 專案操作按鈕 -->
                            <div class="border-top pt-3 mt-3">
                                <div class="btn-group w-100" role="group">
                                    <button type="button" class="btn btn-outline-warning btn-sm"
                                            onclick="teamManagement.changeMemberRole('${memberId}', '${project.projectId}', '${project.role}')"
                                            title="變更角色">
                                        <i class="fas fa-exchange-alt"></i>
                                    </button>
                                    <button type="button" class="btn btn-outline-info btn-sm"
                                            onclick="teamManagement.editMemberTasks('${memberId}', '${project.projectId}')"
                                            title="編輯任務">
                                        <i class="fas fa-tasks"></i>
                                    </button>
                                    <button type="button" class="btn btn-outline-danger btn-sm"
                                            onclick="teamManagement.removeMemberFromProject('${memberId}', '${project.projectId}')"
                                            title="移除專案">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        content += '</div>';
        return content;
    }

    // 生成專案時間軸
    generateProjectTimeline(memberProjects) {
        // 按日期排序
        const sortedProjects = memberProjects.sort((a, b) =>
            new Date(a.assignedDate) - new Date(b.assignedDate)
        );

        let content = '<div class="timeline">';

        sortedProjects.forEach((project, index) => {
            const statusConfig = {
                active: { color: 'success', icon: 'fas fa-play-circle' },
                completed: { color: 'primary', icon: 'fas fa-check-circle' },
                paused: { color: 'warning', icon: 'fas fa-pause-circle' },
                cancelled: { color: 'danger', icon: 'fas fa-times-circle' }
            };

            const status = statusConfig[project.status] || statusConfig.active;

            content += `
                <div class="d-flex mb-3">
                    <div class="flex-shrink-0 me-3">
                        <div class="bg-${status.color} rounded-circle d-flex align-items-center justify-content-center text-white"
                             style="width: 40px; height: 40px;">
                            <i class="${status.icon}"></i>
                        </div>
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1">${project.projectName}</h6>
                                <p class="text-muted mb-1">
                                    以 <strong>${project.role}</strong> 身份加入
                                </p>
                                <small class="text-muted">${project.assignedDate}</small>
                            </div>
                            <span class="badge bg-${status.color}">${project.status}</span>
                        </div>
                        ${index < sortedProjects.length - 1 ? '<hr class="my-3">' : ''}
                    </div>
                </div>
            `;
        });

        content += '</div>';
        return content;
    }

    // 生成專案成員分配清單
    generateProjectMemberList() {
        const assignments = this.dataManager.getAllAssignments();
        const members = this.dataManager.getAllMembers();

        let content = `
            <div class="card mb-3">
                <div class="card-header">
                    <h6 class="mb-0">
                        <i class="fas fa-list-ul me-2"></i>詳細專案分配清單
                    </h6>
                </div>
                <div class="card-body">
                    <div class="row g-3">
        `;

        Object.values(assignments).forEach(project => {
            const statusBadge = project.status === 'active' ? 'bg-success' :
                               project.status === 'completed' ? 'bg-primary' : 'bg-secondary';

            content += `
                <div class="col-md-6">
                    <div class="card border">
                        <div class="card-header py-2">
                            <div class="d-flex justify-content-between align-items-center">
                                <h6 class="mb-0">${project.projectName}</h6>
                                <span class="badge ${statusBadge}">${project.status}</span>
                            </div>
                        </div>
                        <div class="card-body p-2">
                            <ul class="list-unstyled mb-0">
            `;

            if (project.members) {
                Object.keys(project.members).forEach(memberId => {
                    const memberRole = project.members[memberId];
                    const member = members[memberId];
                    const roleInfo = this.dataManager.getAllRoles()[memberRole.role];

                    content += `
                        <li class="d-flex justify-content-between align-items-center py-1">
                            <span>
                                <strong>${member?.name || memberId}</strong>
                                <small class="text-muted">(${memberId})</small>
                            </span>
                            <span class="badge" style="background-color: ${roleInfo?.color || '#6c757d'}">
                                ${roleInfo?.name || memberRole.role}
                            </span>
                        </li>
                    `;
                });
            }

            content += `
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        });

        // 顯示未分配的成員
        const assignedMembers = new Set();
        Object.values(assignments).forEach(project => {
            if (project.members) {
                Object.keys(project.members).forEach(memberId => {
                    assignedMembers.add(memberId);
                });
            }
        });

        const unassignedMembers = Object.keys(members).filter(memberId => !assignedMembers.has(memberId));

        if (unassignedMembers.length > 0) {
            content += `
                <div class="col-12">
                    <div class="card border-warning">
                        <div class="card-header py-2 bg-warning text-dark">
                            <h6 class="mb-0">
                                <i class="fas fa-user-clock me-2"></i>未分配專案的成員 (${unassignedMembers.length} 人)
                            </h6>
                        </div>
                        <div class="card-body p-2">
                            <div class="row g-2">
            `;

            unassignedMembers.forEach(memberId => {
                const member = members[memberId];
                content += `
                    <div class="col-md-3">
                        <div class="d-flex align-items-center">
                            <div class="me-2" style="width: 8px; height: 8px; background: #ffc107; border-radius: 50%;"></div>
                            <span>${member?.name || memberId} <small class="text-muted">(${memberId})</small></span>
                        </div>
                    </div>
                `;
            });

            content += `
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        content += `
                    </div>
                </div>
            </div>
        `;

        return content;
    }

    // 獲取成員專案參與資訊
    getMemberProjectInfo(memberId, activeProjects) {
        const assignments = this.dataManager.getAllAssignments();
        const memberProjects = [];

        Object.values(assignments).forEach(project => {
            if (project.members && project.members[memberId]) {
                // 取得專案名稱的簡短版本（去除前綴和描述）
                const projectShortName = project.projectName.split(' - ')[0];
                memberProjects.push({
                    name: projectShortName,
                    status: project.status,
                    role: project.members[memberId].role
                });
            }
        });

        if (memberProjects.length === 0) {
            return '尚未參與任何專案';
        } else if (memberProjects.length === 1) {
            const project = memberProjects[0];
            return `目前參與「${project.name}」專案`;
        } else {
            const projectNames = memberProjects.map(p => p.name).join('、');
            return `目前參與 ${memberProjects.length} 個專案：${projectNames}`;
        }
    }

    // 獲取實際參與專案的成員數量
    getActualProjectParticipants() {
        const assignments = this.dataManager.getAllAssignments();
        const participatingMembers = new Set();

        Object.values(assignments).forEach(project => {
            if (project.members) {
                Object.keys(project.members).forEach(memberId => {
                    participatingMembers.add(memberId);
                });
            }
        });

        return participatingMembers.size;
    }

    // 獲取自動同步狀態
    getAutoSyncStatus() {
        return localStorage.getItem('autoSyncEnabled') === 'true';
    }

    // 顯示 Toast 通知
    showToast(title, message, type = 'info') {
        const toastId = 'toast-' + Date.now();
        const bgClass = type === 'success' ? 'bg-success' :
                       type === 'warning' ? 'bg-warning' :
                       type === 'error' ? 'bg-danger' : 'bg-info';

        const toastHtml = `
            <div class="toast ${bgClass} text-white" id="${toastId}" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header ${bgClass} text-white border-0">
                    <strong class="me-auto">${title}</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;

        // 創建 toast 容器（如果不存在）
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        // 添加並顯示 toast
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 3000 });
        toast.show();

        // 清理
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    // 生成新增專案模態框
    generateAddProjectModal() {
        return `
            <div class="modal fade" id="addProjectModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-plus-circle me-2"></i>新增專案
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="addProjectForm">
                                <div class="row g-3">
                                    <!-- 基本資訊 -->
                                    <div class="col-12">
                                        <h6 class="text-primary border-bottom pb-2">
                                            <i class="fas fa-info-circle me-2"></i>專案基本資訊
                                        </h6>
                                    </div>

                                    <div class="col-md-6">
                                        <label class="form-label">專案 ID <span class="text-danger">*</span></label>
                                        <input type="text" class="form-control" id="projectId" required
                                               placeholder="例：ErExample"
                                               pattern="[A-Za-z][A-Za-z0-9]*"
                                               title="請輸入以字母開頭的專案ID">
                                        <small class="text-muted">唯一識別碼，建議使用英文字母開頭</small>
                                    </div>

                                    <div class="col-md-6">
                                        <label class="form-label">專案狀態</label>
                                        <select class="form-select" id="projectStatus">
                                            <option value="active">進行中</option>
                                            <option value="planning">規劃中</option>
                                            <option value="completed">已完成</option>
                                            <option value="suspended">暫停</option>
                                        </select>
                                    </div>

                                    <div class="col-12">
                                        <label class="form-label">專案名稱 <span class="text-danger">*</span></label>
                                        <input type="text" class="form-control" id="projectName" required
                                               placeholder="例：ErExample - 範例專案系統">
                                        <small class="text-muted">建議格式：專案代號 - 專案描述</small>
                                    </div>

                                    <div class="col-12">
                                        <label class="form-label">專案描述</label>
                                        <textarea class="form-control" id="projectDescription" rows="3"
                                                  placeholder="請描述專案的目標、功能和技術特色..."></textarea>
                                    </div>

                                    <div class="col-md-6">
                                        <label class="form-label">開始日期</label>
                                        <input type="date" class="form-control" id="projectStartDate"
                                               value="${new Date().toISOString().split('T')[0]}">
                                    </div>

                                    <div class="col-md-6">
                                        <label class="form-label">預計完成日期</label>
                                        <input type="date" class="form-control" id="projectEndDate">
                                        <small class="text-muted">可選，用於專案排程規劃</small>
                                    </div>

                                    <!-- 提示資訊 -->
                                    <div class="col-12">
                                        <div class="alert alert-info">
                                            <i class="fas fa-lightbulb me-2"></i>
                                            <strong>提示：</strong>專案建立後，您可以在專案管理中為其分配團隊成員和角色。
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-2"></i>取消
                            </button>
                            <button type="button" class="btn btn-primary" onclick="teamManagement.saveNewProject()">
                                <i class="fas fa-save me-2"></i>創建專案
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// 匯出給其他模組使用
window.TeamUIComponents = TeamUIComponents;