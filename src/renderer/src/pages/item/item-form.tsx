import { Button, Form, Input, Select, message, InputNumber } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, Fragment } from 'react'
import { useNavigate, useParams } from 'react-router'
import { queryClient } from '@renderer/query-client'

type ItemKind = 'DEVICE' | 'CONSUMABLE' | 'NUTRITION' | 'GENERAL'

const formatRupiah = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return ''
  const raw = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9-]/g, ''))
  if (!Number.isFinite(raw)) return ''
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(raw)
  return `Rp ${formatted}`
}

const parseRupiah = (value: string | undefined): number => {
  if (!value) return 0
  const cleaned = value.replace(/[^0-9-]/g, '')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

type PriceRuleFormValue = {
	unitCode: string
	qty: number
	price: number
}

type ItemFormValues = {
	  nama: string
	  kode: string
	  kodeUnit: string
	  kind?: ItemKind | null
	  minimumStock?: number | null
	  itemCategoryId?: number | null
	  buyingPrice?: number | null
	  sellingPrice?: number | null
	  buyPriceRules?: PriceRuleFormValue[] | null
	  sellPriceRules?: PriceRuleFormValue[] | null
	}

interface ItemCategoryAttributes {
	  id?: number
	  name: string
	  status?: boolean
}

type ItemApi = {
	  read: (args: { id: number }) => Promise<{ success: boolean; result?: ItemFormValues & { id?: number }; message?: string; error?: string }>
	  create: (data: ItemFormValues) => Promise<{ success: boolean; result?: ItemFormValues & { id?: number }; message?: string; error?: string }>
	  update: (data: ItemFormValues & { id: number }) => Promise<{ success: boolean; result?: ItemFormValues & { id?: number }; message?: string; error?: string }>
}

interface UnitListEntry {
  id?: number
  nama?: string
  kode?: string
}

type UnitListResponse = {
  success: boolean
  result?: UnitListEntry[]
  message?: string
}

type ItemCategoryListResponse = {
	  success: boolean
	  result?: ItemCategoryAttributes[]
	  message?: string
}

export function ItemForm() {
	  const navigate = useNavigate()
	  const { id } = useParams()
		  const [form] = Form.useForm<ItemFormValues>()
	  const isEdit = Boolean(id)

		  const api = window.api?.query?.item as ItemApi | undefined
	  const unitApi = (window.api?.query as { unit?: { list: () => Promise<UnitListResponse> } }).unit

		  const { data: detailData } = useQuery({
    queryKey: ['item', 'detail', id],
    queryFn: () => {
      const fn = api?.read
      if (!fn) throw new Error('API item tidak tersedia.')
      return fn({ id: Number(id) })
    },
    enabled: isEdit
  })

		  const { data: unitSource } = useQuery<UnitListResponse>({
    queryKey: ['unit', 'list', 'for-item-form'],
    queryFn: () => {
      const fn = unitApi?.list
      if (!fn) throw new Error('API unit tidak tersedia.')
      return fn()
    }
		  })

		  const itemCategoryApi = window.api?.query as {
			  medicineCategory?: { list: () => Promise<ItemCategoryListResponse> }
		  } | undefined

		  const { data: itemCategorySource } = useQuery<ItemCategoryListResponse>({
		    queryKey: ['itemCategory', 'list', 'for-item-form'],
		    queryFn: () => {
		      const fn = itemCategoryApi?.medicineCategory?.list
		      if (!fn) throw new Error('API kategori item tidak tersedia.')
		      return fn()
		    }
		  })

		  const unitOptions = useMemo(() => {
	    const entries: UnitListEntry[] = Array.isArray(unitSource?.result) ? unitSource.result : []
	    const map = new Map<string, string>()

	    for (const item of entries) {
	      const rawCode = typeof item.kode === 'string' && item.kode.length > 0 ? item.kode : ''
	      const code = rawCode.trim().toUpperCase()
	      if (!code) continue
	      if (map.has(code)) continue
	      const unitName = item.nama ?? code
	      map.set(code, `${code} - ${unitName}`)
	    }

	    const options = Array.from(map.entries()).map(([value, label]) => ({ value, label }))
		    return options
		  }, [unitSource?.result])

		const itemCategoryOptions = useMemo(() => {
		    const entries: ItemCategoryAttributes[] = Array.isArray(itemCategorySource?.result)
		      ? itemCategorySource.result
		      : []
		
		    const map = new Map<number, string>()
		    for (const cat of entries) {
		      const id = typeof cat.id === 'number' ? cat.id : undefined
		      const rawName = typeof cat.name === 'string' ? cat.name : ''
		      const name = rawName.trim()
		      if (id === undefined || !name) continue
		      if (!map.has(id)) {
		        map.set(id, name)
		      }
		    }
		
		    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
		  }, [itemCategorySource?.result])

	  useEffect(() => {
	    if (isEdit && detailData?.success && detailData.result) {
	      const d = detailData.result as ItemFormValues & { id?: number }
	      form.setFieldsValue({
	        nama: d.nama,
	        kode: d.kode,
	        kodeUnit:
	          typeof d.kodeUnit === 'string' && d.kodeUnit.length > 0
	            ? d.kodeUnit.trim().toUpperCase()
	            : d.kodeUnit,
	        kind: d.kind ?? null,
	        itemCategoryId: d.itemCategoryId ?? null,
	        minimumStock: typeof d.minimumStock === 'number' ? d.minimumStock : undefined,
	        buyingPrice: typeof d.buyingPrice === 'number' ? d.buyingPrice : undefined,
	        sellingPrice: typeof d.sellingPrice === 'number' ? d.sellingPrice : undefined,
	        buyPriceRules: Array.isArray(d.buyPriceRules) ? d.buyPriceRules : undefined,
	        sellPriceRules: Array.isArray(d.sellPriceRules) ? d.sellPriceRules : undefined
	      })
	    }
	  }, [isEdit, detailData, form])

	  const createMutation = useMutation({
    mutationKey: ['item', 'create'],
	    mutationFn: (data: ItemFormValues) => {
      const fn = api?.create
      if (!fn) throw new Error('API item tidak tersedia.')
      console.log('[ItemForm] create payload', data)
      return fn(data)
    },
    onSuccess: (result) => {
      console.log('[ItemForm] create success', result)
      if (!result?.success) {
        const msg = result?.message ?? result?.error ?? 'Gagal menyimpan data'
        message.error(msg)
        return
      }

      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['item', 'list'] })
      navigate('/dashboard/farmasi/items', { replace: true })
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[ItemForm] create error', msg)
      message.error(msg || 'Gagal menyimpan data')
    }
  })

	  const updateMutation = useMutation({
    mutationKey: ['item', 'update'],
	    mutationFn: (data: ItemFormValues & { id: number }) => {
      const fn = api?.update
      if (!fn) throw new Error('API item tidak tersedia.')
      console.log('[ItemForm] update payload', data)
      return fn(data)
    },
    onSuccess: (result) => {
      console.log('[ItemForm] update success', result)
      if (!result?.success) {
        const msg = result?.message ?? result?.error ?? 'Gagal mengupdate data'
        message.error(msg)
        return
      }

      form.resetFields()
      queryClient.invalidateQueries({ queryKey: ['item', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['item', 'detail', id] })
      navigate('/dashboard/farmasi/items', { replace: true })
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[ItemForm] update error', msg)
      message.error(msg || 'Gagal mengupdate data')
    }
  })

	  const normalizePriceRules = (
		  rules: PriceRuleFormValue[] | null | undefined
	  ): PriceRuleFormValue[] | null => {
		  if (!Array.isArray(rules)) return null
		  const cleaned = rules
			  .map((rule) => {
				  const unitCode = typeof rule.unitCode === 'string' ? rule.unitCode.trim().toUpperCase() : ''
				  const qty = Number(rule.qty)
				  const price = Number(rule.price)
				  return { unitCode, qty, price }
			  })
			  .filter((rule) => {
				  if (!rule.unitCode) return false
				  if (!Number.isFinite(rule.qty) || rule.qty <= 0) return false
				  if (!Number.isFinite(rule.price) || rule.price < 0) return false
				  return true
			  })
		  return cleaned.length > 0 ? cleaned : null
	  }

	  const onFinish = (values: ItemFormValues) => {
		  const normalizedBuyRules = normalizePriceRules(values.buyPriceRules)
		  const normalizedSellRules = normalizePriceRules(values.sellPriceRules)
		  const allRules = [...(normalizedBuyRules ?? []), ...(normalizedSellRules ?? [])]
		  const sortedByQty = allRules
			  .map((rule) => ({
				  unitCode: rule.unitCode,
				  qty: rule.qty
			  }))
			  .sort((a, b) => a.qty - b.qty)
		  const baseUnitFromRules = sortedByQty.length > 0 ? sortedByQty[0].unitCode : null
		  const baseUnitCode = baseUnitFromRules && baseUnitFromRules.length > 0
			  ? baseUnitFromRules
			  : values.kodeUnit
		  if (!baseUnitCode) {
			  message.error('Minimal isi satu baris harga dengan satuan dan isi/pcs yang valid')
			  return
		  }
	    const payload: ItemFormValues = {
	      ...values,
	      nama: values.nama.trim(),
	      kode: values.kode.trim().toUpperCase(),
	      kodeUnit: baseUnitCode.trim().toUpperCase(),
	      kind: values.kind ?? null,
		    itemCategoryId: typeof values.itemCategoryId === 'number' ? values.itemCategoryId : null,
		    buyingPrice: typeof values.buyingPrice === 'number' ? values.buyingPrice : null,
		    sellingPrice: typeof values.sellingPrice === 'number' ? values.sellingPrice : null,
		    buyPriceRules: normalizedBuyRules,
		    sellPriceRules: normalizedSellRules
	    }

    console.log('[ItemForm] submit', { isEdit, payload })

    if (isEdit) {
      updateMutation.mutate({ ...payload, id: Number(id) })
    } else {
      createMutation.mutate(payload)
    }
  }

  return (
    <div className="flex justify-center p-4">
      <div className="w-full max-w-xl bg-white dark:bg-[#141414] rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {isEdit ? 'Edit Item' : 'Item Baru'}
          </h2>
          <Button onClick={() => navigate('/dashboard/farmasi/items')}>Kembali</Button>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Nama Item"
            name="nama"
            rules={[{ required: true, message: 'Nama item harus diisi' }]}
          >
            <Input placeholder="Contoh: Infus Set" />
          </Form.Item>

          <Form.Item
	            label="Kode Item"
	            name="kode"
	            rules={[{ required: true, message: 'Kode item harus diisi' }]}
	          >
	            <Input placeholder="Kode unik item" />
	          </Form.Item>
	
		          <Form.Item name="kodeUnit" hidden>
		            <Input type="hidden" />
		          </Form.Item>
	
	          <Form.Item label="Kategori" name="itemCategoryId">
		        <Select
		          allowClear
		          showSearch
		          placeholder="Pilih kategori item"
		          options={itemCategoryOptions}
		          optionFilterProp="label"
		        />
		      </Form.Item>

	      <Form.Item label="Minimum Stok" name="minimumStock">
	        <InputNumber<number>
	          min={0}
	          className="w-full"
	          placeholder="Contoh: 10"
	        />
	      </Form.Item>

	      <Form.Item label="Daftar Harga Beli">
	        <Form.List name="buyPriceRules">
	          {(fields, { add, remove }) => (
	            <div className="space-y-2">
	              {fields.length > 0 && (
	                <div className="flex gap-2 text-xs font-semibold text-gray-600">
	                  <div className="flex-[2] min-w-[140px]">Harga Beli</div>
	                  <div className="flex-[2] min-w-[140px]">Satuan Beli</div>
	                  <div className="flex-1 min-w-[100px]">Isi/Pcs</div>
	                  <div className="w-[60px]" />
	                </div>
	              )}
	              {fields.map((field) => (
	                <Fragment key={field.key}>
	                  <div className="flex gap-2 flex-wrap">
	                    <Form.Item
	                      {...field}
	                      name={[field.name, 'price']}
	                      className="flex-[2] min-w-[140px]"
	                      rules={[{ required: true, message: 'Harga wajib diisi' }]}
	                    >
	                      <InputNumber<number>
	                        min={0}
	                        className="w-full"
	                        placeholder="Harga beli"
	                        formatter={(val) => formatRupiah(val ?? 0)}
	                        parser={(val) => parseRupiah(val)}
	                      />
	                    </Form.Item>
	                    <Form.Item
	                      {...field}
	                      name={[field.name, 'unitCode']}
	                      className="flex-[2] min-w-[140px]"
	                      rules={[{ required: true, message: 'Pilih kode satuan' }]}
	                    >
	                      <Select
	                        showSearch
	                        placeholder="Satuan beli"
	                        options={unitOptions}
	                        optionFilterProp="label"
	                      />
	                    </Form.Item>
	                    <Form.Item
	                      {...field}
	                      name={[field.name, 'qty']}
	                      className="flex-1 min-w-[100px]"
	                      rules={[{ required: true, message: 'Isi per satuan wajib diisi' }]}
	                    >
	                      <InputNumber<number> min={1} className="w-full" placeholder="Isi" />
	                    </Form.Item>
	                    <Button danger onClick={() => remove(field.name)}>
	                      Hapus
	                    </Button>
	                  </div>
	                  <Form.Item shouldUpdate noStyle>
	                    {() => {
	                      try {
	                        const buyRules = form.getFieldValue('buyPriceRules') as
	                          | PriceRuleFormValue[]
	                          | undefined
	                        const sellRules = form.getFieldValue('sellPriceRules') as
	                          | PriceRuleFormValue[]
	                          | undefined

	                        const allRules: { unitCode: string; qty: number }[] = []

	                        const collect = (source?: PriceRuleFormValue[]) => {
	                          if (!Array.isArray(source)) return
	                          for (const rule of source) {
	                            const unitCodeRaw =
	                              typeof rule.unitCode === 'string' ? rule.unitCode : ''
	                            const unitCode = unitCodeRaw.trim().toUpperCase()
	                            const qtyValue = Number(rule.qty)
	                            if (!unitCode) continue
	                            if (!Number.isFinite(qtyValue) || qtyValue <= 0) continue
	                            allRules.push({ unitCode, qty: qtyValue })
	                          }
	                        }

	                        collect(buyRules)
	                        collect(sellRules)

	                        const baseUnitCode =
	                          allRules.length > 0
	                            ? [...allRules].sort((a, b) => a.qty - b.qty)[0]?.unitCode
	                            : ''

	                        const rules = buyRules
	                        const current = Array.isArray(rules) ? rules[field.name] : undefined
	                        const rawPrice = current?.price
	                        const rawQty = current?.qty
	                        const price =
	                          typeof rawPrice === 'number' ? rawPrice : Number(rawPrice)
	                        const qty = typeof rawQty === 'number' ? rawQty : Number(rawQty)

	                        if (!Number.isFinite(price)) {
	                          return null
	                        }

	                        const displayUnitCode =
	                          typeof current?.unitCode === 'string' && current.unitCode.length > 0
	                            ? current.unitCode
	                            : 'PCS'

	                        const normalizedUnitCode = displayUnitCode.trim().toUpperCase()
	                        const isBaseUnitRow =
	                          baseUnitCode && normalizedUnitCode === baseUnitCode

	                        if (isBaseUnitRow) {
	                          return (
	                            <div className="w-full text-xs text-gray-500">
	                              Harga satuan: {formatRupiah(price)} / {displayUnitCode}
	                            </div>
	                          )
	                        }

	                        if (!Number.isFinite(qty) || qty <= 0) {
	                          return null
	                        }

	                        const unitPrice = price / qty
	                        if (!Number.isFinite(unitPrice)) {
	                          return null
	                        }

	                        return (
	                          <div className="w-full text-xs text-gray-500">
	                            Harga satuan: {formatRupiah(unitPrice)} / {displayUnitCode}
	                          </div>
	                        )
	                      } catch (error) {
	                        console.error('[ItemForm] gagal menghitung ringkasan harga beli', error)
	                        return null
	                      }
	                    }}
	                  </Form.Item>
	                </Fragment>
	              ))}
	              <Button type="dashed" onClick={() => add()} block>
	                Tambah Harga Beli
	              </Button>
	            </div>
	          )}
	        </Form.List>
	      </Form.Item>

	      <Form.Item label="Daftar Harga Jual">
	        <Form.List name="sellPriceRules">
	          {(fields, { add, remove }) => (
	            <div className="space-y-2">
	              {fields.length > 0 && (
	                <div className="flex gap-2 text-xs font-semibold text-gray-600">
	                  <div className="flex-[2] min-w-[140px]">Harga Jual</div>
	                  <div className="flex-[2] min-w-[140px]">Satuan Jual</div>
	                  <div className="flex-1 min-w-[100px]">Isi/Pcs</div>
	                  <div className="w-[60px]" />
	                </div>
	              )}
	              {fields.map((field) => (
	                <Fragment key={field.key}>
	                  <div className="flex gap-2 flex-wrap">
	                    <Form.Item
	                      {...field}
	                      name={[field.name, 'price']}
	                      className="flex-[2] min-w-[140px]"
	                      rules={[{ required: true, message: 'Harga wajib diisi' }]}
	                    >
	                      <InputNumber<number>
	                        min={0}
	                        className="w-full"
	                        placeholder="Harga jual"
	                        formatter={(val) => formatRupiah(val ?? 0)}
	                        parser={(val) => parseRupiah(val)}
	                      />
	                    </Form.Item>
	                    <Form.Item
	                      {...field}
	                      name={[field.name, 'unitCode']}
	                      className="flex-[2] min-w-[140px]"
	                      rules={[{ required: true, message: 'Pilih kode satuan' }]}
	                    >
	                      <Select
	                        showSearch
	                        placeholder="Satuan jual"
	                        options={unitOptions}
	                        optionFilterProp="label"
	                      />
	                    </Form.Item>
	                    <Form.Item
	                      {...field}
	                      name={[field.name, 'qty']}
	                      className="flex-1 min-w-[100px]"
	                      rules={[{ required: true, message: 'Isi per satuan wajib diisi' }]}
	                    >
	                      <InputNumber<number> min={1} className="w-full" placeholder="Isi" />
	                    </Form.Item>
	                    <Button danger onClick={() => remove(field.name)}>
	                      Hapus
	                    </Button>
	                  </div>
	                  <Form.Item shouldUpdate noStyle>
	                    {() => {
	                      try {
	                        const sellRules = form.getFieldValue('sellPriceRules') as
	                          | PriceRuleFormValue[]
	                          | undefined
	                        const buyRules = form.getFieldValue('buyPriceRules') as
	                          | PriceRuleFormValue[]
	                          | undefined

	                        const allRules: { unitCode: string; qty: number }[] = []

	                        const collect = (source?: PriceRuleFormValue[]) => {
	                          if (!Array.isArray(source)) return
	                          for (const rule of source) {
	                            const unitCodeRaw =
	                              typeof rule.unitCode === 'string' ? rule.unitCode : ''
	                            const unitCode = unitCodeRaw.trim().toUpperCase()
	                            const qtyValue = Number(rule.qty)
	                            if (!unitCode) continue
	                            if (!Number.isFinite(qtyValue) || qtyValue <= 0) continue
	                            allRules.push({ unitCode, qty: qtyValue })
	                          }
	                        }

	                        collect(sellRules)
	                        collect(buyRules)

	                        const baseUnitCode =
	                          allRules.length > 0
	                            ? [...allRules].sort((a, b) => a.qty - b.qty)[0]?.unitCode
	                            : ''

	                        const rules = sellRules
	                        const current = Array.isArray(rules) ? rules[field.name] : undefined
	                        const rawPrice = current?.price
	                        const rawQty = current?.qty
	                        const price =
	                          typeof rawPrice === 'number' ? rawPrice : Number(rawPrice)
	                        const qty = typeof rawQty === 'number' ? rawQty : Number(rawQty)

	                        if (!Number.isFinite(price)) {
	                          return null
	                        }

	                        const displayUnitCode =
	                          typeof current?.unitCode === 'string' && current.unitCode.length > 0
	                            ? current.unitCode
	                            : 'PCS'

	                        const normalizedUnitCode = displayUnitCode.trim().toUpperCase()
	                        const isBaseUnitRow =
	                          baseUnitCode && normalizedUnitCode === baseUnitCode

	                        if (isBaseUnitRow) {
	                          return (
	                            <div className="w-full text-xs text-gray-500">
	                              Harga satuan: {formatRupiah(price)} / {displayUnitCode}
	                            </div>
	                          )
	                        }

	                        if (!Number.isFinite(qty) || qty <= 0) {
	                          return null
	                        }

	                        const unitPrice = price / qty
	                        if (!Number.isFinite(unitPrice)) {
	                          return null
	                        }

	                        return (
	                          <div className="w-full text-xs text-gray-500">
	                            Harga satuan: {formatRupiah(unitPrice)} / {displayUnitCode}
	                          </div>
	                        )
	                      } catch (error) {
	                        console.error('[ItemForm] gagal menghitung ringkasan harga jual', error)
	                        return null
	                      }
	                    }}
	                  </Form.Item>
	                </Fragment>
	              ))}
	              <Button type="dashed" onClick={() => add()} block>
	                Tambah Harga Jual
	              </Button>
	            </div>
	          )}
	        </Form.List>
	      </Form.Item>

          <div className="flex gap-3 justify-end mt-6 border-t pt-4">
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending || updateMutation.isPending}
              className="px-6 bg-orange-600 hover:bg-orange-500 border-none"
            >
              Simpan
            </Button>
            <Button onClick={() => navigate('/dashboard/farmasi/items')} className="px-6">
              Batal
            </Button>
          </div>
        </Form>
      </div>
    </div>
  )
}

export default ItemForm
