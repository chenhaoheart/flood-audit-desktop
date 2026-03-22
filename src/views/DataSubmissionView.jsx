import React, { useState } from 'react';
import { Card, Form, Input, Select, Upload, Button, Space } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import MapView from '../components/MapView';

const { Option } = Select;

function DataSubmissionView() {
  const [formData, setFormData] = useState({
    year: '',
    province: '',
    watershed: ''
  });
  
  const [fileList, setFileList] = useState({
    electronicData: [],
    textReport: [],
    resultReport: []
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const mapViewRef = React.useRef(null);

  const handleFileChange = (type) => {
    // 这里应该调用Electron API选择文件
    if (window.electronAPI) {
      window.electronAPI.selectFile({
        properties: ['openFile', 'multiSelections']
      }).then(filePaths => {
        if (filePaths && filePaths.length > 0) {
          const newFileList = filePaths.map(path => ({
            name: path.split('/').pop(),
            url: path
          }));
          setFileList(prev => ({
            ...prev,
            [type]: newFileList
          }));
          
          // 如果是SHP文件，显示地图预览
          if (type === 'electronicData') {
            setShowMap(true);
            setTimeout(() => {
              if (mapViewRef.current) {
                mapViewRef.current.flyToLocation([116.4, 39.9], 8);
              }
            }, 1000);
          }
        }
      }).catch(error => {
        console.error('File selection error:', error);
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.year || !formData.province || !formData.watershed) {
      // 显示验证错误
      return;
    }
    
    if (fileList.electronicData.length === 0 || 
        fileList.textReport.length === 0 || 
        fileList.resultReport.length === 0) {
      // 显示文件缺失错误
      return;
    }
    
    setSubmitting(true);
    
    try {
      // 保存任务信息到本地数据库
      if (window.electronAPI) {
        const taskData = {
          task_id: `task_${Date.now()}`,
          province_code: formData.province,
          year: parseInt(formData.year),
          watershed_list: JSON.stringify([formData.watershed]),
          status: 0
        };
        
        await window.electronAPI.dbExecute(
          'INSERT INTO tasks (task_id, province_code, year, watershed_list, status) VALUES (?, ?, ?, ?, ?)',
          [taskData.task_id, taskData.province_code, taskData.year, taskData.watershed_list, taskData.status]
        );
        
        // 保存成果信息
        const achievementData = {
          achievement_id: `ach_${Date.now()}`,
          task_id: taskData.task_id,
          watershed_code: formData.watershed,
          submit_unit: '本地用户',
          submit_time: new Date().toISOString(),
          version: 1,
          status: 0
        };
        
        await window.electronAPI.dbExecute(
          'INSERT INTO achievements (achievement_id, task_id, watershed_code, submit_unit, submit_time, version, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [achievementData.achievement_id, achievementData.task_id, achievementData.watershed_code, achievementData.submit_unit, achievementData.submit_time, achievementData.version, achievementData.status]
        );
        
        // 触发审核流程
        await triggerAudit(achievementData);
        
        console.log('Data submitted successfully');
      }
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const triggerAudit = async (achievementData) => {
    // 准备审核事实
    const facts = {
      achievementStatus: 'submitted',
      hasElectronicData: fileList.electronicData.length > 0,
      hasTextReport: fileList.textReport.length > 0,
      hasResultReport: fileList.resultReport.length > 0,
      spatialDataFormat: 'SHP',
      coordinateSystem: 'CGCS2000'
    };
    
    // 调用规则引擎
    // const problems = await rulesEngine.runAudit(facts);
    // console.log('Audit results:', problems);
  };

  const handleReset = () => {
    setFormData({
      year: '',
      province: '',
      watershed: ''
    });
    setFileList({
      electronicData: [],
      textReport: [],
      resultReport: []
    });
    setShowMap(false);
  };

  return (
    <div style={{ padding: '20px' }}>
      <Card title="数据上报管理">
        <Form layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="年度">
            <Input 
              value={formData.year}
              onChange={(e) => setFormData({...formData, year: e.target.value})}
              placeholder="请输入年度"
            />
          </Form.Item>
          
          <Form.Item label="省份">
            <Select 
              value={formData.province}
              onChange={(value) => setFormData({...formData, province: value})}
              placeholder="请选择省份"
            >
              <Option value="110000">北京市</Option>
              <Option value="310000">上海市</Option>
              <Option value="440000">广东省</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="小流域">
            <Input 
              value={formData.watershed}
              onChange={(e) => setFormData({...formData, watershed: e.target.value})}
              placeholder="请输入小流域代码"
            />
          </Form.Item>
          
          <Form.Item label="电子数据">
            <Space>
              <Button type="primary" onClick={() => handleFileChange('electronicData')}>
                选择SHP文件
              </Button>
              {fileList.electronicData.length > 0 && (
                <span>{fileList.electronicData.length} 个文件已选择</span>
              )}
            </Space>
          </Form.Item>
          
          <Form.Item label="文字报告">
            <Space>
              <Button type="primary" onClick={() => handleFileChange('textReport')}>
                选择报告文件
              </Button>
              {fileList.textReport.length > 0 && (
                <span>{fileList.textReport.length} 个文件已选择</span>
              )}
            </Space>
          </Form.Item>
          
          <Form.Item label="成果报表">
            <Space>
              <Button type="primary" onClick={() => handleFileChange('resultReport')}>
                选择报表文件
              </Button>
              {fileList.resultReport.length > 0 && (
                <span>{fileList.resultReport.length} 个文件已选择</span>
              )}
            </Space>
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                提交审核
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
      
      {showMap && (
        <Card title="空间数据预览" style={{ marginTop: '20px' }}>
          <MapView ref={mapViewRef} style={{ height: '400px' }} />
        </Card>
      )}
    </div>
  );
}

export default DataSubmissionView;