import {
  ScopeSessionSchema,
  ScopeActivationSchema,
  ScopeSignOutSchema,
  MySchema
} from 'simrs-types'
import z from 'zod'
import { t } from '..'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const getHakAksesId = (user: unknown): string | undefined =>
  isRecord(user) && typeof user.hakAksesId === 'string' ? user.hakAksesId : undefined

// --- Schemas are now in simrs-types ---

const ScopeSessionOutputSchema = z
  .union([
    ScopeSessionSchema,
    z
      .object({
        success: z.boolean().optional(),
        result: ScopeSessionSchema.optional(),
        session: ScopeSessionSchema.optional()
      })
      .passthrough()
  ])
  .transform((value, ctx) => {
    if ('allowedModules' in value) {
      return value
    }

    const session = value.result ?? value.session
    if (!session) {
      ctx.addIssue({
        code: 'custom',
        message: 'Invalid module session response'
      })
      return z.NEVER
    }

    return session
  })

export const mmoduleRpc = {
  my: t
    .input(z.any())
    .output(MySchema)
    .query(async ({ client }) => {
      const data = await client.get('/api/module/my')
      const result = await data.json()
      console.log('MYGET:', result)
      return result
    }),
  myById: t
    .input(z.object({ id: z.string() }))
    .output(z.any())
    .query(async ({ client }, input) => {
      const data = await client.get(`/api/module/my/${input.id}`)
      const result = await data.json()
      console.log('MYPOST:', result)
      return result
    }),
  scope: t
    .input(
      z.object({
        configId: z.number(),
        allowedModules: z.array(z.string()).min(1)
      })
    )
    .output(ScopeActivationSchema)
    .mutation(async ({ client, senderId, sessionStore }, input) => {
      const data = await client.post('/api/module/scope', input)
      const result = await data.json()
      if (!result?.success) {
        console.error('Failed to activate module scope:', result?.message || result)
        throw new Error(result?.message || 'Failed to activate module scope')
      }
      if (typeof senderId === 'number') {
        const scopeToken = ScopeActivationSchema.safeParse(result).data?.result?.scopeToken
        if (scopeToken) {
          sessionStore?.setScopeTokenForWindow?.(senderId, scopeToken)
        }
      }
      console.log('SCOPE:', result)
      return result
    }),
  signout: t
    .input(z.object({}).passthrough())
    .output(ScopeSignOutSchema)
    .mutation(async ({ client, senderId, sessionStore }) => {
      const data = await client.post('/api/module/signout')
      const result = await data.json().catch(() => ({ success: data.ok }))
      if (typeof senderId === 'number') {
        sessionStore?.clearScopeTokenForWindow?.(senderId)
      }
      console.log('MODULE_SIGNOUT:', result)
      return result
    }),
  getSession: t
    .input(z.object({}).passthrough())
    .output(ScopeSessionOutputSchema)
    .query(async ({ client, senderId, sessionStore, user }) => {
      const data = await client.get('/api/module/session')
      if (!data.ok && typeof senderId === 'number') {
        sessionStore?.clearScopeTokenForWindow?.(senderId)
      }
      const result = await data.json()
      const hakAksesId = getHakAksesId(user)
      const enrichedResult =
        hakAksesId && isRecord(result)
          ? isRecord(result.result)
            ? {
                ...result,
                result: {
                  ...result.result,
                  hakAksesId
                }
              }
            : isRecord(result.session)
              ? {
                  ...result,
                  session: {
                    ...result.session,
                    hakAksesId
                  }
                }
              : {
                  ...result,
                  hakAksesId
                }
          : result
      const parsedResult = ScopeSessionOutputSchema.safeParse(enrichedResult)
      if (!parsedResult.success && typeof senderId === 'number') {
        console.error("failed to parse session", parsedResult)
        sessionStore?.clearScopeTokenForWindow?.(senderId)
      }
      console.log('SESSION:', enrichedResult)
      return enrichedResult
    })
}
