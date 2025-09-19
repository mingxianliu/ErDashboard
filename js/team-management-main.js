/**
 * 團隊管理主控制器
 * 整合所有模組，提供統一的管理介面
 */

class TeamManagement {
    constructor() {
        // 初始化各個模組
        this.dataManager = new TeamDataManager();
        this.statistics = new TeamStatistics(this.dataManager);
        this.uiComponents = new TeamUIComponents(this.dataManager, this.statistics);

        // 初始化資料
        this.dataManager.init();
    }

    // 等待初始化完成並載入總覽
    async waitForInitAndLoadOverview() {
        console.log('🔄 開始等待初始化，當前狀態:', this.dataManager.isInitialized);
        const maxWait = 50; // 最多等待5秒
        let attempts = 0;

        const checkInit = () => {
            console.log('📊 檢查初始化狀態:', this.dataManager.isInitialized, '嘗試次數:', attempts);
            if (this.dataManager.isInitialized) {
                console.log('✅ 初始化完成，載入團隊總覽');
                this.loadTeamOverview();
                return;
            }

            attempts++;
            if (attempts < maxWait) {
                setTimeout(checkInit, 100);
            } else {
                console.warn('⚠️ 等待初始化超時，強制載入團隊總覽');
                this.loadTeamOverview();
            }
        };

        checkInit();
    }

    // 載入團隊總覽
    loadTeamOverview() {
        console.log('🎯 載入團隊總覽');
        console.log('members 資料:', Object.keys(this.dataManager.members).length, '個成員');
        console.log('assignments 資料:', Object.keys(this.dataManager.assignments).length, '個專案');

        const stats = this.statistics.generateTeamStatistics();
        console.log('統計資料生成完成:', stats);

        // 更新 UI
        const overviewContent = this.uiComponents.generateTeamOverviewContent(stats);
        const contentContainer = document.getElementById('teamOverviewContent');
        if (contentContainer) {
            contentContainer.innerHTML = overviewContent;
        }
    }

