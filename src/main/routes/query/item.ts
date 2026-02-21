import z from 'zod'
import { IpcContext } from '@main/ipc/router'
import { createBackendClient, parseBackendResponse, BackendListSchema } from '@main/utils/backendClient'
import { ItemSchema, ItemWithIdSchema } from '@main/models/item'

export const requireSession = true

export const schemas = {
  list: {
    result: z.object({ success: z.boolean(), result: ItemWithIdSchema.array().optional(), message: z.string().optional() })
  },
  read: {
    args: z.object({ id: z.number() }),
    result: z.object({ success: z.boolean(), result: ItemWithIdSchema.optional(), message: z.string().optional() })
  },
  create: {
    args: ItemSchema.partial(),
    result: z.object({ success: z.boolean(), result: ItemWithIdSchema.optional(), message: z.string().optional() })
  },
  update: {
    args: ItemSchema.extend({ id: z.number() }),
    result: z.object({ success: z.boolean(), result: ItemWithIdSchema.optional(), message: z.string().optional() })
  },
  deleteById: {
    args: z.object({ id: z.number() }),
    result: z.object({ success: z.boolean(), message: z.string().optional() })
  },
  searchKfa: {
    args: z.object({ query: z.string() }),
    result: z.object({ 
      success: z.boolean(), 
      result: z.array(z.object({
        kode: z.string(),
        nama: z.string(),
        kategori: z.string().optional()
      })).optional(),
      message: z.string().optional() 
    })
  }
} as const

const BackendDetailSchema: z.ZodSchema<{
	success: boolean
	result?: z.infer<typeof ItemWithIdSchema> | null
	message?: string
	error?: string
}> = z.object({
	success: z.boolean(),
	result: ItemWithIdSchema.nullable().optional(),
	message: z.string().optional(),
	error: z.any().optional()
})

export const list = async (ctx: IpcContext) => {
  const client = createBackendClient(ctx)
  const res = await client.get('/api/item?items=100&depth=1')
  const result = await parseBackendResponse(res, BackendListSchema(ItemWithIdSchema))
  return { success: true, result }
}

export const read = async (ctx: IpcContext, args: z.infer<typeof schemas.read.args>) => {
  const client = createBackendClient(ctx)
  const res = await client.get(`/api/item/read/${args.id}`)
  const result = await parseBackendResponse(res, BackendDetailSchema)
  return { success: true, result }
}

export const create = async (ctx: IpcContext, args: z.infer<typeof schemas.create.args>) => {
	try {
		const client = createBackendClient(ctx)
		const basePayload = {
			nama: args.nama,
			kode: args.kode,
			kodeUnit: args.kodeUnit,
			kfaCode: args.kfaCode ?? null,
			kind: args.kind ?? null,
			itemCategoryId: args.itemCategoryId ?? null,
			buyingPrice: typeof args.buyingPrice === 'number' ? args.buyingPrice : undefined,
			sellingPrice: typeof args.sellingPrice === 'number' ? args.sellingPrice : undefined,
			buyPriceRules: Array.isArray(args.buyPriceRules) ? args.buyPriceRules : undefined,
			sellPriceRules: Array.isArray(args.sellPriceRules) ? args.sellPriceRules : undefined
		}
		const payload =
			typeof args.minimumStock === 'number'
				? { ...basePayload, minimumStock: args.minimumStock }
				: basePayload
		console.log('[item.create] payload', payload)
		const res = await client.post('/api/item', payload)
		const result = await parseBackendResponse(res, BackendDetailSchema)
		console.log('[item.create] backend result', result)
		return { success: true, result }
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err)
		console.error('[item.create] error', msg)
		return { success: false, error: msg }
	}
}

