const fs = require('fs');
const axios = require('axios');

// 配置
const repositories = [
  {
    name: "Er 專案群",
    owner: "mingxianliu",
    repoPattern: "Er*",
    description: "自動匹配所有以 Er 開頭的 repo",
    color: "#17a2b8",
    priority: 1,
    prefixRules: [
      { pattern: "ErCore*",    prefix: "ERC" },
      { pattern: "ErAI*",      prefix: "ERA" },
      { pattern: "ErAid-Ecosystem*", prefix: "ERAI" },
      { pattern: "ErNexus*",   prefix: "ERN" },
      { pattern: "ErForge*",   prefix: "ERF" },
      { pattern: "ErTidy*",    prefix: "ERT" },
      { pattern: "ErSlice*",   prefix: "ERSL" },
      { pattern: "ErShield*",  prefix: "ERSH" },
      { pattern: "ErShowcase*",prefix: "ERSC" },
      { pattern: "ErProphet*", prefix: "ERP" },
      { pattern: "*",          prefix: "ER" }
    ],
    colorRules: [
      { pattern: "ErCore*",    color: "#ff6b6b" },
      { pattern: "ErAI*",      color: "#845ef7" },
      { pattern: "ErAid-Ecosystem*", color: "#fd7e14" },
      { pattern: "ErNexus*",   color: "#28a745" },
      { pattern: "ErForge*",   color: "#6f42c1" },
      { pattern: "ErTidy*",    color: "#20c997" },
      { pattern: "ErSlice*",   color: "#dc3545" },
      { pattern: "ErShield*",  color: "#343a40" },
      { pattern: "ErShowcase*",color: "#ffc107" },
      { pattern: "ErProphet*", color: "#6610f2" },
      { pattern: "*",          color: "#17a2b8" }
    ]
  }
];

