/**
 * 簡化版 Dashboard - 直接使用 JSON 資料
 */

class MarkdownProjectDashboard {
    constructor() {
        this.data = { projects: [] };
        this.init();
    }

    async init() {
        console.log('🚀 開始載入...');

        try {
            // 直接載入資料，不等待
            setTimeout(async () => {
                console.log('⏰ 開始載入專案資料...');

                // 直接載入 JSON 檔案
                try {
                    const response = await fetch('config/project-assignments.json?v=' + Date.now());
                    if (response.ok) {
                        const data = await response.json();
                        console.log('✅ 專案資料載入成功:', data);

                        // 直接使用載入的資料
                        this.data.projects = Object.values(data.assignments).map(project => ({
                            id: project.projectId,
                            name: project.projectName,
                            status: project.status || 'active',
                            progress: project.progress || 0,
                            memberCount: Object.keys(project.members || {}).length,
                            members: project.members || {},
                            memberDetails: Object.values(project.members || {})
                        }));

                        console.log('📊 處理後的專案:', this.data.projects);

                        // 渲染介面
                        this.render();
                    }
                } catch (error) {
                    console.error('❌ 載入失敗:', error);
                    this.showErrorContent();
                }
            }, 500); // 延遲 500ms 確保 DOM 準備好

            console.log('[OK] 初始化完成');
        } catch (error) {
            console.error('[ERROR] Dashboard 初始化失敗:', error);
            this.showBasicContent();

            // 顯示錯誤訊息
            const projectsList = document.getElementById('projectsList');
            if (projectsList) {
                projectsList.innerHTML = `
                    <div class="alert alert-warning">
                        <h5>系統載入中...</h5>
                        <p>請稍候，系統正在初始化資料。如果持續顯示此訊息，請重新整理頁面。</p>
                        <button class="btn btn-outline-primary" onclick="location.reload()">
                            <i class="fas fa-sync-alt me-2"></i>重新載入
                        </button>
                    </div>
                `;
                projectsList.style.display = 'block';
            }
        }
    }

