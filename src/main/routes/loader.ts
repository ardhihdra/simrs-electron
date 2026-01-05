import { IpcRouter } from '@main/ipc/router'
import { withSession, IpcMiddleware } from '@main/ipc/middleware'
import { SessionStore } from '@main/ipc/protected/session-store'

// Minimal Zod-like schema interfaces to avoid hard dependency
type ZodSchema<T = any> = { parse: (data: any) => T }
type HandlerSchemas = { args?: ZodSchema; result?: ZodSchema }

function wrapWithSchemas<Args = any, Result = any>(
  handler: (ctx: any, args: Args) => Promise<Result> | Result,
  schemas?: HandlerSchemas
) {
  if (!schemas?.args && !schemas?.result) return handler as any
  return async (ctx: any, args: Args) => {
    let validatedArgs = args
    if (schemas?.args) {
      try {
        validatedArgs = (schemas.args as ZodSchema<Args>).parse(args)
      } catch (err: any) {
        return { success: false, error: err?.message || 'invalid arguments' }
      }
    }
    const res = await handler(ctx, validatedArgs)
    if (schemas?.result) {
      try {
        return (schemas.result as ZodSchema<Result>).parse(res)
      } catch (err: any) {
        return { success: false, error: err?.message || 'invalid result' }
      }
    }
    return res
  }
}

// Auto-register routes based on files in this directory.
// Convention: named exports that are functions become channels derived from the file path.
// Example: routes/user.ts with `export function list()` => channel `user:list`
// Nested files: routes/user/auth.ts with `export function login()` => channel `user:auth:login`
export function autoRegisterRoutes(router: IpcRouter, opts?: { sessionStore?: SessionStore }) {
  const modules = import.meta.glob('./**/*.ts', { eager: true }) as Record<string, any>

  for (const [filePath, mod] of Object.entries(modules)) {
    // Skip this loader file itself
    if (filePath.endsWith('/loader.ts')) continue

    const normalized = filePath
      .replace(/^\.\//, '')
      .replace(/\.(ts|js)$/i, '')
      .replace(/\\/g, '/')
    const base = normalized
      .split('/')
      .map((p) => p.replace(/^routes\//, ''))
      .filter(Boolean)
      .join(':')

    for (const [exportName, handler] of Object.entries(mod)) {
      if (typeof handler !== 'function') continue
      const channel = exportName === 'default' ? base : `${base}:${exportName}`
      try {
        // collect middlewares if provided by module
        const mws: IpcMiddleware<any, any, any>[] = []
        if (Array.isArray(mod.middlewares)) {
          mws.push(...(mod.middlewares as IpcMiddleware<any, any, any>[]))
        }
        if (opts?.sessionStore && mod.requireSession) {
          mws.push(withSession(opts.sessionStore))
        }
        // Apply optional Zod schemas: module-level or per-export
        const moduleSchemas = mod.schemas as Record<string, HandlerSchemas> | undefined
        const perExportSchemas = moduleSchemas?.[exportName] as HandlerSchemas | undefined
        const defaultArgsSchema = mod.argsSchema as ZodSchema | undefined
        const defaultResultSchema = mod.resultSchema as ZodSchema | undefined
        const schemas: HandlerSchemas | undefined =
          perExportSchemas || defaultArgsSchema || defaultResultSchema
            ? {
              args: perExportSchemas?.args ?? defaultArgsSchema,
              result: perExportSchemas?.result ?? defaultResultSchema
            }
            : undefined

        const finalHandler = wrapWithSchemas(handler as any, schemas)
        router.register(channel, mws, finalHandler as any)
        console.log(`[ipc] Registered auto route: ${channel}`)
      } catch (err) {
        console.warn(`[ipc] Failed to register route ${channel}:`, (err as Error).message)
      }
    }
  }
}