class GitHubAPI {
  constructor(token) {
    this.token = token;
    this.baseUrl = 'https://api.github.com';
    this.headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Project-Dashboard'
    };
    if (this.token) {
      this.headers['Authorization'] = 'token ' + this.token;
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchWithRetry(apiCall, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        return await apiCall();
      } catch (error) {
        console.log('API 呼叫失敗，重試 ' + (i + 1) + '/' + retries + ': ' + error.message);
        if (i < retries - 1) {
          await this.sleep(1000 * (i + 1));
        } else {
          throw error;
        }
      }
    }
  }

  async getRepository(owner, repo) {
    return await this.fetchWithRetry(async () => {
      const response = await axios.get(this.baseUrl + '/repos/' + owner + '/' + repo, {
        headers: this.headers
      });
      return response.data;
    });
  }

  async getAllIssues(owner, repo) {
    let allIssues = [];
    let page = 1;
    const perPage = 100;
    let hasMorePages = true;

    while (hasMorePages) {
      try {
        const response = await this.fetchWithRetry(async () => {
          return await axios.get(this.baseUrl + '/repos/' + owner + '/' + repo + '/issues', {
            headers: this.headers,
            params: {
              state: 'all',
              per_page: perPage,
              page: page
            }
          });
        });

        if (response.data.length === 0) {
          hasMorePages = false;
        } else {
          allIssues = allIssues.concat(response.data);
          page++;
          await this.sleep(100);
        }
      } catch (error) {
        console.error('取得 ' + owner + '/' + repo + ' issues 第 ' + page + ' 頁時發生錯誤:', error.message);
        if (error.response && (error.response.status === 403 || error.response.status === 404)) {
          console.log('跳過 ' + owner + '/' + repo + '，可能是權限問題或 repository 不存在');
          break;
        }
        hasMorePages = false;
      }
    }

    console.log('從 ' + owner + '/' + repo + ' 收集到 ' + allIssues.length + ' 個 issues');
    return allIssues;
  }

  async listOwnerReposAll(owner) {
    let allRepos = [];
    let page = 1;
    const perPage = 100;
    let hasMorePages = true;

    while (hasMorePages) {
      try {
        const response = await this.fetchWithRetry(async () => {
          return await axios.get(this.baseUrl + '/users/' + owner + '/repos', {
            headers: this.headers,
            params: {
              per_page: perPage,
              page: page,
              sort: 'updated',
              direction: 'desc'
            }
          });
        });

        if (response.data.length === 0) {
          hasMorePages = false;
        } else {
          allRepos = allRepos.concat(response.data);
          page++;
          await this.sleep(100);
        }
      } catch (error) {
        console.error('取得 ' + owner + ' 的 repositories 第 ' + page + ' 頁時發生錯誤:', error.message);
        if (error.response && (error.response.status === 403 || error.response.status === 404)) {
          console.log('跳過 ' + owner + '，可能是權限問題或使用者不存在');
          break;
        }
        hasMorePages = false;
      }
    }

    console.log('從 ' + owner + ' 收集到 ' + allRepos.length + ' 個 repositories');
    return allRepos;
  }

  filterReposByPattern(repos, pattern) {
    // 修正正則表達式，確保只匹配以指定前綴開頭的專案
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$', 'i');
    return repos.filter(repo => regex.test(repo.name));
  }

  getPrefixForRepo(repoName, prefixRules) {
    for (const rule of prefixRules) {
      const regex = new RegExp(rule.pattern.replace(/\*/g, '.*'), 'i');
      if (regex.test(repoName)) {
        return rule.prefix;
      }
    }
    return 'ER';
  }

  getColorForRepo(repoName, colorRules) {
    for (const rule of colorRules) {
      const regex = new RegExp(rule.pattern.replace(/\*/g, '.*'), 'i');
      if (regex.test(repoName)) {
        return rule.color;
      }
    }
    return '#17a2b8';
  }

  analyzeFeatureProgress(issues, featurePrefix) {
    const features = [];
    const prefixPattern = new RegExp('\\[' + featurePrefix + '\\d{4}\\]', 'i');

    issues.forEach(issue => {
      if (prefixPattern.test(issue.title)) {
        const match = issue.title.match(new RegExp('\\[(' + featurePrefix + '\\d{4})\\]', 'i'));
        if (match) {
          const featureCode = match[1];
          features.push({
            code: featureCode,
            title: issue.title.replace(new RegExp('\\[' + featurePrefix + '\\d{4}\\]', 'gi'), '').trim(),
            status: issue.state,
            url: issue.html_url,
            created: issue.created_at,
            updated: issue.updated_at,
            assignee: issue.assignee ? issue.assignee.login : null
          });
        }
      }
    });

    return features;
  }

  calculateProjectStats(features) {
    const total = features.length;
    const completed = features.filter(f => f.status === 'closed').length;
    const inProgress = features.filter(f => f.status === 'open').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      progress
    };
  }
}

