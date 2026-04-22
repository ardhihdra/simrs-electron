import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Row,
  Col,
  App,
  Modal,
  Table,
  DatePicker,
  InputNumber,
  Divider,
  Typography,
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
import {
  MedicalCertificateLetter,
  type CertificateType,
  type MedicalCertificateData
} from './MedicalCertificateLetter'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { AssessmentHeader } from '../AssesmentHeader/AssessmentHeader'
import { SignaturePadModal } from '@renderer/components/molecules/SignaturePadModal'
import {
  useCreateMedicalCertificate,
  useMedicalCertificateByEncounter,
  useDeleteMedicalCertificate
} from '@renderer/hooks/query/use-medical-certificate'
dayjs.locale('id')

const { Text } = Typography
const { TextArea } = Input

interface MedicalCertificateFormProps {
  encounterId: string
  patientData: any
}

const CERTIFICATE_TYPE_OPTIONS: { label: string; value: CertificateType; color: string }[] = [
  { label: 'Surat Keterangan Sakit', value: 'sakit', color: 'red' },
  { label: 'Surat Keterangan Sehat', value: 'sehat', color: 'green' },
  { label: 'Surat Keterangan Istirahat', value: 'istirahat', color: 'orange' },
  { label: 'Surat Keterangan Lainnya', value: 'lainnya', color: 'blue' }
]

const SIGNATURE_SOURCE_OPTIONS = [
  { label: 'Input Manual', value: 'manual' },
  { label: 'Ambil dari Kepegawaian', value: 'kepegawaian' }
]

