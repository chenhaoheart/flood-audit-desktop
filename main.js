const { app, BrowserWindow, ipcMain, Menu, Tray, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const DatabaseManager = require('./src/database/init');

// 全局窗口引用和数据库管理器
let mainWindow = null;
let tray = null;
let dbManager = null;

// 初始化数据库
async function initializeDatabase() {
  try {
    dbManager = new DatabaseManager();
    await dbManager.initialize();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

// 处理应用就绪事件
app.whenReady().then(async () => {
  await initializeDatabase();
  createWindow();
  createTray();
  
  // macOS特定行为
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    icon: path.join(__dirname, 'build', 'icon.png')
  });

  // 开发环境加载Vite开发服务器，生产环境加载本地文件
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // 窗口关闭事件
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 创建系统托盘
function createTray() {
  const iconPath = path.join(__dirname, 'build', 'icon.png');
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示应用',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        } else {
          createWindow();
        }
      }
    },
    {
      label: '退出',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('山洪审核桌面应用');
  tray.setContextMenu(contextMenu);
}

// 应用窗口全部关闭时的行为（非macOS）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC通信处理
ipcMain.handle('ping', async () => {
  return 'pong';
});

// 文件系统操作
ipcMain.handle('file:select', async (event, options = {}) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    ...options,
    properties: ['openFile', ...(options.properties || [])]
  });
  return result.filePaths;
});

ipcMain.handle('file:selectDirectory', async (event, options = {}) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    ...options,
    properties: ['openDirectory']
  });
  return result.filePaths;
});

ipcMain.handle('file:read', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
});

ipcMain.handle('file:write', async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf8');
    return true;
  } catch (error) {
    throw new Error(`Failed to write file: ${error.message}`);
  }
});

// 数据库操作
ipcMain.handle('db:query', async (event, sql, params = []) => {
  if (!dbManager || !dbManager.getDB()) {
    throw new Error('Database not initialized');
  }
  
  try {
    const stmt = dbManager.getDB().prepare(sql);
    const result = stmt.all(...params);
    return result;
  } catch (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }
});

ipcMain.handle('db:execute', async (event, sql, params = []) => {
  if (!dbManager || !dbManager.getDB()) {
    throw new Error('Database not initialized');
  }
  
  try {
    const stmt = dbManager.getDB().prepare(sql);
    const result = stmt.run(...params);
    return result;
  } catch (error) {
    throw new Error(`Database execute failed: ${error.message}`);
  }
});

// 窗口控制
ipcMain.on('window:minimize', (event) => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('window:maximize', (event) => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.restore();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window:close', (event) => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// 导出窗口实例供其他模块使用
module.exports = { mainWindow };