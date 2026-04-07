import {
  Button,
  Form,
  Input,
  Select,
  App as AntdApp
} from 'antd'
import { SelectAsync } from '@renderer/components/organisms/SelectAsync'
import { useNavigate, useParams } from 'react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { queryClient } from '@renderer/query-client'
import dayjs from 'dayjs'
import { PatientAttributes } from 'simrs-types'
import { ItemPrescriptionForm } from '@renderer/components/organisms/Assessment/Prescription/ItemPrescriptionForm'
import { CompoundPrescriptionForm } from '@renderer/components/organisms/Assessment/Prescription/CompoundPrescriptionForm'
import { PatientSelectorWithService, PatientSelectorValue } from '@renderer/components/organisms/PatientSelectorWithService'
import { MedicationOtherItemsTable } from './components/MedicationOtherItemsTable'
import { MedicationCompoundsSection } from './components/MedicationCompoundsSection'
import { ItemSelectorModal, ItemAttributes } from '@renderer/components/organisms/ItemSelectorModal'
import { useMutation, useQuery } from '@tanstack/react-query'

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
  manualPatientName?: string
  manualMedicalRecordNumber?: string
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


export interface ItemOption {
  value: number
  label: string
  unitCode: string
  categoryType: string
  itemCategoryCode?: string | null
  itemGroupCode?: string | null
  itemCategoryName?: string | null
  itemGroupName?: string | null
  fpktl?: boolean | null
}

