import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { initDatabase } from '@main/database'
import { SessionStore } from '@main/ipc/protected/session-store'
import { IpcRouter } from '@main/ipc/router'
import { autoRegisterRoutes } from '@main/routes/loader'
import '@main/rpc/rpc-entry'
import { notificationService } from '@main/services/notification-service'
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import * as fs from 'fs'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'

// Simple file logger
const logFile = join(app.getPath('userData'), 'app.log')
console.log(`Log file location: ${logFile}`)

// Override console methods to also write to file
const originalConsole = { ...console }
function writeToLogFile(level: string, ...args: any[]): void {
  const message = args
    .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
    .join(' ')

  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] [${level}] ${message}\n`

  try {
    fs.appendFileSync(logFile, logMessage)
  } catch (error) {
    originalConsole.error('Failed to write to log file:', error)
  }
}

// Override console methods
console.log = (...args) => {
  originalConsole.log(...args)
  writeToLogFile('INFO', ...args)
}

console.error = (...args) => {
  originalConsole.error(...args)
  writeToLogFile('ERROR', ...args)
}

console.warn = (...args) => {
  originalConsole.warn(...args)
  writeToLogFile('WARN', ...args)
}

export const sessionStore = new SessionStore()
export const router = new IpcRouter({ sessionStore })

function createWindow(): void {
  try {
    console.log('Creating main window...')
    // Create the browser window.
    const mainWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      show: false,
      minWidth: 850,
      minHeight: 400,
      autoHideMenuBar: true,
      ...(process.platform === 'linux' ? { icon } : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        contextIsolation: true,
        nodeIntegration: false
      }
    })

    notificationService.setMainWindow(mainWindow)

    mainWindow.on('ready-to-show', () => {
      console.log('Window ready to show')
      mainWindow.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
      const u = details.url
      const isCsvExport = /\/api\/[^/]+\/export\?/.test(u) && u.includes('export=csv')
      if (isCsvExport) {
        ;(async () => {
          try {
            const res = await fetch(u)
            const buf = Buffer.from(await res.arrayBuffer())
            let filename = 'export.csv'
            const cd = res.headers.get('content-disposition')
            if (cd) {
              const m = cd.match(/filename="?([^";]+)"?/i)
              if (m && m[1]) filename = m[1]
            }
            const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
              title: 'Simpan CSV',
              defaultPath: filename,
              filters: [{ name: 'CSV', extensions: ['csv'] }]
            })
            if (!canceled && filePath) {
              fs.writeFileSync(filePath, buf)
            }
          } catch (e) {
            console.error('Gagal mengunduh CSV:', e)
          }
        })()
        return { action: 'deny' }
      }
      shell.openExternal(u)
      return { action: 'deny' }
    })

    // Add error handling for window loading
    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
      console.error(`Failed to load: ${errorDescription} (${errorCode})`)
    })

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    let rendererPath = join(__dirname, '../renderer/index.html')

    // Check if the file exists at the expected path
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs')
    if (!fs.existsSync(rendererPath) && !is.dev) {
      // Try alternative paths for production build
      const possiblePaths = [
        join(__dirname, '../renderer/index.html'),
        join(__dirname, './renderer/index.html'),
        join(__dirname, '../../renderer/index.html'),
        join(app.getAppPath(), 'renderer/index.html'),
        join(process.resourcesPath, 'app.asar/renderer/index.html'),
        join(process.resourcesPath, 'app.asar.unpacked/renderer/index.html'),
        join(process.resourcesPath, 'renderer/index.html'),
        join(app.getPath('exe'), '../renderer/index.html'),
        join(app.getPath('exe'), '../../renderer/index.html')
      ]

      let found = false
      for (const path of possiblePaths) {
        console.log(`Checking path: ${path}`)
        if (fs.existsSync(path)) {
          console.log(`Found renderer at: ${path}`)
          rendererPath = path
          found = true
          break
        }
      }

      if (!found) {
        console.error('Could not find renderer HTML file in any expected location')
        // List directory contents to help diagnose the issue
        try {
          const appDir = app.getAppPath()
          console.log(`App directory contents (${appDir}):`)
          if (fs.existsSync(appDir)) {
            console.log(fs.readdirSync(appDir))
          }

          console.log(`Resources directory contents (${process.resourcesPath}):`)
          if (fs.existsSync(process.resourcesPath)) {
            console.log(fs.readdirSync(process.resourcesPath))
          }
        } catch (err) {
          console.error('Error listing directories:', err)
        }
      }
    }

    console.log(`Loading renderer from: ${rendererPath}`)

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      console.log(`Dev mode: loading from ${process.env['ELECTRON_RENDERER_URL']}`)
      mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      console.log(`Production mode: loading from ${rendererPath}`)

      // Create a simple HTML fallback in case we can't find the renderer
      const fallbackHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Application Error</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            h1 { color: #e74c3c; }
            pre { background: #f8f9fa; padding: 10px; border-radius: 4px; text-align: left; }
          </style>
        </head>
        <body>
          <h1>Application Error</h1>
          <p>The application could not load the main window. This is likely due to a missing renderer file.</p>
          <p>Please check the application logs for more information.</p>
          <pre id="details">Path: ${rendererPath}</pre>
        </body>
      </html>`

      try {
        mainWindow.loadFile(rendererPath).catch((err) => {
          console.error('Failed to load renderer file:', err)

          // First fallback: try URL format
          mainWindow.loadURL(`file://${rendererPath}`).catch((urlErr) => {
            console.error('Failed to load renderer with URL format:', urlErr)

            // Second fallback: try a data URL with error information
            const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(fallbackHtml)}`
            console.log('Loading fallback error page')
            mainWindow.loadURL(dataUrl).catch((e) => {
              console.error('Even fallback error page failed to load:', e)
            })
          })
        })
      } catch (error) {
        console.error('Unexpected error during window loading:', error)
      }
    }

    // Open DevTools in development mode
    if (is.dev) {
      mainWindow.webContents.openDevTools()
    }
  } catch (error) {
    console.error('Error creating window:', error)
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Register routes
  initDatabase()
  autoRegisterRoutes(router, { sessionStore })
  router.generatePreloadTypes()
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
  sessionStore.clearWindowSessions()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
