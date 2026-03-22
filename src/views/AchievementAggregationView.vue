<template>
  <div class="achievement-aggregation">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>成果汇集</span>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stats-card">
            <template #header>
              <span>统计概览</span>
            </template>
            
            <div class="stat-item">
              <div class="stat-number">{{ stats.totalTasks }}</div>
              <div class="stat-label">总任务数</div>
            </div>
            
            <div class="stat-item">
              <div class="stat-number">{{ stats.completedTasks }}</div>
              <div class="stat-label">已完成</div>
            </div>
            
            <div class="stat-item">
              <div class="stat-number">{{ stats.pendingTasks }}</div>
              <div class="stat-label">待处理</div>
            </div>
            
            <div class="stat-item">
              <div class="stat-number">{{ stats.achievementCount }}</div>
              <div class="stat-label">成果数量</div>
            </div>
            
            <div class="stat-item">
              <el-progress 
                :percentage="completionRate" 
                :color="completionRate >= 80 ? '#13ce66' : completionRate >= 50 ? '#e6a23c' : '#f56c6c'"
                :stroke-width="10"
                style="margin-top: 10px;"
              />
              <div class="stat-label">完成率: {{ completionRate }}%</div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="18">
          <el-card class="aggregation-card">
            <template #header>
              <div class="aggregation-header">
                <span>成果汇总</span>
                <div>
                  <el-button type="primary" @click="exportData" style="margin-right: 10px;">
                    <el-icon><Download /></el-icon>
                    导出汇总
                  </el-button>
                  <el-button @click="refreshData">
                    <el-icon><Refresh /></el-icon>
                    刷新
                  </el-button>
                </div>
              </div>
            </template>
            
            <el-tabs v-model="activeTab" type="border-card">
              <el-tab-pane label="任务汇总" name="tasks">
                <el-table
                  :data="taskData"
                  v-loading="loading.tasks"
                  height="400"
                >
                  <el-table-column prop="taskId" label="任务ID" width="150" show-overflow-tooltip />
                  <el-table-column prop="provinceCode" label="省份代码" width="120" />
                  <el-table-column prop="year" label="年度" width="100" />
                  <el-table-column prop="watershedList" label="流域列表" show-overflow-tooltip />
                  <el-table-column prop="achievementCount" label="成果数" width="100" />
                  <el-table-column prop="status" label="状态" width="100">
                    <template #default="scope">
                      <el-tag 
                        :type="getTaskStatusType(scope.row.status)" 
                        size="small"
                      >
                        {{ getTaskStatusText(scope.row.status) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="updatedAt" label="更新时间" width="150" />
                  <el-table-column label="操作" width="150">
                    <template #default="scope">
                      <el-button 
                        size="small" 
                        @click="viewTaskDetails(scope.row)"
                      >
                        详情
                      </el-button>
                      <el-button 
                        size="small" 
                        type="primary" 
                        @click="aggregateTask(scope.row)"
                      >
                        汇集
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-tab-pane>
              
              <el-tab-pane label="成果汇总" name="achievements">
                <el-table
                  :data="achievementData"
                  v-loading="loading.achievements"
                  height="400"
                >
                  <el-table-column prop="achievementId" label="成果ID" width="180" show-overflow-tooltip />
                  <el-table-column prop="taskId" label="任务ID" width="150" show-overflow-tooltip />
                  <el-table-column prop="watershedCode" label="流域代码" width="120" />
                  <el-table-column prop="submitUnit" label="上报单位" width="150" show-overflow-tooltip />
                  <el-table-column prop="submitTime" label="上报时间" width="150" />
                  <el-table-column prop="status" label="状态" width="100">
                    <template #default="scope">
                      <el-tag 
                        :type="getAchievementStatusType(scope.row.status)" 
                        size="small"
                      >
                        {{ getAchievementStatusText(scope.row.status) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="150">
                    <template #default="scope">
                      <el-button 
                        size="small" 
                        @click="viewAchievementDetails(scope.row)"
                      >
                        详情
                      </el-button>
                      <el-button 
                        size="small" 
                        type="success" 
                        @click="exportAchievement(scope.row)"
                      >
                        导出
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-tab-pane>
              
              <el-tab-pane label="流域统计" name="watersheds">
                <el-table
                  :data="watershedData"
                  v-loading="loading.watersheds"
                  height="400"
                >
                  <el-table-column prop="watershedCode" label="流域代码" width="120" />
                  <el-table-column prop="watershedName" label="流域名称" width="150" />
                  <el-table-column prop="provinceCode" label="省份" width="100" />
                  <el-table-column prop="taskCount" label="任务数" width="100" />
                  <el-table-column prop="achievementCount" label="成果数" width="100" />
                  <el-table-column prop="completionRate" label="完成率" width="100">
                    <template #default="scope">
                      <el-progress 
                        :percentage="scope.row.completionRate" 
                        :stroke-width="8"
                        :color="scope.row.completionRate >= 80 ? '#13ce66' : scope.row.completionRate >= 50 ? '#e6a23c' : '#f56c6c'"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column prop="lastUpdated" label="最后更新" width="150" />
                </el-table>
              </el-tab-pane>
            </el-tabs>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
    
    <!-- 任务详情对话框 -->
    <el-dialog 
      v-model="taskDetailDialogVisible" 
      :title="`任务详情 - ${currentTask.taskId}`" 
      width="70%"
      :before-close="closeTaskDetailDialog"
    >
      <div v-if="currentTask">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务ID">{{ currentTask.taskId }}</el-descriptions-item>
          <el-descriptions-item label="省份代码">{{ currentTask.provinceCode }}</el-descriptions-item>
          <el-descriptions-item label="年度">{{ currentTask.year }}</el-descriptions-item>
          <el-descriptions-item label="流域列表">{{ currentTask.watershedList }}</el-descriptions-item>
          <el-descriptions-item label="成果数量">{{ currentTask.achievementCount }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getTaskStatusType(currentTask.status)">
              {{ getTaskStatusText(currentTask.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentTask.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ currentTask.updatedAt }}</el-descriptions-item>
        </el-descriptions>
        
        <div style="margin-top: 20px;">
          <h4>关联成果列表</h4>
          <el-table :data="currentTask.achievements" style="width: 100%; margin-top: 10px;">
            <el-table-column prop="achievementId" label="成果ID" width="180" show-overflow-tooltip />
            <el-table-column prop="submitUnit" label="上报单位" width="150" show-overflow-tooltip />
            <el-table-column prop="submitTime" label="上报时间" width="150" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getAchievementStatusType(scope.row.status)" size="small">
                  {{ getAchievementStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>
    
    <!-- 成果详情对话框 -->
    <el-dialog 
      v-model="achievementDetailDialogVisible" 
      :title="`成果详情 - ${currentAchievement.achievementId}`" 
      width="70%"
      :before-close="closeAchievementDetailDialog"
    >
      <div v-if="currentAchievement">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="成果ID">{{ currentAchievement.achievementId }}</el-descriptions-item>
          <el-descriptions-item label="任务ID">{{ currentAchievement.taskId }}</el-descriptions-item>
          <el-descriptions-item label="流域代码">{{ currentAchievement.watershedCode }}</el-descriptions-item>
          <el-descriptions-item label="上报单位">{{ currentAchievement.submitUnit }}</el-descriptions-item>
          <el-descriptions-item label="上报时间">{{ currentAchievement.submitTime }}</el-descriptions-item>
          <el-descriptions-item label="版本">{{ currentAchievement.version }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getAchievementStatusType(currentAchievement.status)">
              {{ getAchievementStatusText(currentAchievement.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentAchievement.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ currentAchievement.updatedAt }}</el-descriptions-item>
        </el-descriptions>
        
        <div style="margin-top: 20px;">
          <h4>文件信息</h4>
          <el-table :data="currentAchievement.files || []" style="width: 100%; margin-top: 10px;">
            <el-table-column prop="fileName" label="文件名" show-overflow-tooltip />
            <el-table-column prop="fileSize" label="大小" width="120" />
            <el-table-column prop="fileType" label="类型" width="100" />
            <el-table-column prop="uploadTime" label="上传时间" width="150" />
          </el-table>
        </div>
      </div>
    </el-dialog>
    
    <!-- 汇集进度对话框 -->
    <el-dialog 
      v-model="aggregationProgressDialogVisible" 
      title="成果汇集进度" 
      width="50%"
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div>
        <el-steps :active="aggregationProgress.currentStep" finish-status="success" simple>
          <el-step title="验证数据" />
          <el-step title="汇集成果" />
          <el-step title="生成报告" />
          <el-step title="完成" />
        </el-steps>
        
        <div style="margin-top: 30px; text-align: center;">
          <el-progress 
            type="dashboard" 
            :percentage="aggregationProgress.percentage" 
            :color="progressColors"
            :width="150"
          />
          <p style="margin-top: 20px;">{{ aggregationProgress.statusText }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Download, Refresh } from '@element-plus/icons-vue';

// 统计数据
const stats = reactive({
  totalTasks: 0,
  completedTasks: 0,
  pendingTasks: 0,
  achievementCount: 0
});

// 激活的标签页
const activeTab = ref('tasks');

// 数据表格
const taskData = ref([]);
const achievementData = ref([]);
const watershedData = ref([]);

// 加载状态
const loading = reactive({
  tasks: false,
  achievements: false,
  watersheds: false
});

// 对话框控制
const taskDetailDialogVisible = ref(false);
const achievementDetailDialogVisible = ref(false);
const aggregationProgressDialogVisible = ref(false);
const currentTask = ref({});
const currentAchievement = ref({});

// 汇集进度
const aggregationProgress = reactive({
  currentStep: 0,
  percentage: 0,
  statusText: '开始汇集...'
});

// 进度条颜色
const progressColors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#6f7ad3', percentage: 100 }
];

// 获取统计数据
const fetchStats = async () => {
  try {
    // 模拟获取统计数据
    stats.totalTasks = 156;
    stats.completedTasks = 124;
    stats.pendingTasks = 32;
    stats.achievementCount = 892;
  } catch (error) {
    console.error('获取统计数据失败:', error);
  }
};

// 计算完成率
const completionRate = computed(() => {
  if (stats.totalTasks === 0) return 0;
  return Math.round((stats.completedTasks / stats.totalTasks) * 100);
});

// 获取任务数据
const fetchTaskData = async () => {
  loading.tasks = true;
  
  try {
    // 模拟从数据库获取任务数据
    const mockData = [];
    const provinces = ['BJ', 'SH', 'GD', 'JS', 'ZJ', 'SC', 'HB', 'HN', 'FJ', 'SD'];
    const watersheds = ['长江流域', '黄河流域', '珠江流域', '淮河流域', '海河流域', '辽河流域'];
    
    for (let i = 1; i <= 50; i++) {
      const status = Math.random() > 0.2 ? 1 : 0; // 80%完成率
      const achievementCount = Math.floor(Math.random() * 20) + 5;
      
      mockData.push({
        taskId: `TASK_${Date.now()}_${i}`,
        provinceCode: provinces[Math.floor(Math.random() * provinces.length)],
        year: 2026,
        watershedList: watersheds.slice(0, Math.floor(Math.random() * 3) + 1).join(','),
        achievementCount: achievementCount,
        status: status,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: status === 1 ? 
          new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ') : 
          '-',
        achievements: Array.from({ length: achievementCount }, (_, idx) => ({
          achievementId: `ACH_${Date.now()}_${i}_${idx}`,
          submitUnit: `单位${Math.floor(Math.random() * 100)}`,
          submitTime: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
          status: Math.random() > 0.1 ? 1 : 0 // 90%通过率
        }))
      });
    }
    
    taskData.value = mockData;
  } catch (error) {
    console.error('获取任务数据失败:', error);
    ElMessage.error('获取任务数据失败');
  } finally {
    loading.tasks = false;
  }
};

// 获取成果数据
const fetchAchievementData = async () => {
  loading.achievements = true;
  
  try {
    // 模拟从数据库获取成果数据
    const mockData = [];
    
    for (let i = 1; i <= 100; i++) {
      const status = Math.random() > 0.1 ? 1 : 0; // 90%通过率
      
      mockData.push({
        achievementId: `ACH_${Date.now()}_${i}`,
        taskId: `TASK_${Math.floor(Math.random() * 1000)}`,
        watershedCode: `WS${Math.floor(Math.random() * 100)}`,
        submitUnit: `单位${Math.floor(Math.random() * 100)}`,
        submitTime: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
        version: 1,
        status: status,
        createdAt: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
        files: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, idx) => ({
          fileName: `file_${i}_${idx}.${['shp', 'pdf', 'doc', 'xlsx'][Math.floor(Math.random() * 4)]}`,
          fileSize: `${Math.floor(Math.random() * 50) + 1}MB`,
          fileType: ['SHP', 'PDF', 'DOC', 'XLSX'][Math.floor(Math.random() * 4)],
          uploadTime: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
        }))
      });
    }
    
    achievementData.value = mockData;
  } catch (error) {
    console.error('获取成果数据失败:', error);
    ElMessage.error('获取成果数据失败');
  } finally {
    loading.achievements = false;
  }
};

// 获取流域数据
const fetchWatershedData = async () => {
  loading.watersheds = true;
  
  try {
    // 模拟从数据库获取流域数据
    const mockData = [];
    const provinces = ['BJ', 'SH', 'GD', 'JS', 'ZJ', 'SC', 'HB', 'HN', 'FJ', 'SD'];
    const watersheds = [
      { code: 'CJ', name: '长江流域' },
      { code: 'HH', name: '黄河流域' },
      { code: 'ZJ', name: '珠江流域' },
      { code: 'HL', name: '淮河流域' },
      { code: 'HR', name: '海河流域' },
      { code: 'LR', name: '辽河流域' },
      { code: 'SR', name: '松花江流域' },
      { code: 'JR', name: '京杭运河' }
    ];
    
    for (let i = 0; i < watersheds.length; i++) {
      const watershed = watersheds[i];
      const taskCount = Math.floor(Math.random() * 20) + 5;
      const achievementCount = Math.floor(Math.random() * 100) + 20;
      const completionRate = Math.floor(Math.random() * 40) + 60; // 60-100%完成率
      
      mockData.push({
        watershedCode: watershed.code,
        watershedName: watershed.name,
        provinceCode: provinces[Math.floor(Math.random() * provinces.length)],
        taskCount: taskCount,
        achievementCount: achievementCount,
        completionRate: completionRate,
        lastUpdated: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
      });
    }
    
    watershedData.value = mockData;
  } catch (error) {
    console.error('获取流域数据失败:', error);
    ElMessage.error('获取流域数据失败');
  } finally {
    loading.watersheds = false;
  }
};

// 获取任务状态文本
const getTaskStatusText = (status) => {
  const statusMap = {
    0: '进行中',
    1: '已完成'
  };
  return statusMap[status] || '未知';
};

// 获取任务状态类型
const getTaskStatusType = (status) => {
  const typeMap = {
    0: 'warning',
    1: 'success'
  };
  return typeMap[status] || 'info';
};

// 获取成果状态文本
const getAchievementStatusText = (status) => {
  const statusMap = {
    0: '待审核',
    1: '已通过',
    2: '有问题'
  };
  return statusMap[status] || '未知';
};

// 获取成果状态类型
const getAchievementStatusType = (status) => {
  const typeMap = {
    0: 'info',
    1: 'success',
    2: 'warning'
  };
  return typeMap[status] || 'info';
};

// 查看任务详情
const viewTaskDetails = (task) => {
  currentTask.value = { ...task };
  taskDetailDialogVisible.value = true;
};

// 查看成果详情
const viewAchievementDetails = (achievement) => {
  currentAchievement.value = { ...achievement };
  achievementDetailDialogVisible.value = true;
};

// 关闭任务详情对话框
const closeTaskDetailDialog = () => {
  taskDetailDialogVisible.value = false;
  currentTask.value = {};
};

// 关闭成果详情对话框
const closeAchievementDetailDialog = () => {
  achievementDetailDialogVisible.value = false;
  currentAchievement.value = {};
};

// 汇集任务
const aggregateTask = async (task) => {
  // 显示汇集进度对话框
  aggregationProgressDialogVisible.value = true;
  resetAggregationProgress();
  
  // 模拟汇集过程
  try {
    // 步骤1: 验证数据
    aggregationProgress.currentStep = 0;
    aggregationProgress.statusText = '正在验证数据...';
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 步骤2: 汇集成果
    aggregationProgress.currentStep = 1;
    aggregationProgress.percentage = 33;
    aggregationProgress.statusText = '正在汇集成果...';
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 步骤3: 生成报告
    aggregationProgress.currentStep = 2;
    aggregationProgress.percentage = 66;
    aggregationProgress.statusText = '正在生成报告...';
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 步骤4: 完成
    aggregationProgress.currentStep = 3;
    aggregationProgress.percentage = 100;
    aggregationProgress.statusText = '汇集完成！';
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    ElMessage.success(`任务 ${task.taskId} 成果汇集完成`);
  } catch (error) {
    console.error('汇集任务失败:', error);
    ElMessage.error('汇集任务失败: ' + error.message);
  } finally {
    setTimeout(() => {
      aggregationProgressDialogVisible.value = false;
    }, 1000);
  }
};

// 重置汇集进度
const resetAggregationProgress = () => {
  aggregationProgress.currentStep = 0;
  aggregationProgress.percentage = 0;
  aggregationProgress.statusText = '开始汇集...';
};

// 导出成果
const exportAchievement = async (achievement) => {
  try {
    ElMessage.success(`正在导出成果 ${achievement.achievementId}`);
    // 实际应用中这里会调用导出API
  } catch (error) {
    console.error('导出成果失败:', error);
    ElMessage.error('导出成果失败: ' + error.message);
  }
};

// 导出汇总数据
const exportData = async () => {
  try {
    ElMessage.success('正在导出汇总数据...');
    // 实际应用中这里会调用导出API
  } catch (error) {
    console.error('导出数据失败:', error);
    ElMessage.error('导出数据失败: ' + error.message);
  }
};

// 刷新数据
const refreshData = () => {
  fetchStats();
  fetchTaskData();
  fetchAchievementData();
  fetchWatershedData();
  ElMessage.success('数据已刷新');
};

// 初始化数据
onMounted(() => {
  fetchStats();
  fetchTaskData();
  fetchAchievementData();
  fetchWatershedData();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-card {
  height: 500px;
}

.stat-item {
  margin-bottom: 20px;
  text-align: center;
}

.stat-number {
  font-size: 2em;
  font-weight: bold;
  color: #409EFF;
}

.stat-label {
  margin-top: 5px;
  color: #606266;
}

.aggregation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.aggregation-card {
  height: 500px;
}

:deep(.el-tabs__content) {
  height: calc(500px - 55px);
}

:deep(.el-tab-pane) {
  height: 100%;
}
</style>