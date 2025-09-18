#!/usr/bin/env node

/**
 * 通用 Dashboard 更新工具
 * 
 * 使用方式：
 * node update-dashboard.js --feature "ERC0001" --status "completed" --message "完成使用者登入功能"
 * node update-dashboard.js --progress 75 --message "專案進度更新"
 * node update-dashboard.js --auto-detect --message "自動檢測並更新進度"
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DashboardUpdater {
    constructor() {
        this.dashboardPath = process.env.ER_DASHBOARD_PATH || '../';
        this.projectsPath = path.join(this.dashboardPath, 'projects');
        this.configPath = path.join(this.dashboardPath, 'scripts', 'project-mapping.json');
        
        // 載入專案對應設定
        this.loadProjectMapping();
    }

    // 載入專案對應設定
    loadProjectMapping() {
        try {
            if (fs.existsSync(this.configPath)) {
                const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                this.projectMapping = config.mapping || {};
            } else {
                // 建立預設設定檔
                this.createDefaultConfig();
            }
        } catch (error) {
            console.error('❌ 無法載入專案對應設定:', error.message);
            this.projectMapping = {};
        }
    }

    // 建立預設設定檔
    createDefaultConfig() {
        const defaultConfig = {
            "description": "專案目錄名稱對應到 Dashboard 的 markdown 檔案",
            "mapping": {
                "MyApp": "ErProject1.md",
                "MyWebsite": "ErProject2.md", 
                "MyAPI": "ErAI-Assistant.md"
            },
            "autoDetection": {
                "enabled": true,
                "rules": [
                    {
                        "pattern": "Er*",
                        "action": "match_name"
                    },
                    {
                        "pattern": "*App*",
                        "action": "map_to_erproject"
                    }
                ]
            }
        };

        fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
        this.projectMapping = defaultConfig.mapping;
        
        console.log('📝 已建立預設設定檔:', this.configPath);
        console.log('請編輯設定檔來對應您的專案');
    }

    // 自動檢測當前專案
    autoDetectProject() {
        const currentDir = process.cwd();
        const projectName = path.basename(currentDir);
        
        console.log(`🔍 檢測到當前專案: ${projectName}`);
        
        // 1. 直接對應
        if (this.projectMapping[projectName]) {
            return this.projectMapping[projectName];
        }

        // 2. 模糊匹配
        const possibleMatches = Object.keys(this.projectMapping).filter(key => 
            key.toLowerCase().includes(projectName.toLowerCase()) ||
            projectName.toLowerCase().includes(key.toLowerCase())
        );

        if (possibleMatches.length === 1) {
            console.log(`🎯 找到匹配專案: ${possibleMatches[0]}`);
            return this.projectMapping[possibleMatches[0]];
        }

        // 3. Er* 規則匹配
        if (projectName.startsWith('Er')) {
            const mdFile = `${projectName}.md`;
            const mdPath = path.join(this.projectsPath, mdFile);
            if (fs.existsSync(mdPath)) {
                console.log(`✅ 找到對應的 Markdown 檔案: ${mdFile}`);
                return mdFile;
            }
        }

        // 4. 互動式選擇
        return this.interactiveSelection(projectName);
    }

    // 互動式專案選擇
    interactiveSelection(currentProject) {
        const mdFiles = fs.readdirSync(this.projectsPath)
            .filter(file => file.endsWith('.md') && file !== 'TEMPLATE.md')
            .sort();

        console.log(`\\n❓ 無法自動匹配專案 "${currentProject}"，請手動選擇：`);
        mdFiles.forEach((file, index) => {
            console.log(`${index + 1}. ${file.replace('.md', '')}`);
        });
        console.log('0. 取消更新');

        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            rl.question('\\n請選擇 (輸入數字): ', (answer) => {
                rl.close();
                const choice = parseInt(answer);
                
                if (choice === 0) {
                    console.log('❌ 已取消更新');
                    resolve(null);
                } else if (choice >= 1 && choice <= mdFiles.length) {
                    const selectedFile = mdFiles[choice - 1];
                    
                    // 記住這次的選擇
                    this.projectMapping[currentProject] = selectedFile;
                    this.saveProjectMapping();
                    
                    console.log(`✅ 已選擇: ${selectedFile}`);
                    resolve(selectedFile);
                } else {
                    console.log('❌ 無效選擇');
                    resolve(null);
                }
            });
        });
    }

    // 儲存專案對應設定
    saveProjectMapping() {
        try {
            const config = {
                description: "專案目錄名稱對應到 Dashboard 的 markdown 檔案",
                mapping: this.projectMapping,
                autoDetection: {
                    enabled: true,
                    lastUpdated: new Date().toISOString()
                }
            };
            
            fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
            console.log('💾 已更新專案對應設定');
        } catch (error) {
            console.error('❌ 無法儲存設定:', error.message);
        }
    }

    // 更新功能狀態
    async updateFeature(mdFile, featureCode, newStatus, message) {
        const filePath = path.join(this.projectsPath, mdFile);
        
        if (!fs.existsSync(filePath)) {
            throw new Error(`找不到檔案: ${mdFile}`);
        }

        let content = fs.readFileSync(filePath, 'utf8');
        let updated = false;

        // 尋找功能項目並更新狀態
        const featureRegex = new RegExp(`(- \\*\\*${featureCode}\\*\\*.*)`, 'g');
        
        if (featureRegex.test(content)) {
            // 移動功能到對應的狀態區塊
            content = this.moveFeatureToSection(content, featureCode, newStatus);
            updated = true;
        } else {
            console.log(`⚠️ 找不到功能代號 ${featureCode}，將新增到對應區塊`);
            content = this.addNewFeature(content, featureCode, newStatus, message);
            updated = true;
        }

        if (updated) {
            // 更新最後修改時間
            content = this.updateLastModified(content);
            
            fs.writeFileSync(filePath, content);
            console.log(`✅ 已更新 ${mdFile} 中的功能 ${featureCode}`);
            
            return true;
        }

        return false;
    }

    // 移動功能到對應狀態區塊
    moveFeatureToSection(content, featureCode, status) {
        const lines = content.split('\\n');
        let featureLine = '';
        let featureDetails = [];
        let foundFeature = false;
        
        // 移除原有的功能項目
        const newLines = lines.filter(line => {
            if (line.includes(`**${featureCode}**`)) {
                featureLine = line;
                foundFeature = true;
                return false;
            }
            if (foundFeature && line.startsWith('  - ')) {
                featureDetails.push(line);
                return false;
            }
            if (foundFeature && (line.trim() === '' || line.startsWith('- **') || line.startsWith('### '))) {
                foundFeature = false;
            }
            return !foundFeature || line.trim() !== '';
        });

        // 加入到對應的狀態區塊
        const statusSections = {
            'completed': '### ✅ 已完成功能',
            'in-progress': '### 🚧 進行中功能',
            'planned': '### 📝 待開發功能'
        };

        const targetSection = statusSections[status];
        if (!targetSection) {
            console.error(`❌ 無效的狀態: ${status}`);
            return content;
        }

        let insertIndex = -1;
        for (let i = 0; i < newLines.length; i++) {
            if (newLines[i].includes(targetSection)) {
                insertIndex = i + 1;
                break;
            }
        }

        if (insertIndex !== -1) {
            newLines.splice(insertIndex, 0, featureLine, ...featureDetails);
        }

        return newLines.join('\\n');
    }

    // 新增功能項目
    addNewFeature(content, featureCode, status, description) {
        const statusSections = {
            'completed': '### ✅ 已完成功能',
            'in-progress': '### 🚧 進行中功能',  
            'planned': '### 📝 待開發功能'
        };

        const targetSection = statusSections[status];
        const newFeature = `- **${featureCode}** - ${description}`;

        const lines = content.split('\\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(targetSection)) {
                lines.splice(i + 1, 0, newFeature);
                break;
            }
        }

        return lines.join('\\n');
    }

    // 更新專案進度百分比
    updateProgress(content, newProgress) {
        return content.replace(
            /(\*\*完成度：\*\*\s*)\d+%/,
            `$1${newProgress}%`
        );
    }

    // 更新最後修改時間
    updateLastModified(content) {
        const today = new Date().toISOString().split('T')[0];
        return content.replace(
            /(\*\*最後更新：\*\*\s*)[^\n]*/,
            `$1${today}`
        );
    }

    // Git 提交更新
    async commitChanges(message, mdFile) {
        try {
            const dashboardDir = path.resolve(this.dashboardPath);
            
            process.chdir(dashboardDir);
            
            execSync('git add .', { stdio: 'inherit' });
            execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
            
            console.log('✅ 已提交 Git 變更');
            
            // 詢問是否要推送
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            const shouldPush = await new Promise((resolve) => {
                rl.question('🚀 是否要推送到遠端？ (y/N): ', (answer) => {
                    rl.close();
                    resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
                });
            });
            
            if (shouldPush) {
                execSync('git push', { stdio: 'inherit' });
                console.log('🎉 已推送到遠端 Repository');
            }
            
        } catch (error) {
            console.error('❌ Git 操作失敗:', error.message);
        }
    }

    // 主要執行函數
    async run(args) {
        try {
            const {
                feature,
                status = 'completed',
                progress,
                message,
                autoDetect = false,
                project
            } = args;

            // 決定要更新哪個專案
            let mdFile;
            
            if (project) {
                mdFile = this.projectMapping[project];
                if (!mdFile) {
                    throw new Error(`找不到專案對應: ${project}`);
                }
            } else if (autoDetect) {
                mdFile = await this.autoDetectProject();
                if (!mdFile) {
                    return;
                }
            } else {
                throw new Error('請指定 --project 或使用 --auto-detect');
            }

            console.log(`📝 更新專案: ${mdFile.replace('.md', '')}`);

            let updated = false;

            // 更新功能狀態
            if (feature) {
                updated = await this.updateFeature(mdFile, feature, status, message);
            }

            // 更新進度
            if (progress !== undefined) {
                const filePath = path.join(this.projectsPath, mdFile);
                let content = fs.readFileSync(filePath, 'utf8');
                content = this.updateProgress(content, progress);
                content = this.updateLastModified(content);
                fs.writeFileSync(filePath, content);
                console.log(`✅ 已更新進度至 ${progress}%`);
                updated = true;
            }

            if (updated) {
                // 提交變更
                const commitMessage = `更新專案進度: ${message || '專案狀態更新'}`;
                await this.commitChanges(commitMessage, mdFile);
            } else {
                console.log('❌ 沒有進行任何更新');
            }

        } catch (error) {
            console.error('❌ 更新失敗:', error.message);
            process.exit(1);
        }
    }
}

