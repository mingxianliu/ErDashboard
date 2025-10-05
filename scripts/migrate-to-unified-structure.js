/**
 * 資料遷移腳本
 * 將現有的分散資料遷移到統一的 Google Drive 結構
 *
 * 使用方式：
 * 1. 在瀏覽器中開啟 team-management.html
 * 2. 開啟開發者工具 Console
 * 3. 載入此腳本
 * 4. 執行 MigrationManager.runMigration()
 */

class MigrationManager {
  constructor() {
    this.unifiedData = null;
    this.backupData = {};
  }

  /**
   * 執行完整遷移流程
   */
  async runMigration() {
    console.log('═══════════════════════════════════════════');
    console.log('🚀 開始資料遷移到統一結構');
    console.log('═══════════════════════════════════════════');

    try {
      // 步驟 1: 備份現有資料
      await this.backupCurrentData();

      // 步驟 2: 收集所有資料來源
      const collectedData = await this.collectAllData();

      // 步驟 3: 轉換為統一格式
      this.unifiedData = await this.transformToUnified(collectedData);

      // 步驟 4: 驗證資料完整性
      const validation = this.validateData(this.unifiedData);
      if (!validation.valid) {
        console.error('❌ 資料驗證失敗:', validation.errors);
        throw new Error('資料驗證失敗');
      }

      // 步驟 5: 上傳到 Google Drive
      await this.uploadToGoogleDrive(this.unifiedData);

      // 步驟 6: 驗證同步
      await this.verifySyncedData();

      console.log('═══════════════════════════════════════════');
      console.log('✅ 資料遷移完成！');
      console.log('═══════════════════════════════════════════');

      return this.unifiedData;

    } catch (error) {
      console.error('❌ 遷移失敗:', error);
      console.log('🔄 正在恢復備份資料...');
      await this.restoreBackup();
      throw error;
    }
  }

  /**
   * 步驟 1: 備份現有資料
   */
  async backupCurrentData() {
    console.log('\n📦 步驟 1/6: 備份現有資料...');

    try {
      // 備份 localStorage
      this.backupData.localStorage = {
        'cachedTeamMembers': localStorage.getItem('cachedTeamMembers'),
        'teamAssignments': localStorage.getItem('teamAssignments'),
        'teamMemberChanges': localStorage.getItem('teamMemberChanges'),
        'teamGroupChanges': localStorage.getItem('teamGroupChanges')
      };

      // 備份檔案
      this.backupData.files = {};

      const filesToBackup = [
        'config/team-members.json',
        'config/project-assignments.json'
      ];

      for (const file of filesToBackup) {
        try {
          const response = await fetch(file);
          if (response.ok) {
            this.backupData.files[file] = await response.json();
          }
        } catch (error) {
          console.warn(`⚠️ 無法備份 ${file}:`, error.message);
        }
      }

      console.log('✅ 資料備份完成');
      console.log('   - localStorage 項目:', Object.keys(this.backupData.localStorage).length);
      console.log('   - 檔案備份:', Object.keys(this.backupData.files).length);

    } catch (error) {
      console.error('❌ 備份失敗:', error);
      throw error;
    }
  }