export const update = async (ctx: IpcContext, args: z.infer<typeof schemas.update.args>) => {
	try {
		const client = createBackendClient(ctx)
		const basePayload = {
			nama: args.nama,
			kode: args.kode,
			kodeUnit: args.kodeUnit,
			...(typeof args.kfaCode === 'string' || args.kfaCode === null ? { kfaCode: args.kfaCode } : {}),
			kind: args.kind ?? null,
			...(typeof args.itemCategoryId === 'number' || args.itemCategoryId === null ? { itemCategoryId: args.itemCategoryId } : {}),
			buyingPrice: typeof args.buyingPrice === 'number' ? args.buyingPrice : undefined,
			sellingPrice: typeof args.sellingPrice === 'number' ? args.sellingPrice : undefined,
			buyPriceRules: Array.isArray(args.buyPriceRules) ? args.buyPriceRules : undefined,
			sellPriceRules: Array.isArray(args.sellPriceRules) ? args.sellPriceRules : undefined
		}
		const payload =
			typeof args.minimumStock === 'number'
				? { ...basePayload, minimumStock: args.minimumStock }
				: basePayload
		console.log('[item.update] payload', { id: args.id, ...payload })
		const res = await client.put(`/api/item/${args.id}`, payload)
		const result = await parseBackendResponse(res, BackendDetailSchema)
		console.log('[item.update] backend result', result)
		return { success: true, result }
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err)
		console.error('[item.update] error', msg)
		return { success: false, error: msg }
	}
}

export const deleteById = async (ctx: IpcContext, args: z.infer<typeof schemas.deleteById.args>) => {
	try {
		const client = createBackendClient(ctx)
		const res = await client.delete(`/api/item/${args.id}`)
		const DeleteSchema = z.object({ success: z.boolean(), message: z.string().optional(), error: z.string().optional() })
		await parseBackendResponse(res, DeleteSchema)
		return { success: true }
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err)
		return { success: false, error: msg }
	}
}

export const searchKfa = async (ctx: IpcContext, args: z.infer<typeof schemas.searchKfa.args>) => {
  try {
    const client = createBackendClient(ctx)
    // Mencoba memanggil backend proxy terlebih dahulu
    try {
      const res = await client.get(`/api/satusehat/kfa/search?q=${encodeURIComponent(args.query)}`)
      if (res.ok) {
        const KfaResponseSchema = z.object({
          success: z.boolean(),
          result: z.array(z.object({
            kode: z.string(),
            nama: z.string(),
            kategori: z.string().optional()
          })).optional()
        })
        const result = await parseBackendResponse(res, KfaResponseSchema)
        return { success: true, result }
      }
    } catch (e) {
      console.warn('[item.searchKfa] Backend proxy failed, falling back to public KFA search', e)
    }

    // Fallback: Panggil API publik KFA jika backend belum mengimplementasikannya
    const domainHost = 'kfa.kemkes.go.id'
    const publicUrl = `https://${domainHost}/api/v1/products/all?product_type=obat&name=${encodeURIComponent(args.query)}`
    let publicRes = await fetch(publicUrl, {
      headers: {
        Host: domainHost,
        Accept: 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }).catch((err) => {
      console.warn('[item.searchKfa] Public KFA fetch error (domain), will try IP fallback:', err)
      return null as unknown as Response
    })
 
    if (!publicRes || !publicRes.ok) {
      const fallbackIp = '103.73.77.171'
      const ipUrl = `https://${fallbackIp}/api/v1/products/all?product_type=obat&name=${encodeURIComponent(args.query)}`
      publicRes = await fetch(ipUrl, {
        headers: {
          Host: domainHost,
          Accept: 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      }).catch((err) => {
        console.error('[item.searchKfa] Public KFA fetch error (IP fallback):', err)
        return null as unknown as Response
      })
      if (!publicRes || !publicRes.ok) {
        throw new Error(`KFA API returned ${publicRes ? publicRes.status : 'unknown error'}`)
      }
    }

    const data = await publicRes.json()
    
    // Transformasi data dari API publik KFA ke format yang kita inginkan
    type KfaRaw = {
      kfa_code?: string
      code?: string
      identifier?: string
      item_name?: string
      name?: string
      display_name?: string
      display?: string
      product_type?: string
      farmalkes_type?: { name?: string }
    }
    const rawData = (data as { result?: { data?: KfaRaw[] } } | { data?: KfaRaw[] } | KfaRaw[])
    const rawArr: KfaRaw[] =
      (rawData as any)?.result?.data || (rawData as any)?.data || (rawData as any)?.result || []
    const source: KfaRaw[] = Array.isArray(rawArr) ? rawArr : [rawArr]
    const results = source
      .map((item) => ({
        kode: item.kfa_code || item.code || item.identifier || '',
        nama: item.item_name || item.name || item.display_name || item.display || '',
        kategori: item.product_type || item.farmalkes_type?.name || 'Obat'
      }))
      .filter((i) => i.kode.length > 0 && i.nama.length > 0)

    return { 
      success: true, 
      result: results 
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[item.searchKfa] error', msg)
    return { success: false, message: msg }
  }
}
