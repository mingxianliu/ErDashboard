#!/usr/bin/env node

/**
 * 開發活動自動備註提交腳本
 * 支援 PR、merge、feat、push 等不同類型的開發活動
 */

const { execSync } = require('child_process');

// 取得命令列參數
const args = process.argv.slice(2);
if (args.length < 5) {
    console.log(`
🤖 開發活動自動備註提交腳本

使用方法:
  node submit-dev-note.js <專案名稱> <開發者GitHub用戶名> <事件類型> <標題> <編號或Hash>

事件類型:
  - pr: Pull Request
  - merge: PR 合併
  - feat: 新功能提交
  - push: 一般推送

範例:
  node submit-dev-note.js ErCore mingxianliu pr "修復登入bug" 123
  node submit-dev-note.js ErCore mingxianliu merge "Merged: 修復登入bug" 123
  node submit-dev-note.js ErCore mingxianliu feat "feat: 新增用戶管理功能" abc1234
  node submit-dev-note.js ErCore mingxianliu push "更新文檔" abc1234
    `);
    process.exit(1);
}

const [projectName, githubUser, eventType, title, numberOrHash] = args;

// 解析成員身份指定
function extractMemberFromTitle(title) {
    // 解析 commit message 中的 [member:成員名稱]
    const memberRegex = /\[member:([^\]]+)\]/;
    const match = title.match(memberRegex);
    return match ? match[1] : null;
}

function extractMemberFromPRTitle(title) {
    // 解析 PR title 中的 [成員名稱]
    const prRegex = /^\[([^\]]+)\]/;
    const match = title.match(prRegex);
    return match ? match[1] : null;
}

// GitHub 用戶名到預設成員名稱的對應
const defaultUserMapping = {
    'mingxianliu': 'KlauderA',
    // 在這裡加入更多預設對應關係
    // 'github用戶名': '預設成員名稱',
};

// 取得成員名稱（依優先級）
function getMemberName(title, githubUser, eventType) {
    // 1. 優先檢查標題中的成員指定
    let specifiedMember = null;

    if (eventType === 'pr' || eventType === 'merge') {
        // PR 相關事件：先檢查 PR title 格式 [成員名稱]
        specifiedMember = extractMemberFromPRTitle(title);
    }

    if (!specifiedMember) {
        // 檢查 commit message 格式 [member:成員名稱]
        specifiedMember = extractMemberFromTitle(title);
    }

    // 2. 有指定成員就用指定的
    if (specifiedMember) {
        console.log(`🎯 檢測到指定成員: ${specifiedMember}`);
        return specifiedMember;
    }

    // 3. 沒有指定就用預設對應
    const defaultMember = defaultUserMapping[githubUser] || githubUser;
    console.log(`📍 使用預設對應: ${githubUser} → ${defaultMember}`);
    return defaultMember;
}

const memberName = getMemberName(title, githubUser, eventType);

// 清理標題中的成員標記
function cleanTitle(title) {
    return title
        .replace(/\[member:[^\]]+\]/g, '')  // 移除 [member:xxx]
        .replace(/^\[[^\]]+\]\s*/, '')       // 移除開頭的 [xxx]
        .trim();
}

// 根據事件類型建立不同的備註內容
let noteContent;
let emoji;
const cleanedTitle = cleanTitle(title);

switch (eventType) {
    case 'pr':
        emoji = '📋';
        noteContent = `• PR #${numberOrHash}: ${cleanedTitle}`;
        break;
    case 'merge':
        emoji = '🎉';
        noteContent = `• ${cleanedTitle}`;
        break;
    case 'feat':
        emoji = '✨';
        // 移除 feat: 前綴避免重複
        const featTitle = cleanedTitle.replace(/^feat:\s*/, '');
        noteContent = `• 新功能: ${featTitle}`;
        break;
    case 'push':
        emoji = '🔨';
        noteContent = `• ${cleanedTitle}`;
        break;
    default:
        emoji = '💻';
        noteContent = `• ${title}`;
}

console.log(`${emoji} 自動提交開發備註:`);
console.log(`   專案: ${projectName}`);
console.log(`   開發者: ${githubUser} → ${memberName}`);
console.log(`   類型: ${eventType}`);
console.log(`   原始標題: ${title}`);
console.log(`   清理後標題: ${cleanedTitle}`);
console.log(`   備註: ${noteContent}`);

try {
    // 使用現有的提交腳本
    const command = `node scripts/submit-note.js "${projectName}" "${memberName}" "${noteContent}"`;
    console.log(`執行命令: ${command}`);

    execSync(command, {
        stdio: 'inherit',
        cwd: process.cwd()
    });

    console.log('✅ 開發備註自動提交完成！');
} catch (error) {
    console.error('❌ 開發備註提交失敗:', error.message);
    process.exit(1);
}