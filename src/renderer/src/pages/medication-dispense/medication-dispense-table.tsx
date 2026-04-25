import { Button, Input, Table, Tag, Card, Spin, theme } from 'antd'
import {
  SyncOutlined,
  MoreOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MedicineBoxOutlined,
  ReloadOutlined,
  FileTextOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import dayjs from 'dayjs'
import type {
  PatientInfo,
  MedicationDispenseAttributes,
  MedicationDispenseListArgs,
  MedicationDispenseListResult,
  MedicationRequestDetailResult,
  ItemAttributes,
  ItemListResponse,
  DispenseItemRow,
  ParentRow,
  StatusFilter
} from './types'
import { getPatientDisplayName, getInstructionText, extractTelaahResults } from './utils'
import { getStatusTag, getStatusLabel } from './component/status-tag'
import { DispenseTimer } from './component/dispense-timer'
import { RowActions } from './component/row-actions'
import { MainRowActions } from './component/main-row-actions'
import { printMedicationLabels } from './component/print-medication-label'

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
    title: 'Telaah',
    key: 'telaah',
    render: (_: any, row: ParentRow) => {
      const mainItems = row.items.filter((i) => i.jenis !== 'Komposisi')
      const isReviewed =
        mainItems.length > 0 && mainItems.every((item) => !!extractTelaahResults(item))
      return isReviewed ? (
        <Tag color="green" icon={<CheckCircleOutlined />}>
          Selesai
        </Tag>
      ) : (
        <Tag color="volcano" icon={<QuestionCircleOutlined />}>
          Belum Ditelaah
        </Tag>
      )
    }
  },
  {
    title: 'Pembayaran',
    dataIndex: 'paymentStatus',
    key: 'paymentStatus',
    render: (val: string | undefined) => {
      const status = val || 'Belum Ditagihkan'
      const color = status === 'Lunas' ? 'green' : status === 'Sebagian' ? 'orange' : 'volcano'
      const icon =
        status === 'Lunas' ? (
          <CheckCircleOutlined />
        ) : status === 'Sebagian' ? (
          <ClockCircleOutlined />
        ) : (
          <CloseCircleOutlined />
        )
      return (
        <Tag color={color} icon={icon}>
          {status}
        </Tag>
      )
    }
  },
  {
    title: 'Sisa Waktu',
    key: 'timer',
    width: 100,
    render: (_: unknown, row: ParentRow) => {
      if (row.status === 'cancelled' || row.status === 'entered-in-error') return '-'
      if (
        row.status !== 'in-progress' &&
        row.status !== 'preparation' &&
        row.status !== 'completed'
      )
        return '-'
      const isBpjs = row.paymentStatus === 'Lunas' && row.encounterType !== 'AMB'
      return (
        <DispenseTimer
          servicedAt={row.servicedAt}
          handedOverAt={row.rawHandedOverAt}
          isBpjs={isBpjs}
        />
      )
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
      .filter(
        (e): e is { id: number; namaLengkap: string } =>
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
      return (fn as any)({ params: { depth: '1' }, depth: '1' })
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

  const itemKekuatanById = useMemo(() => {
    const source: ItemAttributes[] = Array.isArray(itemSource?.result) ? itemSource.result : []
    const map = new Map<number, string>()
    for (const item of source) {
      if (typeof item.id === 'number') {
        const k = (item as any).kekuatan || ''
        if (k) map.set(item.id, String(k))
      }
    }
    return map
  }, [itemSource?.result])

  const itemUnitById = useMemo(() => {
    const source: ItemAttributes[] = Array.isArray(itemSource?.result) ? itemSource.result : []
    const map = new Map<number, string>()
    for (const item of source) {
      if (typeof item.id === 'number') {
        const raw = item as any
        const u =
          raw.unit?.nama ||
          raw.satuan?.nama ||
          raw.unit?.display ||
          raw.satuan?.display ||
          raw.kodeUnit ||
          ''
        if (u) {
          map.set(item.id, String(u).trim())
        }
      }
    }
    return map
  }, [itemSource?.result])

  const itemCaraPenyimpananById = useMemo(() => {
    const source: ItemAttributes[] = Array.isArray(itemSource?.result) ? itemSource.result : []
    const map = new Map<number, string>()
    for (const item of source) {
      if (typeof item.id === 'number') {
        const cp = (item as any).caraPenyimpanan || ''
        if (cp) map.set(item.id, String(cp))
      }
    }
    return map
  }, [itemSource?.result])

  const itemKodeById = useMemo(() => {
    const source: ItemAttributes[] = Array.isArray(itemSource?.result) ? itemSource.result : []
    const map = new Map<number, string>()
    for (const item of source) {
      if (typeof item.id === 'number' && typeof item.kode === 'string') {
        map.set(item.id, item.kode.trim().toUpperCase())
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
    console.log('[MD-Debug] itemSource result:', itemSource?.result)
    console.log('[MD-Debug] itemUnitById map:', itemUnitById)
    console.log('[MD-Debug] itemKodeById map:', itemKodeById)

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
      console.log('[MD-Debug] Original Item:', item)
      const prescription = item.authorizingPrescription

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

              let ingKode = (ing.kode || ing.item_kode || '').trim().toUpperCase()
              if (!ingKode && typeof ingItemId === 'number') {
                ingKode = itemKodeById.get(ingItemId) || ''
              }

              if (ingKode) {
                const batchId = item.identifier?.find(
                  (id: any) => id.system === `batch-number-${ingKode}`
                )
                const expId = item.identifier?.find(
                  (id: any) => id.system === `expiry-date-${ingKode}`
                )
                if (batchId) ingBatch = batchId.value
                if (expId) ingExpiryDate = expId.value
              }

              if (!ingBatch && ing.batchNumber) ingBatch = ing.batchNumber
              if (!ingExpiryDate && ing.expiryDate) ingExpiryDate = ing.expiryDate

              return {
                key: `${key}-${item.id ?? 'grp'}-ing-${idx}`,
                jenis: 'Komposisi',
                medicineName: ingName ?? 'Komposisi',
                quantity: typeof ing.quantity === 'number' ? Math.round(ing.quantity) : undefined,
                unit:
                  ing.unitCode ??
                  ing.unit ??
                  (typeof ingItemId === 'number' ? itemUnitById.get(ingItemId) : undefined),
                status: '',
                instruksi: ing.note ?? ing.instruction,
                batch: ingBatch,
                expiryDate: ingExpiryDate,
                kekuatan: ing.strength
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

            let ingKode = (ing.kode || ing.item_kode || '').trim().toUpperCase()
            if (!ingKode && typeof ingItemId === 'number') {
              ingKode = itemKodeById.get(ingItemId) || ''
            }

            if (item.identifier && Array.isArray(item.identifier)) {
              const sysBatch = `batch-number-${ingKode}`
              const sysExp = `expiry-date-${ingKode}`

              const batchId = item.identifier.find(
                (id: any) =>
                  id.system === sysBatch ||
                  id.system === `batch-number-${ingItemId}` ||
                  (ingKode && id.system?.includes(ingKode))
              )
              const expId = item.identifier.find(
                (id: any) =>
                  id.system === sysExp ||
                  id.system === `expiry-date-${ingItemId}` ||
                  (ingKode && id.system?.includes(ingKode))
              )

              if (batchId) ingBatch = batchId.value
              if (expId) ingExpiryDate = expId.value
            }

            if (!ingBatch && ing.batchNumber) ingBatch = ing.batchNumber
            if (!ingExpiryDate && ing.expiryDate) ingExpiryDate = ing.expiryDate

            return {
              key: `${key}-${item.id ?? 'racik'}-ing-${idx}`,
              jenis: 'Komposisi',
              medicineName: ingName ?? 'Komposisi',
              quantity: typeof ing.quantity === 'number' ? Math.round(ing.quantity) : undefined,
              unit:
                (ing.unitCode ??
                  ing.unit ??
                  (typeof ingItemId === 'number' ? itemUnitById.get(ingItemId) : undefined)) ||
                '-',
              status: '',
              instruksi: ing.note ?? ing.instruction,
              batch: ingBatch || '-',
              expiryDate: ingExpiryDate || '-',
              kekuatan:
                ing.strength ||
                (typeof ingItemId === 'number' ? itemKekuatanById.get(ingItemId) : undefined) ||
                '-',
              caraPenyimpanan:
                typeof ingItemId === 'number' ? itemCaraPenyimpananById.get(ingItemId) : undefined
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
        unit:
          quantityUnit ||
          (typeof item.itemId === 'number' ? itemUnitById.get(item.itemId) : undefined) ||
          '-',
        status: item.status,
        performerName: item.performer?.name,
        instruksi,
        availableStock:
          typeof item.medication?.stock === 'number' ? item.medication.stock : undefined,
        paymentStatus: item.paymentStatus,
        kekuatan: (() => {
          if (!Array.isArray(prescription?.supportingInformation))
            return (
              (typeof item.itemId === 'number' ? itemKekuatanById.get(item.itemId) : undefined) ||
              '-'
            )
          const ing = prescription.supportingInformation.find(
            (i: any) =>
              i.resourceType === 'Ingredient' ||
              i.itemId === item.itemId ||
              i.item_id === item.itemId
          )
          return (
            ing?.strength ||
            (typeof item.itemId === 'number' ? itemKekuatanById.get(item.itemId) : undefined) ||
            '-'
          )
        })(),
        fhirId:
          typeof item.fhirId === 'string' && item.fhirId.trim().length > 0
            ? item.fhirId.trim()
            : undefined,
        caraPenyimpanan:
          typeof item.itemId === 'number' ? itemCaraPenyimpananById.get(item.itemId) : undefined,
        note: item.note,
        telaah: item.telaah,
        penyiapObatId: item.penyiapObatId,
        pelabelObatId: item.pelabelObatId,
        penyerahObatId: item.penyerahObatId,
        namaPenerima: item.namaPenerima,
        hubunganPenerima: item.hubunganPenerima,
        children
      }

      if (Array.isArray(item.identifier)) {
        const identifiers = item.identifier
        const batchId = identifiers.find(
          (id) => id.system === 'batch-number' || id.system.startsWith('batch-number-')
        )
        const expiryId = identifiers.find(
          (id) => id.system === 'expiry-date' || id.system.startsWith('expiry-date-')
        )
        if (batchId) rowItem.batch = batchId.value
        if (expiryId) rowItem.expiryDate = expiryId.value
      }

      if (!rowItem.batch) rowItem.batch = '-'
      if (!rowItem.expiryDate) rowItem.expiryDate = '-'

      if (
        !rowItem.batch &&
        !rowItem.expiryDate &&
        isItem &&
        Array.isArray(prescription?.supportingInformation)
      ) {
        const batchInfo = (
          prescription.supportingInformation as Array<Record<string, unknown>>
        ).find((info) => info.resourceType === 'StockBatch')
        if (batchInfo) {
          const bn = batchInfo.batchNumber as string | undefined
          const exp = batchInfo.expiryDate as string | undefined
          if (bn && bn.trim().length > 0) (rowItem as any).batch = bn.trim()
          if (exp && exp.trim().length > 0) (rowItem as any).expiryDate = exp.trim()
        }
      }

      console.log('[MD-Debug] rowItem prepared:', rowItem)

      const existing = groups.get(key)
      if (!existing) {
        let resepturName: string | undefined
        if (Array.isArray(prescription?.supportingInformation)) {
          const resepturEntry = (
            prescription.supportingInformation as Array<Record<string, unknown>>
          ).find((info) => {
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
        const isDuplicate = existing.items.some((r) => r.id === item.id)
        if (!isDuplicate) {
          existing.items.push(rowItem)
        }
        if (!existing.servicedAt && item.servicedAt) {
          existing.servicedAt = item.servicedAt
        }
      }
    })

    const result = Array.from(groups.values())
    console.log('[MD-Debug] Final Grouped Data:', result)
    return result
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
                    { title: 'Kekuatan', dataIndex: 'kekuatan', key: 'kekuatan' },
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
