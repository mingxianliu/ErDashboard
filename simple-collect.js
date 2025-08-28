const fs = require('fs');
const axios = require('axios');

console.log('開始收集資料...');

// 簡單的測試資料
const data = {
  lastUpdate: new Date().toISOString(),
  projects: [
    {
      name: "測試專案",
      owner: "mingxianliu",
      repo: "ErDashboard",
      description: "測試專案",
      url: "https://github.com/mingxianliu/ErDashboard",
      color: "#007bff",
      stats: {
        total: 0,
        completed: 0,
        inProgress: 0,
        progress: 0
      },
      features: []
    }
  ],
  recentActivity: []
};

// 確保 data 目錄存在
if (!fs.existsSync('./data')) {
  fs.mkdirSync('./data', { recursive: true });
}

// 寫入檔案
fs.writeFileSync('./data/progress.json', JSON.stringify(data, null, 2));
console.log('✅ 測試資料已寫入 data/progress.json');
console.log('收集到 ' + data.projects.length + ' 個專案');