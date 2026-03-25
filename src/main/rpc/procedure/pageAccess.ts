import z from 'zod'
import { t } from '..'

const PageAccessItemSchema = z.object({
    id: z.number(),
    page_path: z.string(),
    allowedModules: z.array(z.string()).nullable().optional(),
    module_category: z.string().nullable().optional(),
})

const PageAccessSchema = z.object({
    success: z.boolean().optional(),
    result: z.array(PageAccessItemSchema).optional(),
})

export const pageAccessRpc = {
    list: t
        .input(z.any())
        .output(PageAccessSchema)
        .query(async ({ client }) => {
            const data = await client.get('/api/page-access')
            const result = await data.json()
            return result
        }),
}
