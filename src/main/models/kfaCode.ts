import z from 'zod'

export const KfaCodeSchema = z.object({
  code: z.number().int(),
  display: z.string().min(1)
})

export const KfaCodeWithIdSchema = KfaCodeSchema.extend({
  id: z.number().int()
})

export type KfaCode = z.infer<typeof KfaCodeWithIdSchema>
export type KfaCodeCreate = z.infer<typeof KfaCodeSchema>
