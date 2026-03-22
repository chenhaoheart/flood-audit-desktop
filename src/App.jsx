import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Space } from 'antd';
import {
  UploadOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  FolderOpenOutlined,
  BarChartOutlined,
  PieChartOutlined,
  MinusOutlined,
  FullscreenOutlined,
  CloseOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('data-submission');

  // 窗口控制函数
  const minimizeWindow = () => {
    if (window.electronAPI) {
      window.electronAPI.minimize();
    }
  };

  const maximizeWindow = () => {
    if (window.electronAPI) {
      window.electronAPI.maximize();
    }
  };

  const closeWindow = () => {
    if (window.electronAPI) {
      window.electronAPI.close();
    }
  };

  // 测试Electron API连接
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.ping().then(response => {
        console.log('Electron API connected:', response);
      }).catch(error => {
        console.error('Electron API connection failed:', error);
      });
    }
  }, []);

  const menuItems = [
    {
      key: 'data-submission',
      icon: <UploadOutlined />,
      label: '数据上报'
    },
    {
      key: 'smart-audit',
      icon: <CheckCircleOutlined />,
      label: '智能审核'
    },
    {
      key: 'problem-management',
      icon: <WarningOutlined />,
      label: '问题管理'
    },
    {
      key: 'achievement-aggregation',
      icon: <FolderOpenOutlined />,
      label: '成果汇集'
    },
    {
      key: 'progress-monitoring',
      icon: <BarChartOutlined />,
      label: '进度监控'
    },
    {
      key: 'statistical-analysis',
      icon: <PieChartOutlined />,
      label: '统计分析'
    }
  ];

  const handleMenuSelect = ({ key }) => {
    setSelectedMenu(key);
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Header className="header">
        <div className="logo">山洪审核桌面应用</div>
        <Space size="small">
          <Button type="text" onClick={minimizeWindow} className="window-control">
            <MinusOutlined />
          </Button>
          <Button type="text" onClick={maximizeWindow} className="window-control">
            <FullscreenOutlined />
          </Button>
          <Button type="text" onClick={closeWindow} className="window-control close">
            <CloseOutlined />
          </Button>
        </Space>
      </Header>
      
      <Layout>
        <Sider 
          collapsible 
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          theme="dark"
          width={200}
        >
          <Menu
            theme="dark"
            selectedKeys={[selectedMenu]}
            mode="inline"
            items={menuItems}
            onSelect={handleMenuSelect}
          />
        </Sider>
        
        <Content style={{ padding: '20px' }}>
          {/* 这里将渲染对应的页面组件 */}
          <div style={{ 
            backgroundColor: '#fff', 
            minHeight: '100%',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <h2>欢迎使用山洪审核桌面应用</h2>
            <p>请选择左侧菜单进行操作</p>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;