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
    }

    async init() {
        console.log('🚀 團隊資料管理器開始初始化...');
        try {
            console.log('📊 步驟1: 載入團隊資料');
            await this.loadTeamData();
            console.log('📊 步驟2: 載入專案分配');
            await this.loadAssignments();
            console.log('📊 步驟3: 載入本地變更');
            await this.loadLocalChanges();
            console.log('📊 步驟4: 載入本地成員變更');
            await this.loadLocalMemberChanges();
            this.isInitialized = true;
            console.log('[OK] 團隊資料管理器初始化完成 ✅');
            console.log('📊 初始化後的資料狀態:');
            console.log('  - members:', Object.keys(this.members).length, '個');
            console.log('  - assignments:', Object.keys(this.assignments).length, '個');
        } catch (error) {
            console.error('[ERROR] 團隊資料管理器初始化失敗:', error);
            console.error('❌ 錯誤堆疊:', error.stack);
            this.isInitialized = false;
        }
    }

    async loadTeamData() {
        try {
            console.log('🔄 開始載入團隊成員資料...');
            let data = null;

            // 優先嘗試從 Google Drive 載入
            if (window.googleDriveAPI && window.googleDriveAPI.isAuthenticated) {
                try {
                    console.log('☁️ 從 Google Drive 載入 team-members.json...');
                    const driveContent = await window.googleDriveAPI.loadFile('team-members.json');
                    if (driveContent) {
                        data = JSON.parse(driveContent);
                        console.log('☁️ Google Drive 團隊成員資料載入成功:', data);
                        console.log('☁️ members 數量:', Object.keys(data.members || {}).length);
                    }
                } catch (driveError) {
                    console.log('☁️ Google Drive 載入失敗，改用本地檔案:', driveError.message);
                }
            }

            // 如果 Google Drive 沒有資料或未登入，載入本地檔案
            if (!data) {
                console.log('📁 從本地載入 team-members.json...');
                const response = await fetch('config/team-members.json?v=' + Date.now());
                console.log('📁 team-members.json 回應狀態:', response.status, response.statusText);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                data = await response.json();
                console.log('📁 team-members.json 資料載入成功:', data);
                console.log('📁 members 數量:', Object.keys(data.members || {}).length);
            }

            // 先載入預設資料
            this.members = data.members;
            this.roles = data.roles;
            this.teamConfig = data; // 載入完整的團隊配置，包含 groups

            // 然後覆蓋本地儲存的變更（如果有的話）
            const savedMembers = localStorage.getItem('teamMemberChanges');
            if (savedMembers) {
                const localMembers = JSON.parse(savedMembers);
                console.log('🔄 本地成員變更:', localMembers);
                // 合併本地變更到成員資料，但跳過已刪除的成員
                Object.keys(localMembers).forEach(memberId => {
                    const localChange = localMembers[memberId];
                    if (localChange.deleted) {
                        console.log('⚠️ 跳過已刪除的成員:', memberId);
                        delete this.members[memberId];
                        if (this.teamConfig.members) {
                            delete this.teamConfig.members[memberId];
                        }
                    } else if (this.members[memberId]) {
                        this.members[memberId] = { ...this.members[memberId], ...localChange };
                        if (this.teamConfig.members) {
                            this.teamConfig.members[memberId] = { ...this.teamConfig.members[memberId], ...localChange };
                        }
                    }
                });
                console.log('已載入本地成員變更');
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

            // 優先嘗試從 Google Drive 載入
            if (window.googleDriveAPI && window.googleDriveAPI.isAuthenticated) {
                try {
                    console.log('☁️ 從 Google Drive 載入 project-assignments.json...');
                    const driveContent = await window.googleDriveAPI.loadFile('project-assignments.json');
                    if (driveContent) {
                        data = JSON.parse(driveContent);
                        console.log('☁️ 成功載入專案分配資料:', Object.keys(data.assignments).length, '個專案');
                        console.log('☁️ assignments 內容:', data.assignments);
                    }
                } catch (driveError) {
                    console.log('☁️ Google Drive 載入失敗，改用本地檔案:', driveError.message);
                }
            }

            // 如果 Google Drive 沒有資料或未登入，載入本地檔案
            if (!data) {
                console.log('📁 從本地載入 project-assignments.json...');
                const response = await fetch('config/project-assignments.json?v=' + Date.now());
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                data = await response.json();
                console.log('📁 成功載入專案分配資料:', Object.keys(data.assignments).length, '個專案');
                console.log('📁 assignments 內容:', data.assignments);
            }

            this.assignments = data.assignments;
            this.constraints = data.constraints;
        } catch (error) {
            console.error('❌ 載入專案分配資料失敗:', error);
            this.assignments = {};
            this.constraints = {};
        }
    }

    async loadLocalChanges() {
        try {
            const savedData = localStorage.getItem('teamAssignments');
            if (savedData) {
                const localAssignments = JSON.parse(savedData);
                // 合併本地變更到專案分配
                Object.keys(localAssignments).forEach(projectId => {
                    if (this.assignments[projectId]) {
                        this.assignments[projectId] = { ...this.assignments[projectId], ...localAssignments[projectId] };
                    } else {
                        this.assignments[projectId] = localAssignments[projectId];
                    }
                });
                console.log('已載入本地專案分配變更');
            }
        } catch (error) {
            console.error('載入本地變更失敗:', error);
        }
    }

    async loadLocalMemberChanges() {
        // 這裡可以加入更多本地成員變更的處理邏輯
        console.log('本地成員變更載入完成');
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
            console.log('📁 本地變更已儲存');

            // 同時儲存到 Google Drive
            if (window.googleDriveAPI && window.googleDriveAPI.isAuthenticated) {
                console.log('☁️ 儲存專案分配到 Google Drive...');
                const assignmentData = {
                    assignments: this.assignments,
                    constraints: this.constraints,
                    statistics: {
                        totalAssignments: Object.values(this.assignments).reduce((sum, project) => sum + Object.keys(project.members || {}).length, 0),
                        activeProjects: Object.values(this.assignments).filter(p => p.status === 'active').length,
                        completedProjects: Object.values(this.assignments).filter(p => p.status === 'completed').length,
                        membersInUse: new Set(Object.values(this.assignments).flatMap(p => Object.keys(p.members || {}))).size,
                        availableMembers: Object.keys(this.members).length - new Set(Object.values(this.assignments).flatMap(p => Object.keys(p.members || {}))).size
                    }
                };

                await window.googleDriveAPI.saveFile('project-assignments.json', JSON.stringify(assignmentData, null, 2));
                console.log('☁️ 專案分配已儲存到 Google Drive');
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
            const memberChanges = {};
            // 這裡可以比較原始資料和當前資料，只儲存變更
            localStorage.setItem('teamMemberChanges', JSON.stringify(memberChanges));
            console.log('📁 成員變更已儲存');

            // 同時儲存完整的團隊成員資料到 Google Drive
            if (window.googleDriveAPI && window.googleDriveAPI.isAuthenticated) {
                console.log('☁️ 儲存團隊成員到 Google Drive...');
                const teamData = {
                    members: this.members,
                    roles: this.roles,
                    groups: this.teamConfig.groups || {},
                    version: new Date().toISOString(),
                    lastUpdated: new Date().toISOString()
                };

                await window.googleDriveAPI.saveFile('team-members.json', JSON.stringify(teamData, null, 2));
                console.log('☁️ 團隊成員已儲存到 Google Drive');
            } else {
                console.log('⚠️ Google Drive 未登入，僅儲存到本地');
            }
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