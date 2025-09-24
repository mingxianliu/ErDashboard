// 緊急保護腳本：完全阻止對 project-assignments.json 的寫入操作
(function() {
    'use strict';

    function installProtection() {
        if (window.googleDriveAPI && window.googleDriveAPI.saveFile) {
            const originalSaveFile = window.googleDriveAPI.saveFile;

            window.googleDriveAPI.saveFile = function(filename, data, type) {
                if (filename === 'project-assignments.json') {
                    console.error('🚫🚫🚫 BLOCKED: 嘗試寫入 project-assignments.json 被阻止！');
                    console.error('📍 調用位置:', new Error().stack);

                    if (data && data.assignments) {
                        console.log('📊 被阻止的資料統計:');
                        console.log('  - 專案數量:', Object.keys(data.assignments).length);

                        let projectsWithNotes = 0;
                        Object.keys(data.assignments).forEach(projectId => {
                            if (data.assignments[projectId].notes) {
                                projectsWithNotes++;
                            }
                        });
                        console.log(`  - 有專案備註的專案: ${projectsWithNotes}/${Object.keys(data.assignments).length}`);
                    }

                    alert('🚫 寫入 project-assignments.json 已被緊急阻止！\n\n檢查控制台以查看詳細資訊。');
                    return Promise.reject('被緊急保護機制阻止');
                }

                return originalSaveFile.call(this, filename, data, type);
            };

            console.log('🛡️ project-assignments.json 保護機制已啟用');
            window.googleDriveAPI._protected = true;
        } else {
            console.log('⏳ Google Drive API 尚未載入，1秒後重試...');
            setTimeout(installProtection, 1000);
        }
    }

    // 立即安裝保護
    installProtection();

    // 定期檢查保護是否還在
    setInterval(() => {
        if (window.googleDriveAPI && !window.googleDriveAPI._protected) {
            console.log('🔄 重新安裝保護機制');
            installProtection();
        }
    }, 5000);

})();