async function collectData() {
  const token = process.env.GITHUB_TOKEN || process.env.PAT;
  const github = new GitHubAPI(token);

  const data = {
    lastUpdate: new Date().toISOString(),
    projects: [],
    recentActivity: [],
    summary: {
      totalProjects: 0,
      totalFeatures: 0,
      completedFeatures: 0,
      inProgressFeatures: 0,
      overallProgress: 0
    }
  };

  let successCount = 0;
  let errorCount = 0;

  for (const repoConfig of repositories) {
    try {
      if (repoConfig.repoPattern) {
        console.log('處理 ' + repoConfig.owner + ' 的 ' + repoConfig.repoPattern + ' 模式...');
        
        const allRepos = await github.listOwnerReposAll(repoConfig.owner);
        const matchedRepos = github.filterReposByPattern(allRepos, repoConfig.repoPattern);
        
        console.log('找到 ' + matchedRepos.length + ' 個匹配的 repositories');

        for (const repo of matchedRepos) {
          try {
            console.log('處理 ' + repoConfig.owner + '/' + repo.name + '...');
            
            const issues = await github.getAllIssues(repoConfig.owner, repo.name);
            
            const featurePrefix = github.getPrefixForRepo(repo.name, repoConfig.prefixRules);
            const color = github.getColorForRepo(repo.name, repoConfig.colorRules);
            
            const features = github.analyzeFeatureProgress(issues, featurePrefix);
            const stats = github.calculateProjectStats(features);

            data.projects.push({
              config: {
                name: repo.name,
                owner: repoConfig.owner,
                repo: repo.name,
                description: repo.description || '',
                url: repo.html_url,
                color: color
              },
              info: {
                name: repo.name,
                description: repo.description || '',
                language: repo.language,
                lastPush: repo.pushed_at
              },
              features: features.slice(0, 10),
              stats: stats
            });

            issues.slice(0, 5).forEach(issue => {
              data.recentActivity.push({
                project: repo.name,
                title: issue.title,
                action: issue.state === 'closed' ? '完成' : '更新',
                url: issue.html_url,
                updated: issue.updated_at,
                assignee: issue.assignee ? issue.assignee.login : null
              });
            });

            successCount++;
            console.log('✅ 成功處理 ' + repoConfig.owner + '/' + repo.name);

          } catch (error) {
            errorCount++;
            console.error('❌ 處理 ' + repoConfig.owner + '/' + repo.name + ' 時發生錯誤:', error.message);
            continue;
          }
        }
      }
    } catch (error) {
      errorCount++;
      console.error('❌ 處理 ' + repoConfig.owner + ' 時發生錯誤:', error.message);
      continue;
    }
  }

  data.recentActivity.sort((a, b) => new Date(b.updated) - new Date(a.updated));
  data.recentActivity = data.recentActivity.slice(0, 20);

  // 計算 summary
  data.summary.totalProjects = data.projects.length;
  data.summary.totalFeatures = data.projects.reduce((total, project) => total + (project.stats ? project.stats.total : 0), 0);
  data.summary.completedFeatures = data.projects.reduce((total, project) => total + (project.stats ? project.stats.completed : 0), 0);
  data.summary.inProgressFeatures = data.projects.reduce((total, project) => total + (project.stats ? project.stats.inProgress : 0), 0);
  data.summary.overallProgress = data.summary.totalFeatures > 0 ? Math.round((data.summary.completedFeatures / data.summary.totalFeatures) * 100) : 0;

  console.log('📊 資料收集完成: 成功 ' + successCount + ' 個，失敗 ' + errorCount + ' 個');
  console.log('📈 統計: ' + data.summary.totalProjects + ' 個專案, ' + data.summary.totalFeatures + ' 個功能, ' + data.summary.overallProgress + '% 完成');
  return data;
}

collectData().then(data => {
  console.log('收集到 ' + data.projects.length + ' 個專案');
  console.log('收集到 ' + data.recentActivity.length + ' 個活動記錄');
  
  if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data', { recursive: true });
  }
  
  fs.writeFileSync('./data/progress.json', JSON.stringify(data, null, 2));
  console.log('✅ 資料收集完成，已寫入 data/progress.json');
  
  if (data.projects.length === 0) {
    console.log('⚠️ 警告: 沒有收集到任何專案資料');
  }
}).catch(error => {
  console.error('❌ 資料收集失敗:', error);
  console.error('錯誤堆疊:', error.stack);
  
  const emptyData = {
    lastUpdate: new Date().toISOString(),
    projects: [],
    recentActivity: [],
    summary: {
      totalProjects: 0,
      totalFeatures: 0,
      completedFeatures: 0,
      inProgressFeatures: 0,
      overallProgress: 0
    },
    error: error.message
  };
  
  if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data', { recursive: true });
  }
  
  fs.writeFileSync('./data/progress.json', JSON.stringify(emptyData, null, 2));
  console.log('⚠️ 已寫入空的資料檔案');
});