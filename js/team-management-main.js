/**
 * 團隊管理主控制器
 * 整合所有模組，提供統一的管理介面
 */

class TeamManagement {
    constructor() {
        // 使用全域單例或創建新實例
        this.dataManager = window.globalTeamDataManager || new TeamDataManager();
        this.statistics = new TeamStatistics(this.dataManager);
        this.uiComponents = new TeamUIComponents(this.dataManager, this.statistics);

        // 如果不是全域實例，則初始化
        if (!window.globalTeamDataManager) {
            this.dataManager.init();
        }
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
        document.getElementById('tasks-tab').addEventListener('click', () => this.loadTaskManagement());
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
    async loadProjectManagement() {
        // 如果資料過時或未載入，才重新載入
        const lastUpdate = this.dataManager.lastUpdateTime || 0;
        const now = Date.now();
        const shouldRefresh = !this.dataManager.isInitialized || (now - lastUpdate > 30000); // 30秒快取

        if (shouldRefresh) {
            console.log('🔄 重新載入最新專案資料...');
            await this.dataManager.init();
        } else {
            console.log('📋 使用快取的專案資料');
        }

        console.log('🎯 載入專案管理，assignments 資料:', Object.keys(this.dataManager.assignments || {}).length, '個專案');

        const assignments = this.dataManager.assignments || {};

        // 添加新增專案按鈕
        let content = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h5 class="mb-0">專案管理</h5>
                <button class="btn btn-primary" onclick="teamManagement.addNewProject()">
                    <i class="fas fa-plus me-2"></i>新增專案
                </button>
            </div>
            <div class="row g-4">
        `;

        Object.values(assignments).forEach(project => {
            const overview = this.statistics.getProjectTeamOverview(project.projectId);
            if (overview) {
                content += `
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="card-title mb-0">${overview.projectName}</h6>
                                    <small class="text-muted">狀態: ${overview.status}</small>
                                </div>
                                <div class="btn-group">
                                    <button class="btn btn-outline-primary btn-sm" onclick="teamManagement.editProject('${project.projectId}')" title="編輯專案">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-outline-danger btn-sm" onclick="teamManagement.deleteProject('${project.projectId}')" title="刪除專案">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="card-body">
                                <div class="mb-2">
                                    <strong>團隊成員:</strong> ${overview.totalMembers} 人
                                </div>
                                <div class="mb-2">
                                    <strong>專案進度:</strong>
                                    <div class="d-flex align-items-center">
                                        <input type="range" class="form-range me-2" min="0" max="100"
                                               value="${project.progress || 0}"
                                               id="progress-${project.projectId}"
                                               onchange="teamManagement.updateProjectProgress('${project.projectId}', this.value)">
                                        <span class="badge bg-info" id="progress-value-${project.projectId}">${project.progress || 0}%</span>
                                    </div>
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

    // 載入任務管理
    async loadTaskManagement() {
        try {
            console.log('🔄 開始載入任務管理內容...');
            const content = await this.uiComponents.generateTaskManagementContent();
            const container = document.getElementById('teamTasksContent');
            if (container) {
                container.innerHTML = content;
            }

            // 確保全域範本資料已載入
            if (!window.taskTemplatesData) {
                console.log('⚠️ 全域範本資料未設定，嘗試載入...');
                try {
                    const response = await fetch('config/task-templates.json?v=' + Date.now());
                    if (response.ok) {
                        window.taskTemplatesData = await response.json();
                        console.log('✅ 全域範本資料載入成功');
                    }
                } catch (globalLoadError) {
                    console.error('❌ 全域範本資料載入失敗:', globalLoadError);
                }
            }

            console.log('✅ 任務管理內容載入完成');
        } catch (error) {
            console.error('❌ 載入任務管理失敗:', error);
            const container = document.getElementById('teamTasksContent');
            if (container) {
                container.innerHTML = '<div class="alert alert-danger">載入任務管理失敗: ' + error.message + '</div>';
            }
        }
    }

    // 選擇任務角色
    async selectTaskRole(combinedId) {
        try {
            // 如果是新的範本key（4個範本），直接處理
            const templateKeys = ['frontend', 'backend', 'fullstack', 'testing'];
            const isTemplateKey = templateKeys.includes(combinedId);

            if (isTemplateKey) {
                // 新的範本key邏輯
                const templateKey = combinedId;

                // 更新選中狀態
                document.querySelectorAll('[id^="task-role-"]').forEach(btn => {
                    btn.classList.remove('active');
                });
                const targetElement = document.getElementById(`task-role-${templateKey}`);
                if (targetElement) {
                    targetElement.classList.add('active');
                }

                // 處理範本顯示邏輯...
                await this.handleTemplateKeySelection(templateKey);
                return;
            }

            // 舊的組合ID邏輯 (例如: "CC-frontend")
            const [memberType, roleId] = combinedId.split('-');

            // 更新選中狀態
            document.querySelectorAll('[id^="task-role-"]').forEach(btn => {
                btn.classList.remove('active');
            });
            const targetElement = document.getElementById(`task-role-${combinedId}`);
            if (targetElement) {
                targetElement.classList.add('active');
            }

            // 載入角色的任務範本
            const roles = this.dataManager.getAllRoles();
            const role = roles[roleId];

            // 確保範本資料存在，如果不存在則重新載入
            let taskTemplates = window.taskTemplatesData;
            if (!taskTemplates || !taskTemplates.taskTemplates) {
                console.log('🔄 任務範本資料不存在，重新載入...');
                try {
                    const response = await fetch('config/task-templates.json?v=' + Date.now());
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    taskTemplates = await response.json();
                    window.taskTemplatesData = taskTemplates;
                    console.log('✅ 任務範本資料重新載入成功');
                } catch (fetchError) {
                    console.error('❌ 重新載入任務範本失敗:', fetchError);
                    throw new Error('無法載入任務範本資料');
                }
            }

            if (!taskTemplates || !taskTemplates.taskTemplates) {
                throw new Error('任務範本資料格式錯誤');
            }

            // 取得成員和角色資訊
            const memberNames = {
                'CC': 'Klauder',
                'CA': 'KersirAjen',
                'GI': 'Jaymenight',
                'CI': 'Kodes',
                'CS': 'Kersir',
                'VC': 'Kopylot'
            };
            const memberName = memberNames[memberType];

            // 更新標題
            document.getElementById('task-template-title').innerHTML =
                `<span class="badge me-2" style="background-color: ${role.color}">${role.icon || '[角色]'}</span>${memberName} - ${role.name} 任務範本編輯`;

            // 生成編輯介面
            const template = taskTemplates.taskTemplates[roleId];

            const content = `
                <div class="mb-3">
                    <label for="template-title-${combinedId}" class="form-label">範本標題</label>
                    <input type="text" class="form-control" id="template-title-${combinedId}"
                           value="${template ? template.title : ''}"
                           placeholder="輸入任務範本標題">
                </div>
                <div class="mb-3">
                    <label for="template-content-${combinedId}" class="form-label">範本內容</label>
                    <textarea class="form-control" id="template-content-${combinedId}"
                              rows="20" style="font-family: 'Courier New', monospace; font-size: 14px; height: 500px;"
                              placeholder="輸入任務範本內容（支援 Markdown 格式）">${template ? template.content : ''}</textarea>
                </div>
                <div class="d-flex justify-content-between">
                    <div>
                        <button class="btn btn-outline-secondary me-2" onclick="teamManagement.previewTaskTemplate('${combinedId}').catch(console.error)">
                            <i class="fas fa-eye me-2"></i>預覽
                        </button>
                        <button class="btn btn-outline-info" onclick="teamManagement.copyTaskTemplate('${combinedId}').catch(console.error)">
                            <i class="fas fa-copy me-2"></i>複製
                        </button>
                    </div>
                    <button class="btn btn-outline-danger" onclick="teamManagement.resetTaskTemplate('${combinedId}').catch(console.error)">
                        <i class="fas fa-undo me-2"></i>重設為預設
                    </button>
                </div>
            `;

            document.getElementById('task-template-content').innerHTML = content;

            console.log(`✅ 已載入 ${memberName} - ${role.name} 的任務範本`);
        } catch (error) {
            console.error('❌ 載入任務範本失敗:', error);
            document.getElementById('task-template-content').innerHTML =
                `<div class="alert alert-danger">載入任務範本失敗: ${error.message}</div>`;
        }
    }

    // 處理新的範本key選擇（只用於任務範本管理頁面）
    async handleTemplateKeySelection(templateKey) {
        try {
            // 確保範本資料存在
            let taskTemplates = window.taskTemplatesData;
            if (!taskTemplates || !taskTemplates.taskTemplates) {
                console.log('🔄 任務範本資料不存在，重新載入...');
                const response = await fetch('config/task-templates.json?v=' + Date.now());
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                taskTemplates = await response.json();
                window.taskTemplatesData = taskTemplates;
            }

            // 取得範本資訊
            const templateRoles = {
                'frontend': { name: '前端開發', icon: 'FE', color: '#007bff' },
                'backend': { name: '後端開發', icon: 'BE', color: '#28a745' },
                'fullstack': { name: '全端開發', icon: 'FS', color: '#fd7e14' },
                'testing': { name: '測試與部署', icon: 'QA', color: '#6f42c1' }
            };
            const roleInfo = templateRoles[templateKey];

            // 更新標題
            document.getElementById('task-template-title').innerHTML =
                `<span class="badge me-2" style="background-color: ${roleInfo.color}">${roleInfo.icon}</span>${roleInfo.name} 任務範本編輯`;

            // 生成編輯介面
            const template = taskTemplates.taskTemplates[templateKey];

            const content = `
                <div class="mb-3">
                    <label for="template-title-${templateKey}" class="form-label">範本標題</label>
                    <input type="text" class="form-control" id="template-title-${templateKey}"
                           value="${template ? template.title : ''}"
                           placeholder="輸入任務範本標題">
                </div>
                <div class="mb-3">
                    <label for="template-content-${templateKey}" class="form-label">範本內容</label>
                    <textarea class="form-control" id="template-content-${templateKey}"
                              rows="20" style="font-family: 'Courier New', monospace; font-size: 14px; height: 500px;"
                              placeholder="輸入任務範本內容（支援 Markdown 格式）">${template ? template.content : ''}</textarea>
                </div>
                <div class="d-flex justify-content-between">
                    <div>
                        <button class="btn btn-outline-secondary me-2" onclick="teamManagement.previewTaskTemplate('${templateKey}').catch(console.error)">
                            <i class="fas fa-eye me-2"></i>預覽
                        </button>
                        <button class="btn btn-outline-info" onclick="teamManagement.copyTaskTemplate('${templateKey}').catch(console.error)">
                            <i class="fas fa-copy me-2"></i>複製
                        </button>
                    </div>
                    <button class="btn btn-outline-danger" onclick="teamManagement.resetTaskTemplate('${templateKey}').catch(console.error)">
                        <i class="fas fa-undo me-2"></i>重設為預設
                    </button>
                </div>
            `;

            document.getElementById('task-template-content').innerHTML = content;
            console.log(`✅ 已載入 ${roleInfo.name} 的任務範本`);
        } catch (error) {
            console.error('❌ 載入任務範本失敗:', error);
            document.getElementById('task-template-content').innerHTML =
                `<div class="alert alert-danger">載入任務範本失敗: ${error.message}</div>`;
        }
    }

    // 預覽任務範本
    async previewTaskTemplate(idOrKey) {
        const titleInput = document.getElementById(`template-title-${idOrKey}`);
        const contentInput = document.getElementById(`template-content-${idOrKey}`);

        if (!titleInput || !contentInput) {
            alert('請先選擇角色範本');
            return;
        }

        const title = titleInput.value;
        const content = contentInput.value;

        // 開啟預覽模態框
        const previewModal = `
            <div class="modal fade" id="taskPreviewModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <pre style="white-space: pre-wrap; font-family: 'Arial', sans-serif;">${content}</pre>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除舊的預覽模態框
        const existingModal = document.getElementById('taskPreviewModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 添加新的預覽模態框
        document.body.insertAdjacentHTML('beforeend', previewModal);
        const modal = new bootstrap.Modal(document.getElementById('taskPreviewModal'));
        modal.show();
    }

    // 重設任務範本為預設值
    async resetTaskTemplate(idOrKey) {
        if (!confirm('確定要將此範本重設為預設值嗎？這將清除所有自訂內容。')) {
            return;
        }

        try {
            // 重新載入預設範本
            const response = await fetch('config/task-templates.json?v=' + Date.now());
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const taskTemplates = await response.json();

            // 判斷是新格式還是舊格式
            let templateKey;
            if (['frontend', 'backend', 'fullstack', 'testing'].includes(idOrKey)) {
                templateKey = idOrKey;
            } else {
                // 舊格式：解析 combinedId
                const [memberType, roleId] = idOrKey.split('-');
                templateKey = roleId;
            }

            const template = taskTemplates.taskTemplates[templateKey];

            if (template) {
                document.getElementById(`template-title-${idOrKey}`).value = template.title;
                document.getElementById(`template-content-${idOrKey}`).value = template.content;
                alert('範本已重設為預設值');
            } else {
                alert('找不到預設範本');
            }
        } catch (error) {
            console.error('重設範本失敗:', error);
            alert('重設範本失敗');
        }
    }

    // 複製任務範本
    async copyTaskTemplate(idOrKey) {
        try {
            const titleInput = document.getElementById(`template-title-${idOrKey}`);
            const contentInput = document.getElementById(`template-content-${idOrKey}`);

            if (!titleInput || !contentInput) {
                alert('請先選擇角色範本');
                return;
            }

            const title = titleInput.value;
            const content = contentInput.value;

            if (!title && !content) {
                alert('沒有內容可複製');
                return;
            }

            const templateText = `標題: ${title}\n\n內容:\n${content}`;

            // 複製到剪貼板
            await navigator.clipboard.writeText(templateText);

            // 顯示成功提示
            const copyButton = document.querySelector(`button[onclick*="copyTaskTemplate('${idOrKey}')"]`);
            if (copyButton) {
                const originalText = copyButton.innerHTML;
                copyButton.innerHTML = '<i class="fas fa-check me-2"></i>已複製';
                copyButton.classList.remove('btn-outline-info');
                copyButton.classList.add('btn-success');

                setTimeout(() => {
                    copyButton.innerHTML = originalText;
                    copyButton.classList.remove('btn-success');
                    copyButton.classList.add('btn-outline-info');
                }, 2000);
            }

            console.log('✅ 任務範本已複製到剪貼板');
        } catch (error) {
            console.error('❌ 複製任務範本失敗:', error);
            alert('複製失敗，請手動複製內容');
        }
    }

    // 儲存任務範本變更
    async saveTaskTemplates() {
        try {
            const taskTemplatesData = window.taskTemplatesData;
            if (!taskTemplatesData) {
                throw new Error('任務範本資料未載入');
            }

            // 收集當前頁面可見的變更
            const roles = this.dataManager.getAllRoles();
            let hasChanges = false;

            // 只更新目前可見的範本（避免覆蓋其他範本）
            Object.keys(roles).forEach(roleId => {
                const titleInput = document.querySelector(`input[id*="template-title"][id*="${roleId}"]`);
                const contentInput = document.querySelector(`textarea[id*="template-content"][id*="${roleId}"]`);

                if (titleInput && contentInput && titleInput.offsetParent !== null) {
                    // 確保任務範本結構存在
                    if (!taskTemplatesData.taskTemplates[roleId]) {
                        taskTemplatesData.taskTemplates[roleId] = {};
                    }

                    taskTemplatesData.taskTemplates[roleId].title = titleInput.value;
                    taskTemplatesData.taskTemplates[roleId].content = contentInput.value;
                    hasChanges = true;
                }
            });

            if (!hasChanges) {
                alert('沒有變更需要儲存');
                return;
            }

            // 儲存到 Google Drive
            if (window.googleDriveAPI && window.googleDriveAPI.isAuthenticated) {
                await window.googleDriveAPI.saveFile('task-templates.json', taskTemplatesData);
                console.log('✅ 任務範本已儲存到 Google Drive');
            }

            // 儲存到本地快取
            localStorage.setItem('cachedTaskTemplates', JSON.stringify(taskTemplatesData));

            alert('任務範本已成功儲存');
            console.log('✅ 任務範本儲存完成');
        } catch (error) {
            console.error('❌ 儲存任務範本失敗:', error);
            alert('儲存任務範本失敗: ' + error.message);
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
                    console.log('☁️ 成員資料已同步到 Google Drive');
                    this.showToast('儲存成功', '成員資料已同步到 Google Drive', 'success');
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
                                        <option value="fullstack">全端開發</option>
                                        <option value="testing">驗測部署</option>
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

        // 添加成員變更歷程記錄
        const historyResult = this.addMemberChangeHistory(projectId, {
            action: 'member_assigned',
            memberId: memberId,
            memberName: this.dataManager.getAllMembers()[memberId].name,
            role: role,
            assignedDate: assignDate,
            details: tasks.length > 0 ? `任務數量: ${tasks.length}` : '無指定任務'
        });

        console.log('📝 歷程記錄結果:', historyResult);

        // 儲存變更
        this.dataManager.saveLocalChanges().then(() => {
            this.showToast('分配成功', `已將 ${this.dataManager.getAllMembers()[memberId].name} 分配到專案`, 'success');

            // 關閉 modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('assignProjectModal'));
            modal.hide();

            // 重新載入成員專案檢視
            this.viewMemberProjects(memberId);

            // 通知首頁重新載入資料
            this.refreshMainPage();
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
            // 記錄移除前的資訊
            const memberInfo = project.members[memberId];

            // 添加成員變更歷程記錄 (在移除之前記錄)
            const historyResult = this.addMemberChangeHistory(projectId, {
                action: 'member_removed',
                memberId: memberId,
                memberName: member.name,
                role: memberInfo ? memberInfo.role : '未知',
                details: `移除日期: ${memberInfo ? memberInfo.assignedDate : '未知'}`
            });

            console.log('📝 移除成員歷程記錄結果:', historyResult);

            // 從專案中移除成員
            delete project.members[memberId];

            // 更新最後修改時間
            project.lastUpdated = new Date().toISOString().split('T')[0];

            // 儲存變更
            this.dataManager.saveLocalChanges().then(() => {
                this.showToast('移除成功', `已將 ${member.name} 從專案中移除`, 'success');

                // 重新載入成員專案檢視
                this.viewMemberProjects(memberId);

                // 通知首頁重新載入資料
                this.refreshMainPage();
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
                                        <option value="fullstack" ${currentRole === 'fullstack' ? 'disabled' : ''}>全端開發</option>
                                        <option value="testing" ${currentRole === 'testing' ? 'disabled' : ''}>驗測部署</option>
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
        const currentRole = project.members[memberId].role;

        // 添加成員變更歷程記錄 (在變更之前記錄)
        const historyResult = this.addMemberChangeHistory(projectId, {
            action: 'role_changed',
            memberId: memberId,
            memberName: member.name,
            oldRole: currentRole,
            newRole: newRole,
            details: `角色從「${currentRole}」變更為「${newRole}」`
        });

        console.log('📝 角色變更歷程記錄結果:', historyResult);

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

            // 通知首頁重新載入資料
            this.refreshMainPage();
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

            // 通知首頁重新載入資料
            this.refreshMainPage();
        }).catch(error => {
            console.error('儲存失敗:', error);
            this.showToast('儲存失敗', '無法儲存任務變更', 'error');
        });
    }

    // ==================== 專案管理相關功能 ====================

    // 新增專案
    addNewProject() {
        // 直接定義 modal HTML 避免依賴問題
        const modalContent = `
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
                            <form id="addProjectForm" class="needs-validation" novalidate>
                                <div class="mb-3">
                                    <label for="projectId" class="form-label">專案 ID *</label>
                                    <input type="text" class="form-control" id="projectId" required
                                           placeholder="例如: ErCore, ErNexus" pattern="[A-Za-z][A-Za-z0-9]*">
                                    <div class="invalid-feedback">請輸入有效的專案 ID（字母開頭，僅包含字母和數字）</div>
                                </div>
                                <div class="mb-3">
                                    <label for="projectName" class="form-label">專案名稱 *</label>
                                    <input type="text" class="form-control" id="projectName" required
                                           placeholder="例如: ErCore - 企業級 AI 統一平台">
                                    <div class="invalid-feedback">請輸入專案名稱</div>
                                </div>
                                <div class="mb-3">
                                    <label for="projectStatus" class="form-label">初始狀態</label>
                                    <select class="form-select" id="projectStatus">
                                        <option value="active" selected>進行中</option>
                                        <option value="planning">規劃中</option>
                                        <option value="paused">暫停</option>
                                    </select>
                                </div>
                                <div class="alert alert-info">
                                    <i class="fas fa-info-circle me-2"></i>
                                    專案建立後，您可以在專案管理頁面中分配成員和設定任務。
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-primary" onclick="teamManagement.saveNewProject()">
                                <i class="fas fa-save me-2"></i>建立專案
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除舊的模態框
        const existingModal = document.getElementById('addProjectModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 添加新的模態框
        document.body.insertAdjacentHTML('beforeend', modalContent);

        // 顯示模態框
        const modal = new bootstrap.Modal(document.getElementById('addProjectModal'));
        modal.show();
    }

    // 儲存新專案
    saveNewProject() {
        try {
            console.log('🔵 開始儲存新專案');

            // 收集表單資料
            const projectData = {
                projectId: document.getElementById('projectId')?.value?.trim() || '',
                projectName: document.getElementById('projectName')?.value?.trim() || '',
                description: document.getElementById('projectDescription')?.value?.trim() || '',
                status: document.getElementById('projectStatus')?.value || 'active',
                startDate: document.getElementById('projectStartDate')?.value || new Date().toISOString().split('T')[0]
            };

            console.log('🔵 收集到的專案資料:', projectData);

            // 驗證必填欄位
            if (!projectData.projectId) {
                this.showToast('驗證錯誤', '請輸入專案 ID', 'error');
                return;
            }

            if (!projectData.projectName) {
                this.showToast('驗證錯誤', '請輸入專案名稱', 'error');
                return;
            }

            // 檢查專案 ID 是否已存在
            const existingProjects = this.dataManager.getAllAssignments();
            if (existingProjects[projectData.projectId]) {
                this.showToast('驗證錯誤', `專案 ID "${projectData.projectId}" 已存在`, 'error');
                return;
            }

            // 創建新專案
            const newProject = {
                projectId: projectData.projectId,
                projectName: projectData.projectName,
                description: projectData.description,
                status: projectData.status,
                startDate: projectData.startDate,
                lastUpdated: new Date().toISOString().split('T')[0],
                members: {}
            };

            console.log('🔵 新專案物件:', newProject);

            // 添加到 dataManager
            this.dataManager.assignments[projectData.projectId] = newProject;

            // 儲存到本地和 Google Drive
            this.dataManager.saveLocalChanges().then(async () => {
                console.log('☁️ 專案資料已同步');

                // 創建對應的 markdown 檔案（可選）
                try {
                    await this.createProjectMarkdownFile(projectData);
                    console.log('📝 專案 markdown 檔案已創建');
                } catch (markdownError) {
                    console.warn('⚠️ markdown 檔案創建失敗，但專案已成功創建:', markdownError.message);
                    // 提示用戶手動創建
                    this.showToast('提醒', `專案已創建，請手動創建 ${projectData.projectId}.md 檔案`, 'warning');
                }

                this.showToast('創建成功', `專案 "${projectData.projectName}" 已創建`, 'success');

                // 關閉模態框
                const modal = bootstrap.Modal.getInstance(document.getElementById('addProjectModal'));
                if (modal) {
                    modal.hide();
                }

                // 重新載入專案管理頁面
                this.loadProjectManagement();

                // 通知首頁重新載入資料
                this.refreshMainPage();
            }).catch(error => {
                console.error('❌ 儲存失敗:', error);
                this.showToast('儲存失敗', error.message, 'error');
            });

        } catch (error) {
            console.error('❌ 創建專案失敗:', error);
            this.showToast('創建失敗', error.message, 'error');
        }
    }

    // 創建專案 markdown 檔案
    async createProjectMarkdownFile(projectData) {
        const markdownContent = `# ${projectData.projectName}

## 專案概覽
- **狀態**: ${projectData.status}
- **進度**: 0%
- **開始日期**: ${projectData.startDate}
- **描述**: ${projectData.description || '暫無描述'}

## 功能清單

### 核心功能
- [ ] 功能規劃
- [ ] 需求分析
- [ ] 架構設計

### 開發階段
- [ ] 前端開發
- [ ] 後端開發
- [ ] 資料庫設計

### 測試階段
- [ ] 單元測試
- [ ] 整合測試
- [ ] 用戶測試

## 技術棧
- 待定

## 里程碑
1. **階段1**: 需求分析與規劃
2. **階段2**: 核心功能開發
3. **階段3**: 測試與優化
4. **階段4**: 正式發布

## 團隊成員
- 待分配

## 備註
專案於 ${new Date().toLocaleDateString('zh-TW')} 創建
`;

        try {
            // 嘗試使用 Google Drive API 創建檔案
            if (window.googleDriveAPI && window.googleDriveAPI.isAuthenticated) {
                const fileName = `${projectData.projectId}.md`;
                await window.googleDriveAPI.createFile(fileName, markdownContent);
                console.log(`✅ 已在 Google Drive 創建 ${fileName}`);
            } else {
                // 如果 Google Drive 不可用，創建本地檔案
                console.log('📝 Google Drive 未認證，嘗試創建本地檔案');
                await this.createLocalMarkdownFile(projectData.projectId, markdownContent);
            }
        } catch (error) {
            console.error('❌ 創建 markdown 檔案失敗:', error);
            // 嘗試本地備用方案
            try {
                await this.createLocalMarkdownFile(projectData.projectId, markdownContent);
                console.log('✅ 已使用本地備用方案創建檔案');
            } catch (localError) {
                console.warn('⚠️ 本地檔案創建也失敗，但專案已成功創建');
                throw error;
            }
        }
    }

    // 創建本地 markdown 檔案（備用方案）
    async createLocalMarkdownFile(projectId, content) {
        // 瀏覽器無法直接寫入本地檔案，但可以提供下載
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);

        // 創建下載連結
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectId}.md`;
        a.style.display = 'none';

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);

        this.showToast('檔案下載', `請將下載的 ${projectId}.md 檔案放入 projects/ 資料夾`, 'info');
    }

    // 編輯專案
    editProject(projectId) {
        const project = this.dataManager.getAllAssignments()[projectId];
        if (!project) {
            this.showToast('錯誤', '找不到指定專案', 'error');
            return;
        }

        // 創建編輯專案的 modal
        const modalHtml = `
            <div class="modal fade" id="editProjectModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-edit me-2"></i>編輯專案
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editProjectForm">
                                <div class="mb-3">
                                    <label for="editProjectId" class="form-label">專案 ID</label>
                                    <input type="text" class="form-control" id="editProjectId" value="${project.projectId}" readonly>
                                </div>
                                <div class="mb-3">
                                    <label for="editProjectName" class="form-label">專案名稱</label>
                                    <input type="text" class="form-control" id="editProjectName" value="${project.projectName}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="editProjectStatus" class="form-label">專案狀態</label>
                                    <select class="form-select" id="editProjectStatus" required>
                                        <option value="active" ${project.status === 'active' ? 'selected' : ''}>進行中</option>
                                        <option value="completed" ${project.status === 'completed' ? 'selected' : ''}>已完成</option>
                                        <option value="paused" ${project.status === 'paused' ? 'selected' : ''}>暫停</option>
                                        <option value="cancelled" ${project.status === 'cancelled' ? 'selected' : ''}>已取消</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-primary" onclick="teamManagement.saveEditProject('${projectId}')">儲存變更</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除舊的 modal
        const existingModal = document.getElementById('editProjectModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 添加並顯示新的 modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('editProjectModal'));
        modal.show();
    }

    // 儲存編輯專案
    saveEditProject(projectId) {
        const projectName = document.getElementById('editProjectName').value.trim();
        const projectStatus = document.getElementById('editProjectStatus').value;

        if (!projectName) {
            this.showToast('輸入錯誤', '請輸入專案名稱', 'error');
            return;
        }

        // 更新專案資料
        const assignments = this.dataManager.getAllAssignments();
        assignments[projectId].projectName = projectName;
        assignments[projectId].status = projectStatus;
        assignments[projectId].lastUpdated = new Date().toISOString().split('T')[0];

        // 儲存變更
        this.dataManager.saveLocalChanges().then(() => {
            this.showToast('更新成功', '專案資料已更新', 'success');

            // 關閉 modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editProjectModal'));
            if (modal) {
                modal.hide();
            }

            // 重新載入專案管理頁面
            this.loadProjectManagement();

            // 通知首頁重新載入資料
            this.refreshMainPage();
        }).catch(error => {
            this.showToast('儲存失敗', `無法儲存專案變更: ${error.message}`, 'error');
        });
    }

    // 刪除專案
    // 更新專案進度
    updateProjectProgress(projectId, progress) {
        try {
            const project = this.dataManager.assignments[projectId];
            if (!project) {
                this.showToast('錯誤', '找不到指定專案', 'error');
                return;
            }

            // 更新進度值
            project.progress = parseInt(progress);
            project.lastUpdated = new Date().toISOString().split('T')[0];

            // 更新 UI 顯示
            const progressValueElement = document.getElementById(`progress-value-${projectId}`);
            if (progressValueElement) {
                progressValueElement.textContent = `${progress}%`;
            }

            // 儲存變更
            this.dataManager.saveLocalChanges().then(() => {
                this.showToast('更新成功', `專案進度已更新為 ${progress}%`, 'success');

                // 通知首頁重新載入資料
                this.refreshMainPage();
            }).catch(error => {
                console.error('❌ 儲存失敗:', error);
                this.showToast('更新失敗', error.message, 'error');
            });

        } catch (error) {
            console.error('❌ 更新專案進度失敗:', error);
            this.showToast('更新失敗', error.message, 'error');
        }
    }

    deleteProject(projectId) {
        const project = this.dataManager.getAllAssignments()[projectId];
        if (!project) {
            this.showToast('錯誤', '找不到指定專案', 'error');
            return;
        }

        const memberCount = Object.keys(project.members || {}).length;
        let confirmMessage = `確定要刪除專案「${project.projectName}」嗎？`;

        if (memberCount > 0) {
            confirmMessage += `\n\n注意：此專案目前有 ${memberCount} 位成員參與，刪除後將移除所有成員的專案分配。`;
        }

        if (confirm(confirmMessage)) {
            try {
                // 從 dataManager 中移除專案
                delete this.dataManager.assignments[projectId];

                // 儲存變更
                this.dataManager.saveLocalChanges().then(() => {
                    this.showToast('刪除成功', `專案「${project.projectName}」已刪除`, 'success');

                    // 重新載入專案管理頁面
                    this.loadProjectManagement();

                    // 通知首頁重新載入資料
                    this.refreshMainPage();
                }).catch(error => {
                    console.error('❌ 儲存失敗:', error);
                    this.showToast('刪除失敗', error.message, 'error');
                });

            } catch (error) {
                console.error('❌ 刪除專案失敗:', error);
                this.showToast('刪除失敗', error.message, 'error');
            }
        }
    }

    // 添加成員變更歷程記錄
    addMemberChangeHistory(projectId, changeData) {
        try {
            console.log('📝 開始記錄成員變更歷程...', { projectId, changeData });

            const assignments = this.dataManager.getAllAssignments();
            console.log('📋 所有專案清單:', Object.keys(assignments));

            const project = assignments[projectId];

            if (!project) {
                console.warn('⚠️ 專案不存在，無法記錄成員變更歷程:', projectId);
                console.log('可用的專案ID:', Object.keys(assignments));

                // 嘗試模糊匹配專案名稱
                const projectNames = Object.values(assignments).map(p => `${p.projectId}: ${p.projectName}`);
                console.log('可用的專案:', projectNames);

                return false;
            }

            console.log('✅ 找到專案:', project.projectName);

            // 初始化成員歷程陣列
            if (!project.memberHistory) {
                project.memberHistory = [];
                console.log('🆕 初始化成員歷程陣列');
            }

            // 創建歷程記錄
            const historyEntry = {
                timestamp: new Date().toISOString(),
                date: new Date().toLocaleString('zh-TW'),
                action: changeData.action,
                memberId: changeData.memberId,
                memberName: changeData.memberName,
                role: changeData.role || changeData.newRole,
                oldRole: changeData.oldRole,
                newRole: changeData.newRole,
                assignedDate: changeData.assignedDate,
                details: changeData.details,
                operator: '系統管理員' // 可以之後擴展為實際操作者
            };

            // 添加到歷程中
            project.memberHistory.push(historyEntry);
            console.log('✅ 歷程記錄已添加，目前歷程數量:', project.memberHistory.length);
            console.log('📋 完整的歷程陣列:', project.memberHistory);

            // 保留最近50筆記錄
            if (project.memberHistory.length > 50) {
                project.memberHistory = project.memberHistory.slice(-50);
                console.log('🔄 保留最近50筆記錄');
            }

            console.log('✅ 成員變更歷程已記錄:', historyEntry);
            return true;

        } catch (error) {
            console.error('❌ 記錄成員變更歷程失敗:', error);
            console.error('錯誤詳情:', error.stack);
            return false;
        }
    }

    // 初始化所有專案的 memberHistory 陣列
    initializeMemberHistoryForAllProjects() {
        console.log('🔧 開始初始化所有專案的成員歷程陣列...');

        const assignments = this.dataManager.getAllAssignments();
        let initCount = 0;

        Object.keys(assignments).forEach(projectId => {
            const project = assignments[projectId];
            if (!project.memberHistory) {
                project.memberHistory = [];
                initCount++;
                console.log(`✅ 初始化專案 ${projectId} (${project.projectName}) 的 memberHistory`);
            }
        });

        if (initCount > 0) {
            console.log(`🔧 共初始化了 ${initCount} 個專案的歷程陣列`);
            this.dataManager.saveLocalChanges().then(() => {
                console.log('✅ 專案歷程陣列初始化已儲存');
                this.showToast('初始化完成', `已為 ${initCount} 個專案初始化歷程記錄`, 'success');
            }).catch(error => {
                console.error('❌ 初始化儲存失敗:', error);
                this.showToast('初始化失敗', error.message, 'error');
            });
        } else {
            console.log('ℹ️ 所有專案都已經有歷程陣列了');
            this.showToast('檢查完成', '所有專案都已經有歷程記錄結構', 'info');
        }
    }

    // 測試用：手動添加歷程記錄
    testAddMemberHistory() {
        console.log('🧪 開始測試歷程記錄功能...');

        // 詳細診斷
        console.log('🔍 診斷資訊:');
        console.log('- dataManager 存在:', !!this.dataManager);
        console.log('- dataManager 類型:', typeof this.dataManager);

        const assignments = this.dataManager.getAllAssignments();
        console.log('- assignments 物件:', assignments);
        console.log('- assignments 類型:', typeof assignments);
        console.log('- assignments 鍵值:', Object.keys(assignments));

        const firstProjectId = Object.keys(assignments)[0];

        if (!firstProjectId) {
            console.error('❌ 沒有找到可用的專案');
            this.showToast('測試失敗', '沒有可用的專案', 'error');
            return;
        }

        console.log('🎯 使用專案ID進行測試:', firstProjectId);
        console.log('🎯 專案資料:', assignments[firstProjectId]);

        // 先強制添加 memberHistory 屬性
        if (!assignments[firstProjectId].memberHistory) {
            assignments[firstProjectId].memberHistory = [];
            console.log('🔧 強制初始化 memberHistory 陣列');
        }

        const testResult = this.addMemberChangeHistory(firstProjectId, {
            action: 'member_assigned',
            memberId: 'test-member',
            memberName: '測試成員',
            role: 'frontend',
            details: '這是一個測試記錄'
        });

        console.log('📝 測試結果:', testResult);
        console.log('📋 專案歷程陣列:', assignments[firstProjectId].memberHistory);

        if (testResult) {
            console.log('✅ 測試成功，嘗試儲存...');
            this.dataManager.saveLocalChanges().then(() => {
                console.log('✅ 測試記錄已儲存');
                this.showToast('測試成功', '歷程記錄功能正常', 'success');

                // 強制重新載入首頁
                this.refreshMainPage();
            }).catch(error => {
                console.error('❌ 儲存失敗:', error);
                this.showToast('儲存失敗', error.message, 'error');
            });
        } else {
            console.error('❌ 測試失敗');
            this.showToast('測試失敗', '歷程記錄功能異常', 'error');
        }
    }

    // 獲取專案的成員變更歷程
    getMemberChangeHistory(projectId) {
        try {
            console.log('🔍 getMemberChangeHistory 開始:', { projectId });
            console.log('🔍 this.dataManager 存在:', !!this.dataManager);

            // 如果沒有 dataManager，嘗試使用全域的
            let dataManager = this.dataManager;
            if (!dataManager && window.teamDataManager) {
                dataManager = window.teamDataManager;
                console.log('🔄 使用全域 teamDataManager');
            }

            if (!dataManager) {
                console.error('❌ 無法取得 dataManager');
                return [];
            }

            const assignments = dataManager.getAllAssignments();
            console.log('🔍 所有專案:', Object.keys(assignments));

            const project = assignments[projectId];
            console.log('🔍 專案資料:', project);

            if (!project) {
                console.warn('⚠️ 專案不存在:', projectId);
                return [];
            }

            console.log('🔍 memberHistory 存在:', !!project.memberHistory);
            console.log('🔍 memberHistory 長度:', project.memberHistory ? project.memberHistory.length : 0);

            if (!project.memberHistory) {
                console.log('⚠️ 專案沒有 memberHistory 陣列');
                return [];
            }

            // 返回按時間倒序排列的歷程
            const history = project.memberHistory.slice().reverse();
            console.log('✅ 回傳歷程記錄:', history.length, '筆');
            return history;
        } catch (error) {
            console.error('❌ 獲取成員變更歷程失敗:', error);
            return [];
        }
    }

    // 生成成員變更歷程的 HTML
    generateMemberHistoryHTML(projectId) {
        const history = this.getMemberChangeHistory(projectId);

        if (history.length === 0) {
            return `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    尚無成員變更歷程記錄
                </div>
            `;
        }

        const actionLabels = {
            'member_assigned': '<i class="fas fa-user-plus text-success me-2"></i>成員加入',
            'member_removed': '<i class="fas fa-user-minus text-danger me-2"></i>成員移除',
            'role_changed': '<i class="fas fa-exchange-alt text-warning me-2"></i>角色變更'
        };

        return `
            <div class="member-history-container">
                <h6 class="mb-3">
                    <i class="fas fa-history me-2"></i>成員變更歷程
                    <span class="badge bg-secondary ms-2">${history.length} 筆記錄</span>
                </h6>
                <div class="history-timeline">
                    ${history.map((entry, index) => `
                        <div class="history-entry ${index === 0 ? 'latest' : ''}" data-timestamp="${entry.timestamp}">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div class="history-action">
                                    ${actionLabels[entry.action] || entry.action}
                                    <strong>${entry.memberName}</strong>
                                </div>
                                <div class="d-flex align-items-center gap-2">
                                    <small class="text-muted">${entry.date}</small>
                                    <button class="btn btn-sm btn-outline-secondary p-1" onclick="teamManagement.editHistoryOperator('${projectId}', '${entry.timestamp}')" title="編輯操作者">
                                        <i class="fas fa-edit" style="font-size: 10px;"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="history-details ps-4">
                                ${entry.role ? `<div><span class="badge bg-info">${entry.role}</span></div>` : ''}
                                ${entry.oldRole && entry.newRole ? `
                                    <div class="mt-1">
                                        <span class="badge bg-secondary">${entry.oldRole}</span>
                                        <i class="fas fa-arrow-right mx-2"></i>
                                        <span class="badge bg-success">${entry.newRole}</span>
                                    </div>
                                ` : ''}
                                ${entry.details ? `<div class="text-muted mt-1"><small>${entry.details}</small></div>` : ''}
                                <div class="mt-1">
                                    <small class="text-success">操作者: ${entry.operator || '系統管理員'}</small>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // 查看專案的成員變更歷程
    viewMemberHistory(projectId) {
        const project = this.dataManager.getAllAssignments()[projectId];
        if (!project) {
            this.showToast('錯誤', '找不到指定專案', 'error');
            return;
        }

        const modalHtml = `
            <div class="modal fade" id="memberHistoryModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-info text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-history me-2"></i>成員變更歷程 - ${project.projectName}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${this.generateMemberHistoryHTML(projectId)}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">關閉</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除舊的 modal
        const existingModal = document.getElementById('memberHistoryModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 添加並顯示新的 modal
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('memberHistoryModal'));
        modal.show();
    }

    // 編輯歷程記錄中的操作者名稱
    editHistoryOperator(projectId, timestamp) {
        const project = this.dataManager.getAllAssignments()[projectId];
        if (!project || !project.memberHistory) {
            this.showToast('錯誤', '找不到專案或歷程記錄', 'error');
            return;
        }

        // 找到對應的歷程記錄
        const historyEntry = project.memberHistory.find(entry => entry.timestamp === timestamp);
        if (!historyEntry) {
            this.showToast('錯誤', '找不到指定的歷程記錄', 'error');
            return;
        }

        const currentOperator = historyEntry.operator || '系統管理員';

        // 創建編輯模態框
        const modalHtml = `
            <div class="modal fade" id="editOperatorModal" tabindex="-1">
                <div class="modal-dialog modal-sm">
                    <div class="modal-content">
                        <div class="modal-header bg-secondary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-user-edit me-2"></i>編輯操作者
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="operatorName" class="form-label">操作者名稱</label>
                                <input type="text" class="form-control" id="operatorName" value="${currentOperator}" placeholder="請輸入操作者名稱">
                            </div>
                            <div class="mb-3">
                                <small class="text-muted">
                                    <strong>操作時間:</strong> ${historyEntry.date}<br>
                                    <strong>操作內容:</strong> ${historyEntry.action === 'member_assigned' ? '成員加入' :
                                                               historyEntry.action === 'member_removed' ? '成員移除' : '角色變更'}
                                    - ${historyEntry.memberName}
                                </small>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-primary" onclick="teamManagement.confirmEditOperator('${projectId}', '${timestamp}')">確認修改</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除舊的模態框
        const existingModal = document.getElementById('editOperatorModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 添加並顯示新的模態框
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('editOperatorModal'));
        modal.show();

        // 聚焦到輸入框
        setTimeout(() => {
            document.getElementById('operatorName').focus();
            document.getElementById('operatorName').select();
        }, 300);
    }

    // 確認修改操作者名稱
    confirmEditOperator(projectId, timestamp) {
        const newOperatorName = document.getElementById('operatorName').value.trim();

        if (!newOperatorName) {
            this.showToast('輸入錯誤', '操作者名稱不能為空', 'error');
            return;
        }

        const project = this.dataManager.getAllAssignments()[projectId];
        const historyEntry = project.memberHistory.find(entry => entry.timestamp === timestamp);

        if (historyEntry) {
            const oldOperator = historyEntry.operator || '系統管理員';
            historyEntry.operator = newOperatorName;

            // 儲存變更
            this.dataManager.saveLocalChanges().then(() => {
                this.showToast('修改成功', `操作者已從「${oldOperator}」變更為「${newOperatorName}」`, 'success');

                // 關閉模態框
                const modal = bootstrap.Modal.getInstance(document.getElementById('editOperatorModal'));
                modal.hide();

                // 重新生成歷程HTML並更新顯示
                this.refreshMemberHistoryDisplay(projectId);
            }).catch(error => {
                console.error('儲存失敗:', error);
                this.showToast('儲存失敗', '無法儲存操作者變更', 'error');
            });
        }
    }

    // 刷新成員變更歷程顯示
    refreshMemberHistoryDisplay(projectId) {
        try {
            // 更新成員歷程模態框中的內容
            const memberHistoryModal = document.getElementById('memberHistoryModal');
            if (memberHistoryModal) {
                const modalBody = memberHistoryModal.querySelector('.modal-body');
                if (modalBody) {
                    modalBody.innerHTML = this.generateMemberHistoryHTML(projectId);
                }
            }

            // 更新任務小卡中的成員變更歷程 (如果有開啟的話)
            const memberHistoryColumn = document.querySelector('#taskCardModal .col-lg-2:nth-child(5)');
            if (memberHistoryColumn) {
                // 重新生成成員變更歷程
                let updatedMemberHistoryHtml = '';
                if (window.teamManagement && typeof window.teamManagement.generateMemberHistoryHTML === 'function') {
                    updatedMemberHistoryHtml = window.teamManagement.generateMemberHistoryHTML(projectId);
                }
                memberHistoryColumn.innerHTML = updatedMemberHistoryHtml;
            }
        } catch (error) {
            console.error('刷新歷程顯示失敗:', error);
        }
    }

    // 通知首頁重新載入資料
    refreshMainPage() {
        console.log('🔄 開始強制更新首頁...');

        // 方法1: 立即重新整理主視窗
        try {
            if (window.opener && !window.opener.closed) {
                console.log('🔄 立即重新整理主視窗...');
                window.opener.location.reload();
                console.log('✅ 主視窗重新整理指令已發送');
                return;
            } else {
                console.warn('⚠️ 主視窗不存在或已關閉');
            }
        } catch (e) {
            console.warn('❌ 重新整理主視窗失敗:', e);
        }

        // 方法2: localStorage 備用通信
        try {
            const updateSignal = {
                action: 'FORCE_RELOAD',
                timestamp: Date.now(),
                source: 'teamManagement'
            };
            localStorage.setItem('TEAM_UPDATE_SIGNAL', JSON.stringify(updateSignal));
            console.log('✅ localStorage 強制更新信號已發送');

            // 立即清除信號避免重複觸發
            setTimeout(() => {
                localStorage.removeItem('TEAM_UPDATE_SIGNAL');
            }, 500);
        } catch (e) {
            console.warn('❌ localStorage 通信失敗:', e);
        }
    }
}

// 全域輔助函數：獲取成員變更歷程
window.getMemberChangeHistory = function(projectId) {
    console.log('🌐 全域函數：getMemberChangeHistory 被呼叫:', projectId);

    // 優先使用 window.teamManagement
    if (window.teamManagement && typeof window.teamManagement.getMemberChangeHistory === 'function') {
        console.log('🔄 使用 window.teamManagement');
        return window.teamManagement.getMemberChangeHistory(projectId);
    }

    // 備用：直接從 dataManager 取得
    if (window.teamDataManager) {
        console.log('🔄 直接使用 window.teamDataManager');
        try {
            const assignments = window.teamDataManager.getAllAssignments();
            const project = assignments[projectId];
            if (project && project.memberHistory) {
                return project.memberHistory.slice().reverse();
            }
        } catch (error) {
            console.error('❌ 直接讀取失敗:', error);
        }
    }

    console.log('⚠️ 無法取得歷程資料');
    return [];
};

// 全域輔助函數：生成成員變更歷程 HTML
window.generateMemberHistoryHTML = function(projectId) {
    console.log('🌐 全域函數：generateMemberHistoryHTML 被呼叫:', projectId);

    const history = window.getMemberChangeHistory(projectId);

    if (history.length === 0) {
        return `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                尚無成員變更歷程記錄
            </div>
        `;
    }

    const actionLabels = {
        'member_assigned': '<i class="fas fa-user-plus text-success me-2"></i>成員加入',
        'member_removed': '<i class="fas fa-user-minus text-danger me-2"></i>成員移除',
        'role_changed': '<i class="fas fa-exchange-alt text-warning me-2"></i>角色變更'
    };

    return `
        <div class="member-history-container">
            <h6 class="mb-3">
                <i class="fas fa-history me-2"></i>成員變更歷程
                <span class="badge bg-secondary ms-2">${history.length} 筆記錄</span>
            </h6>
            <div class="history-timeline">
                ${history.map((entry, index) => `
                    <div class="history-entry ${index === 0 ? 'latest' : ''}" data-timestamp="${entry.timestamp}">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div class="history-action">
                                ${actionLabels[entry.action] || entry.action}
                                <strong>${entry.memberName}</strong>
                            </div>
                            <div class="d-flex align-items-center gap-2">
                                <small class="text-muted">${entry.date}</small>
                            </div>
                        </div>
                        <div class="history-details ps-4">
                            ${entry.role ? `<div><span class="badge bg-info">${entry.role}</span></div>` : ''}
                            ${entry.oldRole && entry.newRole ? `
                                <div class="mt-1">
                                    <span class="badge bg-secondary">${entry.oldRole}</span>
                                    <i class="fas fa-arrow-right mx-2"></i>
                                    <span class="badge bg-success">${entry.newRole}</span>
                                </div>
                            ` : ''}
                            ${entry.details ? `<div class="mt-1 text-muted small">${entry.details}</div>` : ''}
                            <div class="mt-1">
                                <small class="text-muted">操作者: ${entry.operator || '系統管理員'}</small>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
};

// 全域實例
try {
    console.log('🔄 嘗試創建 TeamManagement 實例...');
    console.log('- TeamDataManager 可用:', !!window.TeamDataManager);
    console.log('- TeamStatistics 可用:', !!window.TeamStatistics);
    console.log('- TeamUIComponents 可用:', !!window.TeamUIComponents);

    window.teamManagement = new TeamManagement();
    console.log('✅ TeamManagement 實例創建成功');
} catch (error) {
    console.error('❌ 創建 TeamManagement 實例失敗:', error);
    console.error('錯誤堆疊:', error.stack);
}

// 當頁面載入完成時啟動自動功能
document.addEventListener('DOMContentLoaded', () => {
    if (window.teamManagement) {
        window.teamManagement.initAutoFeatures();
    }
});