interface MedicationRequestRecordForEdit {
  id?: number
  status: MedicationRequestStatus
  intent: MedicationRequestIntent
  priority?: MedicationRequestPriority
  patientId: string
  encounterId?: string | null
  requesterId?: number | null
  performerId?: number | null
  recorderId?: number | null
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

type EncounterOptionSource = {
  id: string
  encounterCode?: string
  patient?: { id?: string | number; name?: string }
  visitDate?: string
  period?: { start?: string; end?: string }
  startTime?: string
  createdAt?: string | Date | null
  updatedAt?: string | Date | null
}
type EncounterListPayload =
  | { result?: EncounterOptionSource[]; data?: EncounterOptionSource[] }
  | undefined

export function MedicationRequestForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm<FormData>()
  const isEdit = Boolean(id)
  const [session, setSession] = useState<any>(null)
  const [originalGroupRecords, setOriginalGroupRecords] = useState<
    MedicationRequestRecordForEdit[]
  >([])
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
      const listBatchesByLocation = api?.inventoryStock?.listBatchesByLocation
      if (!listBatchesByLocation) {
        // fallback to listBatches if needed
      }
      const res = listBatchesByLocation
        ? await listBatchesByLocation({ kodeItem, kodeLokasi: 'FARM' })
        : await api?.inventoryStock?.listBatches?.({ kodeItem })
      if (res?.success && Array.isArray(res.result)) {
        setBatchOptionsMap((prev) => new Map(prev).set(rowKey, res.result as BatchOption[]))
        try {
          const preview = (res.result as BatchOption[]).slice(0, 5).map((b) => ({ batch: b.batchNumber, exp: b.expiryDate, available: b.availableStock }))
          console.log(`[MR][Batches][${kodeItem}@FARM] count:`, (res.result as BatchOption[]).length, 'preview:', preview)
        } catch { }
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
            coding: [
              { system: 'http://terminology.hl7.org/CodeSystem/dose-rate-type', code: 'ordered' }
            ]
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
      return fn().then((res) => {
        try {
          const arr = Array.isArray(res?.result) ? res.result : []
          const preview = arr.slice(0, 5).map((i: any) => ({ id: i.id, kode: i.kode, nama: i.nama }))
          console.log('[MR][Items] total:', arr.length, 'preview:', preview)
        } catch { }
        return res
      })
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
      const res = await fn({ kodeLokasi: 'FARM', items: 1000, depth: 1 })
      try {
        const locs = Array.isArray(res?.result) ? res.result : []
        const farm = locs.find((l) => l.kodeLokasi === 'FARM')
        const items = farm?.items ?? []
        console.log('[MR][Stock][by-location:FARM] total locations:', locs.length, 'farm items:', items.length)
        if (items.length > 0) {
          const preview = items.slice(0, 5).map((it) => ({ kodeItem: it.kodeItem, availableStock: it.availableStock, unit: it.unit }))
          console.log('[MR][Stock][by-location:FARM] preview:', preview)
        }
      } catch (e) {
        console.log('[MR][Stock][by-location:FARM] log error:', e)
      }
      return res
    }
  })

  const farmStockMap = useMemo(() => {
    const arr = Array.isArray(inventoryByLocation?.result) ? inventoryByLocation!.result! : []
    const farm = arr.find((l) => l.kodeLokasi === 'FARM')
    const items = farm?.items ?? []
    const map = new Map<string, number>()
    for (const it of items) {
      const kode = (it.kodeItem || '').trim().toUpperCase()
      if (kode && it.availableStock > 0) {
        map.set(kode, it.availableStock)
      }
    }
    return map
  }, [inventoryByLocation?.result])
  useEffect(() => {
    if (inventoryByLocation?.result) {
      try {
        const arr = inventoryByLocation.result
        const farm = arr.find((l: any) => l.kodeLokasi === 'FARM')
        const totalItems = Array.isArray(farm?.items) ? farm.items.length : 0
        console.log('[MR][Stock] farmStockMap size:', farmStockMap.size, 'farm items total:', totalItems)
      } catch {}
    }
  }, [inventoryByLocation?.result, farmStockMap.size])

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

  // const { data: encounterData, isLoading: encounterLoading } = useQuery({
  //   queryKey: ['encounter', 'list', selectedPatientId],
  //   queryFn: async () => {
  //     const api = window.api?.query?.encounter?.list
  //     if (!api) throw new Error('API encounter tidak tersedia')
  //     const primary: {
  //       success?: boolean
  //       result?: EncounterOptionSource[]
  //       data?: EncounterOptionSource[]
  //       error?: string
  //     } = await api({
  //       limit: 100,
  //       patientId: selectedPatientId ? String(selectedPatientId) : undefined
  //     })
  //     const hasArray = Array.isArray(primary?.result) || Array.isArray(primary?.data)
  //     if (hasArray) return primary
  //     const rpc = window.rpc?.encounter?.list
  //     if (rpc) {
  //       const params: { depth?: number; status?: string; id?: string } = { depth: 1 }
  //       const fallback: {
  //         success?: boolean
  //         result?: EncounterOptionSource[]
  //         data?: EncounterOptionSource[]
  //         error?: string
  //       } = await rpc(params)
  //       return fallback
  //     }
  //     return primary
  //   },
  //   enabled: !!selectedPatientId || isEdit // Only fetch when patient is selected or in edit mode
  // })

  // Fallback: fetch encounters without patient filter, used only when filtered result is empty
  const { data: encounterAllData } = useQuery({
    queryKey: ['encounter', 'list', 'all'],
    queryFn: () => window.api?.query?.encounter?.list({ limit: 100 }),
    enabled: true
  })

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


  const itemOptions = useMemo(() => {
    const source: ItemAttributes[] = Array.isArray(itemSource?.result) ? itemSource.result : []

    const filteredByLocation = source.filter((item) => {
      const code = typeof item.kode === 'string' ? item.kode.trim().toUpperCase() : ''
      if (!code) return false
      return farmStockMap.has(code)
    })

    try {
      console.log(
        '[MR][Items] source count:',
        source.length,
        'farmStockMap size:',
        farmStockMap.size,
        'filteredByLocation count:',
        filteredByLocation.length
      )
    } catch {}

    let opts = filteredByLocation
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
            typeof item.category?.categoryType === 'string' ? item.category.categoryType : undefined
          categoryType = rawCategoryType ? rawCategoryType.trim().toLowerCase() : ''
        }

        return {
          value: item.id as number,
          label,
          unitCode,
          categoryId,
          categoryType,
          itemCategoryCode: item.itemCategoryCode,
          itemGroupCode: item.itemGroupCode,
          itemCategoryName: item.categoryRef?.display || null,
          itemGroupName: item.groupRef?.display || null,
          fpktl: item.fpktl,
          prb: item.prb,
          oen: item.oen,
          sediaanId: item.sediaanId,
          peresepanMaksimal: item.peresepanMaksimal,
          restriksi: item.restriksi,
          kekuatan: item.kekuatan,
          satuanId: item.satuanId
        }
      })
    // Fallback from inventory stock if master items are empty
    if (opts.length === 0) {
      try {
        const locs = Array.isArray(inventoryByLocation?.result) ? inventoryByLocation!.result! : []
        const farm = locs.find((l) => l.kodeLokasi === 'FARM')
        const items = Array.isArray(farm?.items) ? farm!.items! : []
        const fromFarm = items
          .filter((it: any) => typeof it.itemId === 'number' && it.itemId > 0)
          .map((it: any) => {
            const value = it.itemId as number
            const label = it.unit ? `${it.namaItem || it.kodeItem} (${it.unit})` : (it.namaItem || it.kodeItem)
            const unitCode = typeof it.unitCode === 'string' && it.unitCode.trim().length > 0 ? it.unitCode.trim().toUpperCase() : (typeof it.unit === 'string' ? it.unit : '')
            
            return {
              value,
              label,
              unitCode,
              categoryId: null,
              categoryType: 'obat',
              itemCategoryCode: it.itemCategoryCode,
              itemGroupCode: it.itemGroupCode,
              itemCategoryName: null,
              itemGroupName: null,
              fpktl: it.fpktl,
              prb: it.prb,
              oen: it.oen,
              sediaanId: it.sediaanId,
              peresepanMaksimal: it.peresepanMaksimal,
              restriksi: it.restriksi,
              kekuatan: it.kekuatan,
              satuanId: it.satuanId
            }
          })
        if (fromFarm.length > 0) {
          console.log('[MR][Items][Options][fallback-from-stock] count:', fromFarm.length, 'preview:', fromFarm.slice(0, 5))
          opts = fromFarm
        }
      } catch (e) {
        console.log('[MR][Items][Options][fallback-from-stock] error:', e)
      }
    }
    try {
      const preview = opts.slice(0, 5)
      console.log('[MR][Items][Options] count:', opts.length, 'preview:', preview)
    } catch { }
    return opts
  }, [itemSource?.result, itemCategoryMap, farmStockMap, inventoryByLocation?.result])

  const extractEncounters = (src: EncounterListPayload): EncounterOptionSource[] => {
    const a = src?.result
    const b = src?.data
    return Array.isArray(a) ? a : Array.isArray(b) ? b! : []
  }
  // const encounterOptions = useMemo(() => {
  //   const filtered = extractEncounters(encounterData)
  //   const all = extractEncounters(encounterAllData)
  //   const base = filtered.length > 0 ? filtered : all
  //   const toDateText = (e: EncounterOptionSource): string | undefined => {
  //     const raw = e.startTime || e.period?.start || e.visitDate || e.updatedAt || e.createdAt
  //     if (!raw) return undefined
  //     const dt =
  //       raw instanceof Date ? raw : typeof raw === 'string' ? new Date(raw) : new Date(String(raw))
  //     if (Number.isNaN(dt.getTime())) return undefined
  //     return dt.toLocaleString('id-ID', {
  //       day: '2-digit',
  //       month: 'short',
  //       year: 'numeric',
  //       hour: '2-digit',
  //       minute: '2-digit'
  //     })
  //   }
  //   const options = base
  //     .filter((e) => {
  //       if (!selectedPatientId || filtered.length > 0) return true
  //       // When using fallback (all), ensure we only show encounters of selected patient if patient info is present
  //       // Some endpoints may not embed patient object; in that case, show all to let user pick manually.
  //       const pid = e.patient?.id
  //       return pid ? String(pid) === String(selectedPatientId) : true
  //     })
  //     .map((e) => ({
  //       label: toDateText(e) || e.encounterCode || e.id,
  //       value: e.id
  //     }))
  //   return options
  // }, [encounterData, encounterAllData, selectedPatientId])

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
        
        // Populate Reseptur from recorderId (new) or supportingInformation (old)
        if (typeof baseRecord.recorderId === 'number' && baseRecord.recorderId > 0) {
          form.setFieldValue('resepturId', baseRecord.recorderId)
        } else if (Array.isArray(baseRecord.supportingInformation)) {
          const resEntry = (baseRecord.supportingInformation as any[]).find(
            (info) => info.type === 'Reseptur'
          )
          if (resEntry && typeof resEntry.itemId === 'number') {
            form.setFieldValue('resepturId', resEntry.itemId)
          }
        }

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
          return (
            !isCompound && !hasRacikanIdentifier && !hasItem && typeof r.medicationId === 'number'
          )
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
              ? (r.dosageInstruction[0].text ?? '')
              : '',
          note: r.note ?? '',
          quantity: r.dispenseRequest?.quantity?.value,
          quantityUnit: r.dispenseRequest?.quantity?.unit
        }))

        const compoundsForm: NonNullable<FormData['compounds']> = []

        compoundRecords.forEach((r) => {
          const titleMatch = r.note?.match(/^\[Racikan:([^\]]+)\]/)
          const name = titleMatch && titleMatch[1] ? titleMatch[1].trim() : 'Racikan'
          const dosageText =
            r.dosageInstruction && r.dosageInstruction[0] ? (r.dosageInstruction[0].text ?? '') : ''

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
              
              // Standard ingredient has resourceType='Ingredient' OR have itemId/medicationId
              // Metadata like 'Reseptur' used to be here, but we now check resourceType carefully.
              return type === 'Ingredient' || ((hasItem || hasMedication) && anyInfo.type !== 'Reseptur')
            })
            
            if (ingredients.length > 0) {
              itemsForCompound = ingredients.map((info) => {
                const anyInfo = info as any
                return {
                  sourceType: 'medicine',
                  medicationId: info.medicationId
                    ? Number(info.medicationId)
                    : anyInfo.medication_id
                      ? Number(anyInfo.medication_id)
                      : undefined,
                  itemId: info.itemId
                    ? Number(info.itemId)
                    : anyInfo.item_id
                      ? Number(anyInfo.item_id)
                      : undefined,
                  note: info.note || anyInfo.note || info.instruction || anyInfo.instruction || '',
                  quantity:
                    typeof info.quantity === 'number'
                      ? info.quantity
                      : typeof anyInfo.quantity === 'number'
                        ? anyInfo.quantity
                        : undefined,
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
                note: itemRecord.id === r.id ? undefined : (itemRecord.note ?? undefined)
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
          resepturId: (() => {
            const entry = (baseRecord.supportingInformation ?? []).find((info: any) => {
              const type = info.resourceType || info.type
              return type === 'Reseptur'
            })
            return entry ? (entry.itemId || (entry as any).item_id) : null
          })(),
          authoredOn: baseRecord.authoredOn ? dayjs(baseRecord.authoredOn) : undefined,
          items: shouldUseFallbackSimpleItem
            ? [
              {
                medicationId: baseRecord.medicationId ?? 0,
                dosageInstruction:
                  baseRecord.dosageInstruction && baseRecord.dosageInstruction[0]
                    ? (baseRecord.dosageInstruction[0].text ?? '')
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
    onSuccess: (res: any) => {
      if (!res?.success) {
        const msg = res?.error || res?.message || 'Gagal membuat Permintaan Obat'
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
    onSuccess: (res: any) => {
      if (!res?.success) {
        const msg = res?.error || res?.message || 'Gagal mengubah Permintaan Obat'
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
    let finalPatientId = values.patientId

    if (values.patientId === 'MANUAL' && values.manualPatientName) {
      try {
        const createPatientFn = window.api?.query?.registration?.create
        if (!createPatientFn) throw new Error('API pendaftaran pasien tidak tersedia.')

        const ts = Date.now()
        const autoNik = `L${String(ts).padStart(15, '0')}`
        const autoMrn = values.manualMedicalRecordNumber || `L-${String(ts).slice(-8)}`

        const regRes = (await createPatientFn({
          name: values.manualPatientName,
          medicalRecordNumber: autoMrn,
          nik: autoNik,
          gender: 'male' as const,
          birthDate: '1900-01-01'
        }) as any)

        if (!regRes?.success) {
          throw new Error(regRes.error || 'Gagal mendaftarkan pasien luar otomatis (Response Success False).')
        }

        if (!regRes.data?.id) {
          console.error('[MR] Manual registration response data invalid:', regRes)
          throw new Error('Gagal mendaftarkan pasien luar otomatis (ID tidak ditemukan di response).')
        }

        finalPatientId = regRes.data.id
      } catch (err) {
        console.error('[MR] Manual patient registration failed:', err)
        modal.error({
          title: 'Gagal Registrasi Pasien Luar',
          content: err instanceof Error ? err.message : 'Terjadi kesalahan saat mendaftarkan pasien luar.'
        })
        return
      }
    }


    const baseCommonPayload = {
      status: values.status,
      intent: MedicationRequestIntent.ORDER,
      priority: values.priority,
      patientId: finalPatientId,
      encounterId: values.encounterId,
      roomId: values.roomId,
      requesterId: values.requesterId,
      recorderId: values.resepturId,
      authoredOn: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }

    const supportingInformationCommon: SupportingInformationItemInfo[] = []
    // Reseptur is now moved to recorderId field

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
            ? [detail as unknown as MedicationRequestRecordForEdit]
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
        simpleRecords.find((record) => record.groupIdentifier)?.groupIdentifier ??
        compoundRecords.find((record) => record.groupIdentifier)?.groupIdentifier ??
        itemRecords.find((record) => record.groupIdentifier)?.groupIdentifier ??
        null

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
        recorderId?: number | null
        authoredOn: string | null
        medicationId?: number | null
        itemId?: number | null
        note?: string | null
        dosageInstruction?: any
        dispenseRequest?: any
        supportingInformation?: any
        category?: any
        identifier?: any
        groupIdentifier?: any
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
            dispenseRequest: buildDispenseRequest(item.quantity, item.quantityUnit),
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

      const itemList = (itemSource?.result || []) as ItemAttributes[]
      const medicineList = itemList as any[]

      const compoundInputs: CompoundInputItem[] = compounds.map((compound) => {
        const compoundItems = compound.items ?? []
        const ingredients = compoundItems
          .filter(
            (item) => typeof item.medicationId === 'number' || typeof item.itemId === 'number'
          )
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
              medicationId: (item.medicationId as number) || undefined,
              itemId: (item.itemId as number) || undefined,
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

      const compoundCount = Math.min(compoundRecords.length, compoundInputs.length)
      for (let indexCompound = 0; indexCompound < compoundCount; indexCompound += 1) {
        const record = compoundRecords[indexCompound]
        if (typeof record.id !== 'number') {
          continue
        }
        const input = compoundInputs[indexCompound]
        const groupIdentifier =
          groupIdentifierForEdit ?? record.groupIdentifier ?? detail?.groupIdentifier ?? null
        const compoundNotePrefix = input.name ? `[Racikan: ${input.name}]` : '[Racikan]'
        const fullNote = input.note ? `${compoundNotePrefix} ${input.note}` : compoundNotePrefix
        updates.push({
          id: record.id,
          payload: {
            ...baseCommonPayload,
            medicationId: null,
            itemId: null,
            note: fullNote,
            groupIdentifier,
            dosageInstruction: input.dosageInstruction
              ? [
                buildDosageInstruction(
                  input.dosageInstruction,
                  input.quantity,
                  input.quantityUnit
                )
              ]
              : null,
            dispenseRequest: buildDispenseRequest(input.quantity, input.quantityUnit),
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
        const selectedOption = itemOptions.find((option) => option.value === input.itemId)
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
          const instructionText = Array.isArray(item.dosageInstruction) ? item.dosageInstruction.join(' ') : (item.dosageInstruction ?? '')
          extraSimplePayloads.push({
            ...baseCommonPayload,
            medicationId: null,
            itemId: item.medicationId,
            note: item.note ?? null,
            groupIdentifier,
            dosageInstruction: instructionText ? [{ text: instructionText }] : null,
            dispenseRequest: buildDispenseRequest(item.quantity, item.quantityUnit),
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
          const instructionText = Array.isArray(input.dosageInstruction) ? input.dosageInstruction.join(' ') : (input.dosageInstruction ?? '')
          const compoundNotePrefix = input.name ? `[Racikan: ${input.name}]` : '[Racikan]'
          const fullNote = input.note ? `${compoundNotePrefix} ${input.note}` : compoundNotePrefix
          extraCompoundPayloads.push({
            ...baseCommonPayload,
            medicationId: null,
            itemId: null,
            note: fullNote,
            groupIdentifier,
            dosageInstruction: instructionText ? [{ text: instructionText }] : null,
            dispenseRequest: buildDispenseRequest(input.quantity, input.quantityUnit),
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
          const combinedNote = [instructionText, noteText].filter((x) => x.length > 0).join(' | ')

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
              return supportingInformationCommon.length > 0 ? supportingInformationCommon : null
            })()
          })
        }
      }

      if (updates.length === 0 && typeof baseId === 'number' && !Number.isNaN(baseId)) {
        const firstItem = items.length > 0 ? items[0] : undefined
        if (firstItem) {
          const instructionText = Array.isArray(firstItem.dosageInstruction) ? firstItem.dosageInstruction.join(' ') : (firstItem.dosageInstruction ?? '')
          await updateMutation.mutateAsync({
            ...baseCommonPayload,
            itemId: firstItem?.medicationId,
            note: firstItem?.note ?? null,
            dosageInstruction: instructionText
              ? [
                buildDosageInstruction(
                  instructionText,
                  firstItem?.quantity,
                  firstItem?.quantityUnit
                )
              ]
              : null,
            dispenseRequest: buildDispenseRequest(
              firstItem?.quantity,
              firstItem?.quantityUnit
            ),
            supportingInformation: supportingInformationCommon.length > 0 ? supportingInformationCommon : null,
            id: baseId
          })
        }
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

      // For new requests, we primarily use otherItems and compounds.
      // items (simplePayloads) is kept for backward compatibility but should be empty if the new UI is used.
      const simplePayloads = items
        .filter((item) => typeof item.medicationId === 'number' && item.medicationId > 0)
        .map((item) => {
          const instructionText = Array.isArray(item.dosageInstruction) ? item.dosageInstruction.join(' ') : (item.dosageInstruction ?? '')
          return {
            ...baseCommonPayload,
            groupIdentifier,
            itemId: item.medicationId,
            dosageInstruction: instructionText
              ? [buildDosageInstruction(instructionText, item.quantity, item.quantityUnit)]
              : null,
            note: item.note,
            dispenseRequest: buildDispenseRequest(item.quantity, item.quantityUnit),
            supportingInformation: supportingInformationCommon.length > 0 ? supportingInformationCommon : null
          }
        })
      const itemList = (itemSource?.result || []) as ItemAttributes[]
      const medicineList = itemList as any[]

      const compoundPayloads = compounds.map((comp, idx) => {
        const compoundId = `${Date.now()}-comp-${idx}`
        const compoundItems = comp.items || []

        const ingredients = compoundItems
          .filter(
            (item) => typeof item.medicationId === 'number' || typeof item.itemId === 'number'
          )
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
              medicationId: (item.medicationId as number) || undefined,
              itemId: (item.itemId as number) || undefined,
              note: item.note || '',
              instruction: item.note || '',
              quantity: typeof item.quantity === 'number' ? item.quantity : 0,
              unitCode: item.unit || null,
              name
            }
          })

        const instructionText = Array.isArray(comp.dosageInstruction) ? comp.dosageInstruction.join(' ') : (comp.dosageInstruction ?? '')
        return {
          ...baseCommonPayload,
          groupIdentifier,
          medicationId: null,
          itemId: null,
          dosageInstruction: instructionText
            ? [buildDosageInstruction(instructionText, comp.quantity, comp.quantityUnit)]
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
          const instructionText = Array.isArray(it.instruction) ? it.instruction.join(' ') : (typeof it.instruction === 'string' ? it.instruction.trim() : '')
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
              typeof it.quantity === 'number'
                ? buildDispenseRequest(it.quantity, unitCode || undefined)
                : null,
            supportingInformation: (() => {
              return supportingInformationCommon.length > 0 ? supportingInformationCommon : null
            })()
          }
        })

      const payload = [...simplePayloads, ...compoundPayloads, ...itemPayloads]
      try {
        const simpleSummary = simplePayloads.map((p) => ({
          itemId: p.itemId,
          qty: p.dispenseRequest?.quantity?.value,
          unit: p.dispenseRequest?.quantity?.unit
        }))
        const compoundSummary = compoundPayloads.map((p) => ({
          ingredients: Array.isArray(p.supportingInformation)
            ? (p.supportingInformation as any[]).filter((x) => x?.resourceType === 'Ingredient').length
            : 0,
          qty: p.dispenseRequest?.quantity?.value,
          unit: p.dispenseRequest?.quantity?.unit
        }))
        const itemSummary = itemPayloads.map((p) => ({
          itemId: p.itemId,
          qty: p.dispenseRequest?.quantity?.value,
          unit: p.dispenseRequest?.quantity?.unit
        }))
        console.log('[MR][Create] simple count:', simplePayloads.length, simpleSummary)
        console.log('[MR][Create] compound count:', compoundPayloads.length, compoundSummary)
        console.log('[MR][Create] other items count:', itemPayloads.length, itemSummary)
      } catch { }

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
                          encounterId: val.encounterId,
                          manualPatientName: val.patientName,
                          manualMedicalRecordNumber: val.medicalRecordNumber
                        })
                      } else {
                        setFieldsValue({
                          patientId: undefined,
                          encounterId: undefined,
                          manualPatientName: undefined,
                          manualMedicalRecordNumber: undefined
                        })
                      }
                    }}
                  />
                )}
              </Form.Item>
              {/* Hidden fields to keep Form compatibility */}
              <Form.Item name="patientId" hidden><Input /></Form.Item>
              <Form.Item name="encounterId" hidden><Input /></Form.Item>
              <Form.Item name="manualPatientName" hidden><Input /></Form.Item>
              <Form.Item name="manualMedicalRecordNumber" hidden><Input /></Form.Item>
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
                <Select
                  options={Object.values(MedicationRequestStatus).map((v) => ({
                    label: v,
                    value: v
                  }))}
                />
              </Form.Item>

              <Form.Item label="Tujuan (Intent)" name="intent" rules={[{ required: true }]}>
                <Select
                  options={Object.values(MedicationRequestIntent).map((v) => ({
                    label: v,
                    value: v
                  }))}
                />
              </Form.Item>

              <Form.Item label="Prioritas" name="priority">
                <Select
                  options={Object.values(MedicationRequestPriority).map((v) => ({
                    label: v,
                    value: v
                  }))}
                />
              </Form.Item>

              <Form.Item
                label="Dokter"
                name="requesterId"
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
                name="resepturId"
              >
                <SelectAsync
                  display="namaLengkap"
                  entity="kepegawaian"
                  output="id"
                  placeHolder="Pilih Reseptur (Mengikuti pengguna login jika kosong)"
                />
              </Form.Item>
            </div>
          </div>

          <MedicationOtherItemsTable
            form={form}
            itemKodeMap={itemKodeMap}
            itemOptions={itemOptions}
            itemLoading={itemLoading}
            signaOptions={signaOptions}
            signaLoading={signaLoading}
          />

          {/*    <ItemPrescriptionForm
               name="otherItems"
               title="Obat dan Barang"
               itemOptions={itemOptions}
               loading={itemLoading}
             />

             <CompoundPrescriptionForm
               name="compounds"
               title="Daftar Obat Racikan"
               itemOptions={itemOptions}
               loading={itemLoading}
             />
           </div> */}
          <MedicationCompoundsSection
            form={form}
            itemKodeMap={itemKodeMap}
            itemOptions={itemOptions}
            itemLoading={itemLoading}
            signaOptions={signaOptions}
            signaLoading={signaLoading}
          />

          <div className="flex gap-3 justify-end mt-6 border-t pt-4">
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending || updateMutation.isPending}
              className="px-6 bg-orange-600 hover:bg-orange-500 border-none"
            >
              Simpan
            </Button>
            <Button
              onClick={() => navigate('/dashboard/medicine/medication-requests')}
              className="px-6"
            >
              Batal
            </Button>
          </div>
        </Form>
      </div>
    </div>
  )
}

export default MedicationRequestForm
