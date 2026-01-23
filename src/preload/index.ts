import { electronAPI } from '@electron-toolkit/preload'
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

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
