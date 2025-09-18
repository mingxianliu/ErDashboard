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
}

// 全域實例
window.teamManagement = new TeamManagement();