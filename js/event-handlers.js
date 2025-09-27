/**
 * 事件處理器模組
 * 負責頁面主要按鈕和事件的處理邏輯
 */

// Google Drive 相關事件處理器
window.setupGoogleDriveHandlers = function() {
    // 雲端設定按鈕
    document.getElementById('gdriveSetupBtn').addEventListener('click', function() {
        console.log('⚙️ 雲端設定按鈕被點擊');
        if (window.googleDriveAPI && !window.googleDriveAPI.isAuthenticated) {
            window.googleDriveAPI.signIn();
        } else {
            console.log('📂 Google Drive 已登入，開啟檔案管理選項');
            alert('Google Drive 已連接！');
        }
    });

    // 同步按鈕 (Push)
    document.getElementById('syncBtn').addEventListener('click', async function() {
        try {
            console.log('⬆️ Push 按鈕被點擊');
            await pushFilesToGoogleDrive();
        } catch (error) {
            console.error('❌ Push 操作失敗:', error);
            alert('Push 操作失敗: ' + error.message);
        }
    });

    // 拉取按鈕 (Pull)
    document.getElementById('pullBtn').addEventListener('click', async function() {
        try {
            console.log('⬇️ Pull 按鈕被點擊');
            await pullFilesFromGoogleDrive();
        } catch (error) {
            console.error('❌ Pull 操作失敗:', error);
            alert('Pull 操作失敗: ' + error.message);
        }
    });

    // 同步角色備註按鈕
    document.getElementById('syncRoleNotesBtn').addEventListener('click', async function() {
        try {
            console.log('📝 同步角色備註按鈕被點擊');
            await syncRoleNotesToGoogleDrive();
        } catch (error) {
            console.error('❌ 同步角色備註失敗:', error);
            alert('同步角色備註失敗: ' + error.message);
        }
    });

    // 修復角色按鈕
    document.getElementById('fixRolesBtn').addEventListener('click', async function() {
        try {
            console.log('🔧 修復角色按鈕被點擊');
            await fixRoleData();
        } catch (error) {
            console.error('❌ 修復角色失敗:', error);
            alert('修復角色失敗: ' + error.message);
        }
    });
};

// 頁面控制相關事件處理器
window.setupPageHandlers = function() {
    // 重新載入按鈕
    document.getElementById('refreshBtn').addEventListener('click', function() {
        console.log('🔄 重新載入按鈕被點擊');
        location.reload();
    });

    // 測試推送按鈕
    document.getElementById('testPushBtn').addEventListener('click', function() {
        console.log('🧪 測試推送按鈕被點擊');
        if (window.showPushNotification) {
            window.showPushNotification();
        }
    });

    // 團隊管理按鈕
    document.getElementById('teamManagementBtn').addEventListener('click', async function() {
        try {
            console.log('👥 團隊管理按鈕被點擊');

            // 確保 TeamManagement 類別已載入
            if (!window.TeamManagement) {
                throw new Error('TeamManagement 類別未載入');
            }

            // 確保已有 teamDataManager
            if (!window.teamDataManager) {
                await window.loadDataDirectly();
            }

            // 創建或使用現有的 TeamManagement 實例
            if (!window.teamManagement) {
                window.teamManagement = new window.TeamManagement();
            }

            // 開啟團隊管理介面
            await window.teamManagement.showTeamManagement();

        } catch (error) {
            console.error('❌ 開啟團隊管理失敗:', error);
            console.error('錯誤堆疊:', error.stack);
            alert('開啟團隊管理失敗: ' + error.message);
        }
    });

    // 研發記錄簿按鈕
    document.getElementById('devLogBtn').addEventListener('click', function() {
        console.log('📋 研發記錄簿按鈕被點擊');
        window.location.href = 'dev-log.html';
    });
};

// 初始化所有事件處理器
window.initializeEventHandlers = function() {
    console.log('🎯 初始化事件處理器...');
    window.setupGoogleDriveHandlers();
    window.setupPageHandlers();
    console.log('✅ 事件處理器初始化完成');
};