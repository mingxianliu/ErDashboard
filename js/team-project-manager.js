/**
 * 團隊專案管理模組
 * 負責專案相關的管理操作
 */

class TeamProjectManager {
    constructor(dataManager, uiComponents) {
        this.dataManager = dataManager;
        this.uiComponents = uiComponents;
    }

    // 載入專案管理介面
    async loadProjectManagement() {
        console.log('📋 載入專案管理介面');

        const assignments = this.dataManager.getAllAssignments();
        const members = this.dataManager.getAllMembers();

        if (!assignments || Object.keys(assignments).length === 0) {
            return `
                <div class="col-12">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        目前沒有專案資料。請確認資料已正確載入。
                    </div>
                </div>
            `;
        }

        let projectsHtml = '';
        Object.entries(assignments).forEach(([projectId, project]) => {
            const projectMembers = project.members || {};
            const memberCount = Object.keys(projectMembers).length;

            projectsHtml += `
                <div class="col-md-6 col-xl-4 mb-4">
                    <div class="card h-100">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6 class="card-title mb-0">${project.projectName || projectId}</h6>
                            <span class="badge bg-primary">${memberCount} 人</span>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <small class="text-muted">專案狀態</small>
                                <div class="fw-bold">${project.status || '進行中'}</div>
                            </div>

                            <div class="mb-3">
                                <small class="text-muted">團隊成員</small>
                                <div class="mt-1">
                                    ${Object.entries(projectMembers).map(([memberId, memberData]) => {
                                        const member = members[memberId];
                                        if (!member) return '';
                                        return `
                                            <span class="badge bg-secondary me-1 mb-1" title="${memberData.role || '未指定角色'}">
                                                ${member.name}
                                            </span>
                                        `;
                                    }).join('')}
                                </div>
                            </div>

                            <div class="mb-2">
                                <small class="text-muted">最後更新</small>
                                <div class="small">${project.lastUpdated || '未知'}</div>
                            </div>
                        </div>
                        <div class="card-footer">
                            <div class="btn-group w-100" role="group">
                                <button class="btn btn-outline-primary btn-sm" onclick="window.teamProjectManager.viewProjectDetails('${projectId}')">
                                    <i class="fas fa-eye me-1"></i>檢視
                                </button>
                                <button class="btn btn-outline-success btn-sm" onclick="window.teamProjectManager.manageProjectMembers('${projectId}')">
                                    <i class="fas fa-users me-1"></i>管理成員
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        return `
            <div class="row">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h4><i class="fas fa-project-diagram me-2"></i>專案管理</h4>
                        <div>
                            <button class="btn btn-primary btn-sm" onclick="window.teamProjectManager.refreshProjects()">
                                <i class="fas fa-sync-alt me-1"></i>重新整理
                            </button>
                        </div>
                    </div>
                </div>
                ${projectsHtml}
            </div>
        `;
    }

    // 檢視專案詳情
    viewProjectDetails(projectId) {
        const assignments = this.dataManager.getAllAssignments();
        const project = assignments[projectId];
        const members = this.dataManager.getAllMembers();

        if (!project) {
            alert('找不到指定的專案');
            return;
        }

        const projectMembers = project.members || {};

        let membersDetailsHtml = '';
        Object.entries(projectMembers).forEach(([memberId, memberData]) => {
            const member = members[memberId];
            if (!member) return;

            const tasks = memberData.taskCard && memberData.taskCard.content ?
                memberData.taskCard.content.split('\n').filter(line => line.trim()).length : 0;

            membersDetailsHtml += `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="avatar-sm bg-primary rounded-circle d-flex align-items-center justify-content-center me-2">
                                ${member.name.substring(0, 1)}
                            </div>
                            <div>
                                <div class="fw-bold">${member.name}</div>
                                <small class="text-muted">${member.id}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="badge bg-info">${memberData.role || '未指定'}</span>
                    </td>
                    <td>
                        <div class="d-flex flex-wrap gap-1">
                            ${(member.skills || []).map(skill => `
                                <span class="badge bg-secondary">${skill}</span>
                            `).join('')}
                        </div>
                    </td>
                    <td>
                        <span class="badge ${memberData.isExecuting ? 'bg-success' : 'bg-warning'}">
                            ${memberData.isExecuting ? '執行中' : '待命'}
                        </span>
                    </td>
                    <td>${tasks} 項</td>
                </tr>
            `;
        });

        const modalHtml = `
            <div class="modal fade" id="projectDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-project-diagram me-2"></i>專案詳情：${project.projectName || projectId}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-4">
                                <div class="col-md-6">
                                    <table class="table table-borderless">
                                        <tr>
                                            <th width="30%">專案ID:</th>
                                            <td>${projectId}</td>
                                        </tr>
                                        <tr>
                                            <th>專案名稱:</th>
                                            <td>${project.projectName || '未設定'}</td>
                                        </tr>
                                        <tr>
                                            <th>狀態:</th>
                                            <td><span class="badge bg-primary">${project.status || '進行中'}</span></td>
                                        </tr>
                                        <tr>
                                            <th>最後更新:</th>
                                            <td>${project.lastUpdated || '未知'}</td>
                                        </tr>
                                    </table>
                                </div>
                                <div class="col-md-6">
                                    <div class="card bg-light">
                                        <div class="card-body">
                                            <h6 class="card-title">統計資訊</h6>
                                            <div class="row text-center">
                                                <div class="col-4">
                                                    <div class="h4 mb-0">${Object.keys(projectMembers).length}</div>
                                                    <small class="text-muted">團隊成員</small>
                                                </div>
                                                <div class="col-4">
                                                    <div class="h4 mb-0">${Object.values(projectMembers).filter(m => m.isExecuting).length}</div>
                                                    <small class="text-muted">執行中</small>
                                                </div>
                                                <div class="col-4">
                                                    <div class="h4 mb-0">${Object.values(projectMembers).filter(m => !m.isExecuting).length}</div>
                                                    <small class="text-muted">待命中</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <h6>團隊成員詳情</h6>
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>成員</th>
                                            <th>角色</th>
                                            <th>技能</th>
                                            <th>狀態</th>
                                            <th>任務數</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${membersDetailsHtml}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
                            <button type="button" class="btn btn-primary" onclick="window.teamProjectManager.manageProjectMembers('${projectId}')">
                                <i class="fas fa-users me-1"></i>管理成員
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除已存在的模態框
        const existingModal = document.getElementById('projectDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 添加新的模態框
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // 顯示模態框
        const modal = new bootstrap.Modal(document.getElementById('projectDetailsModal'));
        modal.show();
    }

    // 管理專案成員
    manageProjectMembers(projectId) {
        const assignments = this.dataManager.getAllAssignments();
        const project = assignments[projectId];
        const allMembers = this.dataManager.getAllMembers();

        if (!project) {
            alert('找不到指定的專案');
            return;
        }

        const projectMembers = project.members || {};

        let availableMembersOptions = '';
        Object.entries(allMembers).forEach(([memberId, member]) => {
            if (!projectMembers[memberId]) {
                availableMembersOptions += `<option value="${memberId}">${member.name} (${member.id})</option>`;
            }
        });

        let currentMembersHtml = '';
        Object.entries(projectMembers).forEach(([memberId, memberData]) => {
            const member = allMembers[memberId];
            if (!member) return;

            currentMembersHtml += `
                <tr>
                    <td>${member.name}</td>
                    <td>${member.id}</td>
                    <td>
                        <select class="form-select form-select-sm" onchange="window.teamProjectManager.updateMemberRole('${projectId}', '${memberId}', this.value)">
                            <option value="">請選擇角色</option>
                            <option value="frontend" ${memberData.role === 'frontend' ? 'selected' : ''}>前端開發</option>
                            <option value="backend" ${memberData.role === 'backend' ? 'selected' : ''}>後端開發</option>
                            <option value="fullstack" ${memberData.role === 'fullstack' ? 'selected' : ''}>全端開發</option>
                            <option value="testing" ${memberData.role === 'testing' ? 'selected' : ''}>測試</option>
                            <option value="design" ${memberData.role === 'design' ? 'selected' : ''}>設計</option>
                        </select>
                    </td>
                    <td>
                        <span class="badge ${memberData.isExecuting ? 'bg-success' : 'bg-warning'}">
                            ${memberData.isExecuting ? '執行中' : '待命'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="window.teamProjectManager.removeMemberFromProject('${projectId}', '${memberId}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        const modalHtml = `
            <div class="modal fade" id="manageProjectMembersModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-users me-2"></i>管理專案成員：${project.projectName || projectId}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-4">
                                <h6>新增成員到專案</h6>
                                <div class="row">
                                    <div class="col-md-6">
                                        <select class="form-select" id="newProjectMember">
                                            <option value="">選擇要新增的成員</option>
                                            ${availableMembersOptions}
                                        </select>
                                    </div>
                                    <div class="col-md-4">
                                        <select class="form-select" id="newMemberRole">
                                            <option value="">選擇角色</option>
                                            <option value="frontend">前端開發</option>
                                            <option value="backend">後端開發</option>
                                            <option value="fullstack">全端開發</option>
                                            <option value="testing">測試</option>
                                            <option value="design">設計</option>
                                        </select>
                                    </div>
                                    <div class="col-md-2">
                                        <button class="btn btn-primary" onclick="window.teamProjectManager.addMemberToProject('${projectId}')">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <h6>目前專案成員</h6>
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>姓名</th>
                                            <th>ID</th>
                                            <th>角色</th>
                                            <th>狀態</th>
                                            <th>操作</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${currentMembersHtml}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除已存在的模態框
        const existingModal = document.getElementById('manageProjectMembersModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 添加新的模態框
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // 顯示模態框
        const modal = new bootstrap.Modal(document.getElementById('manageProjectMembersModal'));
        modal.show();
    }

    // 新增成員到專案
    async addMemberToProject(projectId) {
        try {
            const memberId = document.getElementById('newProjectMember').value;
            const role = document.getElementById('newMemberRole').value;

            if (!memberId) {
                alert('請選擇要新增的成員');
                return;
            }

            if (!role) {
                alert('請選擇成員角色');
                return;
            }

            const assignments = this.dataManager.getAllAssignments();
            if (!assignments[projectId]) {
                alert('找不到指定的專案');
                return;
            }

            if (!assignments[projectId].members) {
                assignments[projectId].members = {};
            }

            // 新增成員
            assignments[projectId].members[memberId] = {
                memberId: memberId,
                role: role,
                isExecuting: false,
                taskCard: {},
                personalNotes: []
            };

            // 更新最後修改時間
            assignments[projectId].lastUpdated = new Date().toISOString().split('T')[0];

            // 保存變更
            await this.dataManager.saveLocalChanges();

            alert('成員已成功新增到專案');

            // 關閉模態框並重新整理
            const modal = bootstrap.Modal.getInstance(document.getElementById('manageProjectMembersModal'));
            if (modal) modal.hide();

            // 重新載入專案管理介面
            this.refreshProjects();

        } catch (error) {
            console.error('❌ 新增成員到專案失敗:', error);
            alert('新增成員到專案失敗: ' + error.message);
        }
    }

    // 從專案移除成員
    async removeMemberFromProject(projectId, memberId) {
        const member = this.dataManager.getAllMembers()[memberId];
        const confirmed = confirm(`確定要從專案中移除成員 "${member ? member.name : memberId}" 嗎？`);

        if (!confirmed) return;

        try {
            const assignments = this.dataManager.getAllAssignments();
            if (assignments[projectId] && assignments[projectId].members) {
                delete assignments[projectId].members[memberId];

                // 更新最後修改時間
                assignments[projectId].lastUpdated = new Date().toISOString().split('T')[0];

                // 保存變更
                await this.dataManager.saveLocalChanges();

                alert('成員已從專案中移除');

                // 重新載入專案管理介面
                this.refreshProjects();
            }
        } catch (error) {
            console.error('❌ 移除專案成員失敗:', error);
            alert('移除專案成員失敗: ' + error.message);
        }
    }

    // 更新成員角色
    async updateMemberRole(projectId, memberId, newRole) {
        try {
            const assignments = this.dataManager.getAllAssignments();
            if (assignments[projectId] && assignments[projectId].members && assignments[projectId].members[memberId]) {
                assignments[projectId].members[memberId].role = newRole;

                // 更新最後修改時間
                assignments[projectId].lastUpdated = new Date().toISOString().split('T')[0];

                // 保存變更
                await this.dataManager.saveLocalChanges();

                console.log(`✅ 成員 ${memberId} 在專案 ${projectId} 的角色已更新為 ${newRole}`);
            }
        } catch (error) {
            console.error('❌ 更新成員角色失敗:', error);
            alert('更新成員角色失敗: ' + error.message);
        }
    }

    // 重新整理專案
    refreshProjects() {
        if (window.teamManagement && window.teamManagement.loadProjectManagement) {
            window.teamManagement.loadProjectManagement();
        }
    }
}

// 設為全域可用
window.TeamProjectManager = TeamProjectManager;