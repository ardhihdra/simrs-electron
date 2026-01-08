import { IpcContext } from '@main/ipc/router'
import { createBackendClient } from '@main/utils/backendClient'
import z from 'zod'

const SendNotificationSchema = z.object({
  title: z.string(),
  content: z.string(),
  targetUserId: z.string().optional(),
  url: z.string().optional()
})

const BackendSendResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  delivered: z.number().optional()
})

export const schemas = {
  send: {
    args: SendNotificationSchema,
    result: BackendSendResponseSchema
  }
} as const

export async function send(ctx: IpcContext, args: z.infer<typeof SendNotificationSchema>) {
  const client = createBackendClient(ctx)
  const res = await client.post('/api/notification/send', args)

  // Create a specific schema for the backend response wrapper

  // We might need to handle it manually if the backend response structure for this specific endpoint
  // differs from the standard { success: true, result: T } wrapper.
  // Based on user request: return res.status(200).json({ success: true, message: "Broadcast executed", delivered: count });
  // It seems like a flat response, not nested in `result`.

  const json = await res.json()

  if (!res.ok) {
    throw new Error(json.message || 'Failed to send notification')
  }

  return {
    success: json.success,
    message: json.message,
    delivered: json.delivered
  }
}
