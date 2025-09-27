/**
 * 團隊成員管理模組
 * 負責成員的新增、編輯、刪除等操作
 */

class TeamMemberManager {
    constructor(dataManager, uiComponents) {
        this.dataManager = dataManager;
        this.uiComponents = uiComponents;
    }

    // 顯示新增成員模態框
    showAddMemberModal() {
        const modalHtml = `
            <div class="modal fade" id="addMemberModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-user-plus me-2"></i>新增成員
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="addMemberForm">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="newMemberId" class="form-label">成員 ID *</label>
                                            <input type="text" class="form-control" id="newMemberId" required>
                                            <div class="form-text">格式: A-CC, B-CA 等</div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="newMemberName" class="form-label">成員姓名 *</label>
                                            <input type="text" class="form-control" id="newMemberName" required>
                                        </div>
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="newMemberGroup" class="form-label">所屬組別 *</label>
                                            <select class="form-control" id="newMemberGroup" required>
                                                <option value="">請選擇組別</option>
                                                <option value="groupA">A組</option>
                                                <option value="groupB">B組</option>
                                                <option value="groupC">C組</option>
                                                <option value="groupD">D組</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="newMemberJoinDate" class="form-label">加入日期</label>
                                            <input type="date" class="form-control" id="newMemberJoinDate" value="${new Date().toISOString().split('T')[0]}">
                                        </div>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">技能專長</label>
                                    <div class="row">
                                        ${this.getSkillsCheckboxes()}
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label for="newMemberNotes" class="form-label">備註</label>
                                    <textarea class="form-control" id="newMemberNotes" rows="2"></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-primary" onclick="window.teamMemberManager.addMember()">
                                <i class="fas fa-plus me-1"></i>新增成員
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除已存在的模態框
        const existingModal = document.getElementById('addMemberModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 添加新的模態框
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // 顯示模態框
        const modal = new bootstrap.Modal(document.getElementById('addMemberModal'));
        modal.show();
    }

    // 獲取技能複選框HTML
    getSkillsCheckboxes() {
        const skillsMap = this.getSkillsMap();
        return Object.entries(skillsMap).map(([skillKey, skillInfo]) => `
            <div class="col-md-6">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="${skillKey}" id="skill_${skillKey}">
                    <label class="form-check-label" for="skill_${skillKey}">
                        <span class="badge" style="background-color: ${skillInfo.color};">${skillInfo.icon}</span>
                        ${skillInfo.name}
                    </label>
                </div>
            </div>
        `).join('');
    }

    // 獲取技能對應表
    getSkillsMap() {
        return this.dataManager.roles || {
            frontend: { name: '前端開發', icon: '[UI]', color: '#3b82f6' },
            backend: { name: '後端開發', icon: '[API]', color: '#ef4444' },
            fullstack: { name: '全端開發', icon: '[FULL]', color: '#8b5cf6' },
            system_design: { name: '系統設計', icon: '[SYS]', color: '#64748b' }
        };
    }

    // 新增成員
    async addMember() {
        try {
            const memberId = document.getElementById('newMemberId').value.trim();
            const memberName = document.getElementById('newMemberName').value.trim();
            const memberGroup = document.getElementById('newMemberGroup').value;
            const joinDate = document.getElementById('newMemberJoinDate').value;
            const notes = document.getElementById('newMemberNotes').value.trim();

            // 驗證必填欄位
            if (!memberId || !memberName || !memberGroup) {
                alert('請填寫所有必填欄位');
                return;
            }

            // 檢查 ID 格式
            if (!memberId.match(/^[A-Z]-[A-Z]{2,}$/)) {
                alert('成員 ID 格式錯誤，應為: A-CC, B-CA 等格式');
                return;
            }

            // 檢查是否已存在
            if (this.dataManager.members[memberId]) {
                alert(`成員 ID "${memberId}" 已存在`);
                return;
            }

            // 收集選中的技能
            const selectedSkills = [];
            document.querySelectorAll('#addMemberForm input[type="checkbox"]:checked').forEach(checkbox => {
                selectedSkills.push(checkbox.value);
            });

            // 創建新成員物件
            const newMember = {
                id: memberId,
                name: memberName,
                skills: selectedSkills,
                avatar: memberId,
                joinDate: joinDate || new Date().toISOString().split('T')[0],
                notes: notes || '新增成員'
            };

            // 保存到資料管理器
            this.dataManager.members[memberId] = newMember;

            // 更新組別成員列表
            if (this.dataManager.teamConfig && this.dataManager.teamConfig.groups && this.dataManager.teamConfig.groups[memberGroup]) {
                if (!this.dataManager.teamConfig.groups[memberGroup].members.includes(memberId)) {
                    this.dataManager.teamConfig.groups[memberGroup].members.push(memberId);
                }
            }

            // 保存變更
            await this.dataManager.saveMemberChanges();

            console.log('✅ 成員新增成功:', newMember);
            alert(`成員 "${memberName}" (${memberId}) 新增成功！`);

            // 關閉模態框
            const modal = bootstrap.Modal.getInstance(document.getElementById('addMemberModal'));
            if (modal) modal.hide();

            // 重新載入成員管理介面
            if (window.teamManagement && window.teamManagement.loadMemberManagement) {
                window.teamManagement.loadMemberManagement();
            }

        } catch (error) {
            console.error('❌ 新增成員失敗:', error);
            alert('新增成員失敗: ' + error.message);
        }
    }

    // 編輯成員
    editMember(memberId) {
        const member = this.dataManager.members[memberId];
        if (!member) {
            alert('找不到該成員');
            return;
        }

        const modalHtml = `
            <div class="modal fade" id="editMemberModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-edit me-2"></i>編輯成員：${member.name}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editMemberForm">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="editMemberId" class="form-label">成員 ID</label>
                                            <input type="text" class="form-control" id="editMemberId" value="${member.id}" readonly>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="editMemberName" class="form-label">成員姓名 *</label>
                                            <input type="text" class="form-control" id="editMemberName" value="${member.name}" required>
                                        </div>
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="editMemberJoinDate" class="form-label">加入日期</label>
                                            <input type="date" class="form-control" id="editMemberJoinDate" value="${member.joinDate || ''}">
                                        </div>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">技能專長</label>
                                    <div class="row">
                                        ${this.getSkillsCheckboxes(member.skills)}
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label for="editMemberNotes" class="form-label">備註</label>
                                    <textarea class="form-control" id="editMemberNotes" rows="2">${member.notes || ''}</textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="button" class="btn btn-primary" onclick="window.teamMemberManager.updateMember('${memberId}')">
                                <i class="fas fa-save me-1"></i>保存變更
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 移除已存在的模態框
        const existingModal = document.getElementById('editMemberModal');
        if (existingModal) {
            existingModal.remove();
        }

        // 添加新的模態框
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // 預選技能
        if (member.skills && Array.isArray(member.skills)) {
            member.skills.forEach(skill => {
                const checkbox = document.getElementById(`skill_${skill}`);
                if (checkbox) checkbox.checked = true;
            });
        }

        // 顯示模態框
        const modal = new bootstrap.Modal(document.getElementById('editMemberModal'));
        modal.show();
    }

