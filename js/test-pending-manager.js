/**
 * 測試待辦標記管理器
 * 用於管理專案的待測試狀態標記
 */
class TestPendingManager {
    constructor() {
        this.storageKey = 'pending-tests';
        this.eventKey = 'github-webhook-event';
        this.init();
    }

    /**
     * 初始化管理器
     */
    async init() {
        // 監聽 GitHub webhook 事件（跨頁面通訊）
        window.addEventListener('storage', (e) => this.handleStorageEvent(e));

        // 從 Google Drive 載入待測試狀態
        await this.loadPendingTestsFromDrive();

        // 頁面載入時恢復待測試狀態
        this.restorePendingTests();

        console.log('✅ 測試待辦標記管理器已初始化');
    }

    /**
     * 從 Google Drive 載入待測試狀態
     */
    async loadPendingTestsFromDrive() {
        if (window.googleDriveAPI && window.googleDriveAPI.isSignedIn()) {
            try {
                const unifiedData = await window.googleDriveAPI.loadFile('unified-data.json');
                if (unifiedData && unifiedData.data && unifiedData.data.devLog && unifiedData.data.devLog.pendingTests) {
                    // 合併 Google Drive 和 localStorage 的資料
                    const localTests = this.getPendingTests();
                    const driveTests = unifiedData.data.devLog.pendingTests;
                    const mergedTests = { ...driveTests, ...localTests };

                    localStorage.setItem(this.storageKey, JSON.stringify(mergedTests));
                    console.log('☁️ 從 Google Drive 載入待測試狀態');
                }
            } catch (error) {
                console.warn('⚠️ 從 Google Drive 載入待測試狀態失敗:', error);
            }
        }
    }

    /**
     * 顯示專案待測試標記
     * @param {string} projectId - 專案ID
     */
    showProjectTestPending(projectId) {
        const indicator = document.getElementById(`project-test-${projectId}`);
        if (indicator) {
            indicator.style.display = 'inline-block';
            console.log(`📝 專案 ${projectId} 標記為待測試`);

            // 儲存到 localStorage
            this.savePendingTest(projectId, true);
        }
    }

    /**
     * 隱藏專案待測試標記
     * @param {string} projectId - 專案ID
     */
    hideProjectTestPending(projectId) {
        const indicator = document.getElementById(`project-test-${projectId}`);
        if (indicator) {
            indicator.style.display = 'none';
            console.log(`✅ 專案 ${projectId} 測試完成`);

            // 從 localStorage 移除
            this.savePendingTest(projectId, false);
        }
    }

    /**
     * 隱藏所有專案待測試標記
     */
    async hideAllProjectTestPending() {
        const indicators = document.querySelectorAll('[id^="project-test-"]');
        indicators.forEach(indicator => {
            indicator.style.display = 'none';
        });

        // 清空 localStorage
        localStorage.removeItem(this.storageKey);

        // 同步到 Google Drive
        if (window.googleDriveAPI && window.googleDriveAPI.isSignedIn()) {
            try {
                const unifiedData = await window.googleDriveAPI.loadFile('unified-data.json');
                if (unifiedData && unifiedData.data) {
                    if (!unifiedData.data.devLog) {
                        unifiedData.data.devLog = {};
                    }
                    unifiedData.data.devLog.pendingTests = {};
                    unifiedData.metadata.lastSync = new Date().toISOString();

                    await window.googleDriveAPI.saveFile('unified-data.json', unifiedData, 'unified');
                    console.log('☁️ 已清除 Google Drive 的待測試狀態');
                }
            } catch (error) {
                console.warn('⚠️ 清除 Google Drive 待測試狀態失敗:', error);
            }
        }

        console.log('🧹 清除所有專案測試標記');
    }

