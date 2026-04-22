import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  DatePicker,
  App,
  Modal,
  Table,
  Typography,
  Alert,
  Tag
} from 'antd'
import {
  PrinterOutlined,
  SaveOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import { useReactToPrint } from 'react-to-print'
import { FollowUpLetter, type FollowUpData } from './FollowUpLetter'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { AssessmentHeader } from '../AssesmentHeader/AssessmentHeader'
import { SignaturePadModal } from '@renderer/components/molecules/SignaturePadModal'
import { SelectAsync } from '@renderer/components/organisms/SelectAsync'
import {
  useCreateFollowUpSchedule,
  useFollowUpScheduleByEncounter,
  useDeleteFollowUpSchedule
} from '@renderer/hooks/query/use-follow-up-schedule'
import { useConditionByEncounter } from '@renderer/hooks/query/use-condition'
import { formatEncounterDiagnosisSummary } from '@renderer/utils/formatters/condition-formatter'
import { client } from '@renderer/utils/client'

dayjs.locale('id')

const { Text } = Typography
const { TextArea } = Input

interface FollowUpFormProps {
  encounterId: string
  patientData: any
}

interface AvailableDoctorOption {
  doctorId?: number
  doctorName?: string
  timeSlot?: {
    startTime?: string
    endTime?: string
  } | null
}

interface PerformerOption {
  id?: number | string
  name?: string
  sip?: string | null
  ttdUrl?: string | null
}

const JENIS_KONTROL_OPTIONS = [
  { label: 'Post Rawat Jalan', value: 'Post Rawat Jalan' },
  { label: 'Post Rawat Inap', value: 'Post Rawat Inap' },
  { label: 'Post Operasi', value: 'Post Operasi' },
  { label: 'Kontrol Rutin', value: 'Kontrol Rutin' },
  { label: 'Rujuk Balik / Prolanis', value: 'Rujuk Balik / Prolanis' }
]

const SIGNATURE_SOURCE_OPTIONS = [
  { label: 'Input Manual', value: 'manual' },
  { label: 'Ambil dari Kepegawaian', value: 'kepegawaian' }
]

export const FollowUpForm = ({ encounterId: _encounterId, patientData }: FollowUpFormProps) => {
  const [form] = Form.useForm()
  const { message, modal } = App.useApp()
  const diagnosisRequiredMessage =
    'Diagnosis belum tersedia. Isi diagnosis di menu Diagnosis terlebih dahulu sebelum membuat surat kontrol.'
  const selectedPoliTujuan = Form.useWatch('poliTujuan', form)
  const selectedPerformerId = Form.useWatch('performerId', form)
  const selectedDoctorTargetId = Form.useWatch('dokterTujuan', form)
  const selectedSignatureSource = Form.useWatch('signatureSource', form)
  const selectedPoliId = useMemo(() => {
    const parsed = Number(selectedPoliTujuan)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
  }, [selectedPoliTujuan])
  const selectedControlDate = Form.useWatch('controlDate', form)
  const controlDateString = useMemo(() => {
    if (!selectedControlDate) return undefined
    const parsed = dayjs(selectedControlDate)
    return parsed.isValid() ? parsed.format('YYYY-MM-DD') : undefined
  }, [selectedControlDate])

  const { data: performers, isLoading: isLoadingPerformers } = usePerformers(['doctor'])
  const { data: conditionData, isLoading: isLoadingConditions } =
    useConditionByEncounter(_encounterId)

  const { data: followUpList, isLoading: isListLoading } =
    useFollowUpScheduleByEncounter(_encounterId)
  const createFollowUp = useCreateFollowUpSchedule()
  const deleteFollowUp = useDeleteFollowUpSchedule()

  const [previewData, setPreviewData] = useState<FollowUpData | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const doctorsByPoliQuery = client.registration.getAvailableDoctors.useQuery(
    {
      date: controlDateString,
      poliId: selectedPoliId
    },
    {
      enabled: isFormModalOpen && !!selectedPoliId,
      queryKey: [
        'follow-up-form-available-doctors',
        { poliId: selectedPoliId, date: controlDateString }
      ]
    }
  )

  const [signatures, setSignatures] = useState<Record<string, string>>({})
  const [selectedDoctorProfileTtdUrl, setSelectedDoctorProfileTtdUrl] = useState<string | null>(null)
  const [sigModal, setSigModal] = useState<{ visible: boolean; type: string; title: string }>({
    visible: false,
    type: '',
    title: ''
  })

  const printRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Surat_Kontrol_${previewData?.id || ''}`
  })

  const openSigModal = (type: string, title: string) => {
    setSigModal({ visible: true, type, title })
  }

  const saveSignature = (dataUrl: string) => {
    setSignatures((prev) => ({ ...prev, [sigModal.type]: dataUrl }))
  }

  const toFileUrl = (path?: string | null) => {
    if (!path || typeof path !== 'string') return undefined
    const trimmed = path.trim()
    if (!trimmed) return undefined
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
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

  const selectedSignatureSourceDoctorId = useMemo(() => {
    return selectedPerformerId || selectedDoctorTargetId || undefined
  }, [selectedDoctorTargetId, selectedPerformerId])

  const selectedPerformer = useMemo<PerformerOption | null>(() => {
    const list = (performers as PerformerOption[] | undefined) || []
    return list.find((p) => String(p.id) === String(selectedSignatureSourceDoctorId)) || null
  }, [performers, selectedSignatureSourceDoctorId])

  useEffect(() => {
    let isCancelled = false

    const loadDoctorProfile = async () => {
      const rawId = selectedSignatureSourceDoctorId
      const id = Number(rawId)
      if (!rawId || !Number.isFinite(id) || id <= 0) {
        setSelectedDoctorProfileTtdUrl(null)
        return
      }

      const getById = window.api?.query?.kepegawaian?.getById
      if (!getById) {
        setSelectedDoctorProfileTtdUrl(null)
        return
      }

      try {
        const response = await getById({ id })
        const doctor = (response as any)?.result
        const ttdUrl = doctor?.ttdUrl || doctor?.ttd_url || null
        if (!isCancelled) {
          setSelectedDoctorProfileTtdUrl(typeof ttdUrl === 'string' && ttdUrl.trim() ? ttdUrl : null)
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
  }, [selectedSignatureSourceDoctorId])

  const autoDoctorSignatureUrl = useMemo(
    () => toFileUrl(selectedDoctorProfileTtdUrl || selectedPerformer?.ttdUrl),
    [selectedDoctorProfileTtdUrl, selectedPerformer?.ttdUrl]
  )

  const signatureBox = (
    type: string,
    label: string,
    mode: 'manual' | 'kepegawaian' = 'manual',
    autoSignatureUrl?: string
  ) => (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <Text strong className="uppercase text-[10px] tracking-widest text-gray-500">
        {label}
      </Text>
      <div className="mt-3 mb-4 h-32 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden relative group">
        {(mode === 'kepegawaian' ? autoSignatureUrl : signatures[type]) ? (
          <img
            src={mode === 'kepegawaian' ? autoSignatureUrl : signatures[type]}
            alt="Signature"
            className="max-h-full transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <EditOutlined className="text-2xl opacity-40" />
            <Text className="text-[10px] italic text-gray-500">
              {mode === 'kepegawaian' ? 'TTD Kepegawaian Belum Ada' : 'Belum Ada TTD'}
            </Text>
          </div>
        )}
      </div>
      {mode === 'kepegawaian' ? (
        <Tag color={autoSignatureUrl ? 'green' : 'default'} className="m-0">
          {autoSignatureUrl ? 'Diambil dari Kepegawaian' : 'Profil Pegawai Tidak Punya TTD'}
        </Tag>
      ) : (
        <Button
          icon={<EditOutlined />}
          size="small"
          className="text-xs"
          onClick={() => openSigModal(type, label)}
        >
          Input Tanda Tangan
        </Button>
      )}
    </div>
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
  const hasAutoDiagnosis = autoDiagnosisText.trim().length > 0
  const availableDoctorsForPoli = useMemo<AvailableDoctorOption[]>(() => {
    const data = doctorsByPoliQuery.data as any
    return data?.result?.doctors || data?.data?.doctors || data?.doctors || []
  }, [doctorsByPoliQuery.data])
  const doctorTargetOptions = useMemo(() => {
    const uniqueDoctors = new Map<number, { value: number; label: string }>()

    availableDoctorsForPoli.forEach((doctor) => {
      if (!doctor?.doctorId || uniqueDoctors.has(Number(doctor.doctorId))) return

      const timeLabel =
        doctor.timeSlot?.startTime && doctor.timeSlot?.endTime
          ? ` (${doctor.timeSlot.startTime} - ${doctor.timeSlot.endTime})`
          : ''

      uniqueDoctors.set(Number(doctor.doctorId), {
        value: Number(doctor.doctorId),
        label: `${doctor.doctorName || 'Dokter'}${timeLabel}`
      })
    })

    return Array.from(uniqueDoctors.values())
  }, [availableDoctorsForPoli])

  useEffect(() => {
    if (!isFormModalOpen) return
    form.setFieldsValue({
      assessment_date: dayjs(),
      diagnosis: autoDiagnosisText
    })
  }, [autoDiagnosisText, form, isFormModalOpen])

  useEffect(() => {
    if (!isFormModalOpen) return
    form.setFieldValue('dokterTujuan', undefined)
  }, [form, isFormModalOpen, selectedPoliId, controlDateString])

  const closeFormModal = () => {
    setIsFormModalOpen(false)
    form.resetFields([
      'controlDate',
      'poliTujuan',
      'dokterTujuan',
      'jenisKontrol',
      'diagnosis',
      'notes',
      'signatureSource'
    ])
    form.setFieldsValue({
      assessment_date: dayjs(),
      diagnosis: autoDiagnosisText,
      signatureSource: 'manual'
    })
  }

  const openFormModal = () => {
    setIsFormModalOpen(true)
    setSignatures({})
    form.setFieldValue('signatureSource', 'manual')
    if (!isLoadingConditions && !hasAutoDiagnosis) {
      message.warning(diagnosisRequiredMessage)
    }
  }

  const onFinish = async (values: any) => {
    const diagnosisValue = String(values.diagnosis || '').trim()
    if (!diagnosisValue || !hasAutoDiagnosis) {
      message.warning(diagnosisRequiredMessage)
      return
    }

    const selectedDoctorId = Number(values.dokterTujuan)
    const performer =
      (performers as any[] | undefined)?.find((p: any) => Number(p.id) === selectedDoctorId) ||
      (performers as any[] | undefined)?.[0]

    const controlDateISO = values.controlDate?.toISOString()

    try {
      await createFollowUp.mutateAsync({
        encounterId: _encounterId,
        patientId: patientData?.patient?.id || patientData?.id,
        doctorId: Number(performer?.id || selectedDoctorId || 1),
        followUpDate: controlDateISO,
        polyclinicId: Number(values.poliTujuan) || null,
        controlType: values.jenisKontrol,
        diagnosis: diagnosisValue,
        notes: values.notes
      })

      message.success('Rencana Kontrol berhasil dibuat')
      closeFormModal()
    } catch (error) {
      console.error(error)
      message.error('Gagal menyimpan rencana kontrol')
    }
  }

  const handleDelete = async (record: any) => {
    const rawId = record?.id ?? record?.followUpScheduleId ?? record?.follow_up_schedule_id
    if (rawId === undefined || rawId === null || String(rawId).trim() === '') {
      message.error('ID jadwal kontrol tidak ditemukan, data tidak bisa dihapus.')
      return
    }

    const id = String(rawId)

    modal.confirm({
      title: 'Hapus Rencana Kontrol',
      content: 'Apakah Anda yakin ingin menghapus data Jadwal Kontrol ini?',
      okText: 'Ya, Hapus',
      okType: 'danger',
      cancelText: 'Batal',
      onOk: async () => {
        try {
          await deleteFollowUp.mutateAsync({ id })
          message.success('Jadwal kontrol berhasil dihapus')
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : 'Gagal menghapus jadwal kontrol'
          message.error(errMsg)
        }
      }
    })
  }

  const columns = [
    {
      title: 'No',
      key: 'no',
      width: 50,
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: 'Tgl Pembuatan',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date: string) => (
        <div className="flex flex-col">
          <span className="font-semibold">{dayjs(date).format('DD/MM/YYYY')}</span>
          <span className="text-gray-500 text-xs">{dayjs(date).format('HH:mm')}</span>
        </div>
      )
    },
    {
      title: 'Dokter',
      key: 'doctor',
      width: 160,
      render: (_: any, record: any) => (
        <div className="flex flex-col">
          <span className="font-medium text-blue-700 text-xs">
            {record.doctor?.namaLengkap || '-'}
          </span>
        </div>
      )
    },
    {
      title: 'Jadwal Kontrol',
      key: 'detail',
      render: (_: any, record: any) => (
        <div className="flex flex-col gap-2 text-sm py-1">
          <div className="flex gap-2 items-center">
            <Tag color="green" className="uppercase tracking-wide text-[10px] mr-0">
              {record.controlType || 'Kontrol'}
            </Tag>
            <span className="font-semibold">
              {dayjs(record.followUpDate).format('dddd, DD MMM YYYY')}
            </span>
          </div>

          <div className="flex flex-col text-gray-600 text-xs gap-1">
            <span>
              <span className="text-gray-400">Diagnosis:</span> {record.diagnosis || '-'}
            </span>
            <span>
              <span className="text-gray-400">Poli Tujuan:</span>{' '}
              {record.polyclinic?.name || record.polyclinicId || '-'}
            </span>
          </div>

          {record.notes && (
            <div className="mt-1 bg-gray-50 border border-gray-100 p-2 rounded text-xs italic text-gray-500">
              Catatan: {record.notes}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 80,
      align: 'center' as const,
      render: (_: any, record: any) => (
        <div className="flex gap-2 justify-center">
          <Button
            type="text"
            className="text-blue-500"
            icon={<PrinterOutlined />}
            onClick={() => {
              const fallbackDoctor = (performers as any[])?.find((p) => p.id === record.doctorId)
              setPreviewData({
                id: record.id,
                controlDate: record.followUpDate,
                poliTujuan:
                  record.polyclinic?.name ||
                  (record.polyclinicId ? `Poli ID ${record.polyclinicId}` : 'Poliklinik'),
                dokterTujuan:
                  record.doctor?.namaLengkap || fallbackDoctor?.name || 'Dokter Pemeriksa',
                jenisKontrol: record.controlType,
                diagnosis: record.diagnosis || '-',
                notes: record.notes,
                issuedAt: record.createdAt,
                doctorName:
                  record.doctor?.namaLengkap || fallbackDoctor?.name || 'dr. _______________',
                doctorSip: fallbackDoctor?.sip || undefined,
                signatureUrl:
                  selectedSignatureSource === 'kepegawaian'
                    ? toFileUrl(
                        record?.doctor?.ttdUrl ||
                          fallbackDoctor?.ttdUrl ||
                          selectedDoctorProfileTtdUrl ||
                          selectedPerformer?.ttdUrl
                      )
                    : signatures.doctor
              })
              setIsPreviewOpen(true)
            }}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            loading={deleteFollowUp.isPending}
          />
        </div>
      )
    }
  ]

  return (
    <div className="flex flex-col gap-6">
      <Card
        title="Riwayat Surat Kontrol Pasien"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openFormModal}>
            Buat Jadwal Kontrol
          </Button>
        }
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          dataSource={followUpList || []}
          rowKey="id"
          pagination={false}
          className="border-none"
          loading={isListLoading}
          locale={{ emptyText: 'Belum ada riwayat surat kontrol' }}
        />
      </Card>

      <Modal
        title="Buat Jadwal / Rencana Kontrol"
        open={isFormModalOpen}
        onCancel={closeFormModal}
        footer={[
          <Button key="cancel" onClick={closeFormModal}>
            Batal
          </Button>,
          <Button
            key="save"
            type="primary"
            icon={<SaveOutlined />}
            loading={createFollowUp.isPending}
            disabled={!hasAutoDiagnosis || isLoadingConditions}
            onClick={() => form.submit()}
          >
            Simpan
          </Button>
        ]}
        width={800}
        destroyOnClose
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="pt-4 space-y-4! flex! flex-col!"
          initialValues={{
            assessment_date: dayjs(),
            signatureSource: 'manual'
          }}
        >
          <AssessmentHeader performers={performers || []} loading={isLoadingPerformers} />

          <Card title="Jadwal Kontrol" className="border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Form.Item
                className="mb-0!"
                name="controlDate"
                label="Tanggal Kontrol"
                rules={[{ required: true, message: 'Wajib diisi' }]}
              >
                <DatePicker className="w-full" format="DD MMM YYYY" />
              </Form.Item>
              <Form.Item
                className="mb-0!"
                name="poliTujuan"
                label="Poli Tujuan"
                rules={[{ required: true, message: 'Wajib dipilih' }]}
              >
                <SelectAsync entity="poli" />
              </Form.Item>
              <Form.Item
                className="mb-0!"
                name="dokterTujuan"
                label="Dokter Tujuan"
                rules={[{ required: true, message: 'Wajib dipilih' }]}
              >
                <Select
                  placeholder={
                    selectedPoliId ? 'Pilih Dokter Tujuan' : 'Pilih poli tujuan terlebih dahulu'
                  }
                  showSearch
                  disabled={!selectedPoliId}
                  loading={doctorsByPoliQuery.isLoading || doctorsByPoliQuery.isRefetching}
                  options={doctorTargetOptions}
                  optionFilterProp="label"
                  notFoundContent={
                    selectedPoliId
                      ? 'Tidak ada dokter aktif untuk poli/tanggal ini'
                      : 'Pilih poli tujuan terlebih dahulu'
                  }
                />
              </Form.Item>
            </div>

            <Form.Item
              className="!mt-4 mb-0!"
              name="jenisKontrol"
              label="Jenis Kontrol"
              rules={[{ required: true, message: 'Wajib dipilih' }]}
            >
              <Select
                options={JENIS_KONTROL_OPTIONS}
                placeholder="Contoh: Post Rawat Inap, Kontrol Rutin..."
              />
            </Form.Item>
          </Card>

          <Card title="Diagnosis (Otomatis dari Menu Diagnosis)" className="border border-gray-100">
            {!isLoadingConditions && !hasAutoDiagnosis && (
              <Alert
                type="warning"
                showIcon
                className="mb-3"
                message="Diagnosis belum tersedia"
                description="Isi Diagnosis di menu Diagnosis terlebih dahulu sebelum membuat surat kontrol."
              />
            )}

            <Form.Item
              className="mb-0!"
              name="diagnosis"
              label="Diagnosis"
              rules={[{ required: true, message: 'Wajib diisi' }]}
            >
              <TextArea
                rows={4}
                readOnly
                placeholder={
                  isLoadingConditions
                    ? 'Memuat diagnosis...'
                    : 'Diagnosis akan terisi otomatis dari menu Diagnosis'
                }
              />
            </Form.Item>
          </Card>

          <Card title="Catatan Tindak Lanjut" className="border border-gray-100">
            <Form.Item className="mb-0!" name="notes" label="Catatan Dokter (Opsional)">
              <TextArea rows={3} placeholder="Pemeriksaan lab yang harus dibawa, dll..." />
            </Form.Item>
          </Card>

          <Card title="Tanda Tangan Digital (Opsional)" className="border border-gray-100">
            <Form.Item
              className="mb-4!"
              name="signatureSource"
              label="Sumber Tanda Tangan Dokter"
              rules={[{ required: true, message: 'Pilih sumber tanda tangan' }]}
            >
              <Select options={SIGNATURE_SOURCE_OPTIONS} />
            </Form.Item>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[520px]">
              {signatureBox(
                'doctor',
                'Dokter Pemeriksa',
                selectedSignatureSource === 'kepegawaian' ? 'kepegawaian' : 'manual',
                autoDoctorSignatureUrl
              )}
            </div>
          </Card>
        </Form>
      </Modal>

      <SignaturePadModal
        title={sigModal.title}
        visible={sigModal.visible}
        onClose={() => setSigModal({ ...sigModal, visible: false })}
        onSave={saveSignature}
      />

      <Modal
        title="Preview Rencana Kontrol"
        open={isPreviewOpen}
        onCancel={() => setIsPreviewOpen(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setIsPreviewOpen(false)}>
            Tutup
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            Cetak / Simpan PDF
          </Button>
        ]}
        centered
        styles={{
          body: { padding: 0, background: '#f0f2f5', maxHeight: '80vh', overflow: 'auto' }
        }}
      >
        <div className="p-4 flex justify-center">
          {previewData && (
            <FollowUpLetter ref={printRef} data={previewData} patientData={patientData} />
          )}
        </div>
      </Modal>
    </div>
  )
}

export default FollowUpForm
