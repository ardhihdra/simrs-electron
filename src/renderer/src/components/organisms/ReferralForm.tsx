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
import { SendOutlined, FilePdfOutlined, PrinterOutlined, EditOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useReactToPrint } from 'react-to-print'
import { ReferralLetter } from './ReferralLetter'
import { useReferralByEncounter } from '../../hooks/query/use-referral'
import { useMyProfile } from '../../hooks/useProfile'
import { queryClient } from '../../query-client'
import { client } from '../../utils/client'
import { useConditionByEncounter } from '@renderer/hooks/query/use-condition'
import { formatEncounterDiagnosisSummary } from '@renderer/utils/formatters/condition-formatter'
import { SignaturePadModal } from '@renderer/components/molecules/SignaturePadModal'

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

enum InternalReferralTargetType {
  POLI = 'POLI',
  INPATIENT = 'INPATIENT'
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

const SIGNATURE_SOURCE_OPTIONS = [
  { label: 'Input Manual', value: 'manual' },
  { label: 'Ambil dari Kepegawaian', value: 'kepegawaian' }
]

const RAWAT_INAP_DEFAULT_SERVICE_UNIT_ID = '9f3c77d6-8481-443b-871d-f8ec0d268803'

type AvailableBedOption = {
  bedId: string
  roomId: string
  status?: string
  room?: {
    id: string
    roomCodeId?: string
    roomClassCodeId?: string
    organizationId?: string
    floor?: string
  }
  bed?: {
    id: string
    bedCodeId?: string
  }
}

type AvailableRoomOption = {
  id: string
  organizationId?: string
}

export const ReferralForm = ({
  encounterId,
  patientId,
  patientData,
  onSuccess
}: ReferralFormProps) => {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const diagnosisRequiredMessage =
    'Diagnosis belum tersedia. Isi diagnosis di menu Diagnosis terlebih dahulu sebelum membuat rujukan.'
  const { profile } = useMyProfile()
  const [referralType, setReferralType] = useState<ReferralType>(ReferralType.INTERNAL)
  const [targetPoliId, setTargetPoliId] = useState<number | undefined>()
  const selectedSignatureSource = Form.useWatch('signatureSource', form)
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>()

  const [selectedReferral, setSelectedReferral] = useState<any>(null)
  const [isPreviewVisible, setIsPreviewVisible] = useState(false)
  const [signatures, setSignatures] = useState<Record<string, string>>({})
  const [selectedDoctorProfileTtdUrl, setSelectedDoctorProfileTtdUrl] = useState<string | null>(
    null
  )
  const [sigModal, setSigModal] = useState<{ visible: boolean; type: string; title: string }>({
    visible: false,
    type: '',
    title: ''
  })
  const referPatient = client.registration.referPatient.useMutation()
  const referralDate = Form.useWatch('referralDate', form)

  const internalTargetType =
    Form.useWatch('internalTargetType', form) ?? InternalReferralTargetType.POLI

  const { data: conditionData, isLoading: isLoadingConditions } =
    useConditionByEncounter(encounterId)

  const toFileUrl = (path?: string | null) => {
    if (!path || typeof path !== 'string') return undefined
    const trimmed = path.trim()
    if (!trimmed) return undefined
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:')
    ) {
      return trimmed
    }

    const normalizedPath = trimmed.replace(/\\/g, '/').replace(/^\/+/, '')
    if (normalizedPath.startsWith('api/files/')) {
      const base = String(window.env?.API_URL || '').replace(/\/+$/, '')
      const relative = normalizedPath.replace(/^api\/files\//, '')
      return `${base}/public/${relative}`
    }

    const base = String(window.env?.API_URL || '').replace(/\/+$/, '')
    return `${base}/public/${normalizedPath}`
  }

  const autoDoctorSignatureUrl = useMemo(
    () => toFileUrl(selectedDoctorProfileTtdUrl),
    [selectedDoctorProfileTtdUrl]
  )

  const resolveSignatureForPreview = (referral: any) => {
    if (selectedSignatureSource !== 'kepegawaian') {
      return signatures.doctor
    }

    return toFileUrl(
      referral?.referringPractitioner?.ttdUrl ||
        referral?.referringPractitioner?.ttd_url ||
        selectedDoctorProfileTtdUrl
    )
  }

  const handlePrint = (referral: any) => {
    setSelectedReferral({
      ...referral,
      signatureUrl: resolveSignatureForPreview(referral)
    })
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

  useEffect(() => {
    let isCancelled = false

    const loadDoctorProfile = async () => {
      if (!Number.isFinite(activePractitionerId)) {
        setSelectedDoctorProfileTtdUrl(null)
        return
      }

      const getById = window.api?.query?.kepegawaian?.getById
      if (!getById) {
        setSelectedDoctorProfileTtdUrl(null)
        return
      }

      try {
        const response = await getById({ id: Number(activePractitionerId) })
        const doctor = (response as any)?.result
        const ttdUrl = doctor?.ttdUrl || doctor?.ttd_url || null
        if (!isCancelled) {
          setSelectedDoctorProfileTtdUrl(
            typeof ttdUrl === 'string' && ttdUrl.trim() ? ttdUrl : null
          )
        }
      } catch {
        if (!isCancelled) {
          setSelectedDoctorProfileTtdUrl(null)
        }
      }
    }

    loadDoctorProfile()

    return () => {
      isCancelled = true
    }
  }, [activePractitionerId])

  const referralDateString = useMemo(
    () => (referralDate ? dayjs(referralDate).format('YYYY-MM-DD') : undefined),
    [referralDate]
  )
  const autoDiagnosisText = useMemo(() => {
    const payload = conditionData as { result?: unknown; data?: unknown } | undefined
    const conditions = Array.isArray(payload?.result)
      ? payload.result
      : Array.isArray(payload?.data)
        ? payload.data
        : []
    return formatEncounterDiagnosisSummary(conditions)
  }, [conditionData])
  const autoDiagnosisCode = useMemo(() => {
    const firstDiagnosisLine = autoDiagnosisText
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 0)

    if (!firstDiagnosisLine) return ''

    const withoutNumbering = firstDiagnosisLine.replace(/^\d+\.\s*/, '')
    const [code] = withoutNumbering.split(' - ')
    return code?.trim() || ''
  }, [autoDiagnosisText])
  const hasAutoDiagnosis = autoDiagnosisText.trim().length > 0

  const openSigModal = (type: string, title: string) => {
    setSigModal({ visible: true, type, title })
  }

  const saveSignature = (dataUrl: string) => {
    setSignatures((prev) => ({ ...prev, [sigModal.type]: dataUrl }))
  }

  useEffect(() => {
    form.setFieldsValue({
      diagnosisCode: autoDiagnosisCode,
      diagnosisText: autoDiagnosisText
    })
  }, [autoDiagnosisCode, autoDiagnosisText, form])

  const allSchedulesQuery = client.registration.getAvailableDoctors.useQuery(
    {
      date: referralDateString
    },
    {
      enabled:
        referralType === ReferralType.INTERNAL &&
        internalTargetType === InternalReferralTargetType.POLI &&
        !!referralDateString,
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
      enabled:
        referralType === ReferralType.INTERNAL &&
        internalTargetType === InternalReferralTargetType.POLI &&
        !!referralDateString &&
        !!targetPoliId,
      queryKey: [
        'referral-form-available-doctors',
        { date: referralDateString, poliId: targetPoliId }
      ]
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

  const availableBedsQuery = client.room.available.useQuery(
    { paginated: false },
    {
      enabled:
        referralType === ReferralType.INTERNAL &&
        internalTargetType === InternalReferralTargetType.INPATIENT,
      queryKey: ['referral-form-available-beds', { paginated: false }]
    }
  )

  const roomsQuery = client.room.rooms.useQuery(
    {},
    {
      enabled:
        referralType === ReferralType.INTERNAL &&
        internalTargetType === InternalReferralTargetType.INPATIENT,
      queryKey: ['referral-form-rooms', {}]
    }
  )

  const availableBeds = useMemo<AvailableBedOption[]>(() => {
    const data = availableBedsQuery.data as any
    return data?.result || data?.data || data || []
  }, [availableBedsQuery.data])

  const roomServiceUnitById = useMemo(() => {
    const data = roomsQuery.data as any
    const rooms: AvailableRoomOption[] = data?.result || data?.data || data || []
    return new Map(
      rooms
        .filter((room) => room.id && room.organizationId)
        .map((room) => [String(room.id), String(room.organizationId)])
    )
  }, [roomsQuery.data])

  const roomOptions = useMemo(() => {
    const rooms = new Map<string, { value: string; label: string }>()

    availableBeds.forEach((item) => {
      if (!item.room?.id) return

      const roomLabelParts = [item.room.roomCodeId, item.room.roomClassCodeId, item.room.floor]
        .filter(Boolean)
        .join(' • ')

      rooms.set(item.room.id, {
        value: item.room.id,
        label: roomLabelParts || item.room.id
      })
    })

    return Array.from(rooms.values())
  }, [availableBeds])

  const bedOptions = useMemo(() => {
    return availableBeds
      .filter((item) => item.room?.id === selectedRoomId)
      .map((item) => {
        const bedLabel = item.bed?.bedCodeId || item.bedId
        const roomLabel = item.room?.roomCodeId || 'Ruangan'

        return {
          value: item.bedId,
          label: `${bedLabel} (${roomLabel})`
        }
      })
  }, [availableBeds, selectedRoomId])

  useEffect(() => {
    form.setFieldValue('targetPoliId', undefined)
    form.setFieldValue('doctorScheduleId', undefined)
    setTargetPoliId(undefined)
  }, [form, referralDateString, referralType, internalTargetType])

  useEffect(() => {
    form.setFieldValue('targetRoomId', undefined)
    form.setFieldValue('targetBedId', undefined)
    setSelectedRoomId(undefined)
  }, [form, referralType, internalTargetType])

  const handleSubmit = async (values: any) => {
    try {
      if (!Number.isFinite(activePractitionerId)) {
        throw new Error('Dokter/perujuk aktif tidak ditemukan. Silakan login ulang.')
      }

      if (!hasAutoDiagnosis) {
        throw new Error(diagnosisRequiredMessage)
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

      if (
        values.referralType === ReferralType.INTERNAL &&
        values.internalTargetType === InternalReferralTargetType.POLI
      ) {
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
      } else if (
        values.referralType === ReferralType.INTERNAL &&
        values.internalTargetType === InternalReferralTargetType.INPATIENT
      ) {
        const selectedBed = availableBeds.find(
          (bed) => String(bed.bedId) === String(values.targetBedId)
        )

        if (!selectedBed) {
          throw new Error('Bed rawat inap tujuan tidak ditemukan. Silakan pilih ulang.')
        }

        const roomCode = selectedBed.room?.roomCodeId || 'Ruangan'
        const bedCode = selectedBed.bed?.bedCodeId || 'Bed'
        const targetOrganizationId =
          selectedBed.room?.organizationId ||
          (selectedBed.room?.id ? roomServiceUnitById.get(String(selectedBed.room.id)) : undefined) ||
          RAWAT_INAP_DEFAULT_SERVICE_UNIT_ID

        const response = await referPatient.mutateAsync({
          ...commonPayload,
          referralType: 'internal' as const,
          internalTargetType: 'INPATIENT' as const,
          targetOrganizationId,
          targetOrganizationName: `Rawat Inap - ${roomCode} / Bed ${bedCode}`
        })

        if ((response as any)?.success === false) {
          throw new Error((response as any)?.message || 'Gagal membuat rujukan internal rawat inap')
        }

        message.success('Rujukan internal ke rawat inap berhasil dibuat')
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
      form.setFieldsValue({
        referralType,
        transportationMode: 'mandiri',
        referralDate: dayjs(),
        diagnosisCode: autoDiagnosisCode,
        diagnosisText: autoDiagnosisText,
        signatureSource: 'manual'
      })
      setSelectedRoomId(undefined)
      setTargetPoliId(undefined)
      setSignatures({})
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
            internalTargetType: InternalReferralTargetType.POLI,
            transportationMode: 'mandiri',
            referralDate: dayjs(),
            diagnosisCode: autoDiagnosisCode,
            diagnosisText: autoDiagnosisText,
            signatureSource: 'manual'
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
                  <Radio.Button value={ReferralType.INTERNAL}>Internal</Radio.Button>
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

          {referralType === ReferralType.INTERNAL && (
            <Row gutter={24}>
              <Col span={24}>
                <Form.Item
                  name="internalTargetType"
                  label="Tujuan Internal"
                  rules={[{ required: true, message: 'Pilih tujuan internal' }]}
                >
                  <Radio.Group buttonStyle="solid">
                    <Radio.Button value={InternalReferralTargetType.POLI}>
                      Poli Rawat Jalan
                    </Radio.Button>
                    <Radio.Button value={InternalReferralTargetType.INPATIENT}>
                      Rawat Inap
                    </Radio.Button>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>
          )}

          <Row gutter={24}>
            <Col span={12}>
              {referralType === ReferralType.INTERNAL &&
              internalTargetType === InternalReferralTargetType.POLI ? (
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
              ) : referralType === ReferralType.INTERNAL &&
                internalTargetType === InternalReferralTargetType.INPATIENT ? (
                <Form.Item
                  name="targetRoomId"
                  label="Ruangan Tujuan"
                  rules={[{ required: true, message: 'Pilih ruangan tujuan' }]}
                >
                  <Select
                    showSearch
                    placeholder="Pilih ruangan rawat inap"
                    options={roomOptions}
                    loading={availableBedsQuery.isLoading || availableBedsQuery.isRefetching}
                    optionFilterProp="label"
                    onChange={(value) => {
                      setSelectedRoomId(String(value))
                      form.setFieldValue('targetBedId', undefined)
                    }}
                    notFoundContent="Tidak ada ruangan rawat inap yang tersedia"
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
              {referralType === ReferralType.INTERNAL &&
              internalTargetType === InternalReferralTargetType.POLI ? (
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
              ) : referralType === ReferralType.INTERNAL &&
                internalTargetType === InternalReferralTargetType.INPATIENT ? (
                <Form.Item
                  name="targetBedId"
                  label="Bed Tujuan"
                  rules={[{ required: true, message: 'Pilih bed tujuan' }]}
                >
                  <Select
                    showSearch
                    placeholder={selectedRoomId ? 'Pilih bed tujuan' : 'Pilih ruangan dahulu'}
                    options={bedOptions}
                    loading={availableBedsQuery.isLoading || availableBedsQuery.isRefetching}
                    disabled={!selectedRoomId}
                    optionFilterProp="label"
                    notFoundContent="Tidak ada bed tersedia untuk ruangan ini"
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

          {!isLoadingConditions && !hasAutoDiagnosis && (
            <Alert
              type="warning"
              showIcon
              className="mb-4"
              message="Diagnosis belum tersedia"
              description="Isi Diagnosis di menu Diagnosis terlebih dahulu sebelum membuat rujukan."
            />
          )}

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="diagnosisCode" label="Kode Diagnosa (otomatis dari Diagnosis)">
                <Input
                  readOnly
                  placeholder={
                    isLoadingConditions
                      ? 'Memuat diagnosis...'
                      : 'Kode diagnosis otomatis dari menu Diagnosis'
                  }
                />
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

          <Form.Item name="diagnosisText" label="Diagnosa (otomatis dari Diagnosis)">
            <TextArea
              rows={2}
              readOnly
              placeholder={
                isLoadingConditions
                  ? 'Memuat diagnosis...'
                  : 'Diagnosis otomatis dari menu Diagnosis'
              }
            />
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

          <Form.Item
            name="treatmentSummary"
            label="Terapi / Tindakan yang Sudah Diberikan (opsional)"
          >
            <TextArea rows={3} placeholder="Terapi atau tindakan sebelum pasien dirujuk..." />
          </Form.Item>

          <Card title="Tanda Tangan Digital (Opsional)" className="border border-gray-100 mb-4">
            <Form.Item
              className="mb-4!"
              name="signatureSource"
              label="Sumber Tanda Tangan Dokter Pengirim"
              rules={[{ required: true, message: 'Pilih sumber tanda tangan' }]}
            >
              <Select options={SIGNATURE_SOURCE_OPTIONS} />
            </Form.Item>

            <div className="rounded-lg border border-gray-200 bg-white p-4 max-w-[420px]">
              <div className="uppercase text-[10px] tracking-widest text-gray-500 font-semibold">
                Dokter Pengirim
              </div>
              <div className="mt-3 mb-4 h-32 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden relative group">
                {(
                  selectedSignatureSource === 'kepegawaian'
                    ? autoDoctorSignatureUrl
                    : signatures.doctor
                ) ? (
                  <img
                    src={
                      selectedSignatureSource === 'kepegawaian'
                        ? autoDoctorSignatureUrl
                        : signatures.doctor
                    }
                    alt="Signature"
                    className="max-h-full transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <EditOutlined className="text-2xl opacity-40" />
                    <span className="text-[10px] italic text-gray-500">
                      {selectedSignatureSource === 'kepegawaian'
                        ? 'TTD Kepegawaian Belum Ada'
                        : 'Belum Ada TTD'}
                    </span>
                  </div>
                )}
              </div>

              {selectedSignatureSource === 'kepegawaian' ? (
                <Tag color={autoDoctorSignatureUrl ? 'green' : 'default'} className="m-0">
                  {autoDoctorSignatureUrl
                    ? 'Diambil dari Kepegawaian'
                    : 'Profil Pegawai Tidak Punya TTD'}
                </Tag>
              ) : (
                <Button
                  icon={<EditOutlined />}
                  size="small"
                  className="text-xs"
                  onClick={() => openSigModal('doctor', 'Dokter Pengirim')}
                >
                  Input Tanda Tangan
                </Button>
              )}
            </div>
          </Card>

          <Form.Item className="mb-0 text-right">
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              loading={referPatient.isPending}
              disabled={!hasAutoDiagnosis || isLoadingConditions}
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

      <SignaturePadModal
        title={sigModal.title}
        visible={sigModal.visible}
        onClose={() => setSigModal({ ...sigModal, visible: false })}
        onSave={saveSignature}
      />
    </div>
  )
}
