import { IpcContext } from '@main/ipc/router'
import { getClient, parseBackendResponse } from '@main/utils/backendClient'
import z from 'zod'

export const requireSession = true

const CashierShiftSchema = z.object({
  id: z.number().optional(),
  pegawaiId: z.number(),
  startTime: z.union([z.string(), z.date()]),
  endTime: z.union([z.string(), z.date()]).nullable().optional(),
  status: z.enum(['OPEN', 'CLOSED']),
  initialCash: z.coerce.number(),
  finalCash: z.coerce.number().nullable().optional(),
  initialCashDetails: z.any(),
  finalCashDetails: z.any().nullable().optional(),
  expectedFinalCash: z.coerce.number().nullable().optional(),
  totalRevenue: z.coerce.number().optional(),
  totalCash: z.coerce.number().optional(),
  totalBank: z.coerce.number().optional(),
  totalInpatient: z.number().optional(),
  totalOutpatient: z.number().optional(),
  note: z.string().nullable().optional(),
})

export const schemas = {
  current: {
    result: z.object({
      success: z.literal(true),
      result: CashierShiftSchema.nullable().optional(),
      message: z.string().optional(),
    }).or(z.object({
      success: z.literal(false),
      error: z.string().optional(),
      message: z.string().optional()
    }))
  },
  open: {
    args: z.object({
      initialCash: z.number(),
      initialCashDetails: z.any(),
      note: z.string().optional()
    }),
    result: z.object({
      success: z.literal(true),
      result: CashierShiftSchema.optional(),
      message: z.string().optional()
    }).or(z.object({
      success: z.literal(false),
      error: z.string().optional(),
      message: z.string().optional()
    }))
  },
  close: {
    args: z.object({
      finalCash: z.number(),
      finalCashDetails: z.any(),
      note: z.string().optional()
    }),
    result: z.object({
      success: z.literal(true),
      result: CashierShiftSchema.optional(),
      message: z.string().optional()
    }).or(z.object({
      success: z.literal(false),
      error: z.string().optional(),
      message: z.string().optional()
    }))
  },
  summary: {
    result: z.object({
      success: z.literal(true),
      result: z.object({
        totalRevenue: z.coerce.number(),
        totalCash: z.coerce.number(),
        totalBank: z.coerce.number(),
        totalInpatient: z.number(),
        totalOutpatient: z.number(),
        expectedFinalCash: z.coerce.number(),
        startTime: z.string(),
        initialCash: z.coerce.number()
      }).optional(),
      message: z.string().optional()
    }).or(z.object({
      success: z.literal(false),
      error: z.string().optional(),
      message: z.string().optional()
    }))
  }
}

export const current = async (ctx: IpcContext) => {
  try {
    const client = getClient(ctx)
    const res = await client.get('/api/cashiershift/current')
    const result = await parseBackendResponse(res, schemas.current.result as any)
    return { success: true, result }
  } catch (err: any) {
    console.error('[CashierShift IPC] Error in current:', err)
    return { success: false, error: err.message }
  }
}

export const open = async (ctx: IpcContext, args: z.infer<typeof schemas.open.args>) => {
  try {
    const client = getClient(ctx)
    const res = await client.post('/api/cashiershift/open', args)
    const result = await parseBackendResponse(res, schemas.open.result as any)
    return { success: true, result }
  } catch (err: any) {
    console.error('[CashierShift IPC] Error in open:', err)
    return { success: false, error: err.message }
  }
}

export const close = async (ctx: IpcContext, args: z.infer<typeof schemas.close.args>) => {
  try {
    const client = getClient(ctx)
    const res = await client.post('/api/cashiershift/close', args)
    const result = await parseBackendResponse(res, schemas.close.result as any)
    return { success: true, result }
  } catch (err: any) {
    console.error('[CashierShift IPC] Error in close:', err)
    return { success: false, error: err.message }
  }
}

export const summary = async (ctx: IpcContext) => {
  try {
    const client = getClient(ctx)
    const res = await client.get('/api/cashiershift/summary')
    const result = await parseBackendResponse(res, schemas.summary.result as any)
    return { success: true, result }
  } catch (err: any) {
    console.error('[CashierShift IPC] Error in summary:', err)
    return { success: false, error: err.message }
  }
}

