# 山洪审核桌面应用

Electron + React 桌面应用基础框架

## 技术栈

- **主进程**: Electron + Node.js
- **渲染进程**: React + Ant Design + Mapbox GL JS
- **数据库**: SQLite + spatialite (空间数据支持)
- **构建工具**: Vite + Electron Builder
- **规则引擎**: JavaScript规则引擎 (待集成)

## 项目结构

```
flood-audit-desktop/
├── main.js                 # Electron主进程
├── preload.js              # 预加载脚本 (安全API暴露)
├── package.json            # 项目依赖和脚本
├── vite.config.js          # Vite配置
├── electron-builder.json   # 构建配置
├── src/
│   ├── main.jsx            # React应用入口
│   ├── App.jsx             # 主应用组件
│   ├── views/              # 页面视图
│   ├── components/         # 组件
│   ├── styles/             # 全局样式
│   ├── database/           # 数据库相关
│   └── utils/              # 工具函数
└── build/                  # 构建资源 (图标等)
```

## 开发环境

### 安装依赖
```bash
npm install
```

### 启动开发
```bash
# 终端1: 启动Vite开发服务器
npm run dev:renderer

# 终端2: 启动Electron应用
npm run dev:main
```

或者使用并发启动:
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
npm run package
```

## 功能模块

1. **数据上报管理** - 本地文件上传、格式校验
2. **智能审核引擎** - 本地规则执行
3. **问题管理** - 问题标注、分类、整改跟踪
4. **成果汇集** - 本地数据组织、导出功能
5. **进度监控** - 进度看板、预警提醒
6. **统计分析** - 数据概览、质量评估

## 下一步计划

- [ ] 集成JavaScript规则引擎
- [ ] 集成Mapbox GL JS地图
- [ ] 实现文件上传和处理模块
- [ ] 配置Electron Builder跨平台打包
- [ ] 完善各功能模块页面

## 截止日期

**2026年3月24日**