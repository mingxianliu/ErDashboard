/**
 * 研發記錄簿管理系統
 * 支援總體記錄和個別專案記錄
 */

class DevLogManager {
    constructor() {
        this.devLogs = {
            global: [],        // 總體記錄
            projects: {}       // 個別專案記錄 { projectId: [] }
        };
        this.filename = 'dev-logs.json';
        this.isLoaded = false;
    }

    /**
     * 載入研發記錄
     */
    async loadDevLogs() {
        try {
            // 先嘗試從本地快取載入
            const cachedData = localStorage.getItem('cachedDevLogs');
            if (cachedData) {
                try {
                    this.devLogs = JSON.parse(cachedData);
                    console.log('✅ 從本地快取載入研發記錄', this.devLogs);
                } catch (e) {
                    console.warn('⚠️ 本地快取解析失敗，使用預設結構');
                    this.devLogs = { global: [], projects: {} };
                }
            } else {
                this.devLogs = { global: [], projects: {} };
            }

            // 嘗試從 Google Drive 載入
            if (window.googleDriveAPI && window.googleDriveAPI.isSignedIn()) {
                try {
                    console.log('🔄 嘗試從 Google Drive 載入研發記錄...');
                    const driveData = await window.googleDriveAPI.loadFile(this.filename);
                    if (driveData) {
                        // 處理包裝格式的資料
                        const actualData = driveData.data || driveData;
                        if (actualData && (actualData.global || actualData.projects)) {
                            this.devLogs = actualData;
                            // 更新本地快取
                            localStorage.setItem('cachedDevLogs', JSON.stringify(this.devLogs));
                            console.log('✅ 從 Google Drive 載入研發記錄成功', this.devLogs);
                        }
                    }
                } catch (driveError) {
                    console.warn('⚠️ Google Drive 載入失敗，使用本地資料:', driveError.message);
                }
            }

            // 確保結構正確
            if (!this.devLogs.global) this.devLogs.global = [];
            if (!this.devLogs.projects) this.devLogs.projects = {};

            this.isLoaded = true;
            return this.devLogs;
        } catch (error) {
            console.error('❌ 載入研發記錄失敗:', error);
            this.devLogs = { global: [], projects: {} };
            this.isLoaded = true;
            return this.devLogs;
        }
    }

    /**
     * 儲存研發記錄
     */
    async saveDevLogs() {
        try {
            if (!this.isLoaded) {
                await this.loadDevLogs();
            }

            // 儲存到本地快取
            localStorage.setItem('cachedDevLogs', JSON.stringify(this.devLogs));
            console.log('✅ 研發記錄已儲存到本地');

            // 嘗試儲存到 Google Drive
            if (window.googleDriveAPI && window.googleDriveAPI.isSignedIn()) {
                try {
                    console.log('🔄 儲存研發記錄到 Google Drive...');
                    await window.googleDriveAPI.saveFile(this.filename, this.devLogs);
                    console.log('✅ 研發記錄已同步到 Google Drive');
                    return true;
                } catch (driveError) {
                    console.warn('⚠️ Google Drive 儲存失敗，但本地已儲存:', driveError.message);
                    return true; // 本地儲存成功就算成功
                }
            } else {
                console.log('⚠️ Google Drive 未登入，僅儲存到本地');
                return true;
            }
        } catch (error) {
            console.error('❌ 儲存研發記錄失敗:', error);
            return false;
        }
    }

    /**
     * 新增總體記錄
     * @param {string} content - 記錄內容
     * @param {string} member - 成員名稱
     */
    async addGlobalLog(content, member) {
        if (!this.isLoaded) {
            await this.loadDevLogs();
        }

        const log = {
            id: Date.now().toString(),
            content: content.trim(),
            member: member,
            timestamp: new Date().toISOString(),
            type: 'global'
        };

        this.devLogs.global.unshift(log); // 新記錄排在前面
        await this.saveDevLogs();
        return log;
    }

    /**
     * 新增專案記錄
     * @param {string} projectId - 專案ID
     * @param {string} content - 記錄內容
     * @param {string} member - 成員名稱
     */
    async addProjectLog(projectId, content, member) {
        if (!this.isLoaded) {
            await this.loadDevLogs();
        }

        if (!this.devLogs.projects[projectId]) {
            this.devLogs.projects[projectId] = [];
        }

        const log = {
            id: Date.now().toString(),
            content: content.trim(),
            member: member,
            timestamp: new Date().toISOString(),
            type: 'project',
            projectId: projectId
        };

        this.devLogs.projects[projectId].unshift(log); // 新記錄排在前面
        await this.saveDevLogs();
        return log;
    }

    /**
     * 刪除記錄
     * @param {string} logId - 記錄ID
     * @param {string} type - 記錄類型 ('global' 或 'project')
     * @param {string} projectId - 專案ID (type='project'時需要)
     */
    async deleteLog(logId, type, projectId = null) {
        if (!this.isLoaded) {
            await this.loadDevLogs();
        }

        if (type === 'global') {
            this.devLogs.global = this.devLogs.global.filter(log => log.id !== logId);
        } else if (type === 'project' && projectId) {
            if (this.devLogs.projects[projectId]) {
                this.devLogs.projects[projectId] = this.devLogs.projects[projectId].filter(log => log.id !== logId);
            }
        }

        await this.saveDevLogs();
        return true;
    }

    /**
     * 清空記錄
     * @param {string} type - 記錄類型 ('global' 或 'project')
     * @param {string} projectId - 專案ID (type='project'時需要)
     */
    async clearLogs(type, projectId = null) {
        if (!this.isLoaded) {
            await this.loadDevLogs();
        }

        if (type === 'global') {
            this.devLogs.global = [];
        } else if (type === 'project' && projectId) {
            this.devLogs.projects[projectId] = [];
        }

        await this.saveDevLogs();
        return true;
    }

    /**
     * 取得總體記錄
     * @param {number} limit - 限制筆數 (可選)
     */
    async getGlobalLogs(limit = null) {
        if (!this.isLoaded) {
            await this.loadDevLogs();
        }

        const logs = this.devLogs.global || [];
        return limit ? logs.slice(0, limit) : logs;
    }

    /**
     * 取得專案記錄
     * @param {string} projectId - 專案ID
     * @param {number} limit - 限制筆數 (可選)
     */
    async getProjectLogs(projectId, limit = null) {
        if (!this.isLoaded) {
            await this.loadDevLogs();
        }

        const logs = this.devLogs.projects[projectId] || [];
        return limit ? logs.slice(0, limit) : logs;
    }

    /**
     * 取得所有專案的記錄統計
     */
    async getProjectsLogStats() {
        if (!this.isLoaded) {
            await this.loadDevLogs();
        }

        const stats = {};
        for (const [projectId, logs] of Object.entries(this.devLogs.projects)) {
            stats[projectId] = {
                count: logs.length,
                lastUpdate: logs.length > 0 ? logs[0].timestamp : null
            };
        }
        return stats;
    }

    /**
     * 格式化時間戳記
     * @param {string} timestamp - ISO 時間字串
     */
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return '剛剛';
        } else if (diffMins < 60) {
            return `${diffMins} 分鐘前`;
        } else if (diffHours < 24) {
            return `${diffHours} 小時前`;
        } else if (diffDays < 7) {
            return `${diffDays} 天前`;
        } else {
            return date.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
}

// 導出類別
window.DevLogManager = DevLogManager;

// 全域實例留空，由主頁面初始化
// window.devLogManager = new DevLogManager();