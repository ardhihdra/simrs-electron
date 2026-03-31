import {
  BarcodeOutlined,
  ClockCircleOutlined,
  MedicineBoxOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserOutlined
} from '@ant-design/icons'
import { client } from '@renderer/utils/client'
import { hasValidationErrors, notifyFormValidationError } from '@renderer/utils/form-feedback'
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Space,
  Tag,
  Typography,
  theme
} from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'

type QueueResult = {
  formattedQueueNumber?: string
  queueNumber?: number | string
  queueDate?: string
}

const POLI_COLORS: { key?: string; bg: string; icon: string; hover: string }[] = [
  { key: 'umum', bg: 'bg-blue-100', icon: 'text-blue-600', hover: 'group-hover:bg-blue-500' },
  { key: 'anak', bg: 'bg-sky-100', icon: 'text-sky-600', hover: 'group-hover:bg-sky-500' },
  {
    key: 'kandungan',
    bg: 'bg-pink-100',
    icon: 'text-pink-600',
    hover: 'group-hover:bg-pink-500'
  },
  {
    key: 'penyakit dalam',
    bg: 'bg-amber-100',
    icon: 'text-amber-600',
    hover: 'group-hover:bg-amber-500'
  },
  { key: 'bedah', bg: 'bg-red-100', icon: 'text-red-600', hover: 'group-hover:bg-red-500' },
  { key: 'jantung', bg: 'bg-rose-100', icon: 'text-rose-600', hover: 'group-hover:bg-rose-500' },
  {
    key: 'saraf',
    bg: 'bg-violet-100',
    icon: 'text-violet-600',
    hover: 'group-hover:bg-violet-500'
  },
  { key: 'mata', bg: 'bg-cyan-100', icon: 'text-cyan-600', hover: 'group-hover:bg-cyan-500' },
  {
    key: 'tht',
    bg: 'bg-indigo-100',
    icon: 'text-indigo-600',
    hover: 'group-hover:bg-indigo-500'
  },
  {
    key: 'kulit',
    bg: 'bg-orange-100',
    icon: 'text-orange-600',
    hover: 'group-hover:bg-orange-500'
  },
  { key: 'gigi', bg: 'bg-lime-100', icon: 'text-lime-600', hover: 'group-hover:bg-lime-500' },
  {
    key: 'orthopedi',
    bg: 'bg-stone-100',
    icon: 'text-stone-600',
    hover: 'group-hover:bg-stone-500'
  },
  { key: 'paru', bg: 'bg-teal-100', icon: 'text-teal-600', hover: 'group-hover:bg-teal-500' },
  {
    key: 'jiwa',
    bg: 'bg-purple-100',
    icon: 'text-purple-600',
    hover: 'group-hover:bg-purple-500'
  },
  { key: 'gizi', bg: 'bg-green-100', icon: 'text-green-600', hover: 'group-hover:bg-green-500' },
  {
    key: 'urologi',
    bg: 'bg-emerald-100',
    icon: 'text-emerald-600',
    hover: 'group-hover:bg-emerald-500'
  },
  {
    key: 'geriatri',
    bg: 'bg-yellow-100',
    icon: 'text-yellow-600',
    hover: 'group-hover:bg-yellow-500'
  },
  {
    key: 'rehabilitasi',
    bg: 'bg-fuchsia-100',
    icon: 'text-fuchsia-600',
    hover: 'group-hover:bg-fuchsia-500'
  },
  { key: 'kelamin', bg: 'bg-slate-100', icon: 'text-slate-600', hover: 'group-hover:bg-slate-500' },
  { key: 'otak', bg: 'bg-zinc-100', icon: 'text-zinc-600', hover: 'group-hover:bg-zinc-500' }
]

function getPoliColor(poliName: string) {
  const lower = poliName.toLowerCase()
  const matched = POLI_COLORS.find((color) => color.key && lower.includes(color.key))
  if (matched) return matched

  let hash = 0
  for (let index = 0; index < poliName.length; index += 1) {
    hash = poliName.charCodeAt(index) + ((hash << 5) - hash)
  }

  return POLI_COLORS[Math.abs(hash) % POLI_COLORS.length]
}

