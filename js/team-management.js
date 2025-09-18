// 團隊成員管理系統
class TeamManagement {
    constructor() {
        this.members = {};
        this.roles = {};
        this.assignments = {};
        this.constraints = {};
        this.init();
    }

    async init() {
        try {
            await this.loadTeamData();
            await this.loadAssignments();
            await this.loadLocalChanges(); // 載入本地變更
            await this.loadLocalMemberChanges(); // 載入本地成員變更
            console.log('[OK] 團隊管理系統初始化完成');
        } catch (error) {
            console.error('[ERROR] 團隊管理系統初始化失敗:', error);
        }
    }

    async loadTeamData() {
        const response = await fetch('config/team-members.json');
        const data = await response.json();

        // 先載入預設資料
        this.members = data.members;
        this.roles = data.roles;
        this.teamConfig = data; // 載入完整的團隊配置，包含 groups

        // 然後覆蓋本地儲存的變更（如果有的話）
        const savedMembers = localStorage.getItem('teamMemberChanges');
        if (savedMembers) {
            const localMembers = JSON.parse(savedMembers);
            // 合併本地變更到成員資料
            Object.keys(localMembers).forEach(memberId => {
                if (this.members[memberId]) {
                    this.members[memberId] = { ...this.members[memberId], ...localMembers[memberId] };
                    this.teamConfig.members[memberId] = { ...this.teamConfig.members[memberId], ...localMembers[memberId] };
                }
            });
            console.log('已載入本地成員變更');
        }

        // 載入本地儲存的組名變更
        const savedGroups = localStorage.getItem('teamGroupChanges');
        if (savedGroups) {
            const localGroups = JSON.parse(savedGroups);
            Object.keys(localGroups).forEach(groupId => {
                if (this.teamConfig.groups && this.teamConfig.groups[groupId]) {
                    this.teamConfig.groups[groupId] = { ...this.teamConfig.groups[groupId], ...localGroups[groupId] };
                }
            });
            console.log('已載入本地組織變更');
        }

        console.log('團隊資料載入完成 - groups:', data.groups ? Object.keys(data.groups).length : 0);
    }

    async loadAssignments() {
        const response = await fetch('config/project-assignments.json');
        const data = await response.json();
        this.assignments = data.assignments;
        this.constraints = data.constraints;
    }

    // 載入本地變更
    async loadLocalChanges() {
        try {
            const localAssignments = localStorage.getItem('teamAssignments');
            if (localAssignments) {
                const savedAssignments = JSON.parse(localAssignments);
                // 合併本地變更與原始資料
                this.assignments = { ...this.assignments, ...savedAssignments };
                console.log('[OK] 已載入本地團隊變更');
            }
        } catch (error) {
            console.error('[ERROR] 載入本地變更失敗:', error);
        }
    }

    // 儲存變更到本地
    saveToLocal() {
        try {
            // 只儲存已修改的專案
            const modifiedAssignments = {};
            Object.keys(this.assignments).forEach(projectId => {
                const assignment = this.assignments[projectId];
                // 檢查是否有本地修改（通過 lastUpdated 或其他標記）
                if (assignment.locallyModified || this.hasLocalChanges(projectId)) {
                    modifiedAssignments[projectId] = {
                        ...assignment,
                        locallyModified: true,
                        localSaveTime: new Date().toISOString()
                    };
                }
            });

            localStorage.setItem('teamAssignments', JSON.stringify(modifiedAssignments));
            console.log('[OK] 團隊變更已儲存到本地');
            return true;
        } catch (error) {
            console.error('[ERROR] 本地儲存失敗:', error);
            return false;
        }
    }

    // 檢查專案是否有本地變更
    hasLocalChanges(projectId) {
        // 簡單的檢查邏輯，可以根據需要擴展
        const assignment = this.assignments[projectId];
        return assignment && assignment.locallyModified;
    }

    // 清除本地變更
    clearLocalChanges() {
        try {
            localStorage.removeItem('teamAssignments');
            console.log('[OK] 已清除本地團隊變更');
        } catch (error) {
            console.error('[ERROR] 清除本地變更失敗:', error);
        }
    }

