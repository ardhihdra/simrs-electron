import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse, BackendListSchema } from '@main/utils/backendClient'
import { SuplierSchema, SuplierWithIdSchema } from '@main/models/suplier'

export const requireSession = true

export const schemas = {
  list: {
    result: z.object({ success: z.boolean(), result: SuplierWithIdSchema.array().optional(), message: z.string().optional() })
  },
  read: {
    args: z.object({ id: z.number() }),
    result: z.object({ success: z.boolean(), result: SuplierWithIdSchema.optional(), message: z.string().optional() })
  },
  create: {
    args: SuplierSchema.partial(),
    result: z.object({ success: z.boolean(), result: SuplierWithIdSchema.optional(), message: z.string().optional() })
  },
  update: {
    args: SuplierSchema.extend({ id: z.number() }),
    result: z.object({ success: z.boolean(), result: SuplierWithIdSchema.optional(), message: z.string().optional() })
  },
  remove: {
    args: z.object({ id: z.number() }),
    result: z.object({ success: z.boolean(), message: z.string().optional() })
  }
} as const

const BackendDetailSchema = z.object({ success: z.boolean(), result: SuplierWithIdSchema.optional(), message: z.string().optional(), error: z.string().optional() })

export const list = async (ctx: IpcContext) => {
  const client = createBackendClient(ctx)
  const res = await client.get('/api/suplier?items=100')
  const result = await parseBackendResponse(res, BackendListSchema(SuplierWithIdSchema))
  return { success: true, result }
}

export const read = async (ctx: IpcContext, args: z.infer<typeof schemas.read.args>) => {
  const client = createBackendClient(ctx)
  const res = await client.get(`/api/suplier/read/${args.id}`)
  const result = await parseBackendResponse(res, BackendDetailSchema)
  return { success: true, result }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
  const client = createBackendClient(ctx)
  const payload = {
    nama: args.nama,
    kode: args.kode,
    noHp: args.noHp,
    alamat: args.alamat ?? null,
    note: args.note ?? null
  }
  const res = await client.post('/api/suplier', payload)
  const result = await parseBackendResponse(res, BackendDetailSchema)
  return { success: true, result }
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
  const client = createBackendClient(ctx)
  const payload = {
    nama: args.nama,
    kode: args.kode,
    noHp: args.noHp,
    alamat: args.alamat ?? null,
    note: args.note ?? null
  }
  const res = await client.put(`/api/suplier/${args.id}`, payload)
  const result = await parseBackendResponse(res, BackendDetailSchema)
  return { success: true, result }
}

export const remove = async (ctx: IpcContext, args: z.infer<typeof schemas.remove.args>) => {
  const client = createBackendClient(ctx)
  const res = await client.delete(`/api/suplier/${args.id}`)
  const DeleteSchema = z.object({ success: z.boolean(), message: z.string().optional(), error: z.string().optional() })
  await parseBackendResponse(res, DeleteSchema)
  return { success: true }
}

