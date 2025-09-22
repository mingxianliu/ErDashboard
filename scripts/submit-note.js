#!/usr/bin/env node

/**
 * 角色備註提交腳本
 * 讓團隊成員可以輕鬆提交角色備註小卡到 GitHub
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 設定
const NOTES_DIR = 'role-notes';

// 動態讀取專案列表
function getValidProjects() {
    try {
        // 優先從 config/project-assignments.json 讀取（這是 Google Drive 同步的資料）
        const configPath = path.join(__dirname, '..', 'config', 'project-assignments.json');
        if (fs.existsSync(configPath)) {
            const assignments = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            const projects = Object.keys(assignments.assignments || {});
            if (projects.length > 0) {
                console.log(`📋 從 Google Drive 資料讀取到 ${projects.length} 個專案: ${projects.join(', ')}`);
                return projects;
            }
        }

        // 備用：從 project-mapping.json 讀取
        const mappingPath = path.join(__dirname, 'project-mapping.json');
        if (fs.existsSync(mappingPath)) {
            const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
            const projects = Object.keys(mapping.mapping || {});
            if (projects.length > 0) return projects;
        }

        // 備用：從 projects 資料夾讀取 .md 檔案
        const projectsDir = path.join(__dirname, '..', 'projects');
        if (fs.existsSync(projectsDir)) {
            const mdFiles = fs.readdirSync(projectsDir)
                .filter(file => file.endsWith('.md') && file !== 'TEMPLATE.md')
                .map(file => file.replace('.md', ''));
            if (mdFiles.length > 0) return mdFiles;
        }

        // 預設專案列表作為 fallback
        return ['ErCore', 'ErNexus', 'ErShield', 'ErTidy'];
    } catch (error) {
        console.warn('⚠️  無法讀取專案列表，使用預設列表');
        return ['ErCore', 'ErNexus', 'ErShield', 'ErTidy'];
    }
}

const PROJECTS = getValidProjects();

// 確保備註資料夾存在
if (!fs.existsSync(NOTES_DIR)) {
    fs.mkdirSync(NOTES_DIR, { recursive: true });
}

// 取得命令列參數
const args = process.argv.slice(2);
if (args.length < 3) {
    console.log(`
📝 角色備註提交腳本

使用方法:
  node submit-note.js <專案名稱> <成員名稱> <備註內容>

範例:
  node submit-note.js ErCore 張小明 "今天完成了登入頁面的設計稿"
  node submit-note.js ErShield 李大華 "修復了安全掃描的bug，測試通過"

支援的專案: ${PROJECTS.join(', ')}
    `);
    process.exit(1);
}

const [projectName, memberName, noteContent] = args;

// 顯示建議的專案名稱（但不強制限制）
console.log(`💡 建議的專案名稱: ${PROJECTS.join(', ')}`);
if (!PROJECTS.includes(projectName)) {
    console.log(`⚠️  注意: "${projectName}" 不在建議列表中，但仍可使用`);
}

// 驗證備註內容
if (!noteContent || noteContent.trim().length === 0) {
    console.error('❌ 錯誤: 備註內容不能為空');
    process.exit(1);
}

// 驗證撰寫規範
const trimmedNote = noteContent.trim();

// 1. 字數限制檢查 (計算實際字符數，中文字算1個字)
const charCount = [...trimmedNote].length; // 使用 spread operator 正確計算 Unicode 字符
if (charCount > 100) {
    console.error(`❌ 錯誤: 備註內容超過 100 字限制 (目前: ${charCount} 字)`);
    console.error('請精簡內容，使用條列格式');
    process.exit(1);
}

// 2. 條列格式檢查
const hasListFormat = /^[•\-\*]|\d+\./.test(trimmedNote) || trimmedNote.includes('•') || /\d+\./.test(trimmedNote);
if (!hasListFormat) {
    console.error('❌ 錯誤: 備註必須使用條列格式');
    console.error('請使用以下格式之一:');
    console.error('  • 項目一 • 項目二');
    console.error('  1. 項目一 2. 項目二');
    console.error('  - 項目一 - 項目二');
    process.exit(1);
}

console.log('✅ 備註格式驗證通過');

// 取得提交者資訊（Git 用戶名稱）
let submitter = 'Unknown';
try {
    submitter = execSync('git config user.name', { encoding: 'utf8' }).trim();
} catch (error) {
    console.warn('⚠️  無法取得 Git 用戶名稱，使用 "Unknown"');
}

// 建立角色備註資料
const noteData = {
    project: projectName,
    member: memberName,
    note: noteContent.trim(),
    submitter: submitter,
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    type: 'role_note'
};

// 檔案名稱格式: YYYY-MM-DD_HH-MM-SS_ProjectName_MemberName.json
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
const safeMemberName = memberName.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '');
const filename = `${timestamp}_${projectName}_${safeMemberName}.json`;
const filepath = path.join(NOTES_DIR, filename);

// 寫入備註檔案
try {
    fs.writeFileSync(filepath, JSON.stringify(noteData, null, 2), 'utf8');
    console.log(`✅ 角色備註檔案已建立: ${filepath}`);

    // 顯示備註資料
    console.log(`\n📝 備註摘要:`);
    console.log(`   專案: ${projectName}`);
    console.log(`   成員: ${memberName}`);
    console.log(`   備註: ${noteContent}`);
    console.log(`   提交者: ${submitter}`);
    console.log(`   時間: ${noteData.timestamp}`);

    // 自動提交到 GitHub
    console.log(`\n🚀 自動提交到 GitHub...`);
    try {
        execSync(`git add ${filepath}`, { stdio: 'inherit' });
        execSync(`git commit -m "note: ${projectName}/${memberName} - ${noteContent.substring(0, 50)}${noteContent.length > 50 ? '...' : ''}"`, { stdio: 'inherit' });
        execSync(`git push`, { stdio: 'inherit' });
        console.log(`✅ 已成功推送到 GitHub`);
        console.log(`\n💡 管理員登入系統時會自動同步此角色備註`);
    } catch (error) {
        console.log(`\n⚠️  請手動提交到 GitHub:`);
        console.log(`   git add ${filepath}`);
        console.log(`   git commit -m "note: ${projectName}/${memberName} - ${noteContent.substring(0, 50)}${noteContent.length > 50 ? '...' : ''}"`);
        console.log(`   git push`);
    }

} catch (error) {
    console.error('❌ 建立備註檔案失敗:', error.message);
    process.exit(1);
}