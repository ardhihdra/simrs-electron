import { is } from '@electron-toolkit/utils'
import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { z } from 'zod'
import { t } from '../'
import icon from '../../../../resources/icon.png?asset'
import { exportCsv } from '../../routes/query/export'

const ExportCsvUrlInputSchema = z.object({
  entity: z.string(),
  usePagination: z.boolean().optional(),
  page: z.number().optional(),
  items: z.number().optional(),
  q: z.string().optional(),
  fields: z.string().optional(),
  filter: z.record(z.string(), z.string().or(z.number()).or(z.boolean())).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
})

export const windowRpc = {
  create: t
    .input(
      z.object({
        url: z.string().url(),
        title: z.string().optional(),
        iframe: z.boolean().default(true).optional()
      })
    )
    .output(z.boolean())
    .mutation(async (_ctx, input) => {
      try {
        const newWindow = new BrowserWindow({
          width: 1280,
          height: 800,
          show: false,
          title: input.title || 'MavoloStudio',
          autoHideMenuBar: true,
          ...(process.platform === 'linux' ? { icon } : {}),
          webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false
          }
        })

        newWindow.on('ready-to-show', () => {
          newWindow.show()
        })

        if (input.iframe === false) {
          newWindow.loadURL(input.url)
          return true
        }

        // Build the URL to our renderer, pointing to the #/iframe-view route
        // We pass the target iframe URL as a query param or hash param
        // Using query param in hash url: #/iframe-view?url=xyz

        const route = `#/iframe-view?url=${encodeURIComponent(input.url)}`

        let rendererPath = join(__dirname, '../renderer/index.html')

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const fs = require('fs')
        if (!fs.existsSync(rendererPath) && !is.dev) {
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

          for (const path of possiblePaths) {
            if (fs.existsSync(path)) {
              rendererPath = path
              break
            }
          }
        }

        if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
          const devUrl = new URL(process.env['ELECTRON_RENDERER_URL'])
          devUrl.hash = route
          newWindow.loadURL(devUrl.toString())
        } else {
          newWindow.loadFile(rendererPath, { hash: route })
        }

        return true
      } catch (error) {
        console.error('Error creating window:', error)
        return false
      }
    }),
  exportCsvUrl: t
    .input(ExportCsvUrlInputSchema)
    .output(
      z.object({
        success: z.boolean(),
        url: z.string().optional(),
        error: z.string().optional()
      })
    )
    .query(async (ctx, input) => {
      return exportCsv(ctx, input as any)
    })
}
