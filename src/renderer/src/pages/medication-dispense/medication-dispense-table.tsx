import {
  Modal,
  Button,
  Input,
  Table,
  Tag,
  Dropdown,
  MenuProps,
  App as AntdApp,
  Card,
  Spin,
  theme
} from 'antd'
import {
  SyncOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MedicineBoxOutlined,
  ReloadOutlined,
  FileTextOutlined,
  SearchOutlined
} from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import dayjs from 'dayjs'
import { queryClient } from '@renderer/query-client'
import { printMedicationLabels } from './component/print-medication-label'

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

interface DosageInstructionEntry {
  text?: string
}

interface MedicationInfo {
  name?: string
  stock?: number
  uom?: string
}

interface PerformerInfo {
  name?: string
}

interface CategoryEntryInfo {
  text?: string
  code?: string
}

interface AuthorizingPrescriptionInfo {
  id?: number
  note?: string | null
  category?: CategoryEntryInfo[] | null
  medication?: MedicationInfo
  item?: {
    nama?: string
    itemCategoryId?: number | null
  } | null
  dosageInstruction?: DosageInstructionEntry[] | null
  supportingInformation?: any[] | null
  groupIdentifier?: {
    system?: string
    value?: string
  } | null
}

interface MedicationDispenseAttributes {
  id?: number
  status: string
  medicationId?: number | null
  itemId?: number | null
  patientId: string
  authorizingPrescriptionId?: number | null
  whenHandedOver?: string
  quantity?: QuantityInfo | null
  patient?: PatientInfo
  medication?: MedicationInfo
  performer?: PerformerInfo
  dosageInstruction?: DosageInstructionEntry[] | null
  authorizingPrescription?: AuthorizingPrescriptionInfo | null
  paymentStatus?: string
  encounter?: { encounterType?: string }
}

interface MedicationDispenseListArgs {
  patientId?: string
  page?: number
  limit?: number
}

