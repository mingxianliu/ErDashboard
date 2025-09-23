#!/usr/bin/env node

/**
 * PR 自動備註提交腳本
 * 供其他專案的 GitHub Actions 調用
 */

const { execSync } = require('child_process');

// 取得命令列參數
const args = process.argv.slice(2);
if (args.length < 4) {
    console.log(`
🤖 PR 自動備註提交腳本

使用方法:
  node submit-pr-note.js <專案名稱> <開發者GitHub用戶名> <PR標題> <PR編號>

範例:
  node submit-pr-note.js ErCore mingxianliu "修復登入bug" 123
    `);
    process.exit(1);
}

const [projectName, githubUser, prTitle, prNumber] = args;

// GitHub 用戶名到成員名稱的對應
const userMapping = {
    'mingxianliu': 'KlauderA',
    // 在這裡加入更多對應關係
    // 'github用戶名': '成員名稱',
};

// 取得成員名稱
const memberName = userMapping[githubUser] || githubUser;

// 建立備註內容
const noteContent = `• PR #${prNumber}: ${prTitle}`;

console.log(`🚀 自動提交 PR 備註:`);
console.log(`   專案: ${projectName}`);
console.log(`   開發者: ${githubUser} → ${memberName}`);
console.log(`   備註: ${noteContent}`);

try {
    // 使用現有的提交腳本
    const command = `node scripts/submit-note.js "${projectName}" "${memberName}" "${noteContent}"`;
    console.log(`執行命令: ${command}`);

    execSync(command, {
        stdio: 'inherit',
        cwd: process.cwd()
    });

    console.log('✅ PR 備註自動提交完成！');
} catch (error) {
    console.error('❌ PR 備註提交失敗:', error.message);
    process.exit(1);
}