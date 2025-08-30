#!/bin/bash

# ErDashboard 專案環境設定腳本

PROJECT_DIR="$1"
PROJECT_NAME="$(basename "$PROJECT_DIR")"

if [ -z "$PROJECT_DIR" ]; then
    echo "用法: $0 <專案目錄路徑>"
    exit 1
fi

if [ ! -d "$PROJECT_DIR" ]; then
    echo "錯誤: 專案目錄不存在: $PROJECT_DIR"
    exit 1
fi

echo "🔧 正在為專案 '$PROJECT_NAME' 設定 ErDashboard 整合..."

cd "$PROJECT_DIR"

# 1. 設定環境變數檔案
if [ ! -f ".env" ]; then
    echo "📝 建立 .env 檔案..."
    cat > .env << EOF
# ErDashboard 設定
ER_DASHBOARD_PATH=/Users/erich/Documents/GitHub/ErDashboard

# 其他環境變數可以在這裡加入
EOF
    echo "✅ 已建立 .env 檔案"
else
    # 檢查 .env 是否已包含 ER_DASHBOARD_PATH
    if ! grep -q "ER_DASHBOARD_PATH" .env; then
        echo "📝 更新 .env 檔案..."
        echo "" >> .env
        echo "# ErDashboard 設定" >> .env
        echo "ER_DASHBOARD_PATH=/Users/erich/Documents/GitHub/ErDashboard" >> .env
        echo "✅ 已更新 .env 檔案"
    else
        echo "✅ .env 檔案已包含 ErDashboard 設定"
    fi
fi

# 2. 建立 scripts 目錄（如果不存在）
if [ ! -d "scripts" ]; then
    mkdir -p scripts
    echo "📁 已建立 scripts 目錄"
fi

# 3. 設定 package.json scripts（如果存在 package.json）
if [ -f "package.json" ]; then
    echo "📦 檢查 package.json scripts..."
    
    # 檢查是否已有 dashboard 相關腳本
    if ! grep -q "update-dashboard" package.json; then
        # 使用 jq 來更新 package.json（如果可用）
        if command -v jq >/dev/null 2>&1; then
            # 備份原始檔案
            cp package.json package.json.backup
            
            # 添加 dashboard 腳本
            jq '.scripts["update-dashboard"] = "node update-dashboard.js --auto-detect"' package.json > package.json.tmp && mv package.json.tmp package.json
            jq '.scripts["complete-feature"] = "node update-dashboard.js --auto-detect --status completed"' package.json > package.json.tmp && mv package.json.tmp package.json
            jq '.scripts["progress-update"] = "node update-dashboard.js --auto-detect --progress"' package.json > package.json.tmp && mv package.json.tmp package.json
            
            echo "✅ 已更新 package.json scripts"
        else
            echo "⚠️  未安裝 jq，請手動在 package.json 中添加以下 scripts:"
            echo '  "update-dashboard": "node update-dashboard.js --auto-detect",'
            echo '  "complete-feature": "node update-dashboard.js --auto-detect --status completed",'
            echo '  "progress-update": "node update-dashboard.js --auto-detect --progress"'
        fi
    else
        echo "✅ package.json 已包含 dashboard scripts"
    fi
fi

# 4. 設定 Git hooks
if [ -d ".git" ]; then
    echo "🔗 設定 Git hooks..."
    
    # 建立 post-commit hook
    if [ ! -f ".git/hooks/post-commit" ]; then
        cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash
# ErDashboard 整合 - 在 commit 後詢問是否要更新 Dashboard

echo "🎯 是否要更新 ErDashboard？(y/N)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "📝 請輸入功能代號 (如 ERC0001):"
    read -r feature_code
    echo "📝 請輸入狀態 (completed/in-progress/planned):"
    read -r status
    echo "📝 請輸入描述:"
    read -r message
    
    if [ -f "./update-dashboard.js" ]; then
        node ./update-dashboard.js --auto-detect --feature "$feature_code" --status "$status" --message "$message"
    else
        echo "❌ 找不到 update-dashboard.js，請先設定腳本連結"
    fi
fi
EOF
        
        chmod +x .git/hooks/post-commit
        echo "✅ 已建立 Git post-commit hook"
    else
        echo "✅ Git post-commit hook 已存在"
    fi
else
    echo "⚠️  不是 Git repository，跳過 Git hooks 設定"
fi

echo "🎉 專案 '$PROJECT_NAME' 的 ErDashboard 整合設定完成！"
echo ""
echo "📋 使用方式："
echo "  更新功能: node update-dashboard.js --auto-detect --feature \"功能代號\" --status \"completed\" --message \"描述\""
echo "  更新進度: node update-dashboard.js --auto-detect --progress 75 --message \"進度更新\""
echo ""
echo "🔧 如果使用 npm scripts："
echo "  npm run complete-feature -- --feature \"功能代號\" --message \"描述\""
echo "  npm run progress-update -- --progress 75 --message \"進度更新\""