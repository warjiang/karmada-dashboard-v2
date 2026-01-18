import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import Store from 'electron-store'
import icon from '../../resources/icon.png?asset'

// Store schema for persistent configuration
interface StoreSchema {
  apiEndpoint: string
  token: string
  windowBounds: {
    width: number
    height: number
    x?: number
    y?: number
  }
}

// Initialize electron-store with defaults
const store = new Store<StoreSchema>({
  defaults: {
    apiEndpoint: 'http://localhost:8000',
    token: '',
    windowBounds: {
      width: 1200,
      height: 800
    }
  }
})

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Get saved window bounds
  const savedBounds = store.get('windowBounds')

  // Create the browser window with saved dimensions
  mainWindow = new BrowserWindow({
    width: savedBounds.width,
    height: savedBounds.height,
    x: savedBounds.x,
    y: savedBounds.y,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Save window bounds on resize and move
  mainWindow.on('resize', () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds()
      store.set('windowBounds', bounds)
    }
  })

  mainWindow.on('move', () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds()
      store.set('windowBounds', bounds)
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// IPC handlers for store operations
function setupIpcHandlers(): void {
  // Get all config
  ipcMain.handle('store:get-config', () => {
    return {
      apiEndpoint: store.get('apiEndpoint'),
      token: store.get('token')
    }
  })

  // Set config
  ipcMain.handle('store:set-config', (_, config: { apiEndpoint?: string; token?: string }) => {
    if (config.apiEndpoint !== undefined) {
      store.set('apiEndpoint', config.apiEndpoint)
    }
    if (config.token !== undefined) {
      store.set('token', config.token)
    }
    return true
  })

  // Get token only
  ipcMain.handle('store:get-token', () => {
    return store.get('token')
  })

  // Set token only
  ipcMain.handle('store:set-token', (_, token: string) => {
    store.set('token', token)
    return true
  })

  // Get API endpoint
  ipcMain.handle('store:get-api-endpoint', () => {
    return store.get('apiEndpoint')
  })

  // Set API endpoint
  ipcMain.handle('store:set-api-endpoint', (_, endpoint: string) => {
    store.set('apiEndpoint', endpoint)
    return true
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.karmada.desktop')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  // app.on('browser-window-created', (_, window) => {
  //   optimizer.watchWindowShortcuts(window)
  // })

  // Setup IPC handlers
  setupIpcHandlers()

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
