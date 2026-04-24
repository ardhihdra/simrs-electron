import {
  Button,
  Card,
  Descriptions,
  InputNumber,
  Popconfirm,
  Table,
  Tooltip,
  App,
  Alert,
  Tag,
  Select,
  Input,
  Row,
  Col
} from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import dayjs from 'dayjs'
import { TelaahAdministrasiForm, TelaahResults } from './component/telaah-administrasi-form'
import {
  PatientInfoCard,
  PatientInfoCardData
} from '@renderer/components/molecules/PatientInfoCard'
import { useEncounterDetail } from '@renderer/hooks/query/use-encounter'

type PatientNameEntry = {
  text?: string
  given?: string[]
  family?: string
}

type PatientIdentifier = {
  system?: string
  value?: string
}

interface PatientInfo {
  name?: string | PatientNameEntry[]
  identifier?: PatientIdentifier[]
  mrNo?: string
}

interface QuantityInfo {
  value?: number
  unit?: string
}

interface DispenseRequestInfo {
  quantity?: QuantityInfo
}

interface DosageInstructionEntry {
  text?: string
}

interface MedicationInfo {
  id?: number
  name?: string
  stock?: number
  uom?: string | null
}

interface GroupIdentifierInfo {
  system?: string
  value?: string
}

interface CategoryInfo {
  text?: string
  code?: string
}

interface MedicationRequestDetail {
  id?: number
  status: string
  intent: string
  priority?: string
  patientId: string
  encounterId?: string | null
  authoredOn?: string
  patient?: PatientInfo
  medication?: MedicationInfo
  item?: { nama?: string; kode?: string; itemCategoryId?: number | null } | null
  itemId?: number | null
  groupIdentifier?: GroupIdentifierInfo | null
  category?: CategoryInfo[] | null
  note?: string | null
  dosageInstruction?: DosageInstructionEntry[] | null
  dispenseRequest?: DispenseRequestInfo | null
  supportingInformation?: any[] | null
}

interface BackendDetailResult {
  success: boolean
  data?: MedicationRequestDetail
  error?: string
}

interface DispenseCreateResult {
  success: boolean
  data?: unknown
  error?: string
}

interface TableRow {
  key: string
  jenis: string
  namaObat: string
  quantityDiminta?: number
  unitDiminta?: string
  instruksi?: string
  stokSaatIni?: number
  unitStok?: string | null
  quantityDiambil?: number
  medicationRequestId?: number
  batch?: string
  expiryDate?: string
  kodeItem?: string
  children?: TableRow[]
}

interface MedicationDispenseQuantityInfo {
  value?: number
  unit?: string
}

interface MedicationDispenseForSummary {
  id?: number
  authorizingPrescriptionId?: number | null
  status?: string
  quantity?: MedicationDispenseQuantityInfo | null
}

interface MedicationDispenseListResultForSummary {
  success: boolean
  data?: MedicationDispenseForSummary[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
  error?: string
}

interface InventoryStockItem {
  kodeItem: string
  namaItem: string
  unit: string
  stockIn: number
  stockOut: number
  availableStock: number
}

interface InventoryStockResponse {
  success: boolean
  result?: InventoryStockItem[]
  message?: string
}

interface LocationItemStock {
  kodeItem: string
  namaItem: string
  unit: string
  stockIn: number
  stockOut: number
  availableStock: number
}

interface LocationStockSummary {
  id: string
  kodeLokasi: string
  stockIn: number
  stockOut: number
  availableStock: number
  items: LocationItemStock[]
}

interface InventoryStockByLocationResponse {
  success: boolean
  result?: LocationStockSummary[]
  message?: string
}

interface ItemCategoryAttributes {
  id?: number
  name?: string | null
}

interface ItemCategoryListResponse {
  success: boolean
  result?: ItemCategoryAttributes[]
  message?: string
}

interface ItemAttributes {
  id?: number
  itemCategoryId?: number | null
  category?: {
    id?: number
    name?: string | null
  } | null
}

interface ItemListResponse {
  success: boolean
  result?: ItemAttributes[]
  message?: string
}

function getPatientDisplayName(patient?: PatientInfo): string {
  if (!patient) return '-'

  if (typeof patient.name === 'string') {
    const trimmed = patient.name.trim()
    if (trimmed.length > 0) {
      const identifiers = Array.isArray(patient.identifier) ? patient.identifier : []
      const mrnComp =
        identifiers.find((id) => id.system === 'local-mrn')?.value || patient.mrNo || ''
      return mrnComp ? `${trimmed} (${mrnComp})` : trimmed
    }
  }

  const firstName: PatientNameEntry | undefined =
    Array.isArray(patient.name) && patient.name.length > 0 ? patient.name[0] : undefined

  const nameFromText = firstName?.text?.trim() ?? ''
  const nameFromGivenFamily = [firstName?.given?.[0], firstName?.family]
    .filter((v) => typeof v === 'string' && v.trim().length > 0)
    .join(' ')
    .trim()

  const baseName = nameFromText || nameFromGivenFamily || 'Tanpa nama'

  const identifiers = Array.isArray(patient.identifier) ? patient.identifier : []
  const mrn = identifiers.find((id) => id.system === 'local-mrn')?.value || patient.mrNo || ''

  if (mrn) return `${baseName} (${mrn})`
  return baseName
}

function getRequestStatusTag(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    active: { label: 'Aktif', color: 'green' },
    completed: { label: 'Selesai', color: 'blue' },
    cancelled: { label: 'Dibatalkan', color: 'red' },
    'on-hold': { label: 'Tertunda', color: 'orange' },
    draft: { label: 'Draf', color: 'default' },
    'entered-in-error': { label: 'Void', color: 'volcano' }
  }
  const cfg = map[status] || { label: status, color: 'default' }
  return <Tag color={cfg.color}>{cfg.label}</Tag>
}

