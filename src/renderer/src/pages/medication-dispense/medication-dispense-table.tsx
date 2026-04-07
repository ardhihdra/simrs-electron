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
  SearchOutlined,
  ClockCircleOutlined,
  StopOutlined,
  PauseCircleOutlined,
  QuestionCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import dayjs from 'dayjs'
import { queryClient } from '@renderer/query-client'
import { printMedicationLabels } from './component/print-medication-label'
import { SerahkanObatModal, type SerahkanObatFormValues } from './component/serahkan-obat-modal'

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
  recorderId?: number | null
  patientId?: string
  patient?: PatientInfo
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
  requester?: { name?: string }
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
  identifier?: Array<{ system: string; value: string }> | null
  fhirId?: string | null
  servicedAt?: string | null
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
  batch?: string
  expiryDate?: string
  paymentStatus?: string
  children?: DispenseItemRow[]
}

interface ParentRow {
  key: string
  patient?: PatientInfo
  status: string
  paymentStatus?: string
  handedOverAt?: string
  encounterType?: string
  dokterName?: string
  resepturName?: string
  servicedAt?: string | null
  rawHandedOverAt?: string | null
  items: DispenseItemRow[]
}

type StatusFilter = 'all' | 'completed' | 'return'

function getStatusLabel(status: string): string {
  if (status === 'entered-in-error') return 'Void/Kembali'
  if (status === 'cancelled' || status === 'stopped' || status === 'declined') return 'Dibatalkan'
  if (status === 'preparation') return 'Persiapan'
  if (status === 'in-progress') return 'Diproses'
  if (status === 'on-hold') return 'Tertunda'
  if (status === 'completed') return 'Selesai'
  return status
}

function getStatusTag(status: string) {
  const label = getStatusLabel(status)
  if (status === 'completed') return <Tag color="green" icon={<CheckCircleOutlined />}>{label}</Tag>
  if (status === 'entered-in-error') return <Tag color="volcano" icon={<ReloadOutlined />}>{label}</Tag>
  if (status === 'cancelled' || status === 'stopped' || status === 'declined') return <Tag color="red" icon={<StopOutlined />}>{label}</Tag>
  if (status === 'preparation') return <Tag color="blue" icon={<InfoCircleOutlined />}>{label}</Tag>
  if (status === 'in-progress') return <Tag color="geekblue" icon={<SyncOutlined spin />}>{label}</Tag>
  if (status === 'on-hold') return <Tag color="orange" icon={<PauseCircleOutlined />}>{label}</Tag>
  return <Tag color="default">{label}</Tag>
}