    // 更新成員資料
    async updateMember(memberId) {
        try {
            const memberName = document.getElementById('editMemberName').value.trim();
            const joinDate = document.getElementById('editMemberJoinDate').value;
            const notes = document.getElementById('editMemberNotes').value.trim();

            if (!memberName) {
                alert('請填寫成員姓名');
                return;
            }

            // 收集選中的技能
            const selectedSkills = [];
            document.querySelectorAll('#editMemberForm input[type="checkbox"]:checked').forEach(checkbox => {
                selectedSkills.push(checkbox.value);
            });

            // 更新成員資料
            this.dataManager.members[memberId] = {
                ...this.dataManager.members[memberId],
                name: memberName,
                skills: selectedSkills,
                joinDate: joinDate,
                notes: notes
            };

            // 保存變更
            await this.dataManager.saveMemberChanges();

            console.log('✅ 成員更新成功:', this.dataManager.members[memberId]);
            alert(`成員 "${memberName}" 資料更新成功！`);

            // 關閉模態框
            const modal = bootstrap.Modal.getInstance(document.getElementById('editMemberModal'));
            if (modal) modal.hide();

            // 重新載入成員管理介面
            if (window.teamManagement && window.teamManagement.loadMemberManagement) {
                window.teamManagement.loadMemberManagement();
            }

        } catch (error) {
            console.error('❌ 更新成員失敗:', error);
            alert('更新成員失敗: ' + error.message);
        }
    }

    // 刪除成員
    async removeMember(memberId) {
        const member = this.dataManager.members[memberId];
        if (!member) {
            alert('找不到該成員');
            return;
        }

        const confirmed = confirm(`確定要刪除成員 "${member.name}" (${memberId}) 嗎？\n\n注意：此操作將同時從所有專案中移除該成員。`);
        if (!confirmed) return;

        try {
            // 從成員列表中刪除
            delete this.dataManager.members[memberId];

            // 從組別中移除
            if (this.dataManager.teamConfig && this.dataManager.teamConfig.groups) {
                Object.values(this.dataManager.teamConfig.groups).forEach(group => {
                    if (group.members && group.members.includes(memberId)) {
                        group.members = group.members.filter(id => id !== memberId);
                    }
                });
            }

            // 從專案分配中移除
            if (this.dataManager.assignments) {
                Object.values(this.dataManager.assignments).forEach(project => {
                    if (project.members && project.members[memberId]) {
                        delete project.members[memberId];
                    }
                });
            }

            // 保存變更
            await this.dataManager.saveMemberChanges();
            await this.dataManager.saveLocalChanges();

            console.log('✅ 成員刪除成功:', memberId);
            alert(`成員 "${member.name}" 已成功刪除！`);

            // 重新載入成員管理介面
            if (window.teamManagement && window.teamManagement.loadMemberManagement) {
                window.teamManagement.loadMemberManagement();
            }

        } catch (error) {
            console.error('❌ 刪除成員失敗:', error);
            alert('刪除成員失敗: ' + error.message);
        }
    }
}

// 設為全域可用
window.TeamMemberManager = TeamMemberManager;