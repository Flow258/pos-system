import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: 'Alquizalas Store POS System',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  if (process.env.NODE_ENV === 'development') {
    // Development → load Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Production → load index.html from resources/dist
    const indexPath = join(process.resourcesPath, 'dist', 'index.html');
    if (existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      console.error('❌ index.html not found at', indexPath);
      mainWindow.loadURL('data:text/html,<h2>App failed to load</h2>');
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
