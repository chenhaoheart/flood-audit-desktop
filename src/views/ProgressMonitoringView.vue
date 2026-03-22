<template>
  <div class="progress-monitoring">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>进度监控</span>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="dashboard-card">
            <template #header>
              <span>总体进度</span>
            </template>
            
            <div class="progress-overview">
              <el-progress 
                type="dashboard" 
                :percentage="overallProgress" 
                :color="progressColor"
                :width="150"
              />
              <div class="progress-text">{{ overallProgress }}%</div>
              <div class="progress-label">总体完成率</div>
            </div>
            
            <div class="stat-grid">
              <div class="stat-item">
                <div class="stat-number">{{ stats.totalTasks }}</div>
                <div class="stat-label">总任务</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ stats.completedTasks }}</div>
                <div class="stat-label">已完成</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ stats.inProgressTasks }}</div>
                <div class="stat-label">进行中</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ stats.delayedTasks }}</div>
                <div class="stat-label">已延期</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="18">
          <el-card class="timeline-card">
            <template #header>
              <div class="timeline-header">
                <span>任务进度</span>
                <el-button @click="refreshTimeline" size="small">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
            </template>
            
            <el-table
              :data="timelineData"
              v-loading="loading.timeline"
              height="400"
            >
              <el-table-column prop="taskId" label="任务ID" width="150" show-overflow-tooltip />
              <el-table-column prop="provinceCode" label="省份" width="100" />
              <el-table-column prop="year" label="年度" width="80" />
              <el-table-column prop="watershedList" label="流域列表" show-overflow-tooltip />
              <el-table-column prop="progress" label="进度" width="150">
                <template #default="scope">
                  <el-progress 
                    :percentage="scope.row.progress" 
                    :color="getProgressColor(scope.row.progress)"
                    :stroke-width="15"
                  />
                </template>
              </el-table-column>
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
              <el-table-column prop="deadline" label="截止时间" width="150" />
              <el-table-column prop="daysLeft" label="剩余天数" width="100">
                <template #default="scope">
                  <span :class="scope.row.daysLeft < 7 ? 'urgent' : ''">
                    {{ scope.row.daysLeft }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150">
                <template #default="scope">
                  <el-button 
                    size="small" 
                    @click="viewTaskProgress(scope.row)"
                  >
                    详情
                  </el-button>
                  <el-button 
                    size="small" 
                    type="primary" 
                    @click="updateProgress(scope.row)"
                  >
                    更新
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
    
    <!-- 地图进度展示 -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>全国进度分布</span>
        </div>
      </template>
      
      <div class="map-container">
        <div ref="mapContainerRef" class="map">
          <!-- 这里将集成地图组件显示各省进度 -->
          <div class="map-placeholder">
            <p>全国山洪灾害数据审核进度分布图</p>
            <p>红色表示进度滞后，绿色表示进度正常</p>
          </div>
        </div>
        
        <div class="legend">
          <div class="legend-item">
            <div class="legend-color" style="background-color: #f56c6c;"></div>
            <span>0-30%</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #e6a23c;"></div>
            <span>31-60%</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #67c23a;"></div>
            <span>61-90%</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #19a05e;"></div>
            <span>91-100%</span>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 任务详情对话框 -->
    <el-dialog 
      v-model="taskDetailDialogVisible" 
      :title="`任务进度详情 - ${currentTask.taskId}`" 
      width="70%"
      :before-close="closeTaskDetailDialog"
    >
      <div v-if="currentTask">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务ID">{{ currentTask.taskId }}</el-descriptions-item>
          <el-descriptions-item label="省份">{{ currentTask.provinceCode }}</el-descriptions-item>
          <el-descriptions-item label="年度">{{ currentTask.year }}</el-descriptions-item>
          <el-descriptions-item label="流域列表">{{ currentTask.watershedList }}</el-descriptions-item>
          <el-descriptions-item label="当前进度">
            <el-progress 
              :percentage="currentTask.progress" 
              :color="getProgressColor(currentTask.progress)"
              :stroke-width="15"
            />
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getTaskStatusType(currentTask.status)">
              {{ getTaskStatusText(currentTask.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="截止时间">{{ currentTask.deadline }}</el-descriptions-item>
          <el-descriptions-item label="剩余天数">
            <span :class="currentTask.daysLeft < 7 ? 'urgent' : ''">
              {{ currentTask.daysLeft }}天
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentTask.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ currentTask.updatedAt }}</el-descriptions-item>
        </el-descriptions>
        
        <div style="margin-top: 20px;">
          <h4>里程碑</h4>
          <el-timeline style="margin-top: 10px;">
            <el-timeline-item 
              v-for="(milestone, index) in currentTask.milestones" 
              :key="index"
              :timestamp="milestone.timestamp"
              :type="milestone.completed ? 'success' : 'primary'"
              :color="milestone.completed ? '#19a05e' : '#409eff'"
            >
              <div class="milestone-item">
                <strong>{{ milestone.title }}</strong>
                <p>{{ milestone.description }}</p>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-dialog>
    
    <!-- 更新进度对话框 -->
    <el-dialog 
      v-model="updateProgressDialogVisible" 
      title="更新任务进度" 
      width="50%"
      :before-close="closeUpdateProgressDialog"
    >
      <el-form :model="progressForm" label-width="100px">
        <el-form-item label="任务ID">
          <el-input v-model="currentTask.taskId" readonly />
        </el-form-item>
        
        <el-form-item label="当前进度">
          <el-slider 
            v-model="progressForm.progress" 
            :min="0" 
            :max="100" 
            show-input
          />
        </el-form-item>
        
        <el-form-item label="进度说明">
          <el-input 
            v-model="progressForm.description" 
            type="textarea" 
            :rows="4"
            placeholder="请输入进度更新说明"
          />
        </el-form-item>
        
        <el-form-item label="下次更新时间">
          <el-date-picker
            v-model="progressForm.nextUpdateTime"
            type="datetime"
            placeholder="选择下次更新时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%;"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="closeUpdateProgressDialog">取消</el-button>
        <el-button type="primary" @click="confirmUpdateProgress">确认更新</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';

// 统计数据
const stats = reactive({
  totalTasks: 0,
  completedTasks: 0,
  inProgressTasks: 0,
  delayedTasks: 0
});

// 加载状态
const loading = reactive({
  timeline: false
});

// 时间线数据
const timelineData = ref([]);

// 对话框控制
const taskDetailDialogVisible = ref(false);
const updateProgressDialogVisible = ref(false);
const currentTask = ref({});
const progressForm = reactive({
  progress: 0,
  description: '',
  nextUpdateTime: null
});

// 地图容器引用
const mapContainerRef = ref(null);

// 计算总体进度
const overallProgress = computed(() => {
  if (stats.totalTasks === 0) return 0;
  return Math.round((stats.completedTasks / stats.totalTasks) * 100);
});

// 进度颜色
const progressColor = computed(() => {
  if (overallProgress.value >= 90) return '#19a05e';
  if (overallProgress.value >= 70) return '#67c23a';
  if (overallProgress.value >= 50) return '#e6a23c';
  return '#f56c6c';
});

// 获取进度颜色
const getProgressColor = (progress) => {
  if (progress >= 90) return '#19a05e';
  if (progress >= 70) return '#67c23a';
  if (progress >= 50) return '#e6a23c';
  return '#f56c6c';
};

// 获取任务状态文本
const getTaskStatusText = (status) => {
  const statusMap = {
    0: '进行中',
    1: '已完成',
    2: '已延期',
    3: '暂停'
  };
  return statusMap[status] || '未知';
};

// 获取任务状态类型
const getTaskStatusType = (status) => {
  const typeMap = {
    0: 'warning',
    1: 'success',
    2: 'danger',
    3: 'info'
  };
  return typeMap[status] || 'info';
};

// 获取数据
const fetchData = async () => {
  loading.timeline = true;
  
  try {
    // 模拟获取统计数据
    stats.totalTasks = 156;
    stats.completedTasks = 98;
    stats.inProgressTasks = 45;
    stats.delayedTasks = 13;
    
    // 模拟获取时间线数据
    const mockData = [];
    const provinces = ['BJ', 'SH', 'GD', 'JS', 'ZJ', 'SC', 'HB', 'HN', 'FJ', 'SD', 'LN', 'JL', 'HL'];
    const watersheds = ['长江流域', '黄河流域', '珠江流域', '淮河流域', '海河流域', '辽河流域', '松花江流域'];
    
    for (let i = 1; i <= 50; i++) {
      const progress = Math.floor(Math.random() * 100);
      const status = progress >= 100 ? 1 : (Math.random() > 0.8 ? 2 : 0); // 20%延期
      const daysLeft = Math.floor(Math.random() * 30) - 5; // -5到25天
      
      mockData.push({
        taskId: `TASK_${Date.now()}_${i}`,
        provinceCode: provinces[Math.floor(Math.random() * provinces.length)],
        year: 2026,
        watershedList: watersheds.slice(0, Math.floor(Math.random() * 3) + 1).join(','),
        progress: progress,
        status: status,
        deadline: new Date(Date.now() + (daysLeft * 24 * 60 * 60 * 1000)).toISOString().slice(0, 19).replace('T', ' '),
        daysLeft: daysLeft,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
        milestones: [
          {
            title: '任务启动',
            description: '任务正式开始执行',
            timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
            completed: true
          },
          {
            title: '数据收集',
            description: '完成基础数据收集工作',
            timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
            completed: progress > 30
          },
          {
            title: '数据审核',
            description: '完成数据审核工作',
            timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
            completed: progress > 60
          },
          {
            title: '成果提交',
            description: '提交最终成果',
            timestamp: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
            completed: progress >= 100
          }
        ]
      });
    }
    
    timelineData.value = mockData;
  } catch (error) {
    console.error('获取数据失败:', error);
    ElMessage.error('获取数据失败');
  } finally {
    loading.timeline = false;
  }
};

// 查看任务进度详情
const viewTaskProgress = (task) => {
  currentTask.value = { ...task };
  taskDetailDialogVisible.value = true;
};

// 更新进度
const updateProgress = (task) => {
  currentTask.value = { ...task };
  progressForm.progress = task.progress;
  progressForm.description = '';
  progressForm.nextUpdateTime = new Date();
  updateProgressDialogVisible.value = true;
};

// 确认更新进度
const confirmUpdateProgress = async () => {
  try {
    // 更新本地数据
    const taskIndex = timelineData.value.findIndex(t => t.taskId === currentTask.value.taskId);
    if (taskIndex !== -1) {
      timelineData.value[taskIndex].progress = progressForm.progress;
      timelineData.value[taskIndex].updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      // 更新统计数据
      if (progressForm.progress >= 100) {
        stats.completedTasks++;
        stats.inProgressTasks--;
      }
    }
    
    // 这里应该调用后端API更新进度
    // await window.electronAPI.updateTaskProgress(currentTask.value.taskId, progressForm.progress);
    
    ElMessage.success('进度更新成功');
    closeUpdateProgressDialog();
  } catch (error) {
    console.error('更新进度失败:', error);
    ElMessage.error('更新进度失败: ' + error.message);
  }
};

// 关闭任务详情对话框
const closeTaskDetailDialog = () => {
  taskDetailDialogVisible.value = false;
  currentTask.value = {};
};

// 关闭更新进度对话框
const closeUpdateProgressDialog = () => {
  updateProgressDialogVisible.value = false;
  currentTask.value = {};
  progressForm.progress = 0;
  progressForm.description = '';
  progressForm.nextUpdateTime = null;
};

// 刷新时间线
const refreshTimeline = () => {
  fetchData();
  ElMessage.success('数据已刷新');
};

// 初始化数据
onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard-card {
  height: 500px;
}

.progress-overview {
  text-align: center;
  margin-bottom: 20px;
}

.progress-text {
  font-size: 1.5em;
  font-weight: bold;
  margin-top: -40px;
}

.progress-label {
  color: #606266;
  margin-top: 10px;
}

.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.stat-item {
  text-align: center;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.stat-number {
  font-size: 1.5em;
  font-weight: bold;
  color: #409EFF;
}

.stat-label {
  color: #909399;
  font-size: 0.9em;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timeline-card {
  height: 500px;
}

.urgent {
  color: #f56c6c;
  font-weight: bold;
}

.map-container {
  height: 400px;
  position: relative;
}

.map {
  width: 100%;
  height: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.map-placeholder {
  text-align: center;
  color: #909399;
}

.legend {
  position: absolute;
  bottom: 20px;
  left: 20px;
  display: flex;
  gap: 15px;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border-radius: 4px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-color {
  width: 20px;
  height: 10px;
  border-radius: 2px;
}

.milestone-item strong {
  display: block;
  margin-bottom: 5px;
}

.milestone-item p {
  margin: 0;
  color: #909399;
  font-size: 0.9em;
}
</style>