export const MedicalCertificateForm = ({
  encounterId: _encounterId,
  patientData
}: MedicalCertificateFormProps) => {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const selectedSignatureSource = Form.useWatch('signatureSource', form)
  const selectedPerformerId = Form.useWatch('performerId', form)

  const { data: performers, isLoading: isLoadingPerformers } = usePerformers(['doctor'])

  const { data: medicalCertificates, isLoading: isListLoading } =
    useMedicalCertificateByEncounter(_encounterId)
  const createMedicalCertificate = useCreateMedicalCertificate()
  const deleteMedicalCertificate = useDeleteMedicalCertificate()

  const [previewData, setPreviewData] = useState<MedicalCertificateData | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)

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
    documentTitle: `Surat_Keterangan_${previewData?.id || ''}`
  })

  const [selectedType, setSelectedType] = useState<CertificateType>('sakit')
  const needsRestPeriod = selectedType === 'sakit' || selectedType === 'istirahat'

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

  const selectedPerformer = useMemo(() => {
    const list = (performers as any[] | undefined) || []
    return list.find((p) => String(p.id) === String(selectedPerformerId)) || null
  }, [performers, selectedPerformerId])

  useEffect(() => {
    let isCancelled = false

    const loadDoctorProfile = async () => {
      const id = Number(selectedPerformerId)
      if (!selectedPerformerId || !Number.isFinite(id) || id <= 0) {
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
  }, [selectedPerformerId])

  const autoDoctorSignatureUrl = useMemo(
    () => toFileUrl(selectedDoctorProfileTtdUrl || selectedPerformer?.ttdUrl),
    [selectedDoctorProfileTtdUrl, selectedPerformer?.ttdUrl]
  )

  const openSigModal = (type: string, title: string) => {
    setSigModal({ visible: true, type, title })
  }

  const saveSignature = (dataUrl: string) => {
    setSignatures((prev) => ({ ...prev, [sigModal.type]: dataUrl }))
  }

  const signatureBox = (
    type: string,
    label: string,
    mode: 'manual' | 'kepegawaian' = 'manual',
    autoSignatureUrl?: string
  ) => (
    <div className="flex flex-col items-center p-4 border border-black/10 bg-white/10">
      <Text strong className="mb-3 uppercase text-[10px] tracking-widest text-gray-400">
        {label}
      </Text>
      <div className="border border-white/10 w-full h-32 flex items-center justify-center mb-4 bg-white/10 rounded-lg overflow-hidden relative group">
        {(mode === 'kepegawaian' ? autoSignatureUrl : signatures[type]) ? (
          <img
            src={mode === 'kepegawaian' ? autoSignatureUrl : signatures[type]}
            alt="Signature"
            className="max-h-full transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-300">
            <EditOutlined className="text-2xl opacity-20" />
            <Text className="text-[10px] italic">
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
          block
          className="rounded-lg text-xs"
          onClick={() => openSigModal(type, label)}
        >
          Tanda Tangan
        </Button>
      )}
    </div>
  )

  const onFinish = async (values: any) => {
    const performer =
      (performers as any[] | undefined)?.find(
        (p: any) => p.name === values.performerId || p.id === values.performerId
      ) || (performers as any[] | undefined)?.[0]

    try {
      const dbPayload = {
        encounterId: _encounterId,
        patientId: patientData?.patient?.id || patientData?.id,
        doctorId: performer?.id || 1,
        type: values.certificateType,
        validFrom: values.validFrom?.toISOString(),
        validUntil: values.validUntil?.toISOString(),
        diagnosis: values.diagnosis,
        notes: values.notes
          ? `${values.purpose ? `Keperluan: ${values.purpose}\n` : ''}${values.notes}`
          : values.purpose
            ? `Keperluan: ${values.purpose}`
            : undefined
      }

      const response = await createMedicalCertificate.mutateAsync(dbPayload)

      const newCert: MedicalCertificateData = {
        id: response?.id || `SKT-${Date.now()}`,
        certificateType: values.certificateType,
        diagnosis: values.diagnosis,
        purpose: values.purpose,
        notes: values.notes,
        validFrom: values.validFrom?.toISOString(),
        validUntil: values.validUntil?.toISOString(),
        restDays: values.restDays,
        issuedAt: values.assessment_date?.toISOString() || new Date().toISOString(),
        doctorName: performer?.name || 'dr. _______________',
        doctorSip: performer?.sip || undefined,
        signatureUrl:
          values.signatureSource === 'kepegawaian'
            ? toFileUrl(selectedDoctorProfileTtdUrl || performer?.ttdUrl)
            : signatures['doctor']
      }

      setPreviewData(newCert)
      setIsPreviewOpen(true)

      message.success('Surat keterangan berhasil dibuat')
      form.resetFields(['diagnosis', 'purpose', 'notes', 'validFrom', 'validUntil', 'restDays'])
      form.setFieldsValue({
        certificateType: selectedType,
        assessment_date: dayjs(),
        signatureSource: 'manual'
      })
      setIsFormModalOpen(false)
    } catch (error) {
      console.error(error)
      message.error('Gagal menyimpan Surat Keterangan')
    }
  }

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Hapus Surat Keterangan',
      content: 'Apakah Anda yakin ingin menghapus Riwayat Surat ini?',
      okText: 'Ya, Hapus',
      okType: 'danger',
      cancelText: 'Batal',
      onOk: async () => {
        try {
          await deleteMedicalCertificate.mutateAsync({ id })
          message.success('Riwayat Surat berhasil dihapus')
        } catch (error) {
          message.error('Gagal menghapus riwayat')
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
      title: 'Dibuat Pada',
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
      title: 'Detail Surat',
      key: 'detail',
      render: (_: any, record: any) => {
        const typeColorMatch = CERTIFICATE_TYPE_OPTIONS.find((t) => t.value === record.type)
        const typeColor = typeColorMatch ? typeColorMatch.color : 'blue'

        return (
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex gap-2 items-center">
              <span
                className={`font-bold text-${typeColor}-600 bg-${typeColor}-50 px-2 py-0.5 rounded text-xs border border-${typeColor}-100 uppercase tracking-wider`}
              >
                KETERANGAN {record.type}
              </span>
            </div>

            <div className="flex flex-col gap-1 mt-1 text-xs text-gray-600">
              {record.diagnosis && (
                <span>
                  <span className="text-gray-400">Diagnosis:</span> {record.diagnosis}
                </span>
              )}

              {(record.validFrom || record.validUntil) && (
                <span className="font-medium text-purple-700">
                  Cuti/Istirahat:{' '}
                  {record.validFrom ? dayjs(record.validFrom).format('DD MMM') : '?'} s/d{' '}
                  {record.validUntil ? dayjs(record.validUntil).format('DD MMM YYYY') : '?'}
                </span>
              )}
            </div>

            {record.notes && (
              <div className="mt-1 bg-gray-50 border border-gray-100 p-2 rounded text-xs italic text-gray-500 whitespace-pre-wrap">
                {record.notes}
              </div>
            )}
          </div>
        )
      }
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

              const days =
                record.validFrom && record.validUntil
                  ? dayjs(record.validUntil).diff(dayjs(record.validFrom), 'day') + 1
                  : undefined

              setPreviewData({
                id: record.id,
                certificateType: (record.type as CertificateType) || 'sakit',
                diagnosis: record.diagnosis || '-',
                notes: record.notes,
                validFrom: record.validFrom,
                validUntil: record.validUntil,
                restDays: days,
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
            onClick={() => handleDelete(record.id)}
            loading={deleteMedicalCertificate.isPending}
          />
        </div>
      )
    }
  ]

  return (
    <div className="flex! flex-col! gap-6!">
      <Card
        title={
          <div className="flex items-center justify-between">
            <span>Riwayat Surat Keterangan Dokter</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsFormModalOpen(true)}>
              Buat Surat Keterangan
            </Button>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={medicalCertificates || []}
          rowKey="id"
          pagination={false}
          className="border-none"
          loading={isListLoading}
          locale={{ emptyText: 'Belum ada surat keterangan yang diterbitkan' }}
        />
      </Card>

      <Modal
        title="Buat Surat Keterangan"
        open={isFormModalOpen}
        onCancel={() => setIsFormModalOpen(false)}
        footer={null}
        width={800}
        destroyOnClose
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="mt-4 [&_.ant-form-item]:mb-3! [&_.ant-divider]:my-2!"
          initialValues={{
            certificateType: 'sakit',
            assessment_date: dayjs(),
            signatureSource: 'manual'
          }}
        >
          <AssessmentHeader performers={performers || []} loading={isLoadingPerformers} />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="certificateType"
                label="Jenis Surat Keterangan"
                rules={[{ required: true, message: 'Wajib dipilih' }]}
              >
                <Select
                  options={CERTIFICATE_TYPE_OPTIONS.map((o) => ({
                    label: o.label,
                    value: o.value
                  }))}
                  onChange={(v: CertificateType) => setSelectedType(v)}
                  placeholder="Pilih jenis surat"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="diagnosis"
            label="Diagnosis / Kondisi Medis"
            rules={[{ required: true, message: 'Wajib diisi' }]}
          >
            <TextArea
              rows={3}
              placeholder="Contoh: Demam Berdarah Dengue (A97), pasien memerlukan istirahat total..."
            />
          </Form.Item>

          {needsRestPeriod && (
            <>
              <Divider orientation="left" plain className="text-xs text-gray-400">
                Periode Istirahat
              </Divider>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="restDays" label="Jumlah Hari Istirahat">
                    <InputNumber min={1} max={365} className="w-full" placeholder="Contoh: 3" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="validFrom" label="Tanggal Mulai">
                    <DatePicker
                      className="w-full"
                      format="DD MMM YYYY"
                      onChange={(date) => {
                        const days = form.getFieldValue('restDays')
                        if (date && days) {
                          form.setFieldValue('validUntil', date.add(days - 1, 'day'))
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="validUntil" label="Tanggal Selesai">
                    <DatePicker className="w-full" format="DD MMM YYYY" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          <Form.Item name="purpose" label="Keperluan / Tujuan Surat (Opsional)">
            <Input placeholder="Contoh: keperluan pengajuan cuti ke kantor, pendaftaran sekolah, dsb." />
          </Form.Item>

          <Form.Item name="notes" label="Keterangan Tambahan (Opsional)">
            <TextArea rows={2} placeholder="Informasi medis tambahan yang perlu dicantumkan..." />
          </Form.Item>

          <Divider orientation="left" plain className="text-xs text-gray-400">
            Tanda Tangan Digital (Opsional)
          </Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="signatureSource"
                label="Sumber Tanda Tangan Dokter"
                rules={[{ required: true, message: 'Pilih sumber tanda tangan' }]}
              >
                <Select options={SIGNATURE_SOURCE_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              {signatureBox(
                'doctor',
                'Dokter Pemeriksa',
                selectedSignatureSource === 'kepegawaian' ? 'kepegawaian' : 'manual',
                autoDoctorSignatureUrl
              )}
            </Col>
          </Row>

          <Form.Item className="mb-0! mt-4!">
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsFormModalOpen(false)}>Batal</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMedicalCertificate.isPending}
                icon={<SaveOutlined />}
              >
                Simpan & Cetak
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <SignaturePadModal
        title={sigModal.title}
        visible={sigModal.visible}
        onClose={() => setSigModal({ ...sigModal, visible: false })}
        onSave={saveSignature}
      />

      <Modal
        title="Preview Surat Keterangan"
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
            <MedicalCertificateLetter ref={printRef} data={previewData} patientData={patientData} />
          )}
        </div>
      </Modal>
    </div>
  )
}

export default MedicalCertificateForm
