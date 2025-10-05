/**
 * 團隊資料管理模組
 * 負責載入、保存和管理團隊成員、專案分配等核心資料
 */

class TeamDataManager {
    constructor() {
        this.members = {};
        this.roles = {};
        this.assignments = {};
        this.constraints = {};
        this.teamConfig = {};
        this.isInitialized = false;
        this.useUnifiedStructure = false; // 是否使用統一資料結構
        this.unifiedData = null; // 統一資料結構快取
    }

    async init() {
        try {
            await this.loadTeamData();
            await this.loadAssignments();
            await this.loadLocalChanges();
            await this.loadLocalMemberChanges();

            this.isInitialized = true;
            this.lastUpdateTime = Date.now(); // 記錄更新時間
        } catch (error) {
            console.error('團隊資料管理器初始化失敗:', error);
            this.isInitialized = false;

            // 即使初始化失敗，也要確保基本結構存在
            if (!this.members) this.members = {};
            if (!this.roles) this.roles = {};
            if (!this.assignments) this.assignments = {};
            if (!this.constraints) this.constraints = {};
            if (!this.teamConfig) this.teamConfig = {};

            throw error; // 重新拋出錯誤以便上層處理
        }
    }

    async loadTeamData() {
        try {
            let data = null;

            // 1. 優先從 Google Drive 載入統一資料結構
            if (window.googleDriveAPI) {
                // 等待 Google Drive API 準備好
                if (!window.googleDriveAPI.isReady()) {
                    console.log('⏳ 等待 Google Drive API 初始化...');
                    await new Promise(resolve => {
                        const checkReady = setInterval(() => {
                            if (window.googleDriveAPI.isReady()) {
                                clearInterval(checkReady);
                                resolve();
                            }
                        }, 100);
                        // 最多等待 5 秒
                        setTimeout(() => {
                            clearInterval(checkReady);
                            resolve();
                        }, 5000);
                    });
                }

                if (window.googleDriveAPI.isReady()) {
                    // 確保已登入 Google Drive
                    if (!window.googleDriveAPI.isAuthenticated) {
                        console.log('🔐 需要登入 Google Drive 來載入團隊資料');
                        const loginSuccess = await window.googleDriveAPI.signIn();
                        if (!loginSuccess) {
                            throw new Error('必須登入 Google Drive 才能使用系統');
                        }
                    }

                    try {
                        // 嘗試載入統一資料結構
                        console.log('☁️ 優先從 Google Drive 載入統一資料結構...');
                        const unifiedContent = await window.googleDriveAPI.retryWithReAuth(
                            () => window.googleDriveAPI.loadFile('unified-data.json')
                        );

                        if (unifiedContent) {
                            console.log('✅ 發現統一資料結構，使用統一格式');
                            this.useUnifiedStructure = true;
                            this.unifiedData = unifiedContent.data || unifiedContent;

                            // 從統一結構提取成員資料
                            data = {
                                members: this.unifiedData.members || {},
                                roles: this.unifiedData.roles || {},
                                groups: this.unifiedData.organization?.groups || {}
                            };

                            // 儲存到本地快取
                            localStorage.setItem('cachedUnifiedData', JSON.stringify(this.unifiedData));
                            localStorage.setItem('cachedTeamMembers', JSON.stringify(data));
                            console.log('✅ 統一資料結構載入成功');
                        }
                    } catch (unifiedError) {
                        console.log('ℹ️ 統一資料結構不存在，使用舊格式');
                        this.useUnifiedStructure = false;
                    }
                }

                // 如果沒有統一結構，使用舊格式
                if (!data) {
                    try {
                        console.log('☁️ 從 Google Drive 載入團隊成員資料 (舊格式)...');
                        const driveContent = await window.googleDriveAPI.retryWithReAuth(
                            () => window.googleDriveAPI.loadFile('team-members.json')
                        );
                        if (driveContent) {
                            data = driveContent.data || driveContent;
                            localStorage.setItem('cachedTeamMembers', JSON.stringify(data));
                            console.log('✅ 從 Google Drive 載入團隊成員資料成功 (舊格式)');
                        }
                    } catch (driveError) {
                        console.warn('⚠️ Google Drive 載入失敗，嘗試使用備份:', driveError.message);
                    }
                }
            }

            // 2. 如果 Google Drive 載入失敗，使用本地快取作為備份
            if (!data) {
                const cachedData = localStorage.getItem('cachedTeamMembers');
                if (cachedData) {
                    try {
                        data = JSON.parse(cachedData);
                        console.log('📋 使用本地快取資料 (備份)');
                    } catch (e) {
                        console.error('本地快取資料解析失敗:', e);
                        data = null;
                    }
                }
            }

            // 3. 最後才嘗試本地檔案 (僅作為後備)
            if (!data) {
                try {
                    const response = await fetch('./temp-team-members.json?v=' + Date.now());
                    if (response.ok) {
                        data = await response.json();
                        console.log('📂 使用本地檔案資料 (後備)');
                    }
                } catch (tempError) {
                    console.log('📂 本地檔案載入失敗:', tempError.message);
                }
            }

            // 4. 如果還是沒有資料，必須有資料才能運作
            if (!data) {
                throw new Error('無法載入團隊資料，請確認已登入 Google Drive 且資料存在');
            }

            // 先載入預設資料
            this.members = data.members || {};
            this.roles = data.roles || {};
            this.teamConfig = data; // 載入完整的團隊配置，包含 groups

            // 確保 teamConfig.members 存在並與 this.members 同步
            if (!this.teamConfig.members) {
                this.teamConfig.members = this.members;
            }

            // 檢查並清理舊的臨時變更記錄（如果有的話）
            const oldChanges = localStorage.getItem('teamMemberChanges');
            if (oldChanges) {
                console.log('🔄 發現舊的臨時變更記錄，將移除...');
                localStorage.removeItem('teamMemberChanges');
                console.log('✅ 已清理舊的臨時變更記錄');
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
            console.log('🔄 最終成員列表:', Object.keys(this.members));
            console.log('🔄 最終成員數量:', Object.keys(this.members).length);
        } catch (error) {
            console.error('❌ 團隊成員資料載入失敗:', error);
            this.members = {};
            this.roles = {};
            this.teamConfig = { groups: {} };
        }
    }

    async loadAssignments() {
        try {
            let data = null;

            // 1. 如果使用統一結構，從 unifiedData 提取
            if (this.useUnifiedStructure && this.unifiedData) {
                console.log('📦 從統一資料結構提取專案配置...');

                // 轉換統一結構的專案資料為舊格式
                data = {
                    assignments: {},
                    constraints: this.unifiedData.config?.constraints || {},
                    statistics: this.unifiedData.config?.statistics || {}
                };

                for (const [projectId, project] of Object.entries(this.unifiedData.projects || {})) {
                    data.assignments[projectId] = {
                        projectId: project.projectId,
                        projectName: project.projectName,
                        progress: project.progress,
                        members: project.members,
                        memberHistory: project.memberHistory,
                        lastUpdated: project.metadata?.lastUpdated,
                        status: project.status,
                        notes: project.notes
                    };
                }

                const assignmentCount = Object.keys(data.assignments).length;
                console.log(`✅ 從統一資料結構提取專案配置成功 (${assignmentCount} 個專案)`);
            }

            // 2. 如果沒有統一結構，優先從 Google Drive 載入 (確保資料最新)
            if (!data && window.googleDriveAPI && window.googleDriveAPI.isReady()) {
                // 如果未登入，嘗試自動登入
                if (!window.googleDriveAPI.isAuthenticated) {
                    const loginSuccess = await window.googleDriveAPI.signIn();
                    if (!loginSuccess) {
                        throw new Error('必須登入 Google Drive 才能載入專案分配');
                    }
                }

                // 如果已登入，載入雲端資料
                if (window.googleDriveAPI.isAuthenticated) {
                    try {
                        console.log('☁️ 優先從 Google Drive 載入專案配置 (舊格式)...');
                        const driveContent = await window.googleDriveAPI.retryWithReAuth(
                            () => window.googleDriveAPI.loadFile('project-assignments.json')
                        );
                        if (driveContent) {
                            // 處理包裝格式的資料 (從 saveFile 儲存的格式)
                            data = driveContent.data || driveContent;

                            // 驗證資料結構
                            if (data && data.assignments && typeof data.assignments === 'object') {
                                const assignmentCount = Object.keys(data.assignments).length;
                                console.log(`✅ 從 Google Drive 載入專案配置成功 (${assignmentCount} 個專案)`);
                            } else {
                                console.warn('⚠️ Google Drive 資料格式異常');
                                data = null;
                            }
                        }
                    } catch (driveError) {
                        console.warn('⚠️ Google Drive 載入失敗，嘗試使用備份:', driveError.message);
                    }
                }
            }

            // 2. 如果 Google Drive 沒有資料，使用本地快取作為備份
            if (!data) {
                const cachedData = localStorage.getItem('teamAssignments');
                if (cachedData) {
                    try {
                        data = { assignments: JSON.parse(cachedData) };
                        console.log('📋 使用本地快取資料 (備份)');
                    } catch (e) {
                        console.error('本地快取資料解析失敗:', e);
                        data = null;
                    }
                }
            }

            // 3. 最後才嘗試本地檔案 (僅作為後備)
            if (!data) {
                console.log('📂 嘗試從本地檔案載入 (後備)...');
                try {
                    const response = await fetch('config/project-assignments.json');
                    if (response.ok) {
                        data = await response.json();
                        console.log('✅ 從本地檔案載入專案配置成功');
                    } else {
                        throw new Error('本地檔案載入失敗');
                    }
                } catch (localError) {
                    console.error('❌ 本地檔案載入也失敗:', localError);
                    throw new Error('無法從 Google Drive 或本地載入專案分配資料');
                }
            }

            this.assignments = (data && data.assignments) ? data.assignments : {};
            this.constraints = (data && data.constraints) ? data.constraints : {};

            // 確保每個專案都有 memberHistory 陣列
            if (this.assignments) {
                Object.keys(this.assignments).forEach(projectId => {
                    if (!this.assignments[projectId].memberHistory) {
                        this.assignments[projectId].memberHistory = [];
                        console.log(`✅ 為專案 ${projectId} 初始化 memberHistory 陣列`);
                    }
                });
            }
        } catch (error) {
            console.error('載入專案分配資料失敗:', error);
            this.assignments = {};
            this.constraints = {};
        }
    }

    async loadLocalChanges() {
        try {
            const savedData = localStorage.getItem('teamAssignments');
            if (savedData) {
                const localAssignments = JSON.parse(savedData);

                // 深度合併本地變更到專案分配
                Object.keys(localAssignments).forEach(projectId => {
                    if (this.assignments && this.assignments[projectId]) {
                        // 深度合併專案數據
                        this.assignments[projectId] = { ...this.assignments[projectId], ...localAssignments[projectId] };

                        // 特別處理成員數據，確保 isExecuting 和 personalNotes 被保留
                        if (localAssignments[projectId].members && this.assignments[projectId].members) {
                            Object.keys(localAssignments[projectId].members).forEach(memberId => {
                                if (this.assignments[projectId].members[memberId]) {
                                    // 深度合併成員數據
                                    this.assignments[projectId].members[memberId] = {
                                        ...this.assignments[projectId].members[memberId],
                                        ...localAssignments[projectId].members[memberId]
                                    };
                                } else {
                                    // 新成員
                                    this.assignments[projectId].members[memberId] = localAssignments[projectId].members[memberId];
                                }
                            });
                        }
                    } else if (this.assignments) {
                        this.assignments[projectId] = localAssignments[projectId];
                    } else {
                        console.warn(`⚠️ assignments 未初始化，無法載入 ${projectId} 的本地變更`);
                    }
                });

                // 再次確保每個專案都有 memberHistory 陣列（包括本地變更的專案）
                Object.keys(this.assignments).forEach(projectId => {
                    if (!this.assignments[projectId].memberHistory) {
                        this.assignments[projectId].memberHistory = [];
                        console.log(`✅ 為專案 ${projectId} 補充 memberHistory 陣列`);
                    }
                });

                console.log('✅ 已載入本地專案分配變更');
            }
        } catch (error) {
            console.error('載入本地變更失敗:', error);
        }
    }

    async loadLocalMemberChanges() {
        // 這個方法現在由 loadTeamData 中的邏輯處理
        // 保留空實作以避免破壞既有呼叫
        console.log('📁 本地成員變更已在 loadTeamData 中處理');
    }

    // 重新載入專案分配資料
    async reloadAssignments() {
        try {
            await this.loadAssignments();
            await this.loadLocalChanges();
            console.log('專案資料重新載入完成');
        } catch (error) {
            console.error('重新載入專案資料失敗:', error);
            throw error;
        }
    }

    // 儲存專案分配變更
    async saveLocalChanges() {
        try {
            // 儲存到 localStorage（作為備份）
            localStorage.setItem('teamAssignments', JSON.stringify(this.assignments));

            // 同時儲存到 Google Drive
            if (window.googleDriveAPI && window.googleDriveAPI.isAuthenticated) {
                // 詳細記錄專案備註狀態
                console.log('📝 檢查專案備註狀態:');
                Object.keys(this.assignments).forEach(projectId => {
                    const project = this.assignments[projectId];
                    if (project.notes) {
                        console.log(`  ✅ ${projectId}: 有專案備註 (${project.notes.length} 字元)`);
                        try {
                            const parsedNotes = JSON.parse(project.notes);
                            if (Array.isArray(parsedNotes)) {
                                console.log(`     - 包含 ${parsedNotes.length} 個歷程記錄`);
                            }
                        } catch (e) {
                            console.log(`     - 備註格式: 純文字`);
                        }
                    } else {
                        console.log(`  ⚪ ${projectId}: 無專案備註`);
                    }
                });

                const assignmentData = {
                    assignments: this.assignments,
                    constraints: this.constraints,
                    statistics: {
                        totalAssignments: Object.values(this.assignments).reduce((sum, project) => sum + Object.keys(project.members || {}).length, 0),
                        activeProjects: Object.values(this.assignments).filter(p => p.status === 'active').length,
                        completedProjects: Object.values(this.assignments).filter(p => p.status === 'completed').length,
                        membersInUse: new Set(Object.values(this.assignments).flatMap(p => Object.keys(p.members || {}))).size,
                        availableMembers: Object.keys(this.members).length - new Set(Object.values(this.assignments).flatMap(p => Object.keys(p.members || {}))).size
                    },
                    lastSync: new Date().toISOString()
                };

                // 驗證專案備註完整性
                console.log('📊 當前資料統計:');
                console.log('  - 專案數量:', Object.keys(assignmentData.assignments).length);

                let projectsWithNotes = 0;
                Object.keys(assignmentData.assignments).forEach(projectId => {
                    if (assignmentData.assignments[projectId].notes) {
                        projectsWithNotes++;
                        console.log(`  - ${projectId}: 有專案備註 ✅`);
                    }
                });
                console.log(`📝 有專案備註的專案: ${projectsWithNotes}/${Object.keys(assignmentData.assignments).length}`);

                // 同步到 Google Drive
                console.log('☁️ 開始同步專案配置到 Google Drive...');

                // 1. 更新舊格式（向後兼容）
                await window.googleDriveAPI.saveFile('project-assignments.json', assignmentData);
                console.log('☁️ project-assignments.json 已同步');

                // 2. 同時更新 unified-data.json（如果存在）
                if (this.useUnifiedStructure && this.unifiedData) {
                    console.log('☁️ 同步更新 unified-data.json...');

                    // 更新 unified-data 中的專案資料
                    for (const [projectId, assignment] of Object.entries(this.assignments)) {
                        if (!this.unifiedData.projects[projectId]) {
                            // 新專案：建立完整結構
                            this.unifiedData.projects[projectId] = {
                                projectId: assignment.projectId || projectId,
                                projectName: assignment.projectName || projectId,
                                description: "",
                                status: assignment.status || "active",
                                priority: 10,
                                progress: assignment.progress || 0,
                                metadata: {
                                    startDate: new Date().toISOString().split('T')[0],
                                    lastUpdated: assignment.lastUpdated || new Date().toISOString().split('T')[0],
                                    completeDate: null,
                                    repository: `https://github.com/mingxianliu/${projectId}`,
                                    featurePrefix: projectId.substring(0, 3).toUpperCase()
                                },
                                members: assignment.members || {},
                                memberHistory: assignment.memberHistory || [],
                                notes: assignment.notes || "[]",
                                coreMetrics: {
                                    frontend: { progress: 0, status: "🎯 規劃中", tasks: [] },
                                    backend: { progress: 0, status: "🎯 規劃中", tasks: [] },
                                    database: { progress: 0, status: "🎯 規劃中", tasks: [] },
                                    deployment: { progress: 0, status: "🎯 規劃中", tasks: [] },
                                    validation: { progress: 0, status: "🎯 規劃中", tasks: [] }
                                },
                                features: { completed: [], inProgress: [], planned: [] },
                                issues: [],
                                github: {
                                    owner: "mingxianliu",
                                    repo: projectId,
                                    stars: 0,
                                    forks: 0,
                                    openIssues: 0,
                                    language: "",
                                    lastPush: null
                                }
                            };
                        } else {
                            // 更新現有專案
                            this.unifiedData.projects[projectId].progress = assignment.progress;
                            this.unifiedData.projects[projectId].members = assignment.members;
                            this.unifiedData.projects[projectId].memberHistory = assignment.memberHistory;
                            this.unifiedData.projects[projectId].status = assignment.status;
                            this.unifiedData.projects[projectId].notes = assignment.notes;
                            this.unifiedData.projects[projectId].metadata.lastUpdated = assignment.lastUpdated;
                        }
                    }

                    // 更新統計
                    this.unifiedData.config.statistics = assignmentData.statistics;
                    this.unifiedData.metadata.lastSync = new Date().toISOString();

                    // 儲存到 Google Drive
                    await window.googleDriveAPI.saveFile('unified-data.json', this.unifiedData, 'unified');
                    console.log('☁️ unified-data.json 已同步');
                }

                // 更新同步狀態顯示
                const syncBtn = document.getElementById('syncBtn');
                if (syncBtn) {
                    const originalText = syncBtn.innerHTML;
                    syncBtn.innerHTML = '<i class="fas fa-check"></i> 已同步';
                    setTimeout(() => {
                        syncBtn.innerHTML = originalText;
                    }, 2000);
                }
            } else {
                console.log('⚠️ Google Drive 未登入，僅儲存到本地');
            }
        } catch (error) {
            console.error('❌ 儲存專案分配失敗:', error);
            throw error;
        }
    }

    // 儲存成員變更
    async saveMemberChanges() {
        try {
            console.log('📁 開始儲存成員資料...');
            console.log('📁 當前 members 數量:', Object.keys(this.members).length);
            console.log('📁 當前 members:', this.members);

            // 準備完整的團隊資料
            const teamData = {
                members: this.members,
                roles: this.roles,
                groups: this.teamConfig.groups || {},
                version: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };

            console.log('📁 準備儲存的完整資料:', teamData);

            // 1. 儲存到本地快取 (localStorage) 作為主要資料
            const dataString = JSON.stringify(teamData);
            localStorage.setItem('cachedTeamMembers', dataString);
            console.log('✅ 團隊成員已儲存到本地快取，大小:', dataString.length, 'bytes');

            // 驗證儲存
            const savedData = localStorage.getItem('cachedTeamMembers');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                console.log('✅ 驗證：本地快取已成功儲存，members 數量:', Object.keys(parsed.members).length);
            }

            // 2. 清除臨時變更記錄（因為已經儲存為主要資料）
            localStorage.removeItem('teamMemberChanges');
            console.log('✅ 已清除臨時變更記錄');

            // 3. 同步到 Google Drive
            if (window.googleDriveAPI && window.googleDriveAPI.isAuthenticated) {
                console.log('☁️ 開始同步到 Google Drive...');
                await window.googleDriveAPI.saveFile('team-members.json', teamData);
                console.log('☁️ 團隊成員已同步到 Google Drive');
            } else {
                console.log('⚠️ Google Drive 未登入，資料已儲存到本地');
            }

            // 4. 嘗試更新本地檔案（透過伺服器 API，如果有的話）
            // 注意：瀏覽器無法直接寫入本地檔案系統，需要後端 API
            console.log('ℹ️ 瀏覽器無法直接更新 config/team-members.json，需要手動下載或使用後端 API');

            return true;
        } catch (error) {
            console.error('❌ 儲存成員變更失敗:', error);
            throw error;
        }
    }

    // 獲取專案成員分配
    getProjectAssignments(projectId) {
        return this.assignments[projectId] || null;
    }

    // 獲取成員在專案中的角色
    getMemberRoleInProject(projectId, memberId) {
        const project = this.assignments[projectId];
        if (!project || !project.members[memberId]) {
            return null;
        }
        return project.members[memberId];
    }

    // 獲取所有成員
    getAllMembers() {
        return this.members;
    }

    // 獲取所有角色
    getAllRoles() {
        return this.roles;
    }

    // 獲取所有專案分配
    getAllAssignments() {
        return this.assignments;
    }

    // 檢查是否已初始化
    isReady() {
        return this.isInitialized;
    }
}

// 匯出給其他模組使用
window.TeamDataManager = TeamDataManager;