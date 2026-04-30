/**
 * purpose: Render nurse triage queue table with filters, status tabs, and side summary panel.
 * main callers: Nurse calling route for queue triage workflow.
 * key dependencies: Ant Design table/form controls, React Query queue sources, queue status mutation APIs.
 * main/public functions: `PatientQueueTable`.
 * side effects: Reads queue/encounter data, updates queue status actions, and opens nurse medical record windows.
 */
import { useMemo, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Button,
  Tag,
  Select,
  Segmented,
  Space,
  Card,
  App,
  Input,
  DatePicker,
  Badge,
  theme
} from 'antd'
import {
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  UserAddOutlined,
  MedicineBoxOutlined,
  SoundOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useModuleScopeStore } from '@renderer/services/ModuleScope/store'
import { client, rpc } from '@renderer/utils/client'
import { DesktopGenericTable } from '@renderer/components/design-system/organisms/DesktopGenericTable'
import { PatientQueue, Gender } from '../../types/nurse.types'

const { Option } = Select
const { RangePicker } = DatePicker

interface PatientQueueTableData extends Omit<PatientQueue, 'status'> {
  no: number
  key: string
  status: string
  queueId: string
  formattedQueueNumber?: string
  triageUpdatedAt?: string
  encounterType?: string
  queueNumber: number
}

type QueueRow = {
  queueId?: string
  id?: string
  queueNumber?: number | string
  formattedQueueNumber?: string
  queueDate?: string
  patientId?: string
  patientName?: string
  patientBirthDate?: string | Date
  patientMedicalRecordNumber?: string
  doctorName?: string
  poliCodeId?: number | string
  poliName?: string
  status?: string
  encounterId?: string
  createdAt?: string
  updatedAt?: string
}

type QueueListResponse = {
  success?: boolean
  result?: QueueRow[]
  error?: string
}

type ScopedPoli = {
  id: string
  name: string
  code: string
  lokasiKerjaId?: number
}

const NURSE_DEFAULT_STATUS = 'TRIAGE'
const NURSE_TRIAGE_STATUS = 'TRIAGE'

const STATUS_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
  all: { label: 'Semua', color: '', dotColor: '#6b7280' },
  TRIAGE: { label: 'Pemeriksaan Awal', color: 'gold', dotColor: '#f59e0b' }
}

const STATUS_DISPLAY_CONFIG: Record<string, { label: string; color: string }> = {
  TRIAGE: { label: 'Pemeriksaan Awal', color: 'gold' },
  CHECKED_IN: { label: 'Check-in', color: 'cyan' },
  IN_PROGRESS: { label: 'Diperiksa Dokter', color: 'orange' },
  FINISHED: { label: 'Selesai', color: 'green' },
  CANCELLED: { label: 'Dibatalkan', color: 'red' },
  EXPIRED: { label: 'Kedaluwarsa', color: 'default' },
  NO_SHOW: { label: 'Tidak Hadir', color: 'default' }
}

const normalizePoliCode = (value: string | number) => String(value).trim().toLowerCase()
const decodePoliCode = (value: string) => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const parseQueueNumber = (value?: number | string) => {
  const parsed = Number.parseInt(String(value ?? '0'), 10)
  return Number.isFinite(parsed) ? parsed : 0
}

const toQueueSummaryType = (value?: string) => {
  const source = String(value || '').trim().toUpperCase()
  if (!source) return '-'
  if (source === 'EMER') return 'IGD'
  if (source === 'AMB') return 'Rawat Jalan'
  if (source === 'IMP') return 'Rawat Inap'
  return source
}

const parseTimestamp = (value?: string) => {
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.valueOf() : 0
}

