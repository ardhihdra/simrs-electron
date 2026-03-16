import { Button, Form, Input, InputNumber, Select, Switch, Tag, App as AntdApp } from 'antd'
import { SelectAsync } from '@renderer/components/organisms/SelectAsync'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { queryClient } from '@renderer/query-client'
import dayjs from 'dayjs'
import { PatientSelectorWithService, PatientSelectorValue } from '@renderer/components/organisms/PatientSelectorWithService'
import { MedicationOtherItemsTable } from './components/MedicationOtherItemsTable'
import { MedicationCompoundsSection } from './components/MedicationCompoundsSection'

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
  roomId?: string | null
  authoredOn?: any
  resepturId?: number | null
  resepturName?: string
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
    batchNumber?: string
    expiryDate?: string
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

// signa options are now dynamically loaded from backend via API

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
  roomId?: string | null
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
  const isEdit = Boolean(id)
  const [session, setSession] = useState<any>(null)
  const [originalGroupRecords, setOriginalGroupRecords] = useState<MedicationRequestRecordForEdit[]>([])
  const { message, modal } = AntdApp.useApp()

  // Batch options per item row: key = `otherItem-{index}` or `compound-{compIdx}-ing-{ingIdx}`
  type BatchOption = {
    batchNumber: string;
    expiryDate: string | null;
    availableStock: number;
    firstReceivedDate?: string;
  }
  const [batchOptionsMap, setBatchOptionsMap] = useState<Map<string, BatchOption[]>>(new Map())
  const [batchLoadingMap, setBatchLoadingMap] = useState<Map<string, boolean>>(new Map())
  const [batchSortModeMap, setBatchSortModeMap] = useState<Map<string, boolean>>(new Map())

  const sortBatches = useCallback((batches: BatchOption[], rowKey: string): BatchOption[] => {
    const isFefo = batchSortModeMap.get(rowKey) ?? true // default FEFO
    try {
      // batches count check
    } catch { }
    return [...batches].sort((a, b) => {
      if (isFefo) {
        // FEFO: earliest expiry first
        if (a.expiryDate && b.expiryDate) return a.expiryDate.localeCompare(b.expiryDate)
        if (a.expiryDate) return -1
        if (b.expiryDate) return 1
        // If neither has expiry, fallback to FIFO (received date)
        if (a.firstReceivedDate && b.firstReceivedDate) return a.firstReceivedDate.localeCompare(b.firstReceivedDate)
        return 0
      }
      // FIFO: oldest received date first
      if (a.firstReceivedDate && b.firstReceivedDate) return a.firstReceivedDate.localeCompare(b.firstReceivedDate)
      // Fallback to batch number if received date missing
      return a.batchNumber.localeCompare(b.batchNumber)
    })
  }, [batchSortModeMap])

  const fetchBatchesForItem = useCallback(async (kodeItem: string, rowKey: string) => {
    setBatchLoadingMap((prev) => new Map(prev).set(rowKey, true))
    try {
      const api = window.api?.query as {
        inventoryStock?: {
          listBatchesByLocation?: (args: { kodeItem: string; kodeLokasi: string }) => Promise<{ success: boolean; result?: BatchOption[] }>,
          listBatches?: (args: { kodeItem: string }) => Promise<{ success: boolean; result?: BatchOption[] }>
        }
      }
      const useByLocation = api?.inventoryStock?.listBatchesByLocation
      if (!useByLocation) {
        // fallback to listBatches if needed
      }
      const res = useByLocation
        ? await useByLocation({ kodeItem, kodeLokasi: 'FARM' })
        : await api?.inventoryStock?.listBatches?.({ kodeItem })
      if (res?.success && Array.isArray(res.result)) {
        setBatchOptionsMap((prev) => new Map(prev).set(rowKey, res.result as BatchOption[]))
      }
    } catch (err) {
      console.error(`[MR] Fetch batches error for ${kodeItem} (row: ${rowKey})`, err)
    } finally {
      setBatchLoadingMap((prev) => new Map(prev).set(rowKey, false))
    }
  }, [])

  const buildDispenseRequest = (quantity?: number, unit?: string) => {
    if (!quantity) return null
    return {
      quantity: {
        value: quantity,
        unit: unit || undefined
      }
    }
  }

  type DosageEntry = {
    sequence?: number
    text?: string
    timing?: { repeat?: { frequency?: number; period?: number; periodUnit?: string } }
    doseAndRate?: Array<{
      type?: { coding?: Array<{ system?: string; code?: string }> }
      doseQuantity?: { value?: number; unit?: string }
    }>
  }

  const buildDosageInstruction = (text?: string, quantity?: number, unit?: string): DosageEntry => {
    const doseValue = typeof quantity === 'number' && quantity > 0 ? quantity : 1
    const doseUnit = typeof unit === 'string' && unit.trim().length > 0 ? unit.trim() : undefined
    return {
      sequence: 1,
      text: typeof text === 'string' ? text : undefined,
      timing: { repeat: { frequency: 2, period: 1, periodUnit: 'd' } },
      doseAndRate: [
        {
          type: {
            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/dose-rate-type', code: 'ordered' }]
          },
          doseQuantity: { value: doseValue, unit: doseUnit }
        }
      ]
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

  const itemApi = (window.api?.query as { item?: { list: () => Promise<ItemListResponse> } }).item

  const { data: itemSource, isLoading: itemLoading } = useQuery<ItemListResponse>({
    queryKey: ['item', 'list', 'for-medication-request'],
    queryFn: () => {
      const fn = itemApi?.list
      if (!fn) throw new Error('API item tidak tersedia.')
      return fn()
    }
  })

  const { data: inventoryByLocation } = useQuery({
    queryKey: ['inventoryStock', 'by-location', 'FARM', 'for-medication-request'],
    queryFn: async () => {
      const api = window.api?.query as {
        inventoryStock?: {
          listByLocation: (args: { kodeLokasi: string; items?: number; depth?: number }) => Promise<{
            success: boolean
            result?: Array<{
              id: string
              kodeLokasi: string
              stockIn: number
              stockOut: number
              availableStock: number
              items: Array<{
                kodeItem: string
                namaItem: string
                unit: string
                stockIn: number
                stockOut: number
                availableStock: number
              }>
            }>
            message?: string
          }>
        }
      }
      const fn = api?.inventoryStock?.listByLocation
      if (!fn) throw new Error('API stok per lokasi tidak tersedia.')
      return fn({ kodeLokasi: 'FARM', items: 1000, depth: 1 })
    }
  })

  const farmKodeSet = useMemo(() => {
    const arr = Array.isArray(inventoryByLocation?.result) ? inventoryByLocation!.result! : []
    const farm = arr.find(l => l.kodeLokasi === 'FARM')
    const items = farm?.items ?? []
    const set = new Set<string>()
    for (const it of items) {
      const kode = (it.kodeItem || '').trim().toUpperCase()
      if (kode && it.availableStock > 0) set.add(kode)
    }
    return set
  }, [inventoryByLocation?.result])

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

  const { data: requesterData } = useQuery({
    queryKey: ['kepegawaian', 'list'],
    queryFn: () => window.api?.query?.kepegawaian?.list()
  })

  // Dynamic Signa Options
  const { data: signaData, isLoading: signaLoading } = useQuery({
    queryKey: ['mastersigna', 'listAll'],
    queryFn: () => {
      const api = window.api?.query as any
      if (api?.mastersigna?.listAll) {
        return api.mastersigna.listAll()
      }
      return api?.mastersigna?.list({ limit: 500 })
    }
  })

  const signaOptions = useMemo(() => {
    const source = Array.isArray(signaData?.result) ? signaData!.result : []
    return source
      .filter((s: any) => s.isActive !== false)
      .map((s: any) => ({
        label: s.signaName,
        value: s.signaName
      }))
  }, [signaData])






  const itemOptions = useMemo(
    () => {
      const source: ItemAttributes[] = Array.isArray(itemSource?.result)
        ? itemSource.result
        : []

      const filteredByLocation = source.filter((item) => {
        const code = typeof item.kode === 'string' ? item.kode.trim().toUpperCase() : ''
        if (!code) return false
        return farmKodeSet.has(code)
      })

      return filteredByLocation
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
    [itemSource?.result, itemCategoryMap, farmKodeSet]
  )

  const itemKodeMap = useMemo(() => {
    const source: ItemAttributes[] = Array.isArray(itemSource?.result) ? itemSource.result : []
    const map = new Map<number, string>()
    source.forEach((item) => {
      if (typeof item.id === 'number' && typeof item.kode === 'string') {
        map.set(item.id, item.kode.trim().toUpperCase())
      }
    })
    return map
  }, [itemSource?.result])

  // Auto-fill Requester from Session (match NIK)
  useEffect(() => {
    if (session?.user && requesterData?.result && !isEdit) {
      const employees = requesterData.result as { id: number; nik?: string; namaLengkap?: string }[]
      const sessionId = Number(session.user.id)
      const sessionUsername = String(session.user.username || '').trim()
      const byId = Number.isFinite(sessionId) ? employees.find(e => e.id === sessionId) : undefined
      const byNik = employees.find(e => typeof e.nik === 'string' && e.nik.trim() === sessionUsername)
      const byName = employees.find(e => typeof e.namaLengkap === 'string' && e.namaLengkap.trim() === sessionUsername)
      const foundEmployee = byId || byNik || byName
      if (foundEmployee) {
        form.setFieldValue('resepturId', foundEmployee.id)
        form.setFieldValue('resepturName', foundEmployee.namaLengkap || undefined)
      }
    }
  }, [session, requesterData, isEdit, form])

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
          roomId: baseRecord.roomId ?? null,
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
    onSuccess: (res) => {
      if (!res?.success) {
        const msg = (res as any)?.error || (res as any)?.message || 'Gagal membuat Permintaan Obat'
        modal.error({ title: 'Gagal', content: msg })
        return
      }
      message.success('Permintaan Obat berhasil dibuat')
      queryClient.invalidateQueries({ queryKey: ['medicationRequest', 'list'] })
      navigate('/dashboard/medicine/medication-requests')
    },
    onError: (error) => {
      console.error('MedicationRequest create error', error)
      const msg = error instanceof Error ? error.message : String(error)
      modal.error({ title: 'Gagal', content: msg || 'Gagal membuat Permintaan Obat' })
    }
  })

  const updateMutation = useMutation({
    mutationKey: ['medicationRequest', 'update'],
    mutationFn: (data: any) => {
      const fn = window.api?.query?.medicationRequest?.update
      if (!fn) throw new Error('API MedicationRequest tidak tersedia.')
      return fn(data)
    },
    onSuccess: (res) => {
      if (!res?.success) {
        const msg = (res as any)?.error || (res as any)?.message || 'Gagal mengubah Permintaan Obat'
        modal.error({ title: 'Gagal', content: msg })
        return
      }
      message.success('Permintaan Obat berhasil diubah')
      queryClient.invalidateQueries({ queryKey: ['medicationRequest', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['medicationRequest', 'detail', id] })
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : String(error)
      modal.error({ title: 'Gagal', content: msg || 'Gagal mengubah Permintaan Obat' })
    }
  })

  const onFinish = async (values: FormData) => {
    const baseCommonPayload = {
      status: values.status,
      intent: MedicationRequestIntent.ORDER,
      priority: values.priority,
      patientId: values.patientId,
      encounterId: values.encounterId,
      roomId: values.roomId,
      requesterId: values.requesterId,
      authoredOn: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }

    const supportingInformationCommon: SupportingInformationItemInfo[] = []
    if (typeof values.resepturId === 'number') {
      supportingInformationCommon.push({
        type: 'Reseptur',
        itemId: values.resepturId
      })
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
            medicationId: null,
            itemId: item.medicationId,
            note: item.note ?? null,
            groupIdentifier,
            dosageInstruction: item.dosageInstruction
              ? [buildDosageInstruction(item.dosageInstruction, item.quantity, item.quantityUnit)]
              : null,
            dispenseRequest: buildDispenseRequest(
              item.quantity,
              item.quantityUnit
            ),
            category: record.category ?? null,
            identifier: record.identifier ?? null,
            supportingInformation:
              (record.supportingInformation && record.supportingInformation.length > 0)
                ? [...record.supportingInformation, ...supportingInformationCommon]
                : (supportingInformationCommon.length > 0 ? supportingInformationCommon : null)
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
              name,
              batchNumber: (item as Record<string, unknown>).batchNumber || null,
              expiryDate: (item as Record<string, unknown>).expiryDate || null
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
              ? [buildDosageInstruction(input.dosageInstruction, input.quantity, input.quantityUnit)]
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
            supportingInformation:
              (input.supportingInformation && input.supportingInformation.length > 0)
                ? [...input.supportingInformation, ...supportingInformationCommon]
                : (supportingInformationCommon.length > 0 ? supportingInformationCommon : null)
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
            supportingInformation:
              (record.supportingInformation && record.supportingInformation.length > 0)
                ? [...record.supportingInformation, ...supportingInformationCommon]
                : (supportingInformationCommon.length > 0 ? supportingInformationCommon : null)
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
            medicationId: null,
            itemId: item.medicationId,
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
            supportingInformation: supportingInformationCommon.length > 0 ? supportingInformationCommon : null
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
            supportingInformation:
              (input.supportingInformation && input.supportingInformation.length > 0)
                ? [...input.supportingInformation, ...supportingInformationCommon]
                : (supportingInformationCommon.length > 0 ? supportingInformationCommon : null)
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
            supportingInformation: (() => {
              const original =
                input.batchNumber
                  ? [{ resourceType: 'StockBatch', batchNumber: input.batchNumber, expiryDate: input.expiryDate ?? null }]
                  : []
              const merged = [...original, ...supportingInformationCommon]
              return merged.length > 0 ? merged : null
            })()
          })
        }
      }

      if (updates.length === 0 && typeof baseId === 'number' && !Number.isNaN(baseId)) {
        const firstItem = items.length > 0 ? items[0] : undefined
        await updateMutation.mutateAsync({
          ...baseCommonPayload,
          itemId: firstItem?.medicationId,
          note: firstItem?.note ?? null,
          dosageInstruction: firstItem?.dosageInstruction
            ? [buildDosageInstruction(firstItem.dosageInstruction, firstItem?.quantity, firstItem?.quantityUnit)]
            : null,
          dispenseRequest: buildDispenseRequest(
            firstItem?.quantity,
            firstItem?.quantityUnit
          ),
          supportingInformation: supportingInformationCommon.length > 0 ? supportingInformationCommon : null,
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
        itemId: item.medicationId,
        dosageInstruction: item.dosageInstruction
          ? [buildDosageInstruction(item.dosageInstruction, item.quantity, item.quantityUnit)]
          : null,
        note: item.note,
        dispenseRequest: buildDispenseRequest(item.quantity, item.quantityUnit),
        supportingInformation: supportingInformationCommon.length > 0 ? supportingInformationCommon : null
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
              name,
              batchNumber: (item as Record<string, unknown>).batchNumber || null,
              expiryDate: (item as Record<string, unknown>).expiryDate || null
            }
          })

        return {
          ...baseCommonPayload,
          groupIdentifier,
          medicationId: null,
          itemId: null,
          dosageInstruction: comp.dosageInstruction
            ? [buildDosageInstruction(comp.dosageInstruction, comp.quantity, comp.quantityUnit)]
            : null,
          identifier: [{ system: 'racikan-group', value: compoundId }],
          note: `[Racikan: ${comp.name}]`,
          category: [{ text: 'racikan', code: 'compound' }],
          dispenseRequest: buildDispenseRequest(comp.quantity, comp.quantityUnit),
          supportingInformation: (() => {
            const merged = [...ingredients, ...supportingInformationCommon]
            return merged.length > 0 ? merged : null
          })()
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
            dosageInstruction: instructionText
              ? [buildDosageInstruction(instructionText, it.quantity, unitCode)]
              : null,
            dispenseRequest:
              typeof it.quantity === 'number' && unitCode
                ? buildDispenseRequest(it.quantity, unitCode)
                : null,
            supportingInformation: (() => {
              const original =
                it.batchNumber
                  ? [{ resourceType: 'StockBatch', batchNumber: it.batchNumber, expiryDate: it.expiryDate ?? null }]
                  : []
              const merged = [...original, ...supportingInformationCommon]
              return merged.length > 0 ? merged : null
            })()
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
        <div className="flex justify-between items-center mb-6  pb-4">
          <h2 className="text-xl font-bold text-gray-800">{isEdit ? 'Ubah Permintaan Obat' : 'Permintaan Obat Baru'}</h2>
          <Button onClick={() => navigate('/dashboard/medicine/medication-requests')}>Kembali</Button>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-6">
            {/* Header Fields (Patient & Context) */}
            <div className="md:col-span-2 bg-gray-50  p-0 mb-4">
              <Form.Item
                noStyle
                shouldUpdate={(prev, curr) => prev.patientId !== curr.patientId || prev.encounterId !== curr.encounterId}
              >
                {({ getFieldValue, setFieldsValue }) => (
                  <PatientSelectorWithService
                    disabled={isEdit}
                    initialValue={getFieldValue('encounterId')}
                    onSelect={(val: PatientSelectorValue | null) => {
                      if (val) {
                        setFieldsValue({
                          patientId: val.patientId,
                          encounterId: val.encounterId
                        })
                      } else {
                        setFieldsValue({
                          patientId: undefined,
                          encounterId: undefined
                        })
                      }
                    }}
                  />
                )}
              </Form.Item>
              {/* Hidden fields to keep Form compatibility */}
              <Form.Item name="patientId" hidden><Input /></Form.Item>
              <Form.Item name="encounterId" hidden><Input /></Form.Item>
            </div>

            <div className="space-y-2">
              <Form.Item label="Lokasi/Ruangan (Opsional)" name="roomId" tooltip="Diisi apabila pasien rawat inap untuk menentukan dimana obat akan di drop/diletakkan">
                <SelectAsync
                  entity="room"
                  display="roomCodeId"
                  output="id"
                  placeHolder="Pilih Lokasi Ruangan (jika ada)"
                />
              </Form.Item>

              {/* Requester is now handled automatically by backend */}
            </div>

            <div className="space-y-2">
              <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                <Select options={Object.values(MedicationRequestStatus).map(v => ({ label: v, value: v }))} />
              </Form.Item>

              <Form.Item label="Prioritas" name="priority">
                <Select options={Object.values(MedicationRequestPriority).map(v => ({ label: v, value: v }))} />
              </Form.Item>

              <Form.Item
                label="Dokter"
                name="requesterId"
                rules={[{ required: true, message: 'Dokter wajib dipilih' }]}
              >
                <SelectAsync
                  display="namaLengkap"
                  entity="kepegawaian"
                  output="id"
                  filters={{ hakAksesId: 'doctor' }}
                />
              </Form.Item>

              <Form.Item
                label="Reseptur"
              >
                <Input disabled value={form.getFieldValue('resepturName')} placeholder="Mengikuti pengguna login" />
              </Form.Item>
              <Form.Item name="resepturId" hidden>
                <Input />
              </Form.Item>
            </div>
          </div>

            <MedicationOtherItemsTable
              form={form}
              itemOptions={itemOptions}
              itemLoading={itemLoading}
              itemKodeMap={itemKodeMap}
              signaOptions={signaOptions}
              signaLoading={signaLoading}
              batchOptionsMap={batchOptionsMap}
              batchLoadingMap={batchLoadingMap}
              batchSortModeMap={batchSortModeMap}
              setBatchSortModeMap={setBatchSortModeMap}
              sortBatches={sortBatches}
              fetchBatchesForItem={fetchBatchesForItem}
            />

            <MedicationCompoundsSection
              form={form}
              itemOptions={itemOptions}
              itemLoading={itemLoading}
              itemKodeMap={itemKodeMap}
              signaOptions={signaOptions}
              signaLoading={signaLoading}
              batchOptionsMap={batchOptionsMap}
              batchLoadingMap={batchLoadingMap}
              batchSortModeMap={batchSortModeMap}
              setBatchSortModeMap={setBatchSortModeMap}
              sortBatches={sortBatches}
              fetchBatchesForItem={fetchBatchesForItem}
            />

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