function getInstructionText(dosage?: DosageInstructionEntry[] | null): string {
  if (!Array.isArray(dosage) || dosage.length === 0) return ''
  return dosage[0]?.text ?? ''
}

const BatchSelectCell = ({
  kodeItem,
  value,
  onChange
}: {
  kodeItem?: string
  value?: string
  onChange: (val: string) => void
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ['inventoryStock', 'listBatchesByLocation', kodeItem, 'FARM'],
    enabled: !!kodeItem,
    queryFn: async () => {
      const api = window.api?.query as any
      if (!api?.inventoryStock?.listBatchesByLocation) return { result: [] }
      return api.inventoryStock.listBatchesByLocation({ kodeItem, kodeLokasi: 'FARM' })
    }
  })

  if (!kodeItem) return <span>-</span>

  const batches = Array.isArray(data?.result) ? data.result : []

  if (isLoading) return <span>Memuat...</span>
  if (batches.length === 0) return <span className="text-gray-400">Tidak ada batch</span>

  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder="Pilih Expire"
      style={{ width: 180 }}
      allowClear
      options={batches.map((b: any) => ({
        label: `${b.expiryDate ? dayjs(b.expiryDate).format('YYYY-MM-DD') : '-'} (${b.availableStock})`,
        value: `${b.batchNumber || ''}|${b.expiryDate || 'null'}`
      }))}
    />
  )
}

