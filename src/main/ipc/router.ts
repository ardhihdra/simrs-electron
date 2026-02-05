import { applyMiddlewares, IpcMiddleware } from '@main/ipc/middleware'
import { SessionStore } from '@main/ipc/protected/session-store'
import { ipcMain, IpcMainInvokeEvent, WebContents } from 'electron'
import fs from 'fs'
import path from 'path'

export type IpcContext = {
  event: IpcMainInvokeEvent
  senderId: number
  webContents: WebContents
  session?: unknown
  user?: unknown
  sessionStore?: SessionStore
}

export type IpcHandler<Args = unknown, Result = unknown> = (
  ctx: IpcContext,
  args: Args
) => Promise<Result> | Result

type RouteMeta = {
  path: string
  handler: IpcHandler
}

export class IpcRouter {
  private sessionStore?: SessionStore
  private routes: Map<string, RouteMeta> = new Map()

  constructor(opts?: { sessionStore?: SessionStore }) {
    this.sessionStore = opts?.sessionStore
  }

  register<Args = unknown, Result = unknown>(
    channel: string,
    middlewares: IpcMiddleware<Args, Result, Result>[] = [],
    handler: IpcHandler<Args, Result>
  ) {
    if (this.routes.has(channel)) {
      console.warn(`[ipc] Channel already registered: ${channel}`)
      return
    }

    const final = applyMiddlewares<Args, Result>(...middlewares)(handler)
    // @ts-ignore (we know the type is correct)
    this.routes.set(channel, { path: channel, handler: final })

    ipcMain.handle(channel, async (event, args) => {
      const ctx: IpcContext = {
        event,
        senderId: event.sender.id,
        webContents: event.sender,
        sessionStore: this.sessionStore
      }

      if (this.sessionStore && typeof args === 'object' && args && 'token' in (args as object)) {
        const s = this.sessionStore.get((args as { token?: string }).token as string)
        if (s) {
          ctx.session = s
          ctx.user = { id: s.userId }
        }
      }

      let argKeys: string[] = []
      if (args && typeof args === 'object') {
        argKeys = Object.keys(args as object).filter((k) => k !== 'token')
      }
      console.log('[ipc] invoke', channel, { senderId: event.sender.id, argKeys })

      try {
        const res = await final(ctx, args)
        let success: boolean | undefined
        if (res && typeof res === 'object' && 'success' in (res as object)) {
          success = (res as { success?: boolean }).success
        }
        console.log('[ipc] result', channel, { success })
        return res
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error('[ipc] error', channel, msg)
        throw e
      }
    })
  }

