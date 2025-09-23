/**
 * 研發記錄簿 UI 管理
 */

class DevLogUI {
    constructor() {
        this.currentProjectId = null;
        this.deleteModal = null;
        this.pendingDelete = null;
        this.allMembers = new Set();
        this.projects = {};
    }

    /**
     * 初始化 UI
     */
    async init() {
        try {
            // 檢查認證狀態
            if (!this.checkAuth()) {
                this.showAuthRequired();
                return;
            }

            // 等待認證
            await this.waitForAuth();

            // 顯示主要界面
            this.showMainInterface();

            // 初始化模態框
            this.deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

            // 設置事件監聽器
            this.setupEventListeners();

            // 載入資料
            await this.loadData();

            console.log('✅ 研發記錄簿 UI 初始化完成');
        } catch (error) {
            console.error('❌ 研發記錄簿 UI 初始化失敗:', error);
            this.showAuthRequired();
        }
    }

    /**
     * 檢查認證狀態
     */
    checkAuth() {
        // 檢查是否有必要的認證信息
        const hasAuth = sessionStorage.getItem('KEY_AUTHENTICATED');
        const hasGDriveConfig = sessionStorage.getItem('GOOGLE_DRIVE_CONFIG');

        return hasAuth && hasGDriveConfig;
    }

    /**
     * 顯示需要認證
     */
    showAuthRequired() {
        document.getElementById('keyAuthentication').style.display = 'block';
        document.getElementById('devLogTabs').style.display = 'none';
        document.getElementById('devLogTabContent').style.display = 'none';
    }

    /**
     * 顯示主要界面
     */
    showMainInterface() {
        document.getElementById('keyAuthentication').style.display = 'none';
        document.getElementById('devLogTabs').style.display = 'block';
        document.getElementById('devLogTabContent').style.display = 'block';
    }

