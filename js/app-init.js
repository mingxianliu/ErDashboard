/**
 * 應用程式初始化模組
 * 負責 TeamDataManager 實例管理和資料載入
 */

// 安全取得 TeamDataManager 實例的輔助函數
async function getTeamDataManager() {
    // 優先使用現有的全域實例
    if (window.globalTeamDataManager && window.globalTeamDataManager.isReady()) {
        return window.globalTeamDataManager;
    }
    if (window.teamDataManager && window.teamDataManager.isReady()) {
        return window.teamDataManager;
    }

    // 如果沒有可用實例，創建新的
    console.log('⚠️ 創建新的 TeamDataManager 實例');
    const teamDataManager = new window.TeamDataManager();
    await teamDataManager.init();

    // 設為全域實例
    window.globalTeamDataManager = teamDataManager;
    window.teamDataManager = teamDataManager;

    return teamDataManager;
}

// 使用 TeamDataManager 載入資料
// 設為全域函數以便其他視窗可以呼叫
window.loadDataDirectly = async function loadDataDirectly() {
    try {
        // 等待 Google Drive API 準備好
        if (window.googleDriveAPI) {
            let waitCount = 0;
            while (!window.googleDriveAPI.isReady() && waitCount < 10) {
                await new Promise(resolve => setTimeout(resolve, 500));
                waitCount++;
            }

            // 檢查並嘗試 Google Drive 自動登入
            if (window.googleDriveAPI.isReady() && !window.googleDriveAPI.isSignedIn()) {
                try {
                    const loginSuccess = await window.googleDriveAPI.signIn();
                    if (loginSuccess) {
                    } else {
                    }
                } catch (loginError) {
                    console.log('❌ Google Drive 自動登入錯誤:', loginError);
                }
            } else if (!window.googleDriveAPI.isReady()) {
            }
        }

        // 確保 TeamDataManager 存在
        if (!window.TeamDataManager) {
            throw new Error('TeamDataManager 未載入');
        }

        // 使用或創建全域 TeamDataManager
        let teamDataManager = window.globalTeamDataManager || window.teamDataManager;
        if (!teamDataManager) {
            teamDataManager = new window.TeamDataManager();
            await teamDataManager.init();
            window.globalTeamDataManager = teamDataManager;
            window.teamDataManager = teamDataManager;
        } else {
            // 檢查是否需要重新初始化（避免覆蓋剛同步的資料）
            if (!teamDataManager.isReady()) {
                await teamDataManager.init();
            } else {
            }
        }

        // 載入任務範本資料（如果還沒載入）
        if (!window.taskTemplatesData) {
            try {
                // 1. 優先從本地快取載入
                const cachedTemplates = localStorage.getItem('cachedTaskTemplates');
                if (cachedTemplates) {
                    window.taskTemplatesData = JSON.parse(cachedTemplates);
                } else {
                    // 2. 從本地檔案載入
                    const templateResponse = await fetch('config/task-templates.json?v=' + Date.now());
                    if (templateResponse.ok) {
                        window.taskTemplatesData = await templateResponse.json();
                        // 儲存到快取
                        localStorage.setItem('cachedTaskTemplates', JSON.stringify(window.taskTemplatesData));
                    }
                }
            } catch (templateError) {
                console.warn('載入任務範本失敗:', templateError);
                window.taskTemplatesData = { taskTemplates: {} };
            }
        }

        return teamDataManager;
    } catch (error) {
        console.error('❌ 載入資料失敗:', error);
        throw error;
    }
};

// 初始化應用程式
window.initializeApp = async function() {
    try {
        const teamDataManager = await window.loadDataDirectly();
        console.log('✅ 應用程式初始化完成');
        return teamDataManager;
    } catch (error) {
        console.error('❌ 應用程式初始化失敗:', error);
        throw error;
    }
};