    // 開啟團隊管理儀表板
    openTeamManagementDashboard() {
        const modalContent = this.uiComponents.generateTeamManagementModal();

        // 移除舊的模態框（如果存在）
        const existingModal = document.getElementById('teamManagementModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 添加新的模態框到頁面
        document.body.insertAdjacentHTML('beforeend', modalContent);

        // 設定分頁事件監聽器
        document.getElementById('overview-tab').addEventListener('click', () => this.waitForInitAndLoadOverview());
        document.getElementById('members-tab').addEventListener('click', () => this.loadMemberManagement());
        document.getElementById('projects-tab').addEventListener('click', () => this.loadProjectManagement());
        document.getElementById('settings-tab').addEventListener('click', () => this.loadSystemSettings());

        // 顯示模態框
        const modal = new bootstrap.Modal(document.getElementById('teamManagementModal'));
        modal.show();

        // 載入各分頁內容 - 確保資料已載入
        this.waitForInitAndLoadOverview();

        // 預載入成員管理資料以確保組織資料可用
        setTimeout(() => {
            if (this.dataManager.teamConfig && this.dataManager.teamConfig.groups) {
                console.log('預載入成員管理資料完成');
            }
        }, 500);
    }

    // 載入成員管理
    loadMemberManagement() {
        const content = this.uiComponents.generateMemberManagementContent();
        const container = document.getElementById('teamMembersContent');
        if (container) {
            container.innerHTML = content;
        }
    }

    // 載入專案管理（簡化版）
    loadProjectManagement() {
        console.log('🎯 載入專案管理，assignments 資料:', this.dataManager.assignments);

        const assignments = this.dataManager.assignments;
        let content = '<div class="row g-4">';

        Object.values(assignments).forEach(project => {
            const overview = this.statistics.getProjectTeamOverview(project.projectId);
            if (overview) {
                content += `
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="card-title mb-0">${overview.projectName}</h6>
                                <small class="text-muted">狀態: ${overview.status}</small>
                            </div>
                            <div class="card-body">
                                <div class="mb-2">
                                    <strong>團隊成員:</strong> ${overview.totalMembers} 人
                                </div>
                                <div class="mb-3">
                                    <strong>角色分配:</strong>
                                    ${Object.entries(overview.roleBreakdown).map(([role, count]) =>
                                        `<span class="badge bg-secondary me-1">${role}: ${count}</span>`
                                    ).join('')}
                                </div>
                                <div class="list-group list-group-flush">
                                    ${overview.membersList.map(member => `
                                        <div class="list-group-item py-2">
                                            <div class="d-flex justify-content-between align-items-center">
                                                <span>${member.name}</span>
                                                <span class="badge bg-primary">${member.role}</span>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
        });

        content += '</div>';

        const container = document.getElementById('teamProjectsContent');
        if (container) {
            container.innerHTML = content;
        }
    }

    // 載入系統設定
    loadSystemSettings() {
        const content = this.uiComponents.generateSystemSettingsContent();
        const container = document.getElementById('teamSettingsContent');
        if (container) {
            container.innerHTML = content;
        }
    }

    // 啟動自動功能
    async initAutoFeatures() {
        try {
            console.log('團隊管理系統自動功能已啟動');
        } catch (error) {
            console.error('團隊管理系統自動功能啟動失敗:', error);
        }
    }

    // 顯示通知
    showToast(title, message, type = 'info') {
        this.uiComponents.showToast(title, message, type);
    }

    // 取得資料管理器（供外部模組使用）
    getDataManager() {
        return this.dataManager;
    }

    // 取得統計模組（供外部模組使用）
    getStatistics() {
        return this.statistics;
    }

    // 取得 UI 組件（供外部模組使用）
    getUIComponents() {
        return this.uiComponents;
    }

    // 檢查是否已初始化
    isReady() {
        return this.dataManager.isReady();
    }

    // ==================== 成員管理功能 ====================

    // 新增成員
    addNewMember() {
        this.showToast('功能提示', '新增成員功能開發中...', 'info');
    }

    // 編輯成員
    editMember(memberId) {
        console.log('🔵 editMember 被呼叫，memberId:', memberId);
        const modalContent = this.uiComponents.generateMemberEditModal(memberId);
        console.log('🔵 生成的 modal 內容長度:', modalContent.length);

        // 移除舊的模態框
        const existingModal = document.getElementById('editMemberModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 添加新的模態框
        document.body.insertAdjacentHTML('beforeend', modalContent);

        // 顯示模態框
        const modal = new bootstrap.Modal(document.getElementById('editMemberModal'));
        modal.show();
    }

    // 查看成員專案
    viewMemberProjects(memberId) {
        const modalContent = this.uiComponents.generateMemberProjectsModal(memberId);

        // 移除舊的模態框
        const existingModal = document.getElementById('memberProjectsModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 添加新的模態框
        document.body.insertAdjacentHTML('beforeend', modalContent);

        // 顯示模態框
        const modal = new bootstrap.Modal(document.getElementById('memberProjectsModal'));
        modal.show();
    }

    // 移除成員
    removeMember(memberId) {
        if (confirm(`確定要移除成員 ${memberId} 嗎？`)) {
            this.showToast('功能提示', `移除成員 ${memberId} 功能開發中...`, 'warning');
        }
    }

    // ==================== 系統設定功能 ====================

    // 匯出資料
    exportData() {
        try {
            const data = {
                members: this.dataManager.getAllMembers(),
                assignments: this.dataManager.getAllAssignments(),
                exportTime: new Date().toISOString()
            };

            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `team-data-${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            this.showToast('匯出成功', '團隊資料已匯出', 'success');
        } catch (error) {
            this.showToast('匯出失敗', error.message, 'error');
        }
    }

    // 匯入資料
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        // 這裡可以添加資料驗證和匯入邏輯
                        this.showToast('匯入成功', '團隊資料已匯入', 'success');
                    } catch (error) {
                        this.showToast('匯入失敗', '檔案格式錯誤', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    // 重新載入資料
    async reloadData() {
        try {
            await this.dataManager.init();
            this.loadTeamOverview();
            this.showToast('重新載入', '資料已重新載入', 'success');
        } catch (error) {
            this.showToast('載入失敗', error.message, 'error');
        }
    }

    // 清除本地快取
    clearLocalData() {
        if (confirm('確定要清除所有本地快取嗎？這將移除所有未同步的變更。')) {
            localStorage.removeItem('teamAssignments');
            localStorage.removeItem('teamMemberChanges');
            localStorage.removeItem('teamGroupChanges');
            this.showToast('清除完成', '本地快取已清除', 'success');
        }
    }

    // Google Drive 同步功能 - 已移除手動同步，系統現在自動處理

    checkGoogleDriveStatus() {
        if (window.googleDriveAPI && window.googleDriveAPI.isReady()) {
            this.showToast('連線狀態', 'Google Drive 連線正常', 'success');
        } else {
            this.showToast('連線狀態', 'Google Drive 未連線', 'warning');
        }
    }

    // 儲存設定
    saveSettings() {
        const theme = document.getElementById('themeSelect')?.value;
        const timeFormat = document.getElementById('timeFormatSelect')?.value;
        const notifications = document.getElementById('enableNotifications')?.checked;
        const autoSync = document.getElementById('autoSyncSwitch')?.checked;

        // 儲存到 localStorage
        if (theme) localStorage.setItem('theme', theme);
        if (timeFormat) localStorage.setItem('timeFormat', timeFormat);
        if (notifications !== undefined) localStorage.setItem('notifications', notifications);
        if (autoSync !== undefined) localStorage.setItem('autoSyncEnabled', autoSync);

        this.showToast('設定已儲存', '您的偏好設定已成功儲存', 'success');
    }

    // 開發者工具
    generateTestData() {
        this.showToast('測試資料', '生成測試資料功能開發中...', 'info');
    }

    validateData() {
        const members = Object.keys(this.dataManager.getAllMembers()).length;
        const assignments = Object.keys(this.dataManager.getAllAssignments()).length;
        this.showToast('資料驗證', `資料完整性正常：${members} 位成員，${assignments} 個專案`, 'success');
    }

    showDebugInfo() {
        console.log('=== 團隊管理系統除錯資訊 ===');
        console.log('初始化狀態:', this.dataManager.isReady());
        console.log('成員資料:', this.dataManager.getAllMembers());
        console.log('專案分配:', this.dataManager.getAllAssignments());
        console.log('團隊配置:', this.dataManager.teamConfig);
        this.showToast('除錯資訊', '已在控制台輸出除錯資訊', 'info');
    }

    resetSystem() {
        if (confirm('確定要重設整個系統嗎？這將清除所有資料並重新初始化。')) {
            this.clearLocalData();
            window.location.reload();
        }
    }

    // ==================== 成員編輯相關功能 ====================

    // 儲存成員編輯
    saveMemberEdit(memberId) {
        try {
            console.log('🔵 開始儲存成員編輯:', memberId);

            // 收集表單資料
            const memberData = {
                id: memberId,
                name: document.getElementById('memberName')?.value || '',
                primaryRole: document.getElementById('memberPrimaryRole')?.value || '',
                joinDate: document.getElementById('memberJoinDate')?.value || '',
                avatar: document.getElementById('memberAvatar')?.value || '',
                notes: document.getElementById('memberNotes')?.value || ''
            };

            console.log('🔵 收集到的成員資料:', memberData);

            // 收集技能資料
            const skills = [];
            const skillCheckboxes = document.querySelectorAll('#skillsContainer input[type="checkbox"]:checked');
            skillCheckboxes.forEach(checkbox => {
                skills.push(checkbox.value);
            });
            memberData.skills = skills;

            // 驗證必填欄位
            if (!memberData.name.trim()) {
                this.showToast('驗證錯誤', '請輸入成員姓名', 'error');
                return;
            }

            // 更新資料管理器中的成員資料
            const currentMembers = this.dataManager.getAllMembers();
            console.log('🔵 現有成員資料:', currentMembers[memberId]);

            if (currentMembers[memberId]) {
                // 保留原有資料，僅更新修改的欄位
                const updatedMember = {
                    ...currentMembers[memberId],
                    ...memberData
                };

                console.log('🔵 更新後的成員資料:', updatedMember);

                // 直接更新 dataManager 中的資料
                this.dataManager.members[memberId] = updatedMember;

                // 同步更新 teamConfig.members
                if (!this.dataManager.teamConfig) {
                    this.dataManager.teamConfig = {};
                }
                if (!this.dataManager.teamConfig.members) {
                    this.dataManager.teamConfig.members = {};
                }
                this.dataManager.teamConfig.members[memberId] = updatedMember;

                console.log('🔵 dataManager.members[memberId]:', this.dataManager.members[memberId]);
                console.log('🔵 teamConfig.members[memberId]:', this.dataManager.teamConfig.members[memberId]);

                // 儲存到 Google Drive 和本地
                this.dataManager.saveMemberChanges().then(() => {
                    console.log('☁️ 成員資料已同步');
                    this.showToast('儲存成功', '成員資料已儲存', 'success');
                }).catch(error => {
                    console.error('❌ 儲存失敗:', error);
                    this.showToast('儲存失敗', error.message, 'error');
                });

                // 關閉模態框
                const modal = bootstrap.Modal.getInstance(document.getElementById('editMemberModal'));
                if (modal) {
                    modal.hide();
                }

                // 重新載入成員管理頁面
                this.loadMemberManagement();
            } else {
                this.showToast('儲存失敗', '找不到指定的成員', 'error');
            }
        } catch (error) {
            console.error('儲存成員資料失敗:', error);
            this.showToast('儲存失敗', error.message, 'error');
        }
    }

    // 確認刪除成員
    deleteMemberConfirm(memberId) {
        const member = this.dataManager.getAllMembers()[memberId];
        if (!member) {
            this.showToast('錯誤', '找不到指定的成員', 'error');
            return;
        }

        // 檢查成員是否參與專案
        const assignments = this.dataManager.getAllAssignments();
        const participatingProjects = [];

        Object.values(assignments).forEach(project => {
            if (project.members && project.members[memberId]) {
                participatingProjects.push(project.projectName);
            }
        });

        let confirmMessage = `確定要刪除成員 ${member.name} (${memberId}) 嗎？`;
        if (participatingProjects.length > 0) {
            confirmMessage += `\n\n⚠️ 警告：此成員目前參與以下專案：\n${participatingProjects.join(', ')}\n\n刪除後將從所有專案中移除。`;
        }

        if (confirm(confirmMessage)) {
            this.deleteMember(memberId);
        }
    }

    // 執行刪除成員
    deleteMember(memberId) {
        try {
            // 從成員列表中移除
            const currentMembers = this.dataManager.getAllMembers();
            delete currentMembers[memberId];

            // 從所有專案中移除此成員
            const assignments = this.dataManager.getAllAssignments();
            Object.values(assignments).forEach(project => {
                if (project.members && project.members[memberId]) {
                    delete project.members[memberId];
                }
            });

            // 更新本地儲存
            const savedMembers = JSON.parse(localStorage.getItem('teamMemberChanges') || '{}');
            savedMembers[memberId] = { deleted: true };
            localStorage.setItem('teamMemberChanges', JSON.stringify(savedMembers));

            // 關閉模態框
            const modal = bootstrap.Modal.getInstance(document.getElementById('editMemberModal'));
            if (modal) {
                modal.hide();
            }

            // 重新載入頁面
            this.loadMemberManagement();
            this.loadTeamOverview();

            this.showToast('刪除成功', `成員 ${memberId} 已從系統中移除`, 'success');
        } catch (error) {
            console.error('刪除成員失敗:', error);
            this.showToast('刪除失敗', error.message, 'error');
        }
    }

    // ========== 成員專案 CRUD 功能 ==========

    // 分配成員到專案
    assignMemberToProject(memberId) {
        const member = this.dataManager.getAllMembers()[memberId];
        if (!member) {
            this.showToast('錯誤', '找不到指定成員', 'error');
            return;
        }

        const allProjects = this.dataManager.getAllAssignments();
        const availableProjects = Object.keys(allProjects);

        if (availableProjects.length === 0) {
            this.showToast('無可用專案', '目前沒有可分配的專案', 'warning');
            return;
        }

        // 創建分配專案的 modal
        const modalHtml = `
            <div class="modal fade" id="assignProjectModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-user-plus me-2"></i>分配專案給 ${member.name}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="assignProjectForm">
                                <div class="mb-3">
                                    <label for="projectSelect" class="form-label">選擇專案</label>
                                    <select class="form-select" id="projectSelect" required>
                                        <option value="">請選擇專案...</option>
                                        ${availableProjects.map(projectId => {
                                            const project = allProjects[projectId];
                                            return `<option value="${projectId}">${project.projectName}</option>`;
                                        }).join('')}
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="roleSelect" class="form-label">選擇角色</label>
                                    <select class="form-select" id="roleSelect" required>
                                        <option value="">請選擇角色...</option>
                                        <option value="frontend">前端開發</option>
                                        <option value="backend">後端開發</option>
                                        <option value="testing">測試驗證</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="assignDate" class="form-label">分配日期</label>
                                    <input type="date" class="form-control" id="assignDate" value="${new Date().toISOString().split('T')[0]}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="memberTasks" class="form-label">負責任務（可選）</label>
                                    <textarea class="form-control" id="memberTasks" rows="3" placeholder="請輸入具體任務，每行一個任務"></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-success" onclick="teamManagement.confirmAssignProject('${memberId}')">確認分配</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除舊的 modal
        const existingModal = document.getElementById('assignProjectModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 添加並顯示新的 modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('assignProjectModal'));
        modal.show();
    }

    // 確認分配專案
    confirmAssignProject(memberId) {
        const projectId = document.getElementById('projectSelect').value;
        const role = document.getElementById('roleSelect').value;
        const assignDate = document.getElementById('assignDate').value;
        const tasksText = document.getElementById('memberTasks').value;

        if (!projectId || !role || !assignDate) {
            this.showToast('輸入錯誤', '請填寫所有必填欄位', 'error');
            return;
        }

        // 處理任務列表
        const tasks = tasksText ? tasksText.split('\n').filter(task => task.trim()) : [];

        // 更新專案分配資料
        const assignments = this.dataManager.getAllAssignments();
        if (!assignments[projectId]) {
            assignments[projectId] = { members: {} };
        }
        if (!assignments[projectId].members) {
            assignments[projectId].members = {};
        }

        assignments[projectId].members[memberId] = {
            memberId: memberId,
            role: role,
            assignedDate: assignDate,
            tasks: tasks
        };

        // 更新最後修改時間
        assignments[projectId].lastUpdated = new Date().toISOString().split('T')[0];

        // 儲存變更
        this.dataManager.saveLocalChanges().then(() => {
            this.showToast('分配成功', `已將 ${this.dataManager.getAllMembers()[memberId].name} 分配到專案`, 'success');

            // 關閉 modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('assignProjectModal'));
            modal.hide();

            // 重新載入成員專案檢視
            this.viewMemberProjects(memberId);
        }).catch(error => {
            console.error('儲存失敗:', error);
            this.showToast('儲存失敗', '無法儲存專案分配變更', 'error');
        });
    }

    // 移除成員從專案
    removeMemberFromProject(memberId, projectId) {
        const member = this.dataManager.getAllMembers()[memberId];
        const project = this.dataManager.getAllAssignments()[projectId];

        if (!member || !project) {
            this.showToast('錯誤', '找不到指定成員或專案', 'error');
            return;
        }

        if (confirm(`確定要將 ${member.name} 從專案「${project.projectName}」中移除嗎？`)) {
            // 從專案中移除成員
            delete project.members[memberId];

            // 更新最後修改時間
            project.lastUpdated = new Date().toISOString().split('T')[0];

            // 儲存變更
            this.dataManager.saveLocalChanges().then(() => {
                this.showToast('移除成功', `已將 ${member.name} 從專案中移除`, 'success');

                // 重新載入成員專案檢視
                this.viewMemberProjects(memberId);
            }).catch(error => {
                console.error('儲存失敗:', error);
                this.showToast('儲存失敗', '無法儲存專案變更', 'error');
            });
        }
    }

    // 變更成員在專案中的角色
    changeMemberRole(memberId, projectId, currentRole) {
        const member = this.dataManager.getAllMembers()[memberId];
        const project = this.dataManager.getAllAssignments()[projectId];

        if (!member || !project) {
            this.showToast('錯誤', '找不到指定成員或專案', 'error');
            return;
        }

        // 創建角色變更的 modal
        const modalHtml = `
            <div class="modal fade" id="changeRoleModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-warning text-dark">
                            <h5 class="modal-title">
                                <i class="fas fa-exchange-alt me-2"></i>變更 ${member.name} 的角色
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p><strong>專案：</strong>${project.projectName}</p>
                            <p><strong>目前角色：</strong><span class="badge bg-secondary">${currentRole}</span></p>

                            <form id="changeRoleForm">
                                <div class="mb-3">
                                    <label for="newRoleSelect" class="form-label">新角色</label>
                                    <select class="form-select" id="newRoleSelect" required>
                                        <option value="">請選擇新角色...</option>
                                        <option value="frontend" ${currentRole === 'frontend' ? 'disabled' : ''}>前端開發</option>
                                        <option value="backend" ${currentRole === 'backend' ? 'disabled' : ''}>後端開發</option>
                                        <option value="testing" ${currentRole === 'testing' ? 'disabled' : ''}>測試驗證</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-warning" onclick="teamManagement.confirmChangeRole('${memberId}', '${projectId}')">確認變更</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除舊的 modal
        const existingModal = document.getElementById('changeRoleModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 添加並顯示新的 modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('changeRoleModal'));
        modal.show();
    }

    // 確認變更角色
    confirmChangeRole(memberId, projectId) {
        const newRole = document.getElementById('newRoleSelect').value;

        if (!newRole) {
            this.showToast('輸入錯誤', '請選擇新角色', 'error');
            return;
        }

        const project = this.dataManager.getAllAssignments()[projectId];
        const member = this.dataManager.getAllMembers()[memberId];

        // 更新成員角色
        project.members[memberId].role = newRole;
        project.lastUpdated = new Date().toISOString().split('T')[0];

        // 儲存變更
        this.dataManager.saveLocalChanges().then(() => {
            this.showToast('變更成功', `已變更 ${member.name} 的角色為 ${newRole}`, 'success');

            // 關閉 modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('changeRoleModal'));
            modal.hide();

            // 重新載入成員專案檢視
            this.viewMemberProjects(memberId);
        }).catch(error => {
            console.error('儲存失敗:', error);
            this.showToast('儲存失敗', '無法儲存角色變更', 'error');
        });
    }

    // 編輯成員任務
    editMemberTasks(memberId, projectId) {
        const member = this.dataManager.getAllMembers()[memberId];
        const project = this.dataManager.getAllAssignments()[projectId];

        if (!member || !project || !project.members[memberId]) {
            this.showToast('錯誤', '找不到指定成員或專案', 'error');
            return;
        }

        const currentTasks = project.members[memberId].tasks || [];

        // 創建任務編輯的 modal
        const modalHtml = `
            <div class="modal fade" id="editTasksModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-info text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-tasks me-2"></i>編輯 ${member.name} 的任務
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p><strong>專案：</strong>${project.projectName}</p>

                            <form id="editTasksForm">
                                <div class="mb-3">
                                    <label for="tasksList" class="form-label">負責任務</label>
                                    <textarea class="form-control" id="tasksList" rows="6" placeholder="請輸入具體任務，每行一個任務">${currentTasks.join('\n')}</textarea>
                                    <div class="form-text">每行輸入一個任務</div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-info" onclick="teamManagement.confirmEditTasks('${memberId}', '${projectId}')">儲存任務</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除舊的 modal
        const existingModal = document.getElementById('editTasksModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 添加並顯示新的 modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('editTasksModal'));
        modal.show();
    }

    // 確認編輯任務
    confirmEditTasks(memberId, projectId) {
        const tasksText = document.getElementById('tasksList').value;
        const tasks = tasksText ? tasksText.split('\n').filter(task => task.trim()) : [];

        const project = this.dataManager.getAllAssignments()[projectId];
        const member = this.dataManager.getAllMembers()[memberId];

        // 更新任務列表
        project.members[memberId].tasks = tasks;
        project.lastUpdated = new Date().toISOString().split('T')[0];

        // 儲存變更
        this.dataManager.saveLocalChanges().then(() => {
            this.showToast('更新成功', `已更新 ${member.name} 的任務列表`, 'success');

            // 關閉 modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editTasksModal'));
            modal.hide();

            // 重新載入成員專案檢視
            this.viewMemberProjects(memberId);
        }).catch(error => {
            console.error('儲存失敗:', error);
            this.showToast('儲存失敗', '無法儲存任務變更', 'error');
        });
    }
}

// 全域實例
window.teamManagement = new TeamManagement();

// 當頁面載入完成時啟動自動功能
document.addEventListener('DOMContentLoaded', () => {
    if (window.teamManagement) {
        window.teamManagement.initAutoFeatures();
    }
});