    async waitForTeamDataManager() {
        let attempts = 0;
        const maxAttempts = 100; // 增加到 10 秒

        while (attempts < maxAttempts) {
            if (window.teamDataManager) {
                // 檢查是否已初始化
                if (window.teamDataManager.isReady()) {
                    console.log('✅ teamDataManager 已準備就緒');
                    return;
                }

                // 如果存在但未初始化，檢查是否正在初始化
                if (window.teamDataManager.isInitialized === false && attempts < 20) {
                    console.log(`🔄 等待 teamDataManager 初始化... (嘗試 ${attempts + 1})`);
                } else if (attempts === 20) {
                    console.log('⚠️ teamDataManager 似乎初始化失敗，嘗試手動初始化...');
                    try {
                        await window.teamDataManager.init();
                        if (window.teamDataManager.isReady()) {
                            console.log('✅ 手動初始化成功');
                            return;
                        }
                    } catch (error) {
                        console.error('❌ 手動初始化失敗:', error);
                    }
                }
            } else {
                console.log(`🔄 等待 teamDataManager 創建... (嘗試 ${attempts + 1})`);
            }

            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        console.warn('⚠️ teamDataManager 初始化超時，將繼續以降級模式運行');

        // 創建一個最小的 teamDataManager 來避免錯誤
        if (!window.teamDataManager) {
            console.log('🔧 創建緊急備用 teamDataManager...');
            window.teamDataManager = {
                isInitialized: false,
                members: {},
                roles: {},
                assignments: {},
                isReady: () => false,
                getAllMembers: () => ({}),
                getAllRoles: () => ({}),
                getAllAssignments: () => ({}),
                saveLocalChanges: async () => console.warn('teamDataManager 未初始化，無法儲存')
            };
        }
    }

    async waitForData() {
        // 簡化版等待，最多等 3 秒
        let attempts = 0;
        while (attempts < 30) {
            if (window.teamDataManager && window.teamDataManager.isReady && window.teamDataManager.isReady()) {
                console.log('✅ teamDataManager 已準備');
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        console.warn('⚠️ teamDataManager 等待超時，繼續載入');
    }

    showBasicContent() {
        const summaryCards = document.getElementById('summaryCards');
        const projectsList = document.getElementById('projectsList');

        if (summaryCards) {
            summaryCards.innerHTML = `
                <div class="col-12">
                    <h3>團隊專案總覽</h3>
                    <p>資料載入中，請稍候...</p>
                </div>
            `;
        }

        if (projectsList) {
            projectsList.innerHTML = `
                <div class="col-12">
                    <h4>專案列表</h4>
                    <p>正在嘗試載入專案資料...</p>
                </div>
            `;
        }
    }

    showErrorContent() {
        const summaryCards = document.getElementById('summaryCards');
        const projectsList = document.getElementById('projectsList');

        if (summaryCards) {
            summaryCards.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger">
                        <h5>載入失敗</h5>
                        <p>無法載入專案資料，請檢查檔案是否存在或重新整理頁面。</p>
                    </div>
                </div>
            `;
        }

        if (projectsList) {
            projectsList.innerHTML = `
                <div class="col-12">
                    <button class="btn btn-primary" onclick="location.reload()">重新載入</button>
                </div>
            `;
        }
    }

    // 背景載入任務範本（不阻塞主流程）
    loadTaskTemplatesInBackground() {
        if (!window.taskTemplatesData) {
            console.log('📋 在背景載入任務範本...');
            fetch('config/task-templates.json?v=' + Date.now())
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                })
                .then(data => {
                    window.taskTemplatesData = data;
                    console.log('✅ 背景任務範本載入完成:', Object.keys(data.taskTemplates || {}));
                })
                .catch(error => {
                    console.warn('⚠️ 背景載入任務範本失敗:', error.message);
                    window.taskTemplatesData = { taskTemplates: {} };
                });
        }
    }

    async loadTaskTemplates() {
        try {
            console.log('📋 開始載入任務範本...');
            if (!window.taskTemplatesData) {
                console.log('📋 正在從伺服器載入 task-templates.json...');
                const response = await fetch('config/task-templates.json?v=' + Date.now());
                console.log('📋 任務範本請求回應:', response.status, response.statusText);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                window.taskTemplatesData = await response.json();
                console.log('✅ 任務範本載入完成:', Object.keys(window.taskTemplatesData.taskTemplates || {}));
                console.log('✅ 載入的範本:', window.taskTemplatesData);
            } else {
                console.log('📋 任務範本已存在，跳過載入');
            }
        } catch (error) {
            console.error('❌ 載入任務範本失敗:', error);
            console.error('❌ 錯誤詳情:', error.stack);
            // 提供空的預設結構，不阻塞載入
            window.taskTemplatesData = { taskTemplates: {} };
            console.log('⚠️ 使用空的任務範本結構繼續載入');
        }
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

            // 取得成員詳細資訊
            const memberDetails = Object.values(project.members || {}).map(member => {
                const memberInfo = window.teamDataManager.getAllMembers()[member.memberId];
                const roleInfo = window.teamDataManager.getAllRoles()[member.role];

                // 確保每個成員都有任務卡片資料
                if (!member.taskCard) {
                    const memberName = memberInfo ? memberInfo.name : member.memberId;
                    const roleInfo = window.teamDataManager.getAllRoles()[member.role];
                    const roleName = roleInfo ? roleInfo.name : member.role;
                    const projectName = project.projectName;
                    const branchName = `${memberName}-${member.role}`;

                    // 取得對應角色的任務範本
                    let templateContent = '';
                    try {
                        // 確保任務範本已載入
                        if (window.taskTemplatesData && window.taskTemplatesData.taskTemplates && window.taskTemplatesData.taskTemplates[member.role]) {
                            templateContent = window.taskTemplatesData.taskTemplates[member.role].content || '';
                        }
                    } catch (error) {
                        console.error('❌ 載入任務範本失敗:', error);
                    }

                    member.taskCard = {
                        branchName: memberName,
                        content: `你現在的角色是「${projectName}」的「${roleName}」，代號是「${memberName}」，開發的branch 是「${memberName}」專案的「${projectName}」，若無則create，請依循下列的任務指引「任務範本」 進行任務。

${templateContent}`,
                        lastUpdated: new Date().toISOString()
                    };
                }

                return {
                    id: member.memberId,
                    name: memberInfo ? memberInfo.name : member.memberId,
                    role: member.role,
                    roleName: roleInfo ? roleInfo.name : member.role,
                    roleColor: roleInfo ? roleInfo.color : '#6c757d',
                    roleIcon: roleInfo ? roleInfo.icon : '[角色]',
                    taskCard: member.taskCard
                };
            });

            return {
                id: project.projectId,
                name: project.projectName,
                status: project.status,
                progress: progress,
                memberCount: memberCount,
                members: project.members || {},
                memberDetails: memberDetails,
                notes: project.notes || [],
                memberHistory: project.memberHistory || []
            };
        });

        console.log(`✅ 載入了 ${this.data.projects.length} 個專案`);
    }

    render() {
        console.log('🎨 開始渲染 Dashboard...');

        // 強制隱藏載入狀態 - 在渲染前就先隱藏
        // this.forceHideLoadingSpinner(); // 方法不存在，移除

        this.renderSummaryCards();
        this.renderProjectsList();

        console.log('✅ Dashboard 渲染完成');
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
                                <i class="fas fa-rocket"></i>
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
                    <div class="card h-100 project-card" data-project-id="${project.id}">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6 class="mb-0">
                                <i class="fas fa-project-diagram me-2"></i>
                                ${project.name.split(' - ')[0]}
                            </h6>
                            <div class="d-flex align-items-center">
                                <span class="badge bg-primary me-2 progress-badge"
                                      onclick="editProgress('${project.id}', ${project.progress})"
                                      style="cursor: pointer;" title="點擊編輯進度">
                                    ${project.progress}%
                                </span>
                                <button class="btn btn-sm btn-outline-secondary"
                                        onclick="addProjectNote('${project.id}')"
                                        title="新增備註">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <!-- 可編輯進度條 -->
                            <div class="progress mb-3" style="height: 8px;"
                                 onclick="editProgress('${project.id}', ${project.progress})"
                                 style="cursor: pointer;" title="點擊編輯進度">
                                <div class="progress-bar" style="width: ${project.progress}%"></div>
                            </div>

                            <p class="text-muted small mb-2">狀態: ${project.status}</p>
                            <p class="text-muted small mb-2">團隊成員: ${project.memberCount} 人</p>

                            <!-- 成員列表 - 成員與角色分離顯示 -->
                            ${project.memberDetails.length > 0 ? `
                                <div class="small mb-3">
                                    ${project.memberDetails.map(member => `
                                        <div class="d-flex justify-content-between align-items-center mb-2 member-item"
                                             onclick="showMemberActions('${project.id}', '${member.id}')"
                                             style="cursor: pointer; padding: 6px 8px; border-radius: 6px; border: 1px solid #e9ecef;"
                                             onmouseover="this.style.backgroundColor='#f8f9fa'; this.style.borderColor='#dee2e6'"
                                             onmouseout="this.style.backgroundColor='transparent'; this.style.borderColor='#e9ecef'"
                                             title="點擊選擇操作">
                                            <div class="d-flex align-items-center">
                                                <span class="fw-bold me-2">${member.name}</span>
                                                <small class="text-muted">(${member.id})</small>
                                            </div>
                                            <div class="d-flex align-items-center">
                                                <span class="badge text-white fw-bold d-flex align-items-center"
                                                      style="background-color: ${member.roleColor}; font-size: 0.75em; padding: 4px 8px; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                                                    <span class="me-1" style="font-size: 0.9em;">${member.roleIcon}</span>
                                                    ${member.roleName}
                                                </span>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div class="text-center py-2">
                                    <button class="btn btn-sm btn-outline-primary"
                                            onclick="addProjectMember('${project.id}')">
                                        <i class="fas fa-plus me-1"></i>新增成員
                                    </button>
                                </div>
                            `}

                            <!-- 備註摘要 -->
                            ${project.notes.length > 0 ? `
                                <div class="mt-2">
                                    <small class="text-muted">
                                        <i class="fas fa-sticky-note me-1"></i>
                                        最新備註: ${project.notes[project.notes.length - 1].content.substring(0, 30)}...
                                        <button class="btn btn-link btn-sm p-0 ms-1"
                                                onclick="viewProjectNotes('${project.id}')"
                                                title="查看所有備註">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </small>
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

    // 更新專案進度並同步到 Google Drive
    async updateProjectProgress(projectId, newProgress) {
        try {
            const assignment = window.teamDataManager.getAllAssignments()[projectId];
            if (assignment) {
                assignment.progress = parseInt(newProgress);
                assignment.lastUpdated = new Date().toISOString();

                // 同步到 Google Drive
                await window.teamDataManager.saveLocalChanges();

                // 重新載入顯示
                this.loadProjectsFromJSON();
                this.render();

                console.log(`✅ 專案 ${projectId} 進度已更新為 ${newProgress}%`);
                return true;
            }
        } catch (error) {
            console.error('❌ 更新進度失敗:', error);
            return false;
        }
    }

    // 新增專案備註並同步到 Google Drive
    async addProjectNote(projectId, noteContent) {
        try {
            const assignment = window.teamDataManager.getAllAssignments()[projectId];
            if (assignment) {
                if (!assignment.notes) assignment.notes = [];

                const note = {
                    id: `note_${Date.now()}`,
                    content: noteContent,
                    timestamp: new Date().toISOString(),
                    author: 'user'
                };

                assignment.notes.push(note);
                assignment.lastUpdated = new Date().toISOString();

                // 同步到 Google Drive
                await window.teamDataManager.saveLocalChanges();

                // 重新載入顯示
                this.loadProjectsFromJSON();
                this.render();

                console.log(`✅ 專案 ${projectId} 已新增備註`);
                return true;
            }
        } catch (error) {
            console.error('❌ 新增備註失敗:', error);
            return false;
        }
    }

    // 記錄成員變更歷程
    logMemberChange(projectId, memberId, oldRole, newRole) {
        try {
            const assignment = window.teamDataManager.getAllAssignments()[projectId];
            if (assignment) {
                if (!assignment.memberHistory) assignment.memberHistory = [];

                const historyEntry = {
                    timestamp: new Date().toISOString(),
                    action: 'member_role_changed',
                    details: {
                        memberId: memberId,
                        oldRole: oldRole,
                        newRole: newRole
                    }
                };

                assignment.memberHistory.push(historyEntry);
                assignment.lastUpdated = new Date().toISOString();
            }
        } catch (error) {
            console.error('❌ 記錄成員變更失敗:', error);
        }
    }
}

// 全域編輯函數
window.editProgress = function(projectId, currentProgress) {
    const newProgress = prompt(`請輸入新的進度 (0-100):`, currentProgress);
    if (newProgress !== null && !isNaN(newProgress)) {
        const progress = Math.max(0, Math.min(100, parseInt(newProgress)));
        window.markdownDashboard.updateProjectProgress(projectId, progress);
    }
};

window.addProjectNote = function(projectId) {
    const noteContent = prompt('請輸入備註內容:');
    if (noteContent && noteContent.trim()) {
        window.markdownDashboard.addProjectNote(projectId, noteContent.trim());
    }
};

window.editProjectMember = async function(projectId, memberId) {
    try {
        const assignment = window.teamDataManager.getAllAssignments()[projectId];
        const allMembers = window.teamDataManager.getAllMembers();

        if (!assignment || !allMembers) {
            alert('無法載入專案或成員資料');
            return;
        }

        // 取得當前成員資訊
        const currentMember = assignment.members[memberId];
        if (!currentMember) {
            alert('找不到成員資訊');
            return;
        }

        const memberInfo = allMembers[memberId];
        const memberName = memberInfo ? memberInfo.name : memberId;

        // 取得任務小卡資料，如果沒有則生成預設格式（包含任務範本）
        const allRoles = window.teamDataManager.getAllRoles();
        const roleInfo = allRoles[currentMember.role];
        const roleName = roleInfo ? roleInfo.name : currentMember.role;

        // 取得對應角色的任務範本
        let templateContent = '';
        try {
            // 如果 taskTemplatesData 還沒載入，嘗試載入
            if (!window.taskTemplatesData) {
                const response = await fetch('config/task-templates.json?v=' + Date.now());
                if (response.ok) {
                    window.taskTemplatesData = await response.json();
                }
            }

            if (window.taskTemplatesData && window.taskTemplatesData.taskTemplates && window.taskTemplatesData.taskTemplates[currentMember.role]) {
                templateContent = window.taskTemplatesData.taskTemplates[currentMember.role].content || '';
                console.log('✅ 成功載入任務範本:', currentMember.role, templateContent.substring(0, 100) + '...');
            } else {
                console.warn('⚠️ 找不到角色的任務範本:', currentMember.role);
            }
        } catch (error) {
            console.error('❌ 載入任務範本失敗:', error);
        }

        let taskCard = currentMember.taskCard || {
            branchName: memberName,
            content: `你現在的角色是「${assignment.projectName}」的「${roleName}」，代號是「${memberName}」，開發的branch 是「${memberName}」專案的「${assignment.projectName}」，若無則create，請依循下列的任務指引「任務範本」 進行任務。

${templateContent}`
        };

        // 建立任務小卡編輯模態框
        const taskCardModal = `
            <div class="modal fade" id="taskCardModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">任務小卡編輯 - ${memberName}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">專案名稱</label>
                                <input type="text" class="form-control" value="${assignment.projectName}" readonly>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">成員姓名</label>
                                <input type="text" class="form-control" value="${memberName} (${memberId})" readonly>
                            </div>
                            <div class="mb-3">
                                <label for="branchName" class="form-label">分支名稱</label>
                                <input type="text" class="form-control" id="branchName" value="${taskCard.branchName}" placeholder="輸入分支名稱...">
                            </div>
                            <div class="mb-3">
                                <label for="taskContent" class="form-label">任務小卡內容</label>
                                <textarea class="form-control" id="taskContent" rows="6" style="font-family: monospace; font-size: 14px;">${taskCard.content}</textarea>
                                <div class="form-text">格式：你現在的角色是「角色」的「姓名」，代號是「ID」，開發的branch 是「分支」專案的「專案名」，若無則create，請依循下列的任務指引「任務範本」 進行任務。</div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline-secondary" onclick="copyTaskCard('${projectId}', '${memberId}')">
                                <i class="fas fa-copy me-2"></i>複製
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-primary" onclick="saveTaskCard('${projectId}', '${memberId}')">儲存</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除舊的模態框
        const existingModal = document.getElementById('taskCardModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 添加新的模態框
        document.body.insertAdjacentHTML('beforeend', taskCardModal);
        const modal = new bootstrap.Modal(document.getElementById('taskCardModal'));
        modal.show();

    } catch (error) {
        console.error('❌ 開啟任務小卡編輯介面失敗:', error);
        alert('開啟任務小卡編輯介面失敗');
    }
};

// 儲存任務小卡
window.saveTaskCard = async function(projectId, memberId) {
    try {
        const branchName = document.getElementById('branchName').value.trim();
        const taskContent = document.getElementById('taskContent').value.trim();

        if (!branchName || !taskContent) {
            alert('請填寫分支名稱和任務小卡內容');
            return;
        }

        // 更新任務小卡資料
        const assignment = window.teamDataManager.getAllAssignments()[projectId];
        if (assignment && assignment.members[memberId]) {
            // 儲存任務小卡資料
            assignment.members[memberId].taskCard = {
                branchName: branchName,
                content: taskContent,
                lastUpdated: new Date().toISOString()
            };

            // 儲存到資料管理器
            await window.teamDataManager.saveLocalChanges();

            // 關閉模態框
            const modal = bootstrap.Modal.getInstance(document.getElementById('taskCardModal'));
            if (modal) {
                modal.hide();
            }

            alert('任務小卡已儲存');
            console.log(`✅ 任務小卡已儲存: ${projectId} - ${memberId}`);
        }
    } catch (error) {
        console.error('❌ 儲存任務小卡失敗:', error);
        alert('儲存任務小卡失敗: ' + error.message);
    }
};

// 複製任務小卡
window.copyTaskCard = function(projectId, memberId) {
    try {
        const taskContent = document.getElementById('taskContent').value.trim();

        if (!taskContent) {
            alert('沒有內容可複製');
            return;
        }

        const taskCardText = taskContent;

        // 複製到剪貼板
        navigator.clipboard.writeText(taskCardText).then(() => {
            // 顯示成功提示
            const copyBtn = document.querySelector(`button[onclick="copyTaskCard('${projectId}', '${memberId}')"]`);
            if (copyBtn) {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check me-2"></i>已複製';
                copyBtn.classList.remove('btn-outline-secondary');
                copyBtn.classList.add('btn-success');

                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.classList.remove('btn-success');
                    copyBtn.classList.add('btn-outline-secondary');
                }, 2000);
            }

            console.log('✅ 任務小卡已複製到剪貼板');
        }).catch(err => {
            console.error('❌ 複製失敗:', err);
            alert('複製失敗，請手動複製內容');
        });
    } catch (error) {
        console.error('❌ 複製任務小卡失敗:', error);
        alert('複製任務小卡失敗');
    }
};

// 顯示成員操作選項
window.showMemberActions = function(projectId, memberId) {
    try {
        const assignment = window.teamDataManager.getAllAssignments()[projectId];
        const allMembers = window.teamDataManager.getAllMembers();

        if (!assignment || !allMembers) {
            alert('無法載入專案或成員資料');
            return;
        }

        const currentMember = assignment.members[memberId];
        if (!currentMember) {
            alert('找不到成員資訊');
            return;
        }

        const memberInfo = allMembers[memberId];
        const memberName = memberInfo ? memberInfo.name : memberId;

        // 建立操作選項模態框
        const actionsModal = `
            <div class="modal fade" id="memberActionsModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">成員操作 - ${memberName}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <strong>專案：</strong>${assignment.projectName}<br>
                                <strong>成員：</strong>${memberName} (${memberId})<br>
                                <strong>角色：</strong>${currentMember.role}
                            </div>
                            <div class="d-grid gap-2">
                                <button type="button" class="btn btn-primary" onclick="editTaskCard('${projectId}', '${memberId}')">
                                    <i class="fas fa-edit me-2"></i>編輯任務小卡
                                </button>
                                <button type="button" class="btn btn-warning" onclick="changeMember('${projectId}', '${memberId}')">
                                    <i class="fas fa-user-edit me-2"></i>更換成員
                                </button>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除舊的模態框
        const existingModal = document.getElementById('memberActionsModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 添加新的模態框
        document.body.insertAdjacentHTML('beforeend', actionsModal);
        const modal = new bootstrap.Modal(document.getElementById('memberActionsModal'));
        modal.show();

    } catch (error) {
        console.error('❌ 開啟成員操作選項失敗:', error);
        alert('開啟成員操作選項失敗');
    }
};

// 編輯任務小卡（重命名現有函數）
window.editTaskCard = window.editProjectMember;

// 更換成員功能（恢復原本的功能）
window.changeMember = function(projectId, memberId) {
    try {
        const assignment = window.teamDataManager.getAllAssignments()[projectId];
        const allMembers = window.teamDataManager.getAllMembers();
        const allRoles = window.teamDataManager.getAllRoles();

        if (!assignment || !allMembers) {
            alert('無法載入專案或成員資料');
            return;
        }

        // 取得當前成員資訊
        const currentMember = assignment.members[memberId];
        if (!currentMember) {
            alert('找不到成員資訊');
            return;
        }

        // 建立成員選擇選項
        let memberOptions = '';
        Object.values(allMembers).forEach(member => {
            const selected = member.id === memberId ? 'selected' : '';
            memberOptions += `<option value="${member.id}" ${selected}>${member.name} (${member.id})</option>`;
        });

        // 建立角色選擇選項
        let roleOptions = '';
        Object.keys(allRoles).forEach(roleId => {
            const role = allRoles[roleId];
            const selected = roleId === currentMember.role ? 'selected' : '';
            roleOptions += `<option value="${roleId}" ${selected}>${role.name}</option>`;
        });

        // 建立更換成員模態框
        const memberChangeModal = `
            <div class="modal fade" id="memberChangeModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">更換專案成員</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">專案名稱</label>
                                <input type="text" class="form-control" value="${assignment.projectName}" readonly>
                            </div>
                            <div class="mb-3">
                                <label for="newMemberId" class="form-label">選擇新成員</label>
                                <select class="form-select" id="newMemberId">
                                    ${memberOptions}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="newMemberRole" class="form-label">角色</label>
                                <select class="form-select" id="newMemberRole">
                                    ${roleOptions}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="changeReason" class="form-label">變更原因</label>
                                <textarea class="form-control" id="changeReason" rows="2" placeholder="請輸入成員變更原因..."></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-primary" onclick="confirmMemberChange('${projectId}', '${memberId}')">確認更換</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 先關閉操作選項模態框
        const actionsModal = bootstrap.Modal.getInstance(document.getElementById('memberActionsModal'));
        if (actionsModal) {
            actionsModal.hide();
        }

        // 移除舊的模態框
        const existingModal = document.getElementById('memberChangeModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 添加新的模態框
        document.body.insertAdjacentHTML('beforeend', memberChangeModal);
        const modal = new bootstrap.Modal(document.getElementById('memberChangeModal'));
        modal.show();

    } catch (error) {
        console.error('❌ 開啟成員更換介面失敗:', error);
        alert('開啟成員更換介面失敗');
    }
};

window.confirmMemberChange = async function(projectId, oldMemberId) {
    try {
        const newMemberId = document.getElementById('newMemberId').value;
        const newRole = document.getElementById('newMemberRole').value;
        const changeReason = document.getElementById('changeReason').value.trim();

        if (!newMemberId || !newRole) {
            alert('請選擇成員和角色');
            return;
        }

        const assignment = window.teamDataManager.getAllAssignments()[projectId];
        const allMembers = window.teamDataManager.getAllMembers();

        if (!assignment) {
            alert('找不到專案資料');
            return;
        }

        // 記錄變更歷程
        if (!assignment.memberHistory) assignment.memberHistory = [];

        const oldMember = assignment.members[oldMemberId];
        const changeRecord = {
            timestamp: new Date().toISOString(),
            action: 'member_changed',
            details: {
                oldMemberId: oldMemberId,
                oldMemberName: allMembers[oldMemberId] ? allMembers[oldMemberId].name : oldMemberId,
                oldRole: oldMember ? oldMember.role : 'unknown',
                newMemberId: newMemberId,
                newMemberName: allMembers[newMemberId] ? allMembers[newMemberId].name : newMemberId,
                newRole: newRole,
                reason: changeReason || '無指定原因'
            }
        };

        assignment.memberHistory.push(changeRecord);

        // 更新成員資訊
        if (newMemberId === oldMemberId) {
            // 同一成員，只更新角色
            assignment.members[oldMemberId].role = newRole;
        } else {
            // 不同成員，移除舊成員並添加新成員
            delete assignment.members[oldMemberId];
            assignment.members[newMemberId] = {
                memberId: newMemberId,
                role: newRole,
                assignedDate: new Date().toISOString()
            };
        }

        assignment.lastUpdated = new Date().toISOString();

        // 儲存變更到 Google Drive
        await window.teamDataManager.saveLocalChanges();

        // 關閉模態框
        const modal = bootstrap.Modal.getInstance(document.getElementById('memberEditModal'));
        if (modal) {
            modal.hide();
        }

        // 重新載入顯示
        window.markdownDashboard.loadProjectsFromJSON();
        window.markdownDashboard.render();

        console.log(`✅ 專案 ${projectId} 成員已更換: ${oldMemberId} -> ${newMemberId}`);
        alert('成員已成功更換');

    } catch (error) {
        console.error('❌ 更換成員失敗:', error);
        alert('更換成員失敗: ' + error.message);
    }
};

window.addProjectMember = function(projectId) {
    // 這裡需要實作新增成員功能
    alert(`新增成員功能開發中... 專案: ${projectId}`);
};

window.viewProjectNotes = function(projectId) {
    const assignment = window.teamDataManager.getAllAssignments()[projectId];
    if (assignment && assignment.notes && assignment.notes.length > 0) {
        const notesText = assignment.notes.map(note =>
            `${new Date(note.timestamp).toLocaleString()}: ${note.content}`
        ).join('\n\n');

        if (confirm(`專案備註:\n\n${notesText}\n\n點擊「確定」清空所有備註，點擊「取消」保留備註`)) {
            // 清空備註
            clearProjectNotes(projectId);
        }
    } else {
        alert('此專案目前沒有備註');
    }
};

window.clearProjectNotes = async function(projectId) {
    try {
        const assignment = window.teamDataManager.getAllAssignments()[projectId];
        if (assignment) {
            assignment.notes = [];
            assignment.lastUpdated = new Date().toISOString();

            // 同步到 Google Drive
            await window.teamDataManager.saveLocalChanges();

            // 重新載入顯示
            window.markdownDashboard.loadProjectsFromJSON();
            window.markdownDashboard.render();

            alert('備註已清空');
            console.log(`✅ 專案 ${projectId} 備註已清空`);
        }
    } catch (error) {
        console.error('❌ 清空備註失敗:', error);
        alert('清空備註失敗');
    }
};

// 確保類別可以被全域存取
window.MarkdownProjectDashboard = MarkdownProjectDashboard;

// 安全的全域初始化 - 只在需要時創建
if (typeof window.markdownDashboard === 'undefined') {
    console.log('🔄 創建全域 markdownDashboard 實例');
    window.markdownDashboard = new MarkdownProjectDashboard();
}