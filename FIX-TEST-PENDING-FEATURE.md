# GitHub 待測試功能修復方案

## 🔍 問題分析

您提到的「待測試」功能設計上是通過 GitHub Webhook 或 Actions 來通知首頁，當有 PR (Pull Request) 未 merge 時顯示「待測試」標籤。

### 目前狀態

1. ✅ **UI 元素已存在**：首頁已有「待測試」標籤
2. ✅ **Webhook 接收器存在**：`github-webhook.html`
3. ✅ **監聽邏輯存在**：index.html 監聽 `github-webhook-event`
4. ❌ **未實際運作**：需要配置才能接收通知

### 目前的實現方式

```javascript
// index.html 第 420-424 行
<span class="badge bg-warning text-dark me-2"
      id="project-test-${project.projectId}"
      style="display: none;"  ← 預設隱藏
      title="有新推送，待測試">
    <i class="fas fa-exclamation-triangle"></i> 待測試
</span>
```

## 🎯 解決方案

### 方案 1：直接檢查 GitHub PR 狀態（推薦）

自動檢查每個專案倉庫的 PR 狀態，有未 merge 的 PR 就顯示「待測試」。

**優點：**
- ✅ 自動運作，無需手動配置
- ✅ 準確反映實際狀態
- ✅ 支援多個專案

**實現步驟：**

1. 在首頁載入時檢查每個專案的 GitHub PR 狀態
2. 使用 GitHub API 查詢 open PRs
3. 如果有 open PR，顯示「待測試」標籤

### 方案 2：使用 localStorage 手動標記

提供按鈕讓用戶手動標記專案為「待測試」。

**優點：**
- ✅ 簡單直接
- ✅ 用戶完全控制

**缺點：**
- ❌ 需要手動操作
- ❌ 可能忘記更新

### 方案 3：配置 GitHub Webhook（原設計）

配置 GitHub Webhook 通知 Dashboard。

**優點：**
- ✅ 即時通知
- ✅ 自動化

**缺點：**
- ❌ 需要服務器端點
- ❌ GitHub Pages 不支援
- ❌ 配置複雜

## 💡 推薦實現：方案 1 + 方案 2 混合

### 功能設計

1. **自動檢查**：頁面載入時檢查 GitHub PR
2. **手動標記**：提供快速標記按鈕
3. **狀態持久化**：儲存在 localStorage
4. **自動清除**：PR merge 後自動移除標籤

### 實現代碼

```javascript
// 檢查專案的 PR 狀態
async function checkProjectPRs(projectId, repoOwner, repoName) {
    try {
        const token = CONFIG.github.token || localStorage.getItem('GITHUB_TOKEN');
        if (!token) {
            console.log('未設定 GitHub Token，跳過 PR 檢查');
            return;
        }

        const response = await fetch(
            `https://api.github.com/repos/${repoOwner}/${repoName}/pulls?state=open`,
            {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (response.ok) {
            const prs = await response.json();
            if (prs.length > 0) {
                // 有未 merge 的 PR，顯示待測試
                window.showProjectTestPending(projectId);
                
                // 儲存狀態
                let pendingTests = JSON.parse(localStorage.getItem('pending-tests') || '{}');
                pendingTests[projectId] = {
                    status: true,
                    prCount: prs.length,
                    prs: prs.map(pr => ({
                        number: pr.number,
                        title: pr.title,
                        author: pr.user.login,
                        url: pr.html_url
                    })),
                    lastCheck: new Date().toISOString()
                };
                localStorage.setItem('pending-tests', JSON.stringify(pendingTests));
                
                console.log(`✓ ${projectId}: ${prs.length} 個待測試 PR`);
            } else {
                // 沒有 PR，隱藏標籤
                window.hideProjectTestPending(projectId);
            }
        }
    } catch (error) {
        console.error(`檢查 ${projectId} PR 失敗:`, error);
    }
}

// 檢查所有專案
async function checkAllProjectsPRs() {
    const projects = [
        { id: 'ErCore', owner: 'mingxianliu', repo: 'ErCore' },
        { id: 'ErNexus', owner: 'mingxianliu', repo: 'ErNexus' },
        { id: 'ErShield', owner: 'mingxianliu', repo: 'ErShield' },
        // ... 其他專案
    ];

    for (const project of projects) {
        await checkProjectPRs(project.id, project.owner, project.repo);
    }
}

// 頁面載入時檢查
document.addEventListener('DOMContentLoaded', () => {
    // 延遲 2 秒等資料載入完成
    setTimeout(checkAllProjectsPRs, 2000);
    
    // 每 5 分鐘自動檢查一次
    setInterval(checkAllProjectsPRs, 5 * 60 * 1000);
});
```

### 手動標記按鈕

在專案卡片上添加快速標記按鈕：

```html
<button class="btn btn-sm btn-outline-warning" 
        onclick="toggleTestPending('${project.projectId}')" 
        title="標記/取消待測試">
    <i class="fas fa-vial"></i>
</button>
```

```javascript
function toggleTestPending(projectId) {
    const indicator = document.getElementById(`project-test-${projectId}`);
    const isShowing = indicator.style.display !== 'none';
    
    if (isShowing) {
        window.hideProjectTestPending(projectId);
        
        // 移除 localStorage 記錄
        let pendingTests = JSON.parse(localStorage.getItem('pending-tests') || '{}');
        delete pendingTests[projectId];
        localStorage.setItem('pending-tests', JSON.stringify(pendingTests));
    } else {
        window.showProjectTestPending(projectId);
        
        // 加入 localStorage 記錄
        let pendingTests = JSON.parse(localStorage.getItem('pending-tests') || '{}');
        pendingTests[projectId] = {
            status: true,
            manual: true,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('pending-tests', JSON.stringify(pendingTests));
    }
}
```

## 📋 實現優先級

### 第一階段（快速）
1. ✅ 添加手動標記按鈕
2. ✅ 改善 localStorage 狀態管理
3. ✅ 頁面重載時恢復狀態

### 第二階段（完整）
4. ✅ 整合 GitHub API 自動檢查
5. ✅ 顯示 PR 詳細資訊
6. ✅ 自動定期更新

## 🔧 立即可用的臨時方案

在瀏覽器 Console 中執行：

```javascript
// 手動標記專案為待測試
window.showProjectTestPending('ErCore');

// 取消標記
window.hideProjectTestPending('ErCore');

// 清除所有標記
window.hideAllProjectTestPending();

// 查看當前待測試專案
JSON.parse(localStorage.getItem('pending-tests') || '{}');
```

## 📊 建議配置

在 `config.js` 中添加專案映射：

```javascript
const PROJECT_REPOS = {
    'ErCore': { owner: 'mingxianliu', repo: 'ErCore' },
    'ErNexus': { owner: 'mingxianliu', repo: 'ErNexus' },
    'ErShield': { owner: 'mingxianliu', repo: 'ErShield' },
    'ErTidy': { owner: 'mingxianliu', repo: 'ErTidy' },
    'EZOOM': { owner: 'mingxianliu', repo: 'EZOOM' },
    'iFMS-Frontend': { owner: 'mingxianliu', repo: 'iFMS-Frontend' },
    'SyncBC-Monorepo': { owner: 'mingxianliu', repo: 'SyncBC-Monorepo' },
    'iMonitoring': { owner: 'mingxianliu', repo: 'iMonitoring' }
};
```

---

**您希望我實現哪個方案？**

1. **方案 1**：自動檢查 GitHub PR（需要 GitHub Token）
2. **方案 2**：手動標記按鈕（最快實現）
3. **混合方案**：兩者都實現（推薦）
