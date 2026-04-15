import {
  BarcodeOutlined,
  ClockCircleOutlined,
  MedicineBoxOutlined,
  ReloadOutlined,
  TeamOutlined,
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
  type KioskaDoctor,
  type KioskaPatient
} from './public-client'
import {
  clearSelectedKioskaPoli,
  getPoliColor,
  readSelectedKioskaPoli,
  type KioskaPoliOption
} from './shared'

type QueueResult = {
  formattedQueueNumber?: string
  queueNumber?: number | string
  queueDate?: string
}

export default function KioskaPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { token } = theme.useToken()
  const [form] = Form.useForm()
  const [lastQueue, setLastQueue] = useState<QueueResult | null>(null)
  const [selectedPoli, setSelectedPoli] = useState<KioskaPoliOption | null>(null)
  const [availableDoctors, setAvailableDoctors] = useState<KioskaDoctor[]>([])
  const [matchedPatient, setMatchedPatient] = useState<KioskaPatient | null>(null)
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true)
  const [isResolvingPatient, setIsResolvingPatient] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedDoctorScheduleId = Form.useWatch('doctorScheduleId', form)
  const medicalRecordNumber = Form.useWatch('medicalRecordNumber', form)
  const kioskGradient = `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`
  const queueDate = dayjs().format('YYYY-MM-DD')

  useEffect(() => {
    const storedPoli = readSelectedKioskaPoli()
    if (!storedPoli) {
      navigate('/kioska/setup', { replace: true })
      return
    }

    setSelectedPoli(storedPoli)
  }, [navigate])

  useEffect(() => {
    if (!selectedPoli) return

    let cancelled = false

    void (async () => {
      try {
        setIsLoadingDoctors(true)
        const result = await fetchKioskaDoctors({ date: queueDate, poliId: selectedPoli.id })
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
  }, [message, queueDate, selectedPoli])

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
            ) || patients[0] || null

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

  const handleDummyScanBarcode = () => {
    const dummyMrn = `MRN-${dayjs().format('YYYYMMDDHHmmss')}`
    form.setFieldValue('medicalRecordNumber', dummyMrn)
    message.success('MRN dummy berhasil di-scan')
  }

  const handleRefresh = async () => {
    if (!selectedPoli) return

    try {
      setIsLoadingDoctors(true)
      const result = await fetchKioskaDoctors({ date: queueDate, poliId: selectedPoli.id })
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

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (!selectedPoli) {
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
          ) || patients[0] || null
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

      setLastQueue((result || {}) as QueueResult)
      form.setFieldsValue({
        doctorScheduleId: undefined,
        medicalRecordNumber: undefined
      })
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
      message: 'Nomor rekam medis tidak ditemukan. Antrian tidak bisa dikaitkan ke pasien.'
    }
  }, [isResolvingPatient, matchedPatient, medicalRecordNumber])

  if (!selectedPoli) return null

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
              <Button
                onClick={handleChangePoli}
                className="!h-12 !rounded-2xl !border-0 !px-6 !text-base !font-medium"
              >
                Ganti Poli
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => void handleRefresh()}
                loading={isLoadingDoctors}
                className="!h-12 !rounded-2xl !border-0 !px-6 !text-base !font-medium !text-white"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                Refresh Data
              </Button>
            </Space>
          </div>

          <div className="flex flex-1 items-center justify-center py-8">
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
                      Form Ambil Antrian
                    </Typography.Title>
                    <Typography.Text type="secondary">
                      Poli sudah ditetapkan untuk kioska ini. Silakan pilih dokter yang tersedia.
                    </Typography.Text>
                  </div>
                </div>

                {/* <div className="mb-6 flex items-center justify-between rounded-[24px] border border-blue-100 bg-blue-50 px-5 py-4">
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
                        {selectedPoli.name}
                      </Typography.Title>
                    </div>
                  </div>
                  <Button onClick={handleChangePoli} className="!rounded-2xl">
                    Ganti Poli
                  </Button>
                </div> */}

                <Form
                  form={form}
                  layout="vertical"
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

                  <Form.Item name="medicalRecordNumber" label="Nomor Rekam Medis (Opsional)">
                    <Input
                      placeholder="Scan atau masukkan nomor rekam medis"
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
                    Ambil Antrian
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
                      1. Pastikan poli kioska sudah sesuai.
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
