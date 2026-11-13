// Safe bridge between the game page and the desktop window.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  isDesktop: true,
  setMode: (mode) => ipcRenderer.send('tidy:setMode', mode),
  setSize: (w, h) => ipcRenderer.send('tidy:setSize', w, h),
  quit: () => ipcRenderer.send('tidy:quit'),
  onFullscreen: (cb) => ipcRenderer.on('tidy:fullscreen', (_e, on) => cb(on))
});
