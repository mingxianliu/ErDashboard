/**
 * 團隊管理 UI 渲染器模組
 * 負責複雜的HTML渲染邏輯
 */

class TeamUIRenderers {
    constructor(dataManager, statistics) {
        this.dataManager = dataManager;
        this.statistics = statistics;
    }

    // 渲染團隊總覽內容
    renderTeamOverview(stats) {
        return `
            <div class="row">
                <div class="col-12">
                    <h4 class="mb-4">
                        <i class="fas fa-chart-pie me-2"></i>團隊總覽
                        <span class="badge bg-primary ms-2">${new Date().toLocaleDateString()}</span>
                    </h4>
                </div>

                <!-- 統計卡片 -->
                <div class="col-md-3 mb-4">
                    <div class="card text-center h-100">
                        <div class="card-body">
                            <i class="fas fa-users fa-3x text-primary mb-3"></i>
                            <h3 class="card-title">${stats.totalMembers}</h3>
                            <p class="card-text text-muted">總成員數</p>
                        </div>
                    </div>
                </div>

                <div class="col-md-3 mb-4">
                    <div class="card text-center h-100">
                        <div class="card-body">
                            <i class="fas fa-project-diagram fa-3x text-success mb-3"></i>
                            <h3 class="card-title">${stats.totalProjects}</h3>
                            <p class="card-text text-muted">進行中專案</p>
                        </div>
                    </div>
                </div>

                <div class="col-md-3 mb-4">
                    <div class="card text-center h-100">
                        <div class="card-body">
                            <i class="fas fa-tasks fa-3x text-warning mb-3"></i>
                            <h3 class="card-title">${stats.totalAssignments}</h3>
                            <p class="card-text text-muted">任務分配</p>
                        </div>
                    </div>
                </div>

                <div class="col-md-3 mb-4">
                    <div class="card text-center h-100">
                        <div class="card-body">
                            <i class="fas fa-cogs fa-3x text-info mb-3"></i>
                            <h3 class="card-title">${stats.uniqueSkills}</h3>
                            <p class="card-text text-muted">技能類型</p>
                        </div>
                    </div>
                </div>

                <!-- 圖表區域 -->
                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="card-title mb-0">
                                <i class="fas fa-chart-donut me-2"></i>角色分布
                            </h6>
                        </div>
                        <div class="card-body">
                            ${this.renderRoleDistributionChart(stats.roleDistribution)}
                        </div>
                    </div>
                </div>

                <div class="col-md-6 mb-4">
                    <div class="card h-100">
                        <div class="card-header">
                            <h6 class="card-title mb-0">
                                <i class="fas fa-chart-bar me-2"></i>組別成員分布
                            </h6>
                        </div>
                        <div class="card-body">
                            ${this.renderGroupDistributionChart(stats.groupDistribution)}
                        </div>
                    </div>
                </div>

                <!-- 最近活動 -->
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="card-title mb-0">
                                <i class="fas fa-clock me-2"></i>最近活動
                            </h6>
                        </div>
                        <div class="card-body">
                            ${this.renderRecentActivity()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // 渲染角色分布圖表
    renderRoleDistributionChart(roleDistribution) {
        if (!roleDistribution || Object.keys(roleDistribution).length === 0) {
            return '<div class="text-center text-muted">暫無角色分布資料</div>';
        }

        let chartHtml = '';
        Object.entries(roleDistribution).forEach(([role, count]) => {
            const percentage = Math.round((count / Object.values(roleDistribution).reduce((a, b) => a + b, 0)) * 100);
            chartHtml += `
                <div class="mb-3">
                    <div class="d-flex justify-content-between mb-1">
                        <span class="small">${role}</span>
                        <span class="small">${count} 人 (${percentage}%)</span>
                    </div>
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        });

        return chartHtml;
    }

    // 渲染組別分布圖表
    renderGroupDistributionChart(groupDistribution) {
        if (!groupDistribution || Object.keys(groupDistribution).length === 0) {
            return '<div class="text-center text-muted">暫無組別分布資料</div>';
        }

        let chartHtml = '';
        Object.entries(groupDistribution).forEach(([group, count]) => {
            const colors = {
                'A組': '#3b82f6',
                'B組': '#ef4444',
                'C組': '#10b981',
                'D組': '#f59e0b'
            };
            const color = colors[group] || '#6b7280';

            chartHtml += `
                <div class="mb-3">
                    <div class="d-flex justify-content-between mb-1">
                        <span class="small">${group}</span>
                        <span class="small">${count} 人</span>
                    </div>
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar" style="width: ${(count / 7) * 100}%; background-color: ${color};"></div>
                    </div>
                </div>
            `;
        });

        return chartHtml;
    }

    // 渲染最近活動
    renderRecentActivity() {
        const activities = [
            { time: '2分鐘前', action: '成員 KlauderA 被分配到 ErCore 專案', type: 'assignment' },
            { time: '15分鐘前', action: '專案 ErDashboard 狀態更新為進行中', type: 'status' },
            { time: '1小時前', action: '新增成員 KopylotCYD 到 D組', type: 'member' },
            { time: '2小時前', action: '完成 ErNexus 專案的任務分配', type: 'task' }
        ];

        let activityHtml = '';
        activities.forEach(activity => {
            const icons = {
                assignment: 'fas fa-user-plus text-primary',
                status: 'fas fa-info-circle text-warning',
                member: 'fas fa-users text-success',
                task: 'fas fa-check-circle text-info'
            };
            const icon = icons[activity.type] || 'fas fa-circle text-secondary';

            activityHtml += `
                <div class="d-flex align-items-center mb-3">
                    <div class="avatar-sm">
                        <i class="${icon}"></i>
                    </div>
                    <div class="ms-3 flex-grow-1">
                        <div class="small text-muted">${activity.time}</div>
                        <div>${activity.action}</div>
                    </div>
                </div>
            `;
        });

        return activityHtml || '<div class="text-center text-muted">暫無最近活動</div>';
    }

    // 渲染成員管理內容
    renderMemberManagement() {
        const members = this.dataManager.getAllMembers();
        const groups = this.dataManager.teamConfig?.groups || {};

        if (!members || Object.keys(members).length === 0) {
            return `
                <div class="row">
                    <div class="col-12">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h4><i class="fas fa-users me-2"></i>成員管理</h4>
                            <button class="btn btn-primary" onclick="window.teamMemberManager.showAddMemberModal()">
                                <i class="fas fa-plus me-1"></i>新增成員
                            </button>
                        </div>
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            目前沒有成員資料。請點擊「新增成員」來加入第一個成員。
                        </div>
                    </div>
                </div>
            `;
        }

        // 按組別分類成員
        const membersByGroup = {};
        Object.entries(groups).forEach(([groupId, group]) => {
            membersByGroup[group.name || groupId] = [];
            if (group.members) {
                group.members.forEach(memberId => {
                    if (members[memberId]) {
                        membersByGroup[group.name || groupId].push({
                            ...members[memberId],
                            groupColor: group.color
                        });
                    }
                });
            }
        });

        let groupsHtml = '';
        Object.entries(membersByGroup).forEach(([groupName, groupMembers]) => {
            if (groupMembers.length === 0) return;

            let membersHtml = '';
            groupMembers.forEach(member => {
                const skillBadges = (member.skills || []).map(skill =>
                    `<span class="badge bg-secondary me-1">${skill}</span>`
                ).join('');

                membersHtml += `
                    <div class="col-md-6 col-lg-4 mb-3">
                        <div class="card h-100">
                            <div class="card-body">
                                <div class="d-flex align-items-center mb-3">
                                    <div class="avatar-sm rounded-circle d-flex align-items-center justify-content-center me-3"
                                         style="background-color: ${member.groupColor || '#6b7280'}; color: white;">
                                        ${member.name.substring(0, 1)}
                                    </div>
                                    <div>
                                        <h6 class="mb-0">${member.name}</h6>
                                        <small class="text-muted">${member.id}</small>
                                    </div>
                                </div>

                                <div class="mb-2">
                                    <small class="text-muted">技能:</small>
                                    <div>${skillBadges || '<span class="text-muted">未設定技能</span>'}</div>
                                </div>

                                <div class="mb-2">
                                    <small class="text-muted">加入日期:</small>
                                    <div class="small">${member.joinDate || '未設定'}</div>
                                </div>

                                ${member.notes ? `
                                    <div class="mb-2">
                                        <small class="text-muted">備註:</small>
                                        <div class="small">${member.notes}</div>
                                    </div>
                                ` : ''}
                            </div>
                            <div class="card-footer">
                                <div class="btn-group w-100">
                                    <button class="btn btn-outline-primary btn-sm" onclick="window.teamMemberManager.editMember('${member.id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-outline-danger btn-sm" onclick="window.teamMemberManager.removeMember('${member.id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });

            groupsHtml += `
                <div class="col-12 mb-4">
                    <h5 class="border-bottom pb-2">
                        <span class="badge me-2" style="background-color: ${groupMembers[0]?.groupColor || '#6b7280'};">
                            ${groupName}
                        </span>
                        <small class="text-muted">(${groupMembers.length} 人)</small>
                    </h5>
                    <div class="row">
                        ${membersHtml}
                    </div>
                </div>
            `;
        });

        return `
            <div class="row">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h4><i class="fas fa-users me-2"></i>成員管理</h4>
                        <div>
                            <button class="btn btn-success btn-sm me-2" onclick="window.teamMemberManager.showAddMemberModal()">
                                <i class="fas fa-plus me-1"></i>新增成員
                            </button>
                            <button class="btn btn-outline-primary btn-sm" onclick="window.teamManagement.loadMemberManagement()">
                                <i class="fas fa-sync-alt me-1"></i>重新整理
                            </button>
                        </div>
                    </div>
                </div>
                ${groupsHtml}
            </div>
        `;
    }

    // 渲染工作負載分析
    renderWorkloadAnalysis(workloadData) {
        if (!workloadData || Object.keys(workloadData).length === 0) {
            return '<div class="text-center text-muted py-4">暫無工作負載資料</div>';
        }

        let workloadHtml = '';
        Object.entries(workloadData).forEach(([memberId, data]) => {
            const member = this.dataManager.getAllMembers()[memberId];
            if (!member) return;

            const percentage = Math.min(data.workload * 20, 100); // 假設5個專案為100%
            const statusClass = percentage > 80 ? 'danger' : percentage > 60 ? 'warning' : 'success';

            workloadHtml += `
                <div class="row mb-3 align-items-center">
                    <div class="col-md-3">
                        <div class="d-flex align-items-center">
                            <div class="avatar-sm bg-primary rounded-circle d-flex align-items-center justify-content-center me-2">
                                ${member.name.substring(0, 1)}
                            </div>
                            <div>
                                <div class="fw-bold">${member.name}</div>
                                <small class="text-muted">${member.id}</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="progress">
                            <div class="progress-bar bg-${statusClass}" style="width: ${percentage}%">
                                ${data.workload} 個專案
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 text-end">
                        <span class="badge bg-${statusClass}">${percentage.toFixed(0)}%</span>
                    </div>
                </div>
            `;
        });

        return workloadHtml;
    }
}

// 設為全域可用
window.TeamUIRenderers = TeamUIRenderers;