export default function KioskaPage() {
  const { message } = App.useApp()
  const { token } = theme.useToken()
  const [form] = Form.useForm()
  const [lastQueue, setLastQueue] = useState<QueueResult | null>(null)

  const visitDate = Form.useWatch('visitDate', form)
  const poliId = Form.useWatch('poliId', form)
  const selectedDoctorScheduleId = Form.useWatch('doctorScheduleId', form)

  const kioskGradient = `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`

  const doctorQueryInput = useMemo(
    () => ({
      date: visitDate ? dayjs(visitDate).format('YYYY-MM-DD') : undefined,
      poliId: poliId ? Number(poliId) : undefined
    }),
    [visitDate, poliId]
  )

  const createQueue = client.visitManagement.register.useMutation()
  const poliQuery = client.visitManagement.poli.useQuery({})
  const doctorsQuery = client.registration.getAvailableDoctors.useQuery(doctorQueryInput, {
    enabled: !!doctorQueryInput.date && !!doctorQueryInput.poliId,
    queryKey: ['kioska-availableDoctors', doctorQueryInput]
  })

  const poliOptions = useMemo(
    () =>
      (poliQuery.data?.result || []).map((poli) => ({
        label: poli.name,
        value: String(poli.id)
      })),
    [poliQuery.data]
  )

  const availableDoctors = useMemo(() => {
    const data = doctorsQuery.data as any
    return data?.result?.doctors || data?.data?.doctors || data?.doctors || []
  }, [doctorsQuery.data])

  const selectedPoliLabel = useMemo(
    () => poliOptions.find((item) => item.value === String(poliId || ''))?.label || '-',
    [poliId, poliOptions]
  )

  const currentStep = poliId ? 2 : 1
  const canChooseDoctor = !!doctorQueryInput.date && !!doctorQueryInput.poliId

  useEffect(() => {
    form.setFieldValue('doctorScheduleId', undefined)
  }, [visitDate, poliId, form])

  const handleDummyScanBarcode = () => {
    const dummyCard = `CARD-${dayjs().format('YYYYMMDDHHmmss')}`
    form.setFieldValue('memberCardNumber', dummyCard)
    message.success('Barcode dummy berhasil di-scan')
  }

  const handleRefresh = async () => {
    await Promise.all([poliQuery.refetch(), doctorsQuery.refetch()])
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (!availableDoctors.length) {
        message.error('Dokter belum tersedia untuk tanggal dan poli yang dipilih')
        return
      }

      const selectedDoctor = availableDoctors.find(
        (doctor: any) => String(doctor.doctorScheduleId) === String(values.doctorScheduleId)
      )
      if (!selectedDoctor) {
        message.error('Harap pilih dokter yang tersedia')
        return
      }

      const formattedVisitDate = dayjs(values.visitDate).format('YYYY-MM-DD')
      const cardNote = values.memberCardNumber
        ? `KIOSKA_CARD:${values.memberCardNumber}`
        : undefined

      const response = await createQueue.mutateAsync({
        queueDate: formattedVisitDate,
        visitDate: formattedVisitDate,
        practitionerId: Number(selectedDoctor.doctorId),
        doctorScheduleId: Number(selectedDoctor.doctorScheduleId),
        registrationType: 'OFFLINE',
        paymentMethod: 'CASH',
        reason: 'Registrasi Kioska',
        notes: cardNote
      })

      if ((response as any)?.success === false) {
        throw new Error((response as any)?.message || 'Gagal mengambil antrian')
      }

      const result = ((response as any)?.result || {}) as QueueResult
      setLastQueue(result)
      form.setFieldsValue({
        visitDate: dayjs(),
        poliId: undefined,
        doctorScheduleId: undefined,
        memberCardNumber: undefined
      })
      message.success('Antrian berhasil diambil')
    } catch (error: any) {
      if (hasValidationErrors(error)) {
        notifyFormValidationError(form, message, error, 'Lengkapi data antrian terlebih dahulu.')
        return
      }
      message.error(error?.message || 'Gagal mengambil antrian')
    }
  }

  return (
    <div className="space-y-6">
      <Card
        className="!overflow-hidden !rounded-[36px] !border-0"
        styles={{
          body: {
            minHeight: 'calc(100vh - 11rem)',
            padding: 0,
            background: kioskGradient
          }
        }}
      >
        <div className="flex min-h-[calc(100vh-11rem)] flex-col px-6 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <Tag
                className="mb-4 border-0 px-4 py-1 text-sm font-semibold !text-white"
                style={{ backgroundColor: 'rgba(255,255,255,0.16)' }}
              >
                KIOSK ANTRIAN RAWAT JALAN
              </Tag>
              <Typography.Title
                level={1}
                className="!mb-3 !text-4xl !leading-tight !text-white md:!text-5xl"
              >
                Ambil Nomor Antrian Kunjungan
              </Typography.Title>
              {/* <Typography.Paragraph className="!mb-4 !max-w-2xl !text-base !text-white/85 md:!text-lg">
                Proses dibuat lebih singkat untuk area kioska. Mulai dari pilih poli, lanjut pilih
                dokter, lalu ambil nomor antrean.
              </Typography.Paragraph> */}
              <Space wrap size="middle">
                <div className="rounded-full bg-white/12 px-4 py-2 text-sm text-white/90">
                  Langkah aktif: {currentStep === 1 ? 'Pilih Poli' : 'Pilih Dokter'}
                </div>
                <div className="rounded-full bg-white/12 px-4 py-2 text-sm text-white/90">
                  Poli: {selectedPoliLabel}
                </div>
              </Space>
            </div>

            <Button
              icon={<ReloadOutlined />}
              onClick={() => void handleRefresh()}
              loading={poliQuery.isFetching || doctorsQuery.isFetching}
              className="!h-12 !rounded-2xl !border-0 !px-6 !text-base !font-medium !text-white"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              Refresh Data
            </Button>
          </div>

          {!poliOptions.length && !poliQuery.isLoading ? (
            <Alert
              type="warning"
              showIcon
              message="Daftar poli belum tersedia. Pastikan data referensi poli sudah terisi."
              style={{ marginTop: 24 }}
            />
          ) : null}

          <div className="flex flex-1 items-center justify-center py-8">
            <div className="grid w-full max-w-6xl gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card>
                <div className="mb-8 flex items-center gap-4">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-[24px] text-white"
                    style={{ background: kioskGradient }}
                  >
                    <MedicineBoxOutlined className="text-3xl" />
                  </div>
                  <div>
                    <Typography.Title level={3} className="!mb-1">
                      Form Ambil Antrian
                    </Typography.Title>
                    <Typography.Text type="secondary">
                      Ikuti langkah berurutan agar proses pendaftaran lebih mudah dipakai.
                    </Typography.Text>
                  </div>
                </div>

                <Form
                  form={form}
                  layout="vertical"
                  initialValues={{ visitDate: dayjs() }}
                  onFinish={handleSubmit}
                  onFinishFailed={(errorInfo) =>
                    notifyFormValidationError(
                      form,
                      message,
                      errorInfo,
                      'Lengkapi data antrian terlebih dahulu.'
                    )
                  }
                >
                  <Form.Item
                    name="visitDate"
                    hidden
                    rules={[{ required: true, message: 'Tanggal wajib diisi' }]}
                  >
                    <Input type="hidden" />
                  </Form.Item>

                  <div className="mb-8 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
                    <div
                      className={`rounded-[24px] border px-5 py-4 transition-all ${
                        currentStep === 1
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-emerald-200 bg-emerald-50'
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                            currentStep === 1
                              ? 'bg-blue-500 text-white'
                              : 'bg-emerald-500 text-white'
                          }`}
                        >
                          1
                        </div>
                        <Typography.Text strong>Pilih Poli</Typography.Text>
                      </div>
                      <Typography.Text className="!text-sm text-slate-600">
                        Tentukan poli tujuan kunjungan pasien.
                      </Typography.Text>
                    </div>

                    <div className="hidden h-px bg-slate-200 md:block" />

                    <div
                      className={`rounded-[24px] border px-5 py-4 transition-all ${
                        currentStep === 2
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                            currentStep === 2
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-300 text-slate-700'
                          }`}
                        >
                          2
                        </div>
                        <Typography.Text strong>Pilih Dokter</Typography.Text>
                      </div>
                      <Typography.Text className="!text-sm text-slate-600">
                        Daftar dokter akan tampil setelah poli dipilih.
                      </Typography.Text>
                    </div>
                  </div>

                  <Form.Item name="poliId" rules={[{ required: true, message: 'Pilih poli' }]}>
                    <Input type="hidden" />
                  </Form.Item>

                  {!poliId ? (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <Typography.Title level={4} className="!mb-1">
                            Langkah 1: Pilih Poli
                          </Typography.Title>
                          <Typography.Text type="secondary">
                            Sentuh salah satu kartu poli untuk lanjut ke langkah berikutnya.
                          </Typography.Text>
                        </div>
                      </div>

                      {poliQuery.isLoading || poliQuery.isFetching ? (
                        <div className="mb-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
                          Memuat daftar poli...
                        </div>
                      ) : poliOptions.length ? (
                        <div className="mb-6 max-h-[28rem] overflow-y-auto rounded-[28px] border border-slate-100 bg-slate-50/60 p-3">
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {poliOptions.map((poli) => {
                              const isSelected = String(poliId || '') === poli.value
                              const color = getPoliColor(poli.label)

                              return (
                                <Card
                                  key={poli.value}
                                  hoverable
                                  onClick={() => form.setFieldValue('poliId', poli.value)}
                                  className={`group aspect-square transition-all flex! items-center justify-center duration-300 ${
                                    isSelected
                                      ? '!border-blue-500 !bg-blue-50 shadow-lg'
                                      : '!border-slate-200 hover:!border-blue-300 hover:shadow-md'
                                  }`}
                                >
                                  <div className="flex flex-col items-center justify-center gap-4 text-center">
                                    <div
                                      className={`flex h-12 w-12 border items-center justify-center rounded-full transition-all duration-300 ${color.bg} ${color.hover}`}
                                    >
                                      <MedicineBoxOutlined
                                        className={`text-2xl transition-colors duration-300 group-hover:text-white ${color.icon}`}
                                      />
                                    </div>
                                    <div className="text-xs font-semibold">{poli.label}</div>
                                  </div>
                                </Card>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="mb-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
                          Daftar poli belum tersedia.
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="mb-6 flex items-center justify-between rounded-[24px] border border-blue-100 bg-blue-50 px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-full text-white"
                          style={{ background: kioskGradient }}
                        >
                          <MedicineBoxOutlined className="text-xl" />
                        </div>
                        <div>
                          <Typography.Text type="secondary" className="!block">
                            Poli dipilih
                          </Typography.Text>
                          <Typography.Title level={5} className="!mb-0">
                            {selectedPoliLabel}
                          </Typography.Title>
                        </div>
                      </div>
                      <Button
                        onClick={() =>
                          form.setFieldsValue({
                            poliId: undefined,
                            doctorScheduleId: undefined
                          })
                        }
                        className="!rounded-2xl"
                      >
                        Ganti Poli
                      </Button>
                    </div>
                  )}

                  <Form.Item
                    name="doctorScheduleId"
                    label="Dokter"
                    rules={[{ required: true, message: 'Pilih dokter' }]}
                  >
                    <Input type="hidden" />
                  </Form.Item>

                  {canChooseDoctor ? (
                    <>
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <Typography.Title level={4} className="!mb-1">
                            Langkah 2: Pilih Dokter
                          </Typography.Title>
                          <Typography.Text type="secondary">
                            Menampilkan dokter untuk poli {selectedPoliLabel}.
                          </Typography.Text>
                        </div>
                        {selectedDoctorScheduleId ? (
                          <Tag color="blue" className="!mr-0 !rounded-full px-3 py-1">
                            Dokter dipilih
                          </Tag>
                        ) : null}
                      </div>

                      {doctorsQuery.isLoading || doctorsQuery.isRefetching ? (
                        <div className="mb-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
                          Memuat jadwal dokter...
                        </div>
                      ) : availableDoctors.length ? (
                        <div className="mb-6 max-h-[28rem] overflow-y-auto rounded-[28px] border border-slate-100 bg-slate-50/60 p-3">
                          <div className="grid gap-4 md:grid-cols-2">
                            {availableDoctors.map((doctor: any) => {
                              const isSelected =
                                String(selectedDoctorScheduleId || '') ===
                                String(doctor.doctorScheduleId)
                              const color = getPoliColor(doctor.poliName || selectedPoliLabel)

                              return (
                                <Card
                                  key={doctor.doctorScheduleId}
                                  hoverable
                                  onClick={() =>
                                    form.setFieldValue(
                                      'doctorScheduleId',
                                      String(doctor.doctorScheduleId)
                                    )
                                  }
                                  className={`group !rounded-[24px] transition-all duration-300 ${
                                    isSelected
                                      ? '!border-blue-500 !bg-blue-50 shadow-lg'
                                      : '!border-slate-200 hover:!border-blue-300 hover:shadow-md'
                                  }`}
                                  styles={{ body: { padding: 20 } }}
                                >
                                  <div className="flex min-h-[160px] flex-col items-center justify-center gap-4 text-center">
                                    <div
                                      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${color.bg} ${color.hover}`}
                                    >
                                      <UserOutlined
                                        className={`text-3xl transition-colors duration-300 group-hover:text-white ${color.icon}`}
                                      />
                                    </div>
                                    <Typography.Title level={5} className="!mb-0 !text-center">
                                      {doctor.doctorName || 'Dokter'}
                                    </Typography.Title>
                                  </div>
                                </Card>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="mb-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
                          Belum ada dokter tersedia untuk poli ini. Silakan pilih poli lain.
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="mb-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
                      Setelah poli dipilih, daftar dokter yang tersedia akan muncul di sini.
                    </div>
                  )}

                  <Form.Item name="memberCardNumber" label="Nomor Kartu Anggota (Opsional)">
                    <Input
                      placeholder="Scan atau masukkan nomor kartu"
                      addonAfter={
                        <Button
                          type="text"
                          icon={<BarcodeOutlined />}
                          onClick={handleDummyScanBarcode}
                          className="px-0"
                        >
                          Scan Dummy
                        </Button>
                      }
                    />
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={createQueue.isPending}
                    className="!mt-2 !h-16 !w-full !rounded-[20px] !border-0 !text-xl !font-semibold"
                    style={{
                      background: kioskGradient,
                      boxShadow: token.boxShadowSecondary
                    }}
                  >
                    Ambil Antrian
                  </Button>
                </Form>
              </Card>

              <div className="space-y-6">
                <Card
                  className="!rounded-[32px] !border-0 !overflow-hidden"
                  styles={{ body: { padding: 0 } }}
                >
                  <div className="px-8 py-8 text-center" style={{ background: kioskGradient }}>
                    <Typography.Text className="!text-white/75">
                      Nomor Antrian Terakhir
                    </Typography.Text>
                    <div className="mt-4 text-6xl font-semibold tracking-[0.18em] text-white">
                      {lastQueue?.formattedQueueNumber || lastQueue?.queueNumber || '--'}
                    </div>
                    <Typography.Text className="!mt-4 !block !text-white/75">
                      {lastQueue?.queueDate
                        ? dayjs(lastQueue.queueDate).format('DD MMM YYYY')
                        : 'Belum ada antrian yang diambil'}
                    </Typography.Text>
                  </div>
                  <div className="px-8 py-6">
                    <Typography.Title level={4} className="!mb-2">
                      Panduan Singkat
                    </Typography.Title>
                    <div className="text-base text-slate-600">
                      1. Pilih poli tujuan.
                      <br />
                      2. Pilih dokter yang tersedia.
                      <br />
                      3. Tekan tombol ambil antrian dan tunggu panggilan.
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12} xl={6}>
                <Card
                  className="!rounded-[24px] !border-0"
                  styles={{ body: { backgroundColor: token.colorBgContainer } }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <Typography.Text type="secondary">Total Poli</Typography.Text>
                      <div className="mt-2 text-3xl font-semibold text-slate-900">
                        {poliOptions.length}
                      </div>
                    </div>
                    <div
                      className="rounded-2xl p-3 text-white"
                      style={{ background: kioskGradient }}
                    >
                      <MedicineBoxOutlined className="text-2xl" />
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={12} xl={6}>
                <Card
                  className="!rounded-[24px] !border-0"
                  styles={{ body: { backgroundColor: token.colorBgContainer } }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <Typography.Text type="secondary">Dokter Tersedia</Typography.Text>
                      <div className="mt-2 text-3xl font-semibold text-slate-900">
                        {availableDoctors.length}
                      </div>
                    </div>
                    <div
                      className="rounded-2xl p-3 text-white"
                      style={{ background: kioskGradient }}
                    >
                      <TeamOutlined className="text-2xl" />
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={12} xl={6}>
                <Card
                  className="!rounded-[24px] !border-0"
                  styles={{ body: { backgroundColor: token.colorBgContainer } }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <Typography.Text type="secondary">Poli Dipilih</Typography.Text>
                      <div className="mt-2 text-2xl font-semibold text-slate-900">
                        {selectedPoliLabel}
                      </div>
                    </div>
                    <div
                      className="rounded-2xl p-3 text-white"
                      style={{ background: kioskGradient }}
                    >
                      <MedicineBoxOutlined className="text-2xl" />
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={12} xl={6}>
                <Card
                  className="!rounded-[24px] !border-0"
                  styles={{ body: { backgroundColor: token.colorBgContainer } }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <Typography.Text type="secondary">Update</Typography.Text>
                      <div className="mt-2 text-2xl font-semibold text-slate-900">
                        {dayjs().format('HH:mm')}
                      </div>
                    </div>
                    <div
                      className="rounded-2xl p-3 text-white"
                      style={{ background: kioskGradient }}
                    >
                      <ClockCircleOutlined className="text-2xl" />
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        </div>
      </Card>
    </div>
  )
}
