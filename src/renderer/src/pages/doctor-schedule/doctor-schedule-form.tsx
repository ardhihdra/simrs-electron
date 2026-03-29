import { App, Button, Card, DatePicker, Form, Input, InputNumber, Select, Switch, Tag } from 'antd'
import { useNavigate, useParams } from 'react-router'
import { useEffect, useMemo } from 'react'
import { queryClient } from '@renderer/query-client'
import { useModuleScopeStore } from '@renderer/services/ModuleScope/store'
import { client, rpc } from '@renderer/utils/client'
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  SaveOutlined
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'

type DoctorScheduleStatus = 'active' | 'inactive'
type DoctorScheduleExceptionType = 'libur' | 'sakit' | 'izin' | 'cuti' | 'ubah_jam'
type DoctorScheduleExceptionMode = 'full_day' | 'partial_session'
type RegistrationQuotaSource = 'online' | 'offline'
type RegistrationQuotaPaymentMethod = 'cash' | 'asuransi' | 'company' | 'bpjs'

interface DoctorContract {
  idKontrakPegawai?: number
  nomorKontrak?: string
  kodeJabatan?: string | null
  statusKontrak?: string | null
  tanggalMulaiKontrak?: string | Date | null
  tanggalBerakhirKontrak?: string | Date | null
}

interface DoctorOption {
  id: number
  namaLengkap: string
  email?: string | null
  nik?: string | null
  hakAkses?: string | null
  hakAksesId?: string | null
  kontrakPegawai?: DoctorContract[]
}

interface PoliOption {
  id: number
  name: string
}

interface DoctorScheduleSessionDetail {
  id: number
  hari: number
  sesiKe: number
  jamMulai: string
  jamSelesai: string
  kuota?: number | null
  isActive: boolean
}

interface DoctorScheduleExceptionSessionDetail {
  id: number
  sesiKe: number
  jamMulai: string
  jamSelesai: string
  kuota?: number | null
  isActive: boolean
}

interface DoctorScheduleExceptionDetail {
  id: number
  tanggal: string
  jenis: DoctorScheduleExceptionType
  mode: DoctorScheduleExceptionMode
  keterangan?: string | null
  isActive: boolean
  sesiOverride?: DoctorScheduleExceptionSessionDetail[]
}

interface DoctorScheduleDetail {
  id: number
  idPegawai: number
  idPoli: number
  idLokasiKerja: number
  idKontrakKerja: number
  kategori: string
  namaJadwal?: string | null
  berlakuDari: string
  berlakuSampai?: string | null
  status: DoctorScheduleStatus
  keterangan?: string | null
  sesi?: DoctorScheduleSessionDetail[]
  exceptions?: DoctorScheduleExceptionDetail[]
  pegawai?: {
    id: number
    namaLengkap: string
    email?: string | null
    nik?: string | null
  } | null
  poli?: {
    id: number
    name: string
  } | null
}

interface RegistrationQuotaValueDetail {
  id: string
  quotaId: string
  source: RegistrationQuotaSource
  paymentMethod: RegistrationQuotaPaymentMethod
  quotaValue: number
  mitraId?: number | null
}

interface RegistrationQuotaDetail {
  id: string
  pegawaiId: number
  scheduleId: number
  status: 'active' | 'inactive'
  values?: RegistrationQuotaValueDetail[]
}

interface DoctorScheduleSessionFormValue {
  id?: number
  dayOfWeek: number
  sessionNumber: number
  startTime: string
  endTime: string
  quota?: number | null
  isActive: boolean
}

interface DoctorScheduleExceptionSessionFormValue {
  id?: number
  sessionNumber: number
  startTime: string
  endTime: string
  quota?: number | null
  isActive: boolean
}

interface DoctorScheduleExceptionFormValue {
  id?: number
  date: Dayjs
  type: DoctorScheduleExceptionType
  mode: DoctorScheduleExceptionMode
  description?: string
  isActive: boolean
  sessions?: DoctorScheduleExceptionSessionFormValue[]
}

interface DoctorScheduleFormValues {
  idPegawai: number
  idPoli: number
  idLokasiKerja: number
  idKontrakKerja: number
  kategori: string
  namaJadwal?: string
  berlakuDari: Dayjs
  berlakuSampai?: Dayjs | null
  status: DoctorScheduleStatus
  keterangan?: string
  registrationQuota: Record<string, number | null | undefined>
  sessions: DoctorScheduleSessionFormValue[]
  exceptions?: DoctorScheduleExceptionFormValue[]
}

type DoctorScheduleDetailResponse = {
  success: boolean
  result?: DoctorScheduleDetail
  message?: string
  error?: string
}

type GenericListResponse<T> = {
  success: boolean
  result?: T[]
  message?: string
  error?: string
}

type RegistrationQuotaListResponse = {
  success: boolean
  result?: RegistrationQuotaDetail[]
  message?: string
  error?: string
}

const DAY_OPTIONS = [
  { value: 0, label: 'Minggu' },
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: 'Jumat' },
  { value: 6, label: 'Sabtu' }
]

const EXCEPTION_TYPE_OPTIONS: Array<{ value: DoctorScheduleExceptionType; label: string }> = [
  { value: 'libur', label: 'Libur' },
  { value: 'sakit', label: 'Sakit' },
  { value: 'izin', label: 'Izin' },
  { value: 'cuti', label: 'Cuti' },
  { value: 'ubah_jam', label: 'Ubah Jam' }
]

