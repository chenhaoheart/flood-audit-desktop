const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 基础通信
  ping: () => ipcRenderer.invoke('ping'),
  
  // 文件系统操作
  selectFile: (options) => ipcRenderer.invoke('file:select', options),
  selectDirectory: (options) => ipcRenderer.invoke('file:selectDirectory', options),
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('file:write', filePath, content),
  
  // 数据库操作
  dbQuery: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
  dbExecute: (sql, params) => ipcRenderer.invoke('db:execute', sql, params),
  
  // 应用控制
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close')
});

// 处理窗口控制事件
ipcRenderer.on('window:toggleMaximize', () => {
  const currentWindow = document.querySelector('body');
  currentWindow.classList.toggle('maximized');
});