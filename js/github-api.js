class GitHubAPI {
    constructor(token = null) {
        this.baseUrl = 'https://api.github.com';
        this.token = token;
        this.headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Project-Dashboard'
        };
        if (this.token) {
            this.headers['Authorization'] = `token ${this.token}`;
        }
    }

    async request(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`GitHub API Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // 取得 Repository 的 Issues (包含 PR) - 單頁
    async getIssues(owner, repo, state = 'all', page = 1, perPage = 100) {
        return await this.request(`/repos/${owner}/${repo}/issues?state=${state}&per_page=${perPage}&page=${page}`);
    }

    // 取得所有 Issues（自動分頁）
    async getAllIssues(owner, repo, state = 'all') {
        const perPage = 100;
        let page = 1;
        const all = [];
        while (true) {
            const batch = await this.getIssues(owner, repo, state, page, perPage);
            all.push(...batch);
            if (!Array.isArray(batch) || batch.length < perPage) break;
            page += 1;
        }
        return all;
    }

    // 取得 Repository 資訊
    async getRepository(owner, repo) {
        return await this.request(`/repos/${owner}/${repo}`);
    }

    // 取得最近的 commits（未使用但保留）
    async getCommits(owner, repo, since = null) {
        let endpoint = `/repos/${owner}/${repo}/commits?per_page=10`;
        if (since) {
            endpoint += `&since=${since}`;
        }
        return await this.request(endpoint);
    }

    // 列出使用者 repos（自動分頁）
    async listUserReposAll(owner) {
        const perPage = 100;
        let page = 1;
        const all = [];
        while (true) {
            const batch = await this.request(`/users/${owner}/repos?per_page=${perPage}&page=${page}`);
            if (!Array.isArray(batch) || batch.length === 0) break;
            all.push(...batch);
            if (batch.length < perPage) break;
            page += 1;
        }
        return all;
    }

    // 列出組織 repos（自動分頁）
    async listOrgReposAll(owner) {
        const perPage = 100;
        let page = 1;
        const all = [];
        while (true) {
            const batch = await this.request(`/orgs/${owner}/repos?per_page=${perPage}&page=${page}`);
            if (!Array.isArray(batch) || batch.length === 0) break;
            all.push(...batch);
            if (batch.length < perPage) break;
            page += 1;
        }
        return all;
    }

    // 嘗試使用者/組織兩種路徑列出 repos
    async listOwnerReposAll(owner) {
        console.log(`正在列出 ${owner} 的所有 repositories...`);
        
        try {
            // 先嘗試用戶 repos (包含私有的)
            const userRepos = await this.listUserReposAll(owner);
            console.log(`找到 ${userRepos.length} 個用戶 repositories`);
            return userRepos;
        } catch (userError) {
            console.log(`用戶 API 失敗: ${userError.message}`);
            
            try {
                // 再試組織 repos
                const orgRepos = await this.listOrgReposAll(owner);
                console.log(`找到 ${orgRepos.length} 個組織 repositories`);
                return orgRepos;
            } catch (orgError) {
                console.error(`組織 API 也失敗: ${orgError.message}`);
                throw new Error(`無法列出 ${owner} 的 repositories: 用戶API(${userError.message}), 組織API(${orgError.message})`);
            }
        }
    }

    // 依萬用字元樣式（*）過濾 repo 名稱
    filterReposByPattern(repos, pattern) {
        console.log(`過濾條件：pattern="${pattern}"`);
        console.log('所有 repo 名稱:', repos.map(r => r.name));
        
        const escaped = pattern.replace(/[.+^${}()|\[\]\\]/g, '\\$&');
        const regex = new RegExp('^' + escaped.replace(/\*/g, '.*') + '$');
        console.log(`生成的正規表達式: ${regex}`);
        
        const matched = repos.filter(r => {
            const isMatch = regex.test(r.name);
            console.log(`${r.name} -> ${isMatch ? '符合' : '不符合'}`);
            return isMatch;
        });
        
        console.log(`符合條件的 repo:`, matched.map(r => r.name));
        return matched;
    }

    // 分析功能進度
    analyzeFeatureProgress(issues, featurePrefix) {
        const features = {};
        const regex = new RegExp(`${featurePrefix}\\d{4}`, 'gi');

        issues.forEach(issue => {
            const matches = issue.title.match(regex);
            if (matches) {
                const featureCode = matches[0].toUpperCase();
                features[featureCode] = {
                    title: issue.title.replace(regex, '').trim(),
                    status: issue.state,
                    number: issue.number,
                    url: issue.html_url,
                    created: issue.created_at,
                    updated: issue.updated_at,
                    assignee: issue.assignee ? issue.assignee.login : null,
                    labels: (issue.labels || []).map(label => label.name),
                    isPullRequest: !!issue.pull_request
                };
            }
        });

        return features;
    }
}