const EXCEPTION_MODE_OPTIONS: Array<{ value: DoctorScheduleExceptionMode; label: string }> = [
  { value: 'full_day', label: 'Full Day' },
  { value: 'partial_session', label: 'Partial Session' }
]

const REGISTRATION_QUOTA_FIELDS: Array<{
  key: string
  source: RegistrationQuotaSource
  paymentMethod: RegistrationQuotaPaymentMethod
  label: string
}> = [
  { key: 'online_cash', source: 'online', paymentMethod: 'cash', label: 'Online - Cash' },
  {
    key: 'online_asuransi',
    source: 'online',
    paymentMethod: 'asuransi',
    label: 'Online - Asuransi'
  },
  { key: 'online_company', source: 'online', paymentMethod: 'company', label: 'Online - Company' },
  { key: 'online_bpjs', source: 'online', paymentMethod: 'bpjs', label: 'Online - BPJS' },
  { key: 'offline_cash', source: 'offline', paymentMethod: 'cash', label: 'Offline - Cash' },
  {
    key: 'offline_asuransi',
    source: 'offline',
    paymentMethod: 'asuransi',
    label: 'Offline - Asuransi'
  },
  {
    key: 'offline_company',
    source: 'offline',
    paymentMethod: 'company',
    label: 'Offline - Company'
  },
  { key: 'offline_bpjs', source: 'offline', paymentMethod: 'bpjs', label: 'Offline - BPJS' }
]

const EMPTY_REGISTRATION_QUOTA = Object.fromEntries(
  REGISTRATION_QUOTA_FIELDS.map((field) => [field.key, undefined])
) as Record<string, undefined>

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

const normalizeTime = (value?: string | null) => {
  if (!value) return ''
  return value.length >= 5 ? value.slice(0, 5) : value
}

const defaultRegularSession = (): DoctorScheduleSessionFormValue => ({
  dayOfWeek: 1,
  sessionNumber: 1,
  startTime: '08:00',
  endTime: '12:00',
  quota: 30,
  isActive: true
})

const defaultException = (): DoctorScheduleExceptionFormValue => ({
  date: dayjs(),
  type: 'libur',
  mode: 'full_day',
  isActive: true,
  sessions: []
})

const defaultExceptionSession = (): DoctorScheduleExceptionSessionFormValue => ({
  sessionNumber: 1,
  startTime: '08:00',
  endTime: '12:00',
  quota: 30,
  isActive: true
})

const extractErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

const ensureTimeRange = (startTime: string, endTime: string, context: string) => {
  if (!TIME_PATTERN.test(startTime)) {
    throw new Error(`Format jam mulai ${context} harus HH:mm`)
  }
  if (!TIME_PATTERN.test(endTime)) {
    throw new Error(`Format jam selesai ${context} harus HH:mm`)
  }
  if (endTime <= startTime) {
    throw new Error(`Jam selesai ${context} harus lebih besar dari jam mulai`)
  }
}

const ensureSuccess = (response: any, fallbackMessage: string) => {
  if (!response || response.success === false) {
    throw new Error(response?.message || response?.error || fallbackMessage)
  }
  return response
}

