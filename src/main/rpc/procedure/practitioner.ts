import { ApiResponseSchema, PractitionerSchema } from 'simrs-types'
import { z } from 'zod'
import { t } from '../'

export const PractitionerListInputSchema = z.object({
  hakAksesId: z.string().optional(),
  name: z.string().optional()
})
export type PractitionerListInput = z.infer<typeof PractitionerListInputSchema>

export const practitionerRpc = {
  list: t
    .input(PractitionerListInputSchema)
    .output(ApiResponseSchema(PractitionerSchema.array()))
    .query(async ({ client }, input) => {
      const params = new URLSearchParams()
      if (input.hakAksesId) params.append('hakAksesId', input.hakAksesId)
      if (input.name) params.append('name', input.name)

      const res = await client.get(`/api/kepegawaian?${params.toString()}`)
      return await res.json()
    })
}