// 命令列參數解析
function parseArgs() {
    const args = process.argv.slice(2);
    const parsed = {};
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const key = arg.slice(2).replace(/-/g, '');  // 轉換 kebab-case 為 camelCase
            const nextArg = args[i + 1];
            
            if (key === 'autoDetect' || key === 'auto-detect') {
                parsed.autoDetect = true;
            } else if (nextArg && !nextArg.startsWith('--')) {
                parsed[key] = nextArg;
                i++; // 跳過下一個參數
            } else {
                parsed[key] = true;
            }
        }
    }
    
    return parsed;
}

// 主程式
if (require.main === module) {
    const args = parseArgs();
    
    if (args.help) {
        console.log(`
🔧 ErDashboard 通用更新工具

使用方式：
  node update-dashboard.js --auto-detect --feature "ERC0001" --status "completed" --message "完成使用者登入"
  node update-dashboard.js --project "MyApp" --progress 75 --message "專案進度更新" 
  node update-dashboard.js --auto-detect --progress 50

參數：
  --auto-detect        自動檢測當前專案
  --project <name>     指定專案名稱
  --feature <code>     功能代號 (如 ERC0001)
  --status <status>    功能狀態 (completed|in-progress|planned)
  --progress <num>     專案完成度 (0-100)
  --message <text>     更新訊息
  --help              顯示幫助資訊

範例：
  # 標記功能為完成
  node update-dashboard.js --auto-detect --feature "ERC0001" --status "completed" --message "完成登入功能"
  
  # 更新專案進度
  node update-dashboard.js --auto-detect --progress 65 --message "完成核心模組開發"
  
  # 新增進行中功能
  node update-dashboard.js --auto-detect --feature "ERC0003" --status "in-progress" --message "開發支付系統"
        `);
        return;
    }
    
    const updater = new DashboardUpdater();
    updater.run(args);
}

module.exports = DashboardUpdater;