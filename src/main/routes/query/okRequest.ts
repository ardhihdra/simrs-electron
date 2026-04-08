import { IpcContext } from '@main/ipc/router'
import {
  BackendListSchema,
  createBackendClient,
  parseBackendResponse
} from '@main/utils/backendClient'
import {
  OkRequestInputStatusSchema,
  OkRequestPostOpChecklistItemsSchema,
  OkRequestPostOpSignOutSchema,
  OkRequestPreOpChecklistSchema,
  OkRequestSchema,
  OkRequestSchemaWithId,
  OkRequestWhoSignInSchema,
  OkRequestWhoTimeOutSchema
} from 'simrs-types'
import z from 'zod'

export const requireSession = true

const MODULE_ENDPOINT = '/api/module/ok-request'
const OkRequestCreateSchema = OkRequestSchema.partial().extend({
  status: OkRequestInputStatusSchema.optional()
})

const BackendResponseSchema = z.object({
  success: z.boolean(),
  result: OkRequestSchemaWithId.optional(),
  message: z.string().optional(),
  error: z.string().optional()
})

export const schemas = {
  list: {
    args: z.object({
      encounterId: z.string().optional()
    }).optional(),
    result: z.object({
      success: z.boolean(),
      result: OkRequestSchemaWithId.array().optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })
  },
  create: {
    args: OkRequestCreateSchema,
    result: BackendResponseSchema
  },
  uploadSupportingDocument: {
    args: z.object({
      file: z.any(),
      filename: z.string().min(1),
      mimetype: z.string().optional().nullable()
    }),
    result: z.object({
      success: z.boolean(),
      result: z
        .object({
          path: z.string()
        })
        .optional(),
      message: z.string().optional(),
      error: z.string().optional()
    })
  },
  verify: {
    args: z.object({
      id: z.number(),
      status: OkRequestInputStatusSchema,
      scheduledAt: z.string().optional().nullable(),
      estimatedDurationMinutes: z.number().optional().nullable(),
      operatingRoomId: z.number().optional().nullable(),
      notes: z.string().optional().nullable(),
      rejectionReason: z.string().optional().nullable(),
      updatedBy: z.number().optional().nullable()
    }),
    result: BackendResponseSchema
  },
  saveChecklists: {
    args: z.object({
      id: z.number(),
      preOpChecklist: OkRequestPreOpChecklistSchema.partial().optional().nullable(),
      whoChecklist: z
        .object({
          signIn: OkRequestWhoSignInSchema.partial().optional().nullable(),
          timeOut: OkRequestWhoTimeOutSchema.partial().optional().nullable()
        })
        .partial()
        .optional()
        .nullable(),
      postOpChecklist: z
        .object({
          signOut: OkRequestPostOpSignOutSchema.partial().optional().nullable(),
          checklist: OkRequestPostOpChecklistItemsSchema.partial().optional().nullable()
        })
        .partial()
        .optional()
        .nullable(),
      updatedBy: z.number().optional().nullable()
    }),
    result: BackendResponseSchema
  }
} as const

export const list = async (ctx: IpcContext, args?: z.infer<typeof schemas.list.args>) => {
  try {
    const client = createBackendClient(ctx)
    const params = new URLSearchParams()
    if (args?.encounterId) params.append('encounterId', args.encounterId)

    const queryString = params.toString()
    const path = queryString ? `${MODULE_ENDPOINT}?${queryString}` : MODULE_ENDPOINT
    const res = await client.get(path)
    const result = await parseBackendResponse(res, BackendListSchema(OkRequestSchemaWithId))
    return { success: true, result }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : String(err),
      error: err instanceof Error ? err.message : String(err)
    }
  }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  try {
    const client = createBackendClient(ctx)
    const normalizedPayload = {
      ...args,
      status: args.status === 'diajukan' ? 'verified' : args.status
    }

    const res = await client.post(MODULE_ENDPOINT, normalizedPayload)
    const result = await parseBackendResponse(res, BackendResponseSchema)
    return { success: true, result }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : String(err),
      error: err instanceof Error ? err.message : String(err)
    }
  }
}

export const uploadSupportingDocument = async (
  ctx: IpcContext,
  args: z.infer<typeof schemas.uploadSupportingDocument.args>
) => {
  try {
    const client = createBackendClient(ctx)

    let arrayBuffer: ArrayBuffer | null = null
    if (args.file instanceof ArrayBuffer) {
      arrayBuffer = args.file
    } else if (args.file instanceof Uint8Array) {
      const copied = new ArrayBuffer(args.file.byteLength)
      new Uint8Array(copied).set(args.file)
      arrayBuffer = copied
    } else if (ArrayBuffer.isView(args.file)) {
      const view = args.file as ArrayBufferView
      const source = new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
      const copied = new ArrayBuffer(source.byteLength)
      new Uint8Array(copied).set(source)
      arrayBuffer = copied
    } else if (
      args.file &&
      typeof args.file === 'object' &&
      Array.isArray((args.file as { data?: unknown[] }).data)
    ) {
      const source = new Uint8Array((args.file as { data: number[] }).data)
      const copied = new ArrayBuffer(source.byteLength)
      new Uint8Array(copied).set(source)
      arrayBuffer = copied
    }

    if (!arrayBuffer) {
      throw new Error('File upload tidak valid')
    }

    const formData = new FormData()
    const fileBlob = new Blob([arrayBuffer], {
      type: args.mimetype || 'application/octet-stream'
    })
    formData.append('file', fileBlob, args.filename)

    const res = await client.createWithUpload(`${MODULE_ENDPOINT}/upload-supporting-document`, formData)
    const result = await parseBackendResponse(res, schemas.uploadSupportingDocument.result)
    return { success: true, result }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : String(err),
      error: err instanceof Error ? err.message : String(err)
    }
  }
}

export const verify = async (ctx: IpcContext, args: z.infer<typeof schemas.verify.args>) => {
  try {
    const client = createBackendClient(ctx)
    const payload = {
      status: args.status === 'diajukan' ? 'verified' : args.status,
      scheduledAt: args.scheduledAt ?? null,
      estimatedDurationMinutes: args.estimatedDurationMinutes ?? null,
      operatingRoomId: args.operatingRoomId ?? null,
      notes: args.notes ?? null,
      rejectionReason: args.rejectionReason ?? null,
      updatedBy: args.updatedBy ?? null
    }

    const res = await client.patch(`${MODULE_ENDPOINT}/${args.id}/verify`, payload)
    const result = await parseBackendResponse(res, BackendResponseSchema)
    return { success: true, result }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : String(err),
      error: err instanceof Error ? err.message : String(err)
    }
  }
}

export const saveChecklists = async (
  ctx: IpcContext,
  args: z.infer<typeof schemas.saveChecklists.args>
) => {
  try {
    const client = createBackendClient(ctx)
    const payload = {
      preOpChecklist: args.preOpChecklist ?? undefined,
      whoChecklist: args.whoChecklist ?? undefined,
      postOpChecklist: args.postOpChecklist ?? undefined,
      updatedBy: args.updatedBy ?? null
    }

    const res = await client.patch(`${MODULE_ENDPOINT}/${args.id}/checklists`, payload)
    const result = await parseBackendResponse(res, BackendResponseSchema)
    return { success: true, result }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : String(err),
      error: err instanceof Error ? err.message : String(err)
    }
  }
}
