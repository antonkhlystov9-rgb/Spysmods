// The Night Shelver — Electron main process
const { app, BrowserWindow, ipcMain, screen, Menu } = require('electron');
const path = require('path');

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 960,
    minHeight: 540,
    useContentSize: true,
    backgroundColor: '#1d140d',
    title: 'The Night Shelver',
    autoHideMenuBar: true,
    show: false,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  win.once('ready-to-show', () => win.show());
  win.on('enter-full-screen', () => win.webContents.send('tidy:fullscreen', true));
  win.on('leave-full-screen', () => win.webContents.send('tidy:fullscreen', false));
  win.on('closed', () => { win = null; });
}

// Display mode: 'windowed' | 'maximized' | 'fullscreen'
ipcMain.on('tidy:setMode', (_e, mode) => {
  if (!win) return;
  if (mode === 'fullscreen') {
    win.setFullScreen(true);
  } else {
    if (win.isFullScreen()) win.setFullScreen(false);
    if (mode === 'maximized') win.maximize();
    else if (win.isMaximized()) win.unmaximize();
  }
});

ipcMain.on('tidy:setSize', (_e, w, h) => {
  if (!win || win.isFullScreen() || win.isMaximized()) return;
  const area = screen.getDisplayMatching(win.getBounds()).workAreaSize;
  w = Math.max(960, Math.min(Math.round(w) || 1600, area.width));
  h = Math.max(540, Math.min(Math.round(h) || 900, area.height));
  win.setContentSize(w, h);
  win.center();
});

ipcMain.on('tidy:quit', () => app.quit());

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);   // the game handles F11 and friends itself
    createWindow();
  });
  app.on('window-all-closed', () => app.quit());
}
