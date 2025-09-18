/**
 * 團隊統計分析模組
 * 負責生成各種統計報告和工作負載分析
 */

class TeamStatistics {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    // 生成團隊統計資料
    generateTeamStatistics() {
        console.log('📊 開始生成團隊統計資料');
        console.log('this.members:', this.dataManager.members);
        console.log('this.assignments:', this.dataManager.assignments);

        const members = this.dataManager.members;
        const assignments = this.dataManager.assignments;

        const stats = {
            totalMembers: Object.keys(members).length,
            totalProjects: Object.keys(assignments).length,
            activeProjects: Object.values(assignments).filter(p => p.status === 'active').length,
            completedProjects: Object.values(assignments).filter(p => p.status === 'completed').length,
            memberUtilization: this.calculateMemberUtilization(),
            roleDistribution: this.calculateRoleDistribution(),
            projectStatusDistribution: this.calculateProjectStatusDistribution()
        };

        console.log('📊 統計資料生成完成:', stats);
        return stats;
    }

    // 計算成員利用率
    calculateMemberUtilization() {
        console.log('📊 計算成員利用率，成員數量:', Object.keys(this.dataManager.members).length);

        const members = this.dataManager.members;
        const assignments = this.dataManager.assignments;
        const utilization = {};

        console.log('📊 所有成員:', Object.keys(members));
        console.log('📊 所有專案:', Object.keys(assignments));

        // 初始化所有成員的利用率為0
        Object.keys(members).forEach(memberId => {
            utilization[memberId] = {
                name: members[memberId].name,
                totalProjects: 0,
                activeProjects: 0,
                completedProjects: 0,
                roles: []
            };
        });

        // 計算每個專案中成員的參與情況
        Object.values(assignments).forEach(project => {
            console.log('📊 處理專案:', project.projectName, '成員:', Object.keys(project.members || {}));
            if (project.members) {
                Object.keys(project.members).forEach(memberId => {
                    console.log('📊 檢查成員:', memberId, '是否存在於成員列表:', !!utilization[memberId]);
                    if (utilization[memberId]) {
                        utilization[memberId].totalProjects++;

                        if (project.status === 'active') {
                            utilization[memberId].activeProjects++;
                        } else if (project.status === 'completed') {
                            utilization[memberId].completedProjects++;
                        }

                        // 記錄角色
                        const role = project.members[memberId].role;
                        if (role && !utilization[memberId].roles.includes(role)) {
                            utilization[memberId].roles.push(role);
                        }
                    } else {
                        console.warn('⚠️ 專案中的成員不存在於成員列表:', memberId);
                    }
                });
            }
        });

        // 統計參與專案的成員數量
        const participatingMembers = Object.values(utilization).filter(member => member.totalProjects > 0);
        console.log('📊 參與專案的成員數量:', participatingMembers.length);
        console.log('📊 參與專案的成員:', participatingMembers.map(m => `${m.name}(${m.totalProjects}個專案)`));

        console.log('📊 成員利用率計算完成:', utilization);
        return utilization;
    }

    // 計算角色分佈 - 基於成員技能而非專案分配
    calculateRoleDistribution() {
        const members = this.dataManager.members;
        const skillCount = {};

        // 統計所有成員的技能
        Object.values(members).forEach(member => {
            if (member.skills && Array.isArray(member.skills)) {
                member.skills.forEach(skill => {
                    skillCount[skill] = (skillCount[skill] || 0) + 1;
                });
            }
        });

        return skillCount;
    }

    // 計算專案角色分配統計
    calculateProjectRoleDistribution() {
        const assignments = this.dataManager.assignments;
        const roleCount = {};

        Object.values(assignments).forEach(project => {
            if (project.members) {
                Object.values(project.members).forEach(member => {
                    const role = member.role;
                    if (role) {
                        roleCount[role] = (roleCount[role] || 0) + 1;
                    }
                });
            }
        });

        return roleCount;
    }

    // 計算專案狀態分佈
    calculateProjectStatusDistribution() {
        const assignments = this.dataManager.assignments;
        const statusCount = {};

        Object.values(assignments).forEach(project => {
            const status = project.status || 'unknown';
            statusCount[status] = (statusCount[status] || 0) + 1;
        });

        return statusCount;
    }

    // 獲取專案團隊概覽
    getProjectTeamOverview(projectId) {
        const project = this.dataManager.assignments[projectId];
        if (!project) return null;

        const overview = {
            projectId: projectId,
            projectName: project.projectName,
            status: project.status,
            totalMembers: Object.keys(project.members || {}).length,
            roleBreakdown: {},
            membersList: []
        };

        if (project.members) {
            Object.values(project.members).forEach(member => {
                const role = member.role;
                overview.roleBreakdown[role] = (overview.roleBreakdown[role] || 0) + 1;

                overview.membersList.push({
                    memberId: member.memberId,
                    name: this.dataManager.members[member.memberId]?.name || member.memberId,
                    role: role,
                    assignedDate: member.assignedDate,
                    tasks: member.tasks || []
                });
            });
        }

        return overview;
    }

    // 獲取工作負載報告
    getWorkloadReport() {
        const utilization = this.calculateMemberUtilization();
        const report = {
            overloaded: [], // 工作過多的成員
            balanced: [],   // 工作適中的成員
            underutilized: [] // 工作較少的成員
        };

        console.log('📊 工作負載報告 - utilization 物件:', utilization);
        console.log('📊 工作負載報告 - utilization 成員數:', Object.keys(utilization).length);

        Object.keys(utilization).forEach(memberId => {
            const member = utilization[memberId];
            const activeProjects = member.activeProjects;

            console.log(`📊 成員 ${memberId} (${member.name}): ${activeProjects} 個活躍專案`);

            if (activeProjects >= 3) {
                report.overloaded.push({ memberId, ...member });
                console.log(`  → 歸類為：工作過多`);
            } else if (activeProjects >= 1) {
                report.balanced.push({ memberId, ...member });
                console.log(`  → 歸類為：工作適中`);
            } else {
                report.underutilized.push({ memberId, ...member });
                console.log(`  → 歸類為：工作較少`);
            }
        });

        console.log('📊 最終工作負載報告:', {
            overloaded: report.overloaded.length,
            balanced: report.balanced.length,
            underutilized: report.underutilized.length
        });

        return report;
    }

    // 生成統計圖表資料
    generateChartData() {
        const roleDistribution = this.calculateRoleDistribution();
        const statusDistribution = this.calculateProjectStatusDistribution();

        return {
            roleChart: {
                labels: Object.keys(roleDistribution),
                data: Object.values(roleDistribution)
            },
            statusChart: {
                labels: Object.keys(statusDistribution),
                data: Object.values(statusDistribution)
            }
        };
    }
}

// 匯出給其他模組使用
window.TeamStatistics = TeamStatistics;