function DispenseTimer({ servicedAt, handedOverAt, isBpjs }: { servicedAt?: string | null; handedOverAt?: string | null; isBpjs: boolean }) {
  const [remaining, setRemaining] = useState<number | null>(null)

  const limit = isBpjs ? 60 * 60 * 1000 : 15 * 60 * 1000

  useEffect(() => {
    if (!servicedAt) return
    const start = new Date(servicedAt).getTime()
    
    // Jika sudah diserahkan (completed), bekukan waktu hitung pada diserahkan
    if (handedOverAt) {
      const end = new Date(handedOverAt).getTime()
      const diff = limit - (end - start)
      setRemaining(diff)
      return
    }

    const update = () => {
      const now = Date.now()
      const diff = limit - (now - start)
      setRemaining(diff)
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [servicedAt, handedOverAt, limit])

  if (!servicedAt || remaining === null) return <span className="text-gray-400">-</span>

  const isOverdue = remaining <= 0
  const absRemaining = Math.abs(remaining)
  const mins = Math.floor(absRemaining / 60000)
  const secs = Math.floor((absRemaining % 60000) / 1000)
  
  const timeStr = `${isOverdue ? '-' : ''}${mins}:${secs.toString().padStart(2, '0')}`
  
  let color = 'text-green-600'
  if (isOverdue) color = 'text-red-600 font-bold'
  else if (remaining < 5 * 60 * 1000) color = 'text-orange-500 font-semibold'

  return <span className={color}>{timeStr}</span>
}

interface RowActionsProps {
  record: DispenseItemRow
  patient?: PatientInfo
  employees: Array<{ id: number; namaLengkap: string }>
  employeeNameById: Map<number, string>
  parentServicedAt?: string | null
}

function RowActions({ record, patient, employees, employeeNameById, parentServicedAt }: RowActionsProps) {
  const { message } = AntdApp.useApp()
  const [serahkanModalOpen, setSerahkanModalOpen] = useState(false)

  const updateMutation = useMutation({
    mutationKey: ['medicationDispense', 'update', 'complete'],
    mutationFn: async (formValues: SerahkanObatFormValues) => {
      if (typeof record.id !== 'number') {
        throw new Error('ID MedicationDispense tidak valid.')
      }
      const fn = window.api?.query?.medicationDispense?.update
      if (!fn) throw new Error('API MedicationDispense tidak tersedia.')

      const penyiapNama = employeeNameById.get(formValues.penyiapObatId) ?? ''
      const penyerahNama = employeeNameById.get(formValues.penyerahObatId) ?? ''

      const pioAnnotation = {
        text: `PIO: ${JSON.stringify({
          hubungan: formValues.hubunganPenerima,
          namaPenerima: formValues.namaPenerima,
          penyiapObatId: formValues.penyiapObatId,
          penyiapObatNama: penyiapNama,
          penyerahObatId: formValues.penyerahObatId,
          penyerahObatNama: penyerahNama
        })}`
      }

      const receiverDisplay = formValues.hubunganPenerima === 'Sendiri'
        ? 'Sendiri (Pasien)'
        : `${formValues.hubunganPenerima} - ${formValues.namaPenerima}`

      const payload = {
        id: record.id,
        status: 'completed' as const,
        whenHandedOver: new Date().toISOString(),
        performerId: formValues.penyerahObatId,
        note: [pioAnnotation],
        receiver: [{ display: receiverDisplay }]
      }
      const res = await fn(payload as never)
      if (!res.success) {
        throw new Error(res.error || 'Gagal memperbarui MedicationDispense')
      }
      return res
    },
    onSuccess: () => {
      setSerahkanModalOpen(false)
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
  const isPaid = record.paymentStatus === 'Lunas'
  const canComplete =
    !isCompleted && !isTerminal && typeof record.id === 'number' && !isStockInsufficient && isPaid && !!parentServicedAt
  const canVoid = isCompleted && typeof record.id === 'number'
  const isKomposisi = record.jenis === 'Komposisi'

  const handlePrintLabel = () => {
    const patientLabel = getPatientDisplayName(patient)
    printMedicationLabels({
        patientName: patientLabel,
        items: [{
            medicineName: record.medicineName,
            quantity: record.quantity,
            unit: record.unit,
            instruksi: record.instruksi,
            expiryDate: (record as any).expiryDate,
            batch: (record as any).batch
        }]
    })
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
            onClick={() => setSerahkanModalOpen(true)}
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
      {!isPaid && !isCompleted && !isTerminal && !isStockInsufficient && (
        <div className="text-xs text-orange-500">
          Pembayaran belum lunas, tidak dapat menyerahkan obat.
        </div>
      )}
      {isPaid && !isCompleted && !isTerminal && !isStockInsufficient && !parentServicedAt && (
        <div className="text-xs text-orange-500 font-semibold bg-orange-50 border border-orange-200 p-1 px-2 rounded-md">
          Harap &quot;Mulai Proses&quot; (di menu titik tiga) terlebih dahulu.
        </div>
      )}
      <SerahkanObatModal
        open={serahkanModalOpen}
        loading={updateMutation.isPending}
        employees={employees}
        onSubmit={(values) => updateMutation.mutate(values)}
        onCancel={() => setSerahkanModalOpen(false)}
      />
    </div>
  )
}

function getPatientDisplayName(patient?: PatientInfo): string {
  if (!patient) return ''

  if (typeof patient.name === 'string') {
    const trimmed = patient.name.trim()
    if (trimmed.length > 0) {
      const identifiers = Array.isArray(patient.identifier) ? patient.identifier : []
      const localMrn = identifiers.find((id) => id.system === 'local-mrn')
      const mrn = patient.mrNo || localMrn?.value || ''
      return mrn ? `${trimmed} (${mrn})` : trimmed
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
  const localMrn = identifiers.find((id) => id.system === 'local-mrn')
  const mrn = patient.mrNo || localMrn?.value || ''

  if (mrn) return `${baseName} (${mrn})`
  return baseName
}

function getInstructionText(dosage?: DosageInstructionEntry[] | null): string {
  if (!Array.isArray(dosage) || dosage.length === 0) return ''
  return dosage[0]?.text ?? ''
}

function MainRowActions({ record }: { record: ParentRow }) {
  const { message, modal } = AntdApp.useApp()
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

  const isPaid = record.paymentStatus === 'Lunas'
  const hasItemsToProcess = record.items.some((i) => {
    const s = (i.status || '').toLowerCase()
    return s === 'preparation' || (s === 'in-progress' && !record.servicedAt)
  })

  const handleMulaiProsesGroup = () => {
    console.log('[handleMulaiProsesGroup] Executed from dropdown click!')
    modal.confirm({
      title: 'Mulai Proses Resep',
      width: 500,
      content: (
        <div className="flex flex-col gap-3 mt-4">
          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-md border border-gray-200">
            <span className="font-semibold">Status Tagihan Kasir:</span>
            <span className={`font-bold ${isPaid ? 'text-green-600' : 'text-orange-600'}`}>
              {record.paymentStatus || 'Belum Ditagihkan'}
            </span>
          </div>
          <div>
            <div className="font-semibold mb-2">Daftar Obat yang Disiapkan:</div>
            <ul className="pl-5 m-0 flex flex-col gap-1 text-sm">
              {record.items.filter(i => i.jenis !== 'Komposisi').map(item => (
                <li key={item.id || item.key}>
                  <span className="font-medium">{item.medicineName}</span> — {item.quantity} {item.unit}
                </li>
              ))}
            </ul>
          </div>
          {!isPaid && (
            <div className="text-orange-600 mt-2 text-sm bg-orange-50 p-2 rounded border border-orange-200 flex gap-2 items-start">
              <InfoCircleOutlined className="mt-1" />
              <span>Pembayaran obat ini belum diselesaikan / dilunasi di kasir. Apakah Anda yakin tetap ingin mulai memproses resep ini sekarang?</span>
            </div>
          )}
        </div>
      ),
      okText: 'Konfirmasi & Mulai',
      cancelText: 'Batal',
      onOk: async () => {
        console.log('[Mulai Proses] clicked', { items: record.items, servicedAt: record.servicedAt })
        const fn = window.api?.query?.medicationDispense?.update
        if (!fn) {
          message.error('API update tidak tersedia.')
          return
        }
        try {
          let hit = 0
          // Update semua item dalam grup ini yang masih perlu di-trigger ke in-progress
          for (const item of record.items) {
            const currentStatus = (item.status || '').toLowerCase()
            const needsTrigger = currentStatus === 'preparation' || (currentStatus === 'in-progress' && !record.servicedAt)
            console.log('[Mulai Proses] check item', { id: item.id, status: item.status, currentStatus, needsTrigger })
            if (needsTrigger && typeof item.id === 'number') {
              console.log('[Mulai Proses] calling api for item', item.id)
              const res = await fn({ id: item.id, status: 'in-progress' } as never)
              console.log('[Mulai Proses] res for item', item.id, res)
              hit++
            }
          }
          console.log('[Mulai Proses] total hit =', hit)
          if (hit === 0) {
            message.warning('Tidak ada data obat yang perlu di-trigger atau statusnya sudah diproses.')
          } else {
            message.success('Timer mulai berjalan dan resep dipindahkan ke proses')
          }
          queryClient.invalidateQueries({ queryKey: ['medicationDispense', 'list'] })
        } catch (err) {
          console.error('[Mulai Proses] error', err)
          message.error('Gagal memulai proses: ' + String(err))
        }
      }
    })
  }

  const menuItems: MenuProps['items'] = []

  if (hasItemsToProcess) {
    menuItems.push({
      key: 'mulai-proses',
      label: 'Mulai Proses',
      icon: <CheckCircleOutlined />,
      onClick: handleMulaiProsesGroup
    })
    menuItems.push({ type: 'divider' })
  }

  menuItems.push({
    key: 'sync-satusehat',
    label: syncingSatusehat ? 'Sinkronisasi Satu Sehat...' : 'Sinkronisasi Satu Sehat',
    icon: <SyncOutlined spin={syncingSatusehat} />,
    disabled: syncingSatusehat || isAllSynced || syncItems.length === 0,
    onClick: handleSyncGroup
  })

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
    title: 'Dokter',
    dataIndex: 'dokterName',
    key: 'dokterName',
    render: (val: string | undefined) => val || '-'
  },
  {
    title: 'Reseptur',
    dataIndex: 'resepturName',
    key: 'resepturName',
    render: (val: string | undefined) => val || '-'
  },
  {
    title: 'Asal',
    dataIndex: 'encounterType',
    key: 'encounterType',
    render: (val: string) => {
      if (val === 'AMB' || val === 'ambulatory') return <Tag color="green">Rawat Jalan</Tag>
      if (val === 'EMER' || val === 'emergency') return <Tag color="red">IGD</Tag>
      if (val === 'IMP' || val === 'inpatient') return <Tag color="blue">Rawat Inap</Tag>
      return <Tag color="default">Pasien Luar</Tag>
    }
  },
  {
    title: 'Status Penyerahan',
    dataIndex: 'status',
    key: 'status',
    render: (val: string) => getStatusTag(val)
  },
  {
    title: 'Pembayaran',
    dataIndex: 'paymentStatus',
    key: 'paymentStatus',
    render: (val: string | undefined) => {
      const status = val || 'Belum Ditagihkan'
      const color = status === 'Lunas' ? 'green' : status === 'Sebagian' ? 'orange' : 'volcano'
      const icon = status === 'Lunas' ? <CheckCircleOutlined /> : status === 'Sebagian' ? <ClockCircleOutlined /> : <CloseCircleOutlined />
      return <Tag color={color} icon={icon}>{status}</Tag>
    }
  },
  {
    title: 'Sisa Waktu',
    key: 'timer',
    width: 100,
    render: (_: unknown, row: ParentRow) => {
      if (row.status === 'cancelled' || row.status === 'entered-in-error') return '-'
      if (row.status !== 'in-progress' && row.status !== 'preparation' && row.status !== 'completed') return '-'
      // Assume BPJS if encounterType is not AMB (simplified check or based on payment status)
      const isBpjs = row.paymentStatus === 'Lunas' && row.encounterType !== 'AMB' 
      return <DispenseTimer servicedAt={row.servicedAt} handedOverAt={row.rawHandedOverAt} isBpjs={isBpjs} />
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
      console.log('[Frontend][MedDispense] Fetching list...')
      const api = window.api?.query as {
        medicationDispense?: {
          list: (args: MedicationDispenseListArgs) => Promise<MedicationDispenseListResult>
        }
      }

      const fn = api?.medicationDispense?.list
      if (!fn) throw new Error('API MedicationDispense tidak tersedia.')

      const res = await fn({})
      console.log('[Frontend][MedDispense] List response:', res)
      return res
    }
  })

  const { data: employeeData } = useQuery({
    queryKey: ['kepegawaian', 'list', 'for-medication-dispense'],
    queryFn: async () => {
      const fn = window.api?.query?.kepegawaian?.list
      if (!fn) return { success: false, result: [] }
      return fn()
    }
  })
  const employeeNameById = useMemo(() => {
    const map = new Map<number, string>()
    const source = Array.isArray(employeeData?.result)
      ? (employeeData.result as Array<{ id?: number; namaLengkap?: string }>)
      : []
    source.forEach((e) => {
      if (typeof e.id === 'number') {
        const name = typeof e.namaLengkap === 'string' ? e.namaLengkap : String(e.id)
        map.set(e.id, name)
      }
    })
    return map
  }, [employeeData])
  const employeeList = useMemo(() => {
    const source = Array.isArray(employeeData?.result)
      ? (employeeData.result as Array<{ id?: number; namaLengkap?: string }>)
      : []
    return source
      .filter((e): e is { id: number; namaLengkap: string } =>
        typeof e.id === 'number' && typeof e.namaLengkap === 'string'
      )
      .map((e) => ({ id: e.id, namaLengkap: e.namaLengkap }))
  }, [employeeData])
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

              let ingBatch: string | undefined
              let ingExpiryDate: string | undefined

              // Fallback for ingredients: look in identifiers if the dispense record has them
              const ingKode = (ing.kode || ing.item_kode || '').trim().toUpperCase()
              if (ingKode) {
                const batchId = item.identifier?.find((id: any) => id.system === `batch-number-${ingKode}`)
                const expId = item.identifier?.find((id: any) => id.system === `expiry-date-${ingKode}`)
                if (batchId) ingBatch = batchId.value
                if (expId) ingExpiryDate = expId.value
              }

              // Secondary fallback for legacy data
              if (!ingBatch && ing.batchNumber) ingBatch = ing.batchNumber
              if (!ingExpiryDate && ing.expiryDate) ingExpiryDate = ing.expiryDate

              return {
                key: `${key}-${item.id ?? 'grp'}-ing-${idx}`,
                jenis: 'Komposisi',
                medicineName: ingName ?? 'Komposisi',
                quantity: typeof ing.quantity === 'number' ? Math.round(ing.quantity) : undefined,
                unit: ing.unitCode ?? ing.unit,
                status: '',
                instruksi: ing.note ?? ing.instruction,
                batch: ingBatch,
                expiryDate: ingExpiryDate
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

            let ingBatch: string | undefined
            let ingExpiryDate: string | undefined

            // Fallback for ingredients: look in identifiers if the dispense record has them
            const ingKode = (ing.kode || ing.item_kode || '').trim().toUpperCase()
            if (ingKode) {
              const batchId = item.identifier?.find((id: any) => id.system === `batch-number-${ingKode}`)
              const expId = item.identifier?.find((id: any) => id.system === `expiry-date-${ingKode}`)
              if (batchId) ingBatch = batchId.value
              if (expId) ingExpiryDate = expId.value
            }

            // Secondary fallback for legacy data
            if (!ingBatch && ing.batchNumber) ingBatch = ing.batchNumber
            if (!ingExpiryDate && ing.expiryDate) ingExpiryDate = ing.expiryDate

            return {
              key: `${key}-${item.id ?? 'racik'}-ing-${idx}`,
              jenis: 'Komposisi',
              medicineName: ingName ?? 'Komposisi',
              quantity: typeof ing.quantity === 'number' ? Math.round(ing.quantity) : undefined,
              unit: ing.unitCode ?? ing.unit,
              status: '',
              instruksi: ing.note ?? ing.instruction,
              batch: ingBatch,
              expiryDate: ingExpiryDate
            }
          })
        }
      }

      const rowItem: DispenseItemRow = {
        key: `${key}-${item.id ?? item.medicationId ?? item.itemId ?? ''}`,
        id: item.id,
        jenis,
        medicineName,
        quantity: typeof quantityValue === 'number' ? Math.round(quantityValue) : undefined,
        unit: quantityUnit,
        status: item.status,
        performerName: item.performer?.name,
        instruksi,
        availableStock:
          typeof item.medication?.stock === 'number' ? item.medication.stock : undefined,
        paymentStatus: item.paymentStatus,
        fhirId:
          typeof item.fhirId === 'string' && item.fhirId.trim().length > 0
            ? item.fhirId.trim()
            : undefined,
        children
      }

      // Extract batch info from identifiers (New priority)
      if (Array.isArray(item.identifier)) {
        const identifiers = item.identifier
        const batchId = identifiers.find((id) => id.system === 'batch-number' || id.system.startsWith('batch-number-'))
        const expiryId = identifiers.find((id) => id.system === 'expiry-date' || id.system.startsWith('expiry-date-'))
        if (batchId) rowItem.batch = batchId.value
        if (expiryId) rowItem.expiryDate = expiryId.value
      }

      // Fallback: Extract batch info for non-compound items from prescription supportingInformation
      if (!rowItem.batch && !rowItem.expiryDate && isItem && Array.isArray(prescription?.supportingInformation)) {
        const batchInfo = (prescription.supportingInformation as Array<Record<string, unknown>>)
          .find((info) => info.resourceType === 'StockBatch')
        if (batchInfo) {
          const bn = batchInfo.batchNumber as string | undefined
          const exp = batchInfo.expiryDate as string | undefined
          if (bn && bn.trim().length > 0) (rowItem as any).batch = bn.trim()
          if (exp && exp.trim().length > 0) (rowItem as any).expiryDate = exp.trim()
        }
      }

      const existing = groups.get(key)
      if (!existing) {
        let resepturName: string | undefined
        if (Array.isArray(prescription?.supportingInformation)) {
          const resepturEntry = (prescription.supportingInformation as Array<Record<string, unknown>>)
            .find((info) => {
              const t1 = info.resourceType as string | undefined
              const t2 = info.type as string | undefined
              return t1 === 'Reseptur' || t2 === 'Reseptur'
            })
          const ridRaw = resepturEntry?.itemId ?? (resepturEntry as any)?.item_id
          const rid = typeof ridRaw === 'number' ? ridRaw : undefined
          if (typeof rid === 'number') {
            resepturName = employeeNameById.get(rid) ?? undefined
          }
        }
        
        // Fallback to recorderId from prescription if still empty
        if (!resepturName && typeof prescription?.recorderId === 'number') {
          resepturName = employeeNameById.get(prescription.recorderId) ?? undefined
        }
        const dokterName = (prescription as any)?.requester?.name as string | undefined
        groups.set(key, {
          key,
          patient: item.patient,
          status: item.status,
          paymentStatus: item.paymentStatus,
          handedOverAt,
          rawHandedOverAt: item.whenHandedOver ? String(item.whenHandedOver) : null,
          encounterType: item.encounter?.encounterType,
          dokterName,
          resepturName,
          servicedAt: item.servicedAt,
          items: [rowItem]
        })
      } else {
        // Gabung sebagai item baru ke dalam group yang sama (hindari duplikasi)
        const isDuplicate = existing.items.some((r) => r.id === item.id)
        if (!isDuplicate) {
          existing.items.push(rowItem)
        }
        if (!existing.servicedAt && item.servicedAt) {
          existing.servicedAt = item.servicedAt
        }
      }
    })

    return Array.from(groups.values())
  }, [filtered, itemNameById, employeeNameById])

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
                expandedRowRender: (parentRecord: ParentRow) => {
                  const patientLabel = getPatientDisplayName(parentRecord.patient)
                  const handlePrintAllLabels = () => {
                    printMedicationLabels({
                      patientName: patientLabel,
                      items: parentRecord.items
                    })
                  }
                  const detailColumns = [
                    { title: 'Kategori Item', dataIndex: 'jenis', key: 'jenis' },
                    { title: 'Item', dataIndex: 'medicineName', key: 'medicineName' },
                    { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
                    { title: 'Satuan', dataIndex: 'unit', key: 'unit' },
                    { title: 'Instruksi', dataIndex: 'instruksi', key: 'instruksi' },
                    {
                      title: 'Batch / Expire',
                      key: 'batchExpire',
                      render: (_: unknown, row: DispenseItemRow) => {
                        const batch = (row as any).batch as string | undefined
                        const expiryDate = (row as any).expiryDate as string | undefined
                        if (!batch && !expiryDate) return '-'
                        const parts: string[] = []
                        if (batch) parts.push(`Batch: ${batch}`)
                        if (expiryDate) parts.push(`Exp: ${expiryDate}`)
                        return <Tag color="orange">{parts.join(' | ')}</Tag>
                      }
                    },
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
                        <RowActions
                          record={row}
                          patient={parentRecord.patient}
                          employees={employeeList}
                          employeeNameById={employeeNameById}
                          parentServicedAt={parentRecord.servicedAt}
                        />
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
                        dataSource={parentRecord.items}
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
