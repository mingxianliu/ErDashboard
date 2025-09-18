/**
 * Google Drive API 整合模組
 * 提供直接讀寫 Google Drive 檔案的功能
 */

class GoogleDriveAPI {
    constructor() {
        this.apiKey = null;
        this.accessToken = null;
        this.folderId = 'YOUR_FOLDER_ID_HERE';
        this.isAuthenticated = false;
        this.initGoogleAPI();
    }

    // 初始化 Google API
    async initGoogleAPI() {
        try {
            // 載入 Google API
            await this.loadGoogleAPIScript();

            // 初始化 GAPI
            await new Promise((resolve) => {
                gapi.load('auth2,drive', resolve);
            });

            // 設定 API 參數 - 請參考 GOOGLE_DRIVE_SETUP.md 設定您的 Client ID
            const CLIENT_ID = '你的-client-id.apps.googleusercontent.com'; // 🔧 請替換為您的 Google Client ID

            if (CLIENT_ID === '你的-client-id.apps.googleusercontent.com') {
                console.warn('⚠️ 尚未設定 Google Drive Client ID，請參考 GOOGLE_DRIVE_SETUP.md');
                return;
            }

            await gapi.auth2.init({
                client_id: CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/drive.file'
            });

            console.log('Google Drive API 初始化完成');
        } catch (error) {
            console.error('Google API 初始化失敗:', error);
        }
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

    // 登入 Google Drive
    async signIn() {
        try {
            const authInstance = gapi.auth2.getAuthInstance();
            const user = await authInstance.signIn();

            this.accessToken = user.getAuthResponse().access_token;
            this.isAuthenticated = true;

            console.log('Google Drive 登入成功');
            return true;
        } catch (error) {
            console.error('Google Drive 登入失敗:', error);
            return false;
        }
    }

    // 檢查是否已登入
    isSignedIn() {
        if (!window.gapi || !gapi.auth2) return false;

        const authInstance = gapi.auth2.getAuthInstance();
        return authInstance && authInstance.isSignedIn.get();
    }

    // 儲存檔案到 Google Drive
    async saveFile(fileName, content, fileType = 'members') {
        if (!this.isSignedIn()) {
            const signInSuccess = await this.signIn();
            if (!signInSuccess) {
                throw new Error('需要登入 Google Drive');
            }
        }

        try {
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
        } catch (error) {
            console.error('儲存檔案失敗:', error);
            throw error;
        }
    }

    // 從 Google Drive 讀取檔案
    async loadFile(fileName) {
        if (!this.isSignedIn()) {
            throw new Error('需要登入 Google Drive');
        }

        try {
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
            return JSON.parse(content);
        } catch (error) {
            console.error('載入檔案失敗:', error);
            throw error;
        }
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
            throw new Error(`更新檔案失敗: ${response.statusText}`);
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