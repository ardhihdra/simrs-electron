import z from 'zod'
import { t } from '..'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const getHakAksesId = (user: unknown): string | undefined =>
  isRecord(user) && typeof user.hakAksesId === 'string' ? user.hakAksesId : undefined

const ScopeSessionSchema = z.object({
  id: z.coerce.number(),
  lokasiKerjaId: z.coerce.number(),
  allowedModules: z.array(z.string()).min(1),
  label: z.string().nullish().transform((value) => value ?? undefined),
  hakAksesId: z.string().optional(),
  kepegawaianId: z.number().optional()
})

const ScopeActivationSchema = z
  .object({
    success: z.boolean().optional(),
    message: z.string().optional(),
    result: z
      .object({
        lokasiKerjaId: z.coerce.number(),
        allowedModules: z.array(z.string()).min(1),
        scopeToken: z.string().min(1),
        expiresAt: z.unknown().optional()
      })
      .optional()
  })
  .passthrough()

const ScopeSignOutSchema = z
  .object({
    success: z.boolean().optional(),
    message: z.string().optional(),
    error: z.string().optional()
  })
  .passthrough()

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

const MySchema = z.object({
  success: z.boolean().optional(),
  result: z
    .array(
      z.object({
        lokasiKerja: z.object({
          id: z.number(),
          kode: z.string(),
          nama: z.string()
        }),
        configs: z
          .array(
            z.object({
              allowedModules: z.array(z.string()),
              id: z.number(),
              label: z.string(),
            })
          )
          .optional()
      })
    )
    .optional()
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
