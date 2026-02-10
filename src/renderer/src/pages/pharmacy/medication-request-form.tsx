import { Button, Form, Input, InputNumber, Select, DatePicker, Card, Tooltip, App as AntdApp } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { useEffect, useMemo, useState } from 'react'
import { queryClient } from '@renderer/query-client'
import dayjs from 'dayjs'

// Enums copied locally to avoid import issues with main process
enum MedicationRequestStatus {
  ACTIVE = 'active',
  ON_HOLD = 'on-hold',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  ENTERED_IN_ERROR = 'entered-in-error',
  STOPPED = 'stopped',
  DRAFT = 'draft',
  UNKNOWN = 'unknown'
}

enum MedicationRequestIntent {
  PROPOSAL = 'proposal',
  PLAN = 'plan',
  ORDER = 'order',
  ORIGINAL_ORDER = 'original-order',
  REFLEX_ORDER = 'reflex-order',
  FILLER_ORDER = 'filler-order',
  INSTANCE_ORDER = 'instance-order',
  OPTION = 'option'
}

enum MedicationRequestPriority {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  ASAP = 'asap',
  STAT = 'stat'
}

interface FormData {
  status: MedicationRequestStatus
  intent: MedicationRequestIntent
  priority?: MedicationRequestPriority
  patientId: string
  encounterId?: string | null
  requesterId?: number | null
  authoredOn?: any
  // Single mode (Edit)
  medicationId?: number | null
  dosageInstruction?: string | null
  note?: string | null
  // Bulk mode (Create)
  items?: Array<{
    medicationId: number
    dosageInstruction?: string
    note?: string
    quantity?: number
    quantityUnit?: string
  }>
  // Compounds mode (Racikan)
  compounds?: Array<{
    name: string
    dosageInstruction?: string
    quantity?: number
    quantityUnit?: string
    items: Array<{
      sourceType?: 'medicine' | 'substance'
      medicationId?: number
      itemId?: number
      rawMaterialId?: number
      note?: string
      quantity?: number
      unit?: string
    }>
  }>
  otherItems?: Array<{
	    itemCategoryId?: number | null
    itemId: number
    quantity?: number
    instruction?: string
    note?: string
  }>
}

interface GroupIdentifierInfo {
	system?: string
	value?: string
}

interface DispenseQuantityInfo {
	value?: number
	unit?: string
}

interface DispenseRequestInfo {
	quantity?: DispenseQuantityInfo
}

interface DosageInstructionInfo {
	text?: string
}

interface CategoryInfo {
	text?: string
	code?: string
}

interface SupportingInformationItemInfo {
  type?: string
  itemId?: number
  unitCode?: string
  quantity?: number
  instruction?: string
  resourceType?: string
  medicationId?: number
  note?: string
  name?: string
}

interface IdentifierInfo {
	system?: string
	value?: string
}

interface MedicationRequestRecordForEdit {
	id?: number
	status: MedicationRequestStatus
	intent: MedicationRequestIntent
	priority?: MedicationRequestPriority
	patientId: string
	encounterId?: string | null
	requesterId?: number | null
	authoredOn?: string | Date
	medicationId?: number | null
	itemId?: number | null
	groupIdentifier?: GroupIdentifierInfo | null
	category?: CategoryInfo[] | null
	identifier?: IdentifierInfo[] | null
	note?: string | null
	dosageInstruction?: DosageInstructionInfo[] | null
	dispenseRequest?: DispenseRequestInfo | null
	supportingInformation?: SupportingInformationItemInfo[] | null
}

