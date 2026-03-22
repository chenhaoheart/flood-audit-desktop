<template>
  <div class="statistical-analysis">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>统计分析</span>
        </div>
      </template>
      
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="filter-card">
            <template #header>
              <span>筛选条件</span>
            </template>
            
            <el-form :model="filterForm" label-width="80px">
              <el-form-item label="统计类型">
                <el-select v-model="filterForm.analysisType" placeholder="选择类型">
                  <el-option label="任务统计" value="task" />
                  <el-option label="成果统计" value="achievement" />
                  <el-option label="问题统计" value="problem" />
                  <el-option label="审核统计" value="audit" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="时间范围">
                <el-date-picker
                  v-model="filterForm.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%;"
                />
              </el-form-item>
              
              <el-form-item label="省份">
                <el-select v-model="filterForm.province" placeholder="选择省份" clearable>
                  <el-option label="北京市" value="BJ" />
                  <el-option label="上海市" value="SH" />
                  <el-option label="广东省" value="GD" />
                  <el-option label="江苏省" value="JS" />
                  <el-option label="浙江省" value="ZJ" />
                  <el-option label="四川省" value="SC" />
                  <el-option label="湖北省" value="HB" />
                  <el-option label="湖南省" value="HN" />
                  <el-option label="福建省" value="FJ" />
                  <el-option label="山东省" value="SD" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="流域">
                <el-select v-model="filterForm.watershed" placeholder="选择流域" clearable>
                  <el-option label="长江流域" value="CJ" />
                  <el-option label="黄河流域" value="HH" />
                  <el-option label="珠江流域" value="ZJ" />
                  <el-option label="淮河流域" value="HL" />
                  <el-option label="海河流域" value="HR" />
                  <el-option label="辽河流域" value="LR" />
                </el-select>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="applyFilters" style="width: 100%;">
                  <el-icon><Search /></el-icon>
                  统计分析
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
        
        <el-col :span="18">
          <el-card class="analysis-card">
            <template #header>
              <div class="analysis-header">
                <span>统计图表</span>
                <div>
                  <el-button @click="exportChart" size="small" style="margin-right: 10px;">
                    <el-icon><Download /></el-icon>
                    导出图表
                  </el-button>
                  <el-button @click="exportReport" size="small">
                    <el-icon><Document /></el-icon>
                    导出报告
                  </el-button>
                </div>
              </div>
            </template>
            
            <el-tabs v-model="chartTab" type="border-card">
              <el-tab-pane label="柱状图" name="bar">
                <div ref="barChartRef" class="chart-container"></div>
              </el-tab-pane>
              <el-tab-pane label="折线图" name="line">
                <div ref="lineChartRef" class="chart-container"></div>
              </el-tab-pane>
              <el-tab-pane label="饼图" name="pie">
                <div ref="pieChartRef" class="chart-container"></div>
              </el-tab-pane>
              <el-tab-pane label="数据表" name="table">
                <el-table
                  :data="tableData"
                  height="400"
                  style="width: 100%"
                >
                  <el-table-column prop="name" label="名称" width="200" />
                  <el-table-column prop="value" label="数值" width="150" />
                  <el-table-column prop="percentage" label="占比" width="150">
                    <template #default="scope">
                      <el-progress 
                        :percentage="scope.row.percentage" 
                        :stroke-width="15"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column prop="trend" label="趋势" width="150">
                    <template #default="scope">
                      <el-tag 
                        :type="scope.row.trend === '上升' ? 'success' : scope.row.trend === '下降' ? 'danger' : 'warning'"
                        size="small"
                      >
                        {{ scope.row.trend }}
                      </el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </el-tab-pane>
            </el-tabs>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
    
    <!-- 详细分析对话框 -->
    <el-dialog 
      v-model="detailDialogVisible" 
      title="详细分析报告" 
      width="80%"
      :before-close="closeDetailDialog"
    >
      <div v-if="analysisResult">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="分析类型">{{ getAnalysisTypeName(filterForm.analysisType) }}</el-descriptions-item>
          <el-descriptions-item label="分析时间">{{ new Date().toLocaleString() }}</el-descriptions-item>
          <el-descriptions-item label="数据范围">
            {{ filterForm.dateRange ? `${filterForm.dateRange[0]} 至 ${filterForm.dateRange[1]}` : '全部时间' }}
          </el-descriptions-item>
          <el-descriptions-item label="筛选条件">
            {{ filterForm.province ? `省份: ${filterForm.province}, ` : '' }}
            {{ filterForm.watershed ? `流域: ${filterForm.watershed}` : '' }}
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="analysis-content">
          <h3>关键指标</h3>
          <el-row :gutter="20" style="margin-top: 20px;">
            <el-col :span="6" v-for="(metric, index) in analysisMetrics" :key="index">
              <el-card class="metric-card">
                <div class="metric-value">{{ metric.value }}</div>
                <div class="metric-label">{{ metric.label }}</div>
                <div class="metric-trend" :class="metric.trendClass">
                  {{ metric.trendText }}
                </div>
              </el-card>
            </el-col>
          </el-row>
          
          <h3 style="margin-top: 30px;">分析结论</h3>
          <div class="analysis-summary">
            <p v-for="(summary, index) in analysisSummary" :key="index">{{ summary }}</p>
          </div>
          
          <h3 style="margin-top: 30px;">建议措施</h3>
          <div class="analysis-recommendations">
            <ul>
              <li v-for="(recommendation, index) in analysisRecommendations" :key="index">{{ recommendation }}</li>
            </ul>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, Download, Document } from '@element-plus/icons-vue';

// 图表引用
const barChartRef = ref(null);
const lineChartRef = ref(null);
const pieChartRef = ref(null);

