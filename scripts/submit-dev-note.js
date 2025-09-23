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

// GitHub 用戶名到成員名稱的對應
const userMapping = {
    'mingxianliu': 'KlauderA',
    // 在這裡加入更多對應關係
    // 'github用戶名': '成員名稱',
};

// 取得成員名稱
const memberName = userMapping[githubUser] || githubUser;

// 根據事件類型建立不同的備註內容
let noteContent;
let emoji;

switch (eventType) {
    case 'pr':
        emoji = '📋';
        noteContent = `• PR #${numberOrHash}: ${title}`;
        break;
    case 'merge':
        emoji = '🎉';
        noteContent = `• ${title}`;
        break;
    case 'feat':
        emoji = '✨';
        // 移除 feat: 前綴避免重複
        const cleanTitle = title.replace(/^feat:\s*/, '');
        noteContent = `• 新功能: ${cleanTitle}`;
        break;
    case 'push':
        emoji = '🔨';
        noteContent = `• ${title}`;
        break;
    default:
        emoji = '💻';
        noteContent = `• ${title}`;
}

console.log(`${emoji} 自動提交開發備註:`);
console.log(`   專案: ${projectName}`);
console.log(`   開發者: ${githubUser} → ${memberName}`);
console.log(`   類型: ${eventType}`);
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