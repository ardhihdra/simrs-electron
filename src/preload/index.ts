import { electronAPI } from '@electron-toolkit/preload'
import { exposeRpc } from '@mavolostudio/electron-rpc'
import { contextBridge } from 'electron'
import fs from 'fs'
import path from 'path'
import { buildApiFromTree } from './api'

let tree: any = {}

// Try multiple locations for the ipc-channels.json file
const possibleLocations = [
  path.resolve(__dirname, './ipc-channels.json'),
  path.resolve(process.resourcesPath, 'ipc-channels.json'),
  path.resolve(process.resourcesPath, 'app.asar.unpacked/out/preload/ipc-channels.json'),
  path.resolve(process.resourcesPath, 'app/out/preload/ipc-channels.json')
]

// For debugging
console.log('[preload] Searching for ipc-channels.json in:', possibleLocations)

// Try each location until we find a valid file
let foundFile = false
for (const location of possibleLocations) {
  try {
    if (fs.existsSync(location)) {
      const content = fs.readFileSync(location, 'utf-8')
      tree = JSON.parse(content)
      console.log('[preload] Successfully loaded ipc-channels.json from:', location)
      foundFile = true
      break
    }
  } catch (error) {
    console.warn(`[preload] Failed to load from ${location}:`, error)
  }
}

if (!foundFile) {
  console.warn('[preload] ipc-channels.json not found in any location; api will be empty')
}

const api = buildApiFromTree(tree)
const env = {
    NODE_ENV: process.env.PROD !== 'true' ? 'development' : 'production',
    API_URL: process.env.API_URL || process.env.BACKEND_SERVER || 'http://localhost:8810'
  }

if (process.contextIsolated) {
  try {
    console.log('Exposing APIs to renderer process...')
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('env', env)
    exposeRpc({ name: 'rpc', whitelist: ['rpc'] })
  } catch (error) {
    console.error(error)
  }
} else {
  console.log('Context isolation is disabled; exposing APIs directly to renderer process')
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.env = env
}
