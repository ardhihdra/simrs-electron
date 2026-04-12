import {
  BarcodeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  IdcardOutlined,
  MedicineBoxOutlined,
  ReloadOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserOutlined
} from '@ant-design/icons'
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
import { useNavigate } from 'react-router'
import {
  fetchKioskaDoctors,
  fetchKioskaPatients,
  registerKioskaQueue,
  registerRegistrationQueue,
  type KioskaDoctor,
  type KioskaPatient,
  type KioskaRegistrationTicket
} from './public-client'
import {
  clearSelectedKioskaPoli,
  getPoliColor,
  readKioskaConfig,
  type KioskaConfig
} from './shared'

type QueueResult = {
  formattedQueueNumber?: string
  queueNumber?: number | string
  queueDate?: string
  status?: string
}

type KioskaFlow = 'select' | 'registration' | 'medic'

export default function KioskaPage() {
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const { token } = theme.useToken()
  const [form] = Form.useForm()
  const [kioskaConfig, setKioskaConfig] = useState<KioskaConfig | null>(null)
  const [flow, setFlow] = useState<KioskaFlow>('select')
  const [lastMedicQueue, setLastMedicQueue] = useState<QueueResult | null>(null)
  const [availableDoctors, setAvailableDoctors] = useState<KioskaDoctor[]>([])
  const [matchedPatient, setMatchedPatient] = useState<KioskaPatient | null>(null)
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false)
  const [isResolvingPatient, setIsResolvingPatient] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedDoctorScheduleId = Form.useWatch('doctorScheduleId', form)
  const medicalRecordNumber = Form.useWatch('medicalRecordNumber', form)
  const kioskGradient = `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`
  const queueDate = dayjs().format('YYYY-MM-DD')

  useEffect(() => {
    const config = readKioskaConfig()
    if (!config) {
      navigate('/kioska/setup', { replace: true })
      return
    }
    setKioskaConfig(config)
  }, [navigate])

  useEffect(() => {
    if (flow !== 'medic' || !kioskaConfig?.poli) return

    let cancelled = false

    void (async () => {
      try {
        setIsLoadingDoctors(true)
        const result = await fetchKioskaDoctors({ date: queueDate, poliId: kioskaConfig.poli.id })
        if (cancelled) return
        setAvailableDoctors(result.doctors || [])
      } catch (error: any) {
        if (cancelled) return
        setAvailableDoctors([])
        message.error(error?.message || 'Gagal memuat jadwal dokter kioska')
      } finally {
        if (!cancelled) setIsLoadingDoctors(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [flow, message, queueDate, kioskaConfig])

  useEffect(() => {
    const normalizedMrn = String(medicalRecordNumber || '').trim()
    if (!normalizedMrn) {
      setMatchedPatient(null)
      setIsResolvingPatient(false)
      return
    }

    let cancelled = false
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          setIsResolvingPatient(true)
          const patients = await fetchKioskaPatients({ medicalRecordNumber: normalizedMrn })
          if (cancelled) return

          const exactMatch =
            patients.find(
              (patient) =>
                String(patient.medicalRecordNumber || '').trim().toLowerCase() ===
                normalizedMrn.toLowerCase()
            ) ||
            patients[0] ||
            null

          setMatchedPatient(exactMatch)
        } catch (error: any) {
          if (cancelled) return
          setMatchedPatient(null)
          message.error(error?.message || 'Gagal mencari data pasien')
        } finally {
          if (!cancelled) setIsResolvingPatient(false)
        }
      })()
    }, 400)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [medicalRecordNumber, message])

  const handleRefreshDoctors = async () => {
    if (!kioskaConfig?.poli) return
    try {
      setIsLoadingDoctors(true)
      const result = await fetchKioskaDoctors({ date: queueDate, poliId: kioskaConfig.poli.id })
      setAvailableDoctors(result.doctors || [])
      message.success('Data dokter diperbarui')
    } catch (error: any) {
      setAvailableDoctors([])
      message.error(error?.message || 'Gagal memuat jadwal dokter kioska')
    } finally {
      setIsLoadingDoctors(false)
    }
  }

  const handleChangePoli = () => {
    clearSelectedKioskaPoli()
    navigate('/kioska/setup')
  }

  const handleBackToSelect = () => {
    setFlow('select')
    form.resetFields()
    setMatchedPatient(null)
  }

  const handleTakeRegistrationQueue = async () => {
    if (!kioskaConfig?.lokasiKerjaId) {
      message.error('ID Lokasi Kerja belum dikonfigurasi. Hubungi petugas untuk mengatur kioska.')
      return
    }

    try {
      setIsSubmitting(true)
      const ticket = await registerRegistrationQueue({
        lokasiKerjaId: kioskaConfig.lokasiKerjaId,
        queueDate
      })

      modal.success({
        title: 'Nomor Antrian Pendaftaran',
        centered: true,
        width: 520,
        icon: null,
        okText: 'Selesai',
        afterClose: handleBackToSelect,
        content: (
          <div className="pt-4 text-center">
            <div className="rounded-[28px] px-6 py-8" style={{ background: kioskGradient }}>
              <Typography.Text className="!text-white/80">Nomor antrian kamu</Typography.Text>
              <div className="mt-3 text-6xl font-semibold tracking-[0.16em] text-white">
                {ticket?.ticketNo ?? '-'}
              </div>
              <Typography.Text className="!mt-3 !block !text-white/80">
                {dayjs(ticket?.queueDate ?? queueDate).format('DD MMM YYYY')}
              </Typography.Text>
            </div>
            <div className="mt-4 text-slate-600">
              Tunjukkan nomor ini ke petugas pendaftaran dan tunggu dipanggil.
            </div>
          </div>
        )
      })
    } catch (error: any) {
      message.error(error?.message || 'Gagal mengambil antrian pendaftaran')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitMedicQueue = async () => {
    try {
      const values = await form.validateFields()
      if (!kioskaConfig?.poli) {
        navigate('/kioska/setup', { replace: true })
        return
      }

      if (!availableDoctors.length) {
        message.error('Dokter belum tersedia untuk poli yang dipilih')
        return
      }

      const selectedDoctor = availableDoctors.find(
        (doctor) => String(doctor.doctorScheduleId) === String(values.doctorScheduleId)
      )

      if (!selectedDoctor) {
        message.error('Harap pilih dokter yang tersedia')
        return
      }

      const normalizedMrn = String(values.medicalRecordNumber || '').trim()
      let resolvedPatient = matchedPatient
      if (normalizedMrn && !resolvedPatient) {
        const patients = await fetchKioskaPatients({ medicalRecordNumber: normalizedMrn })
        resolvedPatient =
          patients.find(
            (patient) =>
              String(patient.medicalRecordNumber || '').trim().toLowerCase() ===
              normalizedMrn.toLowerCase()
          ) ||
          patients[0] ||
          null
        setMatchedPatient(resolvedPatient)
      }

      if (normalizedMrn && !resolvedPatient?.id) {
        message.error('Data pasien dengan nomor rekam medis tersebut tidak ditemukan')
        return
      }

      setIsSubmitting(true)
      const result = await registerKioskaQueue({
        queueDate,
        visitDate: queueDate,
        practitionerId: Number(selectedDoctor.doctorId),
        doctorScheduleId: Number(selectedDoctor.doctorScheduleId),
        patientId: resolvedPatient?.id,
        registrationType: 'OFFLINE',
        paymentMethod: 'CASH',
        reason: 'Registrasi Kioska',
        notes: normalizedMrn ? `KIOSKA_MRN:${normalizedMrn}` : undefined
      })

      const queueResult = (result || {}) as QueueResult
      setLastMedicQueue(queueResult)
      form.setFieldsValue({ doctorScheduleId: undefined, medicalRecordNumber: undefined })
      setMatchedPatient(null)
      message.success('Antrian berhasil diambil')
    } catch (error: any) {
      if (hasValidationErrors(error)) {
        notifyFormValidationError(form, message, error, 'Lengkapi data antrian terlebih dahulu.')
        return
      }
      message.error(error?.message || 'Gagal mengambil antrian')
    } finally {
      setIsSubmitting(false)
    }
  }

  const patientStatus = useMemo(() => {
    if (!medicalRecordNumber) return null
    if (isResolvingPatient) return { type: 'info' as const, message: 'Mencari data pasien...' }
    if (matchedPatient?.id) {
      return {
        type: 'success' as const,
        message: `Pasien ditemukan: ${matchedPatient.name || '-'} (${matchedPatient.medicalRecordNumber || '-'})`
      }
    }
    return {
      type: 'warning' as const,
      message:
        'Nomor rekam medis tidak ditemukan. Antrian akan dibuat tanpa identitas pasien (status PRE_RESERVED).'
    }
  }, [isResolvingPatient, matchedPatient, medicalRecordNumber])

  if (!kioskaConfig) return null

  const selectedPoli = kioskaConfig.poli

  return (
    <div className="space-y-6">
      <Card
        className="overflow-hidden! h-screen! rounded-none!"
        styles={{
          body: {
            minHeight: 'calc(100vh - 11rem)',
            padding: 0,
            background: kioskGradient
          }
        }}
      >
        <div className="flex h-screen flex-col px-6 py-6 md:px-8 md:py-8">
          {/* Header */}
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
                {flow === 'select' ? 'Selamat Datang' : flow === 'registration' ? 'Antrian Pendaftaran' : 'Antrian Poli'}
              </Typography.Title>
              <Space wrap size="middle">
                <div className="rounded-full bg-white/12 px-4 py-2 text-sm text-white/90">
                  Poli Aktif: {selectedPoli.name}
                </div>
                <div className="rounded-full bg-white/12 px-4 py-2 text-sm text-white/90">
                  Tanggal: {dayjs(queueDate).format('DD MMM YYYY')}
                </div>
              </Space>
            </div>

            <Space wrap>
              {flow !== 'select' && (
                <Button
                  onClick={handleBackToSelect}
                  className="!h-12 !rounded-2xl !border-0 !px-6 !text-base !font-medium"
                >
                  Kembali
                </Button>
              )}
              <Button
                onClick={handleChangePoli}
                className="!h-12 !rounded-2xl !border-0 !px-6 !text-base !font-medium"
              >
                Ganti Poli
              </Button>
              {flow === 'medic' && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => void handleRefreshDoctors()}
                  loading={isLoadingDoctors}
                  className="!h-12 !rounded-2xl !border-0 !px-6 !text-base !font-medium !text-white"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                >
                  Refresh Data
                </Button>
              )}
            </Space>
          </div>

          {/* Body */}
          <div className="flex flex-1 items-center justify-center py-8">
            {/* Flow Selection Screen */}
            {flow === 'select' && (
              <div className="w-full max-w-4xl">
                <Typography.Title
                  level={2}
                  className="!mb-2 !text-center !text-3xl !text-white md:!text-4xl"
                >
                  Silakan pilih jenis kunjungan
                </Typography.Title>
                <Typography.Paragraph className="!mb-10 !text-center !text-white/80">
                  Pilih salah satu pilihan di bawah untuk melanjutkan
                </Typography.Paragraph>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Registration Queue */}
                  <Card
                    hoverable
                    onClick={() => setFlow('registration')}
                    className="!cursor-pointer !rounded-[28px] !border-0 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
                    styles={{ body: { padding: 32 } }}
                  >
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div
                        className="flex h-20 w-20 items-center justify-center rounded-[24px] text-white"
                        style={{ background: kioskGradient }}
                      >
                        <UserAddOutlined className="text-4xl" />
                      </div>
                      <Typography.Title level={3} className="!mb-1">
                        Belum Punya Rekam Medis
                      </Typography.Title>
                      <Typography.Text type="secondary" className="!text-base">
                        Kunjungan pertama atau tidak membawa kartu. Ambil nomor antrian{' '}
                        <strong>pendaftaran (R-001)</strong> dan tunggu dipanggil petugas.
                      </Typography.Text>
                    </div>
                  </Card>

                  {/* Direct Poli Queue */}
                  <Card
                    hoverable
                    onClick={() => setFlow('medic')}
                    className="!cursor-pointer !rounded-[28px] !border-0 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
                    styles={{ body: { padding: 32 } }}
                  >
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div
                        className="flex h-20 w-20 items-center justify-center rounded-[24px] text-white"
                        style={{ background: kioskGradient }}
                      >
                        <IdcardOutlined className="text-4xl" />
                      </div>
                      <Typography.Title level={3} className="!mb-1">
                        Punya Nomor Rekam Medis
                      </Typography.Title>
                      <Typography.Text type="secondary" className="!text-base">
                        Sudah terdaftar dan membawa nomor rekam medis. Langsung ambil nomor{' '}
                        <strong>antrian poli</strong> sesuai dokter pilihan.
                      </Typography.Text>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Registration Queue Flow (R-001) */}
            {flow === 'registration' && (
              <div className="w-full max-w-2xl">
                <Card className="!rounded-[28px] !border-0">
                  <div className="flex flex-col items-center gap-6 py-8 text-center">
                    <div
                      className="flex h-24 w-24 items-center justify-center rounded-[28px] text-white"
                      style={{ background: kioskGradient }}
                    >
                      <UserAddOutlined className="text-5xl" />
                    </div>

                    <div>
                      <Typography.Title level={2} className="!mb-2">
                        Antrian Pendaftaran
                      </Typography.Title>
                      <Typography.Paragraph className="!mb-0 !text-base text-slate-600">
                        Kamu akan mendapatkan nomor antrian pendaftaran (R-001).
                        <br />
                        Petugas akan membantu verifikasi identitas dan mengarahkan ke poli yang
                        sesuai.
                      </Typography.Paragraph>
                    </div>

                    {!kioskaConfig.lokasiKerjaId && (
                      <Alert
                        type="warning"
                        showIcon
                        message="ID Lokasi Kerja belum dikonfigurasi. Hubungi admin untuk mengatur kioska ini."
                        className="w-full !text-left"
                      />
                    )}

                    <div className="w-full rounded-[20px] border border-slate-100 bg-slate-50 px-6 py-5 text-left">
                      <Typography.Text type="secondary" className="!block !text-sm">
                        Panduan:
                      </Typography.Text>
                      <ol className="mt-2 space-y-1 text-sm text-slate-600">
                        <li>1. Tekan tombol di bawah untuk ambil nomor.</li>
                        <li>2. Catat nomor antrian yang muncul.</li>
                        <li>3. Duduk dan tunggu dipanggil petugas pendaftaran.</li>
                        <li>4. Petugas akan membantu memilih poli yang tepat.</li>
                      </ol>
                    </div>

                    <Button
                      type="primary"
                      size="large"
                      icon={<CheckCircleOutlined />}
                      loading={isSubmitting}
                      disabled={!kioskaConfig.lokasiKerjaId}
                      onClick={() => void handleTakeRegistrationQueue()}
                      className="!h-20 !w-full !rounded-[20px] !border-0 !text-2xl !font-semibold"
                      style={{
                        background: kioskGradient,
                        boxShadow: token.boxShadowSecondary
                      }}
                    >
                      Ambil Nomor Antrian Pendaftaran
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Direct Medic Queue Flow */}
            {flow === 'medic' && (
              <div className="grid w-full max-w-6xl gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <Card>
                  <div className="mb-0 flex items-center gap-4">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-[24px] text-white"
                      style={{ background: kioskGradient }}
                    >
                      <MedicineBoxOutlined className="text-3xl" />
                    </div>
                    <div>
                      <Typography.Title level={3} className="!mb-1">
                        Form Ambil Antrian Poli
                      </Typography.Title>
                      <Typography.Text type="secondary">
                        Pilih dokter yang tersedia untuk poli {selectedPoli.name}.
                      </Typography.Text>
                    </div>
                  </div>

                  <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmitMedicQueue}
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
                      name="doctorScheduleId"
                      rules={[{ required: true, message: 'Pilih dokter' }]}
                    >
                      <Input type="hidden" />
                    </Form.Item>

                    <div className="mb-4">
                      <Typography.Title level={4} className="!mb-1">
                        Pilih Dokter
                      </Typography.Title>
                      <Typography.Text type="secondary">
                        Menampilkan dokter untuk poli {selectedPoli.name}.
                      </Typography.Text>
                    </div>

                    {isLoadingDoctors ? (
                      <div className="mb-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
                        Memuat jadwal dokter...
                      </div>
                    ) : availableDoctors.length ? (
                      <div className="mb-6 max-h-[28rem] overflow-y-auto rounded-[28px] border border-slate-100 bg-slate-50/60 p-3">
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                          {availableDoctors.map((doctor) => {
                            const isSelected =
                              String(selectedDoctorScheduleId || '') ===
                              String(doctor.doctorScheduleId)
                            const color = getPoliColor(doctor.poliName || selectedPoli.name)

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
                                <div className="flex aspect-square h-full w-full flex-col items-center justify-center gap-4 text-center">
                                  <div
                                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${color.bg} ${color.hover}`}
                                  >
                                    <UserOutlined
                                      className={`text-2xl transition-colors duration-300 group-hover:text-white ${color.icon}`}
                                    />
                                  </div>
                                  <div className="text-xs font-bold capitalize">
                                    {doctor.doctorName || 'Dokter'}
                                  </div>
                                </div>
                              </Card>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <Alert
                        type="warning"
                        showIcon
                        message="Belum ada dokter tersedia untuk poli ini. Silakan ganti poli atau refresh data."
                        className="!mb-6"
                      />
                    )}

                    <Form.Item name="medicalRecordNumber" label="Nomor Rekam Medis">
                      <Input
                        placeholder="Scan atau masukkan nomor rekam medis"
                        addonAfter={
                          <Button
                            type="text"
                            icon={<BarcodeOutlined />}
                            onClick={() => {
                              const dummy = `MRN-${dayjs().format('YYYYMMDDHHmmss')}`
                              form.setFieldValue('medicalRecordNumber', dummy)
                              message.success('MRN dummy berhasil di-scan')
                            }}
                            className="px-0"
                          >
                            Scan Dummy
                          </Button>
                        }
                      />
                    </Form.Item>

                    {patientStatus ? (
                      <Alert
                        className="!mb-4"
                        showIcon
                        type={patientStatus.type}
                        message={patientStatus.message}
                      />
                    ) : null}

                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isSubmitting}
                      className="!mt-2 !h-16 !w-full !rounded-[20px] !border-0 !text-xl !font-semibold"
                      style={{
                        background: kioskGradient,
                        boxShadow: token.boxShadowSecondary
                      }}
                    >
                      Ambil Antrian Poli
                    </Button>
                  </Form>
                </Card>

                <div className="space-y-6">
                  <Card className="!overflow-hidden !border-0" styles={{ body: { padding: 0 } }}>
                    <div className="px-8 py-8 text-center" style={{ background: kioskGradient }}>
                      <Typography.Text className="!text-white/75">
                        Nomor Antrian Terakhir
                      </Typography.Text>
                      <div className="mt-4 text-6xl font-semibold tracking-[0.18em] text-white">
                        {lastMedicQueue?.formattedQueueNumber || lastMedicQueue?.queueNumber || '--'}
                      </div>
                      <Typography.Text className="!mt-4 !block !text-white/75">
                        {lastMedicQueue?.queueDate
                          ? dayjs(lastMedicQueue.queueDate).format('DD MMM YYYY')
                          : 'Belum ada antrian yang diambil'}
                      </Typography.Text>
                      {lastMedicQueue?.status && (
                        <Tag
                          className="!mt-2 !border-0 !font-semibold !text-white"
                          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                        >
                          {lastMedicQueue.status}
                        </Tag>
                      )}
                    </div>
                    <div className="px-8 py-6">
                      <Typography.Title level={4} className="!mb-2">
                        Panduan Singkat
                      </Typography.Title>
                      <div className="text-base text-slate-600">
                        1. Masukkan nomor rekam medis (jika ada).
                        <br />
                        2. Pilih dokter yang tersedia.
                        <br />
                        3. Tekan ambil antrian dan tunggu panggilan.
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>

          {/* Footer stats */}
          <div className="mt-auto">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12} xl={8}>
                <Card
                  className="!rounded-[24px] !border-0"
                  styles={{ body: { backgroundColor: token.colorBgContainer } }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <Typography.Text type="secondary">Poli Aktif</Typography.Text>
                      <div className="mt-2 text-2xl font-semibold text-slate-900">
                        {selectedPoli.name}
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
              <Col xs={24} md={12} xl={8}>
                <Card
                  className="!rounded-[24px] !border-0"
                  styles={{ body: { backgroundColor: token.colorBgContainer } }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <Typography.Text type="secondary">Dokter Tersedia</Typography.Text>
                      <div className="mt-2 text-3xl font-semibold text-slate-900">
                        {flow === 'medic' ? availableDoctors.length : '-'}
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
              <Col xs={24} md={12} xl={8}>
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
