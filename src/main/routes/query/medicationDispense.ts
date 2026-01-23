import z from 'zod'
import { MedicationDispenseWithIdSchema } from '@main/models/medicationDispense'
import { MedicationRequestWithIdSchema } from '@main/models/medicationRequest'
import { MedicationDispenseStatus } from '@main/models/enums/ResourceEnums'
import { IpcContext } from '@main/ipc/router'
import { parseBackendResponse, BackendListSchema, getClient } from '@main/utils/backendClient'

interface QuantityInfo {
	value?: number
	unit?: string
}

interface DispenseRequestInfo {
	quantity?: QuantityInfo
}

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
  update: {
    args: MedicationDispenseWithIdSchema.partial().extend({ id: z.number() }),
    result: z.object({
      success: z.boolean(),
      data: MedicationDispenseWithIdSchema.optional(),
      error: z.string().optional()
    })
  },
  createFromRequest: {
		args: z.object({
			medicationRequestId: z.number(),
			quantity: z
				.object({
					value: z.number().optional(),
					unit: z.string().optional()
				})
				.optional()
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

export const update = async (
  ctx: IpcContext,
  args: z.infer<typeof schemas.update.args>
) => {
  try {
    const client = getClient(ctx)
    const { id, ...data } = args
    const res = await client.put(`/api/medicationdispense/${id}`, data)
    const UpdateSchema = z.object({
      success: z.boolean(),
      result: MedicationDispenseWithIdSchema.optional(),
      error: z.string().optional()
    })
    const result = await parseBackendResponse(res, UpdateSchema)
    return { success: true, data: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
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

    const rawDispense = request.dispenseRequest

    let quantity: QuantityInfo | undefined

    if (args.quantity && typeof args.quantity.value === 'number') {
      quantity = {
        value: args.quantity.value,
        unit: args.quantity.unit
      }
    } else if (rawDispense && typeof rawDispense === 'object') {
      const maybe = rawDispense as DispenseRequestInfo
      const rawQuantity = maybe.quantity
      if (rawQuantity && typeof rawQuantity.value === 'number') {
        quantity = {
          value: rawQuantity.value,
          unit: typeof rawQuantity.unit === 'string' ? rawQuantity.unit : undefined
        }
      }
    }

    const payload: {
      medicationId: number
      patientId: string
      authorizingPrescriptionId: number
      status: MedicationDispenseStatus
      quantity?: QuantityInfo
    } = {
      medicationId: request.medicationId,
      patientId: request.patientId,
      authorizingPrescriptionId: request.id,
      status: MedicationDispenseStatus.PREPARATION
    }

    if (quantity) {
      payload.quantity = quantity
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