interface MedicationDispenseListResult {
  success: boolean
  data?: MedicationDispenseAttributes[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
  error?: string
}

interface MedicationRequestQuantityInfo {
  value?: number
  unit?: string
}

interface MedicationRequestDispenseRequestInfo {
  quantity?: MedicationRequestQuantityInfo
}

interface MedicationRequestDetailForSummary {
  id?: number
  medication?: MedicationInfo
  dispenseRequest?: MedicationRequestDispenseRequestInfo | null
}

interface MedicationRequestDetailResult {
  success: boolean
  data?: MedicationRequestDetailForSummary
  error?: string
}

interface ItemAttributes {
  id?: number
  nama?: string
  kode?: string
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

interface DispenseItemRow {
  key: string
  id?: number
  jenis: string
  medicineName?: string
  quantity?: number
  unit?: string
  status: string
  performerName?: string
  instruksi?: string
  availableStock?: number
  fhirId?: string
  children?: DispenseItemRow[]
}

interface ParentRow {
  key: string
  patient?: PatientInfo
  status: string
  paymentStatus?: string
  handedOverAt?: string
  encounterType?: string
  items: DispenseItemRow[]
}

type StatusFilter = 'all' | 'completed' | 'return'

function getStatusLabel(status: string): string {
  if (status === 'entered-in-error') return 'return'
  if (status === 'cancelled' || status === 'stopped' || status === 'declined') return 'cancel'
  if (status === 'preparation') return 'pending'
  if (status === 'in-progress') return 'on process'
  if (status === 'on-hold') return 'hold'
  return status
}

function RowActions({ record, patient }: { record: DispenseItemRow; patient?: PatientInfo }) {
  const { message } = AntdApp.useApp()

  const updateMutation = useMutation({
    mutationKey: ['medicationDispense', 'update', 'complete'],
    mutationFn: async () => {
      if (typeof record.id !== 'number') {
        throw new Error('ID MedicationDispense tidak valid.')
      }
      const fn = window.api?.query?.medicationDispense?.update
      if (!fn) throw new Error('API MedicationDispense tidak tersedia.')
      const payload: { id: number; status: 'completed'; whenHandedOver: string } = {
        id: record.id,
        status: 'completed',
        whenHandedOver: new Date().toISOString()
      }
      const res = await fn(payload as never)
      if (!res.success) {
        throw new Error(res.error || 'Gagal memperbarui MedicationDispense')
      }
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicationDispense', 'list'] })
      message.success('Obat berhasil diserahkan')
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : String(error)
      message.error(msg || 'Gagal menyerahkan obat')
    }
  })

  const voidMutation = useMutation({
    mutationKey: ['medicationDispense', 'update', 'void'],
    mutationFn: async () => {
      if (typeof record.id !== 'number') {
        throw new Error('ID MedicationDispense tidak valid.')
      }
      const fn = window.api?.query?.medicationDispense?.update
      if (!fn) throw new Error('API MedicationDispense tidak tersedia.')
      const payload: { id: number; status: 'entered-in-error' } = {
        id: record.id,
        status: 'entered-in-error'
      }
      const res = await fn(payload as never)
      if (!res.success) {
        throw new Error(res.error || 'Gagal melakukan Return/Void MedicationDispense')
      }
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicationDispense', 'list'] })
      message.success('Dispense berhasil di-void / dikembalikan')
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : String(error)
      message.error(msg || 'Gagal melakukan Return/Void MedicationDispense')
    }
  })

  const isCompleted = record.status === 'completed'
  const isTerminal =
    record.status === 'cancelled' ||
    record.status === 'declined' ||
    record.status === 'entered-in-error'
  const quantityToDispense = typeof record.quantity === 'number' ? record.quantity : 0
  const hasStockInfo = typeof record.availableStock === 'number'
  const isStockInsufficient = hasStockInfo && quantityToDispense > (record.availableStock as number)
  const canComplete =
    !isCompleted && !isTerminal && typeof record.id === 'number' && !isStockInsufficient
  const canVoid = isCompleted && typeof record.id === 'number'
  const isKomposisi = record.jenis === 'Komposisi'

  const handlePrintLabel = () => {
    const patientLabel = getPatientDisplayName(patient)
    const name = record.medicineName ?? 'Obat'
    const quantityValue = typeof record.quantity === 'number' ? record.quantity : 0
    const unitLabel = record.unit ?? ''
    const instructionText = record.instruksi ?? ''

    const parts: string[] = []
    if (patientLabel.trim().length > 0) {
      parts.push(`Pasien: ${patientLabel}`)
    }
    parts.push(`Nama Obat: ${name}`)
    parts.push(`Qty: ${quantityValue} ${unitLabel}`.trim())
    if (instructionText.trim().length > 0) {
      parts.push(`Instruksi: ${instructionText}`)
    }

    if (parts.length === 0) {
      message.info('Data label obat tidak tersedia')
      return
    }

    const htmlLines = parts.map((line) => `<div class="line">${line}</div>`).join('')
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Label Obat</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 12px; margin: 8px; }
    .label { border: 1px solid #000; padding: 4px 8px; max-width: 320px; }
    .line { margin-bottom: 2px; }
  </style>
</head>
<body>
  <div class="label">
    ${htmlLines}
  </div>
</body>
</html>`

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const iframeWindow = iframe.contentWindow
    if (!iframeWindow) {
      message.info('Gagal menyiapkan tampilan cetak label')
      iframe.remove()
      return
    }

    const doc = iframeWindow.document
    doc.open()
    doc.write(html)
    doc.close()

    iframeWindow.focus()
    iframeWindow.print()

    setTimeout(() => {
      iframe.remove()
    }, 1000)
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex gap-2">
        {canComplete && (
          <Button
            type="primary"
            size="small"
            disabled={updateMutation.isPending || isStockInsufficient}
            loading={updateMutation.isPending}
            onClick={() => updateMutation.mutate()}
          >
            Serahkan Obat
          </Button>
        )}
        {canVoid && (
          <Button
            type="default"
            size="small"
            danger
            disabled={voidMutation.isPending}
            loading={voidMutation.isPending}
            onClick={() => {
              Modal.confirm({
                title: 'Konfirmasi Return / Void',
                content:
                  'Yakin ingin melakukan Return / Void dispense ini? Stok obat akan dikembalikan.',
                okText: 'Ya, Return / Void',
                cancelText: 'Batal',
                okButtonProps: { danger: true },
                onOk: () => voidMutation.mutate()
              })
            }}
          >
            Return / Void
          </Button>
        )}
        {!isKomposisi && (
          <Button type="default" size="small" onClick={handlePrintLabel}>
            Cetak Label
          </Button>
        )}
      </div>
      {isStockInsufficient && (
        <div className="text-xs text-red-500">
          Stok obat kosong / tidak cukup, tidak dapat menyerahkan obat.
        </div>
      )}
    </div>
  )
}

function getPatientDisplayName(patient?: PatientInfo): string {
  if (!patient) return ''

  if (typeof patient.name === 'string') {
    const trimmed = patient.name.trim()
    if (trimmed.length > 0) return trimmed
  }

  const firstName: PatientNameEntry | undefined =
    Array.isArray(patient.name) && patient.name.length > 0 ? patient.name[0] : undefined

  const nameFromText = firstName?.text?.trim() ?? ''
  const nameFromGivenFamily = [firstName?.given?.[0], firstName?.family]
    .filter((v) => typeof v === 'string' && v.trim().length > 0)
    .join(' ')
    .trim()

  const baseName = nameFromText || nameFromGivenFamily

  const identifiers = Array.isArray(patient.identifier) ? patient.identifier : []
  const localMrn = identifiers.find((id) => id.system === 'local-mrn')
  const mrn = patient.mrNo || localMrn?.value || ''

  if (baseName && mrn) return `${baseName} (${mrn})`
  if (baseName) return baseName
  if (mrn) return mrn
  return 'Tanpa nama'
}

function getInstructionText(dosage?: DosageInstructionEntry[] | null): string {
  if (!Array.isArray(dosage) || dosage.length === 0) return ''
  return dosage[0]?.text ?? ''
}

function MainRowActions({ record }: { record: ParentRow }) {
  const { message } = AntdApp.useApp()
  const [syncingSatusehat, setSyncingSatusehat] = useState(false)

  const syncItems = record.items.filter((i) => i.jenis !== 'Komposisi' && typeof i.id === 'number')
  const isAllSynced =
    syncItems.length > 0 &&
    syncItems.every((i) => typeof i.fhirId === 'string' && i.fhirId.trim().length > 0)

  const handleSyncGroup = async () => {
    if (syncItems.length === 0) {
      message.info('Tidak ada obat yang perlu disinkron')
      return
    }
    const fn = window.api?.query?.medicationDispense?.syncSatusehat
    if (!fn) {
      message.error('API syncSatusehat tidak tersedia.')
      return
    }

    setSyncingSatusehat(true)
    let successCount = 0
    let failCount = 0
    try {
      for (const item of syncItems) {
        // Lewati jika sudah tersinkron (punya fhirId)
        if (typeof item.fhirId === 'string' && item.fhirId.trim().length > 0) {
          successCount++
          continue
        }
        if (typeof item.id === 'number') {
          try {
            const res = await fn({ id: item.id })
            if (res.success) {
              successCount++
            } else {
              failCount++
              message.error(`Gagal sinkron ${item.medicineName}: ${res.error}`)
            }
          } catch (e) {
            failCount++
            const msg = e instanceof Error ? e.message : String(e)
            message.error(`Gagal sinkron ${item.medicineName}: ${msg}`)
          }
        }
      }
      if (successCount > 0 && failCount === 0) {
        message.success('Semua item dalam grup ini berhasil disinkronkan ke SatuSehat')
      } else if (successCount > 0 && failCount > 0) {
        message.warning(`Berhasil sinkron ${successCount}, namun gagal ${failCount}`)
      }
      queryClient.invalidateQueries({ queryKey: ['medicationDispense', 'list'] })
    } finally {
      setSyncingSatusehat(false)
    }
  }

  const menuItems: MenuProps['items'] = [
    {
      key: 'sync-satusehat',
      label: syncingSatusehat ? 'Sinkronisasi Satu Sehat...' : 'Sinkronisasi Satu Sehat',
      icon: <SyncOutlined spin={syncingSatusehat} />,
      disabled: syncingSatusehat || isAllSynced || syncItems.length === 0,
      onClick: handleSyncGroup
    }
  ]

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
      <Button type="text" icon={<MoreOutlined />} size="small" />
    </Dropdown>
  )
}

const columns = [
  {
    title: 'Pasien',
    dataIndex: 'patient',
    key: 'patient',
    render: (val: PatientInfo | undefined) => {
      const name = getPatientDisplayName(val)
      return name || '-'
    }
  },
  {
    title: 'Asal',
    dataIndex: 'encounterType',
    key: 'encounterType',
    render: (val: string) => {
      if (val === 'AMB') return <Tag color="green">Rawat Jalan</Tag>
      if (val === 'EMER') return <Tag color="red">IGD</Tag>
      if (val === 'IMP') return <Tag color="blue">Rawat Inap</Tag>
      return '-'
    }
  },
  {
    title: 'Status Penyerahan',
    dataIndex: 'status',
    key: 'status',
    render: (val: string) => {
      const color =
        val === 'completed'
          ? 'green'
          : val === 'cancelled' || val === 'entered-in-error'
            ? 'red'
            : 'default'
      return <Tag color={color}>{getStatusLabel(val)}</Tag>
    }
  },
  {
    title: 'Pembayaran',
    dataIndex: 'paymentStatus',
    key: 'paymentStatus',
    render: (val: string | undefined) => {
      const status = val || 'Belum Ditagihkan'
      const color = status === 'Lunas' ? 'green' : status === 'Sebagian' ? 'orange' : 'volcano'
      return <Tag color={color}>{status}</Tag>
    }
  },
  {
    title: 'Diserahkan',
    dataIndex: 'handedOverAt',
    key: 'handedOverAt'
  },
  {
    title: 'Satu Sehat',
    key: 'satusehat',
    width: 140,
    render: (_: unknown, row: ParentRow) => {
      const syncItems = row.items.filter((i) => i.jenis !== 'Komposisi' && typeof i.id === 'number')
      if (syncItems.length === 0) return <span className="text-gray-400">-</span>
      const syncedCount = syncItems.filter(
        (i) => typeof i.fhirId === 'string' && i.fhirId.trim().length > 0
      ).length
      const totalCount = syncItems.length

      if (syncedCount === totalCount) {
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Tersinkron
          </Tag>
        )
      }
      if (syncedCount > 0) {
        return (
          <Tag icon={<SyncOutlined spin />} color="warning">
            Sebagian ({syncedCount}/{totalCount})
          </Tag>
        )
      }
      return (
        <Tag icon={<CloseCircleOutlined />} color="error">
          Belum Tersinkron
        </Tag>
      )
    }
  },
  {
    title: 'Aksi',
    key: 'action',
    width: 60,
    align: 'center' as const,
    render: (_: ParentRow, r: ParentRow) => <MainRowActions record={r} />
  }
]

export function MedicationDispenseTable() {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [showOnlyPending, setShowOnlyPending] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [statusFilter, _setStatusFilter] = useState<StatusFilter>('all')

  const prescriptionIdParam = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const raw = params.get('authorizingPrescriptionId')
    if (!raw) return undefined
    const parsed = Number(raw)
    if (Number.isNaN(parsed)) return undefined
    return parsed
  }, [location.search])

  const { data, refetch, isError, isLoading } = useQuery({
    queryKey: ['medicationDispense', 'list'],
    queryFn: async () => {
      const api = window.api?.query as {
        medicationDispense?: {
          list: (args: MedicationDispenseListArgs) => Promise<MedicationDispenseListResult>
        }
      }

      const fn = api?.medicationDispense?.list
      if (!fn) throw new Error('API MedicationDispense tidak tersedia.')

      const res = await fn({})
      return res
    }
  })

  const itemApi = (
    window.api?.query as {
      item?: { list: () => Promise<ItemListResponse> }
    }
  ).item

  const { data: itemSource } = useQuery<ItemListResponse>({
    queryKey: ['item', 'list', 'for-medication-dispense'],
    queryFn: () => {
      const fn = itemApi?.list
      if (!fn) throw new Error('API item tidak tersedia.')
      return fn()
    }
  })

  const itemCategoryNameById = useMemo(() => {
    const items: ItemAttributes[] = Array.isArray(itemSource?.result) ? itemSource.result : []
    const map = new Map<number, string>()
    for (const item of items) {
      const id =
        typeof item.itemCategoryId === 'number'
          ? item.itemCategoryId
          : typeof item.category?.id === 'number'
            ? item.category.id
            : undefined
      if (typeof id !== 'number') continue
      const rawName = typeof item.category?.name === 'string' ? item.category.name : undefined
      const name = rawName ? rawName.trim() : ''
      if (!name) continue
      if (!map.has(id)) {
        map.set(id, name)
      }
    }
    return map
  }, [itemSource?.result])

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

  const itemNameById = useMemo(() => {
    const source: ItemAttributes[] = Array.isArray(itemSource?.result) ? itemSource.result : []
    const map = new Map<number, string>()
    for (const item of source) {
      if (typeof item.id === 'number' && typeof item.nama === 'string') {
        map.set(item.id, item.nama)
      }
    }
    return map
  }, [itemSource?.result])

  const { data: prescriptionDetailData } = useQuery({
    queryKey: ['medicationRequest', 'detailForDispenseSummary', prescriptionIdParam],
    enabled: typeof prescriptionIdParam === 'number',
    queryFn: async () => {
      if (typeof prescriptionIdParam !== 'number') {
        throw new Error('Prescription ID tidak valid.')
      }
      const api = window.api?.query as {
        medicationRequest?: {
          getById: (args: { id: number }) => Promise<MedicationRequestDetailResult>
        }
      }
      const fn = api?.medicationRequest?.getById
      if (!fn) throw new Error('API MedicationRequest tidak tersedia.')
      return fn({ id: prescriptionIdParam })
    }
  })

  const filtered = useMemo(() => {
    let source: MedicationDispenseAttributes[] = Array.isArray(data?.data) ? data.data : []

    if (typeof prescriptionIdParam === 'number') {
      source = source.filter((item) => item.authorizingPrescriptionId === prescriptionIdParam)
    }

    if (statusFilter === 'completed') {
      source = source.filter((item) => item.status === 'completed')
    } else if (statusFilter === 'return') {
      source = source.filter((item) => item.status === 'entered-in-error')
    }

    const q = search.trim().toLowerCase()
    const result = !q
      ? source
      : source.filter((item) => {
          const patientName = getPatientDisplayName(item.patient).toLowerCase()
          const medicineName = item.medication?.name?.toLowerCase() ?? ''
          return patientName.includes(q) || medicineName.includes(q)
        })

    return result
  }, [data?.data, search, prescriptionIdParam, statusFilter])

  const summaryForPrescription = useMemo(() => {
    if (typeof prescriptionIdParam !== 'number') return undefined

    const source: MedicationDispenseAttributes[] = Array.isArray(data?.data) ? data.data : []

    let totalCompleted = 0

    source.forEach((item) => {
      if (item.authorizingPrescriptionId !== prescriptionIdParam) return
      const qty = item.quantity?.value
      if (typeof qty !== 'number') return
      if (item.status === 'completed') {
        totalCompleted += qty
      }
    })

    const prescribedQuantity = prescriptionDetailData?.data?.dispenseRequest?.quantity?.value
    const quantityUnit = prescriptionDetailData?.data?.dispenseRequest?.quantity?.unit

    let remaining: number | undefined
    if (typeof prescribedQuantity === 'number') {
      remaining = prescribedQuantity - totalCompleted
      if (remaining < 0) {
        remaining = 0
      }
    }

    const medicationName = prescriptionDetailData?.data?.medication?.name
    const isFulfilled =
      typeof prescribedQuantity === 'number' && typeof remaining === 'number' && remaining === 0

    return {
      prescribedQuantity,
      totalCompleted,
      remaining,
      unit: quantityUnit,
      medicationName,
      isFulfilled
    }
  }, [data?.data, prescriptionDetailData, prescriptionIdParam])

  const groupedData: ParentRow[] = useMemo(() => {
    const groups = new Map<string, ParentRow>()

    filtered.forEach((item) => {
      const prescription = item.authorizingPrescription

      // Tentukan key: utamakan groupIdentifier.value (resep racikan yang sama)
      // lalu authorizingPrescriptionId, lalu fallback ke patientId-tanggal
      const groupIdVal = prescription?.groupIdentifier?.value
      const handedKey = item.whenHandedOver
        ? dayjs(item.whenHandedOver).format('YYYY-MM-DD HH:mm')
        : 'pending'

      const key = groupIdVal
        ? `grp-${groupIdVal}`
        : item.authorizingPrescriptionId
          ? `rx-${item.authorizingPrescriptionId}-${handedKey}`
          : `${item.patientId}-${handedKey}`

      const quantityValue = item.quantity?.value
      const quantityUnit = item.quantity?.unit
      const instruksi = getInstructionText(item.dosageInstruction)
      const isItem = typeof item.itemId === 'number' && item.itemId > 0
      const categories = Array.isArray(prescription?.category) ? prescription?.category : []
      const hasRacikanCategory = categories.some((cat) => {
        const text = cat.text?.toLowerCase() ?? ''
        const code = cat.code?.toLowerCase() ?? ''
        return text.includes('racikan') || code === 'compound'
      })
      const noteText = (prescription?.note ?? '').toLowerCase()
      const isRacikan = hasRacikanCategory || noteText.includes('racikan')

      let jenis: string
      if (isItem) {
        const itemIdForRow =
          typeof item.itemId === 'number' && item.itemId > 0 ? item.itemId : undefined
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
            typeof prescription?.item?.itemCategoryId === 'number'
              ? prescription.item.itemCategoryId
              : undefined
          if (typeof rawCategoryId === 'number') {
            const fallbackName = itemCategoryNameById.get(rawCategoryId)
            if (fallbackName && fallbackName.length > 0) {
              resolvedCategoryName = fallbackName
            }
          }
        }
        jenis =
          resolvedCategoryName && resolvedCategoryName.length > 0 ? resolvedCategoryName : 'Item'
      } else if (isRacikan) {
        jenis = 'Obat Racikan'
      } else {
        jenis = 'Obat Biasa'
      }

      let medicineName: string | undefined
      if (isItem) {
        const itemNameFromPrescription = prescription?.item?.nama
        medicineName = itemNameFromPrescription ?? item.medication?.name
      } else if (isRacikan) {
        const baseName = item.medication?.name ?? prescription?.medication?.name
        const rawNote = prescription?.note ?? ''
        const noteMatch = rawNote.match(/^\[Racikan:\s*([^\]]+)\]/)
        const racikanName = noteMatch?.[1]?.trim()
        medicineName = (racikanName ?? baseName ?? rawNote.trim()) || undefined
      } else {
        medicineName = item.medication?.name ?? prescription?.medication?.name
      }

      const handedOverAt = item.whenHandedOver
        ? dayjs(item.whenHandedOver).format('DD/MM/YYYY HH:mm')
        : '-'

      let children: DispenseItemRow[] | undefined

      if (groupIdVal) {
        if (
          Array.isArray(prescription?.supportingInformation) &&
          prescription.supportingInformation.length > 0
        ) {
          const ingredients = prescription.supportingInformation.filter(
            (info: any) =>
              info.resourceType === 'Ingredient' ||
              info.itemId ||
              info.item_id ||
              info.medicationId ||
              info.medication_id
          )
          if (ingredients.length > 0) {
            children = ingredients.map((ing: any, idx: number) => {
              const ingItemId = ing.itemId ?? ing.item_id
              const ingNameRaw = ing.name ?? ing.text
              let ingName = ingNameRaw
              if (!ingName && typeof ingItemId === 'number') {
                ingName = itemNameById.get(ingItemId)
              }
              return {
                key: `${key}-ing-${idx}`,
                jenis: 'Komposisi',
                medicineName: ingName ?? 'Komposisi',
                quantity: typeof ing.quantity === 'number' ? ing.quantity : undefined,
                unit: ing.unitCode ?? ing.unit,
                status: '',
                instruksi: ing.note ?? ing.instruction
              }
            })
          }
        }
      } else if (isRacikan && Array.isArray(prescription?.supportingInformation)) {
        const ingredients = prescription.supportingInformation.filter(
          (info: any) =>
            info.resourceType === 'Ingredient' ||
            info.itemId ||
            info.item_id ||
            info.medicationId ||
            info.medication_id
        )
        if (ingredients.length > 0) {
          children = ingredients.map((ing: any, idx: number) => {
            const ingItemId = ing.itemId ?? ing.item_id
            const ingNameRaw = ing.name ?? ing.text
            let ingName = ingNameRaw
            if (!ingName && typeof ingItemId === 'number') {
              ingName = itemNameById.get(ingItemId)
            }
            return {
              key: `${key}-${item.id}-ing-${idx}`,
              jenis: 'Komposisi',
              medicineName: ingName ?? 'Komposisi',
              quantity: typeof ing.quantity === 'number' ? ing.quantity : undefined,
              unit: ing.unitCode ?? ing.unit,
              status: '',
              instruksi: ing.note ?? ing.instruction
            }
          })
        }
      }

      const rowItem: DispenseItemRow = {
        key: `${key}-${item.id ?? item.medicationId ?? item.itemId ?? ''}`,
        id: item.id,
        jenis,
        medicineName,
        quantity: typeof quantityValue === 'number' ? quantityValue : undefined,
        unit: quantityUnit,
        status: item.status,
        performerName: item.performer?.name,
        instruksi,
        availableStock:
          typeof item.medication?.stock === 'number' ? item.medication.stock : undefined,
        fhirId:
          typeof (item as any).fhirId === 'string' && (item as any).fhirId.trim().length > 0
            ? (item as any).fhirId.trim()
            : undefined,
        children
      }

      const existing = groups.get(key)
      if (!existing) {
        groups.set(key, {
          key,
          patient: item.patient,
          status: item.status,
          paymentStatus: item.paymentStatus,
          handedOverAt,
          encounterType: item.encounter?.encounterType,
          items: [rowItem]
        })
      } else {
        // Gabung sebagai item baru ke dalam group yang sama (hindari duplikasi)
        const isDuplicate = existing.items.some((r) => r.id === item.id)
        if (!isDuplicate) {
          existing.items.push(rowItem)
        }
      }
    })

    return Array.from(groups.values())
  }, [filtered, itemNameById])

  const groupedDataForTable: ParentRow[] = useMemo(() => {
    if (!showOnlyPending) return groupedData
    return groupedData.filter((group) => group.items.some((item) => item.status !== 'completed'))
  }, [groupedData, showOnlyPending])

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* 1. Header Card */}
      <Card
        styles={{ body: { padding: '20px 24px' } }}
        variant="borderless"
        style={{
          background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`
        }}
      >
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <MedicineBoxOutlined style={{ color: token.colorSuccessBg, fontSize: 16 }} />
                </div>
                <h1 className="text-xl font-bold text-white m-0 leading-tight">Penyerahan Obat</h1>
              </div>
              <p className="text-sm text-blue-200 m-0 ml-12">
                Manajemen dan riwayat penyerahan obat kepada pasien
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#fff'
                }}
                ghost
              >
                Refresh
              </Button>
              <Button
                icon={<FileTextOutlined />}
                onClick={() => navigate('/dashboard/medicine/medication-dispenses/report')}
                style={{
                  background: '#fff',
                  borderColor: '#fff',
                  color: token.colorPrimaryActive
                }}
              >
                Laporan Harian
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.10)' }}
              >
                <MedicineBoxOutlined style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {groupedDataForTable.length}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Total Data
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Search Filter Card */}
      <Card styles={{ body: { padding: '16px 20px' } }} variant="borderless">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: token.colorTextTertiary,
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Pencarian
            </div>
            <Input
              placeholder="Cari Pasien atau Obat..."
              prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: token.colorTextTertiary,
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Filter Status
            </div>
            <Button
              type={showOnlyPending ? 'primary' : 'default'}
              onClick={() => setShowOnlyPending((prev) => !prev)}
            >
              Belum diserahkan
            </Button>
          </div>
        </div>
      </Card>

      {/* Info Tambahan */}
      {(typeof prescriptionIdParam === 'number' || summaryForPrescription) && (
        <div className="flex flex-col gap-2">
          {typeof prescriptionIdParam === 'number' && (
            <div className="text-sm text-gray-500">
              Menampilkan riwayat dispense untuk resep ID {prescriptionIdParam}
            </div>
          )}
          {summaryForPrescription && (
            <div className="text-sm bg-gray-50 rounded-md p-3 inline-block border border-gray-200">
              {summaryForPrescription.medicationName && (
                <div className="font-semibold mb-1">
                  Resep: {summaryForPrescription.medicationName}
                </div>
              )}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div>
                  <span className="text-gray-500">Diresepkan:</span>{' '}
                  <span className="font-medium">
                    {typeof summaryForPrescription.prescribedQuantity === 'number'
                      ? `${summaryForPrescription.prescribedQuantity} ${summaryForPrescription.unit ?? ''}`.trim()
                      : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Sudah diambil:</span>{' '}
                  <span className="font-medium text-blue-600">
                    {`${summaryForPrescription.totalCompleted} ${summaryForPrescription.unit ?? ''}`.trim()}
                  </span>
                </div>
                {typeof summaryForPrescription.prescribedQuantity === 'number' && (
                  <div>
                    <span className="text-gray-500">Sisa:</span>{' '}
                    <span className="font-medium text-orange-600">
                      {`${summaryForPrescription.remaining ?? 0} ${summaryForPrescription.unit ?? ''}`.trim()}
                    </span>
                  </div>
                )}
              </div>
              {summaryForPrescription.isFulfilled && (
                <div className="mt-2 text-green-600 font-semibold flex items-center gap-1">
                  <CheckCircleOutlined /> Permintaan sudah terpenuhi
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. Main Data Table Card */}
      <Card className="flex-1 overflow-hidden flex flex-col" variant="borderless">
        <Spin spinning={isLoading}>
          <div className="flex-1" style={{ background: token.colorBgContainer }}>
            {isError && (
              <div style={{ color: token.colorErrorText }} className="p-4">
                Gagal memuat data penyerahan obat.
              </div>
            )}
            <Table
              dataSource={groupedDataForTable}
              columns={columns}
              size="middle"
              className="flex-1 h-full"
              rowKey="key"
              scroll={{ x: 800, y: 'calc(100vh - 460px)' }}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Total ${total} data`,
                showSizeChanger: true
              }}
              expandable={{
                expandedRowRender: (record: ParentRow) => {
                  const patientLabel = getPatientDisplayName(record.patient)
                  const handlePrintAllLabels = () => {
                    printMedicationLabels({
                      patientName: patientLabel,
                      items: record.items
                    })
                  }
                  const detailColumns = [
                    { title: 'Kategori Item', dataIndex: 'jenis', key: 'jenis' },
                    { title: 'Item', dataIndex: 'medicineName', key: 'medicineName' },
                    { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
                    { title: 'Satuan', dataIndex: 'unit', key: 'unit' },
                    { title: 'Instruksi', dataIndex: 'instruksi', key: 'instruksi' },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      key: 'status',
                      render: (val: string) => getStatusLabel(val)
                    },
                    {
                      title: 'Satu Sehat',
                      dataIndex: 'fhirId',
                      key: 'satusehat',
                      render: (val: string | undefined, record: DispenseItemRow) => {
                        if (record.jenis === 'Komposisi') return null
                        return val && val.trim().length > 0 ? (
                          <Tag icon={<CheckCircleOutlined />} color="success">
                            Tersinkron
                          </Tag>
                        ) : (
                          <Tag icon={<CloseCircleOutlined />} color="error">
                            Belum
                          </Tag>
                        )
                      }
                    },
                    { title: 'Petugas', dataIndex: 'performerName', key: 'performerName' },
                    {
                      title: 'Aksi',
                      key: 'action',
                      render: (_: DispenseItemRow, row: DispenseItemRow) => (
                        <RowActions record={row} patient={record.patient} />
                      )
                    }
                  ]

                  return (
                    <div>
                      <div className="mb-2 flex justify-end">
                        <Button size="small" onClick={handlePrintAllLabels}>
                          Cetak Semua Label
                        </Button>
                      </div>
                      <Table
                        columns={detailColumns}
                        dataSource={record.items}
                        pagination={false}
                        size="small"
                        rowKey="key"
                      />
                    </div>
                  )
                }
              }}
            />
          </div>
        </Spin>
      </Card>
    </div>
  )
}

export default MedicationDispenseTable
