<template>
  <div class="problem-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>问题管理</span>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="filter-card">
            <template #header>
              <span>筛选条件</span>
            </template>
            
            <el-form :model="filterForm" label-width="80px">
              <el-form-item label="问题类型">
                <el-select v-model="filterForm.problemType" placeholder="选择类型">
                  <el-option label="全部" value="" />
                  <el-option label="完整性" value="完整性" />
                  <el-option label="合规性" value="合规性" />
                  <el-option label="空间数据" value="空间数据" />
                  <el-option label="属性数据" value="属性数据" />
                  <el-option label="格式错误" value="格式错误" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="严重程度">
                <el-select v-model="filterForm.severity" placeholder="选择程度">
                  <el-option label="全部" value="" />
                  <el-option label="一般" value="1" />
                  <el-option label="严重" value="2" />
                  <el-option label="特别严重" value="3" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="状态">
                <el-select v-model="filterForm.status" placeholder="选择状态">
                  <el-option label="全部" value="" />
                  <el-option label="待处理" value="0" />
                  <el-option label="处理中" value="1" />
                  <el-option label="已解决" value="2" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="任务编号">
                <el-input v-model="filterForm.taskId" placeholder="任务编号" />
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="applyFilters">筛选</el-button>
                <el-button @click="resetFilters">重置</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
        
        <el-col :span="18">
          <el-card class="problem-card">
            <template #header>
              <div class="problem-header">
                <span>问题列表</span>
                <div>
                  <el-button 
                    type="success" 
                    @click="batchResolve" 
                    :disabled="selectedRows.length === 0"
                    style="margin-right: 10px;"
                  >
                    批量解决
                  </el-button>
                  <el-button 
                    type="warning" 
                    @click="batchAssign" 
                    :disabled="selectedRows.length === 0"
                  >
                    批量指派
                  </el-button>
                </div>
              </div>
            </template>
            
            <el-table
              :data="problemData"
              v-loading="loading"
              @selection-change="handleSelectionChange"
              height="500"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column prop="problemId" label="问题ID" width="150" show-overflow-tooltip />
              <el-table-column prop="achievementId" label="成果ID" width="150" show-overflow-tooltip />
              <el-table-column prop="problemType" label="问题类型" width="100">
                <template #default="scope">
                  <el-tag 
                    :type="getProblemTypeColor(scope.row.problemType)" 
                    size="small"
                  >
                    {{ scope.row.problemType }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="问题描述" show-overflow-tooltip />
              <el-table-column prop="severity" label="严重程度" width="100">
                <template #default="scope">
                  <el-rate 
                    v-model="scope.row.severity" 
                    :max="3" 
                    disabled 
                    show-score 
                    score-template="{value}"
                    :colors="['#52c41a', '#faad14', '#f5222d']"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                  <el-tag 
                    :type="getStatusType(scope.row.status)" 
                    size="small"
                  >
                    {{ getStatusText(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createdTime" label="发现时间" width="150" />
              <el-table-column prop="fixTime" label="解决时间" width="150" />
              <el-table-column label="操作" width="150">
                <template #default="scope">
                  <el-button 
                    size="small" 
                    @click="viewDetails(scope.row)"
                    :disabled="scope.row.status === 2"
                  >
                    详情
                  </el-button>
                  <el-button 
                    size="small" 
                    type="primary" 
                    @click="solveProblem(scope.row)"
                    :disabled="scope.row.status === 2"
                  >
                    解决
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <div class="pagination" style="margin-top: 20px; text-align: right;">
              <el-pagination
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
                :current-page="pagination.currentPage"
                :page-sizes="[10, 20, 50, 100]"
                :page-size="pagination.pageSize"
                layout="total, sizes, prev, pager, next, jumper"
                :total="pagination.total"
              />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
    
    <!-- 问题详情对话框 -->
    <el-dialog 
      v-model="detailDialogVisible" 
      :title="`问题详情 - ${currentProblem.problemId}`" 
      width="70%"
      :before-close="closeDetailDialog"
    >
      <div v-if="currentProblem">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="问题ID">{{ currentProblem.problemId }}</el-descriptions-item>
          <el-descriptions-item label="成果ID">{{ currentProblem.achievementId }}</el-descriptions-item>
          <el-descriptions-item label="问题类型">
            <el-tag :type="getProblemTypeColor(currentProblem.problemType)">
              {{ currentProblem.problemType }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="严重程度">
            <el-rate 
              v-model="currentProblem.severity" 
              :max="3" 
              disabled 
              show-score 
              score-template="{value}"
              :colors="['#52c41a', '#faad14', '#f5222d']"
            />
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentProblem.status)">
              {{ getStatusText(currentProblem.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发现时间">{{ currentProblem.createdTime }}</el-descriptions-item>
          <el-descriptions-item label="解决时间">{{ currentProblem.fixTime || '-' }}</el-descriptions-item>
        </el-descriptions>
        
        <div style="margin-top: 20px;">
          <h4>问题描述</h4>
          <p>{{ currentProblem.description }}</p>
        </div>
        
        <div v-if="currentProblem.solution" style="margin-top: 20px;">
          <h4>解决方案</h4>
          <p>{{ currentProblem.solution }}</p>
        </div>
        
        <div class="problem-actions" style="margin-top: 30px; text-align: center;">
          <el-button 
            type="success" 
            @click="solveProblem(currentProblem)"
            :disabled="currentProblem.status === 2"
          >
            标记为已解决
          </el-button>
          <el-button @click="closeDetailDialog">关闭</el-button>
        </div>
      </div>
    </el-dialog>
    
    <!-- 解决问题对话框 -->
    <el-dialog 
      v-model="solveDialogVisible" 
      title="解决问题" 
      width="60%"
      :before-close="closeSolveDialog"
    >
      <el-form :model="solveForm" label-width="100px">
        <el-form-item label="问题ID">
          <el-input v-model="currentProblem.problemId" readonly />
        </el-form-item>
        
        <el-form-item label="解决方案">
          <el-input 
            v-model="solveForm.solution" 
            type="textarea" 
            :rows="4"
            placeholder="请输入解决方案或修复说明"
          />
        </el-form-item>
        
        <el-form-item label="解决人员">
          <el-input v-model="solveForm.solver" placeholder="请输入解决人员姓名" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="closeSolveDialog">取消</el-button>
        <el-button type="primary" @click="confirmSolve">确认解决</el-button>
      </template>
    </el-dialog>
    
    <!-- 批量指派对话框 -->
    <el-dialog 
      v-model="assignDialogVisible" 
      title="批量指派问题" 
      width="50%"
      :before-close="closeAssignDialog"
    >
      <el-form :model="assignForm" label-width="100px">
        <el-form-item label="指派给">
          <el-select v-model="assignForm.assignee" placeholder="选择处理人员" style="width: 100%;">
            <el-option label="张三" value="zhangsan" />
            <el-option label="李四" value="lisi" />
            <el-option label="王五" value="wangwu" />
            <el-option label="赵六" value="zhaoliu" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input 
            v-model="assignForm.remarks" 
            type="textarea" 
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="closeAssignDialog">取消</el-button>
        <el-button type="primary" @click="confirmAssign">确认指派</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 筛选表单
const filterForm = reactive({
  problemType: '',
  severity: '',
  status: '',
  taskId: ''
});

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 表格数据
const problemData = ref([]);
const loading = ref(false);
const selectedRows = ref([]);

// 对话框控制
const detailDialogVisible = ref(false);
const solveDialogVisible = ref(false);
const assignDialogVisible = ref(false);
const currentProblem = ref({});
const solveForm = reactive({
  solution: '',
  solver: ''
});
const assignForm = reactive({
  assignee: '',
  remarks: ''
});

// 获取问题数据
const fetchProblemData = async () => {
  loading.value = true;
  
  try {
    // 模拟从数据库获取问题数据
    const mockData = [];
    const problemTypes = ['完整性', '合规性', '空间数据', '属性数据', '格式错误', '数据缺失'];
    const descriptions = [
      '电子数据文件缺失',
      '坐标系统不符合要求',
      '空间数据精度不足',
      '属性字段格式错误',
      '数据范围超出规定区域',
      '文件命名不规范',
      '缺少必要元数据',
      '数据拓扑关系错误'
    ];
    
    for (let i = 1; i <= 50; i++) {
      const status = Math.floor(Math.random() * 3); // 0: 待处理, 1: 处理中, 2: 已解决
      const severity = Math.floor(Math.random() * 3) + 1; // 1-3级严重程度
      
      mockData.push({
        problemId: `PROB_${Date.now()}_${i}`,
        achievementId: `ACH_${Math.floor(Math.random() * 10000)}`,
        problemType: problemTypes[Math.floor(Math.random() * problemTypes.length)],
        description: descriptions[Math.floor(Math.random() * descriptions.length)],
        severity: severity,
        status: status,
        createdTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
        fixTime: status === 2 ? new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ') : null
      });
    }
    
    problemData.value = mockData;
    pagination.total = mockData.length;
  } catch (error) {
    console.error('获取问题数据失败:', error);
    ElMessage.error('获取问题数据失败');
  } finally {
    loading.value = false;
  }
};

// 获取问题类型颜色
const getProblemTypeColor = (type) => {
  const colorMap = {
    '完整性': 'info',
    '合规性': 'warning',
    '空间数据': 'danger',
    '属性数据': 'primary',
    '格式错误': 'success',
    '数据缺失': 'danger'
  };
  return colorMap[type] || 'info';
};

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    0: '待处理',
    1: '处理中',
    2: '已解决'
  };
  return statusMap[status] || '未知';
};

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    0: 'info',
    1: 'warning',
    2: 'success'
  };
  return typeMap[status] || 'info';
};

// 处理行选择
const handleSelectionChange = (selection) => {
  selectedRows.value = selection;
};

// 应用筛选
const applyFilters = () => {
  ElMessage.success('筛选条件已应用');
  fetchProblemData(); // 重新获取数据
};

// 重置筛选
const resetFilters = () => {
  Object.keys(filterForm).forEach(key => {
    filterForm[key] = '';
  });
  ElMessage.success('筛选条件已重置');
  fetchProblemData(); // 重新获取数据
};

// 分页处理
const handleSizeChange = (size) => {
  pagination.pageSize = size;
  fetchProblemData();
};

const handleCurrentChange = (page) => {
  pagination.currentPage = page;
  fetchProblemData();
};

// 查看详情
const viewDetails = (row) => {
  currentProblem.value = { ...row };
  detailDialogVisible.value = true;
};

// 解决问题
const solveProblem = (row) => {
  currentProblem.value = { ...row };
  solveForm.solution = '';
  solveForm.solver = '';
  solveDialogVisible.value = true;
};

// 确认解决问题
const confirmSolve = async () => {
  try {
    // 更新数据库
    await window.electronAPI.dbExecute(
      `UPDATE problems SET status = 2, solution = ?, fix_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE problem_id = ?`,
      [solveForm.solution, currentProblem.value.problemId]
    );
    
    ElMessage.success('问题已解决');
    closeSolveDialog();
    fetchProblemData(); // 刷新数据
  } catch (error) {
    console.error('解决问败:', error);
    ElMessage.error('解决问题失败: ' + error.message);
  }
};

// 批量解决
const batchResolve = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要解决的问题');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要解决 ${selectedRows.value.length} 个问题吗？`,
      '批量解决',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    for (const row of selectedRows.value) {
      await window.electronAPI.dbExecute(
        `UPDATE problems SET status = 2, fix_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE problem_id = ?`,
        [row.problemId]
      );
    }
    
    ElMessage.success(`已解决 ${selectedRows.value.length} 个问题`);
    selectedRows.value = [];
    fetchProblemData(); // 刷新数据
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量解决失败:', error);
      ElMessage.error('批量解决失败: ' + error.message);
    }
  }
};