    /**
     * 儲存待測試狀態到 localStorage 和 Google Drive
     * @param {string} projectId - 專案ID
     * @param {boolean} status - 待測試狀態
     */
    async savePendingTest(projectId, status) {
        const pendingTests = this.getPendingTests();

        if (status) {
            pendingTests[projectId] = {
                status: true,
                timestamp: new Date().toISOString()
            };
        } else {
            delete pendingTests[projectId];
        }

        // 儲存到 localStorage
        localStorage.setItem(this.storageKey, JSON.stringify(pendingTests));

        // 同步到 Google Drive unified-data.json
        if (window.googleDriveAPI && window.googleDriveAPI.isSignedIn()) {
            try {
                const unifiedData = await window.googleDriveAPI.loadFile('unified-data.json');
                if (unifiedData && unifiedData.data) {
                    // 更新 devLog 中的 pendingTests
                    if (!unifiedData.data.devLog) {
                        unifiedData.data.devLog = {};
                    }
                    unifiedData.data.devLog.pendingTests = pendingTests;
                    unifiedData.metadata.lastSync = new Date().toISOString();

                    await window.googleDriveAPI.saveFile('unified-data.json', unifiedData, 'unified');
                    console.log('☁️ 待測試狀態已同步到 Google Drive');
                }
            } catch (error) {
                console.warn('⚠️ 同步待測試狀態到 Google Drive 失敗:', error);
            }
        }
    }

    /**
     * 取得所有待測試專案
     * @returns {Object} 待測試專案物件
     */
    getPendingTests() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    }

    /**
     * 處理 storage 事件（跨頁面通訊）
     * @param {StorageEvent} e - Storage 事件
     */
    handleStorageEvent(e) {
        if (e.key === this.eventKey && e.newValue) {
            try {
                const event = JSON.parse(e.newValue);
                console.log('📨 收到 GitHub webhook 事件:', event);

                if (event.action === 'push' && event.project) {
                    console.log(`🔔 標記 ${event.project} 為待測試`);
                    this.showProjectTestPending(event.project);
                } else if (event.action === 'merge') {
                    console.log('🔔 清除所有待測試標記');
                    this.hideAllProjectTestPending();
                }

                // 清除事件，避免重複處理
                localStorage.removeItem(this.eventKey);
            } catch (error) {
                console.error('❌ 處理 webhook 事件失敗:', error);
            }
        }
    }

    /**
     * 恢復頁面載入前的待測試狀態
     */
    restorePendingTests() {
        const pendingTests = this.getPendingTests();
        Object.keys(pendingTests).forEach(projectId => {
            if (pendingTests[projectId] && pendingTests[projectId].status) {
                console.log(`🔄 恢復待測試標記: ${projectId}`);
                const indicator = document.getElementById(`project-test-${projectId}`);
                if (indicator) {
                    indicator.style.display = 'inline-block';
                }
            }
        });
    }

    /**
     * 手動標記專案為待測試（用於測試或手動操作）
     * @param {string} projectId - 專案ID
     */
    manualMarkPending(projectId) {
        console.log(`👆 手動標記 ${projectId} 為待測試`);
        this.showProjectTestPending(projectId);
    }

    /**
     * 手動清除專案待測試標記（用於測試或手動操作）
     * @param {string} projectId - 專案ID
     */
    manualClearPending(projectId) {
        console.log(`👆 手動清除 ${projectId} 待測試標記`);
        this.hideProjectTestPending(projectId);
    }
}

// 全域初始化
window.testPendingManager = null;

// DOM 載入完成後初始化
document.addEventListener('DOMContentLoaded', () => {
    window.testPendingManager = new TestPendingManager();

    // 提供向後相容的全域函數
    window.showProjectTestPending = (projectId) => window.testPendingManager.showProjectTestPending(projectId);
    window.hideProjectTestPending = (projectId) => window.testPendingManager.hideProjectTestPending(projectId);
    window.hideAllProjectTestPending = () => window.testPendingManager.hideAllProjectTestPending();
});
