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
            if (window.teamDataManager && window.teamDataManager.isLoaded) {
                const data = await window.teamDataManager.loadFile(this.filename);
                if (data) {
                    this.devLogs = data;
                    console.log('✅ 研發記錄載入成功', this.devLogs);
                } else {
                    console.log('ℹ️ 尚無研發記錄，使用預設結構');
                    this.devLogs = { global: [], projects: {} };
                }
            } else {
                console.log('⚠️ TeamDataManager 未載入，使用預設結構');
                this.devLogs = { global: [], projects: {} };
            }
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

            if (window.teamDataManager) {
                await window.teamDataManager.saveFile(this.filename, this.devLogs);
                console.log('✅ 研發記錄儲存成功');
                return true;
            } else {
                console.error('❌ TeamDataManager 未載入，無法儲存');
                return false;
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

// 全域實例
window.devLogManager = new DevLogManager();