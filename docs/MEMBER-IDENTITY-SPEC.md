# 🎯 成員身份指定規範

當多個成員共用同一個 GitHub 帳號時，需要在 commit message 或 PR title 中明確指定成員身份。

## 📝 語法規範

### Commit Message 中指定
```bash
git commit -m "<type>: <description> [member:<成員名稱>]"
```

### PR Title 中指定
```
[<成員名稱>] <PR標題>
```

## 📋 範例

### ✅ 正確範例

**Commit Message:**
```bash
git commit -m "feat: 新增用戶登入功能 [member:KlauderA]"
git commit -m "fix: 修復資料庫連線錯誤 [member:KlauderB]"
git commit -m "docs: 更新API文檔 [member:ErichC]"
git commit -m "refactor: 重構認證模組 [member:JohnD]"
```

**PR Title:**
```
[KlauderA] 實作用戶權限管理
[KlauderB] 修復登入頁面樣式問題
[ErichC] 優化資料庫查詢效能
```

### ❌ 錯誤範例

```bash
# 缺少成員標記
git commit -m "feat: 新增功能"

# 格式錯誤
git commit -m "feat: 新增功能 [KlauderA]"        # 缺少 member:
git commit -m "feat: 新增功能 [member:klaudera]"  # 大小寫錯誤
git commit -m "feat: 新增功能 (member:KlauderA)"  # 括號錯誤
```

## 🎯 成員名稱對照表

在 ErDashboard 中查看各專案的成員列表，確保使用正確的成員名稱：

| GitHub 帳號 | 可用成員名稱 | 專案 |
|------------|-------------|------|
| mingxianliu | KlauderA, KlauderB | ErCore, EZOOM |
| john-doe | JohnD, JohnE | ErNexus, ErShield |
| ... | ... | ... |

## 🔄 自動備註邏輯

1. **優先級順序：**
   - PR Title 中的 `[成員名稱]` (最高優先級)
   - Commit Message 中的 `[member:成員名稱]`
   - 預設成員對應

2. **解析流程：**
   ```
   檢查 PR Title → 檢查最新 Commit → 使用預設對應 → 使用 GitHub 用戶名
   ```

3. **生成備註：**
   ```
   ✨ KlauderA • 新功能: 用戶登入功能
   🔨 KlauderB • 修復資料庫連線錯誤
   ```

## ⚠️ 注意事項

### 必須遵守
- ✅ 使用正確的成員名稱（區分大小寫）
- ✅ 使用正確的語法格式 `[member:成員名稱]`
- ✅ 成員名稱必須存在於專案成員列表中

### 建議遵守
- 💡 在 commit message 的最後加入成員標記
- 💡 PR title 使用簡潔的 `[成員名稱]` 格式
- 💡 團隊內部統一使用慣例

### 容錯機制
- 🛡️ 成員名稱不存在時，使用 GitHub 用戶名
- 🛡️ 格式錯誤時，嘗試預設對應
- 🛡️ 都無法識別時，記錄警告並使用原始用戶名

## 🧪 測試範例

測試以下 commit 是否能正確識別成員：

```bash
# 應該識別為 KlauderA
git commit -m "feat: 新增API接口 [member:KlauderA]"

# 應該識別為 KlauderB
git commit -m "fix: 修復登入bug [member:KlauderB]"

# 應該使用預設對應
git commit -m "docs: 更新說明文檔"
```

## 🔧 技術實作

### 正規表達式
```javascript
// 解析 commit message
const memberRegex = /\[member:([^\]]+)\]/;
const match = commitMessage.match(memberRegex);
const specifiedMember = match ? match[1] : null;

// 解析 PR title
const prTitleRegex = /^\[([^\]]+)\]/;
const prMatch = prTitle.match(prTitleRegex);
const prMember = prMatch ? prMatch[1] : null;
```

### 優先級邏輯
```javascript
function getMemberName(prTitle, commitMessage, githubUser, projectName) {
    // 1. PR Title 優先
    const prMember = extractFromPRTitle(prTitle);
    if (prMember) return prMember;

    // 2. Commit Message
    const commitMember = extractFromCommitMessage(commitMessage);
    if (commitMember) return commitMember;

    // 3. 預設對應
    return getDefaultMapping(githubUser, projectName);
}
```

## 📞 支援

遇到問題時：
1. 檢查成員名稱是否正確
2. 確認語法格式
3. 查看 GitHub Actions 執行記錄
4. 聯繫團隊技術支援

---
*此規範適用於所有使用 ErDashboard 自動備註系統的專案*