// 批量指派
const batchAssign = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要指派的问题');
    return;
  }
  
  assignForm.assignee = '';
  assignForm.remarks = '';
  assignDialogVisible.value = true;
};

// 确认批量指派
const confirmAssign = async () => {
  if (!assignForm.assignee) {
    ElMessage.warning('请选择处理人员');
    return;
  }
  
  try {
    // 这里可以添加指派逻辑，比如更新状态或添加备注
    for (const row of selectedRows.value) {
      // 更新状态为处理中
      await window.electronAPI.dbExecute(
        `UPDATE problems SET status = 1, updated_at = CURRENT_TIMESTAMP WHERE problem_id = ?`,
        [row.problemId]
      );
    }
    
    ElMessage.success(`已指派 ${selectedRows.value.length} 个问题给 ${assignForm.assignee}`);
    selectedRows.value = [];
    closeAssignDialog();
    fetchProblemData(); // 刷新数据
  } catch (error) {
    console.error('批量指派失败:', error);
    ElMessage.error('批量指派失败: ' + error.message);
  }
};

// 关闭详情对话框
const closeDetailDialog = () => {
  detailDialogVisible.value = false;
  currentProblem.value = {};
};

// 关闭解决对话框
const closeSolveDialog = () => {
  solveDialogVisible.value = false;
  currentProblem.value = {};
  solveForm.solution = '';
  solveForm.solver = '';
};

// 关闭指派对话框
const closeAssignDialog = () => {
  assignDialogVisible.value = false;
  assignForm.assignee = '';
  assignForm.remarks = '';
};

// 初始化数据
onMounted(() => {
  fetchProblemData();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-card {
  height: 500px;
}

.problem-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.problem-card {
  height: 500px;
}

.problem-actions {
  margin-top: 20px;
}
</style>