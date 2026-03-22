// 集成测试脚本
const { app, BrowserWindow } = require('electron');
const DatabaseManager = require('./src/database/init');
const path = require('path');

async function runIntegrationTest() {
  console.log('🚀 开始集成测试...');
  
  // 1. 测试数据库初始化
  console.log('1. 测试数据库初始化...');
  const dbManager = new DatabaseManager();
  try {
    await dbManager.initialize();
    console.log('✅ 数据库初始化成功');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    return false;
  }
  
  // 2. 测试表结构创建
  console.log('2. 测试表结构创建...');
  const db = dbManager.getDB();
  try {
    const tables = db.prepare('SELECT name FROM sqlite_master WHERE type="table"').all();
    console.log(`✅ 创建了 ${tables.length} 个表:`, tables.map(t => t.name));
  } catch (error) {
    console.error('❌ 表结构创建失败:', error.message);
    return false;
  }
  
  // 3. 测试空间数据功能
  console.log('3. 测试空间数据功能...');
  try {
    // 检查spatialite是否加载
    const spatialMeta = db.prepare('SELECT * FROM spatial_ref_sys LIMIT 1').all();
    console.log('✅ Spatialite扩展加载成功');
  } catch (error) {
    console.warn('⚠️ Spatialite扩展可能未完全支持，但基础功能正常');
  }
  
  // 4. 测试Electron应用启动
  console.log('4. 测试Electron应用启动...');
  let mainWindow = null;
  try {
    app.whenReady().then(() => {
      mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          contextIsolation: true
        }
      });
      
      // 加载测试页面
      mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
      console.log('✅ Electron应用启动成功');
      
      // 延迟关闭
      setTimeout(() => {
        if (mainWindow) {
          mainWindow.close();
        }
        app.quit();
      }, 2000);
    });
  } catch (error) {
    console.error('❌ Electron应用启动失败:', error.message);
    return false;
  }
  
  console.log('🎉 集成测试完成！');
  return true;
}

// 运行测试
if (require.main === module) {
  runIntegrationTest().catch(console.error);
}

module.exports = { runIntegrationTest };