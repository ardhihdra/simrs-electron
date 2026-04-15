import { z } from 'zod'
import { t } from '..'

const ChangePasswordInputSchema = z
    .object({
        oldPassword: z.string().optional(),
        newPassword: z.string().min(8),
        targetUserId: z.union([z.string(), z.number()]).optional()
    })
    .refine(
        (data) => data.targetUserId !== undefined || data.oldPassword !== undefined,
        { message: 'oldPassword is required when changing your own password' }
    )

const ChangePasswordOutputSchema = z.object({
    success: z.boolean(),
    result: z.null().optional(),
    message: z.string()
})

export const authRpc = {
    changePassword: t
        .input(ChangePasswordInputSchema)
        .output(ChangePasswordOutputSchema)
        .mutation(async ({ client }, input) => {
            const data = await client.post('/api/changepassword', input)
            const res = await data.json()
            return res
        })
}
