import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const alias = {
  '@main': resolve('src/main'),
  '@preload': resolve('src/preload'),
  '@renderer': resolve('src/renderer/src'),
  '@shared': resolve('src/shared')
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias
    },
    define: {
      'process.env.API_URL': JSON.stringify(env.API_URL ?? ''),
      'process.env.BACKEND_SERVER': JSON.stringify(env.BACKEND_SERVER ?? ''),
      'process.env.FILE_BASE_URL': JSON.stringify(env.FILE_BASE_URL ?? ''),
      'process.env.ALLOWED_HOSTS': JSON.stringify(env.ALLOWED_HOSTS ?? ''),
      'process.env.USE_DUMMY_AUTH': JSON.stringify(env.USE_DUMMY_AUTH ?? 'false')
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
      watch: {},
      // Preserve ipc-channels.json generated at runtime by the main process
      emptyOutDir: false
    }
  },
  renderer: {
    envPrefix: 'RENDERER_VITE_',
    resolve: {
      alias,
      // Keep workspace-linked deps as node_modules paths so Vite can prebundle CJS packages.
      preserveSymlinks: true
    },
    optimizeDeps: {
      include: ['simrs-types']
    },
    build: {
      commonjsOptions: {
        include: [/simrs-types/, /node_modules/]
      }
    },
    plugins: [react(), tailwindcss()]
  }
  }
})
