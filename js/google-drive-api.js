/**
 * Google Drive API 整合模組
 * 提供直接讀寫 Google Drive 檔案的功能
 * 使用 Google Identity Services (新版 OAuth)
 */

class GoogleDriveAPI {
    constructor() {
        // 先不設定 token，等驗證有效性後再設定
        this.accessToken = null;
        this.folderId = 'YOUR_FOLDER_ID_HERE';
        this.tokenClient = null;
        this.isAuthenticated = false;
        this.isConfigured = false;
        this.initGoogleAPI();
    }

    // 初始化 Google API
    async initGoogleAPI() {
        try {
            console.log('🚀 初始化 Google Drive API...');

            // 載入 Google API 和 Identity Services
            await this.loadGoogleAPIScript();
            await this.loadGoogleIdentityServices();

            // 初始化 GAPI Client
            await new Promise((resolve) => {
                gapi.load('client', resolve);
            });

            await gapi.client.init({
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            });

            // 檢查設定檔或 sessionStorage 中的設定
            let config = null;

            // 優先從 sessionStorage 讀取（線上版本）
            const storedConfig = sessionStorage.getItem('GOOGLE_DRIVE_CONFIG');
            if (storedConfig) {
                try {
                    config = JSON.parse(storedConfig);
                } catch (error) {
                    console.error('解析 Google Drive 設定失敗:', error);
                }
            }

            // 如果沒有 sessionStorage 設定，則嘗試讀取 config.js（本地版本）
            if (!config && window.GOOGLE_DRIVE_CONFIG) {
                config = window.GOOGLE_DRIVE_CONFIG;
            }

            if (!config) {
                console.warn('⚠️ Google Drive 設定未載入，功能將被停用');
                this.isConfigured = false;
                return;
            }

            // 從設定取得 Client ID
            const CLIENT_ID = config.CLIENT_ID;
            this.folderId = config.FOLDER_ID;
            const SCOPES = config.SCOPES || 'https://www.googleapis.com/auth/drive.file';

            if (!CLIENT_ID || CLIENT_ID === '你的-client-id.apps.googleusercontent.com' || CLIENT_ID === 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com') {
                console.warn('⚠️ Google Client ID 未設定，Google Drive 功能將被停用');
                this.isConfigured = false;
                return;
            }

            if (!this.folderId || this.folderId === 'YOUR_FOLDER_ID_HERE') {
                console.warn('⚠️ Google Drive 資料夾 ID 未設定，Google Drive 功能將被停用');
                this.isConfigured = false;
                return;
            }

            console.log('📝 使用設定:', {
                clientId: CLIENT_ID.substring(0, 20) + '...',
                folderId: this.folderId.substring(0, 10) + '...',
                scopes: SCOPES
            });

            this.isConfigured = true;

            // 檢查 sessionStorage 中是否有 token 並驗證其有效性
            const savedToken = sessionStorage.getItem('google_access_token');
            if (savedToken) {
                this.accessToken = savedToken;
                // 嘗試驗證 token 是否仍然有效
                try {
                    const testResponse = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=1', {
                        headers: {
                            'Authorization': `Bearer ${savedToken}`
                        }
                    });
                    if (testResponse.ok) {
                        this.isAuthenticated = true;
                        console.log('✅ 使用已儲存的有效 token');

                        // 自動執行同步（不重新載入頁面，避免無限循環）
                        setTimeout(async () => {
                            try {
                                console.log('🔄 自動執行初始同步...');
                                await this.syncRoleNotesFromGitHub();
                                if (typeof window.pullFilesFromGoogleDrive === 'function') {
                                    await window.pullFilesFromGoogleDrive();
                                }
                            } catch (error) {
                                console.error('初始同步失敗:', error);
                            }
                        }, 1000); // 延遲1秒，確保頁面準備好
                    } else {
                        // Token 無效，清除它
                        sessionStorage.removeItem('google_access_token');
                        this.accessToken = null;
                        console.log('⚠️ 已儲存的 token 無效，需要重新登入');
                    }
                } catch (error) {
                    // Token 無效，清除它
                    sessionStorage.removeItem('google_access_token');
                    this.accessToken = null;
                }
            }

            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: async (response) => {
                    if (response.access_token) {
                        this.accessToken = response.access_token;
                        this.isAuthenticated = true;
                        sessionStorage.setItem('google_access_token', response.access_token);
                        console.log('✅ Google Drive OAuth 成功');

                        // 登入成功後自動同步資料
                        await this.onLoginSuccess();
                    } else {
                        console.error('❌ OAuth 回應沒有 access_token');
                    }
                },
            });

            console.log('✅ Google Drive API 初始化完成');
        } catch (error) {
            console.error('❌ Google API 初始化失敗:', error);
            this.isConfigured = false;
            this.tokenClient = null;
        }
    }

    // 載入 Google Identity Services
    async loadGoogleIdentityServices() {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.accounts) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // 載入 Google API Script
    loadGoogleAPIScript() {
        return new Promise((resolve, reject) => {
            if (window.gapi) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // 登入 Google Drive (新版 OAuth)
    async signIn() {
        try {
            // 如果 tokenClient 未初始化，嘗試重新初始化
            if (!this.tokenClient) {
                console.log('🔄 Token client 未初始化，嘗試重新初始化...');
                await this.initGoogleAPI();

                if (!this.tokenClient) {
                    throw new Error('Google Drive API 初始化失敗，請檢查設定');
                }
            }

            console.log('🔐 開始 Google Drive 登入...');

            // 使用新版 OAuth 流程
            return new Promise((resolve) => {
                const originalCallback = this.tokenClient.callback;
                this.tokenClient.callback = (response) => {
                    // 恢復原始 callback
                    this.tokenClient.callback = originalCallback;

                    if (response.access_token) {
                        this.accessToken = response.access_token;
                        this.isAuthenticated = true;
                        sessionStorage.setItem('google_access_token', response.access_token);
                        console.log('✅ Google Drive 登入成功');

                        // 登入成功後自動同步資料
                        this.onLoginSuccess();
                        resolve(true);
                    } else {
                        console.error('❌ 登入失敗：沒有取得 access token');
                        resolve(false);
                    }
                };

                this.tokenClient.requestAccessToken();
            });

        } catch (error) {
            console.error('❌ Google Drive 登入失敗:', error);
            return false;
        }
    }

    // 檢查是否已登入
    isSignedIn() {
        return this.isAuthenticated && this.accessToken !== null;
    }

    // 檢查 API 是否已準備好
    isReady() {
        return this.isConfigured && this.tokenClient !== null;
    }

    // 登出
    signOut() {
        this.accessToken = null;
        this.isAuthenticated = false;
        sessionStorage.removeItem('google_access_token');
        console.log('✅ Google Drive 已登出');
    }

    // 登入成功後的處理
    async onLoginSuccess() {
        try {
            console.log('🔄 登入成功，自動同步最新資料...');

            // 1. 先同步 GitHub 上的角色備註
            await this.syncRoleNotesFromGitHub();

            // 2. 然後同步 Google Drive 資料
            if (typeof window.pullFilesFromGoogleDrive === 'function') {
                await window.pullFilesFromGoogleDrive();
                console.log('✅ Google Drive 同步完成');
            }

            // 3 秒後自動重新載入頁面
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        } catch (error) {
            console.error('自動同步失敗:', error);
        }
    }

    // 從 GitHub 同步角色備註
    async syncRoleNotesFromGitHub() {
        try {
            console.log('📝 檢查 GitHub 角色備註更新...');

            // 讀取 GitHub 上的角色備註檔案
            const roleNotes = await this.fetchRoleNotes();

            if (roleNotes.length > 0) {
                console.log(`📝 發現 ${roleNotes.length} 個角色備註，開始同步...`);

                // 應用角色備註到系統
                await this.applyRoleNotes(roleNotes);

                console.log('✅ GitHub 角色備註同步完成');
            } else {
                console.log('📋 沒有新的角色備註');
            }
        } catch (error) {
            console.error('❌ GitHub 角色備註同步失敗:', error);
        }
    }

    // 獲取 GitHub 角色備註
    async fetchRoleNotes() {
        try {
            // 使用 GitHub API 讀取 role-notes 資料夾
            const apiUrl = 'https://api.github.com/repos/mingxianliu/ErDashboard/contents/role-notes';
            const response = await fetch(apiUrl);

            if (!response.ok) {
                if (response.status === 404) {
                    return []; // 資料夾不存在，返回空陣列
                }
                throw new Error(`GitHub API 錯誤: ${response.status}`);
            }

            const files = await response.json();
            const noteFiles = [];

            // 讀取每個 JSON 檔案
            for (const file of files) {
                if (file.name.endsWith('.json') && file.type === 'file') {
                    try {
                        const fileResponse = await fetch(file.download_url);
                        const noteData = await fileResponse.json();
                        noteFiles.push({
                            filename: file.name,
                            data: noteData,
                            sha: file.sha
                        });
                    } catch (error) {
                        console.warn(`⚠️ 無法讀取角色備註檔案 ${file.name}:`, error.message);
                    }
                }
            }

            // 按時間排序（最新的在前）
            return noteFiles.sort((a, b) =>
                new Date(b.data.timestamp) - new Date(a.data.timestamp)
            );
        } catch (error) {
            console.warn('GitHub 角色備註檢查失敗:', error.message);
            return [];
        }
    }

    // 應用角色備註
    async applyRoleNotes(roleNotes) {
        console.log('📌 開始應用角色備註，收到', roleNotes.length, '個備註');

        // 嘗試不同的資料來源
        let assignments = null;

        // 方法1: 從 teamDataManager 讀取
        if (window.teamDataManager && window.teamDataManager.getAllAssignments) {
            console.log('✅ 使用 teamDataManager');
            assignments = window.teamDataManager.getAllAssignments();
        }
        // 方法2: 從 localStorage 讀取
        else if (localStorage.getItem('project-assignments')) {
            console.log('✅ 使用 localStorage');
            const data = JSON.parse(localStorage.getItem('project-assignments'));
            assignments = data.assignments || {};
        }
        // 方法3: 從 config 檔案讀取
        else {
            console.log('✅ 嘗試從 config 檔案讀取');
            try {
                const response = await fetch('config/project-assignments.json');
                const data = await response.json();
                assignments = data.assignments || {};
            } catch (error) {
                console.error('❌ 無法讀取 config 檔案:', error);
                return;
            }
        }

        console.log('🔍 系統讀取到的專案:', Object.keys(assignments));

        // 檢查特定專案
        if (!assignments['iFMS-Frontend']) {
            console.warn('⚠️ 系統資料中沒有 iFMS-Frontend 專案');
            // 嘗試找類似的專案名稱
            const similarProjects = Object.keys(assignments).filter(p => p.toLowerCase().includes('ifms'));
            if (similarProjects.length > 0) {
                console.log('💡 找到類似的專案:', similarProjects);
            }
        }

        let hasUpdates = false;

        for (const noteFile of roleNotes) {
            const { project, member, note, submitter, timestamp } = noteFile.data;

            // 處理專案名稱的大小寫問題
            let actualProject = project;
            if (!assignments[project]) {
                // 嘗試不同的專案名稱格式
                const projectVariations = [
                    project,
                    project.toLowerCase(),
                    project.replace('Frontend', 'frontend'),
                    project.replace('frontend', 'Frontend'),
                    'iFMS-frontend' // 特別處理 iFMS
                ];

                for (const variation of projectVariations) {
                    if (assignments[variation]) {
                        actualProject = variation;
                        console.log(`💡 專案名稱對應: "${project}" → "${actualProject}"`);
                        break;
                    }
                }
            }

            if (assignments[actualProject] && assignments[actualProject].members) {
                // 尋找對應的成員 (用 memberName 匹配)
                const memberIds = Object.keys(assignments[actualProject].members);

                // 建立成員名稱對照表
                const memberNameMap = {};
                const memberDebugInfo = memberIds.map(id => {
                    const memberInfo = assignments[actualProject].members[id];
                    const name = memberInfo.memberName || memberInfo.name || id;
                    memberNameMap[id] = name;
                    return `${id}: ${name}`;
                });

                console.log(`🔍 專案 "${project}" 的成員:`, memberDebugInfo);
                console.log(`🔍 要找的成員: "${member}"`);

                // 根據成員 ID 或名稱匹配
                const targetMemberId = memberIds.find(id => {
                    const memberInfo = assignments[actualProject].members[id];
                    // 方法1: 用 memberName 匹配
                    if (memberInfo && memberInfo.memberName === member) return true;
                    // 方法2: 用 name 匹配
                    if (memberInfo && memberInfo.name === member) return true;
                    // 方法3: 直接用 ID 匹配（如果成員名稱就是 ID）
                    if (id === member) return true;
                    // 方法4: 根據已知的對應關係匹配
                    const knownMapping = {
                        'A-CC': 'KlauderA',
                        'C-CS': 'KersirC',
                        'C-CA': 'KersirAjenC',
                        'B-GI': 'JaymenightB',
                        'A-VC': 'KopylotA',
                        'B-CS': 'KersirB',
                        'A-GI': 'JaymenightA',
                        'C-CI': 'KodesC',
                        'C-CC': 'KlauderC',
                        'C-VC': 'KopylotC',
                        'B-CI': 'KodesB',
                        'A-CS': 'KersirA',
                        'B-VC': 'KopylotB',
                        'B-CC': 'KlauderB'
                    };
                    if (knownMapping[id] === member) return true;
                    return false;
                });

                if (targetMemberId) {
                    console.log(`📝 新增 ${project}/${member} 的角色備註`);

                    // 取得現有的個人備註
                    let personalNotes = assignments[actualProject].members[targetMemberId].personalNotes || [];

                    // 檢查是否已經存在相同的備註 (避免重複加入)
                    const isDuplicate = personalNotes.some(existingNote =>
                        existingNote.content === note &&
                        existingNote.source === 'github' &&
                        existingNote.author === submitter
                    );

                    if (!isDuplicate) {
                        // 新增新的備註
                        const newNote = {
                            id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            content: note,
                            timestamp: new Date(timestamp).toLocaleString('zh-TW'),
                            author: submitter,
                            source: 'github'
                        };

                        personalNotes.unshift(newNote);
                        assignments[actualProject].members[targetMemberId].personalNotes = personalNotes;
                        hasUpdates = true;
                    } else {
                        console.log(`⚠️ 跳過重複的備註: ${project}/${member}`);
                    }
                } else {
                    console.warn(`⚠️ 找不到成員 "${member}" 在專案 "${project}" 中`);
                }
            } else {
                console.warn(`⚠️ 找不到專案 "${project}" 或該專案沒有成員`);
            }
        }

        // 儲存更新
        if (hasUpdates) {
            if (window.teamDataManager && window.teamDataManager.saveLocalChanges) {
                await window.teamDataManager.saveLocalChanges();
                console.log('💾 角色備註已儲存到 Google Drive');
            } else {
                console.log('💾 角色備註已更新（但無法儲存到 Google Drive）');
            }
        }
    }

    // 應用進度更新
    async applyProgressUpdates(progressUpdates) {
        if (!window.teamDataManager) {
            console.warn('TeamDataManager 未準備好，跳過進度更新');
            return;
        }

        const assignments = window.teamDataManager.getAllAssignments();
        let hasUpdates = false;

        for (const update of progressUpdates) {
            const { project, progress, note, submitter, timestamp } = update.data;

            if (assignments[project]) {
                // 檢查是否為更新的進度
                const currentProgress = assignments[project].progress || 0;

                if (progress !== currentProgress) {
                    console.log(`📈 更新 ${project} 進度: ${currentProgress}% → ${progress}% (${submitter})`);

                    // 更新進度
                    assignments[project].progress = progress;
                    assignments[project].lastUpdated = timestamp.split('T')[0];

                    // 加入備註到現有備註中
                    let notes = [];
                    try {
                        notes = JSON.parse(assignments[project].notes || '[]');
                    } catch (e) {
                        notes = [];
                    }

                    notes.unshift({
                        timestamp: new Date(timestamp).toLocaleString('zh-TW'),
                        content: `${note} (提交者: ${submitter})`
                    });

                    assignments[project].notes = JSON.stringify(notes);
                    hasUpdates = true;
                }
            }
        }

        // 儲存更新
        if (hasUpdates) {
            await window.teamDataManager.saveLocalChanges();
            console.log('💾 進度更新已儲存到 Google Drive');
        }
    }

    // 通用的 API 重試機制，處理 token 過期
    async retryWithReAuth(apiFunction, maxRetries = 1) {
        let retries = 0;
        while (retries <= maxRetries) {
            try {
                return await apiFunction();
            } catch (error) {
                // 檢查是否為 401 未授權錯誤（包括網路錯誤的 401 回應）
                const is401Error = error.message && (
                    error.message.includes('401') ||
                    error.message.includes('Unauthorized') ||
                    error.message.includes('建立檔案失敗')
                );

                if (is401Error && retries < maxRetries) {
                    console.log(`🔑 Token 已過期 (嘗試 ${retries + 1}/${maxRetries + 1})，重新驗證...`);
                    // 清除過期的 token
                    sessionStorage.removeItem('google_access_token');
                    this.accessToken = null;
                    this.isAuthenticated = false;

                    const reAuthSuccess = await this.signIn();
                    if (reAuthSuccess) {
                        console.log('✅ 重新驗證成功，重試操作');
                        retries++;
                        continue;
                    }
                }
                throw error;
            }
        }
    }

    // 儲存檔案到 Google Drive
    async saveFile(fileName, content, fileType = 'members') {
        if (!this.isConfigured) {
            console.warn('⚠️ Google Drive 未設定，跳過儲存');
            return null;
        }

        if (!this.isSignedIn()) {
            const signInSuccess = await this.signIn();
            if (!signInSuccess) {
                throw new Error('需要登入 Google Drive');
            }
        }

        return await this.retryWithReAuth(async () => {
            const fileData = {
                version: "1.0",
                type: fileType,
                lastSync: new Date().toISOString(),
                data: content
            };

            const fileContent = JSON.stringify(fileData, null, 2);

            // 檢查檔案是否已存在
            const existingFile = await this.findFile(fileName);

            if (existingFile) {
                // 更新現有檔案
                return await this.updateFile(existingFile.id, fileContent);
            } else {
                // 建立新檔案
                return await this.createFile(fileName, fileContent);
            }
        });
    }

    // 從 Google Drive 讀取檔案
    async loadFile(fileName) {
        // 如果 API 未準備好，直接返回 null
        if (!this.isReady()) {
            console.log('Google Drive API 未準備好，跳過操作');
            return null;
        }

        if (!this.isSignedIn()) {
            console.log('Google Drive 未登入，跳過操作');
            return null;
        }

        return await this.retryWithReAuth(async () => {
            const file = await this.findFile(fileName);
            if (!file) {
                return null;
            }

            const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`載入檔案失敗: ${response.statusText}`);
            }

            const content = await response.text();

            // 檢查是否為有效的 JSON
            let parsedContent;
            try {
                parsedContent = JSON.parse(content);
            } catch (error) {
                console.error('❌ Google Drive 檔案不是有效的 JSON:', content.substring(0, 100));
                throw new Error(`Google Drive 檔案格式錯誤: ${error.message}`);
            }

            // 檢查是否為包裝格式 (有 data 屬性)
            if (parsedContent && typeof parsedContent === 'object' && parsedContent.data) {
                console.log('📦 偵測到包裝格式，提取內部資料');
                return parsedContent;
            }

            // 否則直接返回解析後的內容
            return parsedContent;
        });
    }

    // 搜尋檔案
    async findFile(fileName) {
        try {
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and parents in '${this.folderId}' and trashed=false`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            const data = await response.json();
            return data.files && data.files.length > 0 ? data.files[0] : null;
        } catch (error) {
            console.error('搜尋檔案失敗:', error);
            return null;
        }
    }

    // 建立新檔案
    async createFile(fileName, content) {
        const metadata = {
            name: fileName,
            parents: [this.folderId],
            mimeType: 'application/json'
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
        form.append('file', new Blob([content], {type: 'application/json'}));

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            },
            body: form
        });

        if (!response.ok) {
            throw new Error(`建立檔案失敗: ${response.statusText}`);
        }

        return await response.json();
    }

    // 更新現有檔案
    async updateFile(fileId, content) {
        const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: content
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ 更新檔案失敗:', response.status, errorText);

            // 如果 PATCH 失敗，嘗試 PUT 方法
            const putResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: content
            });

            if (!putResponse.ok) {
                const putErrorText = await putResponse.text();
                console.error('❌ PUT 方法也失敗:', putResponse.status, putErrorText);
                throw new Error(`更新檔案失敗: ${putResponse.status} ${putResponse.statusText} - ${putErrorText}`);
            }

            return await putResponse.json();
        }

        return await response.json();
    }

    // 列出資料夾中的所有檔案
    async listFiles() {
        if (!this.isSignedIn()) {
            throw new Error('需要登入 Google Drive');
        }

        try {
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files?q=parents in '${this.folderId}' and trashed=false&orderBy=modifiedTime desc`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            const data = await response.json();
            return data.files || [];
        } catch (error) {
            console.error('列出檔案失敗:', error);
            return [];
        }
    }

    // 檢查檔案是否有更新
    async checkForUpdates() {
        try {
            const files = await this.listFiles();
            const updates = [];

            for (const file of files) {
                // 檢查檔案名稱格式
                if (file.name.startsWith('ErDashboard_')) {
                    const fileType = this.extractFileType(file.name);
                    const localVersion = localStorage.getItem(`ErDashboard_${fileType}_Version`);

                    // 比較修改時間
                    const remoteModified = new Date(file.modifiedTime);
                    const localModified = localVersion ? new Date(localVersion.split('_')[1]) : new Date(0);

                    if (remoteModified > localModified) {
                        updates.push({
                            file: file,
                            type: fileType,
                            remoteModified: remoteModified,
                            localModified: localModified
                        });
                    }
                }
            }

            return updates;
        } catch (error) {
            console.error('檢查更新失敗:', error);
            return [];
        }
    }

    // 從檔案名稱提取類型
    extractFileType(fileName) {
        if (fileName.includes('Members')) return 'Members';
        if (fileName.includes('Groups')) return 'Groups';
        if (fileName.includes('Assignments')) return 'Assignments';
        if (fileName.includes('Customizations')) return 'Customizations';
        return 'Unknown';
    }

    // 自動同步所有更新
    async autoSync() {
        try {
            const updates = await this.checkForUpdates();

            if (updates.length === 0) {
                console.log('沒有可用的更新');
                return [];
            }

            const syncResults = [];

            for (const update of updates) {
                try {
                    const fileData = await this.loadFile(update.file.name);
                    if (fileData) {
                        syncResults.push({
                            type: update.type,
                            file: update.file.name,
                            data: fileData,
                            success: true
                        });
                    }
                } catch (error) {
                    syncResults.push({
                        type: update.type,
                        file: update.file.name,
                        error: error.message,
                        success: false
                    });
                }
            }

            return syncResults;
        } catch (error) {
            console.error('自動同步失敗:', error);
            throw error;
        }
    }
}

// 全域實例
window.googleDriveAPI = new GoogleDriveAPI();