  /**
   * 步驟 2: 收集所有資料來源
   */
  async collectAllData() {
    console.log('\n📊 步驟 2/6: 收集所有資料來源...');

    const collected = {
      members: {},
      roles: {},
      groups: {},
      projects: {},
      assignments: {},
      constraints: {},
      statistics: {}
    };

    try {
      // 來源 1: team-members.json
      console.log('   📁 讀取 team-members.json...');
      const teamMembersResponse = await fetch('config/team-members.json');
      if (teamMembersResponse.ok) {
        const teamData = await teamMembersResponse.json();
        collected.members = teamData.members || {};
        collected.roles = teamData.roles || {};
        collected.groups = teamData.groups || {};
        console.log(`   ✅ 成員數: ${Object.keys(collected.members).length}`);
        console.log(`   ✅ 角色數: ${Object.keys(collected.roles).length}`);
        console.log(`   ✅ 組別數: ${Object.keys(collected.groups).length}`);
      }

      // 來源 2: project-assignments.json
      console.log('   📁 讀取 project-assignments.json...');
      const assignmentsResponse = await fetch('config/project-assignments.json');
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        collected.assignments = assignmentsData.assignments || {};
        collected.constraints = assignmentsData.constraints || {};
        collected.statistics = assignmentsData.statistics || {};
        console.log(`   ✅ 專案數: ${Object.keys(collected.assignments).length}`);
      }

      // 來源 3: localStorage 的本地變更
      console.log('   📁 讀取 localStorage 變更...');
      const localAssignments = localStorage.getItem('teamAssignments');
      if (localAssignments) {
        try {
          const localData = JSON.parse(localAssignments);
          // 合併本地變更
          for (const [projectId, projectData] of Object.entries(localData)) {
            if (collected.assignments[projectId]) {
              collected.assignments[projectId] = {
                ...collected.assignments[projectId],
                ...projectData
              };
            } else {
              collected.assignments[projectId] = projectData;
            }
          }
          console.log('   ✅ 已合併 localStorage 變更');
        } catch (error) {
          console.warn('   ⚠️ localStorage 資料解析失敗:', error);
        }
      }

      // 來源 4: Markdown 專案檔案
      console.log('   📁 讀取 Markdown 專案檔案...');
      for (const projectId of Object.keys(collected.assignments)) {
        try {
          const mdResponse = await fetch(`projects/${projectId}.md`);
          if (mdResponse.ok) {
            const mdContent = await mdResponse.text();
            const parsedData = this.parseMarkdownProject(mdContent, projectId);

            if (!collected.projects[projectId]) {
              collected.projects[projectId] = {};
            }

            collected.projects[projectId].markdownData = parsedData;
            console.log(`   ✅ ${projectId}.md 解析完成`);
          }
        } catch (error) {
          console.warn(`   ⚠️ 無法讀取 ${projectId}.md`);
        }
      }

      console.log('✅ 資料收集完成');
      return collected;

    } catch (error) {
      console.error('❌ 資料收集失敗:', error);
      throw error;
    }
  }

  /**
   * 步驟 3: 轉換為統一格式
   */
  async transformToUnified(collected) {
    console.log('\n🔄 步驟 3/6: 轉換為統一格式...');

    const unified = {
      organization: {
        name: "Er 研發組織",
        description: "Er 系列專案研發團隊",
        groups: collected.groups || {}
      },

      members: collected.members || {},
      roles: collected.roles || {},
      projects: {},
      devLog: { entries: [] },

      config: {
        constraints: collected.constraints || {},
        statistics: collected.statistics || {}
      },

      metadata: {
        version: "2.0.0",
        schemaVersion: "unified-v1",
        lastSync: new Date().toISOString(),
        syncSource: "migration",
        migratedFrom: {
          teamMembers: "config/team-members.json",
          projectAssignments: "config/project-assignments.json",
          localStorage: true
        },
        dataIntegrity: {
          checksums: {},
          validatedAt: new Date().toISOString()
        }
      }
    };

    // 轉換每個專案
    for (const [projectId, assignmentData] of Object.entries(collected.assignments)) {
      console.log(`   🔧 轉換專案: ${projectId}`);

      const markdownData = collected.projects[projectId]?.markdownData || {};

      unified.projects[projectId] = {
        projectId: assignmentData.projectId || projectId,
        projectName: assignmentData.projectName || projectId,
        description: markdownData.description || "",
        status: assignmentData.status || "active",
        priority: this.getProjectPriority(projectId),
        progress: assignmentData.progress || 0,

        metadata: {
          startDate: this.extractStartDate(assignmentData, markdownData),
          lastUpdated: assignmentData.lastUpdated || new Date().toISOString().split('T')[0],
          completeDate: assignmentData.completeDate || null,
          repository: `https://github.com/mingxianliu/${projectId}`,
          featurePrefix: this.getFeaturePrefix(projectId)
        },

        members: assignmentData.members || {},
        memberHistory: assignmentData.memberHistory || [],
        notes: assignmentData.notes || "[]",

        coreMetrics: markdownData.coreMetrics || {
          frontend: { progress: 0, status: "🎯 規劃中", tasks: [] },
          backend: { progress: 0, status: "🎯 規劃中", tasks: [] },
          database: { progress: 0, status: "🎯 規劃中", tasks: [] },
          deployment: { progress: 0, status: "🎯 規劃中", tasks: [] },
          validation: { progress: 0, status: "🎯 規劃中", tasks: [] }
        },

        features: markdownData.features || {
          completed: [],
          inProgress: [],
          planned: []
        },

        issues: markdownData.issues || [],

        github: {
          owner: "mingxianliu",
          repo: projectId,
          stars: 0,
          forks: 0,
          openIssues: 0,
          language: "",
          lastPush: null
        }
      };

      console.log(`   ✅ ${projectId} 轉換完成`);
    }

    console.log(`✅ 統一格式轉換完成，共 ${Object.keys(unified.projects).length} 個專案`);
    return unified;
  }

  /**
   * 步驟 4: 驗證資料完整性
   */
  validateData(data) {
    console.log('\n✅ 步驟 4/6: 驗證資料完整性...');

    const errors = [];
    const warnings = [];

    // 檢查頂層結構
    const requiredFields = ['organization', 'members', 'roles', 'projects', 'config', 'metadata'];
    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push(`缺少必要欄位: ${field}`);
      }
    }

    // 檢查成員資料
    const memberCount = Object.keys(data.members || {}).length;
    console.log(`   👥 成員數量: ${memberCount}`);
    if (memberCount === 0) {
      errors.push('沒有成員資料');
    }

    // 檢查專案資料
    const projectCount = Object.keys(data.projects || {}).length;
    console.log(`   📁 專案數量: ${projectCount}`);
    if (projectCount === 0) {
      errors.push('沒有專案資料');
    }

    // 檢查每個專案的完整性
    for (const [projectId, project] of Object.entries(data.projects || {})) {
      if (!project.projectId) warnings.push(`專案 ${projectId}: 缺少 projectId`);
      if (!project.members) warnings.push(`專案 ${projectId}: 缺少 members`);
      if (!project.metadata) warnings.push(`專案 ${projectId}: 缺少 metadata`);

      // 檢查成員是否都存在於 members 中
      for (const memberId of Object.keys(project.members || {})) {
        if (!data.members[memberId]) {
          warnings.push(`專案 ${projectId}: 成員 ${memberId} 不存在於 members 中`);
        }
      }
    }

    console.log(`   ✅ 驗證完成`);
    console.log(`   📊 錯誤: ${errors.length}, 警告: ${warnings.length}`);

    if (warnings.length > 0) {
      console.log('   ⚠️ 警告清單:');
      warnings.forEach(w => console.log(`      - ${w}`));
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 步驟 5: 上傳到 Google Drive
   */
  async uploadToGoogleDrive(data) {
    console.log('\n☁️  步驟 5/6: 上傳到 Google Drive...');

    // 檢查 Google Drive API 是否可用
    if (!window.googleDriveAPI) {
      throw new Error('Google Drive API 未初始化');
    }

    if (!window.googleDriveAPI.isReady()) {
      throw new Error('Google Drive API 未準備好');
    }

    if (!window.googleDriveAPI.isSignedIn()) {
      console.log('   🔐 需要登入 Google Drive...');
      const loginSuccess = await window.googleDriveAPI.signIn();
      if (!loginSuccess) {
        throw new Error('Google Drive 登入失敗');
      }
    }

    try {
      // 上傳統一資料檔案
      console.log('   📤 上傳統一資料檔案...');
      await window.googleDriveAPI.saveFile('unified-data.json', data, 'unified');
      console.log('   ✅ unified-data.json 上傳成功');

      // 為了向後兼容，也更新舊格式的檔案
      console.log('   📤 更新向後兼容檔案...');

      // team-members.json
      const teamMembersData = {
        members: data.members,
        roles: data.roles,
        groups: data.organization.groups
      };
      await window.googleDriveAPI.saveFile('team-members.json', teamMembersData, 'members');
      console.log('   ✅ team-members.json 更新成功');

      // project-assignments.json
      const assignmentsData = {
        assignments: {},
        constraints: data.config.constraints,
        statistics: data.config.statistics
      };

      for (const [projectId, project] of Object.entries(data.projects)) {
        assignmentsData.assignments[projectId] = {
          projectId: project.projectId,
          projectName: project.projectName,
          progress: project.progress,
          members: project.members,
          memberHistory: project.memberHistory,
          lastUpdated: project.metadata.lastUpdated,
          status: project.status,
          notes: project.notes
        };
      }

      await window.googleDriveAPI.saveFile('project-assignments.json', assignmentsData, 'assignments');
      console.log('   ✅ project-assignments.json 更新成功');

      console.log('✅ Google Drive 上傳完成');

    } catch (error) {
      console.error('❌ Google Drive 上傳失敗:', error);
      throw error;
    }
  }

  /**
   * 步驟 6: 驗證同步資料
   */
  async verifySyncedData() {
    console.log('\n🔍 步驟 6/6: 驗證同步資料...');

    try {
      // 從 Google Drive 讀取回來驗證
      const syncedData = await window.googleDriveAPI.loadFile('unified-data.json');

      if (!syncedData) {
        throw new Error('無法從 Google Drive 讀取資料');
      }

      // 比較資料
      const originalProjectCount = Object.keys(this.unifiedData.projects).length;
      const syncedProjectCount = Object.keys(syncedData.data?.projects || syncedData.projects || {}).length;

      console.log(`   📊 原始專案數: ${originalProjectCount}`);
      console.log(`   📊 同步專案數: ${syncedProjectCount}`);

      if (originalProjectCount === syncedProjectCount) {
        console.log('   ✅ 資料同步驗證成功');
      } else {
        console.warn('   ⚠️ 資料數量不一致');
      }

    } catch (error) {
      console.error('❌ 資料驗證失敗:', error);
      throw error;
    }
  }

  /**
   * 恢復備份
   */
  async restoreBackup() {
    console.log('🔄 開始恢復備份...');

    try {
      // 恢復 localStorage
      for (const [key, value] of Object.entries(this.backupData.localStorage || {})) {
        if (value) {
          localStorage.setItem(key, value);
        }
      }

      console.log('✅ 備份恢復完成');
    } catch (error) {
      console.error('❌ 備份恢復失敗:', error);
    }
  }

  // ===== 輔助函數 =====

  getFeaturePrefix(projectId) {
    const prefixMap = {
      'ErCore': 'ERC',
      'ErNexus': 'ERN',
      'ErShield': 'ERSH',
      'ErTidy': 'ERT',
      'ErPP': 'ERPP',
      'SyncBC-Monorepo': 'SBC',
      'iFMS-Frontend': 'IFMS',
      'EZOOM': 'EZ',
      'iMonitoring': 'IMON'
    };
    return prefixMap[projectId] || 'ER';
  }

  getProjectPriority(projectId) {
    const priorityMap = {
      'ErCore': 1,
      'ErPP': 2,
      'ErNexus': 3,
      'ErShield': 4,
      'ErTidy': 5
    };
    return priorityMap[projectId] || 10;
  }

  extractStartDate(assignmentData, markdownData) {
    // 優先使用 markdown 的開始日期
    if (markdownData.startDate) return markdownData.startDate;

    // 其次使用第一個成員的分配日期
    const members = Object.values(assignmentData.members || {});
    if (members.length > 0 && members[0].assignedDate) {
      return members[0].assignedDate;
    }

    // 最後使用 lastUpdated
    return assignmentData.lastUpdated || new Date().toISOString().split('T')[0];
  }

  parseMarkdownProject(content, projectId) {
    // 使用 MarkdownProjectReader 解析
    if (window.MarkdownProjectReader) {
      const reader = new window.MarkdownProjectReader();
      return reader.parseMarkdown(content, `${projectId}.md`);
    }

    return {
      description: "",
      coreMetrics: {},
      features: { completed: [], inProgress: [], planned: [] },
      issues: []
    };
  }
}

// 匯出
if (typeof window !== 'undefined') {
  window.MigrationManager = MigrationManager;
}

// 使用說明
console.log(`
═══════════════════════════════════════════
📚 資料遷移工具已載入

使用方式:
1. 確保已登入 Google Drive
2. 執行遷移:

   const manager = new MigrationManager();
   await manager.runMigration();

3. 遷移完成後，系統將自動使用新的統一資料結構

注意事項:
- 遷移前會自動備份資料
- 遷移失敗會自動恢復備份
- 建議在非生產環境先測試
═══════════════════════════════════════════
`);
