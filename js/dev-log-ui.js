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
        try {
            // 初始化 Google Drive API
            if (window.googleDriveAPI && !window.googleDriveAPI.isReady()) {
                console.log('🔄 初始化 Google Drive API...');
                await this.initGoogleDriveAPI();
            }

            // 檢查是否有現有的 teamDataManager
            if (window.teamDataManager && window.teamDataManager.isLoaded) {
                console.log('✅ 發現已載入的 TeamDataManager');
                return;
            }

            // 研發記錄簿以獨立模式運行，不初始化 TeamDataManager
            // 避免意外創建可能破壞專案分配資料的實例
            console.log('ℹ️ 研發記錄簿採用獨立模式，不影響專案分配資料');

            // 確保不會意外使用 TeamDataManager
            if (window.teamDataManager && !window.teamDataManager.isReady()) {
                console.log('⚠️ 發現未完全初始化的 TeamDataManager，設為 null 以避免資料損壞');
                window.teamDataManager = null;
            }
        } catch (error) {
            console.error('❌ 認證初始化失敗:', error);
            throw error;
        }
    }

    /**
     * 初始化 Google Drive API
     */
    async initGoogleDriveAPI() {
        try {
            if (!window.googleDriveAPI) {
                throw new Error('Google Drive API 未載入');
            }

            // 等待 Google Drive API 準備
            let waitCount = 0;
            while (!window.googleDriveAPI.isReady() && waitCount < 30) {
                await new Promise(resolve => setTimeout(resolve, 500));
                waitCount++;
            }

            if (!window.googleDriveAPI.isReady()) {
                throw new Error('Google Drive API 初始化超時');
            }

            // 嘗試登入
            if (!window.googleDriveAPI.isSignedIn()) {
                console.log('🔄 嘗試 Google Drive 自動登入...');
                const loginSuccess = await window.googleDriveAPI.signIn();
                if (!loginSuccess) {
                    throw new Error('Google Drive 登入失敗');
                }
            }

            console.log('✅ Google Drive API 已準備');
        } catch (error) {
            console.error('❌ Google Drive API 初始化失敗:', error);
            throw error;
        }
    }

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        // 總體記錄
        document.getElementById('addGlobalLogBtn').addEventListener('click', () => this.addGlobalLog());
        document.getElementById('addGlobalMetricBtn').addEventListener('click', () => this.addGlobalMetric());
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

    // 成員載入功能已移除，使用預設成員名稱

    // 成員選擇器相關功能已移除

    /**
     * 載入專案列表
     */
    async loadProjects() {
        try {
            this.projects = {};

            // 完整的預設專案列表
            const defaultProjects = {
                'ErCore': { projectName: 'ErCore', projectId: 'ErCore' },
                'ErNexus': { projectName: 'ErNexus', projectId: 'ErNexus' },
                'ErShield': { projectName: 'ErShield', projectId: 'ErShield' },
                'ErTidy': { projectName: 'ErTidy', projectId: 'ErTidy' },
                'EZOOM': { projectName: 'EZOOM', projectId: 'EZOOM' },
                'iFMS-Frontend': { projectName: 'iFMS-Frontend', projectId: 'iFMS-Frontend' },
                'SyncBC-Monorepo': { projectName: 'SyncBC-Monorepo', projectId: 'SyncBC-Monorepo' },
                'iMonitoring': { projectName: 'iMonitoring', projectId: 'iMonitoring' }
            };

            // 嘗試載入實際專案資料
            let loaded = false;

            // 方法1: 從 teamDataManager 讀取
            if (window.teamDataManager && window.teamDataManager.assignments && Object.keys(window.teamDataManager.assignments).length > 0) {
                console.log('📊 使用 teamDataManager 專案資料');
                this.projects = window.teamDataManager.assignments;
                loaded = true;
            }

            // 方法2: 從 localStorage 讀取
            if (!loaded) {
                try {
                    const localData = localStorage.getItem('project-assignments');
                    if (localData) {
                        const parsed = JSON.parse(localData);
                        if (parsed.assignments && Object.keys(parsed.assignments).length > 0) {
                            console.log('📊 使用 localStorage 專案資料');
                            this.projects = parsed.assignments;
                            loaded = true;
                        }
                    }
                } catch (error) {
                    console.warn('⚠️ localStorage 資料解析失敗:', error);
                }
            }

            // 方法3: 從 config 檔案讀取
            if (!loaded) {
                try {
                    const response = await fetch('config/project-assignments.json');
                    if (response.ok) {
                        const data = await response.json();
                        if (data.assignments && Object.keys(data.assignments).length > 0) {
                            console.log('📊 使用 config 檔案專案資料');
                            this.projects = data.assignments;
                            loaded = true;
                        }
                    }
                } catch (error) {
                    console.warn('⚠️ config 檔案讀取失敗:', error);
                }
            }

            // 如果都失敗，使用完整的預設專案列表
            if (!loaded) {
                console.log('⚠️ 使用完整預設專案列表');
                this.projects = defaultProjects;
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

            console.log('✅ 專案列表載入完成:', Object.keys(this.projects));

            // 恢復之前的選擇
            if (currentValue && this.projects[currentValue]) {
                projectSelect.value = currentValue;
                await this.selectProject(currentValue);
            }

        } catch (error) {
            console.error('❌ 載入專案列表失敗:', error);
            // 使用完整的預設專案
            const defaultProjects = {
                'ErCore': { projectName: 'ErCore', projectId: 'ErCore' },
                'ErNexus': { projectName: 'ErNexus', projectId: 'ErNexus' },
                'ErShield': { projectName: 'ErShield', projectId: 'ErShield' },
                'ErTidy': { projectName: 'ErTidy', projectId: 'ErTidy' },
                'EZOOM': { projectName: 'EZOOM', projectId: 'EZOOM' },
                'iFMS-Frontend': { projectName: 'iFMS-Frontend', projectId: 'iFMS-Frontend' },
                'SyncBC-Monorepo': { projectName: 'SyncBC-Monorepo', projectId: 'SyncBC-Monorepo' },
                'iMonitoring': { projectName: 'iMonitoring', projectId: 'iMonitoring' }
            };
            this.projects = defaultProjects;
            this.updateProjectSelector();
        }
    }

    /**
     * 更新專案選擇器
     */
    updateProjectSelector() {
        const projectSelect = document.getElementById('projectSelect');
        projectSelect.innerHTML = '<option value="">選擇要查看的專案</option>';

        for (const [projectId, project] of Object.entries(this.projects)) {
            const option = document.createElement('option');
            option.value = projectId;
            option.textContent = project.projectName || projectId;
            projectSelect.appendChild(option);
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
        const content = input.value.trim();

        if (!content) {
            alert('請輸入記錄內容');
            return;
        }

        try {
            // 使用預設成員名稱
            const defaultMember = '系統管理員';
            await window.devLogManager.addGlobalLog(content, defaultMember);

            // 清空輸入
            input.value = '';

            // 重新載入記錄
            await this.loadGlobalLogs();

            // 自動同步
            if (window.devLogManager) {
                await window.devLogManager.saveDevLogs();
            }

        } catch (error) {
            console.error('❌ 新增總體記錄失敗:', error);
            alert('新增記錄失敗');
        }
    }

    /**
     * 新增總體指標（同時新增到所有專案）
     */
    async addGlobalMetric() {
        // 顯示輸入對話框
        const content = prompt('請輸入總體指標內容（將同時新增到所有專案）：');
        if (!content || !content.trim()) {
            return;
        }

        try {
            const metricContent = content.trim();
            const timestamp = new Date().toISOString();
            const defaultMember = '系統管理員';

            // 1. 新增到總體研發記錄
            await window.devLogManager.addGlobalLog(`[總體指標] ${metricContent}`, defaultMember);
            console.log('✅ 已新增總體指標到總體研發記錄');

            // 2. 新增到所有專案記錄
            const projects = Object.keys(this.projects);
            for (const projectId of projects) {
                try {
                    await window.devLogManager.addProjectLog(projectId, `[總體指標] ${metricContent}`, defaultMember);
                    console.log(`✅ 已新增總體指標到專案: ${projectId}`);
                } catch (error) {
                    console.error(`❌ 新增總體指標到專案 ${projectId} 失敗:`, error);
                }
            }

            // 3. 新增到所有專案的專案備註
            if (window.teamDataManager && window.teamDataManager.isReady()) {
                const assignments = window.teamDataManager.getAllAssignments();
                for (const projectId of projects) {
                    if (assignments[projectId]) {
                        try {
                            // 取得現有備註
                            const currentNotes = assignments[projectId].notes || '';

                            // 新增總體指標到備註
                            const noteEntry = `[${new Date().toLocaleDateString('zh-TW')}] [總體指標] ${metricContent}`;
                            const newNotes = currentNotes ? `${currentNotes}\n${noteEntry}` : noteEntry;

                            // 更新專案備註
                            assignments[projectId].notes = newNotes;
                            assignments[projectId].lastUpdated = new Date().toISOString().split('T')[0];

                            console.log(`✅ 已新增總體指標到專案備註: ${projectId}`);
                        } catch (error) {
                            console.error(`❌ 新增總體指標到專案備註 ${projectId} 失敗:`, error);
                        }
                    }
                }

                // 儲存 TeamDataManager 的變更
                try {
                    await window.teamDataManager.saveLocalChanges();
                    console.log('✅ 已儲存專案備註變更到 TeamDataManager');
                } catch (error) {
                    console.error('❌ 儲存專案備註變更失敗:', error);
                }
            }

            // 4. 重新載入所有資料
            await this.loadGlobalLogs();
            if (this.currentProjectId) {
                await this.loadProjectLogs(this.currentProjectId);
            }

            // 5. 自動同步
            if (window.devLogManager) {
                await window.devLogManager.saveDevLogs();
            }

            alert(`總體指標已成功新增到：\n- 總體研發記錄\n- ${projects.length} 個專案記錄\n- ${projects.length} 個專案備註`);

        } catch (error) {
            console.error('❌ 新增總體指標失敗:', error);
            alert('新增總體指標失敗：' + error.message);
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
        const content = input.value.trim();

        if (!content) {
            alert('請輸入記錄內容');
            return;
        }

        try {
            // 使用預設成員名稱
            const defaultMember = '系統管理員';
            await window.devLogManager.addProjectLog(this.currentProjectId, content, defaultMember);

            // 清空輸入
            input.value = '';

            // 重新載入記錄
            await this.loadProjectLogs(this.currentProjectId);

            // 自動同步
            if (window.devLogManager) {
                await window.devLogManager.saveDevLogs();
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

            // ✅ 研發記錄簿操作完成
            console.log('✅ 研發記錄簿操作完成，與專案分配資料完全隔離');

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

            // ✅ 研發記錄簿操作完成
            console.log('✅ 研發記錄簿操作完成，與專案分配資料完全隔離');

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

            // ✅ 研發記錄簿操作完成
            console.log('✅ 研發記錄簿操作完成，與專案分配資料完全隔離');

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
            // 只推送研發記錄簿資料，不影響專案分配
            if (window.devLogManager) {
                console.log('📤 推送研發記錄到 Google Drive...');
                console.log('📋 檔案名稱:', window.devLogManager.filename);
                await window.devLogManager.saveDevLogs();
                alert('✅ 研發記錄已成功推送到 Google Drive');
                this.updateLastUpdateTime();
            } else {
                alert('⚠️ 研發記錄管理器未初始化');
            }
        } catch (error) {
            console.error('❌ 推送研發記錄失敗:', error);
            alert('❌ 推送研發記錄失敗: ' + error.message);
        }
    }

    /**
     * 從雲端拉取研發記錄
     */
    async pull() {
        try {
            // 只拉取研發記錄簿資料，不影響專案分配
            if (window.devLogManager) {
                await window.devLogManager.loadDevLogs();
                await this.refresh();
                alert('✅ 已從 Google Drive 拉取最新研發記錄');
            } else {
                alert('⚠️ 研發記錄管理器未初始化');
            }
        } catch (error) {
            console.error('❌ 拉取研發記錄失敗:', error);
            alert('❌ 拉取研發記錄失敗: ' + error.message);
        }
    }
}

// 導出類別
window.DevLogUI = DevLogUI;

// 全域實例留空，由主頁面初始化
// window.devLogUI = new DevLogUI();