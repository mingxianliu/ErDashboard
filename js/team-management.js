// 團隊成員管理系統
class TeamManagement {
    constructor() {
        this.members = {};
        this.roles = {};
        this.assignments = {};
        this.constraints = {};
        this.init();
    }

    async init() {
        try {
            await this.loadTeamData();
            await this.loadAssignments();
            console.log('✅ 團隊管理系統初始化完成');
        } catch (error) {
            console.error('❌ 團隊管理系統初始化失敗:', error);
        }
    }

    async loadTeamData() {
        const response = await fetch('config/team-members.json');
        const data = await response.json();
        this.members = data.members;
        this.roles = data.roles;
    }

    async loadAssignments() {
        const response = await fetch('config/project-assignments.json');
        const data = await response.json();
        this.assignments = data.assignments;
        this.constraints = data.constraints;
    }

    // 獲取專案成員分配
    getProjectAssignments(projectId) {
        return this.assignments[projectId] || null;
    }

    // 獲取成員在專案中的角色
    getMemberRole(projectId, memberId) {
        const project = this.assignments[projectId];
        if (!project || !project.members[memberId]) {
            return null;
        }
        return project.members[memberId];
    }

    // 檢查成員是否可以分配到指定角色
    canAssignMemberToRole(projectId, memberId, role) {
        const project = this.assignments[projectId];

        // 檢查成員是否已在該專案中擁有其他角色
        if (project && project.members[memberId]) {
            const currentRole = project.members[memberId].role;
            if (currentRole !== role) {
                return {
                    success: false,
                    reason: `成員${memberId}已在${projectId}專案中擔任${this.roles[currentRole].name}，不能同時擔任${this.roles[role].name}`
                };
            }
        }

        // 檢查成員是否具備該技能
        const member = this.members[memberId];
        if (!member || !member.skills.includes(role)) {
            return {
                success: false,
                reason: `成員${memberId}不具備${this.roles[role].name}技能`
            };
        }

        return { success: true };
    }

    // 獲取專案團隊概覽
    getProjectTeamOverview(projectId) {
        const project = this.assignments[projectId];
        if (!project) return null;

        const overview = {
            projectId,
            projectName: project.projectName,
            status: project.status,
            lastUpdated: project.lastUpdated,
            roles: {
                frontend: [],
                backend: [],
                testing: []
            },
            totalMembers: 0
        };

        Object.values(project.members).forEach(assignment => {
            const member = this.members[assignment.memberId];
            const roleInfo = {
                memberId: assignment.memberId,
                memberName: member.name,
                avatar: member.avatar,
                assignedDate: assignment.assignedDate,
                tasks: assignment.tasks
            };

            overview.roles[assignment.role].push(roleInfo);
            overview.totalMembers++;
        });

        return overview;
    }

    // 獲取所有可用成員（未在指定專案中分配的成員）
    getAvailableMembers(projectId) {
        const project = this.assignments[projectId];
        const assignedMemberIds = project ? Object.keys(project.members) : [];

        return Object.values(this.members).filter(member =>
            !assignedMemberIds.includes(member.id)
        );
    }

    // 獲取成員工作負載統計
    getMemberWorkload(memberId) {
        const workload = {
            memberId,
            memberName: this.members[memberId]?.name || `成員${memberId}`,
            projects: [],
            totalProjects: 0,
            roles: {
                frontend: 0,
                backend: 0,
                testing: 0
            }
        };

        Object.entries(this.assignments).forEach(([projectId, project]) => {
            if (project.members[memberId]) {
                const assignment = project.members[memberId];
                workload.projects.push({
                    projectId,
                    projectName: project.projectName,
                    role: assignment.role,
                    roleName: this.roles[assignment.role].name,
                    assignedDate: assignment.assignedDate,
                    tasks: assignment.tasks,
                    status: project.status
                });
                workload.roles[assignment.role]++;
                workload.totalProjects++;
            }
        });

        return workload;
    }

    // 生成團隊統計報告
    generateTeamStatistics() {
        const stats = {
            totalMembers: Object.keys(this.members).length,
            totalProjects: Object.keys(this.assignments).length,
            activeProjects: 0,
            completedProjects: 0,
            memberUtilization: {},
            roleDistribution: {
                frontend: 0,
                backend: 0,
                testing: 0
            },
            availableMembers: []
        };

        // 計算專案狀態
        Object.values(this.assignments).forEach(project => {
            if (project.status === 'active') {
                stats.activeProjects++;
            } else if (project.status === 'completed') {
                stats.completedProjects++;
            }

            // 計算角色分布
            Object.values(project.members).forEach(assignment => {
                stats.roleDistribution[assignment.role]++;
            });
        });

        // 計算成員利用率
        Object.keys(this.members).forEach(memberId => {
            const workload = this.getMemberWorkload(memberId);
            stats.memberUtilization[memberId] = {
                name: workload.memberName,
                projects: workload.totalProjects,
                roles: workload.roles
            };

            if (workload.totalProjects === 0) {
                stats.availableMembers.push(memberId);
            }
        });

        return stats;
    }

    // 渲染專案團隊卡片
    renderProjectTeamCard(projectId) {
        const overview = this.getProjectTeamOverview(projectId);
        if (!overview) return '';

        const statusBadge = overview.status === 'completed' ?
            '<span class="badge bg-success">已完成</span>' :
            '<span class="badge bg-primary">進行中</span>';

        return `
            <div class="card mt-3">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">
                        <i class="fas fa-users me-2"></i>
                        專案團隊 (${overview.totalMembers}人)
                    </h6>
                    ${statusBadge}
                </div>
                <div class="card-body">
                    <div class="row">
                        ${this.renderRoleSection('frontend', overview.roles.frontend)}
                        ${this.renderRoleSection('backend', overview.roles.backend)}
                        ${this.renderRoleSection('testing', overview.roles.testing)}
                    </div>
                    <small class="text-muted">最後更新：${overview.lastUpdated}</small>
                </div>
            </div>
        `;
    }

    renderRoleSection(roleKey, members) {
        const role = this.roles[roleKey];
        if (!role) return '';

        const memberCards = members.map(member => `
            <div class="d-flex align-items-center mb-2">
                <span class="me-2" style="font-size: 1.2em;">${member.avatar}</span>
                <div class="flex-grow-1">
                    <div class="fw-bold">${member.memberName}</div>
                    <small class="text-muted">${member.tasks.slice(0, 2).join('、')}</small>
                </div>
            </div>
        `).join('');

        return `
            <div class="col-md-4">
                <h6 class="text-center mb-3" style="color: ${role.color}">
                    <span class="me-1">${role.icon}</span>
                    ${role.name}
                </h6>
                ${memberCards || '<small class="text-muted">尚未分配</small>'}
            </div>
        `;
    }
}

// 全域實例
window.teamManagement = new TeamManagement();