    /**
     * 等待認證完成
     */
    async waitForAuth() {
        // 初始化 TeamDataManager
        if (!window.teamDataManager) {
            window.teamDataManager = new TeamDataManager();
            await window.teamDataManager.init();
        }

        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5秒超時

            const checkAuth = () => {
                attempts++;

                if (window.teamDataManager && window.teamDataManager.isLoaded) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('認證超時'));
                } else {
                    setTimeout(checkAuth, 100);
                }
            };
            checkAuth();
        });
    }

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        // 總體記錄
        document.getElementById('addGlobalLogBtn').addEventListener('click', () => this.addGlobalLog());
        document.getElementById('clearGlobalBtn').addEventListener('click', () => this.clearGlobalLogs());
        document.getElementById('globalLogInput').addEventListener('keypress', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.addGlobalLog();
            }
        });

        // 專案記錄
        document.getElementById('projectSelect').addEventListener('change', (e) => this.selectProject(e.target.value));
        document.getElementById('addProjectLogBtn').addEventListener('click', () => this.addProjectLog());
        document.getElementById('clearProjectBtn').addEventListener('click', () => this.clearProjectLogs());
        document.getElementById('refreshProjectsBtn').addEventListener('click', () => this.loadProjects());
        document.getElementById('projectLogInput').addEventListener('keypress', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.addProjectLog();
            }
        });

        // 刪除確認
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => this.confirmDelete());

        // 導航功能
        document.getElementById('refreshBtn').addEventListener('click', () => this.refresh());
        document.getElementById('syncBtn').addEventListener('click', () => this.push());
        document.getElementById('pullBtn').addEventListener('click', () => this.pull());
    }

    /**
     * 載入資料
     */
    async loadData() {
        try {
            // 載入成員列表
            await this.loadMembers();

            // 載入專案列表
            await this.loadProjects();

            // 載入總體記錄
            await this.loadGlobalLogs();

            // 顯示同步按鈕
            this.showSyncButtons();

            // 更新最後更新時間
            this.updateLastUpdateTime();

        } catch (error) {
            console.error('❌ 載入資料失敗:', error);
        }
    }

    /**
     * 載入成員列表
     */
    async loadMembers() {
        try {
            this.allMembers.clear();

            if (window.teamDataManager && window.teamDataManager.assignments) {
                for (const [projectId, project] of Object.entries(window.teamDataManager.assignments)) {
                    if (project.members) {
                        for (const [memberId, member] of Object.entries(project.members)) {
                            this.allMembers.add(member.memberName || memberId);
                        }
                    }
                }
            }

            // 更新成員選擇器
            this.updateMemberSelectors();

        } catch (error) {
            console.error('❌ 載入成員列表失敗:', error);
        }
    }

    /**
     * 更新成員選擇器
     */
    updateMemberSelectors() {
        const selectors = ['globalMemberSelect', 'projectMemberSelect'];

        selectors.forEach(selectorId => {
            const selector = document.getElementById(selectorId);
            const currentValue = selector.value;

            // 清空並重新填充
            selector.innerHTML = '<option value="">選擇成員</option>';

            const sortedMembers = Array.from(this.allMembers).sort();
            sortedMembers.forEach(member => {
                const option = document.createElement('option');
                option.value = member;
                option.textContent = member;
                selector.appendChild(option);
            });

            // 恢復之前的選擇
            if (currentValue && this.allMembers.has(currentValue)) {
                selector.value = currentValue;
            }
        });
    }

    /**
     * 載入專案列表
     */
    async loadProjects() {
        try {
            this.projects = {};

            if (window.teamDataManager && window.teamDataManager.assignments) {
                this.projects = window.teamDataManager.assignments;
            }

            // 更新專案選擇器
            const projectSelect = document.getElementById('projectSelect');
            const currentValue = projectSelect.value;

            projectSelect.innerHTML = '<option value="">選擇要查看的專案</option>';

            for (const [projectId, project] of Object.entries(this.projects)) {
                const option = document.createElement('option');
                option.value = projectId;
                option.textContent = project.projectName || projectId;
                projectSelect.appendChild(option);
            }

            // 恢復之前的選擇
            if (currentValue && this.projects[currentValue]) {
                projectSelect.value = currentValue;
                await this.selectProject(currentValue);
            }

        } catch (error) {
            console.error('❌ 載入專案列表失敗:', error);
        }
    }

    /**
     * 載入總體記錄
     */
    async loadGlobalLogs() {
        try {
            const logs = await window.devLogManager.getGlobalLogs();
            this.renderLogs('globalLogsList', logs, 'global');
        } catch (error) {
            console.error('❌ 載入總體記錄失敗:', error);
            document.getElementById('globalLogsList').innerHTML =
                '<div class="alert alert-danger">載入記錄失敗</div>';
        }
    }

    /**
     * 選擇專案
     */
    async selectProject(projectId) {
        this.currentProjectId = projectId;

        if (!projectId) {
            document.getElementById('projectLogCard').style.display = 'none';
            return;
        }

        try {
            // 顯示專案記錄卡片
            document.getElementById('projectLogCard').style.display = 'block';

            // 更新專案名稱
            const projectName = this.projects[projectId]?.projectName || projectId;
            document.getElementById('currentProjectName').textContent = `${projectName} 記錄`;

            // 載入專案記錄
            await this.loadProjectLogs(projectId);

        } catch (error) {
            console.error('❌ 選擇專案失敗:', error);
        }
    }

    /**
     * 載入專案記錄
     */
    async loadProjectLogs(projectId) {
        try {
            const logs = await window.devLogManager.getProjectLogs(projectId);
            this.renderLogs('projectLogsList', logs, 'project');
        } catch (error) {
            console.error('❌ 載入專案記錄失敗:', error);
            document.getElementById('projectLogsList').innerHTML =
                '<div class="alert alert-danger">載入記錄失敗</div>';
        }
    }

    /**
     * 渲染記錄列表
     */
    renderLogs(containerId, logs, type) {
        const container = document.getElementById(containerId);

        if (!logs || logs.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-2x mb-2"></i>
                    <p>尚無${type === 'global' ? '總體' : '專案'}記錄</p>
                </div>
            `;
            return;
        }

        const logsHtml = logs.map(log => this.renderLogItem(log, type)).join('');
        container.innerHTML = logsHtml;
    }

    /**
     * 渲染單一記錄項目
     */
    renderLogItem(log, type) {
        const timeAgo = window.devLogManager.formatTimestamp(log.timestamp);
        const badgeClass = type === 'global' ? 'bg-primary' : 'bg-info';

        return `
            <div class="card mb-3" data-log-id="${log.id}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <div class="mb-2">
                                <span class="badge ${badgeClass} me-2">${log.member}</span>
                                <small class="text-muted">
                                    <i class="fas fa-clock me-1"></i>${timeAgo}
                                </small>
                            </div>
                            <div class="log-content">
                                ${this.formatLogContent(log.content)}
                            </div>
                        </div>
                        <div class="ms-3">
                            <button class="btn btn-outline-danger btn-sm"
                                    onclick="devLogUI.deleteLog('${log.id}', '${type}', ${type === 'project' ? `'${log.projectId}'` : 'null'})"
                                    title="刪除記錄">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 格式化記錄內容
     */
    formatLogContent(content) {
        // 將換行符轉換為 <br>
        return content.replace(/\n/g, '<br>');
    }

    /**
     * 新增總體記錄
     */
    async addGlobalLog() {
        const input = document.getElementById('globalLogInput');
        const memberSelect = document.getElementById('globalMemberSelect');

        const content = input.value.trim();
        const member = memberSelect.value;

        if (!content) {
            alert('請輸入記錄內容');
            return;
        }

        if (!member) {
            alert('請選擇成員');
            return;
        }

        try {
            await window.devLogManager.addGlobalLog(content, member);

            // 清空輸入
            input.value = '';
            memberSelect.value = '';

            // 重新載入記錄
            await this.loadGlobalLogs();

            // 自動同步
            if (window.teamDataManager) {
                await window.teamDataManager.saveToCloud();
            }

        } catch (error) {
            console.error('❌ 新增總體記錄失敗:', error);
            alert('新增記錄失敗');
        }
    }

    /**
     * 新增專案記錄
     */
    async addProjectLog() {
        if (!this.currentProjectId) {
            alert('請先選擇專案');
            return;
        }

        const input = document.getElementById('projectLogInput');
        const memberSelect = document.getElementById('projectMemberSelect');

        const content = input.value.trim();
        const member = memberSelect.value;

        if (!content) {
            alert('請輸入記錄內容');
            return;
        }

        if (!member) {
            alert('請選擇成員');
            return;
        }

        try {
            await window.devLogManager.addProjectLog(this.currentProjectId, content, member);

            // 清空輸入
            input.value = '';
            memberSelect.value = '';

            // 重新載入記錄
            await this.loadProjectLogs(this.currentProjectId);

            // 自動同步
            if (window.teamDataManager) {
                await window.teamDataManager.saveToCloud();
            }

        } catch (error) {
            console.error('❌ 新增專案記錄失敗:', error);
            alert('新增記錄失敗');
        }
    }

    /**
     * 刪除記錄
     */
    deleteLog(logId, type, projectId) {
        this.pendingDelete = { logId, type, projectId };

        const message = type === 'global' ?
            '確定要刪除這筆總體記錄嗎？' :
            '確定要刪除這筆專案記錄嗎？';

        document.getElementById('deleteMessage').textContent = message;
        this.deleteModal.show();
    }

    /**
     * 確認刪除
     */
    async confirmDelete() {
        if (!this.pendingDelete) return;

        try {
            const { logId, type, projectId } = this.pendingDelete;

            await window.devLogManager.deleteLog(logId, type, projectId);

            // 重新載入對應的記錄列表
            if (type === 'global') {
                await this.loadGlobalLogs();
            } else if (type === 'project' && projectId) {
                await this.loadProjectLogs(projectId);
            }

            // 自動同步
            if (window.teamDataManager) {
                await window.teamDataManager.saveToCloud();
            }

            this.deleteModal.hide();
            this.pendingDelete = null;

        } catch (error) {
            console.error('❌ 刪除記錄失敗:', error);
            alert('刪除記錄失敗');
        }
    }

    /**
     * 清空總體記錄
     */
    async clearGlobalLogs() {
        if (!confirm('確定要清空所有總體記錄嗎？此操作無法復原！')) {
            return;
        }

        try {
            await window.devLogManager.clearLogs('global');
            await this.loadGlobalLogs();

            // 自動同步
            if (window.teamDataManager) {
                await window.teamDataManager.saveToCloud();
            }

        } catch (error) {
            console.error('❌ 清空總體記錄失敗:', error);
            alert('清空記錄失敗');
        }
    }

    /**
     * 清空專案記錄
     */
    async clearProjectLogs() {
        if (!this.currentProjectId) {
            alert('請先選擇專案');
            return;
        }

        const projectName = this.projects[this.currentProjectId]?.projectName || this.currentProjectId;

        if (!confirm(`確定要清空「${projectName}」的所有記錄嗎？此操作無法復原！`)) {
            return;
        }

        try {
            await window.devLogManager.clearLogs('project', this.currentProjectId);
            await this.loadProjectLogs(this.currentProjectId);

            // 自動同步
            if (window.teamDataManager) {
                await window.teamDataManager.saveToCloud();
            }

        } catch (error) {
            console.error('❌ 清空專案記錄失敗:', error);
            alert('清空記錄失敗');
        }
    }

    /**
     * 顯示同步按鈕
     */
    showSyncButtons() {
        const syncBtn = document.getElementById('syncBtn');
        const pullBtn = document.getElementById('pullBtn');

        if (syncBtn) syncBtn.style.display = 'inline-block';
        if (pullBtn) pullBtn.style.display = 'inline-block';
    }

    /**
     * 更新最後更新時間
     */
    updateLastUpdateTime() {
        const lastUpdateElement = document.getElementById('lastUpdate');
        if (lastUpdateElement) {
            const now = new Date();
            lastUpdateElement.textContent = now.toLocaleString('zh-TW');
        }
    }

    /**
     * 重新載入
     */
    async refresh() {
        try {
            await window.devLogManager.loadDevLogs();
            await this.loadData();
            console.log('✅ 研發記錄簿重新載入完成');
        } catch (error) {
            console.error('❌ 重新載入失敗:', error);
        }
    }

    /**
     * 推送到雲端
     */
    async push() {
        try {
            if (window.teamDataManager) {
                await window.teamDataManager.saveToCloud();
                alert('✅ 已成功推送到 Google Drive');
                this.updateLastUpdateTime();
            }
        } catch (error) {
            console.error('❌ 推送失敗:', error);
            alert('❌ 推送失敗');
        }
    }

    /**
     * 從雲端拉取
     */
    async pull() {
        try {
            if (window.teamDataManager) {
                await window.teamDataManager.loadFromCloud();
                await this.refresh();
                alert('✅ 已從 Google Drive 拉取最新資料');
            }
        } catch (error) {
            console.error('❌ 拉取失敗:', error);
            alert('❌ 拉取失敗');
        }
    }
}

// 導出類別
window.DevLogUI = DevLogUI;

// 全域實例留空，由主頁面初始化
// window.devLogUI = new DevLogUI();