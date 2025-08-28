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
