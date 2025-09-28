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

                        // 檢查是否來自手動同步工具、手動同步按鈕、研發記錄簿總體指標或專案進度更新
                        const isFromGlobalMetric = window._globalMetricUpdate === true;
                        const isFromProgressUpdate = window._progressUpdate === true;
                        const isManualSync = window.location.pathname.includes('manual-sync.html');
                        const hasValidData = data.assignments && Object.keys(data.assignments).length >= 7 && projectsWithNotes >= 3;

                        console.log('🔍 檢查寫入權限:');
                        console.log(`  - 來自手動同步頁面: ${isManualSync}`);
                        console.log(`  - 來自總體指標更新: ${isFromGlobalMetric}`);
                        console.log(`  - 來自專案進度更新: ${isFromProgressUpdate}`);
                        console.log(`  - 資料完整性檢查: ${hasValidData}`);

                        if (isManualSync || isFromGlobalMetric || isFromProgressUpdate || hasValidData) {
                            console.log('✅ 資料驗證通過，允許同步');
                            console.log(`  - 專案數量: ${Object.keys(data.assignments).length}`);
                            console.log(`  - 有專案備註: ${projectsWithNotes}個`);
                            if (isFromGlobalMetric) {
                                console.log('🎯 總體指標更新：允許專案備註同步');
                            }
                            if (isFromProgressUpdate) {
                                console.log('📊 專案進度更新：允許專案資料同步');
                            }
                            return originalSaveFile.call(this, filename, data, type);
                        }
                    }

                    alert('🚫 寫入 project-assignments.json 已被緊急阻止！\n\n請使用 manual-sync.html 進行安全的手動同步。');
                    return Promise.reject('被緊急保護機制阻止');
                }

                // 允許其他檔案正常上傳（如 dev-logs.json、role-notes 等）
                if (filename !== 'project-assignments.json') {
                    console.log(`✅ 允許上傳: ${filename}`);
                } else {
                    console.log(`🔄 其他操作: ${filename}`);
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