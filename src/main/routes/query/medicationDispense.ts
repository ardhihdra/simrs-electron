import z from 'zod'
import { MedicationDispenseWithIdSchema } from '@main/models/medicationDispense'
import { MedicationRequestWithIdSchema } from '@main/models/medicationRequest'
import { MedicationDispenseStatus } from '@main/models/enums/ResourceEnums'
import { IpcContext } from '@main/ipc/router'
import { parseBackendResponse, BackendListSchema, getClient } from '@main/utils/backendClient'

export const requireSession = true

export const schemas = {
  list: {
    args: z
      .object({
        patientId: z.string().optional(),
        page: z.number().optional(),
        limit: z.number().optional()
      })
      .optional(),
    result: z.object({
      success: z.boolean(),
      data: MedicationDispenseWithIdSchema.array().optional(),
      pagination: z
        .object({
          page: z.number(),
          limit: z.number(),
          total: z.number(),
          pages: z.number()
        })
        .optional(),
      error: z.string().optional()
    })
  },
  createFromRequest: {
    args: z.object({
      medicationRequestId: z.number()
    }),
    result: z.object({
      success: z.boolean(),
      data: MedicationDispenseWithIdSchema.optional(),
      error: z.string().optional()
    })
  }
} as const

type ListArgs = z.infer<typeof schemas.list.args>

export const list = async (ctx: IpcContext, args?: ListArgs) => {
  try {
    const client = getClient(ctx)
    const params = new URLSearchParams()

    if (args?.patientId) params.append('patientId', args.patientId)
    if (args?.page) params.append('page', String(args.page))
    if (args?.limit) params.append('limit', String(args.limit))

    const queryString = params.toString()
    const url = queryString.length > 0 ? `/api/medicationdispense?${queryString}` : '/api/medicationdispense'

    console.log('MedicationDispense IPC list called with args and url:', {
      args,
      url
    })

    const res = await client.get(url)
    const ListSchema = BackendListSchema(MedicationDispenseWithIdSchema)
    const result = await parseBackendResponse(res, ListSchema)

    console.log('MedicationDispense IPC list backend result length:', Array.isArray(result) ? result.length : null)

    return { success: true, data: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('MedicationDispense IPC list error:', msg)
    return { success: false, error: msg }
  }
}

export const createFromRequest = async (
  ctx: IpcContext,
  args: z.infer<typeof schemas.createFromRequest.args>
) => {
  try {
    const client = getClient(ctx)

    const requestRes = await client.get(`/api/medicationrequest/read/${args.medicationRequestId}`)
    const ReadSchema = z.object({
      success: z.boolean(),
      result: MedicationRequestWithIdSchema.optional(),
      error: z.string().optional()
    })
    const request = await parseBackendResponse(requestRes, ReadSchema)

    if (!request) {
      throw new Error('MedicationRequest tidak ditemukan.')
    }

    if (typeof request.medicationId !== 'number' || typeof request.patientId !== 'string') {
      throw new Error('MedicationRequest tidak memiliki medicationId atau patientId yang valid.')
    }

    const payload = {
      medicationId: request.medicationId,
      patientId: request.patientId,
      authorizingPrescriptionId: request.id,
      status: MedicationDispenseStatus.PREPARATION
    }

    const createRes = await client.post('/api/medicationdispense', payload)
    const CreateSchema = z.object({
      success: z.boolean(),
      result: MedicationDispenseWithIdSchema.optional(),
      error: z.string().optional()
    })
    const created = await parseBackendResponse(createRes, CreateSchema)

    return { success: true, data: created }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
