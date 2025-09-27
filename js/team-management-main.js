/**
 * 團隊管理主控制器 (重構版)
 * 整合所有模組，提供統一的管理介面
 */

class TeamManagement {
    constructor() {
        // 強制使用全域單例
        if (!window.globalTeamDataManager) {
            window.globalTeamDataManager = new TeamDataManager();
            window.globalTeamDataManager.init();
        }
        this.dataManager = window.globalTeamDataManager;
        this.statistics = new TeamStatistics(this.dataManager);
        this.uiComponents = new TeamUIComponents(this.dataManager, this.statistics);

        // 初始化子模組
        this.memberManager = new TeamMemberManager(this.dataManager, this.uiComponents);
        this.projectManager = new TeamProjectManager(this.dataManager, this.uiComponents);

        // 設為全域可用
        window.teamMemberManager = this.memberManager;
        window.teamProjectManager = this.projectManager;
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
        const overviewHtml = this.uiComponents.renderTeamOverview(stats);

        const dashboardContent = document.getElementById('dashboardContent');
        if (dashboardContent) {
            dashboardContent.innerHTML = overviewHtml;
        }
    }

    // 開啟團隊管理儀表板
    openTeamManagementDashboard() {
        console.log('📱 開啟團隊管理儀表板');

        const dashboardHtml = `
            <div class="modal fade" id="teamManagementModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-fullscreen">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4 class="modal-title">
                                <i class="fas fa-users-cog me-2"></i>團隊管理中心
                            </h4>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-0">
                            <div class="row g-0 h-100">
                                <!-- 側邊欄 -->
                                <div class="col-md-3 bg-light border-end">
                                    <div class="p-3">
                                        <div class="nav flex-column nav-pills" id="v-pills-tab" role="tablist">
                                            <button class="nav-link active" id="v-pills-overview-tab" data-bs-toggle="pill"
                                                    data-bs-target="#v-pills-overview" type="button">
                                                <i class="fas fa-chart-pie me-2"></i>團隊總覽
                                            </button>
                                            <button class="nav-link" id="v-pills-members-tab" data-bs-toggle="pill"
                                                    data-bs-target="#v-pills-members" type="button">
                                                <i class="fas fa-users me-2"></i>成員管理
                                            </button>
                                            <button class="nav-link" id="v-pills-projects-tab" data-bs-toggle="pill"
                                                    data-bs-target="#v-pills-projects" type="button">
                                                <i class="fas fa-project-diagram me-2"></i>專案管理
                                            </button>
                                            <button class="nav-link" id="v-pills-tasks-tab" data-bs-toggle="pill"
                                                    data-bs-target="#v-pills-tasks" type="button">
                                                <i class="fas fa-tasks me-2"></i>任務管理
                                            </button>
                                            <button class="nav-link" id="v-pills-settings-tab" data-bs-toggle="pill"
                                                    data-bs-target="#v-pills-settings" type="button">
                                                <i class="fas fa-cog me-2"></i>系統設定
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- 主要內容區域 -->
                                <div class="col-md-9">
                                    <div class="tab-content h-100" id="v-pills-tabContent">
                                        <div class="tab-pane fade show active" id="v-pills-overview">
                                            <div class="p-4" id="teamOverviewContent">
                                                ${this.uiComponents.renderTeamOverview(this.statistics.generateTeamStatistics())}
                                            </div>
                                        </div>
                                        <div class="tab-pane fade" id="v-pills-members">
                                            <div class="p-4" id="memberManagementContent">
                                                載入中...
                                            </div>
                                        </div>
                                        <div class="tab-pane fade" id="v-pills-projects">
                                            <div class="p-4" id="projectManagementContent">
                                                載入中...
                                            </div>
                                        </div>
                                        <div class="tab-pane fade" id="v-pills-tasks">
                                            <div class="p-4" id="taskManagementContent">
                                                載入中...
                                            </div>
                                        </div>
                                        <div class="tab-pane fade" id="v-pills-settings">
                                            <div class="p-4" id="systemSettingsContent">
                                                載入中...
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除已存在的模態框
        const existingModal = document.getElementById('teamManagementModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 插入新的模態框
        document.body.insertAdjacentHTML('beforeend', dashboardHtml);

        // 設置標籤切換事件
        this.setupTabEvents();

        // 顯示模態框
        const modal = new bootstrap.Modal(document.getElementById('teamManagementModal'));
        modal.show();
    }

    // 設置標籤切換事件
    setupTabEvents() {
        // 成員管理標籤
        document.getElementById('v-pills-members-tab').addEventListener('shown.bs.tab', () => {
            this.loadMemberManagement();
        });

        // 專案管理標籤
        document.getElementById('v-pills-projects-tab').addEventListener('shown.bs.tab', () => {
            this.loadProjectManagement();
        });

        // 任務管理標籤
        document.getElementById('v-pills-tasks-tab').addEventListener('shown.bs.tab', () => {
            this.loadTaskManagement();
        });

        // 系統設定標籤
        document.getElementById('v-pills-settings-tab').addEventListener('shown.bs.tab', () => {
            this.loadSystemSettings();
        });
    }

    // 顯示團隊管理介面（主要入口點）
    async showTeamManagement() {
        console.log('👥 顯示團隊管理介面');

        // 等待資料管理器初始化
        if (!this.dataManager.isInitialized) {
            console.log('⏳ 等待資料管理器初始化...');
            await this.dataManager.init();
        }

        // 開啟管理儀表板
        this.openTeamManagementDashboard();
    }

    // 載入成員管理介面
    loadMemberManagement() {
        console.log('👤 載入成員管理介面');
        const content = this.uiComponents.renderMemberManagement();
        const container = document.getElementById('memberManagementContent');
        if (container) {
            container.innerHTML = content;
        }
    }

    // 載入專案管理介面
    async loadProjectManagement() {
        console.log('📋 載入專案管理介面');
        const content = await this.projectManager.loadProjectManagement();
        const container = document.getElementById('projectManagementContent');
        if (container) {
            container.innerHTML = content;
        }
    }

    // 載入任務管理介面
    async loadTaskManagement() {
        console.log('📝 載入任務管理介面');
        const content = `
            <div class="row">
                <div class="col-12">
                    <h4><i class="fas fa-tasks me-2"></i>任務管理</h4>
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        任務管理功能開發中...
                    </div>
                </div>
            </div>
        `;
        const container = document.getElementById('taskManagementContent');
        if (container) {
            container.innerHTML = content;
        }
    }

    // 載入系統設定介面
    loadSystemSettings() {
        console.log('⚙️ 載入系統設定介面');
        const content = `
            <div class="row">
                <div class="col-12">
                    <h4><i class="fas fa-cog me-2"></i>系統設定</h4>
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        系統設定功能開發中...
                    </div>
                </div>
            </div>
        `;
        const container = document.getElementById('systemSettingsContent');
        if (container) {
            container.innerHTML = content;
        }
    }

    // 新增成員變更歷程記錄
    addMemberChangeHistory(projectId, changeData) {
        try {
            const assignments = this.dataManager.getAllAssignments();
            if (!assignments[projectId]) return;

            if (!assignments[projectId].memberHistory) {
                assignments[projectId].memberHistory = [];
            }

            const historyEntry = {
                timestamp: new Date().toISOString(),
                ...changeData
            };

            assignments[projectId].memberHistory.push(historyEntry);

            // 只保留最近50條記錄
            if (assignments[projectId].memberHistory.length > 50) {
                assignments[projectId].memberHistory = assignments[projectId].memberHistory.slice(-50);
            }

            console.log('✅ 成員變更歷程已記錄:', historyEntry);
        } catch (error) {
            console.error('❌ 記錄成員變更歷程失敗:', error);
        }
    }
}

// 設為全域可用
window.TeamManagement = TeamManagement;