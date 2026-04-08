import { ApiResponseSchema, ApplicationConfigResultSchema } from 'simrs-types'
import { z } from 'zod'
import { t } from '..'

export const applicationConfigRpc = {
  get: t
    .input(z.void())
    .output(ApiResponseSchema(ApplicationConfigResultSchema))
    .query(async ({ client }) => {
      const res = await client.get('/api/module/app-config')
      return await res.json()
    })
}

