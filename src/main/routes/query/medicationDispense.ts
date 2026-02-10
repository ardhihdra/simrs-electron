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
      error: z.string().optional(),
      message: z.string().optional()
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
			 error: z.string().optional(),
			 message: z.string().optional()
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
      error: z.string().optional(),
      message: z.string().optional()
    })
    const request = await parseBackendResponse(requestRes, ReadSchema)

    if (!request) {
      throw new Error('MedicationRequest tidak ditemukan.')
    }

    const hasItemId = typeof request.itemId === 'number'
    const hasPatientId = typeof request.patientId === 'string'

    if (!hasPatientId) {
      throw new Error('MedicationRequest tidak memiliki patientId yang valid.')
    }

    // Check for compound (racikan)
    const supportingInfo = request.supportingInformation
    const isCompound =
      !hasItemId &&
      Array.isArray(supportingInfo) &&
      supportingInfo.length > 0

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

    if (isCompound) {
      const value = quantity?.value
      if (typeof value !== 'number' || value <= 0) {
        throw new Error('Qty Diambil harus lebih dari 0')
      }

      const payload = {
        medicationRequestId: request.id,
        quantity: {
          value: value,
          unit: quantity?.unit
        }
      }

      // Call the specialized endpoint for dispensing from request (handles stock deduction for compounds)
      const createRes = await client.post('/api/inventorystock/dispense-from-medication-request', payload)
      
      // The backend returns { success: true, result: { id, status } }
      // We need to map this to the expected return format or just return success
      const ResponseSchema = z.object({
        success: z.boolean(),
        result: z.object({
          id: z.number(),
          status: z.string()
        }).optional(),
        message: z.string().optional(),
        error: z.string().optional()
      })
      
      const response = await parseBackendResponse(createRes, ResponseSchema)
      
      // Since the backend creates a MedicationDispense internally, we might not get the full object back
          // But the UI expects success.
          return {
             success: true,
             data: {
                id: 0,
                status: MedicationDispenseStatus.COMPLETED,
                patientId: request.patientId
             } as any
          }
        }



    if (hasItemId) {
      const value = quantity?.value
      if (typeof value !== 'number' || value <= 0) {
        throw new Error('Qty Diambil harus lebih dari 0')
      }

      const unit = quantity?.unit

      const payload: {
        itemId: number
        patientId: string
        authorizingPrescriptionId: number
        status: MedicationDispenseStatus
        quantity: QuantityInfo
      } = {
        itemId: request.itemId as number,
        patientId: request.patientId,
        authorizingPrescriptionId: request.id,
        status: MedicationDispenseStatus.PREPARATION,
        quantity: {
          value,
          unit
        }
      }

      const createRes = await client.post('/api/medicationdispense', payload)
      const CreateSchema = z.object({
        success: z.boolean(),
        result: MedicationDispenseWithIdSchema.optional(),
        error: z.string().optional(),
        message: z.string().optional()
      })
      const created = await parseBackendResponse(createRes, CreateSchema)

      return { success: true, data: created }
    }

    throw new Error(
      'MedicationRequest ini tidak berisi obat atau item yang dapat diproses untuk dispense.'
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}
