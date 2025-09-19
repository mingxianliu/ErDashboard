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

            // 1. 優先從本地快取載入（最新的儲存資料）
            const cachedData = localStorage.getItem('cachedTeamMembers');
            if (cachedData) {
                try {
                    data = JSON.parse(cachedData);
                    console.log('💾 從本地快取載入團隊成員資料');
                    console.log('💾 快取資料大小:', cachedData.length, 'bytes');
                    console.log('💾 members 數量:', Object.keys(data.members || {}).length);
                    console.log('💾 快取中的成員資料:', data.members);
                } catch (e) {
                    console.error('💾 本地快取資料解析失敗:', e);
                    data = null; // 確保重置 data
                }
            } else {
                console.log('💾 沒有找到本地快取資料');
            }

            // 2. 如果沒有快取，嘗試從 Google Drive 載入
            if (!data && window.googleDriveAPI && window.googleDriveAPI.isAuthenticated) {
                try {
                    console.log('☁️ 從 Google Drive 載入 team-members.json...');
                    const driveContent = await window.googleDriveAPI.loadFile('team-members.json');
                    if (driveContent) {
                        data = JSON.parse(driveContent);
                        console.log('☁️ Google Drive 團隊成員資料載入成功');
                        console.log('☁️ members 數量:', Object.keys(data.members || {}).length);
                        // 儲存到本地快取
                        localStorage.setItem('cachedTeamMembers', driveContent);
                    }
                } catch (driveError) {
                    console.log('☁️ Google Drive 載入失敗:', driveError.message);
                }
            }

            // 3. 如果還是沒有資料，載入本地檔案
            if (!data) {
                console.log('📁 從本地檔案載入 team-members.json...');
                const response = await fetch('config/team-members.json?v=' + Date.now());
                console.log('📁 team-members.json 回應狀態:', response.status, response.statusText);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                data = await response.json();
                console.log('📁 team-members.json 資料載入成功');
                console.log('📁 members 數量:', Object.keys(data.members || {}).length);
                // 儲存到本地快取
                localStorage.setItem('cachedTeamMembers', JSON.stringify(data));
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
                await window.googleDriveAPI.saveFile('team-members.json', JSON.stringify(teamData, null, 2));
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