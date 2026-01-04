import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const alias = {
  '@main': resolve('src/main'),
  '@preload': resolve('src/preload'),
  '@renderer': resolve('src/renderer/src'),
  '@shared': resolve('src/shared')
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias
    },
    build: {
      // Enable dev-time hot reloading (Electron auto-restart when main changes)
      watch: {}
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias
    },
    build: {
      // Enable dev-time hot reloading (reload renderers when preload changes)
      watch: {}
    }
  },
  renderer: {
    resolve: {
      alias
    },
    plugins: [react(), tailwindcss()]
  }
})