const toStatusLabel = (status: string) => {
  const value = String(status || '').trim()
  if (!value) return '-'
  const mapped = STATUS_DISPLAY_CONFIG[value]
  if (mapped) return mapped.label
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const buildDateRangeList = (range: [dayjs.Dayjs, dayjs.Dayjs]): string[] => {
  const [startRaw, endRaw] = range
  const start = startRaw.isAfter(endRaw, 'day') ? endRaw : startRaw
  const end = endRaw.isAfter(startRaw, 'day') ? endRaw : startRaw

  const dates: string[] = []
  let cursor = start.startOf('day')
  const last = end.startOf('day')

  while (cursor.isBefore(last) || cursor.isSame(last, 'day')) {
    dates.push(cursor.format('YYYY-MM-DD'))
    cursor = cursor.add(1, 'day')
  }

  return dates
}

const PatientQueueTable = () => {
  const { message, modal } = App.useApp()
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const { poliCode: rawPoliCode } = useParams<{ poliCode?: string }>()
  const { session } = useModuleScopeStore()
  const isAdministrator = session?.hakAksesId === 'administrator'
  const routePoliCode = rawPoliCode ? normalizePoliCode(decodePoliCode(rawPoliCode)) : undefined
  const isPoliLockedFromRoute = Boolean(routePoliCode)

  const [searchText, setSearchText] = useState('')
  const [selectedPoli, setSelectedPoli] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>([dayjs(), dayjs()])
  const [activeStatus, setActiveStatus] = useState<string>(NURSE_DEFAULT_STATUS)
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const { data: poliData, isLoading: isPoliLoading } = client.visitManagement.poli.useQuery({})
  const scopedPolis = useMemo<ScopedPoli[]>(() => {
    const allPolis = poliData?.result ?? []
    return allPolis
      .map((poli) => ({
        id: String(poli.id),
        name: poli.name,
        code: String(poli.code || poli.id),
        lokasiKerjaId:
          typeof poli.location?.id === 'number'
            ? poli.location.id
            : Number.parseInt(String(poli.location?.id), 10)
      }))
      .filter((poli) => {
        if (isAdministrator) return true
        if (!session) return false
        return poli.lokasiKerjaId === session.lokasiKerjaId
      })
  }, [isAdministrator, poliData?.result, session])
  const scopedPoliIdSet = useMemo(() => new Set(scopedPolis.map((poli) => poli.id)), [scopedPolis])
  const routePoli = useMemo(() => {
    if (!routePoliCode) return undefined
    return scopedPolis.find((poli) => normalizePoliCode(poli.code) === routePoliCode)
  }, [routePoliCode, scopedPolis])

  useEffect(() => {
    if (!routePoliCode) return
    if (isPoliLoading) return

    if (!routePoli) {
      message.error('Poli tidak ditemukan atau tidak sesuai lokasi kerja.')
      navigate('/dashboard/poli', { replace: true })
      return
    }

    if (selectedPoli !== routePoli.id) {
      setSelectedPoli(routePoli.id)
    }
  }, [isPoliLoading, message, navigate, routePoli, routePoliCode, selectedPoli])

  useEffect(() => {
    if (isPoliLockedFromRoute) return
    setSelectedPoli(undefined)
  }, [isPoliLockedFromRoute])

  useEffect(() => {
    if (routePoliCode) return
    if (!selectedPoli) return
    if (!scopedPoliIdSet.has(selectedPoli)) {
      setSelectedPoli(undefined)
    }
  }, [routePoliCode, scopedPoliIdSet, selectedPoli])

  const normalizedDateRange = useMemo<[dayjs.Dayjs, dayjs.Dayjs] | null>(() => {
    if (!dateRange) return null
    const [start, end] = dateRange
    return start.isAfter(end, 'day') ? [end, start] : [start, end]
  }, [dateRange])

  const {
    data: queueData,
    isLoading,
    refetch
  } = useQuery<QueueListResponse>({
    queryKey: [
      'nurse',
      'queue-list',
      normalizedDateRange?.[0]?.format('YYYY-MM-DD') || 'all',
      normalizedDateRange?.[1]?.format('YYYY-MM-DD') || 'all'
    ],
    queryFn: async () => {
      if (!normalizedDateRange) {
        const fn = window.api?.query?.encounter?.list
        if (!fn) {
          throw new Error('API encounter tidak tersedia')
        }

        const pageSize = 100
        let page = 1
        const allEncounters: any[] = []

        while (page <= 20) {
          const response = await fn({
            page: String(page),
            items: String(pageSize),
            sortBy: 'updatedAt',
            sortOrder: 'DESC'
          })

          if ((response as any)?.success === false) {
            throw new Error((response as any)?.error || 'Gagal memuat data encounter')
          }

          const rows = Array.isArray((response as any)?.result) ? (response as any).result : []
          if (rows.length === 0) break

          allEncounters.push(...rows)
          if (rows.length < pageSize) break
          page += 1
        }

        const result: QueueRow[] = allEncounters.map((encounter: any) => {
          const queueTicket = encounter?.queueTicket || {}
          const patient = encounter?.patient || {}
          const poli = queueTicket?.poli || {}
          const practitioner = queueTicket?.practitioner || {}
          const serviceUnit = encounter?.serviceUnit || {}

          return {
            queueId: queueTicket?.id ? String(queueTicket.id) : undefined,
            id: queueTicket?.id
              ? String(queueTicket.id)
              : encounter?.id
                ? String(encounter.id)
                : undefined,
            queueNumber: queueTicket?.queueNumber,
            formattedQueueNumber: queueTicket?.formattedQueueNumber,
            queueDate:
              queueTicket?.queueDate ||
              encounter?.visitDate ||
              encounter?.startTime ||
              encounter?.createdAt,
            createdAt: queueTicket?.createdAt || encounter?.createdAt,
            updatedAt: queueTicket?.updatedAt || encounter?.updatedAt,
            patientId: patient?.id ? String(patient.id) : undefined,
            patientName: patient?.name,
            patientBirthDate: patient?.birthDate,
            patientMedicalRecordNumber:
              patient?.medicalRecordNumber || patient?.medical_record_number,
            doctorName: practitioner?.namaLengkap || practitioner?.name,
            poliCodeId: queueTicket?.poliCodeId || poli?.id || encounter?.serviceUnitId,
            poliName: poli?.name || serviceUnit?.name,
            status: queueTicket?.status || encounter?.status,
            encounterId: encounter?.id ? String(encounter.id) : undefined
          }
        })

        return {
          success: true,
          result
        }
      }

      const dates = buildDateRangeList(normalizedDateRange)
      const responses = await Promise.allSettled(
        dates.map((queueDate) => rpc.registration.getQueues({ queueDate }))
      )

      const mergedRows = new Map<string, QueueRow>()
      responses.forEach((response) => {
        if (response.status !== 'fulfilled') return
        const payload = response.value as QueueListResponse
        const rows = Array.isArray(payload?.result) ? payload.result : []
        rows.forEach((row) => {
          const dedupeKey = String(
            row.queueId ||
              row.id ||
              `${row.queueDate || ''}-${row.queueNumber || ''}-${row.patientId || ''}`
          )
          if (!mergedRows.has(dedupeKey)) {
            mergedRows.set(dedupeKey, row)
          }
        })
      })

      return {
        success: true,
        result: Array.from(mergedRows.values())
      }
    }
  })
  const updateStatusMutation = client.registration.updateQueueStatus.useMutation()

  const fallbackDateIso = useMemo(
    () => (normalizedDateRange?.[1] || dayjs()).toISOString(),
    [normalizedDateRange]
  )

  useEffect(() => {
    const refreshIntervalMs = normalizedDateRange ? 5000 : 15000
    const intervalId = window.setInterval(() => {
      refetch()
    }, refreshIntervalMs)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [normalizedDateRange, refetch])

  const baseFilteredQueues = useMemo(() => {
    const rows = (queueData?.result || []) as QueueRow[]
    const search = searchText.trim().toLowerCase()

    return rows
      .filter((row) => {
        const queuePoliId = row.poliCodeId != null ? String(row.poliCodeId) : ''
        if (!queuePoliId || !scopedPoliIdSet.has(queuePoliId)) return false
        if (selectedPoli && queuePoliId !== selectedPoli) return false

        if (!search) return true
        const patientName = String(row.patientName || '').toLowerCase()
        const queueLabel = String(row.formattedQueueNumber || row.queueNumber || '').toLowerCase()
        return patientName.includes(search) || queueLabel.includes(search)
      })
      .sort(
        (a, b) =>
          parseTimestamp(b.updatedAt || b.createdAt || b.queueDate) -
          parseTimestamp(a.updatedAt || a.createdAt || a.queueDate)
      )
  }, [queueData?.result, scopedPoliIdSet, searchText, selectedPoli])

  const filteredQueues = useMemo(() => {
    if (activeStatus === 'all') return baseFilteredQueues
    return baseFilteredQueues.filter((row) => String(row.status || '') === activeStatus)
  }, [activeStatus, baseFilteredQueues])

  const patientQueue: PatientQueueTableData[] = useMemo(() => {
    const sortedRows = [...filteredQueues].sort(
      (a, b) =>
        parseTimestamp(b.updatedAt || b.createdAt || b.queueDate) -
        parseTimestamp(a.updatedAt || a.createdAt || a.queueDate)
    )

    return filteredQueues.map((row, index) => {
      const queueId = String(row.queueId || row.id || '')
      const queueNumber = parseQueueNumber(row.queueNumber)
      const formattedQueueNumber =
        row.formattedQueueNumber || (queueNumber > 0 ? String(queueNumber) : '-')
      const triageUpdatedAt = row.updatedAt || row.createdAt || row.queueDate || fallbackDateIso
      const registrationDate = row.queueDate || row.createdAt || fallbackDateIso

      return {
        no: index + 1,
        key: queueId || String(index),
        id: queueId || String(index),
        queueId,
        encounterId: row.encounterId,
        queueNumber,
        formattedQueueNumber,
        triageUpdatedAt,
        patient: {
          id: String(row.patientId || ''),
          name: row.patientName || 'Unknown',
          medicalRecordNumber: row.patientMedicalRecordNumber || '-',
          gender: Gender.MALE,
          birthDate: row.patientBirthDate ? String(row.patientBirthDate) : '',
          age: row.patientBirthDate ? dayjs().diff(dayjs(row.patientBirthDate), 'year') : 0,
          phone: '',
          address: '',
          identityNumber: ''
        },
        poli: {
          id: String(row.poliCodeId || ''),
          code: String(row.poliCodeId || ''),
          name: row.poliName || '-'
        },
        doctor: {
          id: '',
          name: row.doctorName || '-',
          specialization: 'General',
          sipNumber: '-'
        },
        status: String(row.status || ''),
        registrationDate,
        encounterType: 'AMB'
      }
    })
  }, [fallbackDateIso, filteredQueues])

  const allPatientQueue: PatientQueueTableData[] = useMemo(() => {
    return baseFilteredQueues.map((row, index) => {
      const queueId = String(row.queueId || row.id || '')
      const queueNumber = parseQueueNumber(row.queueNumber)
      const formattedQueueNumber =
        row.formattedQueueNumber || (queueNumber > 0 ? String(queueNumber) : '-')
      const triageUpdatedAt = row.updatedAt || row.createdAt || row.queueDate || fallbackDateIso
      const registrationDate = row.queueDate || row.createdAt || fallbackDateIso

      return {
        no: index + 1,
        key: queueId || String(index),
        id: queueId || String(index),
        queueId,
        encounterId: row.encounterId,
        queueNumber,
        formattedQueueNumber,
        triageUpdatedAt,
        patient: {
          id: String(row.patientId || ''),
          name: row.patientName || 'Unknown',
          medicalRecordNumber: row.patientMedicalRecordNumber || '-',
          gender: Gender.MALE,
          birthDate: row.patientBirthDate ? String(row.patientBirthDate) : '',
          age: row.patientBirthDate ? dayjs().diff(dayjs(row.patientBirthDate), 'year') : 0,
          phone: '',
          address: '',
          identityNumber: ''
        },
        poli: {
          id: String(row.poliCodeId || ''),
          code: String(row.poliCodeId || ''),
          name: row.poliName || '-'
        },
        doctor: {
          id: '',
          name: row.doctorName || '-',
          specialization: 'General',
          sipNumber: '-'
        },
        status: String(row.status || ''),
        registrationDate,
        encounterType: 'AMB'
      }
    })
  }, [baseFilteredQueues, fallbackDateIso])

  const latestTriageQueue = allPatientQueue.find((queue) => queue.status === NURSE_TRIAGE_STATUS)

  useEffect(() => {
    if (patientQueue.length === 0) {
      setSelectedQueueId(null)
      return
    }

    if (!selectedQueueId || !patientQueue.some((queue) => queue.queueId === selectedQueueId)) {
      setSelectedQueueId(patientQueue[0].queueId)
    }
  }, [patientQueue, selectedQueueId])

  const selectedQueue = useMemo(() => {
    if (!selectedQueueId) return patientQueue[0]
    return patientQueue.find((queue) => queue.queueId === selectedQueueId) || patientQueue[0]
  }, [patientQueue, selectedQueueId])
  const selectedQueueLosDays = useMemo(() => {
    if (!selectedQueue?.registrationDate) return 0
    const diff = dayjs().startOf('day').diff(dayjs(selectedQueue.registrationDate).startOf('day'), 'day')
    return Math.max(0, diff)
  }, [selectedQueue?.registrationDate])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(patientQueue.length / perPage)),
    [patientQueue.length, perPage]
  )
  const safePage = Math.min(currentPage, totalPages)
  const startIdx = (safePage - 1) * perPage
  const paginatedQueue = useMemo(
    () => patientQueue.slice(startIdx, startIdx + perPage),
    [patientQueue, startIdx, perPage]
  )
  const pageWindow = useMemo(() => {
    let start = Math.max(1, safePage - 2)
    const end = Math.min(totalPages, start + 4)
    start = Math.max(1, end - 4)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [safePage, totalPages])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const markAsTriage = async (record: PatientQueueTableData) => {
    await updateStatusMutation.mutateAsync({
      queueId: record.queueId,
      action: 'CALL_TO_TRIAGE'
    })
    message.success(`Antrian ${record.formattedQueueNumber} dipanggil ke Triage`)
  }

  const handleExaminePatient = (record: PatientQueueTableData) => {
    if (!record.encounterId) {
      message.warning('Encounter belum tersedia untuk pasien ini.')
      return
    }

    window.open(`#/dashboard/nurse-calling/medical-record/${record.encounterId}`, '_blank')
  }
  const handleFeatureNotReady = () => {
    message.info('Fitur ini belum tersedia sebagai halaman terpisah.')
  }

  const handleMoveToPoliQueue = (record: PatientQueueTableData) => {
    if (record.status !== NURSE_TRIAGE_STATUS) {
      message.warning('Hanya pasien status TRIAGE yang bisa dipindahkan ke antrean poli.')
      return
    }

    if (!record.queueId) {
      message.error('ID Antrian tidak ditemukan')
      return
    }

    modal.confirm({
      title: 'Selesai & Pindahkan ke Antrean Poli?',
      content:
        'Pemeriksaan awal sudah selesai? Status antrian pasien akan dipindah menjadi "Siap Diperiksa" oleh Dokter.',
      okText: 'Ya, Lanjutkan',
      cancelText: 'Batal',
      onOk: async () => {
        try {
          await updateStatusMutation.mutateAsync({
            queueId: record.queueId,
            action: 'TRIAGE_DONE'
          })
          message.success('Status antrian berhasil diperbarui')
          refetch()
        } catch (error: any) {
          message.error(error.message || 'Gagal memproses antrian')
        }
      }
    })
  }

  const getStatusTag = (status: string) => {
    const cfg = STATUS_DISPLAY_CONFIG[status]
    if (!cfg) {
      return (
        <Tag color="default" bordered={false} className="font-medium rounded-md">
          {toStatusLabel(status)}
        </Tag>
      )
    }

    return (
      <Tag color={cfg.color} bordered={false} className="font-medium rounded-md">
        {cfg.label}
      </Tag>
    )
  }

  const totalTriage = allPatientQueue.filter((p) => p.status === NURSE_TRIAGE_STATUS).length
  const latestTriageQueueId = latestTriageQueue?.queueId
  const latestTriageTime = latestTriageQueue?.triageUpdatedAt
    ? dayjs(latestTriageQueue.triageUpdatedAt).format('HH:mm')
    : '-'

  const columns: ColumnsType<PatientQueueTableData> = [
    {
      title: '#',
      dataIndex: 'no',
      key: 'no',
      width: 44,
      align: 'center',
      render: (num: number) => (
        <span style={{ fontSize: 12, fontWeight: 500, color: token.colorTextTertiary }}>{num}</span>
      )
    },
    {
      title: 'Antrian',
      dataIndex: 'formattedQueueNumber',
      key: 'queueNumber',
      width: 170,
      render: (queueLabel: string, record) => (
        <div className="flex items-center gap-2">
          <Tag color="blue" bordered={false} className="font-mono font-semibold m-0 w-fit">
            {queueLabel || '-'}
          </Tag>
          {record.queueId === latestTriageQueueId ? (
            <Badge
              color={token.colorSuccess}
              text={<span style={{ fontSize: 10 }}>Terbaru</span>}
            />
          ) : null}
        </div>
      )
    },
    {
      title: 'Tanggal Antrian',
      dataIndex: 'registrationDate',
      key: 'registrationDate',
      width: 160,
      render: (date: string) => (
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: token.colorText }}>
            {date ? dayjs(date).format('DD MMM YYYY') : '-'}
          </div>
          <div style={{ fontSize: 12, color: token.colorTextTertiary }}>
            {date ? dayjs(date).format('HH:mm') : '-'}
          </div>
        </div>
      )
    },
    {
      title: 'Pasien',
      key: 'patientInfo',
      width: 240,
      render: (_, record) => (
        <div className="flex items-center gap-3 py-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: token.colorPrimaryBg,
              border: `1px solid ${token.colorPrimaryBorder}`
            }}
          >
            <span style={{ color: token.colorPrimary, fontSize: 12, fontWeight: 700 }}>
              {record.patient.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <div
              style={{ fontWeight: 600, fontSize: 14, color: token.colorText }}
              className="truncate leading-tight"
            >
              {record.patient.name}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="font-mono rounded"
                style={{
                  fontSize: 10,
                  color: token.colorTextTertiary,
                  background: token.colorFillAlter,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  padding: '1px 6px'
                }}
              >
                {record.patient.medicalRecordNumber || '-'}
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Jenis Kelamin',
      key: 'gender',
      width: 120,
      render: (_, record) => (
        <span style={{ fontSize: 13, color: token.colorText, fontWeight: 500 }}>
          {record.patient.gender === Gender.MALE ? 'Laki-laki' : 'Perempuan'}
        </span>
      )
    },
    {
      title: 'Umur',
      key: 'age',
      width: 80,
      render: (_, record) => (
        <span style={{ fontSize: 13, color: token.colorText, fontWeight: 500 }}>
          {record.patient.age} th
        </span>
      )
    },
    {
      title: 'Unit / Jenis',
      key: 'unitJenis',
      width: 180,
      render: (_, record) => (
        <div>
          <div
            style={{ fontSize: 14, fontWeight: 500, color: token.colorText }}
            className="truncate"
          >
            {record.poli.name}
          </div>
          <Tag color="blue" bordered={false} className="mt-0.5 text-[10px] font-medium m-0">
            Rawat Jalan
          </Tag>
        </div>
      )
    },
    {
      title: 'Dokter Tujuan',
      key: 'doctor',
      width: 150,
      render: (_, record) => (
        <div
          style={{ fontSize: 13, color: token.colorText, fontWeight: 500 }}
          className="truncate"
          title={record.doctor.name}
        >
          {record.doctor.name}
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 280,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space size={6} onClick={(e) => e.stopPropagation()}>
          <Button
            type="primary"
            icon={<MedicineBoxOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              handleExaminePatient(record)
            }}
            size="small"
            disabled={updateStatusMutation.isPending || !record.encounterId}
            style={{ background: '#f97316', borderColor: '#f97316' }}
          >
            Periksa
          </Button>
          {record.status === NURSE_TRIAGE_STATUS && (
            <Button
              type="primary"
              icon={<SoundOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                handleMoveToPoliQueue(record)
              }}
              size="small"
              loading={updateStatusMutation.isPending}
              disabled={updateStatusMutation.isPending}
            >
              Pindahkan ke Poli
            </Button>
          )}
        </Space>
      )
    }
  ]

  const statusTabItems = Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
    const count =
      key === 'all'
        ? allPatientQueue.length
        : allPatientQueue.filter((p) => p.status === key).length

    return {
      value: key,
      label: (
        <span className="flex items-center gap-1.5 px-1">
          {cfg.label}
          {count > 0 && (
            <span
              className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[10px] leading-none"
              style={{ background: cfg.dotColor, color: token.colorBgContainer }}
            >
              {count}
            </span>
          )}
        </span>
      )
    }
  })
  const isDefaultDateRange = Boolean(
    dateRange?.[0]?.isSame(dayjs(), 'day') && dateRange?.[1]?.isSame(dayjs(), 'day')
  )
  const hasActiveFilters =
    searchText.trim().length > 0 ||
    (!isPoliLockedFromRoute && Boolean(selectedPoli)) ||
    !isDefaultDateRange ||
    activeStatus !== NURSE_DEFAULT_STATUS
  const clearFilters = () => {
    setSearchText('')
    if (!isPoliLockedFromRoute) setSelectedPoli(undefined)
    setDateRange([dayjs(), dayjs()])
    setActiveStatus(NURSE_DEFAULT_STATUS)
    setCurrentPage(1)
  }

  return (
    <div className="flex flex-col gap-4 h-full">
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
                  <UserAddOutlined
                    className="text-white text-base"
                    style={{ color: token.colorSuccessBg, fontSize: 16 }}
                  />
                </div>
                <h1 className="text-xl font-bold text-white m-0 leading-tight">
                  Antrian Pemeriksaan Awal
                </h1>
              </div>
              <p className="text-sm text-blue-200 m-0 ml-12">
                Menampilkan pasien yang sudah dipanggil ke pemeriksaan awal (triase)
              </p>
            </div>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              loading={isLoading}
              style={{
                background: 'rgba(255,255,255,0.1)',
                borderColor: 'rgba(255,255,255,0.3)',
                color: '#fff'
              }}
            >
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                <TeamOutlined style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {patientQueue.length}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Total Antrian
                </div>
              </div>
            </div>
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${token.colorInfo}33` }}
              >
                <ClockCircleOutlined style={{ color: token.colorInfoBg, fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {totalTriage}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Pemeriksaan Awal
                </div>
              </div>
            </div>
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${token.colorSuccess}33` }}
              >
                <MedicineBoxOutlined style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <div className="min-w-0">
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Antrian TRIAGE Terbaru
                </div>
                {latestTriageQueue ? (
                  <>
                    <div
                      className="truncate"
                      style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.25 }}
                      title={`${latestTriageQueue.formattedQueueNumber || '-'} • ${latestTriageQueue.patient.name} • ${latestTriageQueue.poli.name} • ${latestTriageTime}`}
                    >
                      {latestTriageQueue.formattedQueueNumber || '-'} •{' '}
                      {latestTriageQueue.patient.name}
                    </div>
                    <div
                      className="truncate"
                      style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}
                    >
                      {latestTriageQueue.poli.name} • {latestTriageTime}
                    </div>
                  </>
                ) : (
                  <div
                    className="truncate"
                    style={{ fontSize: 12, color: 'rgba(255,255,255,0.80)', lineHeight: 1.2 }}
                  >
                    Belum ada antrian TRIAGE
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
        <Card
          className="flex-1 overflow-hidden flex flex-col"
          variant="borderless"
          styles={{ body: { padding: 0 } }}
        >
          <div
            className="px-4 py-3"
            style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}
          >
            <div className="flex gap-2 items-center flex-wrap">
              <div className="min-w-[260px] flex-1">
                <Input
                  placeholder="Cari nama pasien atau nomor antrian..."
                  prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value)
                    setCurrentPage(1)
                  }}
                  allowClear
                />
              </div>
              <Segmented
                value={activeStatus}
                onChange={(value) => {
                  setActiveStatus(String(value))
                  setCurrentPage(1)
                }}
                options={statusTabItems}
              />
            </div>

            <div className="flex gap-2 mt-3 items-center flex-wrap">
              <Select
                placeholder={isPoliLockedFromRoute ? 'Unit Terkunci' : 'Semua Unit'}
                className="min-w-[220px] flex-1 max-w-[300px]"
                allowClear={!isPoliLockedFromRoute}
                disabled={isPoliLockedFromRoute}
                value={selectedPoli}
                onChange={(value) => {
                  setSelectedPoli(value)
                  setCurrentPage(1)
                }}
              >
                {scopedPolis.map((poli) => (
                  <Option key={poli.id} value={poli.id}>
                    {poli.name}
                  </Option>
                ))}
              </Select>
              <RangePicker
                value={dateRange}
                onChange={(dates) => {
                  setDateRange((dates as [dayjs.Dayjs, dayjs.Dayjs]) || null)
                  setCurrentPage(1)
                }}
                format="DD MMM YYYY"
                allowClear
              />
              {hasActiveFilters && (
                <Button type="text" size="small" onClick={clearFilters}>
                  Reset filter
                </Button>
              )}
              <span className="ml-auto text-xs" style={{ color: token.colorTextTertiary }}>
                <b style={{ color: token.colorText }}>{patientQueue.length}</b> hasil
              </span>
            </div>
          </div>

          <div className="px-0 pb-0">
            <DesktopGenericTable<PatientQueueTableData>
              columns={columns}
              dataSource={paginatedQueue}
              rowKey="key"
              loading={isLoading || isPoliLoading}
              tableProps={{
                scroll: { x: 1250, y: 'calc(100vh - 460px)' },
                size: 'middle',
                onRow: (record) => ({
                  onClick: () => setSelectedQueueId(record.queueId),
                  style: {
                    cursor: 'pointer',
                    background:
                      record.queueId === selectedQueue?.queueId ? token.colorPrimaryBg : undefined
                  }
                })
              }}
            />
          </div>
          <div
            className="px-4 py-2 flex items-center gap-2 text-xs"
            style={{ borderTop: `1px solid ${token.colorBorderSecondary}` }}
          >
            <span style={{ color: token.colorTextSecondary }}>
              {patientQueue.length === 0
                ? 'Tidak ada data'
                : `Menampilkan ${startIdx + 1}-${Math.min(startIdx + perPage, patientQueue.length)} dari ${patientQueue.length} pasien`}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safePage === 1}
                className="px-2 py-0.5 rounded border text-xs"
                style={{ borderColor: token.colorBorderSecondary, background: token.colorBgContainer }}
              >
                «
              </button>
              <button
                onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                disabled={safePage === 1}
                className="px-2 py-0.5 rounded border text-xs"
                style={{ borderColor: token.colorBorderSecondary, background: token.colorBgContainer }}
              >
                ‹
              </button>
              {pageWindow.map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className="px-2.5 py-0.5 rounded border text-xs"
                  style={{
                    borderColor:
                      pageNumber === safePage ? token.colorPrimary : token.colorBorderSecondary,
                    background: pageNumber === safePage ? token.colorPrimary : token.colorBgContainer,
                    color: pageNumber === safePage ? '#fff' : token.colorText
                  }}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                disabled={safePage === totalPages}
                className="px-2 py-0.5 rounded border text-xs"
                style={{ borderColor: token.colorBorderSecondary, background: token.colorBgContainer }}
              >
                ›
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage === totalPages}
                className="px-2 py-0.5 rounded border text-xs"
                style={{ borderColor: token.colorBorderSecondary, background: token.colorBgContainer }}
              >
                »
              </button>
              <select
                value={perPage}
                onChange={(event) => {
                  setPerPage(Number(event.target.value))
                  setCurrentPage(1)
                }}
                className="px-2 py-0.5 rounded border text-xs"
                style={{ borderColor: token.colorBorderSecondary, background: token.colorBgContainer }}
              >
                <option value={5}>5 / hal</option>
                <option value={10}>10 / hal</option>
                <option value={25}>25 / hal</option>
                <option value={50}>50 / hal</option>
              </select>
            </div>
          </div>
        </Card>

        <Card
          title={
            <div className="flex items-center justify-between">
              <span>Ringkasan</span>
              <Tag className="m-0" color="blue">
                {selectedQueue?.poli.name || '-'}
              </Tag>
            </div>
          }
          variant="borderless"
          styles={{
            head: { padding: '12px 16px', minHeight: 0 },
            body: { padding: '12px 16px' }
          }}
        >
          {selectedQueue ? (
            <div className="flex flex-col gap-4">
              <div
                className="flex items-center gap-3 pb-3 border-b"
                style={{ borderColor: token.colorBorderSecondary }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: token.colorPrimaryBg,
                    border: `1px solid ${token.colorPrimaryBorder}`
                  }}
                >
                  <span style={{ color: token.colorPrimary, fontSize: 13, fontWeight: 700 }}>
                    {selectedQueue.patient.name
                      .split(' ')
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{selectedQueue.patient.name}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {selectedQueue.patient.age} th · {selectedQueue.patient.medicalRecordNumber || '-'}
                  </div>
                </div>
              </div>

              <div
                className="grid grid-cols-2 gap-3 text-xs pb-2 border-b"
                style={{ borderColor: token.colorBorderSecondary }}
              >
                <div>
                  <div className="text-gray-500 uppercase font-semibold tracking-wide">Dx</div>
                  <div className="font-medium">
                    {toQueueSummaryType(selectedQueue.encounterType)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 uppercase font-semibold tracking-wide">LOS</div>
                  <div className="font-medium">{selectedQueueLosDays} hari</div>
                </div>
                <div>
                  <div className="text-gray-500 uppercase font-semibold tracking-wide">
                    Est. Pulang
                  </div>
                  <div className="font-medium">
                    {selectedQueue.status === 'FINISHED'
                      ? dayjs(selectedQueue.registrationDate).format('DD MMM YYYY')
                      : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 uppercase font-semibold tracking-wide">SEP</div>
                  <div className="font-medium">-</div>
                </div>
                <div>
                  <div className="text-gray-500 uppercase font-semibold tracking-wide">Status</div>
                  <div>{getStatusTag(selectedQueue.status)}</div>
                </div>
                <div>
                  <div className="text-gray-500 uppercase font-semibold tracking-wide">Antrian</div>
                  <div className="font-medium">{selectedQueue.formattedQueueNumber || '-'}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-500 uppercase font-semibold tracking-wide mb-1">DPJP</div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-xs truncate" title={selectedQueue.doctor.name}>
                      {selectedQueue.doctor.name || '-'}
                    </div>
                    <Button size="small" type="text" className="!text-[10px] !px-2 !h-6 !text-blue-600">
                      Ganti
                    </Button>
                  </div>
                </div>
              </div>

              {selectedQueueLosDays >= 7 && (
                <div
                  className="text-xs px-3 py-2 rounded"
                  style={{
                    background: token.colorWarningBg,
                    border: `1px solid ${token.colorWarningBorder}`,
                    color: token.colorWarningText
                  }}
                >
                  {selectedQueueLosDays >= 14
                    ? 'LOS sangat panjang - perlu evaluasi.'
                    : 'LOS panjang - monitor DPJP.'}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-1">
                <Button
                  type="primary"
                  onClick={() => handleExaminePatient(selectedQueue)}
                  disabled={!selectedQueue.encounterId}
                >
                  Pemeriksaan Lengkap
                </Button>
                <Button onClick={handleFeatureNotReady}>Buka CPPT</Button>
                <Button onClick={handleFeatureNotReady}>Vital Signs</Button>
                <Button onClick={handleFeatureNotReady}>Resep / MAR</Button>
                <Button>Tetapkan / Ganti DPJP</Button>
                <Button disabled>Transfer Kamar</Button>
                <Button
                  onClick={() => handleExaminePatient(selectedQueue)}
                  disabled={!selectedQueue.encounterId}
                >
                  Proses Pulang
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Tidak ada data pasien.</div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default PatientQueueTable
