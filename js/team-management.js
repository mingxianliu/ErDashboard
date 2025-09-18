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
            console.log('✅ 團隊管理系統初始化完成');
        } catch (error) {
            console.error('❌ 團隊管理系統初始化失敗:', error);
        }
    }

    async loadTeamData() {
        const response = await fetch('config/team-members.json');
        const data = await response.json();
        this.members = data.members;
        this.roles = data.roles;
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
                console.log('✅ 已載入本地團隊變更');
            }
        } catch (error) {
            console.error('❌ 載入本地變更失敗:', error);
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
            console.log('✅ 團隊變更已儲存到本地');
            return true;
        } catch (error) {
            console.error('❌ 本地儲存失敗:', error);
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
            console.log('✅ 已清除本地團隊變更');
        } catch (error) {
            console.error('❌ 清除本地變更失敗:', error);
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

        // 監聽分頁切換
        document.getElementById('projects-tab').addEventListener('click', () => this.loadProjectManagement());
        document.getElementById('members-tab').addEventListener('click', () => this.loadMemberManagement());
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
                                            <span class="me-2">${this.members[memberId]?.avatar || '👤'}</span>
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
        const content = `
            <div class="row">
                ${Object.entries(this.members).map(([memberId, member]) => {
                    const workload = this.getMemberWorkload(memberId);
                    return `
                        <div class="col-md-6 col-lg-4 mb-3">
                            <div class="card">
                                <div class="card-body text-center">
                                    <div style="font-size: 3em;">${member.avatar}</div>
                                    <h6 class="mt-2">${member.name}</h6>
                                    <small class="text-muted">加入日期：${member.joinDate}</small>
                                    <div class="mt-2">
                                        <span class="badge ${workload.totalProjects === 0 ? 'bg-secondary' : workload.totalProjects > 2 ? 'bg-danger' : 'bg-success'}">
                                            ${workload.totalProjects} 個專案
                                        </span>
                                    </div>
                                    <div class="mt-2">
                                        <button class="btn btn-outline-primary btn-sm" onclick="teamManagement.viewMemberDetails('${memberId}')">
                                            <i class="fas fa-eye"></i> 詳情
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
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
}

// 全域實例
window.teamManagement = new TeamManagement();