  /** Return a nested namespace tree for preload */
  getNamespaceTree() {
    const tree: any = {}
    for (const key of this.routes.keys()) {
      const parts = key.split(':')
      let current = tree
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        if (!current[part]) current[part] = i === parts.length - 1 ? true : {}
        current = current[part]
      }
    }
    return tree
  }
  generatePreloadTypes() {
    try {
      const buildTree = (channels: string[]) => {
        const tree: any = {}
        for (const ch of channels) {
          const parts = ch.split(':')
          let node = tree
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i]
            if (i === parts.length - 1) node[part] = true
            else node = node[part] ||= {}
          }
        }
        return tree
      }

      const channels = Array.from(this.routes.values()).map((r) => r.path)
      const tree = buildTree(channels)

      // Build module import map and per-channel type alias names
      const toModulePathAndExport = (channel: string) => {
        const parts = channel.split(':')
        const exportName = parts.pop() as string
        // Omit extension to satisfy TypeScript `allowImportingTsExtensions: false`
        const moduleRel = `@main/routes/${parts.join('/')}`
        return { moduleRel, exportName }
      }
      const toAlias = (moduleRel: string) => {
        const base = moduleRel
          .replace(/\\/g, '/')
          .replace(/^.*\/routes\//, '')
          .replace(/\.ts$/, '')
        return 'Mod_' + base.replace(/[^a-zA-Z0-9]/g, '_')
      }
      const imports: { alias: string; path: string }[] = []
      const typeMap: Record<string, { argsType: string; resultType: string }> = {}
      for (const ch of channels) {
        const { moduleRel, exportName } = toModulePathAndExport(ch)
        const alias = toAlias(moduleRel)
        if (!imports.find((i) => i.path === moduleRel)) {
          imports.push({ alias, path: moduleRel })
        }
        const argsAlias = `Args_${alias}_${exportName}`
        const resultAlias = `Result_${alias}_${exportName}`
        typeMap[ch] = { argsType: argsAlias, resultType: resultAlias }
      }

      const renderTree = (tree: any, indent = 4, prefix = ''): string => {
        const space = ' '.repeat(indent)
        return Object.entries(tree)
          .map(([key, value]) => {
            if (value === true) {
              const full = prefix ? `${prefix}:${key}` : key
              const types = typeMap[full]
              const typeSig = types ? `Invoke<${types.argsType}, ${types.resultType}>` : 'Invoke'
              return `${space}${key}: ${typeSig}`
            }
            const inner = renderTree(value, indent + 2, prefix ? `${prefix}:${key}` : key)
            return `${space}${key}: {\n${inner}\n${space}}`
          })
          .join('\n')
      }

      const importLines = imports
        .map((i) => `import type * as ${i.alias} from '${i.path}'`)
        .join('\n')

      const aliasLines = channels
        .map((ch) => {
          const { moduleRel, exportName } = toModulePathAndExport(ch)
          const alias = toAlias(moduleRel)
          const types = typeMap[ch]
          return [
            `type ${types.argsType} = InferArgs<typeof ${alias}, '${exportName}'>`,
            `type ${types.resultType} = InferResult<typeof ${alias}, '${exportName}'>`
          ].join('\n')
        })
        .join('\n')

      const content = `// AUTO-GENERATED FILE (runtime)
// Generated by IpcRouter
import type { z } from 'zod'
${importLines}
type Invoke<Args = unknown, Result = unknown> = (args?: Args) => Promise<Result>
type InferArgs<M, K extends string> = M extends { schemas: Record<string, any> }
  ? K extends keyof M['schemas']
    ? M['schemas'][K] extends { args: infer A extends z.ZodTypeAny }
      ? z.input<A>
      : unknown
    : unknown
  : M extends { schemas: infer S }
  ? K extends keyof S
    ? S[K] extends { args: infer A extends z.ZodTypeAny }
      ? z.input<A>
      : unknown
    : unknown
  : M extends { argsSchema: infer A extends z.ZodTypeAny }
  ? z.input<A>
  : unknown
type InferResult<M, K extends string> = M extends { schemas: Record<string, any> }
  ? K extends keyof M['schemas']
    ? M['schemas'][K] extends { result: infer R extends z.ZodTypeAny }
      ? z.output<R>
      : unknown
    : unknown
  : M extends { schemas: infer S }
  ? K extends keyof S
    ? S[K] extends { result: infer R extends z.ZodTypeAny }
      ? z.output<R>
      : unknown
    : unknown
  : M extends { resultSchema: infer R extends z.ZodTypeAny }
  ? z.output<R>
  : unknown
${aliasLines}
declare global {
  interface Window {
    api: {
${renderTree(tree, 6)}
    }
  }
}
export {}
`
      // For development environment
      const devFile = path.resolve('src/preload/ipc-channels.d.ts')
      this.ensureDirectoryExists(path.dirname(devFile))
      try {
        fs.writeFileSync(devFile, content)
        console.log('[ipc] Generated runtime type:', devFile)
      } catch (err) {
        console.warn('[ipc] Failed to write dev type file:', err)
      }

      // For production environment - write to a location that will definitely exist
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { app } = require('electron')
      const userDataPath = app.getPath('userData')
      const prodFile = path.join(userDataPath, 'ipc-channels.d.ts')
      try {
        fs.writeFileSync(prodFile, content)
        console.log('[ipc] Generated runtime type (fallback):', prodFile)
      } catch (err) {
        console.warn('[ipc] Failed to write prod type file:', err)
      }

      // Also emit a JSON file for preload to consume at runtime
      // Make sure the directory exists
      const preloadDir = path.resolve(__dirname, '../preload')
      this.ensureDirectoryExists(preloadDir)

      // Try multiple locations for the JSON file to ensure it's accessible in both dev and prod
      const jsonFile = path.join(preloadDir, 'ipc-channels.json')
      try {
        fs.writeFileSync(jsonFile, JSON.stringify(tree, null, 2))
        console.log('[ipc] Generated runtime JSON:', jsonFile)
      } catch (err) {
        console.warn('[ipc] Failed to write JSON file to preload dir:', err)
      }

      // For production environment - write to a location that will definitely exist
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { app } = require('electron')
        const userDataPath = app.getPath('userData')
        const userDataJsonFile = path.join(userDataPath, 'ipc-channels.json')
        fs.writeFileSync(userDataJsonFile, JSON.stringify(tree, null, 2))
        console.log('[ipc] Generated runtime JSON (fallback):', userDataJsonFile)

        // Also write to the app's resources directory which should be accessible in production
        try {
          const resourcesPath = app.getPath('exe')
          const resourcesDir = path.dirname(resourcesPath)
          const resourcesJsonFile = path.join(resourcesDir, 'resources', 'ipc-channels.json')
          this.ensureDirectoryExists(path.dirname(resourcesJsonFile))
          fs.writeFileSync(resourcesJsonFile, JSON.stringify(tree, null, 2))
          console.log('[ipc] Generated runtime JSON (resources):', resourcesJsonFile)
        } catch (resErr) {
          console.warn('[ipc] Failed to write JSON file to resources directory:', resErr)
        }
      } catch (err) {
        console.warn('[ipc] Failed to write JSON file to user data:', err)
      }
    } catch (error) {
      console.error('[ipc] Error generating preload types:', error)
    }
  }

  private ensureDirectoryExists(dirPath: string) {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
        console.log(`[ipc] Created directory: ${dirPath}`)
      }
    } catch (err) {
      console.warn(`[ipc] Failed to create directory ${dirPath}:`, err)
    }
  }
}
