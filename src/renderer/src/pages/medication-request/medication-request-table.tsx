import { Button, Card, Dropdown, Input, Spin, Table, Tag, message, theme } from 'antd'
import type { MenuProps } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { queryClient } from '@renderer/query-client'
import {
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MedicineBoxOutlined,
  ReloadOutlined,
  PlusOutlined,
  SearchOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

type PatientNameEntry = {
  text?: string
  given?: string[]
  family?: string
}

type PatientIdentifier = {
  system?: string
  value?: string
}

interface GroupIdentifier {
  system?: string
  value?: string
}

interface CategoryEntry {
  text?: string
  code?: string
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

interface PatientInfo {
  name?: string | PatientNameEntry[]
  identifier?: PatientIdentifier[]
  mrNo?: string
}

interface MedicationRequestAttributes {
  id?: number
  status: string
  intent: string
  priority?: string
  medicationId?: number | null
  itemId?: number | null
  patientId: string
  authoredOn?: string
  patient?: PatientInfo
  medication?: { name?: string }
  item?: { nama?: string; itemCategoryId?: number | null }
  note?: string | null
  encounter?: { id: string; encounterType?: string }
  requester?: { name: string }
  groupIdentifier?: GroupIdentifier | null
  category?: CategoryEntry[] | null
  dosageInstruction?: DosageInstructionEntry[] | null
  dispenseRequest?: DispenseRequestInfo | null
  supportingInformation?: any[] | null
  fhirId?: string | null
}

interface MedicationItemRow {
  key: string
  jenis: string
  namaObat: string
  quantity?: number
  unit?: string
  instruksi?: string
  children?: MedicationItemRow[]
}

interface ParentRow {
  key: string
  baseId?: number
  patient?: PatientInfo
  status: string
  intent: string
  priority?: string
  authoredOn?: string
  isPartial?: boolean
  isOnProcess?: boolean
  hasRemaining?: boolean
  remainingTotal?: number
  fhirId?: string | null
  encounterType?: string
  items: MedicationItemRow[]
}

interface MedicationDispenseQuantityInfo {
  value?: number
  unit?: string
}

interface MedicationDispenseForFilter {
  id?: number
  authorizingPrescriptionId?: number | null
  status?: string
  quantity?: MedicationDispenseQuantityInfo | null
}

interface MedicationDispenseListResultForFilter {
  success: boolean
  data?: MedicationDispenseForFilter[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
  error?: string
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

function isCompound(record: MedicationRequestAttributes): boolean {
  const categories = record.category ?? []
  const byCategory = categories.some((category) => {
    const code = category.code?.toLowerCase()
    const text = category.text?.toLowerCase()
    return code === 'compound' || text === 'racikan'
  })
  if (byCategory) return true
  const infos = Array.isArray(record.supportingInformation) ? record.supportingInformation : []
  return infos.some((info: any) => {
    const type = info?.resourceType || info?.resource_type
    return type === 'Ingredient'
  })
}

function getInstructionText(dosage?: DosageInstructionEntry[] | null): string {
  if (!Array.isArray(dosage) || dosage.length === 0) return ''
  return dosage[0]?.text ?? ''
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
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (val: string, record: ParentRow) => {
      if (val === 'active') {
        const numericQuantities: number[] = record.items
          .map((item) => item.quantity)
          .filter((q): q is number => typeof q === 'number')
        const hasQuantity = numericQuantities.length > 0
        const allZero = hasQuantity && numericQuantities.every((q) => q <= 0)

        if (allZero) {
          return <Tag color="blue">dispense</Tag>
        }
        if (record.isPartial) {
          return <Tag color="gold">active (parsial)</Tag>
        }
        if (record.isOnProcess) {
          return <Tag color="geekblue">on process</Tag>
        }
        return <Tag color="green">active</Tag>
      }
      return <Tag color="default">{val}</Tag>
    }
  },
  {
    title: 'Tujuan',
    dataIndex: 'intent',
    key: 'intent'
  },
  {
    title: 'Prioritas',
    dataIndex: 'priority',
    key: 'priority',
    render: (val: string) =>
      val ? <Tag color={val === 'urgent' || val === 'stat' ? 'red' : 'blue'}>{val}</Tag> : '-'
  },
  {
    title: 'Sisa',
    dataIndex: 'remainingTotal',
    key: 'remainingTotal',
    render: (val: number | undefined) => (typeof val === 'number' ? val : '-')
  },
  {
    title: 'Tanggal',
    dataIndex: 'authoredOn',
    key: 'authoredOn',
    render: (val: string) => (val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '-')
  },
  {
    title: 'Satu Sehat',
    dataIndex: 'fhirId',
    key: 'fhirId',
    width: 110,
    render: (_: unknown, record: ParentRow) => {
      const ok = typeof record.fhirId === 'string' && record.fhirId.trim().length > 0
      return ok ? (
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
  {
    title: 'Aksi',
    key: 'action',
    width: 60,
    align: 'center' as const,
    render: (_: ParentRow, r: ParentRow) => <RowActions record={r} />
  }
]

function RowActions({ record }: { record: ParentRow }) {
  const navigate = useNavigate()
  const [syncingSatusehat, setSyncingSatusehat] = useState(false)
  const deleteMutation = useMutation({
    mutationKey: ['medicationRequest', 'delete'],
    mutationFn: (id: number) => {
      const fn = window.api?.query?.medicationRequest?.deleteById
      if (!fn) throw new Error('API MedicationRequest tidak tersedia.')
      return fn({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicationRequest', 'list'] })
    }
  })
  const items: MenuProps['items'] = [
    {
      key: 'process-dispense',
      label: 'Proses Pengambilan Obat',
      disabled: record.isOnProcess || !record.hasRemaining,
      onClick: () => {
        if (typeof record.baseId === 'number') {
          navigate(`/dashboard/medicine/medication-requests/dispense/${record.baseId}`)
        }
      }
    },
    {
      key: 'history',
      label: 'Riwayat Dispense',
      onClick: () => {
        if (typeof record.baseId === 'number') {
          navigate(
            `/dashboard/medicine/medication-dispenses?authorizingPrescriptionId=${record.baseId}`
          )
        }
      }
    },
    { type: 'divider' },
    {
      key: 'sync-satusehat',
      label: syncingSatusehat ? 'Sinkronisasi Satu Sehat...' : 'Sinkronisasi Satu Sehat',
      icon: <SyncOutlined />,
      disabled:
        syncingSatusehat ||
        !!(typeof record.fhirId === 'string' && record.fhirId.trim().length > 0),
      onClick: async () => {
        if (typeof record.baseId !== 'number') return
        const fn = (
          window.api?.query as {
            medicationRequest?: {
              syncSatusehat?: (args: {
                id: number
              }) => Promise<{ success?: boolean; message?: string; error?: string }>
            }
          }
        ).medicationRequest?.syncSatusehat
        if (!fn) {
          message.error('API sinkronisasi tidak tersedia. Silakan refresh/restart aplikasi.')
          return
        }
        setSyncingSatusehat(true)
        try {
          const res = await fn({ id: record.baseId })
          if (res?.success) {
            message.success(res.message || 'Sinkronisasi Satu Sehat berhasil')
            queryClient.invalidateQueries({ queryKey: ['medicationRequest', 'list'] })
          } else {
            const errMsg = res?.error || res?.message || 'Sinkronisasi Satu Sehat gagal'
            message.error(errMsg)
          }
        } catch {
          message.error('Sinkronisasi Satu Sehat gagal')
        } finally {
          setSyncingSatusehat(false)
        }
      }
    },
    { type: 'divider' },
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () =>
        typeof record.baseId === 'number' &&
        navigate(`/dashboard/medicine/medication-requests/edit/${record.baseId}`)
    },
    { type: 'divider' },
    {
      key: 'delete',
      danger: true,
      label: 'Delete',
      icon: <DeleteOutlined />,
      onClick: () => typeof record.baseId === 'number' && deleteMutation.mutate(record.baseId)
    }
  ]
  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <button aria-label="Actions" className="p-1 rounded hover:bg-gray-100">
        <MoreOutlined />
      </button>
    </Dropdown>
  )
}

export function MedicationRequestTable() {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showOnlyActive, setShowOnlyActive] = useState(false)
  const { data, refetch, isError, isLoading } = useQuery({
    queryKey: ['medicationRequest', 'list'],
    queryFn: async () => {
      const fn = window.api?.query?.medicationRequest?.list
      if (!fn) throw new Error('API MedicationRequest tidak tersedia.')
      return fn({ limit: 1000 })
    }
  })

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
    const source: MedicationRequestAttributes[] = Array.isArray(data?.data)
      ? (data.data as MedicationRequestAttributes[])
      : []
    const map = new Map<number, string>()
    for (const req of source) {
      const categoryEntries = Array.isArray(req.category) ? req.category : []
      for (const cat of categoryEntries) {
        const code = typeof cat.code === 'string' ? cat.code : ''
        const name = typeof cat.text === 'string' ? cat.text : ''
        const trimmedName = name.trim()
        if (!code || !trimmedName) {
          continue
        }
        const id = Number.parseInt(code, 10)
        if (!Number.isFinite(id)) {
          continue
        }
        if (!map.has(id)) {
          map.set(id, trimmedName)
        }
      }
    }
    return map
  }, [data?.data])

  const { data: dispenseListData } = useQuery({
    queryKey: ['medicationDispense', 'forStatus'],
    queryFn: async () => {
      const api = window.api?.query as {
        medicationDispense?: {
          list: (args?: { limit?: number }) => Promise<MedicationDispenseListResultForFilter>
        }
      }
      const fn = api?.medicationDispense?.list
      if (!fn) throw new Error('API MedicationDispense tidak tersedia.')
      return fn({ limit: 1000 })
    }
  })

  const dispensedSummaryByRequestId = useMemo(() => {
    const source: MedicationDispenseForFilter[] = Array.isArray(dispenseListData?.data)
      ? dispenseListData.data
      : []

    const map = new Map<number, { totalCompleted: number }>()

    source.forEach((item) => {
      if (typeof item.authorizingPrescriptionId !== 'number') return
      if (item.status !== 'completed') return
      const qty = item.quantity?.value
      if (typeof qty !== 'number') return
      const prev = map.get(item.authorizingPrescriptionId) ?? { totalCompleted: 0 }
      map.set(item.authorizingPrescriptionId, {
        totalCompleted: prev.totalCompleted + qty
      })
    })

    return map
  }, [dispenseListData?.data])

  const hasInProgressByRequestId = useMemo(() => {
    const source: MedicationDispenseForFilter[] = Array.isArray(dispenseListData?.data)
      ? dispenseListData.data
      : []
    const set = new Set<number>()
    source.forEach((item) => {
      if (typeof item.authorizingPrescriptionId !== 'number') return
      if (item.status === 'in-progress' || item.status === 'preparation') {
        set.add(item.authorizingPrescriptionId)
      }
    })
    return set
  }, [dispenseListData?.data])

  const filtered = useMemo(() => {
    const source: MedicationRequestAttributes[] = Array.isArray(data?.data)
      ? (data.data as MedicationRequestAttributes[])
      : []

    const baseFiltered = showOnlyActive
      ? source.filter((request) => request.status === 'active')
      : source

    const q = search.trim().toLowerCase()
    if (!q) return baseFiltered
    return baseFiltered.filter((p) => {
      const patientName = getPatientDisplayName(p.patient).toLowerCase()
      const medicineName = p.medication?.name?.toLowerCase() ?? ''
      const itemName = p.item?.nama?.toLowerCase() ?? ''
      return patientName.includes(q) || medicineName.includes(q) || itemName.includes(q)
    })
  }, [data?.data, search])

  const groupedData = useMemo<ParentRow[]>(() => {
    const groups = new Map<string, ParentRow>()

    filtered.forEach((record) => {
      const groupId = record.groupIdentifier?.value
      const key = groupId && groupId.trim().length > 0 ? groupId : `single-${record.id ?? ''}`

      const isItem = typeof record.itemId === 'number' && record.itemId > 0
      const compound = isCompound(record)
      const racikanTitleMatch = compound ? record.note?.match(/^\[Racikan:([^\]]+)\]/) : null
      const racikanName =
        racikanTitleMatch && racikanTitleMatch[1] ? racikanTitleMatch[1].trim() : undefined

      let remainingQuantity: number | undefined
      const prescribedQuantity = record.dispenseRequest?.quantity?.value
      if (typeof record.id === 'number' && typeof prescribedQuantity === 'number') {
        const summary = dispensedSummaryByRequestId.get(record.id)
        const completed = summary?.totalCompleted ?? 0
        const diff = prescribedQuantity - completed
        remainingQuantity = diff > 0 ? diff : 0
      }

      let jenisLabel: string
      if (isItem) {
        const rawCategoryId =
          typeof record.item?.itemCategoryId === 'number' ? record.item.itemCategoryId : undefined
        const categoryName =
          typeof rawCategoryId === 'number'
            ? (itemCategoryNameById.get(rawCategoryId) ?? undefined)
            : undefined
        jenisLabel = categoryName && categoryName.length > 0 ? categoryName : 'Item'
      } else if (compound) {
        jenisLabel = 'Racikan'
      } else {
        jenisLabel = 'Obat Biasa'
      }

      const item: MedicationItemRow = {
        key: `${key}-${record.id ?? ''}`,
        jenis: jenisLabel,
        namaObat: isItem
          ? (record.item?.nama ?? '-')
          : compound
            ? (racikanName ?? record.medication?.name ?? '-')
            : (record.medication?.name ?? '-'),
        quantity:
          typeof remainingQuantity === 'number'
            ? remainingQuantity
            : record.dispenseRequest?.quantity?.value,
        unit: record.dispenseRequest?.quantity?.unit,
        instruksi: getInstructionText(record.dosageInstruction)
      }

      if (compound && Array.isArray(record.supportingInformation)) {
        const ingredients = record.supportingInformation.filter(
          (info: any) =>
            info.resourceType === 'Ingredient' ||
            info.itemId ||
            info.medicationId ||
            info.item_id ||
            info.medication_id
        )
        item.children = ingredients.map((ing: any, idx: number) => {
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

          return {
            key: `${key}-${record.id ?? ''}-ing-${idx}`,
            jenis: 'Komposisi',
            namaObat: ingredientName ?? (ing.note ? `Komposisi (${ing.note})` : 'Komposisi'),
            quantity: ing.quantity,
            unit: ing.unitCode,
            instruksi: ing.note || ing.instruction
          }
        })
      }

      const groupItems: MedicationItemRow[] = [item]

      const existing = groups.get(key)
      if (!existing) {
        let isPartial = false
        let isOnProcess = false
        let remainingTotal = 0
        if (typeof record.id === 'number') {
          const summary = dispensedSummaryByRequestId.get(record.id)
          const prescribed = record.dispenseRequest?.quantity?.value
          const completed = summary?.totalCompleted ?? 0
          if (typeof prescribed === 'number' && completed > 0 && completed < prescribed) {
            isPartial = true
          }
          if (hasInProgressByRequestId.has(record.id)) {
            isOnProcess = true
          }
        }
        if (typeof item.quantity === 'number') {
          remainingTotal = item.quantity
        }
        groups.set(key, {
          key,
          baseId: record.id,
          patient: record.patient,
          status: record.status,
          intent: record.intent,
          priority: record.priority,
          authoredOn: record.authoredOn,
          isPartial,
          isOnProcess,
          hasRemaining: remainingTotal > 0,
          remainingTotal,
          fhirId:
            typeof record.fhirId === 'string' && record.fhirId.trim().length > 0
              ? record.fhirId.trim()
              : null,
          encounterType: record.encounter?.encounterType,
          items: groupItems
        })
      } else {
        existing.items.push(...groupItems)
        const addQ = typeof item.quantity === 'number' ? item.quantity : 0
        const prevTotal = existing.remainingTotal ?? 0
        const nextTotal = prevTotal + addQ
        existing.remainingTotal = nextTotal
        existing.hasRemaining = nextTotal > 0
      }
    })

    const result = Array.from(groups.values())

    return result
  }, [
    filtered,
    dispensedSummaryByRequestId,
    itemCategoryNameById,
    medicineMap,
    itemMap,
    hasInProgressByRequestId
  ])

  return (
    <div className="flex flex-col gap-4 h-full">
      <Card
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
                <h1 className="text-xl font-bold text-white m-0 leading-tight">
                  Permintaan Obat (Resep)
                </h1>
              </div>
              <p className="text-sm text-blue-200 m-0 ml-12">
                Manajemen dan monitor resep yang diterbitkan
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
                icon={<PlusOutlined />}
                onClick={() => navigate('/dashboard/medicine/medication-requests/create')}
                style={{
                  background: '#fff',
                  borderColor: '#fff',
                  color: token.colorPrimaryActive
                }}
              >
                Tambah Permintaan
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
                  {groupedData.length}
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
            <Button onClick={() => setShowOnlyActive((prev) => !prev)}>
              {showOnlyActive ? 'Tampilkan Semua Status' : 'Hanya Status Active'}
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. Main Data Table Card */}
      <Card className="flex-1 overflow-hidden flex flex-col" variant="borderless">
        <Spin spinning={isLoading}>
          <div className="flex-1" style={{ background: token.colorBgContainer }}>
            {isError && (
              <div style={{ color: token.colorErrorText }} className="p-4">
                Gagal memuat data permintaan obat.
              </div>
            )}
            <Table
              dataSource={groupedData}
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
                  const detailColumns = [
                    { title: 'Kategori Item', dataIndex: 'jenis', key: 'jenis' },
                    { title: 'Item', dataIndex: 'namaObat', key: 'namaObat' },
                    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
                    { title: 'Satuan', dataIndex: 'unit', key: 'unit' },
                    { title: 'Kekuatan', dataIndex: 'instruksi', key: 'instruksi' }
                  ]

                  return (
                    <Table
                      columns={detailColumns}
                      dataSource={record.items}
                      pagination={false}
                      size="small"
                      rowKey="key"
                    />
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

export default MedicationRequestTable
