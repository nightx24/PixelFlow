const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  getPlatform: () => ipcRenderer.invoke('app-get-platform'),
  minimize: () => ipcRenderer.send('window-minimize'),
  toggleMaximize: () => ipcRenderer.send('window-maximize-toggle'),
  close: () => ipcRenderer.send('window-close'),
  onOpenVideo: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('open-local-video-file', handler);
    return () => ipcRenderer.removeListener('open-local-video-file', handler);
  },
});
