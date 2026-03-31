import { PageAccessRpcSchema } from 'simrs-types'
import z from 'zod'
import { t } from '..'

// --- Schemas are now in simrs-types ---

export const pageAccessRpc = {
    list: t
        .input(z.any())
        .output(PageAccessRpcSchema)
        .query(async ({ client }) => {
            const data = await client.get('/api/module/page-access')
            const result = await data.json()
            return result
        }),
}