export function MedicationRequestForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm<FormData>()
  const selectedPatientId = Form.useWatch('patientId', form)
  const isEdit = Boolean(id)
  const [session, setSession] = useState<any>(null)
  const [originalGroupRecords, setOriginalGroupRecords] = useState<MedicationRequestRecordForEdit[]>([])
  const { message } = AntdApp.useApp()

  const buildDispenseRequest = (quantity?: number, unit?: string) => {
    if (!quantity) return null
    return {
      quantity: {
        value: quantity,
        unit: unit || undefined
      }
    }
  }

  useEffect(() => {
    window.api.auth.getSession().then((res) => {
      if (res.success) setSession(res)
    })
  }, [])

  const { data: detailData } = useQuery({
    queryKey: ['medicationRequest', 'detail', id],
    queryFn: () => {
      const fn = window.api?.query?.medicationRequest?.getById
      if (!fn) throw new Error('API MedicationRequest tidak tersedia.')
      return fn({ id: Number(id) })
    },
    enabled: isEdit
  })

  // Fetch lists for dropdowns
  const { data: patientData, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', 'list'],
    queryFn: () => window.api?.query?.patient?.list({ limit: 100 })
  })

  const { data: medicineData, isLoading: medicineLoading } = useQuery({
    queryKey: ['medicine', 'list'],
    queryFn: () => window.api?.query?.medicine?.list({ limit: 100 })
  })

  interface MedicineAttributes {
    id?: number
    name: string
    stock?: number
    medicineCategoryId?: number
    category?: { name?: string | null; categoryType?: string | null } | null
  }

  interface RawMaterialAttributes {
    id?: number
    name: string
  }

  interface RawMaterialApi {
    list: () => Promise<{ success: boolean; result?: RawMaterialAttributes[]; message?: string }>
  }

  interface ItemAttributes {
    id?: number
    nama?: string
    kode?: string
	    kodeUnit?: string
	    unit?: {
      id?: number
      kode?: string
      nama?: string
    } | null
    itemCategoryId?: number | null
	    category?: {
		      id?: number
		      name?: string | null
		      categoryType?: string | null
		    } | null
  }

  type ItemListResponse = {
    success: boolean
    result?: ItemAttributes[]
    message?: string
  }

  const { data: rawMaterialData, isLoading: rawMaterialLoading } = useQuery({
    queryKey: ['rawMaterial', 'list'],
    queryFn: async () => {
      const api = (window.api?.query as { rawMaterial?: RawMaterialApi }).rawMaterial
      const fn = api?.list
      if (!fn) throw new Error('API bahan baku tidak tersedia.')
      return fn()
    }
  })

  const itemApi = (window.api?.query as { item?: { list: () => Promise<ItemListResponse> } }).item

  const { data: itemSource, isLoading: itemLoading } = useQuery<ItemListResponse>({
    queryKey: ['item', 'list', 'for-medication-request'],
    queryFn: () => {
      const fn = itemApi?.list
      if (!fn) throw new Error('API item tidak tersedia.')
      return fn()
    }
  })

  const { data: itemCategoryData } = useQuery({
    queryKey: ['itemCategory', 'list'],
    queryFn: () => {
      const fn = (window.api?.query as any)?.medicineCategory?.list
      if (!fn) return { success: false, result: [] }
      return fn()
    }
  })

  const itemCategoryMap = useMemo(() => {
    const categories = (itemCategoryData?.result || []) as any[]
    const map = new Map<number, string>()
    categories.forEach((c) => {
      if (typeof c.id === 'number' && typeof c.categoryType === 'string') {
        map.set(c.id, c.categoryType.toLowerCase())
      }
    })
    return map
  }, [itemCategoryData])

  const { data: encounterData, isLoading: encounterLoading } = useQuery({
    queryKey: ['encounter', 'list', selectedPatientId],
    queryFn: () => window.api?.query?.encounter?.list({ 
      limit: 100,
      patientId: selectedPatientId // Filter by patient if selected
    }),
    enabled: !!selectedPatientId || isEdit // Only fetch when patient is selected or in edit mode
  })
  
  const { data: requesterData } = useQuery({
    queryKey: ['kepegawaian', 'list'],
    queryFn: () => window.api?.query?.kepegawaian?.list()
  })

  const patientOptions = useMemo(() => 
    ((patientData?.data || []) as any[]).map((p) => ({ label: `${p.name} (${p.mrNo})`, value: p.id })), 
    [patientData]
  )

  const medicineOptions = useMemo(
    () => {
      const source: MedicineAttributes[] = Array.isArray(medicineData?.result)
        ? (medicineData!.result as MedicineAttributes[])
        : []

      return source
        .filter((m) => typeof m.id === 'number')
        .map((m) => {
          const stockValue = typeof m.stock === 'number' ? m.stock : undefined
          const categoryName =
            m.category && typeof m.category.name === 'string' ? m.category.name : undefined
          const categoryPrefix = categoryName ? `[${categoryName}] ` : ''
          let suffix = ''

          if (typeof stockValue === 'number') {
            if (stockValue === 0) {
              suffix = ' - Stok habis'
            } else {
              suffix = ` - Stok: ${stockValue}`
            }
          } else {
            suffix = ' - Stok: -'
          }

          let categoryType = ''
          if (typeof m.medicineCategoryId === 'number' && itemCategoryMap.has(m.medicineCategoryId)) {
             categoryType = itemCategoryMap.get(m.medicineCategoryId) || ''
          } else {
             const rawCategoryType =
              typeof m.category?.categoryType === 'string'
                ? m.category.categoryType
                : undefined
             categoryType = rawCategoryType ? rawCategoryType.trim().toLowerCase() : ''
          }

          return {
            label: `${categoryPrefix}${m.name}${suffix}`,
            value: m.id as number,
            categoryType
          }
        })
    },
    [medicineData, itemCategoryMap]
  )

  const rawMaterialOptions = useMemo(
    () => {
      const source = (rawMaterialData?.result ?? []) as RawMaterialAttributes[]
      return source
        .filter((rm) => typeof rm.id === 'number')
        .map((rm) => ({ label: rm.name, value: rm.id as number }))
    },
    [rawMaterialData]
  )

  const itemOptions = useMemo(
    () => {
      const source: ItemAttributes[] = Array.isArray(itemSource?.result)
        ? itemSource.result
        : []

      return source
        .filter((item) => typeof item.id === 'number')
        .map((item) => {
          const unitCodeRaw = typeof item.kodeUnit === 'string' ? item.kodeUnit : item.unit?.kode
          const unitCode = unitCodeRaw ? unitCodeRaw.trim().toUpperCase() : ''
          const unitName = item.unit?.nama ?? unitCode
          const code = typeof item.kode === 'string' ? item.kode.trim().toUpperCase() : ''
          const name = item.nama ?? code
          const displayName = name || code || String(item.id)
          const label = unitName ? `${displayName} (${unitName})` : displayName
          const categoryId =
            typeof item.itemCategoryId === 'number'
              ? item.itemCategoryId
              : typeof item.category?.id === 'number'
              ? item.category.id
              : null
          
          let categoryType = ''
          if (categoryId && itemCategoryMap.has(categoryId)) {
            categoryType = itemCategoryMap.get(categoryId) || ''
          } else {
             const rawCategoryType =
              typeof item.category?.categoryType === 'string'
                ? item.category.categoryType
                : undefined
             categoryType = rawCategoryType ? rawCategoryType.trim().toLowerCase() : ''
          }

          return {
            value: item.id as number,
            label,
            unitCode,
            categoryId,
            categoryType
          }
        })
        .filter((entry) => entry.unitCode.length > 0)
    },
    [itemSource?.result, itemCategoryMap]
  )

  const encounterOptions = useMemo(() => 
    ((encounterData?.data || []) as any[]).map((e) => ({ label: `${e.encounterCode || e.id} - ${e.patient?.name || 'Unknown'}`, value: e.id })), 
    [encounterData]
  )

  // Auto-fill Requester from Session (match NIK)
  useEffect(() => {
    if (session?.user?.username && requesterData?.result && !isEdit) {
      // session.user.username stores NIK based on main/routes/auth.ts logic
      const currentNik = session.user.username
      const employees = requesterData.result as { nik?: string; id: number }[]
      const foundEmployee = employees.find(e => e.nik === currentNik)
      
      if (foundEmployee) {
        form.setFieldValue('requesterId', foundEmployee.id)
      }
    }
  }, [session, requesterData, isEdit, form])

  // Auto-fill Encounter when Patient is selected
  useEffect(() => {
    if (selectedPatientId && encounterData?.result && !isEdit) {
      // Find active encounter (status: in-progress / active)
      // Assuming result is array of encounters. Adjust based on actual API response structure.
      const encounters = (encounterData.result || encounterData.data || []) as any[]
      const activeEncounter = encounters.find(e => e.status === 'in-progress' || e.status === 'active')
      
      if (activeEncounter) {
        form.setFieldValue('encounterId', activeEncounter.id)
      } else if (encounters.length > 0) {
        // Fallback to most recent?
        form.setFieldValue('encounterId', encounters[0].id)
      }
    }
  }, [selectedPatientId, encounterData, isEdit, form])

  useEffect(() => {
    if (isEdit && detailData?.success && detailData.data) {
			const base = detailData.data as MedicationRequestRecordForEdit

			const applyFormValues = (records: MedicationRequestRecordForEdit[]) => {
				setOriginalGroupRecords(records)
				if (records.length === 0) {
					return
				}

				const baseRecord = records.find((r) => r.id === base.id) ?? records[0]

				const allSimple = records.filter((r) => {
					const categories = r.category ?? []
					const isCompound = categories.some((c) => {
						const code = c.code?.toLowerCase()
						const text = c.text?.toLowerCase()
						return code === 'compound' || text === 'racikan'
					})
					const hasRacikanIdentifier =
						Array.isArray(r.identifier) &&
						r.identifier.some((idEntry) => idEntry.system === 'racikan-group')
					const hasItem = typeof r.itemId === 'number' && r.itemId > 0
					return !isCompound && !hasRacikanIdentifier && !hasItem && typeof r.medicationId === 'number'
				})

				const compoundRecords = records.filter((r) => {
					const categories = r.category ?? []
					return categories.some((c) => {
						const code = c.code?.toLowerCase()
						const text = c.text?.toLowerCase()
						return code === 'compound' || text === 'racikan'
					})
				})

				const itemRecords = records.filter((r) => typeof r.itemId === 'number' && r.itemId > 0)

				const items: NonNullable<FormData['items']> = allSimple.map((r) => ({
					medicationId: r.medicationId ?? 0,
					dosageInstruction:
						r.dosageInstruction && r.dosageInstruction[0]
							? r.dosageInstruction[0].text ?? ''
							: '',
					note: r.note ?? '',
					quantity: r.dispenseRequest?.quantity?.value,
					quantityUnit: r.dispenseRequest?.quantity?.unit
				}))

				const compoundsForm: NonNullable<FormData['compounds']> = []

				compoundRecords.forEach((r) => {
					const titleMatch = r.note?.match(/^\[Racikan:([^\]]+)\]/)
					const name = titleMatch && titleMatch[1] ? titleMatch[1].trim() : 'Racikan'
					const dosageText = r.dosageInstruction && r.dosageInstruction[0]
						? r.dosageInstruction[0].text ?? ''
						: ''

					let itemsForCompound: {
						sourceType: 'medicine' | 'substance'
						medicationId?: number
						itemId?: number
						rawMaterialId?: number
						note?: string
					}[] = []

					if (Array.isArray(r.supportingInformation) && r.supportingInformation.length > 0) {
						const ingredients = r.supportingInformation.filter((info) => {
							const anyInfo = info as any
							const type = info.resourceType || anyInfo.resource_type
							const hasItem = info.itemId || anyInfo.item_id
							const hasMedication = info.medicationId || anyInfo.medication_id
							return type === 'Ingredient' || hasItem || hasMedication
						})
						if (ingredients.length > 0) {
							itemsForCompound = ingredients.map((info) => {
								const anyInfo = info as any
								return {
									sourceType: 'medicine',
									medicationId: info.medicationId ? Number(info.medicationId) : (anyInfo.medication_id ? Number(anyInfo.medication_id) : undefined),
									itemId: info.itemId ? Number(info.itemId) : (anyInfo.item_id ? Number(anyInfo.item_id) : undefined),
									note: info.note || anyInfo.note || info.instruction || anyInfo.instruction || '',
                  quantity: typeof info.quantity === 'number' ? info.quantity : (typeof anyInfo.quantity === 'number' ? anyInfo.quantity : undefined),
                  unit: info.unitCode || anyInfo.unitCode || undefined
								}
							})
						}
					}

					if (itemsForCompound.length === 0) {
						itemsForCompound = records
							.filter((candidate) => {
								if (candidate.id === r.id) return true
								if (!Array.isArray(candidate.identifier)) return false
								if (!Array.isArray(r.identifier)) return false
								const groupA = r.identifier.find((idEntry) => idEntry.system === 'racikan-group')
								const groupB = candidate.identifier.find(
									(idEntry) => idEntry.system === 'racikan-group'
								)
								return Boolean(groupA && groupB && groupA.value === groupB.value)
							})
							.map((itemRecord) => ({
								sourceType: 'medicine' as const,
								medicationId: itemRecord.medicationId ?? undefined,
								itemId: itemRecord.itemId ?? undefined,
								note: itemRecord.id === r.id ? undefined : itemRecord.note ?? undefined
							}))
					}

					compoundsForm.push({
						name,
						dosageInstruction: dosageText,
						quantity: r.dispenseRequest?.quantity?.value,
						quantityUnit: r.dispenseRequest?.quantity?.unit,
						items: itemsForCompound
					})
				})

				const otherItemsForm: NonNullable<FormData['otherItems']> = itemRecords.map((r) => {
					const info = (r.supportingInformation ?? [])[0]
					const rawItemId = r.itemId
					const itemId = typeof rawItemId === 'number' ? rawItemId : 0
					let itemCategoryId: number | null = null
					if (itemId > 0) {
						const matchedOption = itemOptions.find((option) => option.value === itemId)
						if (matchedOption && typeof matchedOption.categoryId === 'number') {
							itemCategoryId = matchedOption.categoryId
						}
					}
					return {
						itemCategoryId,
						itemId,
						quantity: info?.quantity ?? r.dispenseRequest?.quantity?.value,
						instruction: info?.instruction ?? r.note ?? ''
					}
				})

				const shouldUseFallbackSimpleItem =
					items.length === 0 &&
					compoundRecords.length === 0 &&
					itemRecords.length === 0 &&
					typeof baseRecord.medicationId === 'number'

				form.setFieldsValue({
					status: baseRecord.status,
					intent: baseRecord.intent,
					priority: baseRecord.priority,
					patientId: baseRecord.patientId,
					encounterId: baseRecord.encounterId ?? null,
					requesterId: baseRecord.requesterId ?? null,
					authoredOn: baseRecord.authoredOn ? dayjs(baseRecord.authoredOn) : undefined,
					items: shouldUseFallbackSimpleItem
						? [
								{
									medicationId: baseRecord.medicationId ?? 0,
									dosageInstruction:
										baseRecord.dosageInstruction && baseRecord.dosageInstruction[0]
											? baseRecord.dosageInstruction[0].text ?? ''
											: '',
									note: baseRecord.note ?? '',
									quantity: baseRecord.dispenseRequest?.quantity?.value,
									quantityUnit: baseRecord.dispenseRequest?.quantity?.unit
								}
						  ]
						: items,
					compounds: compoundsForm,
					otherItems: otherItemsForm
				})
			}

			const groupValue = base.groupIdentifier?.value

			if (!groupValue) {
				applyFormValues([base])
				return
			}

			const loadGroup = async () => {
				const api = window.api?.query?.medicationRequest
				const fn = api?.list
				if (!fn) {
					applyFormValues([base])
					return
				}
				const res = await fn({ patientId: base.patientId, limit: 1000 })
				const list = Array.isArray(res.data) ? res.data : []
				const sameGroup = list.filter((r) => r.groupIdentifier?.value === groupValue)
				if (sameGroup.length === 0) {
					applyFormValues([base])
					return
				}
				applyFormValues(sameGroup as MedicationRequestRecordForEdit[])
			}

			loadGroup()
    } else if (!isEdit) {
      form.setFieldsValue({
        status: MedicationRequestStatus.ACTIVE,
        intent: MedicationRequestIntent.ORDER,
        priority: MedicationRequestPriority.ROUTINE,
        authoredOn: dayjs(),
				items: []
      })
    }
  }, [isEdit, detailData, form])

  const createMutation = useMutation({
    mutationKey: ['medicationRequest', 'create'],
    mutationFn: (data: any) => {
      const fn = window.api?.query?.medicationRequest?.create
      if (!fn) throw new Error('API MedicationRequest tidak tersedia.')
      return fn(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicationRequest', 'list'] })
      navigate('/dashboard/medicine/medication-requests')
    }
  })

  const updateMutation = useMutation({
    mutationKey: ['medicationRequest', 'update'],
    mutationFn: (data: any) => {
      const fn = window.api?.query?.medicationRequest?.update
      if (!fn) throw new Error('API MedicationRequest tidak tersedia.')
      return fn(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicationRequest', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['medicationRequest', 'detail', id] })
    }
  })

  const onFinish = async (values: FormData) => {
    const baseCommonPayload = {
      status: values.status,
      intent: values.intent,
      priority: values.priority,
      patientId: values.patientId,
      encounterId: values.encounterId,
      requesterId: values.requesterId,
      authoredOn: values.authoredOn ? values.authoredOn.format('YYYY-MM-DD HH:mm:ss') : null
    }

    if (isEdit) {
      const items = values.items ?? []
      const compounds = values.compounds ?? []
      const otherItems = values.otherItems ?? []

			const invalidCompoundIndex = compounds.findIndex((compound) => {
				const compoundItems = compound.items ?? []
				return !Array.isArray(compoundItems) || compoundItems.length === 0
			})

			if (invalidCompoundIndex >= 0) {
				const nomor = invalidCompoundIndex + 1
				message.error(`Komposisi untuk Racikan ${nomor} wajib diisi minimal 1 item.`)
				return
			}

				type DetailWithGroup = FormData & {
					id: number
					groupIdentifier?: {
						system?: string
						value?: string
					} | null
				}

				const detail = (detailData?.data as DetailWithGroup | undefined) || undefined
				const baseId = Number(id)
				const sourceRecords =
					Array.isArray(originalGroupRecords) && originalGroupRecords.length > 0
						? originalGroupRecords
						: detail
							? [(detail as unknown) as MedicationRequestRecordForEdit]
							: []

				const simpleRecords = sourceRecords.filter((record) => {
					const categories = record.category ?? []
					const isCompound = categories.some((entry) => {
						const code = entry.code?.toLowerCase()
						const text = entry.text?.toLowerCase()
						return code === 'compound' || text === 'racikan'
					})
					return !isCompound && typeof record.medicationId === 'number'
				})

				const compoundRecords = sourceRecords.filter((record) => {
					const categories = record.category ?? []
					return categories.some((entry) => {
						const code = entry.code?.toLowerCase()
						const text = entry.text?.toLowerCase()
						return code === 'compound' || text === 'racikan'
					})
				})

				const itemRecords = sourceRecords.filter(
					(record) => typeof record.itemId === 'number' && record.itemId > 0
				)

				const existingGroupIdentifier =
					detail?.groupIdentifier ??
					(simpleRecords.find((record) => record.groupIdentifier)?.groupIdentifier ??
						compoundRecords.find((record) => record.groupIdentifier)?.groupIdentifier ??
							itemRecords.find((record) => record.groupIdentifier)?.groupIdentifier ?? null)

				const hasNewSimple = items.length > simpleRecords.length
				const hasNewCompound = compounds.length > compoundRecords.length
				const hasNewItems = (values.otherItems ?? []).length > itemRecords.length

				const groupIdentifierForEdit: GroupIdentifierInfo | null =
					existingGroupIdentifier ??
					(hasNewSimple || hasNewCompound || hasNewItems
						? {
								 system: 'http://sys-ids/prescription-group',
								 value: `${Date.now()}`
							 }
						: null)

				interface UpdatePayload {
					status: MedicationRequestStatus
					intent: MedicationRequestIntent
					priority?: MedicationRequestPriority
					patientId: string
					encounterId?: string | null
					requesterId?: number | null
					authoredOn: string | null
					medicationId?: number | null
					itemId?: number | null
					note?: string | null
					groupIdentifier?: {
						system?: string
						value?: string
					} | null
					dosageInstruction?: { text?: string }[] | null
					dispenseRequest?: {
						quantity?: {
							value?: number
							unit?: string
						}
					} | null
					category?: CategoryInfo[] | null
					identifier?: IdentifierInfo[] | null
					supportingInformation?: SupportingInformationItemInfo[] | null
				}

				const updates: { id: number; payload: UpdatePayload }[] = []
				const deleteIds: number[] = []

				const simpleCount = Math.min(simpleRecords.length, items.length)
				for (let indexSimple = 0; indexSimple < simpleCount; indexSimple += 1) {
					const record = simpleRecords[indexSimple]
					if (typeof record.id !== 'number') {
						continue
					}
					const item = items[indexSimple]
					const groupIdentifier =
						groupIdentifierForEdit ?? record.groupIdentifier ?? detail?.groupIdentifier ?? null
					updates.push({
						id: record.id,
						payload: {
							...baseCommonPayload,
							medicationId: item.medicationId,
							itemId: null,
							note: item.note ?? null,
							groupIdentifier,
							dosageInstruction: item.dosageInstruction
								? [{ text: item.dosageInstruction }]
								: null,
							dispenseRequest: buildDispenseRequest(
								item.quantity,
								item.quantityUnit
							),
							category: record.category ?? null,
							identifier: record.identifier ?? null,
							supportingInformation: record.supportingInformation ?? null
						}
					})
				}

				interface CompoundInputItem {
					name: string
					dosageInstruction?: string
					quantity?: number
					quantityUnit?: string
					medicationId?: number | null
					itemId?: number | null
					note?: string
					supportingInformation?: SupportingInformationItemInfo[]
				}

				const medicineList = (medicineData?.result || []) as MedicineAttributes[]
				const itemList = (itemSource?.result || []) as ItemAttributes[]

				const compoundInputs: CompoundInputItem[] = compounds.map((compound) => {
					const compoundItems = compound.items ?? []
					const ingredients = compoundItems
						.filter((item) => typeof item.medicationId === 'number' || typeof item.itemId === 'number')
						.map((item) => {
							let name = ''
							if (typeof item.medicationId === 'number') {
								const found = medicineList.find((m) => m.id === item.medicationId)
								if (found) name = found.name
							} else if (typeof item.itemId === 'number') {
								const found = itemList.find((i) => i.id === item.itemId)
								if (found) name = found.nama || ''
							}

							const ingredient = {
								resourceType: 'Ingredient',
								medicationId: (item.medicationId as number) || null,
								itemId: (item.itemId as number) || null,
								note: item.note || '',
								instruction: item.note || '',
								name
							}
							return ingredient
						})

					return {
						name: compound.name,
						dosageInstruction: compound.dosageInstruction,
						quantity: compound.quantity,
						quantityUnit: compound.quantityUnit,
						medicationId: null,
						itemId: null,
						note: undefined,
						supportingInformation: ingredients
					}
				})

				const compoundCount = Math.min(
					compoundRecords.length,
					compoundInputs.length
				)
				for (let indexCompound = 0; indexCompound < compoundCount; indexCompound += 1) {
					const record = compoundRecords[indexCompound]
					if (typeof record.id !== 'number') {
						continue
					}
					const input = compoundInputs[indexCompound]
					const groupIdentifier =
						groupIdentifierForEdit ?? record.groupIdentifier ?? detail?.groupIdentifier ?? null
					const compoundNotePrefix = input.name ? `[Racikan: ${input.name}]` : '[Racikan]'
					const fullNote = input.note
						? `${compoundNotePrefix} ${input.note}`
						: compoundNotePrefix
					updates.push({
						id: record.id,
						payload: {
							...baseCommonPayload,
							medicationId: null,
							itemId: null,
							note: fullNote,
							groupIdentifier,
							dosageInstruction: input.dosageInstruction
								? [{ text: input.dosageInstruction }]
								: null,
							dispenseRequest: buildDispenseRequest(
								input.quantity,
								input.quantityUnit
							),
							category:
								record.category && record.category.length > 0
									? record.category
									: [{ text: 'racikan', code: 'compound' }],
							identifier: record.identifier ?? null,
							supportingInformation: input.supportingInformation ?? null
						}
					})
				}

				const otherItemInputs = otherItems.filter(
					(entry) => typeof entry.itemId === 'number' && entry.itemId > 0
				)
				const itemCount = Math.min(itemRecords.length, otherItemInputs.length)
				for (let indexItem = 0; indexItem < itemCount; indexItem += 1) {
					const record = itemRecords[indexItem]
					if (typeof record.id !== 'number') {
						continue
					}
					const input = otherItemInputs[indexItem]
					const groupIdentifier =
						groupIdentifierForEdit ?? record.groupIdentifier ?? detail?.groupIdentifier ?? null
					const existingDispense = record.dispenseRequest ?? null
					const selectedOption = itemOptions.find(
						(option) => option.value === input.itemId
					)
					const unitCodeFromOption =
						selectedOption && typeof selectedOption.unitCode === 'string'
							? selectedOption.unitCode
							: undefined
					const newDispense =
						typeof input.quantity === 'number' && unitCodeFromOption
							? buildDispenseRequest(input.quantity, unitCodeFromOption)
							: existingDispense
					updates.push({
						id: record.id,
						payload: {
							...baseCommonPayload,
							medicationId: null,
							itemId: input.itemId,
							note: input.instruction ?? record.note ?? null,
							groupIdentifier,
							dosageInstruction: record.dosageInstruction ?? null,
							dispenseRequest: newDispense,
							category: record.category ?? null,
							identifier: record.identifier ?? null,
							supportingInformation: record.supportingInformation ?? null
						}
					})
				}

				const simpleRemainingStart = simpleCount
				for (
					let indexSimpleRemain = simpleRemainingStart;
					indexSimpleRemain < simpleRecords.length;
					indexSimpleRemain += 1
				) {
					const record = simpleRecords[indexSimpleRemain]
					if (typeof record.id === 'number') {
						deleteIds.push(record.id)
					}
				}

				const compoundRemainingStart = compoundCount
				for (
					let indexCompoundRemain = compoundRemainingStart;
					indexCompoundRemain < compoundRecords.length;
					indexCompoundRemain += 1
				) {
					const record = compoundRecords[indexCompoundRemain]
					if (typeof record.id === 'number') {
						deleteIds.push(record.id)
					}
				}

				const itemRemainingStart = itemCount
				for (
					let indexItemRemain = itemRemainingStart;
					indexItemRemain < itemRecords.length;
					indexItemRemain += 1
				) {
					const record = itemRecords[indexItemRemain]
					if (typeof record.id === 'number') {
						deleteIds.push(record.id)
					}
				}

				const api = window.api?.query as {
					medicationRequest?: {
						deleteById?: (args: { id: number }) => Promise<{ success: boolean }>
						create?: (args: unknown) => Promise<{
							success: boolean
							data?: unknown
						}>
					}
				}
				const deleteFn = api?.medicationRequest?.deleteById
				const createFn = api?.medicationRequest?.create

				const extraSimplePayloads: UpdatePayload[] = []
				if (items.length > simpleRecords.length) {
					const groupIdentifier = groupIdentifierForEdit
					for (
						let indexSimpleNew = simpleRecords.length;
						indexSimpleNew < items.length;
						indexSimpleNew += 1
					) {
						const item = items[indexSimpleNew]
						extraSimplePayloads.push({
							...baseCommonPayload,
							medicationId: item.medicationId,
							itemId: null,
							note: item.note ?? null,
							groupIdentifier,
							dosageInstruction: item.dosageInstruction
								? [{ text: item.dosageInstruction }]
								: null,
							dispenseRequest: buildDispenseRequest(
								item.quantity,
								item.quantityUnit
							),
							category: null,
							identifier: null,
							supportingInformation: null
						})
					}
				}

				const extraCompoundPayloads: UpdatePayload[] = []
				if (compoundInputs.length > compoundRecords.length) {
					const groupIdentifier = groupIdentifierForEdit
					for (
						let indexCompoundNew = compoundRecords.length;
						indexCompoundNew < compoundInputs.length;
						indexCompoundNew += 1
					) {
						const input = compoundInputs[indexCompoundNew]
						const compoundNotePrefix = input.name ? `[Racikan: ${input.name}]` : '[Racikan]'
						const fullNote = input.note
							? `${compoundNotePrefix} ${input.note}`
							: compoundNotePrefix
						extraCompoundPayloads.push({
							...baseCommonPayload,
							medicationId: null,
							itemId: null,
							note: fullNote,
							groupIdentifier,
							dosageInstruction: input.dosageInstruction
								? [{ text: input.dosageInstruction }]
								: null,
							dispenseRequest: buildDispenseRequest(
								input.quantity,
								input.quantityUnit
							),
							category: [{ text: 'racikan', code: 'compound' }],
							identifier: null,
							supportingInformation: input.supportingInformation ?? null
						})
					}
				}

				const itemUnitCodeMapForEdit = new Map<number, string>()
				for (const entry of itemOptions) {
					if (typeof entry.value === 'number' && entry.unitCode) {
						itemUnitCodeMapForEdit.set(entry.value, entry.unitCode)
					}
				}

				const extraItemPayloads: UpdatePayload[] = []
				if (otherItemInputs.length > itemRecords.length) {
					const groupIdentifier = groupIdentifierForEdit
					for (
						let indexItemNew = itemRecords.length;
						indexItemNew < otherItemInputs.length;
						indexItemNew += 1
					) {
						const input = otherItemInputs[indexItemNew]
						const instructionText =
							typeof input.instruction === 'string' ? input.instruction.trim() : ''
						const noteText = typeof input.note === 'string' ? input.note.trim() : ''
						const combinedNote = [instructionText, noteText]
							.filter((x) => x.length > 0)
							.join(' | ')

						const unitCode = itemUnitCodeMapForEdit.get(input.itemId)

						extraItemPayloads.push({
							...baseCommonPayload,
							medicationId: null,
							itemId: input.itemId,
							note: combinedNote.length > 0 ? combinedNote : null,
							groupIdentifier,
							dosageInstruction: null,
							dispenseRequest:
								typeof input.quantity === 'number' && unitCode
									? buildDispenseRequest(input.quantity, unitCode)
									: null,
							category: null,
							identifier: null,
							supportingInformation: null
						})
					}
				}

				if (updates.length === 0 && typeof baseId === 'number' && !Number.isNaN(baseId)) {
					const firstItem = items.length > 0 ? items[0] : undefined
					await updateMutation.mutateAsync({
						...baseCommonPayload,
						medicationId: firstItem?.medicationId,
						note: firstItem?.note ?? null,
						dosageInstruction: firstItem?.dosageInstruction
							? [{ text: firstItem.dosageInstruction }]
							: null,
						dispenseRequest: buildDispenseRequest(
							firstItem?.quantity,
							firstItem?.quantityUnit
						),
						id: baseId
					})
				} else {
					for (const entry of updates) {
						await updateMutation.mutateAsync({ ...entry.payload, id: entry.id })
					}
				}

				if (createFn) {
					const allCreatePayloads = [
						...extraSimplePayloads,
						...extraCompoundPayloads,
						...extraItemPayloads
					]
					if (allCreatePayloads.length > 0) {
						await createFn(allCreatePayloads)
					}
				}

				if (deleteFn && deleteIds.length > 0) {
					for (const deleteId of deleteIds) {
						await deleteFn({ id: deleteId })
					}
				}

    			queryClient.invalidateQueries({ queryKey: ['medicationRequest', 'list'] })
    			queryClient.invalidateQueries({ queryKey: ['medicationRequest', 'detail', id] })
    			navigate('/dashboard/medicine/medication-requests')
    } else {
      const items = values.items || []
      const compounds = values.compounds || []
      const otherItems = values.otherItems || []

			const invalidCompoundIndex = compounds.findIndex((compound) => {
				const compoundItems = compound.items ?? []
				return !Array.isArray(compoundItems) || compoundItems.length === 0
			})

			if (invalidCompoundIndex >= 0) {
				const nomor = invalidCompoundIndex + 1
				message.error(`Komposisi untuk Racikan ${nomor} wajib diisi minimal 1 item.`)
				return
			}
      const groupIdentifier = {
        system: 'http://sys-ids/prescription-group',
        value: `${Date.now()}`
      }

      const simplePayloads = items.map((item) => ({
        ...baseCommonPayload,
        groupIdentifier,
        medicationId: item.medicationId,
        dosageInstruction: item.dosageInstruction ? [{ text: item.dosageInstruction }] : null,
        note: item.note,
        dispenseRequest: buildDispenseRequest(item.quantity, item.quantityUnit)
      }))

      const medicineList = (medicineData?.result || []) as MedicineAttributes[]
      const itemList = (itemSource?.result || []) as ItemAttributes[]

      const compoundPayloads = compounds.map((comp, idx) => {
        const compoundId = `${Date.now()}-comp-${idx}`
        const compoundItems = comp.items || []

        const ingredients = compoundItems
          .filter((item) => typeof item.medicationId === 'number' || typeof item.itemId === 'number')
          .map((item) => {
            let name = ''
            if (typeof item.medicationId === 'number') {
              const found = medicineList.find((m) => m.id === item.medicationId)
              if (found) name = found.name
            } else if (typeof item.itemId === 'number') {
              const found = itemList.find((i) => i.id === item.itemId)
              if (found) name = found.nama || ''
            }

            return {
              resourceType: 'Ingredient',
              medicationId: (item.medicationId as number) || null,
              itemId: (item.itemId as number) || null,
              note: item.note || '',
              instruction: item.note || '',
              quantity: typeof item.quantity === 'number' ? item.quantity : 0,
              unitCode: item.unit || null,
              name
            }
          })

        return {
          ...baseCommonPayload,
          groupIdentifier,
          medicationId: null,
          itemId: null,
          dosageInstruction: comp.dosageInstruction ? [{ text: comp.dosageInstruction }] : null,
          identifier: [{ system: 'racikan-group', value: compoundId }],
          note: `[Racikan: ${comp.name}]`,
          category: [{ text: 'racikan', code: 'compound' }],
          dispenseRequest: buildDispenseRequest(comp.quantity, comp.quantityUnit),
          supportingInformation: ingredients
        }
      })

      const itemUnitCodeMap = new Map<number, string>()
      for (const entry of itemOptions) {
        if (typeof entry.value === 'number' && entry.unitCode) {
          itemUnitCodeMap.set(entry.value, entry.unitCode)
        }
      }

      const itemPayloads = otherItems
        .filter((it) => typeof it.itemId === 'number' && it.itemId > 0)
        .map((it) => {
          const instructionText = typeof it.instruction === 'string' ? it.instruction.trim() : ''
          const noteText = typeof it.note === 'string' ? it.note.trim() : ''
          const combinedNote = [instructionText, noteText].filter((x) => x.length > 0).join(' | ')

          const unitCode = itemUnitCodeMap.get(it.itemId)

          return {
            ...baseCommonPayload,
            groupIdentifier,
            itemId: it.itemId,
            medicationId: null,
            note: combinedNote.length > 0 ? combinedNote : null,
            dispenseRequest:
              typeof it.quantity === 'number' && unitCode
                ? buildDispenseRequest(it.quantity, unitCode)
                : null
          }
        })

			const payload = [...simplePayloads, ...compoundPayloads, ...itemPayloads]

			if (payload.length === 0) {
				message.error('Minimal isi minimal 1 Item.')
				return
			}

			createMutation.mutate(payload)
    }
  }

  return (
    <div className="flex justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold text-gray-800">{isEdit ? 'Ubah Permintaan Obat' : 'Permintaan Obat Baru'}</h2>
          <Button onClick={() => navigate('/dashboard/medicine/medication-requests')}>Kembali</Button>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-6">
            {/* Header Fields (Patient & Context) */}
            <div className="space-y-2">
              <Form.Item label="Pasien" name="patientId" rules={[{ required: true, message: 'Pasien wajib diisi' }]}>
                <Select 
                  options={patientOptions} 
                  placeholder="Pilih Pasien" 
                  showSearch 
                  optionFilterProp="label" 
                  loading={patientLoading} 
                />
              </Form.Item>
              
              <Form.Item label="Kunjungan (Encounter)" name="encounterId">
                <Select 
                  options={encounterOptions} 
                  placeholder="Pilih Kunjungan" 
                  showSearch 
                  optionFilterProp="label" 
                  loading={encounterLoading} 
                  allowClear
                />
              </Form.Item>

              {/* Requester is now handled automatically by backend */}
            </div>

            <div className="space-y-2">
              <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                <Select options={Object.values(MedicationRequestStatus).map(v => ({ label: v, value: v }))} />
              </Form.Item>

              <Form.Item label="Tujuan (Intent)" name="intent" rules={[{ required: true }]}>
                <Select options={Object.values(MedicationRequestIntent).map(v => ({ label: v, value: v }))} />
              </Form.Item>

              <Form.Item label="Prioritas" name="priority">
                <Select options={Object.values(MedicationRequestPriority).map(v => ({ label: v, value: v }))} />
              </Form.Item>

              <Form.Item label="Tanggal Penulisan" name="authoredOn">
                <DatePicker showTime className="w-full" />
              </Form.Item>
            </div>
          </div>

		  <div className="border-t pt-4">
				<h3 className="hidden font-semibold text-lg mb-4">Daftar Obat</h3>
			<div className="hidden">
			<Form.List name="items">
			  {(fields, { add, remove }) => (
				<div className="space-y-4">
				  {fields.map(({ key, name, ...restField }) => (
                    <div
                      key={`item-${key}`}
                      className="flex gap-4 items-start bg-gray-50 p-4 rounded-lg relative group"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <Form.Item
                            {...restField}
                            name={[name, 'medicationId']}
                            label={
                              <div className="flex items-center gap-1">
                                <span>Obat</span>
                                <Tooltip title="Pilih obat. Nama menampilkan informasi stok saat ini.">
                                  <span className="text-gray-400 cursor-help">?</span>
                                </Tooltip>
                              </div>
                            }
                            rules={[{ required: true, message: 'Wajib diisi' }]}
                            className="mb-0"
                          >
                            <Select
                              options={medicineOptions}
                              placeholder="Pilih Obat"
                              showSearch
                              optionFilterProp="label"
                              loading={medicineLoading}
                            />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'dosageInstruction']}
                            label={
                              <div className="flex items-center gap-1">
                                <span>Instruksi</span>
                                <Tooltip title="Aturan pakai atau signa untuk obat ini.">
                                  <span className="text-gray-400 cursor-help">?</span>
                                </Tooltip>
                              </div>
                            }
                            className="mb-0"
                          >
                            <Input placeholder="Dosis..." />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'quantity']}
                            label={
                              <div className="flex items-center gap-1">
                                <span>Jumlah</span>
                                <Tooltip title="Isi jumlah yang diminta, perhatikan stok yang tersedia.">
                                  <span className="text-gray-400 cursor-help">?</span>
                                </Tooltip>
                              </div>
                            }
                            className="mb-0"
                          >
                            <InputNumber<number> min={1} className="w-full" />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'quantityUnit']}
                            label="Satuan"
                            className="mb-0"
                          >
                            <Input placeholder="Contoh: tablet, kapsul, botol" />
                          </Form.Item>
                        </div>
                        <Form.Item
                          {...restField}
                          name={[name, 'note']}
                          label="Catatan"
                          className="mb-0"
                        >
                          <Input placeholder="Catatan..." />
                        </Form.Item>
                      </div>
					  {fields.length > 0 && (
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                          className="mt-8"
                        />
                      )}
                    </div>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Tambah Obat
                    </Button>
					</Form.Item>
					</div>
				  )}
				</Form.List>
			</div>

			<div className="mt-8">
				  <h3 className="font-semibold text-lg mb-4">Obat dan Barang</h3>
					  <Form.List name="otherItems">
					        {(fields, { add, remove }) => (
					          <div className="space-y-4">
						            {fields.map(({ key, name, ...restField }) => (
                      <div
                        key={`otherItem-${key}`}
                        className="flex gap-4 items-start bg-gray-50 p-4 rounded-lg relative group"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
									<Form.Item
									  {...restField}
										name={[name, 'itemId']}
										label="Nama Item"
									  rules={[{ required: true, message: 'Pilih item' }]}
									  className="mb-0"
									>
									  <Select
									    options={itemOptions.filter((option) => option.categoryType === 'obat')}
									    placeholder="Pilih Item"
									    showSearch
									    optionFilterProp="label"
									    loading={itemLoading}
									  />
									</Form.Item>
                            <Form.Item
                              {...restField}
                              name={[name, 'quantity']}
                              label="Jumlah"
                              className="mb-0"
                            >
                              <InputNumber<number> min={1} className="w-full" />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              name={[name, 'instruction']}
                              label="Instruksi"
                              className="mb-0"
                            >
                              <Input placeholder="Instruksi penggunaan" />
                            </Form.Item>
                          </div>
                          <Form.Item
                            {...restField}
                            name={[name, 'note']}
                            label="Catatan"
                            className="mb-0"
                          >
                            <Input placeholder="Catatan tambahan" />
                          </Form.Item>
                        </div>
                        {fields.length > 0 && (
                          <Button
                            type="text"
                            danger
                            icon={<MinusCircleOutlined />}
                            onClick={() => remove(name)}
                            className="mt-8"
                          />
                        )}
                      </div>
                    ))}
                    <Form.Item>
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        Tambah Item
                      </Button>
                    </Form.Item>
                  </div>
                )}
              </Form.List>
            </div>

				<div className="mt-8">
              <h3 className="font-semibold text-lg mb-4">Daftar Obat Racikan</h3>
              <Form.List name="compounds">
                {(fields, { add, remove }) => (
                  <div className="space-y-6">
                    {fields.map(({ key, name, ...restField }) => (
                      <Card
                        key={`compound-${key}`}
                        size="small"
                        title={`Racikan ${name + 1}`}
                        extra={
                          <Button type="text" danger onClick={() => remove(name)}>
                            Hapus
                          </Button>
                        }
                        className="bg-orange-50 border-orange-100"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <Form.Item
                            {...restField}
                            name={[name, 'name']}
                            label="Nama Racikan"
                            rules={[{ required: true, message: 'Nama racikan wajib diisi' }]}
                            className="mb-0"
                          >
                            <Input placeholder="Contoh: Puyer Batuk Pilek" />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'dosageInstruction']}
                            label="Signa / Dosis Racikan"
                            rules={[{ required: true, message: 'Dosis racikan wajib diisi' }]}
                            className="mb-0"
                          >
                            <Input placeholder="Contoh: 3x1 Bungkus" />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'quantity']}
                            label="Jumlah Racikan"
                            className="mb-0"
                          >
                            <InputNumber<number> min={1} className="w-full" />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'quantityUnit']}
                            label="Satuan Racikan"
                            className="mb-0"
                          >
                            <Input placeholder="Contoh: bungkus, botol" />
                          </Form.Item>
                        </div>

                        <div className="pl-4 border-l-2 border-orange-200">
                          <p className="text-xs text-gray-500 mb-2 font-semibold">KOMPOSISI:</p>
							  <Form.List name={[name, 'items']}>
                            {(subFields, subOpt) => (
                              <div className="space-y-2">
                                {subFields.map((subField) => {
                                  const { key: subKey, ...subRestField } = subField

                                  return (
                                  <div key={`compoundItem-${subKey}`} className="flex gap-2 items-start">
                                    <Form.Item
                                      {...subRestField}
                                      name={[subRestField.name, 'itemId']}
                                      className="mb-0 flex-1"
                                      rules={[{ required: true, message: 'Pilih obat' }]}
                                    >
                                      <Select
                                        options={itemOptions.filter((option) => option.categoryType === 'obat')}
                                        placeholder="Pilih Obat"
                                        showSearch
                                        optionFilterProp="label"
                                        loading={itemLoading}
                                      />
                                    </Form.Item>
                                    <Form.Item
                                      {...subRestField}
                                      name={[subRestField.name, 'quantity']}
                                      className="mb-0 w-24"
                                      rules={[{ required: true, message: 'Wajib' }]}
                                    >
                                      <InputNumber placeholder="Jml" min={0} className="w-full" />
                                    </Form.Item>
                                    <Form.Item
                                      {...subRestField}
                                      name={[subRestField.name, 'unit']}
                                      className="mb-0 w-24"
                                    >
                                      <Input placeholder="Satuan" />
                                    </Form.Item>
                                    <Form.Item
                                      {...subRestField}
                                      name={[subRestField.name, 'note']}
                                      className="mb-0 w-32"
                                    >
                                      <Input placeholder="Kekuatan (mg)" />
                                    </Form.Item>
                                    <Button
                                      type="text"
                                      danger
                                      icon={<MinusCircleOutlined />}
                                      onClick={() => subOpt.remove(subField.name)}
                                    />
                                  </div>
                                  )})}
                                <Button
                                  type="dashed"
                                  size="small"
                                  onClick={() => subOpt.add()}
                                  icon={<PlusOutlined />}>
                                  Tambah Komposisi
                                </Button>
                              </div>
                            )}
                          </Form.List>
                        </div>
                      </Card>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Tambah Racikan Baru
                    </Button>
                  </div>
                )}
              </Form.List>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6 border-t pt-4">
            <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending} className="px-6 bg-orange-600 hover:bg-orange-500 border-none">
              Simpan
            </Button>
            <Button onClick={() => navigate('/dashboard/medicine/medication-requests')} className="px-6">
              Batal
            </Button>
          </div>
        </Form>
      </div>
    </div>
  )
}

export default MedicationRequestForm
