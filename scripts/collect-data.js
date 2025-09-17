const fs = require('fs');
const path = require('path');
const { Octokit } = require('@octokit/rest');

// GitHub token from environment variable
const token = process.env.GITHUB_TOKEN;
const octokit = new Octokit({ auth: token });

// Configuration
const CONFIG = {
    owner: 'mingxianliu',
    repoPattern: 'Er*',
    prefixRules: [
        { pattern: 'ErCore*', prefix: 'ERC' },
        { pattern: 'ErAid-Ecosystem*', prefix: 'ERAI' },
        { pattern: 'ErForge*', prefix: 'ERF' },
        { pattern: 'ErTidy*', prefix: 'ERT' },
        { pattern: 'ErGrant*', prefix: 'ERG' },
        { pattern: 'ErStore*', prefix: 'ERS' },
        { pattern: 'ErSlice*', prefix: 'ERSL' },
        { pattern: 'ErShield*', prefix: 'ERSH' },
        { pattern: 'ErShowcase*', prefix: 'ERSC' },
        { pattern: 'ErProphet*', prefix: 'ERP' },
        { pattern: '*', prefix: 'ER' }
    ],
    colorRules: [
        { pattern: 'ErCore*', color: '#ff6b6b' },
        { pattern: 'ErAid-Ecosystem*', color: '#fd7e14' },
        { pattern: 'ErForge*', color: '#6f42c1' },
        { pattern: 'ErTidy*', color: '#20c997' },
        { pattern: 'ErGrant*', color: '#e83e8c' },
        { pattern: 'ErStore*', color: '#007bff' },
        { pattern: 'ErSlice*', color: '#dc3545' },
        { pattern: 'ErShield*', color: '#343a40' },
        { pattern: 'ErShowcase*', color: '#ffc107' },
        { pattern: 'ErProphet*', color: '#6610f2' },
        { pattern: '*', color: '#17a2b8' }
    ]
};

// Helper function to match pattern
function matchPattern(name, pattern) {
    const escaped = pattern.replace(/[.+^${}()|\[\]\\]/g, '\\$&');
    const regex = new RegExp('^' + escaped.replace(/\*/g, '.*') + '$');
    return regex.test(name);
}

// Get prefix for repo name
function getPrefix(repoName) {
    for (const rule of CONFIG.prefixRules) {
        if (matchPattern(repoName, rule.pattern)) {
            return rule.prefix;
        }
    }
    return 'ER';
}

// Get color for repo name
function getColor(repoName) {
    for (const rule of CONFIG.colorRules) {
        if (matchPattern(repoName, rule.pattern)) {
            return rule.color;
        }
    }
    return '#17a2b8';
}

// Analyze feature progress from issues
function analyzeFeatureProgress(issues, featurePrefix) {
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

// Calculate project statistics
function calculateProjectStats(features) {
    const total = Object.keys(features).length;
    const completed = Object.values(features).filter(f => f.status === 'closed').length;
    const inProgress = Object.values(features).filter(f => f.status === 'open').length;
    return {
        total,
        completed,
        inProgress,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0
    };
}

// Main function to collect data
async function collectData() {
    console.log('Starting data collection...');
    
    const projects = [];
    const allActivity = [];
    
    try {
        // Get all repositories for the owner
        const { data: repos } = await octokit.paginate(octokit.repos.listForUser, {
            username: CONFIG.owner,
            per_page: 100
        });
        
        // Filter repositories matching the pattern
        const matchingRepos = repos.filter(repo => matchPattern(repo.name, CONFIG.repoPattern));
        
        console.log(`Found ${matchingRepos.length} matching repositories`);
        
        // Process each repository
        for (const repo of matchingRepos) {
            console.log(`Processing ${repo.name}...`);
            
            try {
                // Get all issues (including PRs)
                const issues = await octokit.paginate(octokit.issues.listForRepo, {
                    owner: CONFIG.owner,
                    repo: repo.name,
                    state: 'all',
                    per_page: 100
                });
                
                // Determine prefix and color for this repo
                const prefix = getPrefix(repo.name);
                const color = getColor(repo.name);
                
                // Analyze features
                const features = analyzeFeatureProgress(issues, prefix);
                const stats = calculateProjectStats(features);
                
                // Collect recent activity (last 7 days)
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                
                const recentIssues = issues
                    .filter(issue => new Date(issue.updated_at) > sevenDaysAgo)
                    .slice(0, 5);
                
                recentIssues.forEach(issue => {
                    allActivity.push({
                        project: repo.name,
                        title: issue.title,
                        action: issue.state === 'closed' ? '完成' : '更新',
                        url: issue.html_url,
                        updated: issue.updated_at,
                        assignee: issue.assignee ? issue.assignee.login : null
                    });
                });
                
                // Add project data
                projects.push({
                    config: {
                        name: `Er 專案群 - ${repo.name}`,
                        owner: CONFIG.owner,
                        repo: repo.name,
                        description: repo.description || '',
                        featurePrefix: prefix,
                        color: color,
                        priority: 1
                    },
                    info: {
                        name: repo.name,
                        description: repo.description,
                        stars: repo.stargazers_count,
                        forks: repo.forks_count,
                        openIssues: repo.open_issues_count,
                        language: repo.language,
                        lastPush: repo.pushed_at
                    },
                    features: features,
                    stats: stats
                });
                
            } catch (error) {
                console.error(`Error processing ${repo.name}:`, error.message);
                projects.push({
                    config: {
                        name: `Er 專案群 - ${repo.name}`,
                        owner: CONFIG.owner,
                        repo: repo.name,
                        description: repo.description || '',
                        featurePrefix: getPrefix(repo.name),
                        color: getColor(repo.name),
                        priority: 1
                    },
                    info: {
                        name: repo.name,
                        description: repo.description,
                        stars: repo.stargazers_count,
                        forks: repo.forks_count
                    },
                    features: {},
                    stats: { total: 0, completed: 0, inProgress: 0, progress: 0 },
                    error: error.message
                });
            }
        }
        
        // Sort activity by date
        allActivity.sort((a, b) => new Date(b.updated) - new Date(a.updated));
        
        // Calculate overall summary
        const summary = {
            totalProjects: projects.length,
            totalFeatures: projects.reduce((sum, p) => sum + p.stats.total, 0),
            completedFeatures: projects.reduce((sum, p) => sum + p.stats.completed, 0),
            inProgressFeatures: projects.reduce((sum, p) => sum + p.stats.inProgress, 0)
        };
        summary.overallProgress = summary.totalFeatures > 0 
            ? Math.round((summary.completedFeatures / summary.totalFeatures) * 100) 
            : 0;
        
        // Prepare final data
        const dashboardData = {
            lastUpdate: new Date().toISOString(),
            projects: projects,
            summary: summary,
            recentActivity: allActivity.slice(0, 20)
        };
        
        // Save to file
        const dataDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        const outputPath = path.join(dataDir, 'progress.json');
        fs.writeFileSync(outputPath, JSON.stringify(dashboardData, null, 2));
        
        console.log(`Data saved to ${outputPath}`);
        console.log(`Processed ${projects.length} projects with ${summary.totalFeatures} features`);
        
    } catch (error) {
        console.error('Error collecting data:', error);
        process.exit(1);
    }
}

// Run the collection
collectData().catch(console.error);