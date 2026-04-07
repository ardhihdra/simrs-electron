import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Form,
  Input,
  Select,
  Button,
  Radio,
  DatePicker,
  App,
  Card,
  Row,
  Col,
  Modal,
  Tag,
  Alert
} from 'antd'
import { SendOutlined, FilePdfOutlined, PrinterOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useReactToPrint } from 'react-to-print'
import { ReferralLetter } from './ReferralLetter'
import { useReferralByEncounter } from '../../hooks/query/use-referral'
import { useMyProfile } from '../../hooks/useProfile'
import { queryClient } from '../../query-client'
import { client } from '../../utils/client'

const { TextArea } = Input

interface ReferralFormProps {
  encounterId: string
  patientId?: string
  patientData?: any
  onSuccess?: () => void
}

enum ReferralType {
  INTERNAL = 'internal',
  EXTERNAL = 'external'
}

type AvailableDoctorOption = {
  doctorScheduleId: number
  doctorId: number
  doctorName?: string
  poliId: number
  poliName?: string
  timeSlot?: {
    startTime?: string
    endTime?: string
  } | null
}

export const ReferralForm = ({
  encounterId,
  patientId,
  patientData,
  onSuccess
}: ReferralFormProps) => {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const { profile } = useMyProfile()
  const [referralType, setReferralType] = useState<ReferralType>(ReferralType.INTERNAL)
  const [targetPoliId, setTargetPoliId] = useState<number | undefined>()

  const [selectedReferral, setSelectedReferral] = useState<any>(null)
  const [isPreviewVisible, setIsPreviewVisible] = useState(false)
  const referPatient = client.registration.referPatient.useMutation()
  const referralDate = Form.useWatch('referralDate', form)

  const handlePrint = (referral: any) => {
    setSelectedReferral(referral)
    setIsPreviewVisible(true)
  }

  const printContentRef = useRef<HTMLDivElement>(null)
  const docTitle = `Surat_Rujukan_${selectedReferral?.id || ''}`
  const handlePrintAction = useReactToPrint({
    contentRef: printContentRef,
    documentTitle: docTitle
  })

  // Mock patientData if not passed completely (just in case)
  const safePatientData = patientData || {
    patient: { name: 'Loading...', medicalRecordNumber: '-' }
  }

  const activePractitionerId = Number(profile?.id ?? patientData?.doctor?.id ?? NaN)
  const activePractitionerName = patientData?.doctor?.name || profile?.username || 'Dokter Pengirim'

  const referralDateString = useMemo(
    () => (referralDate ? dayjs(referralDate).format('YYYY-MM-DD') : undefined),
    [referralDate]
  )

  const allSchedulesQuery = client.registration.getAvailableDoctors.useQuery(
    {
      date: referralDateString
    },
    {
      enabled: referralType === ReferralType.INTERNAL && !!referralDateString,
      queryKey: ['referral-form-available-polis', { date: referralDateString }]
    }
  )

  const availableDoctors = useMemo<AvailableDoctorOption[]>(() => {
    const data = allSchedulesQuery.data as any
    return data?.result?.doctors || data?.data?.doctors || data?.doctors || []
  }, [allSchedulesQuery.data])

  const poliOptions = useMemo(() => {
    const polis = new Map<number, string>()
    availableDoctors.forEach((doctor) => {
      if (doctor.poliId) {
        polis.set(Number(doctor.poliId), doctor.poliName || `Poli #${doctor.poliId}`)
      }
    })

    return Array.from(polis.entries()).map(([id, name]) => ({
      value: id,
      label: name
    }))
  }, [availableDoctors])

  const doctorsQuery = client.registration.getAvailableDoctors.useQuery(
    {
      date: referralDateString,
      poliId: targetPoliId
    },
    {
      enabled: referralType === ReferralType.INTERNAL && !!referralDateString && !!targetPoliId,
      queryKey: ['referral-form-available-doctors', { date: referralDateString, poliId: targetPoliId }]
    }
  )

  const availableDoctorsForPoli = useMemo<AvailableDoctorOption[]>(() => {
    const data = doctorsQuery.data as any
    return data?.result?.doctors || data?.data?.doctors || data?.doctors || []
  }, [doctorsQuery.data])

  const doctorScheduleOptions = useMemo(() => {
    return availableDoctorsForPoli.map((doctor) => {
      const timeLabel =
        doctor.timeSlot?.startTime && doctor.timeSlot?.endTime
          ? ` (${doctor.timeSlot.startTime} - ${doctor.timeSlot.endTime})`
          : ''

      return {
        value: Number(doctor.doctorScheduleId),
        label: `${doctor.doctorName || 'Dokter'}${timeLabel}`
      }
    })
  }, [availableDoctorsForPoli])

  useEffect(() => {
    form.setFieldValue('targetPoliId', undefined)
    form.setFieldValue('doctorScheduleId', undefined)
    setTargetPoliId(undefined)
  }, [form, referralDateString, referralType])

  const handleSubmit = async (values: any) => {
    try {
      if (!Number.isFinite(activePractitionerId)) {
        throw new Error('Dokter/perujuk aktif tidak ditemukan. Silakan login ulang.')
      }

      const referralDateValue = values.referralDate
        ? values.referralDate.toISOString()
        : new Date().toISOString()

      const commonPayload = {
        encounterId,
        referringPractitionerId: activePractitionerId,
        referringPractitionerName: activePractitionerName,
        referralDate: referralDateValue,
        diagnosisCode: values.diagnosisCode || undefined,
        diagnosisText: values.diagnosisText || undefined,
        keadaanKirim: values.keadaanKirim || undefined,
        conditionAtTransfer: values.keadaanKirim || undefined,
        reasonForReferral: values.reasonForReferral || undefined,
        transportationMode: values.transportationMode || undefined,
        examinationSummary: values.examinationSummary || undefined,
        treatmentSummary: values.treatmentSummary || undefined,
        direction: 'outgoing' as const
      }

      if (values.referralType === ReferralType.INTERNAL) {
        const selectedDoctor = availableDoctorsForPoli.find(
          (doctor) => Number(doctor.doctorScheduleId) === Number(values.doctorScheduleId)
        )

        if (!selectedDoctor) {
          throw new Error('Jadwal dokter tujuan tidak ditemukan. Silakan pilih ulang.')
        }

        const response = await referPatient.mutateAsync({
          ...commonPayload,
          referralType: 'internal' as const,
          internalTargetType: 'POLI' as const,
          doctorScheduleId: Number(values.doctorScheduleId),
          targetOrganizationName: selectedDoctor.poliName || 'Poli Internal',
          targetPractitionerId: String(selectedDoctor.doctorId),
          targetPractitionerName: selectedDoctor.doctorName || 'Dokter Tujuan'
        })

        if ((response as any)?.success === false) {
          throw new Error((response as any)?.message || 'Gagal membuat rujukan internal')
        }

        message.success('Rujukan internal dan antrian poli berhasil dibuat')
      } else {
        const response = await referPatient.mutateAsync({
          ...commonPayload,
          referralType: 'external' as const,
          targetOrganizationName: values.targetOrganizationName,
          targetPractitionerName: values.targetPractitionerName || undefined
        })

        if ((response as any)?.success === false) {
          throw new Error((response as any)?.message || 'Gagal membuat rujukan eksternal')
        }

        message.success('Rujukan eksternal berhasil dibuat')
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['referrals', 'encounter', encounterId] }),
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey.some(
              (part) =>
                typeof part === 'string' &&
                ['registration', 'queue', 'referral', 'encounter'].some((token) =>
                  part.includes(token)
                )
            )
        })
      ])

      form.resetFields()
      setTargetPoliId(undefined)
      onSuccess?.()
    } catch (error: any) {
      message.error(error.message || 'Gagal membuat rujukan')
    }
  }

  // Fetch riwayat referral
  const { data: referralHistory, isError, error, refetch } = useReferralByEncounter(encounterId)

  const onFinish = (values: any) => {
    handleSubmit(values)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card title="Buat Rujukan Baru" className=" border-blue-50">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            referralType: ReferralType.INTERNAL,
            transportationMode: 'mandiri',
            referralDate: dayjs()
          }}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="referralType"
                label="Tipe Rujukan"
                rules={[{ required: true, message: 'Wajib dipilih' }]}
              >
                <Radio.Group onChange={(e) => setReferralType(e.target.value)} buttonStyle="solid">
                  <Radio.Button value={ReferralType.INTERNAL}>Internal (Antar Poli)</Radio.Button>
                  <Radio.Button value={ReferralType.EXTERNAL}>Eksternal (RS Lain)</Radio.Button>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="referralDate" label="Tanggal Rujukan" rules={[{ required: true }]}>
                <DatePicker className="w-full" format="DD MMM YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              {referralType === ReferralType.INTERNAL ? (
                <Form.Item
                  name="targetPoliId"
                  label="Poli Tujuan"
                  rules={[{ required: true, message: 'Pilih poli tujuan' }]}
                >
                  <Select
                    showSearch
                    placeholder={
                      referralDateString ? 'Pilih poli tujuan' : 'Pilih tanggal rujukan dahulu'
                    }
                    options={poliOptions}
                    loading={allSchedulesQuery.isLoading || allSchedulesQuery.isRefetching}
                    disabled={!referralDateString}
                    optionFilterProp="label"
                    onChange={(value) => {
                      setTargetPoliId(Number(value))
                      form.setFieldValue('doctorScheduleId', undefined)
                    }}
                    notFoundContent="Tidak ada poli dengan jadwal pada tanggal ini"
                  />
                </Form.Item>
              ) : (
                <Form.Item
                  name="targetOrganizationName"
                  label="Nama Rumah Sakit / Fasilitas Tujuan"
                  rules={[{ required: true, message: 'Isi nama RS tujuan' }]}
                >
                  <Input placeholder="Contoh: RSUP Dr. Sardjito" />
                </Form.Item>
              )}
            </Col>
            <Col span={12}>
              {referralType === ReferralType.INTERNAL ? (
                <Form.Item
                  name="doctorScheduleId"
                  label="Jadwal Dokter Tujuan"
                  rules={[{ required: true, message: 'Pilih dokter dan jadwal tujuan' }]}
                >
                  <Select
                    showSearch
                    placeholder={
                      targetPoliId ? 'Pilih dokter dan jam praktik' : 'Pilih poli tujuan dahulu'
                    }
                    options={doctorScheduleOptions}
                    loading={doctorsQuery.isLoading || doctorsQuery.isRefetching}
                    disabled={!referralDateString || !targetPoliId}
                    optionFilterProp="label"
                    notFoundContent="Tidak ada dokter tersedia untuk poli/tanggal ini"
                  />
                </Form.Item>
              ) : (
                <Form.Item name="targetPractitionerName" label="Dokter Tujuan (opsional)">
                  <Input placeholder="Nama dokter tujuan bila ada" />
                </Form.Item>
              )}
            </Col>
          </Row>

          <Form.Item
            name="reasonForReferral"
            label="Alasan Rujukan"
            rules={[{ required: true, message: 'Jelaskan alasan rujukan' }]}
          >
            <TextArea rows={3} placeholder="Jelaskan indikasi medis mengapa pasien dirujuk..." />
          </Form.Item>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="diagnosisCode" label="Kode Diagnosa (opsional)">
                <Input placeholder="Contoh: I10" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="transportationMode" label="Transportasi">
                <Select
                  options={[
                    { label: 'Mandiri / Jalan', value: 'mandiri' },
                    { label: 'Kursi roda', value: 'wheelchair' },
                    { label: 'Bed / Brankar', value: 'bed' },
                    { label: 'Ambulans', value: 'ambulance' },
                    { label: 'Kendaraan pribadi', value: 'private_vehicle' }
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="diagnosisText" label="Diagnosa (opsional)">
            <TextArea rows={2} placeholder="Diagnosa pasien bila perlu dicantumkan" />
          </Form.Item>

          <Form.Item
            name="keadaanKirim"
            label="Keadaan Saat Kirim"
            rules={[{ required: true, message: 'Isi keadaan pasien saat dikirim' }]}
          >
            <TextArea rows={2} placeholder="Contoh: stabil, compos mentis, nyeri sedang" />
          </Form.Item>

          <Form.Item name="examinationSummary" label="Ringkasan Pemeriksaan (opsional)">
            <TextArea
              rows={3}
              placeholder="Ringkasan kondisi pasien atau pemeriksaan yang sudah dilakukan..."
            />
          </Form.Item>

          <Form.Item name="treatmentSummary" label="Terapi / Tindakan yang Sudah Diberikan (opsional)">
            <TextArea rows={3} placeholder="Terapi atau tindakan sebelum pasien dirujuk..." />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              loading={referPatient.isPending}
            >
              Buat Rujukan
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {isError && (
        <Alert
          message="Gagal Memuat Riwayat"
          description={
            error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat data rujukan.'
          }
          type="error"
          showIcon
          action={
            <Button size="small" type="text" onClick={() => refetch()}>
              Coba Lagi
            </Button>
          }
        />
      )}

      {Array.isArray(referralHistory) && referralHistory.length > 0 && (
        <Card title="Riwayat Rujukan" className=" border-gray-100">
          <div className="flex flex-col gap-3">
            {referralHistory.map((ref: any) => (
              <div
                key={ref.id}
                className="p-4 border rounded-lg bg-gray-50 flex justify-between items-center hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag color={ref.referralType === 'internal' ? 'blue' : 'purple'}>
                      {ref.referralType === 'internal' ? 'INTERNAL' : 'EKSTERNAL'}
                    </Tag>
                    <span className="text-xs text-gray-500">
                      {dayjs(ref.createdAt).format('DD MMM YYYY, HH:mm')}
                    </span>
                  </div>
                  <div className="font-bold text-lg text-gray-800">
                    Ke:{' '}
                    {ref.targetOrganizationName ||
                      ref.targetDepartemen?.nama ||
                      ref.targetLocation?.nama ||
                      ref.targetPractitionerName ||
                      ref.targetUnit ||
                      ref.targetFacility ||
                      '-'}
                  </div>
                  <div className="text-gray-600 mt-1 line-clamp-1 italic">
                    &quot;{ref.reasonForReferral || ref.reason || '-'}&quot;
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border
                      ${
                        ref.status === 'cancelled' || ref.priority === 'emergency'
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : ref.status === 'draft' || ref.priority === 'urgent'
                            ? 'bg-orange-50 text-orange-600 border-orange-200'
                            : 'bg-green-50 text-green-600 border-green-200'
                      }
                    `}
                  >
                    {String(ref.status || ref.priority || 'issued').toUpperCase()}
                  </span>
                  <Button
                    icon={<FilePdfOutlined />}
                    onClick={() => handlePrint(ref)}
                    title="Cetak Surat Rujukan"
                  >
                    Cetak
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal
        title="Preview Surat Rujukan"
        open={isPreviewVisible}
        onCancel={() => setIsPreviewVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setIsPreviewVisible(false)}>
            Tutup
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrintAction}>
            Cetak / Simpan PDF
          </Button>
        ]}
        centered
        bodyStyle={{ padding: 0, background: '#f0f2f5', maxHeight: '80vh', overflow: 'auto' }}
      >
        <div className="p-4 flex justify-center">
          <ReferralLetter
            ref={printContentRef}
            data={selectedReferral}
            patientData={safePatientData}
          />
        </div>
      </Modal>
    </div>
  )
}