export function DoctorScheduleForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm<DoctorScheduleFormValues>()
  const { message } = App.useApp()
  const isEdit = Boolean(id)
  const session = useModuleScopeStore((state) => state.session)

  const { data: detailData } = client.query.entity.useQuery(
    {
      model: 'jadwalDokter',
      method: 'get',
      path: isEdit ? `read/${id}` : undefined
    },
    {
      enabled: isEdit,
      queryKey: ['doctorSchedule', 'detail', id]
    } as any
  )

  const { data: pegawaiData } = client.query.entity.useQuery(
    {
      model: 'kepegawaian',
      method: 'get',
      params: {
        items: '100',
        depth: '1'
      }
    },
    {
      queryKey: ['kepegawaian', 'list', 'doctor-schedule', 'depth-1']
    } as any
  )

  const { data: poliData } = client.query.entity.useQuery(
    {
      model: 'poli',
      method: 'get',
      params: {
        items: '100'
      }
    },
    {
      queryKey: ['poli', 'list', 'doctor-schedule']
    } as any
  )

  const { data: registrationQuotaData } = client.query.entity.useQuery(
    {
      model: 'registrationquota',
      method: 'get',
      params: {
        items: '10',
        depth: '2',
        scheduleId: id ? String(id) : ''
      }
    },
    {
      enabled: isEdit,
      queryKey: ['registrationQuota', 'doctor-schedule', id]
    } as any
  )

  const createScheduleMutation = client.registration.createSchedule.useMutation()
  const updateScheduleMutation = client.registration.updateSchedule.useMutation()
  const createExceptionMutation = client.registration.createScheduleException.useMutation()
  const updateExceptionMutation = client.registration.updateScheduleException.useMutation()

  const detailResult = detailData as DoctorScheduleDetailResponse | undefined
  const pegawaiResult = pegawaiData as GenericListResponse<DoctorOption> | undefined
  const poliResult = poliData as GenericListResponse<PoliOption> | undefined
  const registrationQuotaResult = registrationQuotaData as RegistrationQuotaListResponse | undefined

  const selectedDoctorId = Form.useWatch('idPegawai', form)

  const selectedDoctor = useMemo(
    () => pegawaiResult?.result?.find((pegawai) => pegawai.id === selectedDoctorId),
    [pegawaiResult?.result, selectedDoctorId]
  )

  const existingRegistrationQuota = useMemo(
    () => registrationQuotaResult?.result?.[0],
    [registrationQuotaResult?.result]
  )

  const contractOptions = useMemo(() => {
    const contracts = selectedDoctor?.kontrakPegawai ?? []
    const activeContracts = contracts.filter((contract) => {
      const status = String(contract.statusKontrak ?? '').trim().toLowerCase()
      return status === 'aktif' || status === 'active'
    })

    return (activeContracts.length > 0 ? activeContracts : contracts)
      .filter((contract): contract is DoctorContract & { idKontrakPegawai: number } =>
        typeof contract.idKontrakPegawai === 'number'
      )
      .map((contract) => {
        const dateRange = [
          contract.tanggalMulaiKontrak
            ? dayjs(contract.tanggalMulaiKontrak).format('DD MMM YYYY')
            : null,
          contract.tanggalBerakhirKontrak
            ? dayjs(contract.tanggalBerakhirKontrak).format('DD MMM YYYY')
            : 'sekarang'
        ]
          .filter(Boolean)
          .join(' - ')

        return {
          value: contract.idKontrakPegawai,
          label: [contract.nomorKontrak, contract.kodeJabatan, dateRange].filter(Boolean).join(' | ')
        }
      })
  }, [selectedDoctor?.kontrakPegawai])

  useEffect(() => {
    if (!isEdit || !detailResult?.success || !detailResult.result) return

    const data = detailResult.result
    const scheduleSessions = data.sesi ?? []
    const exceptionItems = data.exceptions ?? []
    const quotaEntries = Object.fromEntries(
      REGISTRATION_QUOTA_FIELDS.map((field) => {
        const matchedValue = existingRegistrationQuota?.values?.find(
          (value) => value.source === field.source && value.paymentMethod === field.paymentMethod
        )
        return [field.key, matchedValue?.quotaValue]
      })
    ) as Record<string, number | undefined>

    form.setFieldsValue({
      idPegawai: data.idPegawai,
      idPoli: data.idPoli,
      idLokasiKerja: data.idLokasiKerja,
      idKontrakKerja: data.idKontrakKerja,
      kategori: data.kategori,
      namaJadwal: data.namaJadwal ?? undefined,
      berlakuDari: dayjs(data.berlakuDari),
      berlakuSampai: data.berlakuSampai ? dayjs(data.berlakuSampai) : undefined,
      status: data.status,
      keterangan: data.keterangan ?? undefined,
      registrationQuota: quotaEntries,
      sessions:
        scheduleSessions.length > 0
          ? [...scheduleSessions]
              .sort((a, b) => a.hari - b.hari || a.sesiKe - b.sesiKe)
              .map((item) => ({
                id: Number(item.id),
                dayOfWeek: Number(item.hari),
                sessionNumber: Number(item.sesiKe),
                startTime: normalizeTime(item.jamMulai),
                endTime: normalizeTime(item.jamSelesai),
                quota: item.kuota ?? undefined,
                isActive: item.isActive
              }))
          : [defaultRegularSession()],
      exceptions:
        exceptionItems.length > 0
          ? [...exceptionItems]
              .sort((a, b) => dayjs(a.tanggal).valueOf() - dayjs(b.tanggal).valueOf())
              .map((item) => {
                const overrideSessions = item.sesiOverride ?? []
                return {
                  id: Number(item.id),
                  date: dayjs(item.tanggal),
                  type: item.jenis,
                  mode: item.mode,
                  description: item.keterangan ?? undefined,
                  isActive: item.isActive,
                  sessions:
                    overrideSessions.length > 0
                      ? [...overrideSessions]
                          .sort((a, b) => a.sesiKe - b.sesiKe)
                          .map((sessionItem) => ({
                            id: Number(sessionItem.id),
                            sessionNumber: Number(sessionItem.sesiKe),
                            startTime: normalizeTime(sessionItem.jamMulai),
                            endTime: normalizeTime(sessionItem.jamSelesai),
                            quota: sessionItem.kuota ?? undefined,
                            isActive: sessionItem.isActive
                          }))
                      : []
                }
              })
          : []
    })
  }, [detailResult, existingRegistrationQuota, form, isEdit])

  useEffect(() => {
    if (!isEdit && session?.lokasiKerjaId) {
      form.setFieldValue('idLokasiKerja', session.lokasiKerjaId)
    }
  }, [form, isEdit, session?.lokasiKerjaId])

  useEffect(() => {
    const currentContractId = form.getFieldValue('idKontrakKerja')
    if (contractOptions.length === 0) {
      form.setFieldValue('idKontrakKerja', undefined)
      return
    }

    const contractStillValid = contractOptions.some((contract) => contract.value === currentContractId)
    if (!contractStillValid) {
      form.setFieldValue('idKontrakKerja', contractOptions[0]?.value)
    }
  }, [contractOptions, form, selectedDoctorId])

  const onFinish = async (values: DoctorScheduleFormValues) => {
    try {
      const regularSessions = values.sessions?.map((item, index) => {
        ensureTimeRange(item.startTime, item.endTime, `pada sesi reguler #${index + 1}`)
        return {
          dayOfWeek: Number(item.dayOfWeek),
          sessionNumber: Number(item.sessionNumber),
          startTime: item.startTime,
          endTime: item.endTime,
          quota: typeof item.quota === 'number' ? Number(item.quota) : undefined,
          isActive: item.isActive !== false
        }
      })

      if (!regularSessions || regularSessions.length === 0) {
        throw new Error('Minimal harus ada satu sesi praktik reguler')
      }

      const exceptions = (values.exceptions ?? []).map((item, index) => {
        const exceptionSessions =
          item.mode === 'partial_session'
            ? (item.sessions ?? []).map((sessionItem, sessionIndex) => {
                ensureTimeRange(
                  sessionItem.startTime,
                  sessionItem.endTime,
                  `pada sesi exception #${index + 1}.${sessionIndex + 1}`
                )
                return {
                  sessionNumber: Number(sessionItem.sessionNumber),
                  startTime: sessionItem.startTime,
                  endTime: sessionItem.endTime,
                  quota: typeof sessionItem.quota === 'number' ? Number(sessionItem.quota) : undefined,
                  isActive: sessionItem.isActive !== false
                }
              })
            : []

        if (item.mode === 'partial_session' && exceptionSessions.length === 0) {
          throw new Error(`Exception #${index + 1} dengan mode partial session harus punya sesi override`)
        }

        return {
          id: item.id ? Number(item.id) : undefined,
          date: item.date.format('YYYY-MM-DD'),
          type: item.type,
          mode: item.mode,
          description: item.description?.trim() || undefined,
          isActive: item.isActive !== false,
          sessions: exceptionSessions
        }
      })

      const basePayload = {
        doctorId: Number(values.idPegawai),
        poliId: Number(values.idPoli),
        lokasiKerjaId: Number(values.idLokasiKerja),
        kontrakKerjaId: Number(values.idKontrakKerja),
        category: values.kategori.trim(),
        name: values.namaJadwal?.trim() || undefined,
        validFrom: values.berlakuDari.format('YYYY-MM-DD'),
        validTo: values.berlakuSampai ? values.berlakuSampai.format('YYYY-MM-DD') : undefined,
        status: values.status,
        remark: values.keterangan?.trim() || undefined,
        sessions: regularSessions
      }

      const registrationQuotaEntries = REGISTRATION_QUOTA_FIELDS.map((field) => {
        const rawValue = values.registrationQuota?.[field.key]
        const normalizedValue =
          typeof rawValue === 'number' && Number.isFinite(rawValue) ? Number(rawValue) : null

        return {
          ...field,
          quotaValue: normalizedValue,
          existingValueId: existingRegistrationQuota?.values?.find(
            (value) => value.source === field.source && value.paymentMethod === field.paymentMethod
          )?.id
        }
      })

      let scheduleId = Number(id)

      if (isEdit) {
        await ensureSuccess(
          await updateScheduleMutation.mutateAsync({
            id: Number(id),
            ...basePayload
          }),
          'Gagal mengupdate jadwal dokter'
        )
      } else {
        const createResponse = ensureSuccess(
          await createScheduleMutation.mutateAsync(basePayload),
          'Gagal membuat jadwal dokter'
        )
        const createdId = Number(createResponse?.result?.id)
        if (!Number.isFinite(createdId) || createdId <= 0) {
          throw new Error('ID jadwal dokter baru tidak ditemukan dari response')
        }
        scheduleId = createdId
      }

      for (const exception of exceptions) {
        if (exception.id && isEdit) {
          await ensureSuccess(
            await updateExceptionMutation.mutateAsync({
              doctorScheduleId: scheduleId,
              exceptionId: exception.id,
              date: exception.date,
              type: exception.type,
              mode: exception.mode,
              description: exception.description,
              isActive: exception.isActive,
              sessions: exception.sessions
            }),
            `Gagal mengupdate exception jadwal ${exception.date}`
          )
          continue
        }

        await ensureSuccess(
          await createExceptionMutation.mutateAsync({
            doctorScheduleId: scheduleId,
            date: exception.date,
            type: exception.type,
            mode: exception.mode,
            description: exception.description,
            isActive: exception.isActive,
            sessions: exception.sessions
          }),
          `Gagal menambahkan exception jadwal ${exception.date}`
        )
      }

      const hasConfiguredRegistrationQuota = registrationQuotaEntries.some(
        (entry) => typeof entry.quotaValue === 'number'
      )

      let registrationQuotaId = existingRegistrationQuota?.id

      if (hasConfiguredRegistrationQuota || existingRegistrationQuota) {
        if (registrationQuotaId) {
          await ensureSuccess(
            await rpc.query.entity({
              model: 'registrationquota',
              path: registrationQuotaId,
              method: 'put',
              body: {
                pegawaiId: Number(values.idPegawai),
                scheduleId,
                status: 'active'
              }
            } as any),
            'Gagal mengupdate header quota registrasi'
          )
        } else if (hasConfiguredRegistrationQuota) {
          const quotaHeaderResponse = ensureSuccess(
            await rpc.query.entity({
              model: 'registrationquota',
              method: 'post',
              body: {
                pegawaiId: Number(values.idPegawai),
                scheduleId,
                status: 'active'
              }
            } as any),
            'Gagal membuat header quota registrasi'
          )

          registrationQuotaId = String(quotaHeaderResponse?.result?.id || '')
          if (!registrationQuotaId) {
            throw new Error('ID header quota registrasi tidak ditemukan')
          }
        }

        if (registrationQuotaId) {
          for (const quotaEntry of registrationQuotaEntries) {
            if (typeof quotaEntry.quotaValue === 'number') {
              if (quotaEntry.existingValueId) {
                await ensureSuccess(
                  await rpc.query.entity({
                    model: 'registrationquotavalue',
                    path: quotaEntry.existingValueId,
                    method: 'put',
                    body: {
                      quotaId: registrationQuotaId,
                      source: quotaEntry.source,
                      paymentMethod: quotaEntry.paymentMethod,
                      quotaValue: quotaEntry.quotaValue
                    }
                  } as any),
                  `Gagal mengupdate quota ${quotaEntry.label}`
                )
              } else {
                await ensureSuccess(
                  await rpc.query.entity({
                    model: 'registrationquotavalue',
                    method: 'post',
                    body: {
                      quotaId: registrationQuotaId,
                      source: quotaEntry.source,
                      paymentMethod: quotaEntry.paymentMethod,
                      quotaValue: quotaEntry.quotaValue
                    }
                  } as any),
                  `Gagal menambahkan quota ${quotaEntry.label}`
                )
              }
              continue
            }

            if (quotaEntry.existingValueId) {
              await ensureSuccess(
                await rpc.query.entity({
                  model: 'registrationquotavalue',
                  path: quotaEntry.existingValueId,
                  method: 'delete'
                } as any),
                `Gagal menghapus quota ${quotaEntry.label}`
              )
            }
          }
        }
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['doctorSchedule', 'list'] }),
        queryClient.invalidateQueries({ queryKey: ['doctorSchedule', 'detail', String(scheduleId)] }),
        queryClient.invalidateQueries({ queryKey: ['doctorSchedule', 'detail', scheduleId] }),
        queryClient.invalidateQueries({ queryKey: ['registrationQuota', 'doctor-schedule', String(scheduleId)] })
      ])

      message.success(isEdit ? 'Jadwal dokter berhasil diperbarui' : 'Jadwal dokter berhasil ditambahkan')
      navigate('/dashboard/registration/doctor-schedule')
    } catch (error) {
      message.error(extractErrorMessage(error, 'Terjadi kesalahan saat menyimpan jadwal dokter'))
    }
  }

  const isLoading =
    createScheduleMutation.isPending ||
    updateScheduleMutation.isPending ||
    createExceptionMutation.isPending ||
    updateExceptionMutation.isPending

  return (
    <div className="flex flex-col gap-4 h-full">
      <Card bodyStyle={{ padding: '20px 24px' }} className="border-none">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => navigate('/dashboard/registration/doctor-schedule')}
                className="text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 text-sm"
              >
                <ArrowLeftOutlined />
                <span>Jadwal Praktek Dokter</span>
              </button>
            </div>
            <h1 className="text-2xl font-bold mb-0">
              {isEdit ? 'Edit Jadwal Dokter' : 'Tambah Jadwal Dokter'}
            </h1>
            <p className="text-sm text-gray-400 m-0">
              {isEdit
                ? 'Perbarui data master, sesi praktik, dan exception jadwal dokter'
                : 'Isi formulir berikut untuk mendaftarkan jadwal dokter beserta sesi praktiknya'}
            </p>
          </div>
          <Tag
            color={isEdit ? 'blue' : 'green'}
            icon={isEdit ? <CalendarOutlined /> : <CheckCircleOutlined />}
            className="px-3 py-1 text-sm m-0"
          >
            {isEdit ? 'Mode Edit' : 'Jadwal Baru'}
          </Tag>
        </div>
      </Card>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          berlakuDari: dayjs(),
          idLokasiKerja: session?.lokasiKerjaId,
          status: 'active',
          registrationQuota: EMPTY_REGISTRATION_QUOTA,
          sessions: [defaultRegularSession()],
          exceptions: []
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card bodyStyle={{ padding: '20px 24px' }} className="border-none" title="Informasi Dasar">
            <Form.Item
              label={<span className="font-medium">Nama Dokter</span>}
              name="idPegawai"
              rules={[{ required: true, message: 'Nama dokter harus diisi' }]}
            >
              <Select
                placeholder="Pilih nama dokter"
                showSearch
                optionFilterProp="children"
                loading={!pegawaiResult}
                size="large"
              >
                {pegawaiResult?.success &&
                  pegawaiResult.result?.map((pegawai) => (
                    <Select.Option key={pegawai.id} value={pegawai.id}>
                      {pegawai.namaLengkap}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={<span className="font-medium">Kategori</span>}
              name="kategori"
              rules={[{ required: true, message: 'Kategori harus diisi' }]}
            >
              <Input placeholder="Contoh: Dokter Umum, Dokter Spesialis Anak" size="large" />
            </Form.Item>

            <Form.Item
              label={<span className="font-medium">Poli</span>}
              name="idPoli"
              rules={[{ required: true, message: 'Poli harus diisi' }]}
            >
              <Select
                placeholder="Pilih poli"
                showSearch
                optionFilterProp="children"
                loading={!poliResult}
                size="large"
              >
                {poliResult?.success &&
                  poliResult.result?.map((poli) => (
                    <Select.Option key={poli.id} value={poli.id}>
                      {poli.name}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={<span className="font-medium">Kontrak Kerja</span>}
              name="idKontrakKerja"
              rules={[{ required: true, message: 'Kontrak kerja harus dipilih' }]}
              extra={
                selectedDoctorId && contractOptions.length === 0
                  ? 'Pegawai ini belum memiliki kontrak aktif yang bisa dipakai untuk jadwal.'
                  : undefined
              }
            >
              <Select
                placeholder={selectedDoctorId ? 'Pilih kontrak kerja' : 'Pilih dokter terlebih dahulu'}
                size="large"
                disabled={!selectedDoctorId || contractOptions.length === 0}
                options={contractOptions}
              />
            </Form.Item>

            {session?.lokasiKerjaId ? (
              <>
                <Form.Item hidden name="idLokasiKerja" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item label={<span className="font-medium">Lokasi Kerja Aktif</span>}>
                  <Input
                    value={`ID Lokasi #${form.getFieldValue('idLokasiKerja') ?? session.lokasiKerjaId}`}
                    disabled
                    size="large"
                  />
                </Form.Item>
              </>
            ) : (
              <Form.Item
                label={<span className="font-medium">ID Lokasi Kerja</span>}
                name="idLokasiKerja"
                rules={[{ required: true, message: 'Lokasi kerja harus diisi' }]}
              >
                <InputNumber
                  className="w-full"
                  size="large"
                  placeholder="Masukkan ID lokasi kerja"
                  min={1}
                />
              </Form.Item>
            )}
          </Card>

          <Card bodyStyle={{ padding: '20px 24px' }} className="border-none" title="Periode Jadwal">
            <Form.Item label={<span className="font-medium">Nama Jadwal</span>} name="namaJadwal">
              <Input placeholder="Contoh: Praktik Pagi Poli Anak" size="large" />
            </Form.Item>

            <Form.Item
              label={<span className="font-medium">Berlaku Dari</span>}
              name="berlakuDari"
              rules={[{ required: true, message: 'Tanggal mulai berlaku harus diisi' }]}
            >
              <DatePicker className="w-full" format="DD MMM YYYY" size="large" />
            </Form.Item>

            <Form.Item
              label={<span className="font-medium">Berlaku Sampai</span>}
              name="berlakuSampai"
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value: Dayjs | null | undefined) {
                    const berlakuDari = getFieldValue('berlakuDari') as Dayjs | undefined
                    if (!value || !berlakuDari || !value.isBefore(berlakuDari, 'day')) {
                      return Promise.resolve()
                    }
                    return Promise.reject(
                      new Error('Tanggal selesai harus sama dengan atau setelah tanggal mulai')
                    )
                  }
                })
              ]}
            >
              <DatePicker className="w-full" format="DD MMM YYYY" size="large" />
            </Form.Item>

            <Form.Item
              label={<span className="font-medium">Status</span>}
              name="status"
              rules={[{ required: true, message: 'Status harus dipilih' }]}
            >
              <Select placeholder="Pilih status" size="large">
                <Select.Option value="active">Aktif</Select.Option>
                <Select.Option value="inactive">Tidak Aktif</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item label={<span className="font-medium">Keterangan</span>} name="keterangan">
              <Input.TextArea
                rows={5}
                placeholder="Catatan tambahan untuk jadwal dokter ini"
                showCount
                maxLength={1000}
              />
            </Form.Item>

            <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
              Data master `JadwalDokter`, `JadwalDokterSesi`, `JadwalDokterException`, dan
              `JadwalDokterExceptionSesi` sekarang dikelola dari satu form ini.
            </div>
          </Card>
        </div>

        <Card
          bodyStyle={{ padding: '20px 24px' }}
          className="border-none mt-4"
          title="Quota Registrasi"
        >
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
              Quota ini dipakai untuk membatasi registrasi per bucket `online/offline` dan metode
              pembayaran. Jika dikosongkan, sistem akan fallback ke `JadwalDokterSesi.kuota`.
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="font-medium mb-3">Online</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {REGISTRATION_QUOTA_FIELDS.filter((field) => field.source === 'online').map((field) => (
                    <Form.Item
                      key={field.key}
                      label={field.label.replace('Online - ', '')}
                      name={['registrationQuota', field.key]}
                    >
                      <InputNumber
                        className="w-full"
                        min={0}
                        placeholder="Kosongkan untuk fallback kuota sesi"
                      />
                    </Form.Item>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <div className="font-medium mb-3">Offline</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {REGISTRATION_QUOTA_FIELDS.filter((field) => field.source === 'offline').map((field) => (
                    <Form.Item
                      key={field.key}
                      label={field.label.replace('Offline - ', '')}
                      name={['registrationQuota', field.key]}
                    >
                      <InputNumber
                        className="w-full"
                        min={0}
                        placeholder="Kosongkan untuk fallback kuota sesi"
                      />
                    </Form.Item>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card bodyStyle={{ padding: '20px 24px' }} className="border-none mt-4" title="Sesi Praktik Reguler">
          <Form.List name="sessions">
            {(fields, { add, remove }, { errors }) => (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-gray-500 m-0">
                    Hari mengikuti `Date.getDay()`: Minggu = 0, Senin = 1, sampai Sabtu = 6.
                  </p>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add(defaultRegularSession())}
                  >
                    Tambah Sesi
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.key} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div>
                        <div className="font-medium">Sesi Reguler #{index + 1}</div>
                        <div className="text-xs text-gray-500">
                          Gunakan sesi ini untuk pola jadwal mingguan normal.
                        </div>
                      </div>
                      <Button
                        danger
                        type="text"
                        onClick={() => remove(field.name)}
                        disabled={fields.length === 1}
                      >
                        Hapus
                      </Button>
                    </div>

                    <Form.Item hidden name={[field.name, 'id']}>
                      <Input />
                    </Form.Item>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
                      <Form.Item
                        label="Hari"
                        name={[field.name, 'dayOfWeek']}
                        rules={[{ required: true, message: 'Hari wajib diisi' }]}
                      >
                        <Select options={DAY_OPTIONS} placeholder="Pilih hari" />
                      </Form.Item>

                      <Form.Item
                        label="Sesi Ke"
                        name={[field.name, 'sessionNumber']}
                        rules={[{ required: true, message: 'Sesi ke wajib diisi' }]}
                      >
                        <InputNumber className="w-full" min={1} placeholder="1" />
                      </Form.Item>

                      <Form.Item
                        label="Jam Mulai"
                        name={[field.name, 'startTime']}
                        rules={[
                          { required: true, message: 'Jam mulai wajib diisi' },
                          { pattern: TIME_PATTERN, message: 'Format jam HH:mm' }
                        ]}
                      >
                        <Input placeholder="08:00" />
                      </Form.Item>

                      <Form.Item
                        label="Jam Selesai"
                        name={[field.name, 'endTime']}
                        dependencies={[['sessions', field.name, 'startTime']]}
                        rules={[
                          { required: true, message: 'Jam selesai wajib diisi' },
                          { pattern: TIME_PATTERN, message: 'Format jam HH:mm' },
                          ({ getFieldValue }) => ({
                            validator(_, value: string | undefined) {
                              const startTime = getFieldValue(['sessions', field.name, 'startTime'])
                              if (!startTime || !value || value > startTime) {
                                return Promise.resolve()
                              }
                              return Promise.reject(
                                new Error('Jam selesai harus lebih besar dari jam mulai')
                              )
                            }
                          })
                        ]}
                      >
                        <Input placeholder="12:00" />
                      </Form.Item>

                      <Form.Item label="Kuota" name={[field.name, 'quota']}>
                        <InputNumber className="w-full" min={0} placeholder="30" />
                      </Form.Item>

                      <Form.Item
                        label="Aktif"
                        name={[field.name, 'isActive']}
                        valuePropName="checked"
                      >
                        <Switch checkedChildren="Aktif" unCheckedChildren="Nonaktif" />
                      </Form.Item>
                    </div>
                  </div>
                ))}

                <Form.ErrorList errors={errors} />
              </div>
            )}
          </Form.List>
        </Card>

        <Card bodyStyle={{ padding: '20px 24px' }} className="border-none mt-4" title="Exception Jadwal">
          <Form.List name="exceptions">
            {(fields, { add, remove }, { errors }) => (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-gray-500 m-0">
                    Gunakan exception untuk libur, izin, cuti, sakit, atau override jam pada tanggal
                    tertentu.
                  </p>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add(defaultException())}
                  >
                    Tambah Exception
                  </Button>
                </div>

                {fields.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-300 px-5 py-8 text-center text-sm text-gray-500">
                    Belum ada exception jadwal. Anda bisa tetap menyimpan jadwal tanpa exception.
                  </div>
                ) : null}

                {fields.map((field, index) => {
                  const exceptionId = form.getFieldValue(['exceptions', field.name, 'id'])
                  const isPersistedException = isEdit && Number.isFinite(Number(exceptionId))

                  return (
                    <div key={field.key} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div>
                          <div className="font-medium">Exception #{index + 1}</div>
                          <div className="text-xs text-gray-500">
                            {isPersistedException
                              ? 'Exception ini sudah tersimpan. Untuk menonaktifkan, ubah status aktifnya.'
                              : 'Exception baru akan disimpan setelah jadwal utama berhasil tersimpan.'}
                          </div>
                        </div>
                        {!isPersistedException ? (
                          <Button danger type="text" onClick={() => remove(field.name)}>
                            Hapus
                          </Button>
                        ) : (
                          <Tag color="blue" className="m-0">
                            Tersimpan
                          </Tag>
                        )}
                      </div>

                      <Form.Item hidden name={[field.name, 'id']}>
                        <Input />
                      </Form.Item>

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                        <Form.Item
                          label="Tanggal"
                          name={[field.name, 'date']}
                          rules={[{ required: true, message: 'Tanggal exception wajib diisi' }]}
                        >
                          <DatePicker className="w-full" format="DD MMM YYYY" />
                        </Form.Item>

                        <Form.Item
                          label="Jenis"
                          name={[field.name, 'type']}
                          rules={[{ required: true, message: 'Jenis exception wajib diisi' }]}
                        >
                          <Select options={EXCEPTION_TYPE_OPTIONS} placeholder="Pilih jenis" />
                        </Form.Item>

                        <Form.Item
                          label="Mode"
                          name={[field.name, 'mode']}
                          rules={[{ required: true, message: 'Mode exception wajib diisi' }]}
                        >
                          <Select options={EXCEPTION_MODE_OPTIONS} placeholder="Pilih mode" />
                        </Form.Item>

                        <Form.Item
                          label="Aktif"
                          name={[field.name, 'isActive']}
                          valuePropName="checked"
                        >
                          <Switch checkedChildren="Aktif" unCheckedChildren="Nonaktif" />
                        </Form.Item>

                        <Form.Item label="Keterangan" name={[field.name, 'description']}>
                          <Input placeholder="Contoh: Libur nasional atau ubah jam praktik" />
                        </Form.Item>
                      </div>
                      <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) =>
                          prevValues?.exceptions?.[field.name]?.mode !==
                          currentValues?.exceptions?.[field.name]?.mode
                        }
                      >
                        {() => {
                          const currentMode = form.getFieldValue(['exceptions', field.name, 'mode'])

                          if (currentMode !== 'partial_session') {
                            return (
                              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                Mode `full_day` tidak memerlukan `JadwalDokterExceptionSesi`.
                              </div>
                            )
                          }

                          return (
                            <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/60 p-4">
                              <Form.List name={[field.name, 'sessions']}>
                                {(sessionFields, sessionOps, sessionMeta) => (
                                  <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between gap-3">
                                      <div>
                                        <div className="font-medium text-sky-900">Sesi Override</div>
                                        <div className="text-xs text-sky-700">
                                          Digunakan saat exception hanya mengubah sebagian sesi.
                                        </div>
                                      </div>
                                      <Button
                                        type="dashed"
                                        icon={<PlusOutlined />}
                                        onClick={() => sessionOps.add(defaultExceptionSession())}
                                      >
                                        Tambah Sesi Override
                                      </Button>
                                    </div>

                                    {sessionFields.map((sessionField, sessionIndex) => (
                                      <div
                                        key={sessionField.key}
                                        className="rounded-lg border border-sky-200 bg-white p-4"
                                      >
                                        <div className="flex items-center justify-between gap-3 mb-4">
                                          <div className="font-medium">Override #{sessionIndex + 1}</div>
                                          <Button
                                            danger
                                            type="text"
                                            onClick={() => sessionOps.remove(sessionField.name)}
                                          >
                                            Hapus
                                          </Button>
                                        </div>

                                        <Form.Item hidden name={[sessionField.name, 'id']}>
                                          <Input />
                                        </Form.Item>

                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                                          <Form.Item
                                            label="Sesi Ke"
                                            name={[sessionField.name, 'sessionNumber']}
                                            rules={[{ required: true, message: 'Sesi ke wajib diisi' }]}
                                          >
                                            <InputNumber className="w-full" min={1} placeholder="1" />
                                          </Form.Item>

                                          <Form.Item
                                            label="Jam Mulai"
                                            name={[sessionField.name, 'startTime']}
                                            rules={[
                                              { required: true, message: 'Jam mulai wajib diisi' },
                                              { pattern: TIME_PATTERN, message: 'Format jam HH:mm' }
                                            ]}
                                          >
                                            <Input placeholder="08:00" />
                                          </Form.Item>

                                          <Form.Item
                                            label="Jam Selesai"
                                            name={[sessionField.name, 'endTime']}
                                            dependencies={[
                                              ['exceptions', field.name, 'sessions', sessionField.name, 'startTime']
                                            ]}
                                            rules={[
                                              { required: true, message: 'Jam selesai wajib diisi' },
                                              { pattern: TIME_PATTERN, message: 'Format jam HH:mm' },
                                              ({ getFieldValue }) => ({
                                                validator(_, value: string | undefined) {
                                                  const startTime = getFieldValue([
                                                    'exceptions',
                                                    field.name,
                                                    'sessions',
                                                    sessionField.name,
                                                    'startTime'
                                                  ])
                                                  if (!startTime || !value || value > startTime) {
                                                    return Promise.resolve()
                                                  }
                                                  return Promise.reject(
                                                    new Error(
                                                      'Jam selesai override harus lebih besar dari jam mulai'
                                                    )
                                                  )
                                                }
                                              })
                                            ]}
                                          >
                                            <Input placeholder="12:00" />
                                          </Form.Item>

                                          <Form.Item label="Kuota" name={[sessionField.name, 'quota']}>
                                            <InputNumber className="w-full" min={0} placeholder="30" />
                                          </Form.Item>

                                          <Form.Item
                                            label="Aktif"
                                            name={[sessionField.name, 'isActive']}
                                            valuePropName="checked"
                                          >
                                            <Switch checkedChildren="Aktif" unCheckedChildren="Nonaktif" />
                                          </Form.Item>
                                        </div>
                                      </div>
                                    ))}

                                    <Form.ErrorList errors={sessionMeta.errors} />
                                  </div>
                                )}
                              </Form.List>
                            </div>
                          )
                        }}
                      </Form.Item>
                    </div>
                  )
                })}

                <Form.ErrorList errors={errors} />
              </div>
            )}
          </Form.List>
        </Card>

        <Card bodyStyle={{ padding: '16px 24px' }} className="border-none mt-4">
          <div className="flex items-center justify-end gap-3">
            <Button
              size="large"
              onClick={() => navigate('/dashboard/registration/doctor-schedule')}
              icon={<ArrowLeftOutlined />}
            >
              Batal
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={isLoading}
              icon={<SaveOutlined />}
            >
              {isEdit ? 'Update Jadwal' : 'Simpan Jadwal'}
            </Button>
          </div>
        </Card>
      </Form>
    </div>
  )
}

export default DoctorScheduleForm
