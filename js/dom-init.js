/**
 * DOM 初始化模組
 * 負責 DOMContentLoaded 事件和應用程式啟動
 */

// 檢查認證狀態（需要確保 protect-project-assignments.js 已載入）
function checkAuthentication() {
    if (typeof window.checkAuthentication === 'function') {
        return window.checkAuthentication();
    }
    // 如果認證函數不存在，預設為已認證
    console.warn('⚠️ 認證函數不存在，預設為已認證');
    return true;
}

// 啟動 Dashboard 的主要邏輯
async function startDashboard() {
    console.log('📋 檢查類別載入狀態:');
    console.log('- TeamDataManager:', !!window.TeamDataManager);
    console.log('- TeamStatistics:', !!window.TeamStatistics);
    console.log('- TeamUIComponents:', !!window.TeamUIComponents);
    console.log('- TeamManagement:', !!window.TeamManagement);
    console.log('- teamManagement 實例:', !!window.teamManagement);

    // 檢查是否已通過私鑰驗證
    if (!checkAuthentication()) {
        // 未驗證禁止初始化 Dashboard
        return;
    }

    try {
        // 初始化團隊資料管理器
        if (!window.teamDataManager) {
            // 建立全域單例
            if (!window.globalTeamDataManager) {
                window.globalTeamDataManager = new TeamDataManager();
                await window.globalTeamDataManager.init();
            }
            window.teamDataManager = window.globalTeamDataManager;
        }

        // 自動執行 Pull 操作（登入後自動同步最新資料）
        if (window.googleDriveAPI && window.googleDriveAPI.isAuthenticated) {
            try {
                console.log('🔄 自動從 Google Drive 拉取最新資料...');
                await pullFilesFromGoogleDrive();

                // 暫時禁用定時自動 Push 以防止資料遺失
                console.log('🚫 定時自動 Push 已禁用以防止資料遺失');
                if (false && !window.autoPushInterval) {
                    window.autoPushInterval = setInterval(async () => {
                        try {
                            console.log('⏰ 定時自動 Push 到 Google Drive...');
                            await pushFilesToGoogleDrive();
                        } catch (error) {
                            console.error('⏰ 定時 Push 失敗:', error);
                        }
                    }, 5 * 60 * 1000); // 每5分鐘
                }
            } catch (error) {
                console.error('❌ 自動 Pull 失敗:', error);
            }
        }

        // 初始化事件處理器
        if (window.initializeEventHandlers) {
            window.initializeEventHandlers();
        }

        // 載入並顯示資料
        await window.loadDataDirectly();

        // 設置定時檢查 localStorage 信號
        setInterval(() => {
            try {
                const signal = localStorage.getItem('teamUpdateSignal');
                if (signal) {
                    const signalData = JSON.parse(signal);
                    if (signalData.action === 'teamDataUpdate') {
                        console.log('📢 收到團隊資料更新信號，重新載入資料...');
                        window.loadDataDirectly();
                        localStorage.removeItem('teamUpdateSignal');
                    }
                }
            } catch (e) {
                // 忽略解析錯誤
            }
        }, 500);

    } catch (error) {
        console.error('Dashboard 初始化失敗:', error);
    }
}

// DOM 載入完成後啟動
document.addEventListener('DOMContentLoaded', startDashboard);