export default function MedicationDispenseFromRequest() {
  const { message, modal } = App.useApp()
  const params = useParams()
  const navigate = useNavigate()
  const idParam = params.id
  const requestId = typeof idParam === 'string' ? Number(idParam) : NaN
  const [quantityOverrides, setQuantityOverrides] = useState<Record<number, number>>({})
  const [telaahResults, setTelaahResults] = useState<TelaahResults>({})
  const [selectedBatches, setSelectedBatches] = useState<Record<string, string>>({})
  const [penyiapObatId, setPenyiapObatId] = useState<number | undefined>()
  const [pelabelObatId, setPelabelObatId] = useState<number | undefined>()
  const [penyerahObatId, setPenyerahObatId] = useState<number | undefined>()
  const [hubunganPenerima, setHubunganPenerima] = useState<string>('Sendiri')
  const [namaPenerima, setNamaPenerima] = useState<string>('')

  const { data, isLoading } = useQuery({
    queryKey: ['medicationRequest', 'detail', requestId],
    queryFn: async (): Promise<BackendDetailResult> => {
      if (!Number.isFinite(requestId)) {
        throw new Error('ID resep tidak valid')
      }
      const fn = window.api?.query?.medicationRequest?.getById
      if (!fn) throw new Error('API MedicationRequest tidak tersedia.')
      return fn({ id: requestId }) as Promise<BackendDetailResult>
    },
    enabled: Number.isFinite(requestId)
  })

  const baseDetail: MedicationRequestDetail | undefined = data?.data

  const { data: encounterResponse, isLoading: isEncounterLoading } = useEncounterDetail(
    baseDetail?.encounterId || undefined
  )

  const patientCardData = useMemo<PatientInfoCardData | null>(() => {
    if (!baseDetail) return null
    const enc = encounterResponse?.result as any

    const birthDate = enc?.patient?.birthDate || (baseDetail.patient as any)?.birthDate
    const age = birthDate ? dayjs().diff(dayjs(birthDate), 'year') : 0

    return {
      patient: {
        medicalRecordNumber: enc?.patient?.medicalRecordNumber || baseDetail.patient?.mrNo || '',
        name: enc?.patient?.name || getPatientDisplayName(baseDetail.patient).split(' (')[0] || '',
        nik: enc?.patient?.nik || (baseDetail.patient as any)?.nik || '',
        gender: enc?.patient?.gender || (baseDetail.patient as any)?.gender || '',
        age: age,
        address: enc?.patient?.address || (baseDetail.patient as any)?.address || '',
        religion: enc?.patient?.religion || (baseDetail.patient as any)?.religion || ''
      },
      poli: {
        name: enc?.queueTicket?.poli?.name || enc?.serviceUnitCodeId || '-'
      },
      doctor: {
        name: enc?.queueTicket?.practitioner?.namaLengkap || '-'
      },
      visitDate: enc?.visitDate || enc?.startTime || baseDetail.authoredOn,
      paymentMethod: enc?.queueTicket?.assuranceCodeId || enc?.queueTicket?.assuranceType || 'Umum',
      status: undefined, // Sembunyikan status tag karena di farmasi status antrian poli kurang relevan
      allergies: enc?.patient?.allergies || (baseDetail.patient as any)?.allergies || '-'
    }
  }, [baseDetail, encounterResponse?.result])
  const detail: MedicationRequestDetail | undefined = baseDetail

  const { data: groupListData } = useQuery({
    queryKey: [
      'medicationRequest',
      'groupListForDispense',
      requestId,
      baseDetail?.groupIdentifier?.value
    ],
    enabled: Number.isFinite(requestId) && !!baseDetail?.groupIdentifier?.value,
    queryFn: async () => {
      if (!baseDetail || !baseDetail.groupIdentifier?.value) {
        return [] as MedicationRequestDetail[]
      }
      const api = window.api?.query as {
        medicationRequest?: {
          list: (args: { patientId?: string; limit?: number }) => Promise<{
            success: boolean
            data?: MedicationRequestDetail[]
            pagination?: unknown
            message?: string
          }>
        }
      }
      const fn = api?.medicationRequest?.list
      if (!fn) throw new Error('API MedicationRequest tidak tersedia.')
      const res = await fn({ patientId: baseDetail.patientId, limit: 1000 })
      const list = Array.isArray(res.data) ? res.data : []
      return list.filter(
        (item) => item.groupIdentifier?.value === baseDetail.groupIdentifier?.value
      ) as MedicationRequestDetail[]
    }
  })

  const { data: dispenseListData } = useQuery({
    queryKey: ['medicationDispense', 'forCreateFromRequest', requestId],
    enabled: Number.isFinite(requestId),
    queryFn: async () => {
      const api = window.api?.query as {
        medicationDispense?: {
          list: (args?: { limit?: number }) => Promise<MedicationDispenseListResultForSummary>
        }
      }
      const fn = api?.medicationDispense?.list
      if (!fn) throw new Error('API MedicationDispense tidak tersedia.')
      return fn({ limit: 1000 })
    }
  })

  const { data: inventoryStockByLocation } = useQuery<InventoryStockByLocationResponse>({
    queryKey: ['inventoryStock', 'by-location', 'FARM'],
    queryFn: () => {
      const api = window.api?.query as {
        inventoryStock?: {
          listByLocation: (args: {
            kodeLokasi: string
            items?: number
            depth?: number
          }) => Promise<{
            success: boolean
            result?: LocationStockSummary[]
            message?: string
          }>
        }
      }
      const fn = api?.inventoryStock?.listByLocation
      if (!fn) throw new Error('API stok per lokasi tidak tersedia.')
      return fn({ kodeLokasi: 'FARM', items: 1000, depth: 1 })
    }
  })

  const itemApi = (
    window.api?.query as {
      item?: { list: () => Promise<ItemListResponse> }
    }
  ).item

  const { data: itemSource } = useQuery<ItemListResponse>({
    queryKey: ['item', 'list', 'for-medication-dispense-from-request'],
    queryFn: () => {
      const fn = itemApi?.list
      if (!fn) throw new Error('API item tidak tersedia.')
      return fn()
    }
  })

  const { data: itemCategorySource } = useQuery<ItemCategoryListResponse>({
    queryKey: ['itemCategory', 'list', 'for-medication-dispense-from-request'],
    queryFn: () => {
      const api = window.api?.query as {
        medicineCategory?: { list: () => Promise<ItemCategoryListResponse> }
      }
      const fn = api?.medicineCategory?.list
      if (!fn) throw new Error('API kategori item tidak tersedia.')
      return fn()
    }
  })

  const { data: employeeData } = useQuery({
    queryKey: ['kepegawaian', 'list', 'for-medication-dispense-from-request'],
    queryFn: async () => {
      const fn = window.api?.query?.kepegawaian?.list
      if (!fn) return { success: false, result: [] }
      return fn()
    }
  })

  const employeeOptions = useMemo(() => {
    const source = Array.isArray(employeeData?.result)
      ? (employeeData.result as Array<{ id?: number; namaLengkap?: string }>)
      : []
    return source
      .filter(
        (e): e is { id: number; namaLengkap: string } =>
          typeof e.id === 'number' && typeof e.namaLengkap === 'string'
      )
      .map((e) => ({ value: e.id, label: e.namaLengkap }))
  }, [employeeData])

  const { data: medicineData } = useQuery({
    queryKey: ['medicine', 'list'],
    queryFn: async () => {
      const fn = window.api?.query?.medicine?.list
      if (!fn) return { success: false, result: [] }
      return fn({ limit: 1000 })
    }
  })

  const { data: itemData } = useQuery({
    queryKey: ['item', 'list'],
    queryFn: async () => {
      const fn = window.api?.query?.item?.list
      if (!fn) return { success: false, result: [] }
      return fn({ limit: 1000 })
    }
  })

  const medicineMap = useMemo(() => {
    const map = new Map<number, string>()
    if (medicineData?.success && Array.isArray(medicineData.result)) {
      medicineData.result.forEach((m: any) => {
        if (m.id && m.name) map.set(m.id, m.name)
      })
    }
    return map
  }, [medicineData])

  const itemMap = useMemo(() => {
    const map = new Map<number, string>()
    if (itemData?.success && Array.isArray(itemData.result)) {
      itemData.result.forEach((i: any) => {
        if (i.id && i.nama) map.set(i.id, i.nama)
      })
    }
    return map
  }, [itemData])

  const itemCategoryNameById = useMemo(() => {
    const entries: ItemCategoryAttributes[] = Array.isArray(itemCategorySource?.result)
      ? itemCategorySource.result
      : []
    const map = new Map<number, string>()
    for (const cat of entries) {
      if (typeof cat.id === 'number' && typeof cat.name === 'string' && cat.name.length > 0) {
        map.set(cat.id, cat.name)
      }
    }
    return map
  }, [itemCategorySource?.result])

  const itemCategoryIdByItemId = useMemo(() => {
    const source: ItemAttributes[] = Array.isArray(itemSource?.result) ? itemSource.result : []
    const map = new Map<number, number>()
    for (const item of source) {
      if (typeof item.id !== 'number') continue
      const directId =
        typeof item.itemCategoryId === 'number'
          ? item.itemCategoryId
          : typeof item.category?.id === 'number'
            ? item.category.id
            : undefined
      if (typeof directId === 'number') {
        map.set(item.id, directId)
      }
    }
    return map
  }, [itemSource?.result])

  const stockMapFromInventory = useMemo(() => {
    const map = new Map<string, { availableStock: number; unit: string }>()
    const byLocation: LocationStockSummary[] = Array.isArray(inventoryStockByLocation?.result)
      ? inventoryStockByLocation.result!
      : []
    const farm = byLocation.find((l) => l.kodeLokasi === 'FARM')
    const items = farm?.items ?? []
    for (const it of items) {
      const kodeItem = it.kodeItem.trim().toUpperCase()
      if (!kodeItem) continue
      const availableStock = typeof it.availableStock === 'number' ? it.availableStock : 0
      const unit = it.unit
      map.set(kodeItem, { availableStock, unit })
    }
    return map
  }, [inventoryStockByLocation?.result])

  const isInternalRequest = useMemo(() => {
    if (!detail) return false
    const patientMrn = detail.patient?.mrNo || ''
    const isExternalPatient = patientMrn.startsWith('L-MRN-')
    const hasEncounter = !!detail.encounterId

    // Internal if has encounter AND is not explicitly an external-style MRN
    return hasEncounter && !isExternalPatient
  }, [detail])

  const allCriteriaMet = useMemo(() => {
    const criteriaKeys: (keyof TelaahResults)[] = [
      'tanggalResep',
      'parafDokter',
      'identitasPasien',
      'bbTb',
      'namaObat',
      'kekuatan',
      'jumlahObat',
      'signa',
      'duplikasi',
      'kontraindikasi',
      'interaksi',
      'dosisLazim',
      'alergi',
      'infoKesesuaianIdentitas',
      'infoNamaDosisJumlah',
      'infoCaraGuna',
      'infoEso'
    ]
    return criteriaKeys.every((key) => telaahResults[key] === true)
  }, [telaahResults])

  const createDispenseMutation = useMutation({
    mutationKey: ['medicationDispense', 'createFromRequest', requestId],
    mutationFn: async (): Promise<DispenseCreateResult> => {
      const fn = window.api?.query?.medicationDispense?.createFromRequest
      if (!fn) {
        console.error('DEBUG: API createFromRequest not available')
        throw new Error('API MedicationDispense tidak tersedia.')
      }
      const recordsForGroup: MedicationRequestDetail[] = (
        Array.isArray(groupListData) && groupListData.length > 0 ? groupListData : [detail]
      ).filter((r): r is MedicationRequestDetail => !!r)

      const toProcess: { record: MedicationRequestDetail; quantityValue: number; unit?: string }[] =
        []
      for (const record of recordsForGroup) {
        if (!record) continue
        if (record.status === 'completed') continue
        if (typeof record.id !== 'number' || !Number.isFinite(record.id)) continue
        const quantityFromRequest = record.dispenseRequest?.quantity?.value
        const unitFromRequest = record.dispenseRequest?.quantity?.unit
        const overrideForRecord =
          typeof record.id === 'number' ? quantityOverrides[record.id] : undefined
        const resolvedQuantity =
          typeof overrideForRecord === 'number' ? overrideForRecord : quantityFromRequest

        if (typeof resolvedQuantity !== 'number' || resolvedQuantity <= 0) {
          throw new Error('Qty Diambil harus lebih dari 0')
        }
        toProcess.push({
          record,
          quantityValue: resolvedQuantity,
          unit: unitFromRequest
        })
      }

      if (toProcess.length === 0) {
        console.warn('DEBUG: No records to process')
        throw new Error('Tidak ada resep yang dapat diproses.')
      }

      const mappedBatches: Record<string, string> = {}
      for (const [rowKey, batchValue] of Object.entries(selectedBatches)) {
        const findInTable = (rows: TableRow[]): TableRow | undefined => {
          for (const r of rows) {
            if (r.key === rowKey) return r
            if (r.children) {
              const found = findInTable(r.children)
              if (found) return found
            }
          }
          return undefined
        }
        const row = findInTable(tableData)
        if (row?.kodeItem && batchValue) {
          mappedBatches[row.kodeItem] = batchValue
        }
      }

      let lastResult: DispenseCreateResult | undefined
      for (const item of toProcess) {
        const args = {
          medicationRequestId: item.record.id as number,
          quantity: {
            value: item.quantityValue,
            unit: item.unit
          },
          selectedBatches: mappedBatches,
          telaahResults,
          penyiapObatId,
          pelabelObatId,
          penyerahObatId,
          namaPenerima: hubunganPenerima === 'Sendiri' ? '' : namaPenerima,
          hubunganPenerima
        }
        console.log('DEBUG: Calling API with args', args)
        const result = await window.api.query.medicationDispense.createFromRequest(args as any)
        console.log('DEBUG: API Result', result)

        if (!result.success) {
          const errorMessage = result.error || 'Gagal membuat MedicationDispense'
          console.error('DEBUG: API Failed', errorMessage)
          throw new Error(errorMessage)
        }
        lastResult = result
      }
      if (!lastResult) {
        console.error('DEBUG: No lastResult')
        throw new Error('Gagal membuat dispense dari resep.')
      }
      return lastResult
    },
    onSuccess: (result) => {
      console.log('DEBUG: Mutation onSuccess', result)
      if (!result.success) {
        modal.error({ title: 'Gagal', content: result.error || 'Gagal membuat MedicationDispense' })
        return
      }
      const recordsForGroup: MedicationRequestDetail[] =
        Array.isArray(groupListData) && groupListData.length > 0
          ? groupListData
          : detail
            ? [detail]
            : []
      const hasOnlyItemRequests =
        recordsForGroup.length > 0 &&
        recordsForGroup.every((record) => {
          const hasValidItemId = typeof record.itemId === 'number' && record.itemId > 0
          const hasMedicationLink = typeof record.medication?.id === 'number'
          return hasValidItemId && !hasMedicationLink
        })
      if (hasOnlyItemRequests) {
        message.success(
          'Dispense item berhasil dibuat. Lanjutkan serahkan obat dari daftar Medication Dispense.'
        )
        navigate('/dashboard/medicine/medication-dispenses')
        return
      }
      message.success('Dispense berhasil dibuat dari resep')
      navigate('/dashboard/medicine/medication-dispenses')
    },
    onError: (error) => {
      console.error('DEBUG: Mutation onError', error)
      const msg = error instanceof Error ? error.message : String(error)
      modal.error({ title: 'Gagal', content: msg || 'Gagal memproses dispense' })
    }
  })

  const completedQuantityByRequestId = useMemo(() => {
    const map = new Map<number, number>()
    const source: MedicationDispenseForSummary[] = Array.isArray(dispenseListData?.data)
      ? dispenseListData.data
      : []

    source.forEach((item) => {
      const reqId = item.authorizingPrescriptionId
      if (typeof reqId !== 'number') return
      if (item.status !== 'completed') return
      const qty = item.quantity?.value
      if (typeof qty !== 'number') return
      const prev = map.get(reqId) ?? 0
      map.set(reqId, prev + qty)
    })

    return map
  }, [dispenseListData?.data])

  const tableData: TableRow[] = useMemo(() => {
    if (!detail) return []

    const records: MedicationRequestDetail[] =
      Array.isArray(groupListData) && groupListData.length > 0 ? groupListData : [detail]

    console.log('DEBUG [MedicationDispenseFromRequest] detail:', detail)
    console.log('DEBUG [MedicationDispenseFromRequest] records:', records)

    const rows: TableRow[] = []

    records.forEach((record) => {
      const quantityValue = record.dispenseRequest?.quantity?.value
      const quantityUnit = record.dispenseRequest?.quantity?.unit
      const instruksi = getInstructionText(record.dosageInstruction)
      const isItem = typeof record.itemId === 'number' && record.itemId > 0
      let stokSaatIni: number | undefined
      let unitStok: string | null = null
      if (isItem) {
        const itemFromData = Array.isArray(itemData?.result)
          ? (itemData.result as any[]).find((it) => it.id === record.itemId)
          : null
        const kodeRaw =
          typeof itemFromData?.kode === 'string'
            ? itemFromData.kode
            : typeof record.item?.kode === 'string'
              ? record.item.kode
              : ''
        const kode = kodeRaw.trim().toUpperCase()
        if (kode) {
          const stockInfo = stockMapFromInventory.get(kode)
          if (stockInfo) {
            stokSaatIni = stockInfo.availableStock
            unitStok = stockInfo.unit
          }
        }
      } else {
        stokSaatIni =
          typeof record.medication?.stock === 'number' ? record.medication.stock : undefined
        unitStok = record.medication?.uom ?? null
      }

      let jenis: string
      const isCompound =
        record.category?.some((c) => c.code === 'racikan' || c.text?.toLowerCase() === 'racikan') ??
        false

      if (isItem) {
        const itemIdForRow =
          typeof record.itemId === 'number' && record.itemId > 0 ? record.itemId : undefined
        let resolvedCategoryName: string | undefined
        if (typeof itemIdForRow === 'number') {
          const mappedCategoryId = itemCategoryIdByItemId.get(itemIdForRow)
          if (typeof mappedCategoryId === 'number') {
            const mappedName = itemCategoryNameById.get(mappedCategoryId)
            if (mappedName && mappedName.length > 0) {
              resolvedCategoryName = mappedName
            }
          }
        }
        if (!resolvedCategoryName) {
          const rawCategoryId =
            typeof record.item?.itemCategoryId === 'number' ? record.item.itemCategoryId : undefined
          if (typeof rawCategoryId === 'number') {
            const fallbackName = itemCategoryNameById.get(rawCategoryId)
            if (fallbackName && fallbackName.length > 0) {
              resolvedCategoryName = fallbackName
            }
          }
        }
        jenis =
          resolvedCategoryName && resolvedCategoryName.length > 0 ? resolvedCategoryName : 'Item'
      } else if (isCompound) {
        jenis = 'Racikan'
      } else {
        jenis = 'Obat Biasa'
      }

      const racikanTitleMatch = isCompound ? record.note?.match(/^\[Racikan:([^\]]+)\]/) : null
      const racikanName =
        racikanTitleMatch && racikanTitleMatch[1] ? racikanTitleMatch[1].trim() : undefined

      const itemFromDataName = Array.isArray(itemData?.result)
        ? (itemData.result as any[]).find((it) => it.id === record.itemId)?.nama
        : undefined
      const namaObat = isItem
        ? (itemFromDataName ?? record.item?.nama ?? '-')
        : isCompound
          ? (racikanName ?? record.medication?.name ?? '-')
          : (record.medication?.name ?? '-')

      const medicationRequestId =
        typeof record.id === 'number' && Number.isFinite(record.id) ? record.id : undefined
      const overrideForRecord =
        typeof medicationRequestId === 'number' ? quantityOverrides[medicationRequestId] : undefined

      const prescribed = typeof quantityValue === 'number' ? quantityValue : undefined
      let remainingForRecord: number | undefined

      if (typeof prescribed === 'number' && typeof medicationRequestId === 'number') {
        const completed = completedQuantityByRequestId.get(medicationRequestId) ?? 0
        const remaining = prescribed - completed
        if (remaining <= 0) {
          return
        }
        remainingForRecord = remaining
      }

      const row: TableRow = {
        key: `${record.id ?? record.patientId}`,
        jenis,
        namaObat,
        quantityDiminta:
          typeof remainingForRecord === 'number' && remainingForRecord >= 0
            ? remainingForRecord
            : prescribed,
        unitDiminta: quantityUnit,
        instruksi,
        stokSaatIni,
        unitStok,
        quantityDiambil:
          typeof overrideForRecord === 'number'
            ? overrideForRecord
            : (() => {
                if (typeof remainingForRecord === 'number' && remainingForRecord > 0) {
                  return remainingForRecord
                }
                return prescribed
              })(),
        medicationRequestId,
        kodeItem: ''
      }

      if (isItem) {
        const itemFromData = Array.isArray(itemData?.result)
          ? (itemData.result as any[]).find((it) => it.id === record.itemId)
          : null
        const kodeRaw =
          typeof itemFromData?.kode === 'string'
            ? itemFromData.kode
            : typeof record.item?.kode === 'string'
              ? record.item.kode
              : ''
        row.kodeItem = kodeRaw.trim().toUpperCase()
      }

      // Extract batch info for non-compound items
      if (isItem && !isCompound && Array.isArray(record.supportingInformation)) {
        const batchInfo = (record.supportingInformation as Array<Record<string, unknown>>).find(
          (info) => info.resourceType === 'StockBatch'
        )
        if (batchInfo) {
          if (typeof batchInfo.batchNumber === 'string') row.batch = batchInfo.batchNumber
          if (typeof batchInfo.expiryDate === 'string') row.expiryDate = batchInfo.expiryDate
        }
      }

      if (isCompound && Array.isArray(record.supportingInformation)) {
        const ingredients = record.supportingInformation.filter(
          (info: any) =>
            info.resourceType === 'Ingredient' ||
            info.itemId ||
            info.medicationId ||
            info.item_id ||
            info.medication_id
        )

        if (ingredients.length > 0) {
          row.children = ingredients.map((ing: any, idx: number) => {
            const medId = ing.medicationId || ing.medication_id
            const itemId = ing.itemId || ing.item_id
            let ingredientName = ing.name

            if (!ingredientName) {
              if (medId && medicineMap.has(Number(medId))) {
                ingredientName = medicineMap.get(Number(medId))
              } else if (itemId && itemMap.has(Number(itemId))) {
                ingredientName = itemMap.get(Number(itemId))
              }
            }

            let ingStock: number | undefined
            let ingUnit: string | undefined
            if (itemId) {
              const item = Array.isArray(itemData?.result)
                ? (itemData.result as any[]).find((it) => it.id === Number(itemId))
                : null
              const kode = (item?.kode || '').trim().toUpperCase()
              if (kode) {
                const s = stockMapFromInventory.get(kode)
                if (s) {
                  ingStock = s.availableStock
                  ingUnit = s.unit
                }
              }
            }

            return {
              key: `${record.id ?? ''}-ing-${idx}`,
              jenis: 'Komposisi',
              namaObat: ingredientName ?? (ing.note ? `Komposisi (${ing.note})` : 'Komposisi'),
              quantityDiminta: ing.quantity,
              unitDiminta: ing.unitCode,
              instruksi: ing.note || ing.instruction,
              stokSaatIni: ingStock,
              unitStok: ingUnit,
              quantityDiambil: ing.quantity,
              medicationRequestId: undefined,
              batch:
                typeof ing.batchNumber === 'string' && ing.batchNumber.trim().length > 0
                  ? ing.batchNumber.trim()
                  : undefined,
              kodeItem: itemId
                ? (
                    (Array.isArray(itemData?.result)
                      ? (itemData.result as any[]).find((it) => it.id === Number(itemId))
                      : null
                    )?.kode || ''
                  )
                    .trim()
                    .toUpperCase()
                : undefined
            }
          })
        }
      }

      rows.push(row)
    })

    return rows
  }, [
    detail,
    groupListData,
    stockMapFromInventory,
    quantityOverrides,
    completedQuantityByRequestId,
    medicineMap,
    itemMap
  ])

  const isOutOfStockForCurrentQuantity = useMemo(() => {
    const checkRow = (row: TableRow): boolean => {
      if (typeof row.quantityDiambil === 'number' && typeof row.stokSaatIni === 'number') {
        if (row.quantityDiambil > row.stokSaatIni) return true
      }
      if (row.children) {
        return row.children.some(checkRow)
      }
      return false
    }
    return tableData.some(checkRow)
  }, [tableData])

  const isPrescriptionFulfilled = useMemo(() => {
    const records: MedicationRequestDetail[] =
      Array.isArray(groupListData) && groupListData.length > 0
        ? groupListData
        : detail
          ? [detail]
          : []

    if (records.length === 0) return false

    for (const record of records) {
      if (record.status === 'completed') {
        continue
      }
      const prescribed = record.dispenseRequest?.quantity?.value
      if (typeof prescribed !== 'number') {
        return false
      }
      const medicationRequestId =
        typeof record.id === 'number' && Number.isFinite(record.id) ? record.id : undefined
      const completed =
        typeof medicationRequestId === 'number'
          ? (completedQuantityByRequestId.get(medicationRequestId) ?? 0)
          : 0
      if (completed < prescribed) {
        return false
      }
    }

    return true
  }, [detail, groupListData, completedQuantityByRequestId])

  const isCreateDisabled =
    isPrescriptionFulfilled || isOutOfStockForCurrentQuantity || !allCriteriaMet

  const createDisabledReason = (() => {
    if (isPrescriptionFulfilled) {
      return 'Resep ini sudah terpenuhi, tidak dapat membuat dispense baru.'
    }
    if (isOutOfStockForCurrentQuantity) {
      return 'Stok obat tidak cukup untuk Qty Diambil yang dipilih.'
    }
    if (!allCriteriaMet) {
      return 'Harap selesaikan Telaah Administrasi terlebih dahulu.'
    }
    return undefined
  })()

  const columns = [
    { title: 'Kategori Item', dataIndex: 'jenis', key: 'jenis' },
    { title: 'Item', dataIndex: 'namaObat', key: 'namaObat' },
    {
      title: 'Expire',
      key: 'batchExpire',
      render: (_: unknown, row: TableRow) => {
        return (
          <BatchSelectCell
            kodeItem={row.kodeItem}
            value={selectedBatches[row.key]}
            onChange={(val) => setSelectedBatches((prev) => ({ ...prev, [row.key]: val }))}
          />
        )
      }
    },
    { title: 'Qty Diminta', dataIndex: 'quantityDiminta', key: 'quantityDiminta' },
    { title: 'Satuan', dataIndex: 'unitDiminta', key: 'unitDiminta' },
    { title: 'Instruksi / Kekuatan', dataIndex: 'instruksi', key: 'instruksi' },
    {
      title: 'Qty Diambil',
      dataIndex: 'quantityDiambil',
      key: 'quantityDiambil',
      render: (_: number | undefined, row: TableRow) => {
        if (typeof row.medicationRequestId !== 'number') {
          return row.quantityDiambil ?? row.quantityDiminta ?? null
        }
        const currentOverride = quantityOverrides[row.medicationRequestId]
        const baseValue =
          typeof row.quantityDiambil === 'number' ? row.quantityDiambil : row.quantityDiminta
        const current = typeof currentOverride === 'number' ? currentOverride : baseValue
        return (
          <InputNumber
            min={0}
            value={current}
            onChange={(val) => {
              if (typeof val === 'number') {
                setQuantityOverrides((prev) => ({
                  ...prev,
                  [row.medicationRequestId as number]: val
                }))
              } else {
                setQuantityOverrides((prev) => {
                  const next = { ...prev }
                  delete next[row.medicationRequestId as number]
                  return next
                })
              }
            }}
          />
        )
      }
    }
  ]

  const patientName = getPatientDisplayName(detail?.patient)
  const getPatientTypeLabel = () => {
    if (!detail) return ''
    const mrn = detail.patient?.mrNo || ''
    if (mrn.startsWith('L-MRN-')) return 'Pasien Luar'

    const encType = (detail as any).encounter?.encounterType
    if (encType === 'IMP' || encType === 'inpatient') return 'Rawat Inap'
    if (encType === 'AMB' || encType === 'ambulatory') return 'Rawat Jalan'
    if (encType === 'EMER' || encType === 'emergency') return 'IGD'

    if (detail.encounterId) return 'Rawat Jalan'
    return 'Pasien Luar'
  }
  const patientLabel = detail ? `${getPatientTypeLabel()} / ${patientName || '-'}` : '-'

  const authoredOnText = detail?.authoredOn
    ? dayjs(detail.authoredOn).format('DD/MM/YYYY HH:mm')
    : '-'

  return (
    <div className="p-4 space-y-4 flex-row gap-2">
      <h2 className="text-3xl font-bold mb-2">Proses Dispense dari Resep</h2>

      <div>
        {patientCardData ? (
          <PatientInfoCard patientData={patientCardData} sections={{ showIdentityNumber: false }} />
        ) : (
          <Card loading={isLoading || isEncounterLoading}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Pasien">{patientLabel}</Descriptions.Item>
              <Descriptions.Item label="Status Resep">
                {detail ? getRequestStatusTag(detail.status) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Tanggal Resep">{authoredOnText}</Descriptions.Item>
            </Descriptions>
          </Card>
        )}
      </div>

      <div>
        {isOutOfStockForCurrentQuantity && (
          <Alert
            type="error"
            showIcon
            message="Stok Tidak Cukup"
            description="Terdapat item atau bahan obat yang stoknya tidak mencukupi untuk jumlah yang akan diambil."
          />
        )}
      </div>

      <div>
        <Card title="Obat dalam Resep">
          <Table<TableRow>
            dataSource={tableData}
            columns={columns}
            pagination={false}
            rowKey="key"
            size="small"
          />
        </Card>
      </div>

      <div>
        <TelaahAdministrasiForm
          isInternal={isInternalRequest}
          results={telaahResults}
          onChange={setTelaahResults}
        />
      </div>

      <div>
        <Card title="Proses Penyiapan & Penyerahan" size="small">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <div className="text-xs font-bold mb-1 uppercase opacity-60">Petugas Penyiap</div>
              <Select
                className="w-full"
                placeholder="Pilih petugas penyiap"
                options={employeeOptions}
                value={penyiapObatId}
                onChange={setPenyiapObatId}
                showSearch
                optionFilterProp="label"
              />
            </Col>
            <Col xs={24} md={8}>
              <div className="text-xs font-bold mb-1 uppercase opacity-60">Petugas Pelabel</div>
              <Select
                className="w-full"
                placeholder="Pilih petugas pelabel"
                options={employeeOptions}
                value={pelabelObatId}
                onChange={setPelabelObatId}
                showSearch
                optionFilterProp="label"
              />
            </Col>
            <Col xs={24} md={8}>
              <div className="text-xs font-bold mb-1 uppercase opacity-60">Petugas Penyerah</div>
              <Select
                className="w-full"
                placeholder="Pilih petugas penyerah"
                options={employeeOptions}
                value={penyerahObatId}
                onChange={setPenyerahObatId}
                showSearch
                optionFilterProp="label"
              />
            </Col>
            <Col xs={24} md={12}>
              <div className="text-xs font-bold mb-1 uppercase opacity-60">
                Obat Diserahkan Kepada
              </div>
              <Select
                className="w-full"
                placeholder="Pilih hubungan"
                options={[
                  { value: 'Sendiri', label: 'Sendiri (Pasien)' },
                  { value: 'Suami', label: 'Suami' },
                  { value: 'Istri', label: 'Istri' },
                  { value: 'Anak', label: 'Anak' },
                  { value: 'Orang Tua', label: 'Orang Tua' },
                  { value: 'Saudara', label: 'Saudara' },
                  { value: 'Lainnya', label: 'Lainnya' }
                ]}
                value={hubunganPenerima}
                onChange={setHubunganPenerima}
              />
            </Col>
            <Col xs={24} md={12}>
              <div className="text-xs font-bold mb-1 uppercase opacity-60">Nama Penerima</div>
              <Input
                placeholder={
                  hubunganPenerima === 'Sendiri' ? 'Pasien sendiri' : 'Masukkan nama penerima'
                }
                disabled={hubunganPenerima === 'Sendiri'}
                value={hubunganPenerima === 'Sendiri' ? '' : namaPenerima}
                onChange={(e) => setNamaPenerima(e.target.value)}
              />
            </Col>
          </Row>
        </Card>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={() => navigate('/dashboard/medicine/medication-requests')}>
          Kembali ke Daftar Resep
        </Button>
        <Tooltip title={createDisabledReason}>
          <Popconfirm
            title="Konfirmasi pembuatan dispense"
            okText="Ya"
            cancelText="Tidak"
            onConfirm={() => createDispenseMutation.mutate()}
            disabled={isCreateDisabled}
          >
            <Button
              type="primary"
              loading={createDispenseMutation.isPending}
              disabled={isCreateDisabled}
            >
              Buat Dispense
            </Button>
          </Popconfirm>
        </Tooltip>
      </div>
      {isPrescriptionFulfilled && (
        <div className="mt-2 text-sm text-green-600">
          Resep ini sudah terpenuhi, tidak dapat membuat dispense baru.
        </div>
      )}
    </div>
  )
}