// 筛选表单
const filterForm = reactive({
  analysisType: 'task',
  dateRange: null,
  province: '',
  watershed: ''
});

// 图表标签
const chartTab = ref('bar');

// 表格数据
const tableData = ref([]);

// 对话框控制
const detailDialogVisible = ref(false);
const analysisResult = ref(null);
const analysisMetrics = ref([]);
const analysisSummary = ref([]);
const analysisRecommendations = ref([]);

// 模拟图表数据
const chartData = ref({
  bar: {
    labels: [],
    datasets: []
  },
  line: {
    labels: [],
    datasets: []
  },
  pie: {
    labels: [],
    values: []
  }
});

// 应用筛选条件
const applyFilters = async () => {
  ElMessage.success('开始统计分析...');
  
  // 模拟数据加载
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 生成模拟图表数据
  generateChartData();
  
  // 生成表格数据
  generateTableData();
  
  // 生成分析结果
  generateAnalysisResult();
  
  ElMessage.success('统计分析完成');
};

// 生成图表数据
const generateChartData = () => {
  const types = ['北京市', '上海市', '广东省', '江苏省', '浙江省', '四川省', '湖北省'];
  const values = Array.from({ length: types.length }, () => Math.floor(Math.random() * 100) + 20);
  
  // 柱状图数据
  chartData.value.bar = {
    labels: types,
    datasets: [{
      label: '任务数量',
      data: values,
      backgroundColor: 'rgba(64, 158, 255, 0.7)',
      borderColor: 'rgba(64, 158, 255, 1)',
      borderWidth: 1
    }]
  };
  
  // 折线图数据
  const lineValues = Array.from({ length: 12 }, (_, i) => Math.floor(Math.random() * 80) + 20);
  chartData.value.line = {
    labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    datasets: [{
      label: '月度完成量',
      data: lineValues,
      borderColor: '#e6a23c',
      backgroundColor: 'rgba(230, 162, 60, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };
  
  // 饼图数据
  chartData.value.pie = {
    labels: ['已完成', '进行中', '待开始', '已延期'],
    values: [45, 30, 15, 10]
  };
};

// 生成表格数据
const generateTableData = () => {
  const types = ['北京市', '上海市', '广东省', '江苏省', '浙江省', '四川省', '湖北省'];
  const values = Array.from({ length: types.length }, () => Math.floor(Math.random() * 100) + 20);
  const maxValue = Math.max(...values);
  
  tableData.value = types.map((name, index) => ({
    name,
    value: values[index],
    percentage: Math.round((values[index] / maxValue) * 100),
    trend: ['上升', '下降', '平稳'][Math.floor(Math.random() * 3)]
  }));
};

// 生成分析结果
const generateAnalysisResult = () => {
  analysisMetrics.value = [
    {
      value: '156',
      label: '总任务数',
      trendText: '环比上升 12%',
      trendClass: 'trend-up'
    },
    {
      value: '98',
      label: '已完成',
      trendText: '环比上升 8%',
      trendClass: 'trend-up'
    },
    {
      value: '92.4%',
      label: '完成率',
      trendText: '环比上升 3.2%',
      trendClass: 'trend-up'
    },
    {
      value: '2.3天',
      label: '平均审核周期',
      trendText: '环比下降 0.4天',
      trendClass: 'trend-down'
    }
  ];
  
  analysisSummary.value = [
    '从统计结果来看，各省份任务完成情况良好，总体完成率达到92.4%，超过预期目标。',
    '北京市、上海市等经济发达地区完成率较高，达到95%以上。',
    '部分西部地区因自然条件复杂，完成率相对较低，需要加强技术支持。',
    '审核周期相比上期有所缩短，工作效率得到提升。'
  ];
  
  analysisRecommendations.value = [
    '加强对西部地区的技术支持和人员培训',
    '优化审核流程，进一步缩短审核周期',
    '建立预警机制，及时发现和解决延期任务',
    '定期组织经验交流会，推广优秀地区做法'
  ];
  
  analysisResult.value = true;
};

// 获取分析类型名称
const getAnalysisTypeName = (type) => {
  const typeNames = {
    task: '任务统计',
    achievement: '成果统计',
    problem: '问题统计',
    audit: '审核统计'
  };
  return typeNames[type] || '未知类型';
};

// 导出图表
const exportChart = () => {
  ElMessage.success('图表导出功能待实现');
  // 实际应用中这里会实现图表导出功能
};

// 导出报告
const exportReport = () => {
  ElMessage.success('分析报告导出功能待实现');
  // 实际应用中这里会生成并导出分析报告
};

// 显示详细分析
const showDetailAnalysis = () => {
  detailDialogVisible.value = true;
};

// 关闭详细分析对话框
const closeDetailDialog = () => {
  detailDialogVisible.value = false;
  analysisResult.value = null;
};

// 初始化
onMounted(() => {
  // 初始加载数据
  generateChartData();
  generateTableData();
  generateAnalysisResult();
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

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.analysis-card {
  height: 500px;
}

.chart-container {
  width: 100%;
  height: 400px;
}

:deep(.el-tabs__content) {
  height: calc(500px - 55px);
}

:deep(.el-tab-pane) {
  height: 100%;
}

.analysis-content {
  margin-top: 20px;
}

.metric-card {
  text-align: center;
  padding: 15px;
}

.metric-value {
  font-size: 1.8em;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 5px;
}

.metric-label {
  color: #606266;
  margin-bottom: 10px;
}

.metric-trend {
  font-size: 0.9em;
}

.trend-up {
  color: #67c23a;
}

.trend-down {
  color: #f56c6c;
}

.analysis-summary p {
  line-height: 1.8;
  margin-bottom: 10px;
}

.analysis-recommendations ul {
  padding-left: 20px;
}

.analysis-recommendations li {
  line-height: 1.8;
}
</style>