    // 匯出團隊資料
    exportTeamData() {
        const exportData = {
            assignments: this.assignments,
            constraints: this.constraints,
            exportTime: new Date().toISOString(),
            version: '1.0'
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `team-assignments-${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        this.showToast('匯出成功', '團隊分配資料已匯出', 'success');
    }

    // 獲取專案成員分配
    getProjectAssignments(projectId) {
        return this.assignments[projectId] || null;
    }

    // 獲取成員在專案中的角色
    getMemberRole(projectId, memberId) {
        const project = this.assignments[projectId];
        if (!project || !project.members[memberId]) {
            return null;
        }
        return project.members[memberId];
    }

    // 檢查成員是否可以分配到指定角色
    canAssignMemberToRole(projectId, memberId, role) {
        const project = this.assignments[projectId];

        // 檢查成員是否已在該專案中擁有其他角色
        if (project && project.members[memberId]) {
            const currentRole = project.members[memberId].role;
            if (currentRole !== role) {
                return {
                    success: false,
                    reason: `成員${memberId}已在${projectId}專案中擔任${this.roles[currentRole].name}，不能同時擔任${this.roles[role].name}`
                };
            }
        }

        // 檢查成員是否具備該技能
        const member = this.members[memberId];
        if (!member || !member.skills.includes(role)) {
            return {
                success: false,
                reason: `成員${memberId}不具備${this.roles[role].name}技能`
            };
        }

        return { success: true };
    }

    // 獲取專案團隊概覽
    getProjectTeamOverview(projectId) {
        const project = this.assignments[projectId];
        if (!project) return null;

        const overview = {
            projectId,
            projectName: project.projectName,
            status: project.status,
            lastUpdated: project.lastUpdated,
            roles: {
                frontend: [],
                backend: [],
                testing: []
            },
            totalMembers: 0
        };

        Object.values(project.members).forEach(assignment => {
            const member = this.members[assignment.memberId];
            const roleInfo = {
                memberId: assignment.memberId,
                memberName: member.name,
                avatar: member.avatar,
                assignedDate: assignment.assignedDate,
                tasks: assignment.tasks
            };

            overview.roles[assignment.role].push(roleInfo);
            overview.totalMembers++;
        });

        return overview;
    }

    // 獲取所有可用成員（未在指定專案中分配的成員）
    getAvailableMembers(projectId) {
        const project = this.assignments[projectId];
        const assignedMemberIds = project ? Object.keys(project.members) : [];

        return Object.values(this.members).filter(member =>
            !assignedMemberIds.includes(member.id)
        );
    }

    // 獲取成員工作負載統計
    getMemberWorkload(memberId) {
        const workload = {
            memberId,
            memberName: this.members[memberId]?.name || `成員${memberId}`,
            projects: [],
            totalProjects: 0,
            roles: {
                frontend: 0,
                backend: 0,
                testing: 0
            }
        };

        Object.entries(this.assignments).forEach(([projectId, project]) => {
            if (project.members[memberId]) {
                const assignment = project.members[memberId];
                workload.projects.push({
                    projectId,
                    projectName: project.projectName,
                    role: assignment.role,
                    roleName: this.roles[assignment.role].name,
                    assignedDate: assignment.assignedDate,
                    tasks: assignment.tasks,
                    status: project.status
                });
                workload.roles[assignment.role]++;
                workload.totalProjects++;
            }
        });

        return workload;
    }

    // 生成團隊統計報告
    generateTeamStatistics() {
        const stats = {
            totalMembers: Object.keys(this.members).length,
            totalProjects: Object.keys(this.assignments).length,
            activeProjects: 0,
            completedProjects: 0,
            memberUtilization: {},
            roleDistribution: {
                frontend: 0,
                backend: 0,
                testing: 0
            },
            availableMembers: []
        };

        // 計算專案狀態
        Object.values(this.assignments).forEach(project => {
            if (project.status === 'active') {
                stats.activeProjects++;
            } else if (project.status === 'completed') {
                stats.completedProjects++;
            }

            // 計算角色分布
            Object.values(project.members).forEach(assignment => {
                stats.roleDistribution[assignment.role]++;
            });
        });

        // 計算成員利用率
        Object.keys(this.members).forEach(memberId => {
            const workload = this.getMemberWorkload(memberId);
            stats.memberUtilization[memberId] = {
                name: workload.memberName,
                projects: workload.totalProjects,
                roles: workload.roles
            };

            if (workload.totalProjects === 0) {
                stats.availableMembers.push(memberId);
            }
        });

        return stats;
    }

    // 渲染專案團隊卡片
    renderProjectTeamCard(projectId) {
        const overview = this.getProjectTeamOverview(projectId);
        if (!overview) return '';

        const statusBadge = overview.status === 'completed' ?
            '<span class="badge bg-success">已完成</span>' :
            '<span class="badge bg-primary">進行中</span>';

        return `
            <div class="card mt-3">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">
                        <i class="fas fa-users me-2"></i>
                        專案團隊 (${overview.totalMembers}人)
                    </h6>
                    <div>
                        ${statusBadge}
                        <button class="btn btn-outline-primary btn-sm ms-2" onclick="teamManagement.openTeamEditor('${projectId}')">
                            <i class="fas fa-edit me-1"></i>編輯團隊
                        </button>
                    </div>
                </div>
                <div class="card-body" id="teamCardBody-${projectId}">
                    <div class="row">
                        ${this.renderRoleSection('frontend', overview.roles.frontend, projectId)}
                        ${this.renderRoleSection('backend', overview.roles.backend, projectId)}
                        ${this.renderRoleSection('testing', overview.roles.testing, projectId)}
                    </div>
                    <small class="text-muted">最後更新：${overview.lastUpdated}</small>
                </div>
            </div>
        `;
    }

    renderRoleSection(roleKey, members, projectId) {
        const role = this.roles[roleKey];
        if (!role) return '';

        const memberCards = members.map(member => `
            <div class="d-flex align-items-center mb-2 member-assignment" data-member-id="${member.memberId}" data-role="${roleKey}">
                <span class="me-2" style="font-size: 1.2em;">${member.avatar}</span>
                <div class="flex-grow-1">
                    <div class="fw-bold">${member.memberName}</div>
                    <small class="text-muted">${member.tasks.slice(0, 2).join('、')}</small>
                </div>
                <button class="btn btn-sm btn-outline-danger ms-2 remove-member-btn d-none"
                        onclick="teamManagement.removeMemberFromProject('${projectId}', '${member.memberId}', '${roleKey}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');

        return `
            <div class="col-md-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0" style="color: ${role.color}">
                        <span class="me-1">${role.icon}</span>
                        ${role.name}
                    </h6>
                    <button class="btn btn-sm btn-outline-success add-member-btn d-none"
                            onclick="teamManagement.openMemberSelector('${projectId}', '${roleKey}')">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                ${memberCards || '<small class="text-muted">尚未分配</small>'}
            </div>
        `;
    }

    // 開啟團隊編輯模式
    openTeamEditor(projectId) {
        const editButton = document.querySelector(`button[onclick="teamManagement.openTeamEditor('${projectId}')"]`);
        const cardBody = document.getElementById(`teamCardBody-${projectId}`);

        // 切換編輯按鈕文字
        if (editButton.innerHTML.includes('編輯團隊')) {
            editButton.innerHTML = '<i class="fas fa-save me-1"></i>保存變更';
            editButton.classList.remove('btn-outline-primary');
            editButton.classList.add('btn-success');
            editButton.onclick = () => this.saveTeamChanges(projectId);

            // 切換到編輯模式樣式
            cardBody.classList.add('team-edit-mode');

            // 顯示所有編輯按鈕
            cardBody.querySelectorAll('.add-member-btn, .remove-member-btn').forEach(btn => {
                btn.classList.remove('d-none');
            });

            // 顯示編輯提示
            this.showEditModeToast(projectId);
        } else {
            this.saveTeamChanges(projectId);
        }
    }

    // 保存團隊變更
    async saveTeamChanges(projectId) {
        const editButton = document.querySelector(`button[onclick*="${projectId}"]`);
        const cardBody = document.getElementById(`teamCardBody-${projectId}`);

        // 切換回檢視模式
        editButton.innerHTML = '<i class="fas fa-edit me-1"></i>編輯團隊';
        editButton.classList.remove('btn-success');
        editButton.classList.add('btn-outline-primary');
        editButton.onclick = () => this.openTeamEditor(projectId);

        // 移除編輯模式樣式
        cardBody.classList.remove('team-edit-mode');

        // 隱藏所有編輯按鈕
        cardBody.querySelectorAll('.add-member-btn, .remove-member-btn').forEach(btn => {
            btn.classList.add('d-none');
        });

        // 更新專案分配的最後更新時間和本地修改標記
        if (this.assignments[projectId]) {
            this.assignments[projectId].lastUpdated = new Date().toLocaleDateString('zh-TW');
            this.assignments[projectId].locallyModified = true;
        }

        // 儲存到本地
        const saveSuccess = this.saveToLocal();

        // 顯示保存成功訊息
        if (saveSuccess) {
            this.showSaveSuccessToast(projectId);
        } else {
            this.showToast('保存失敗', '無法儲存到本地', 'error');
        }

        // 重新載入團隊資料
        const overview = this.getProjectTeamOverview(projectId);
        if (overview) {
            const newContent = `
                <div class="row">
                    ${this.renderRoleSection('frontend', overview.roles.frontend, projectId)}
                    ${this.renderRoleSection('backend', overview.roles.backend, projectId)}
                    ${this.renderRoleSection('testing', overview.roles.testing, projectId)}
                </div>
                <small class="text-muted">最後更新：${new Date().toLocaleString('zh-TW')}</small>
            `;
            cardBody.innerHTML = newContent;
        }

        console.log('團隊變更已保存:', projectId);
    }

    // 開啟成員選擇器
    openMemberSelector(projectId, roleKey) {
        const availableMembers = this.getAvailableMembers(projectId);
        const role = this.roles[roleKey];

        if (availableMembers.length === 0) {
            alert('目前沒有可用的成員');
            return;
        }

        const modalContent = `
            <div class="modal fade" id="memberSelectorModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <span style="color: ${role.color}">${role.icon}</span>
                                選擇${role.name}成員
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                ${availableMembers.map(member => `
                                    <div class="col-md-6 mb-3">
                                        <div class="card member-selector-card"
                                             onclick="teamManagement.assignMemberToRole('${projectId}', '${member.id}', '${roleKey}')"
                                             style="cursor: pointer;">
                                            <div class="card-body text-center">
                                                <div style="font-size: 2em;">${member.avatar}</div>
                                                <h6 class="mt-2">${member.name}</h6>
                                                <small class="text-muted">加入日期：${member.joinDate}</small>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除現有模態框
        const existingModal = document.getElementById('memberSelectorModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 加入新模態框
        document.body.insertAdjacentHTML('beforeend', modalContent);

        // 顯示模態框
        const modal = new bootstrap.Modal(document.getElementById('memberSelectorModal'));
        modal.show();
    }

    // 分配成員到角色
    assignMemberToRole(projectId, memberId, roleKey) {
        // 檢查是否可以分配
        const canAssign = this.canAssignMemberToRole(projectId, memberId, roleKey);
        if (!canAssign.success) {
            this.showConflictError(canAssign.reason);
            return;
        }

        // 更新本地資料
        if (!this.assignments[projectId]) {
            this.assignments[projectId] = {
                projectId: projectId,
                projectName: `專案 ${projectId}`,
                members: {},
                status: 'active',
                lastUpdated: new Date().toLocaleDateString('zh-TW')
            };
        }

        this.assignments[projectId].members[memberId] = {
            memberId: memberId,
            role: roleKey,
            assignedDate: new Date().toLocaleDateString('zh-TW'),
            tasks: this.getDefaultTasksForRole(roleKey)
        };

        // 標記為本地修改
        this.assignments[projectId].locallyModified = true;

        // 關閉選擇器
        const modal = bootstrap.Modal.getInstance(document.getElementById('memberSelectorModal'));
        modal.hide();

        // 重新載入團隊卡片並顯示成功動畫
        this.reloadTeamCard(projectId);
        this.showAssignmentSuccess(projectId, memberId, roleKey);

        console.log(`成員 ${memberId} 已分配到 ${projectId} 專案的 ${roleKey} 角色`);
    }

    // 從專案移除成員
    removeMemberFromProject(projectId, memberId, roleKey) {
        if (confirm(`確定要從${this.roles[roleKey].name}角色移除${this.members[memberId].name}嗎？`)) {
            // 更新本地資料
            if (this.assignments[projectId] && this.assignments[projectId].members[memberId]) {
                delete this.assignments[projectId].members[memberId];
                // 標記為本地修改
                this.assignments[projectId].locallyModified = true;
                this.assignments[projectId].lastUpdated = new Date().toLocaleDateString('zh-TW');
            }

            // 重新載入團隊卡片
            this.reloadTeamCard(projectId);

            // 自動儲存
            this.saveToLocal();

            console.log(`成員 ${memberId} 已從 ${projectId} 專案的 ${roleKey} 角色移除`);
            this.showToast('移除成功', `${this.members[memberId].name} 已從 ${this.roles[roleKey].name} 角色移除`, 'success');
        }
    }

    // 重新載入團隊卡片
    reloadTeamCard(projectId) {
        const cardBody = document.getElementById(`teamCardBody-${projectId}`);
        if (cardBody) {
            const overview = this.getProjectTeamOverview(projectId);
            if (overview) {
                cardBody.innerHTML = `
                    <div class="row">
                        ${this.renderRoleSection('frontend', overview.roles.frontend, projectId)}
                        ${this.renderRoleSection('backend', overview.roles.backend, projectId)}
                        ${this.renderRoleSection('testing', overview.roles.testing, projectId)}
                    </div>
                    <small class="text-muted">最後更新：${new Date().toLocaleString('zh-TW')}</small>
                `;
            }
        }
    }

    // 獲取角色的預設任務
    getDefaultTasksForRole(roleKey) {
        const defaultTasks = {
            frontend: ['UI 設計', '前端開發', '使用者體驗'],
            backend: ['API 開發', '資料庫設計', '服務架構'],
            testing: ['功能測試', '品質保證', '驗證報告']
        };
        return defaultTasks[roleKey] || [];
    }

    // 顯示編輯模式提示
    showEditModeToast(projectId) {
        this.showToast('編輯模式', `已進入 ${projectId} 專案的團隊編輯模式`, 'info');
    }

    // 顯示保存成功提示
    showSaveSuccessToast(projectId) {
        this.showToast('保存成功', `${projectId} 專案的團隊變更已保存`, 'success');
    }

    // 顯示角色衝突錯誤
    showConflictError(reason) {
        this.showToast('角色衝突', reason, 'warning');
    }

    // 顯示分配成功動畫
    showAssignmentSuccess(projectId, memberId, roleKey) {
        const memberName = this.members[memberId].name;
        const roleName = this.roles[roleKey].name;
        this.showToast('分配成功', `${memberName} 已成功分配為 ${roleName}`, 'success');

        // 為該成員添加成功樣式
        setTimeout(() => {
            const memberElement = document.querySelector(`[data-member-id="${memberId}"][data-role="${roleKey}"]`);
            if (memberElement) {
                memberElement.classList.add('assignment-success');
                setTimeout(() => {
                    memberElement.classList.remove('assignment-success');
                }, 2000);
            }
        }, 100);
    }

    // 通用 Toast 提示功能
    showToast(title, message, type = 'info') {
        const toastId = `toast-${Date.now()}`;
        const iconClass = {
            'success': 'fas fa-check-circle text-success',
            'warning': 'fas fa-exclamation-triangle text-warning',
            'error': 'fas fa-times-circle text-danger',
            'info': 'fas fa-info-circle text-info'
        }[type];

        const toastHtml = `
            <div class="toast align-items-center border-0" id="${toastId}" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        <div class="d-flex align-items-center">
                            <i class="${iconClass} me-2"></i>
                            <div>
                                <strong>${title}</strong><br>
                                <small>${message}</small>
                            </div>
                        </div>
                    </div>
                    <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

        // 確保 toast 容器存在
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '1200';
            document.body.appendChild(toastContainer);
        }

        // 加入 toast
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);

        // 顯示 toast
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
        toast.show();

        // 自動移除
        setTimeout(() => {
            if (toastElement && toastElement.parentNode) {
                toastElement.remove();
            }
        }, 4000);
    }

    // ==================== CRUD 功能擴展 ====================

    // 開啟團隊管理儀表板
    openTeamManagementDashboard() {
        const modalContent = `
            <div class="modal fade" id="teamManagementModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-users-cog me-2"></i>團隊管理中心
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <ul class="nav nav-tabs" id="teamManagementTabs" role="tablist">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link active" id="overview-tab" data-bs-toggle="tab" data-bs-target="#overview" type="button" role="tab">
                                        <i class="fas fa-chart-pie me-2"></i>總覽統計
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="projects-tab" data-bs-toggle="tab" data-bs-target="#projects" type="button" role="tab">
                                        <i class="fas fa-project-diagram me-2"></i>專案管理
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="members-tab" data-bs-toggle="tab" data-bs-target="#members" type="button" role="tab">
                                        <i class="fas fa-users me-2"></i>成員管理
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="settings-tab" data-bs-toggle="tab" data-bs-target="#settings" type="button" role="tab">
                                        <i class="fas fa-cog me-2"></i>系統設定
                                    </button>
                                </li>
                            </ul>
                            <div class="tab-content mt-3" id="teamManagementTabContent">
                                <div class="tab-pane fade show active" id="overview" role="tabpanel">
                                    <div id="teamOverviewContent">載入中...</div>
                                </div>
                                <div class="tab-pane fade" id="projects" role="tabpanel">
                                    <div id="projectManagementContent">載入中...</div>
                                </div>
                                <div class="tab-pane fade" id="members" role="tabpanel">
                                    <div id="memberManagementContent">載入中...</div>
                                </div>
                                <div class="tab-pane fade" id="settings" role="tabpanel">
                                    <div id="systemSettingsContent">載入中...</div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-primary" onclick="teamManagement.exportTeamData()">
                                <i class="fas fa-download me-2"></i>匯出資料
                            </button>
                            <button type="button" class="btn btn-outline-warning" onclick="teamManagement.clearLocalChanges()">
                                <i class="fas fa-eraser me-2"></i>清除本地變更
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除現有模態框
        const existingModal = document.getElementById('teamManagementModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 加入新模態框
        document.body.insertAdjacentHTML('beforeend', modalContent);

        // 顯示模態框
        const modal = new bootstrap.Modal(document.getElementById('teamManagementModal'));
        modal.show();

        // 載入各分頁內容
        this.loadTeamOverview();

        // 預載入成員管理資料以確保組織資料可用
        setTimeout(() => {
            if (this.teamConfig && this.teamConfig.groups) {
                console.log('預載入成員管理資料完成');
            }
        }, 1000);

        // 監聽分頁切換
        document.getElementById('projects-tab').addEventListener('click', () => this.loadProjectManagement());
        document.getElementById('members-tab').addEventListener('click', async () => {
            // 確保團隊資料已載入
            if (!this.teamConfig || !this.teamConfig.groups) {
                console.log('重新載入團隊資料...');
                await this.loadTeamData();
            }
            this.loadMemberManagement();
        });
        document.getElementById('settings-tab').addEventListener('click', () => this.loadSystemSettings());
    }

    // ==================== READ 功能 ====================

    // 載入團隊總覽
    loadTeamOverview() {
        const stats = this.generateTeamStatistics();
        const content = `
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body text-center">
                            <i class="fas fa-users fa-2x mb-2"></i>
                            <h3>${stats.totalMembers}</h3>
                            <p>總成員數</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body text-center">
                            <i class="fas fa-project-diagram fa-2x mb-2"></i>
                            <h3>${stats.activeProjects}</h3>
                            <p>活躍專案</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-info text-white">
                        <div class="card-body text-center">
                            <i class="fas fa-check-circle fa-2x mb-2"></i>
                            <h3>${stats.completedProjects}</h3>
                            <p>已完成專案</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning text-white">
                        <div class="card-body text-center">
                            <i class="fas fa-user-plus fa-2x mb-2"></i>
                            <h3>${stats.availableMembers.length}</h3>
                            <p>可用成員</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="fas fa-chart-bar me-2"></i>角色分布</h6>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <div class="d-flex justify-content-between">
                                    <span><i class="fas fa-paint-brush text-primary"></i> 前端開發</span>
                                    <span class="badge bg-primary">${stats.roleDistribution.frontend}</span>
                                </div>
                                <div class="progress mb-2">
                                    <div class="progress-bar bg-primary" style="width: ${(stats.roleDistribution.frontend / stats.totalProjects * 100)}%"></div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between">
                                    <span><i class="fas fa-cogs text-danger"></i> 後端開發</span>
                                    <span class="badge bg-danger">${stats.roleDistribution.backend}</span>
                                </div>
                                <div class="progress mb-2">
                                    <div class="progress-bar bg-danger" style="width: ${(stats.roleDistribution.backend / stats.totalProjects * 100)}%"></div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between">
                                    <span><i class="fas fa-vial text-success"></i> 測試驗證</span>
                                    <span class="badge bg-success">${stats.roleDistribution.testing}</span>
                                </div>
                                <div class="progress">
                                    <div class="progress-bar bg-success" style="width: ${(stats.roleDistribution.testing / stats.totalProjects * 100)}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="fas fa-users me-2"></i>成員工作負載</h6>
                        </div>
                        <div class="card-body">
                            <div style="max-height: 300px; overflow-y: auto;">
                                ${Object.entries(stats.memberUtilization).map(([memberId, data]) => `
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <div class="d-flex align-items-center">
                                            <span class="me-2">${this.members[memberId]?.avatar || '[U]'}</span>
                                            <span>${data.name}</span>
                                        </div>
                                        <div>
                                            <span class="badge ${data.projects === 0 ? 'bg-secondary' : data.projects > 2 ? 'bg-danger' : 'bg-success'}">${data.projects} 專案</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('teamOverviewContent').innerHTML = content;
    }

    // ==================== CREATE 功能 ====================

    // 載入專案管理
    loadProjectManagement() {
        const content = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6><i class="fas fa-project-diagram me-2"></i>專案管理</h6>
                <button class="btn btn-primary btn-sm" onclick="teamManagement.openCreateProjectModal()">
                    <i class="fas fa-plus me-2"></i>新增專案
                </button>
            </div>
            <div class="row" id="projectManagementList">
                ${Object.entries(this.assignments).map(([projectId, project]) => `
                    <div class="col-md-6 mb-3">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-0">${project.projectName}</h6>
                                    <small class="text-muted">ID: ${projectId}</small>
                                </div>
                                <div>
                                    <span class="badge ${project.status === 'active' ? 'bg-success' : 'bg-primary'}">${project.status === 'active' ? '進行中' : '已完成'}</span>
                                    <div class="btn-group btn-group-sm ms-2">
                                        <button class="btn btn-outline-primary btn-sm" onclick="teamManagement.editProject('${projectId}')">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-danger btn-sm" onclick="teamManagement.deleteProject('${projectId}')">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="card-body">
                                <div class="row text-center">
                                    <div class="col-4">
                                        <small class="text-muted">前端</small>
                                        <div class="fw-bold text-primary">${Object.values(project.members).filter(m => m.role === 'frontend').length}</div>
                                    </div>
                                    <div class="col-4">
                                        <small class="text-muted">後端</small>
                                        <div class="fw-bold text-danger">${Object.values(project.members).filter(m => m.role === 'backend').length}</div>
                                    </div>
                                    <div class="col-4">
                                        <small class="text-muted">測試</small>
                                        <div class="fw-bold text-success">${Object.values(project.members).filter(m => m.role === 'testing').length}</div>
                                    </div>
                                </div>
                                <div class="mt-2">
                                    <small class="text-muted">最後更新：${project.lastUpdated}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        document.getElementById('projectManagementContent').innerHTML = content;
    }

    // 新增專案模態框
    openCreateProjectModal() {
        const modalContent = `
            <div class="modal fade" id="createProjectModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-plus me-2"></i>新增專案
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="createProjectForm">
                                <div class="mb-3">
                                    <label class="form-label">專案 ID *</label>
                                    <input type="text" class="form-control" id="projectId" placeholder="例如：ErDemo" required>
                                    <small class="text-muted">建議以 Er 開頭</small>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">專案名稱 *</label>
                                    <input type="text" class="form-control" id="projectName" placeholder="例如：ErDemo - 示範專案" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">專案狀態</label>
                                    <select class="form-select" id="projectStatus">
                                        <option value="active">進行中</option>
                                        <option value="completed">已完成</option>
                                        <option value="planning">規劃中</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-primary" onclick="teamManagement.createProject()">建立專案</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除現有模態框
        const existing = document.getElementById('createProjectModal');
        if (existing) existing.remove();

        document.body.insertAdjacentHTML('beforeend', modalContent);
        const modal = new bootstrap.Modal(document.getElementById('createProjectModal'));
        modal.show();
    }

    // 建立新專案
    createProject() {
        const projectId = document.getElementById('projectId').value.trim();
        const projectName = document.getElementById('projectName').value.trim();
        const projectStatus = document.getElementById('projectStatus').value;

        if (!projectId || !projectName) {
            this.showToast('輸入錯誤', '請填寫所有必填欄位', 'warning');
            return;
        }

        if (this.assignments[projectId]) {
            this.showToast('專案已存在', `專案 ID "${projectId}" 已存在`, 'warning');
            return;
        }

        // 新增專案
        this.assignments[projectId] = {
            projectId: projectId,
            projectName: projectName,
            members: {},
            status: projectStatus,
            lastUpdated: new Date().toLocaleDateString('zh-TW'),
            locallyModified: true
        };

        // 儲存到本地
        this.saveToLocal();

        // 關閉模態框
        const modal = bootstrap.Modal.getInstance(document.getElementById('createProjectModal'));
        modal.hide();

        // 重新載入專案列表
        this.loadProjectManagement();

        this.showToast('建立成功', `專案 "${projectName}" 已建立`, 'success');
    }

    // ==================== UPDATE 功能 ====================

    // 編輯專案
    editProject(projectId) {
        const project = this.assignments[projectId];
        if (!project) return;

        const modalContent = `
            <div class="modal fade" id="editProjectModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-edit me-2"></i>編輯專案：${project.projectName}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editProjectForm">
                                <div class="mb-3">
                                    <label class="form-label">專案 ID</label>
                                    <input type="text" class="form-control" value="${projectId}" disabled>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">專案名稱 *</label>
                                    <input type="text" class="form-control" id="editProjectName" value="${project.projectName}" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">專案狀態</label>
                                    <select class="form-select" id="editProjectStatus">
                                        <option value="active" ${project.status === 'active' ? 'selected' : ''}>進行中</option>
                                        <option value="completed" ${project.status === 'completed' ? 'selected' : ''}>已完成</option>
                                        <option value="planning" ${project.status === 'planning' ? 'selected' : ''}>規劃中</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-primary" onclick="teamManagement.updateProject('${projectId}')">儲存變更</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除現有模態框
        const existing = document.getElementById('editProjectModal');
        if (existing) existing.remove();

        document.body.insertAdjacentHTML('beforeend', modalContent);
        const modal = new bootstrap.Modal(document.getElementById('editProjectModal'));
        modal.show();
    }

    // 更新專案
    updateProject(projectId) {
        const projectName = document.getElementById('editProjectName').value.trim();
        const projectStatus = document.getElementById('editProjectStatus').value;

        if (!projectName) {
            this.showToast('輸入錯誤', '請填寫專案名稱', 'warning');
            return;
        }

        // 更新專案資料
        this.assignments[projectId].projectName = projectName;
        this.assignments[projectId].status = projectStatus;
        this.assignments[projectId].lastUpdated = new Date().toLocaleDateString('zh-TW');
        this.assignments[projectId].locallyModified = true;

        // 儲存到本地
        this.saveToLocal();

        // 關閉模態框
        const modal = bootstrap.Modal.getInstance(document.getElementById('editProjectModal'));
        modal.hide();

        // 重新載入專案列表
        this.loadProjectManagement();

        this.showToast('更新成功', `專案 "${projectName}" 已更新`, 'success');
    }

    // ==================== DELETE 功能 ====================

    // 刪除專案
    deleteProject(projectId) {
        const project = this.assignments[projectId];
        if (!project) return;

        const memberCount = Object.keys(project.members).length;
        const confirmMessage = memberCount > 0
            ? `確定要刪除專案「${project.projectName}」嗎？這將移除 ${memberCount} 名成員的分配記錄。`
            : `確定要刪除專案「${project.projectName}」嗎？`;

        if (confirm(confirmMessage)) {
            delete this.assignments[projectId];
            this.saveToLocal();
            this.loadProjectManagement();
            this.showToast('刪除成功', `專案「${project.projectName}」已刪除`, 'success');
        }
    }

    // ==================== 成員管理 ====================

    // 載入成員管理
    loadMemberManagement() {
        console.log('=== 開始載入成員管理 ===');
        console.log('teamConfig 存在:', !!this.teamConfig);
        console.log('teamConfig.groups 存在:', !!(this.teamConfig?.groups));

        // 先顯示載入中狀態
        document.getElementById('memberManagementContent').innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">載入中...</span>
                </div>
                <div class="mt-2">正在載入團隊組織資料...</div>
            </div>
        `;

        const groups = this.teamConfig?.groups || {};
        console.log('找到的組織數量:', Object.keys(groups).length);
        console.log('組織列表:', Object.keys(groups));

        if (Object.keys(groups).length === 0) {
            // 如果沒有組織資料，顯示錯誤訊息
            document.getElementById('memberManagementContent').innerHTML = `
                <div class="alert alert-warning">
                    <h6><i class="fas fa-exclamation-triangle me-2"></i>組織資料載入失敗</h6>
                    <p>無法載入團隊組織結構。請檢查以下項目：</p>
                    <ul>
                        <li>確認 config/team-members.json 檔案包含 groups 區段</li>
                        <li>檢查瀏覽器開發者工具的 Console 是否有錯誤訊息</li>
                        <li>嘗試重新整理頁面</li>
                    </ul>
                    <button class="btn btn-primary btn-sm" onclick="teamManagement.loadTeamData().then(() => teamManagement.loadMemberManagement())">
                        <i class="fas fa-sync me-1"></i>重新載入組織資料
                    </button>
                </div>
            `;
            return;
        }

        const content = `
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">團隊組織管理</h6>
                    <div>
                        <button class="btn btn-success btn-sm me-1" onclick="teamManagement.saveToGoogleDrive()">
                            <i class="fab fa-google-drive me-1"></i>儲存到 Google Drive
                        </button>
                        <button class="btn btn-info btn-sm me-1" onclick="teamManagement.loadFromGoogleDrive()">
                            <i class="fas fa-cloud-download-alt me-1"></i>從 Google Drive 載入
                        </button>
                        <button class="btn btn-warning btn-sm me-1" onclick="teamManagement.checkForUpdates()">
                            <i class="fas fa-sync-alt me-1"></i>檢查更新
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="teamManagement.saveGroupChanges()">
                            <i class="fas fa-save me-1"></i>儲存變更
                        </button>
                    </div>
                </div>
            </div>

            ${Object.entries(groups).map(([groupId, group]) => {
                const groupMembers = group.members || [];
                return `
                    <div class="card mb-4" style="border-left: 4px solid ${group.color};">
                        <div class="card-header" style="background-color: ${group.color}20;">
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="d-flex align-items-center">
                                    <div class="editable-group-name" data-group-id="${groupId}">
                                        <span class="group-name-display fw-bold">${group.name}</span>
                                        <input type="text" class="form-control form-control-sm group-name-input d-none"
                                               value="${group.name}" style="display: none;">
                                    </div>
                                    <button class="btn btn-outline-secondary btn-sm ms-2"
                                            onclick="teamManagement.editGroupName('${groupId}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </div>
                                <div class="text-muted">
                                    <small>${group.description} | ${groupMembers.length} 位成員</small>
                                </div>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                ${groupMembers.map(memberId => {
                                    const member = this.members[memberId];
                                    if (!member) return '';
                                    const workload = this.getMemberWorkload(memberId);
                                    return `
                                        <div class="col-md-4 col-lg-2 mb-3">
                                            <div class="card border-0 shadow-sm">
                                                <div class="card-body text-center p-2">
                                                    <div style="font-size: 1.5em; font-weight: bold; color: ${group.color};">${memberId.charAt(0)}</div>

                                                    <!-- 可編輯的成員名稱 -->
                                                    <div class="mt-1 mb-1">
                                                        <div class="editable-member-name" data-member-id="${memberId}">
                                                            <div class="member-name-display mb-0" style="font-size: 0.9em; font-weight: 600;">${member.name}</div>
                                                            <input type="text" class="form-control form-control-sm member-name-input d-none"
                                                                   value="${member.name}" style="display: none;">
                                                        </div>
                                                        <button class="btn btn-link btn-sm p-0" style="font-size: 0.6em;"
                                                                onclick="teamManagement.editMemberName('${memberId}')">
                                                            <i class="fas fa-edit text-muted"></i>
                                                        </button>
                                                    </div>

                                                    <!-- 固定的成員ID -->
                                                    <small class="text-muted" style="font-size: 0.75em;">ID: ${member.id}</small>

                                                    <!-- 可編輯的備註 -->
                                                    <div class="mt-1 mb-1">
                                                        <div class="editable-member-notes" data-member-id="${memberId}">
                                                            <small class="member-notes-display text-muted" style="font-size: 0.7em;">${member.notes && member.notes !== '備註' ? member.notes : '點擊新增備註'}</small>
                                                            <input type="text" class="form-control form-control-sm member-notes-input d-none"
                                                                   value="${member.notes || ''}" style="display: none;" placeholder="輸入備註...">
                                                        </div>
                                                        <button class="btn btn-link btn-sm p-0" style="font-size: 0.5em;"
                                                                onclick="teamManagement.editMemberNotes('${memberId}')">
                                                            <i class="fas fa-edit text-muted"></i>
                                                        </button>
                                                    </div>
                                                    <div class="mt-1">
                                                        <span class="badge ${workload.totalProjects === 0 ? 'bg-secondary' : workload.totalProjects > 2 ? 'bg-danger' : 'bg-success'}" style="font-size: 0.7em;">
                                                            ${workload.totalProjects} 專案
                                                        </span>
                                                    </div>
                                                    <div class="mt-1 d-flex gap-1 justify-content-center">
                                                        <button class="btn btn-outline-primary btn-sm py-1 px-2" style="font-size: 0.7em;"
                                                                onclick="teamManagement.viewMemberDetails('${memberId}')">
                                                            <i class="fas fa-eye"></i>
                                                        </button>
                                                        <button class="btn btn-outline-secondary btn-sm py-1 px-2" style="font-size: 0.7em;"
                                                                onclick="teamManagement.editMemberProjects('${memberId}')">
                                                            <i class="fas fa-edit"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}

                                ${groupMembers.length === 0 ? `
                                    <div class="col-12">
                                        <div class="text-center text-muted py-4">
                                            <i class="fas fa-users fa-2x mb-2"></i>
                                            <p>此組目前沒有成員</p>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        `;

        document.getElementById('memberManagementContent').innerHTML = content;
    }

    // 查看成員詳情
    viewMemberDetails(memberId) {
        const member = this.members[memberId];
        const workload = this.getMemberWorkload(memberId);

        const modalContent = `
            <div class="modal fade" id="memberDetailsModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <span style="font-size: 1.5em;">${member.avatar}</span>
                                ${member.name} 的詳細資料
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-3">
                                <div class="col-6">
                                    <strong>成員 ID：</strong>${member.id}
                                </div>
                                <div class="col-6">
                                    <strong>加入日期：</strong>${member.joinDate}
                                </div>
                            </div>
                            <div class="mb-3">
                                <strong>技能：</strong>
                                ${member.skills.map(skill => `<span class="badge bg-primary me-1">${this.roles[skill]?.name || skill}</span>`).join('')}
                            </div>
                            <div class="mb-3">
                                <strong>目前專案分配：</strong>
                                ${workload.projects.length === 0 ?
                                    '<p class="text-muted">目前沒有分配到任何專案</p>' :
                                    workload.projects.map(project => `
                                        <div class="card mb-2">
                                            <div class="card-body py-2">
                                                <div class="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <strong>${project.projectName}</strong>
                                                        <br><small class="text-muted">角色：${project.roleName}</small>
                                                    </div>
                                                    <span class="badge ${project.status === 'active' ? 'bg-success' : 'bg-primary'}">${project.status === 'active' ? '進行中' : '已完成'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')
                                }
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除現有模態框
        const existing = document.getElementById('memberDetailsModal');
        if (existing) existing.remove();

        document.body.insertAdjacentHTML('beforeend', modalContent);
        const modal = new bootstrap.Modal(document.getElementById('memberDetailsModal'));
        modal.show();
    }

    // ==================== 系統設定 ====================

    // 載入系統設定
    loadSystemSettings() {
        const localData = localStorage.getItem('teamAssignments');
        const hasLocalChanges = localData !== null;

        const content = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="fas fa-database me-2"></i>資料管理</h6>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label class="form-label">本地變更狀態</label>
                                <div class="alert ${hasLocalChanges ? 'alert-warning' : 'alert-success'}">
                                    <i class="fas ${hasLocalChanges ? 'fa-exclamation-triangle' : 'fa-check-circle'} me-2"></i>
                                    ${hasLocalChanges ? '有未同步的本地變更' : '與原始資料同步'}
                                </div>
                            </div>
                            <div class="d-grid gap-2">
                                <button class="btn btn-primary" onclick="teamManagement.exportTeamData()">
                                    <i class="fas fa-download me-2"></i>匯出所有資料
                                </button>
                                <button class="btn btn-outline-warning" onclick="teamManagement.clearLocalChanges(); teamManagement.loadSystemSettings();">
                                    <i class="fas fa-eraser me-2"></i>清除本地變更
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="fas fa-info-circle me-2"></i>系統資訊</h6>
                        </div>
                        <div class="card-body">
                            <div class="mb-2">
                                <strong>總成員數：</strong>${Object.keys(this.members).length}
                            </div>
                            <div class="mb-2">
                                <strong>總專案數：</strong>${Object.keys(this.assignments).length}
                            </div>
                            <div class="mb-2">
                                <strong>本地儲存空間：</strong>${hasLocalChanges ? Math.round(localStorage.getItem('teamAssignments').length / 1024) + ' KB' : '0 KB'}
                            </div>
                            <div class="mb-2">
                                <strong>系統版本：</strong>v1.0.0
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('systemSettingsContent').innerHTML = content;
    }

    // ==================== 組織管理功能 ====================

    // 編輯組名稱
    editGroupName(groupId) {
        const groupElement = document.querySelector(`[data-group-id="${groupId}"]`);
        const displaySpan = groupElement.querySelector('.group-name-display');
        const inputField = groupElement.querySelector('.group-name-input');

        if (displaySpan.style.display !== 'none') {
            // 進入編輯模式
            displaySpan.style.display = 'none';
            inputField.style.display = 'inline-block';
            inputField.classList.remove('d-none');
            inputField.focus();
            inputField.select();

            // 監聽 Enter 鍵和失焦事件
            const saveEdit = () => {
                const newName = inputField.value.trim();
                if (newName && newName !== this.teamConfig.groups[groupId].name) {
                    this.teamConfig.groups[groupId].name = newName;
                    displaySpan.textContent = newName;
                    this.showToast('組名稱更新', `已更新為：${newName}`, 'success');
                }

                // 退出編輯模式
                displaySpan.style.display = 'inline';
                inputField.style.display = 'none';
                inputField.classList.add('d-none');
            };

            inputField.addEventListener('blur', saveEdit, { once: true });
            inputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    saveEdit();
                }
            }, { once: true });
        }
    }

    // 儲存組織變更
    async saveGroupChanges() {
        try {
            // 儲存到本地
            localStorage.setItem('teamGroupChanges', JSON.stringify(this.teamConfig.groups));

            // 自動同步到 Google Drive
            await this.autoSaveToGoogleDrive();

            this.showToast('儲存成功', '組織變更已儲存並同步到 Google Drive', 'success');
        } catch (error) {
            this.showToast('儲存失敗', error.message, 'error');
        }
    }

    // 編輯成員專案分配
    editMemberProjects(memberId) {
        const member = this.members[memberId];
        const workload = this.getMemberWorkload(memberId);
        const availableProjects = Object.keys(this.assignments);

        const modalContent = `
            <div class="modal fade" id="editMemberProjectsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <span style="font-size: 1.5em;">${member.avatar}</span>
                                編輯 ${member.name} 的專案分配
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <h6>目前分配的專案</h6>
                                <div id="currentAssignments">
                                    ${workload.projects.length === 0 ?
                                        '<p class="text-muted">目前沒有分配到任何專案</p>' :
                                        workload.projects.map(project => `
                                            <div class="card mb-2" data-project="${project.projectKey}">
                                                <div class="card-body py-2">
                                                    <div class="d-flex justify-content-between align-items-center">
                                                        <div>
                                                            <strong>${project.projectName}</strong>
                                                            <br><small class="text-muted">角色：${project.roleName}</small>
                                                        </div>
                                                        <button class="btn btn-outline-danger btn-sm"
                                                                onclick="teamManagement.removeProjectAssignment('${memberId}', '${project.projectKey}')">
                                                            <i class="fas fa-times"></i> 移除
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        `).join('')
                                    }
                                </div>
                            </div>

                            <div class="mb-3">
                                <h6>新增專案分配</h6>
                                <div class="row">
                                    <div class="col-md-6">
                                        <label class="form-label">選擇專案</label>
                                        <select class="form-select" id="newProjectSelect">
                                            <option value="">請選擇專案...</option>
                                            ${availableProjects.map(projectKey => `
                                                <option value="${projectKey}">${projectKey}</option>
                                            `).join('')}
                                        </select>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">選擇角色</label>
                                        <select class="form-select" id="newRoleSelect">
                                            <option value="">請選擇角色...</option>
                                            ${member.skills.map(skill => `
                                                <option value="${skill}">${this.roles[skill]?.name || skill}</option>
                                            `).join('')}
                                        </select>
                                    </div>
                                    <div class="col-md-2">
                                        <label class="form-label">&nbsp;</label>
                                        <button class="btn btn-primary w-100"
                                                onclick="teamManagement.addProjectAssignment('${memberId}')">
                                            <i class="fas fa-plus"></i> 新增
                                        </button>
                                    </div>
                                </div>
                                <div class="mt-2">
                                    <small class="text-muted">
                                        注意：每個成員在同一專案中只能有一個角色
                                    </small>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
                            <button type="button" class="btn btn-primary" onclick="teamManagement.saveMemberProjectChanges('${memberId}')">
                                <i class="fas fa-save"></i> 儲存變更
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除現有模態框
        const existing = document.getElementById('editMemberProjectsModal');
        if (existing) existing.remove();

        document.body.insertAdjacentHTML('beforeend', modalContent);
        const modal = new bootstrap.Modal(document.getElementById('editMemberProjectsModal'));
        modal.show();
    }

    // 移除專案分配
    removeProjectAssignment(memberId, projectKey) {
        if (this.assignments[projectKey] && this.assignments[projectKey].members[memberId]) {
            delete this.assignments[projectKey].members[memberId];

            // 更新顯示
            const projectCard = document.querySelector(`[data-project="${projectKey}"]`);
            if (projectCard) {
                projectCard.remove();
            }

            // 如果沒有任何分配了，顯示提示
            const currentAssignments = document.getElementById('currentAssignments');
            if (currentAssignments.children.length === 0) {
                currentAssignments.innerHTML = '<p class="text-muted">目前沒有分配到任何專案</p>';
            }

            this.showToast('移除成功', `已移除 ${projectKey} 專案分配`, 'success');
        }
    }

    // 新增專案分配
    addProjectAssignment(memberId) {
        const projectSelect = document.getElementById('newProjectSelect');
        const roleSelect = document.getElementById('newRoleSelect');

        const projectKey = projectSelect.value;
        const roleKey = roleSelect.value;

        if (!projectKey || !roleKey) {
            this.showToast('請完整選擇', '請選擇專案和角色', 'warning');
            return;
        }

        // 檢查是否已經在該專案中有角色
        if (this.assignments[projectKey] && this.assignments[projectKey].members[memberId]) {
            this.showToast('分配衝突', '該成員已在此專案中有角色分配', 'warning');
            return;
        }

        // 確保專案存在
        if (!this.assignments[projectKey]) {
            this.assignments[projectKey] = { members: {} };
        }

        // 新增分配
        this.assignments[projectKey].members[memberId] = {
            memberId: memberId,
            role: roleKey,
            assignedDate: new Date().toISOString().split('T')[0],
            tasks: [`${this.roles[roleKey]?.name || roleKey}相關任務`]
        };

        // 更新顯示
        const currentAssignments = document.getElementById('currentAssignments');
        if (currentAssignments.querySelector('.text-muted')) {
            currentAssignments.innerHTML = '';
        }

        const roleName = this.roles[roleKey]?.name || roleKey;
        const newAssignmentCard = `
            <div class="card mb-2" data-project="${projectKey}">
                <div class="card-body py-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${projectKey}</strong>
                            <br><small class="text-muted">角色：${roleName}</small>
                        </div>
                        <button class="btn btn-outline-danger btn-sm"
                                onclick="teamManagement.removeProjectAssignment('${memberId}', '${projectKey}')">
                            <i class="fas fa-times"></i> 移除
                        </button>
                    </div>
                </div>
            </div>
        `;

        currentAssignments.insertAdjacentHTML('beforeend', newAssignmentCard);

        // 清空選擇
        projectSelect.value = '';
        roleSelect.value = '';

        this.showToast('新增成功', `已新增 ${projectKey} 專案分配`, 'success');
    }

    // 儲存成員專案變更
    saveMemberProjectChanges(memberId) {
        try {
            // 儲存到本地存儲
            this.saveToLocal();

            const modal = bootstrap.Modal.getInstance(document.getElementById('editMemberProjectsModal'));
            modal.hide();

            // 刷新成員管理頁面
            this.loadMemberManagement();

            this.showToast('儲存成功', '成員專案分配已更新', 'success');
        } catch (error) {
            this.showToast('儲存失敗', error.message, 'error');
        }
    }

    // ==================== 成員名稱編輯功能 ====================

    // 編輯成員名稱
    editMemberName(memberId) {
        const memberElement = document.querySelector(`[data-member-id="${memberId}"]`);
        const displaySpan = memberElement.querySelector('.member-name-display');
        const inputField = memberElement.querySelector('.member-name-input');

        if (displaySpan.style.display !== 'none') {
            // 進入編輯模式
            displaySpan.style.display = 'none';
            inputField.style.display = 'block';
            inputField.classList.remove('d-none');
            inputField.focus();
            inputField.select();

            // 監聽 Enter 鍵和失焦事件
            const saveEdit = () => {
                const newName = inputField.value.trim();
                if (newName && newName !== this.members[memberId].name) {
                    // 更新本地資料
                    this.members[memberId].name = newName;
                    this.teamConfig.members[memberId].name = newName;

                    // 更新顯示
                    displaySpan.textContent = newName;

                    // 儲存變更
                    this.saveMemberChanges();

                    this.showToast('成員名稱更新', `${memberId} 已更新為：${newName}`, 'success');
                }

                // 退出編輯模式
                displaySpan.style.display = 'block';
                inputField.style.display = 'none';
                inputField.classList.add('d-none');
            };

            inputField.addEventListener('blur', saveEdit, { once: true });
            inputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    saveEdit();
                }
            }, { once: true });
        }
    }

    // 儲存成員變更
    async saveMemberChanges() {
        try {
            // 只儲存有變更的成員資料，保持檔案小且高效
            const changedMembers = {};
            Object.keys(this.members).forEach(memberId => {
                const member = this.members[memberId];
                const original = this.teamConfig.members[memberId];

                // 檢查是否有變更（名稱或備註）
                if (member.name !== original.name || member.notes !== original.notes) {
                    changedMembers[memberId] = {
                        name: member.name,
                        notes: member.notes
                    };
                }
            });

            localStorage.setItem('teamMemberChanges', JSON.stringify(changedMembers));

            // 自動同步到 Google Drive
            await this.autoSaveToGoogleDrive();

            console.log('成員變更已儲存並同步:', Object.keys(changedMembers).length, '位成員有變更');
        } catch (error) {
            console.error('儲存成員變更失敗:', error);
            this.showToast('儲存失敗', error.message, 'error');
        }
    }

    // 載入本地成員變更
    loadLocalMemberChanges() {
        try {
            const localMembers = localStorage.getItem('teamMemberChanges');
            if (localMembers) {
                const savedMembers = JSON.parse(localMembers);
                // 合併本地變更
                this.members = { ...this.members, ...savedMembers };
                if (this.teamConfig) {
                    this.teamConfig.members = { ...this.teamConfig.members, ...savedMembers };
                }
                console.log('已載入本地成員變更');
            }
        } catch (error) {
            console.error('載入本地成員變更失敗:', error);
        }
    }

    // 自動儲存變更到 Google Drive
    async autoSaveToGoogleDrive() {
        try {
            // 如果已登入 Google Drive，自動儲存
            if (window.googleDriveAPI && window.googleDriveAPI.isSignedIn()) {
                await this.saveToGoogleDrive();
                console.log('資料已自動同步到 Google Drive');
            }
        } catch (error) {
            console.error('自動同步失敗:', error);
        }
    }

    // ==================== Google Drive 同步功能 ====================

    // 自動檢查 Google Drive 更新
    startAutoSync() {
        // 每 5 分鐘檢查一次是否有新檔案
        this.autoSyncInterval = setInterval(() => {
            this.checkForUpdates();
        }, 5 * 60 * 1000); // 5 分鐘

        console.log('已啟動自動同步檢查 (每 5 分鐘)');
    }

    // 停止自動同步
    stopAutoSync() {
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
            this.autoSyncInterval = null;
            console.log('已停止自動同步檢查');
        }
    }

    // 檢查更新
    async checkForUpdates() {
        try {
            if (!window.googleDriveAPI) {
                console.log('Google Drive API 尚未載入，跳過自動檢查');
                return;
            }

            // 如果尚未登入，顯示登入提示
            if (!window.googleDriveAPI.isSignedIn()) {
                this.showSignInNotification();
                return;
            }

            // 檢查 Google Drive 是否有更新
            const updates = await window.googleDriveAPI.checkForUpdates();

            if (updates.length > 0) {
                this.showUpdatesAvailableNotification(updates);
            } else {
                console.log('Google Drive 沒有新的更新');
            }

        } catch (error) {
            console.error('檢查更新失敗:', error);
        }
    }

    // 顯示登入提示
    showSignInNotification() {
        const notification = document.createElement('div');
        notification.className = 'alert alert-warning alert-dismissible fade show position-fixed';
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 1050;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;

        notification.innerHTML = `
            <div class="d-flex align-items-center mb-2">
                <i class="fas fa-sign-in-alt text-warning me-2"></i>
                <strong>Google Drive 同步</strong>
            </div>
            <div class="small mb-2">
                需要登入 Google Drive 才能自動同步團隊設定
            </div>
            <div class="d-grid gap-2">
                <button class="btn btn-warning btn-sm" onclick="window.teamManagement.signInToGoogleDrive()">
                    登入 Google Drive
                </button>
                <button class="btn btn-outline-secondary btn-sm" onclick="this.closest('.alert').remove()">
                    稍後登入
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 15000);
    }

    // 顯示可用更新通知
    showUpdatesAvailableNotification(updates) {
        const notification = document.createElement('div');
        notification.className = 'alert alert-success alert-dismissible fade show position-fixed';
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 1050;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;

        const updateList = updates.map(u => `• ${u.type}`).join('<br>');

        notification.innerHTML = `
            <div class="d-flex align-items-center mb-2">
                <i class="fas fa-cloud-download-alt text-success me-2"></i>
                <strong>發現更新</strong>
            </div>
            <div class="small mb-2">
                Google Drive 中有 ${updates.length} 個更新檔案：<br>
                ${updateList}
            </div>
            <div class="d-grid gap-2">
                <button class="btn btn-success btn-sm" onclick="window.teamManagement.loadFromGoogleDrive()">
                    立即載入更新
                </button>
                <button class="btn btn-outline-secondary btn-sm" onclick="this.closest('.alert').remove()">
                    稍後更新
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 20000);
    }

    // 登入 Google Drive
    async signInToGoogleDrive() {
        try {
            if (!window.googleDriveAPI) {
                this.showToast('API 未載入', 'Google Drive API 尚未載入', 'error');
                return;
            }

            // 檢查 API 是否已準備好
            if (!window.googleDriveAPI.isReady()) {
                this.showToast('正在初始化', 'Google Drive API 正在初始化，請稍候...', 'warning');

                // 等待最多 5 秒讓 API 初始化完成
                let attempts = 0;
                while (!window.googleDriveAPI.isReady() && attempts < 50) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }

                if (!window.googleDriveAPI.isReady()) {
                    this.showToast('初始化失敗', 'Google Drive API 初始化失敗，請檢查設定', 'error');
                    return;
                }
            }

            const success = await window.googleDriveAPI.signIn();
            if (success) {
                this.showToast('登入成功', 'Google Drive 登入成功，已啟動自動同步', 'success');
                // 移除登入提示通知
                document.querySelectorAll('.alert').forEach(alert => {
                    if (alert.textContent.includes('Google Drive 同步')) {
                        alert.remove();
                    }
                });
            } else {
                this.showToast('登入失敗', 'Google Drive 登入失敗', 'error');
            }
        } catch (error) {
            console.error('Google Drive 登入失敗:', error);
            this.showToast('登入錯誤', error.message, 'error');
        }
    }

    // 取得本地版本資訊
    getLocalVersions() {
        const versions = {
            members: localStorage.getItem('ErDashboard_Members_Version') || 'unknown',
            groups: localStorage.getItem('ErDashboard_Groups_Version') || 'unknown',
            assignments: localStorage.getItem('ErDashboard_Assignments_Version') || 'unknown',
            customizations: localStorage.getItem('ErDashboard_Customizations_Version') || 'unknown',
            lastCheck: localStorage.getItem('ErDashboard_LastUpdate') || 'never'
        };
        return versions;
    }

    // 顯示更新檢查通知
    showUpdateCheckNotification(localVersions) {
        const driveUrl = 'https://drive.google.com/drive/folders/YOUR_FOLDER_ID_HERE';

        // 計算距離上次檢查的時間
        const lastCheck = localVersions.lastCheck;
        const timeSinceCheck = lastCheck === 'never' ? '從未' : this.formatTimeDifference(lastCheck);

        // 建立檢查通知
        const notification = document.createElement('div');
        notification.className = 'alert alert-info alert-dismissible fade show position-fixed';
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 1050;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;

        notification.innerHTML = `
            <div class="d-flex align-items-center mb-2">
                <i class="fas fa-cloud-download-alt text-primary me-2"></i>
                <strong>檢查 Google Drive 更新</strong>
            </div>
            <div class="small mb-2">
                <div>上次檢查: ${timeSinceCheck}</div>
                <div>本地版本: ${localVersions.members.substr(0, 10)}...</div>
            </div>
            <div class="d-grid gap-2">
                <button class="btn btn-primary btn-sm" onclick="window.open('${driveUrl}', '_blank')">
                    開啟 Google Drive
                </button>
                <button class="btn btn-outline-secondary btn-sm" onclick="this.closest('.alert').remove()">
                    稍後檢查
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // 10 秒後自動移除通知
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }

    // 格式化時間差異
    formatTimeDifference(timestamp) {
        if (timestamp === 'never') return '從未';

        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays} 天前`;
        if (diffHours > 0) return `${diffHours} 小時前`;
        if (diffMins > 0) return `${diffMins} 分鐘前`;
        return '剛剛';
    }

    // 更新版本檢查機制
    updateVersionCheck() {
        const timestamp = new Date().toISOString();
        localStorage.setItem('ErDashboard_LastUpdate', timestamp);

        // 更新本地版本號
        const version = `v${Date.now()}`;
        localStorage.setItem('ErDashboard_Members_Version', version);
        localStorage.setItem('ErDashboard_Groups_Version', version);
        localStorage.setItem('ErDashboard_Assignments_Version', version);
        localStorage.setItem('ErDashboard_Customizations_Version', version);
    }

    // ==================== Google Drive 同步功能 ====================

    // 自動儲存到 Google Drive
    async saveToGoogleDrive() {
        try {
            if (!window.googleDriveAPI) {
                throw new Error('Google Drive API 尚未載入');
            }

            // 檢查是否已登入
            if (!window.googleDriveAPI.isSignedIn()) {
                const signInSuccess = await window.googleDriveAPI.signIn();
                if (!signInSuccess) {
                    this.showToast('登入失敗', '需要登入 Google Drive 才能自動同步', 'error');
                    return;
                }
            }

            this.showToast('同步中', '正在儲存資料到 Google Drive...', 'info');

            // 準備要儲存的資料
            const dataToSave = {
                members: this.teamConfig.members,
                groups: this.teamConfig.groups,
                assignments: this.assignments,
                customizations: this.collectLocalChanges()
            };

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
            const dateStr = timestamp[0];
            const timeStr = timestamp[1].split('-')[0];

            // 逐一儲存各類型資料
            const savePromises = Object.keys(dataToSave).map(async (type) => {
                const fileName = `ErDashboard_${type.charAt(0).toUpperCase() + type.slice(1)}_${dateStr}_${timeStr}.json`;
                return await window.googleDriveAPI.saveFile(fileName, dataToSave[type], type);
            });

            await Promise.all(savePromises);

            // 更新版本檢查
            this.updateVersionCheck();

            this.showToast('同步完成', '所有資料已自動儲存到 Google Drive', 'success');

        } catch (error) {
            console.error('自動儲存失敗:', error);
            this.showToast('同步失敗', error.message, 'error');
        }
    }

    // 自動從 Google Drive 載入
    async loadFromGoogleDrive() {
        try {
            if (!window.googleDriveAPI) {
                throw new Error('Google Drive API 尚未載入');
            }

            // 檢查是否已登入
            if (!window.googleDriveAPI.isSignedIn()) {
                const signInSuccess = await window.googleDriveAPI.signIn();
                if (!signInSuccess) {
                    this.showToast('登入失敗', '需要登入 Google Drive 才能載入資料', 'error');
                    return;
                }
            }

            this.showToast('載入中', '正在從 Google Drive 載入最新資料...', 'info');

            // 自動同步所有更新
            const syncResults = await window.googleDriveAPI.autoSync();

            if (syncResults.length === 0) {
                this.showToast('已是最新', 'Google Drive 沒有新的更新', 'info');
                return;
            }

            let loadedCount = 0;
            let errorCount = 0;

            // 處理同步結果
            for (const result of syncResults) {
                if (result.success) {
                    // 套用資料更新
                    this.applyGoogleDriveData(result.type, result.data);
                    loadedCount++;
                } else {
                    console.error(`載入 ${result.type} 失敗:`, result.error);
                    errorCount++;
                }
            }

            // 儲存到本地
            await this.saveAllData();

            // 重新載入所有顯示
            this.refreshAllDisplays();

            // 顯示結果
            if (loadedCount > 0) {
                this.showToast('載入完成', `已載入 ${loadedCount} 個更新檔案`, 'success');
            }

            if (errorCount > 0) {
                this.showToast('部分失敗', `${errorCount} 個檔案載入失敗`, 'warning');
            }

        } catch (error) {
            console.error('自動載入失敗:', error);
            this.showToast('載入失敗', error.message, 'error');
        }
    }

    // 套用 Google Drive 資料
    applyGoogleDriveData(type, fileData) {
        if (!fileData || !fileData.data) return;

        switch (type.toLowerCase()) {
            case 'members':
                this.teamConfig.members = fileData.data;
                this.members = { ...fileData.data };
                break;

            case 'groups':
                this.teamConfig.groups = fileData.data;
                break;

            case 'assignments':
                this.assignments = fileData.data;
                break;

            case 'customizations':
                this.applyCustomizations(fileData.data);
                break;
        }

        // 更新版本資訊
        localStorage.setItem(`ErDashboard_${type}_Version`, fileData.version + '_' + fileData.lastSync);
    }

    // 重新載入所有顯示
    refreshAllDisplays() {
        // 重新載入成員管理
        if (document.querySelector('#memberManagementModal .modal-body')) {
            this.loadMemberManagement();
        }

        // 重新載入專案管理
        if (document.querySelector('#projectManagementModal .modal-body')) {
            this.loadProjectManagement();
        }

        // 重新載入總覽統計
        if (document.querySelector('#overviewStatsModal .modal-body')) {
            this.loadOverviewStats();
        }
    }

    // 增強版匯入功能 - 自動更新版本資訊
    async importDataWithVersionUpdate(data, fileName) {
        try {
            // 驗證資料格式
            if (!data.type || !data.version || !data.data) {
                throw new Error('檔案格式不正確，缺少必要欄位');
            }

            // 更新對應的資料
            switch (data.type) {
                case 'members':
                    this.teamConfig.members = data.data;
                    this.members = { ...data.data };
                    localStorage.setItem('ErDashboard_Members_Version', data.version + '_' + data.lastSync);
                    break;

                case 'groups':
                    this.teamConfig.groups = data.data;
                    localStorage.setItem('ErDashboard_Groups_Version', data.version + '_' + data.lastSync);
                    break;

                case 'assignments':
                    this.assignments = data.data;
                    localStorage.setItem('ErDashboard_Assignments_Version', data.version + '_' + data.lastSync);
                    break;

                case 'customizations':
                    this.applyCustomizations(data.data);
                    localStorage.setItem('ErDashboard_Customizations_Version', data.version + '_' + data.lastSync);
                    break;

                default:
                    throw new Error(`未知的資料類型: ${data.type}`);
            }

            // 更新最後檢查時間
            localStorage.setItem('ErDashboard_LastUpdate', new Date().toISOString());

            // 儲存更新
            await this.saveAllData();

            this.showToast('匯入成功', `${data.type} 資料已更新 (版本: ${data.version})`, 'success');

            // 重新載入相關顯示
            this.refreshDisplay(data.type);

        } catch (error) {
            console.error('匯入失敗:', error);
            this.showToast('匯入失敗', error.message, 'error');
        }
    }

    // 重新載入顯示內容
    refreshDisplay(dataType) {
        switch (dataType) {
            case 'members':
            case 'groups':
                // 重新載入成員管理頁面
                if (document.querySelector('#memberManagementModal .modal-body')) {
                    this.loadMemberManagement();
                }
                break;

            case 'assignments':
                // 重新載入專案管理頁面
                if (document.querySelector('#projectManagementModal .modal-body')) {
                    this.loadProjectManagement();
                }
                break;

            case 'customizations':
                // 重新載入所有顯示
                if (document.querySelector('#memberManagementModal .modal-body')) {
                    this.loadMemberManagement();
                }
                if (document.querySelector('#projectManagementModal .modal-body')) {
                    this.loadProjectManagement();
                }
                break;
        }
    }

    // 智能同步建議
    showSyncSuggestion() {
        const lastUpdate = localStorage.getItem('ErDashboard_LastUpdate');
        if (!lastUpdate) return;

        const lastUpdateTime = new Date(lastUpdate);
        const now = new Date();
        const hoursSinceUpdate = (now - lastUpdateTime) / (1000 * 60 * 60);

        // 如果超過 24 小時沒有檢查更新，顯示建議
        if (hoursSinceUpdate > 24) {
            setTimeout(() => {
                const suggestion = document.createElement('div');
                suggestion.className = 'alert alert-warning alert-dismissible fade show position-fixed';
                suggestion.style.cssText = `
                    bottom: 20px;
                    left: 20px;
                    z-index: 1050;
                    max-width: 350px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                `;

                suggestion.innerHTML = `
                    <div class="d-flex align-items-center mb-2">
                        <i class="fas fa-exclamation-triangle text-warning me-2"></i>
                        <strong>同步建議</strong>
                    </div>
                    <div class="small mb-2">
                        距離上次檢查已超過 ${Math.floor(hoursSinceUpdate)} 小時，建議檢查 Google Drive 是否有新的團隊設定。
                    </div>
                    <div class="d-grid gap-2">
                        <button class="btn btn-warning btn-sm" onclick="window.teamManagement.checkForUpdates()">
                            立即檢查
                        </button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="this.closest('.alert').remove()">
                            稍後提醒
                        </button>
                    </div>
                `;

                document.body.appendChild(suggestion);

                // 30 秒後自動移除
                setTimeout(() => {
                    if (suggestion.parentNode) {
                        suggestion.remove();
                    }
                }, 30000);
            }, 5000); // 延遲 5 秒顯示，避免影響初始載入
        }
    }

    // 收集本地變更
    collectLocalChanges() {
        const localChanges = {
            memberNames: {},
            memberNotes: {},
            groupNames: {}
        };

        // 收集成員變更
        Object.keys(this.members).forEach(memberId => {
            const member = this.members[memberId];
            const original = this.teamConfig.members[memberId];

            if (member && original) {
                if (member.name !== original.name) {
                    localChanges.memberNames[memberId] = member.name;
                }
                if (member.notes && member.notes !== original.notes && member.notes !== '備註') {
                    localChanges.memberNotes[memberId] = member.notes;
                }
            }
        });

        // 收集組名變更
        Object.keys(this.teamConfig.groups || {}).forEach(groupId => {
            const currentName = this.teamConfig.groups[groupId].name;
            const originalName = groupId === 'groupA' ? 'A組' : groupId === 'groupB' ? 'B組' : 'C組';
            if (currentName !== originalName) {
                localChanges.groupNames[groupId] = currentName;
            }
        });

        return localChanges;
    }

    // 套用用戶自訂設定
    applyCustomizations(customizations) {
        // 套用成員名稱變更
        Object.entries(customizations.memberNames || {}).forEach(([memberId, name]) => {
            if (this.members[memberId]) {
                this.members[memberId].name = name;
            }
        });

        // 套用備註變更
        Object.entries(customizations.memberNotes || {}).forEach(([memberId, notes]) => {
            if (this.members[memberId]) {
                this.members[memberId].notes = notes;
            }
        });

        // 套用組名變更
        Object.entries(customizations.groupNames || {}).forEach(([groupId, name]) => {
            if (this.teamConfig.groups && this.teamConfig.groups[groupId]) {
                this.teamConfig.groups[groupId].name = name;
            }
        });
    }

    // 編輯成員備註
    editMemberNotes(memberId) {
        const notesElement = document.querySelector(`.editable-member-notes[data-member-id="${memberId}"]`);
        const displaySpan = notesElement.querySelector('.member-notes-display');
        const inputField = notesElement.querySelector('.member-notes-input');

        if (displaySpan.style.display !== 'none') {
            // 進入編輯模式
            displaySpan.style.display = 'none';
            inputField.style.display = 'block';
            inputField.classList.remove('d-none');
            inputField.focus();
            inputField.select();

            // 監聽 Enter 鍵和失焦事件
            const saveEdit = () => {
                const newNotes = inputField.value.trim();
                if (newNotes !== this.members[memberId].notes) {
                    // 更新本地資料
                    this.members[memberId].notes = newNotes;
                    this.teamConfig.members[memberId].notes = newNotes;

                    // 更新顯示
                    displaySpan.textContent = newNotes || '備註';

                    // 儲存變更
                    this.saveMemberChanges();

                    this.showToast('備註更新', `${memberId} 備註已更新`, 'success');
                }

                // 退出編輯模式
                displaySpan.style.display = 'inline';
                inputField.style.display = 'none';
                inputField.classList.add('d-none');
            };

            inputField.addEventListener('blur', saveEdit, { once: true });
            inputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    saveEdit();
                }
            }, { once: true });
        }
    }

    // 儲存所有資料到本地
    async saveAllData() {
        try {
            // 儲存成員變更
            this.saveMemberChanges();

            // 儲存組織變更
            this.saveGroupChanges();

            // 儲存到本地儲存
            this.saveToLocal();

            console.log('所有資料已儲存到本地');
        } catch (error) {
            console.error('儲存資料失敗:', error);
            throw error;
        }
    }

    // 啟動團隊管理系統
    async init() {
        try {
            // 啟動自動同步檢查
            this.startAutoSync();

            // 顯示智能同步建議
            this.showSyncSuggestion();

            console.log('團隊管理系統已初始化');
        } catch (error) {
            console.error('團隊管理系統初始化失敗:', error);
        }
    }

    // 關閉團隊管理系統
    destroy() {
        // 停止自動同步
        this.stopAutoSync();

        console.log('團隊管理系統已關閉');
    }
}

// 全域實例
window.teamManagement = new TeamManagement();

// 當頁面載入完成時啟動自動同步
document.addEventListener('DOMContentLoaded', () => {
    if (window.teamManagement) {
        window.teamManagement.init();
    }
});

// 當頁面關閉時停止自動同步
window.addEventListener('beforeunload', () => {
    if (window.teamManagement) {
        window.teamManagement.destroy();
    }
});