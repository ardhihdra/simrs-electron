import { useState, useRef } from 'react'
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
import { useCreateReferral, useReferralByEncounter } from '../../hooks/query/use-referral'

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

enum ReferralPriority {
  NORMAL = 'normal',
  URGENT = 'urgent',
  EMERGENCY = 'emergency'
}

export const ReferralForm = ({
  encounterId,
  patientId,
  patientData,
  onSuccess
}: ReferralFormProps) => {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const [referralType, setReferralType] = useState<ReferralType>(ReferralType.INTERNAL)

  const [selectedReferral, setSelectedReferral] = useState<any>(null)
  const [isPreviewVisible, setIsPreviewVisible] = useState(false)

  const handlePrint = (referral: any) => {
    setSelectedReferral(referral)
    setIsPreviewVisible(true)
  }

  const printContentRef = useRef<HTMLDivElement>(null)
  const docTitle = `Surat_Rujukan_${selectedReferral?.id || ''}`
  const handlePrintAction = useReactToPrint({
    content: () => printContentRef.current,
    documentTitle: docTitle
  })

  // Mock patientData if not passed completely (just in case)
  const safePatientData = patientData || {
    patient: { name: 'Loading...', medicalRecordNumber: '-' }
  }

  // Mock list Poli/Unit untuk rujukan internal
  // Idealnya ini fetch dari API Unit/Poli
  const internalUnits = [
    { label: 'Poli Penyakit Dalam', value: 'Poli Penyakit Dalam' },
    { label: 'Poli Bedah', value: 'Poli Bedah' },
    { label: 'Poli Anak', value: 'Poli Anak' },
    { label: 'Poli Jantung', value: 'Poli Jantung' },
    { label: 'Poli Mata', value: 'Poli Mata' },
    { label: 'Poli THT', value: 'Poli THT' },
    { label: 'Poli Saraf', value: 'Poli Saraf' },
    { label: 'Unit Rehabilitasi Medik', value: 'Unit Rehabilitasi Medik' }
  ]

  // Use Custom Hooks
  const createReferral = useCreateReferral()

  const handleSubmit = (values: any) => {
    const formattedValues = {
      ...values,
      referralDate: values.referralDate ? values.referralDate.toISOString() : undefined
    }

    createReferral.mutate(
      {
        ...formattedValues,
        encounterId,
        patientId,
        referredBy: 1, // Mock doctor ID
        status: 'planned'
      },
      {
        onSuccess: () => {
          message.success('Rujukan berhasil dibuat')
          form.resetFields()
          onSuccess?.()
        },
        onError: (error: any) => {
          message.error(error.message || 'Gagal membuat rujukan')
        }
      }
    )
  }

  // Fetch riwayat referral
  const { data: referralHistory, isError, error, refetch } = useReferralByEncounter(encounterId)

  const onFinish = (values: any) => {
    handleSubmit(values)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card title="Buat Rujukan Baru" className="shadow-sm border-blue-50">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            referralType: ReferralType.INTERNAL,
            priority: ReferralPriority.NORMAL,
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
                  name="targetUnit"
                  label="Poli / Unit Tujuan"
                  rules={[{ required: true, message: 'Pilih poli tujuan' }]}
                >
                  <Select
                    showSearch
                    placeholder="Pilih Unit Tujuan"
                    options={internalUnits}
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
              ) : (
                <Form.Item
                  name="targetFacility"
                  label="Nama Rumah Sakit / Fasilitas Tujuan"
                  rules={[{ required: true, message: 'Isi nama RS tujuan' }]}
                >
                  <Input placeholder="Contoh: RSUP Dr. Sardjito" />
                </Form.Item>
              )}
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Prioritas" rules={[{ required: true }]}>
                <Select
                  options={[
                    { label: 'Normal', value: ReferralPriority.NORMAL },
                    { label: 'Urgent (Segera)', value: ReferralPriority.URGENT },
                    { label: 'Emergency (Gawat Darurat)', value: ReferralPriority.EMERGENCY }
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="reason"
            label="Alasan Rujukan"
            rules={[{ required: true, message: 'Jelaskan alasan rujukan' }]}
          >
            <TextArea rows={3} placeholder="Jelaskan indikasi medis mengapa pasien dirujuk..." />
          </Form.Item>

          <Form.Item name="clinicalSummary" label="Ringkasan Klinis (Opsional)">
            <TextArea
              rows={3}
              placeholder="Ringkasan kondisi pasien, diagnosis sementara, atau tindakan yg sudah dilakukan..."
            />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Button
              type="primary"
              htmlType="submit"
              icon={<SendOutlined />}
              loading={createReferral.isPending}
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
        <Card title="Riwayat Rujukan" className="shadow-sm border-gray-100">
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
                    Ke: {ref.referralType === 'internal' ? ref.targetUnit : ref.targetFacility}
                  </div>
                  <div className="text-gray-600 mt-1 line-clamp-1 italic">
                    &quot;{ref.reason}&quot;
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border
                      ${
                        ref.priority === 'emergency'
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : ref.priority === 'urgent'
                            ? 'bg-orange-50 text-orange-600 border-orange-200'
                            : 'bg-green-50 text-green-600 border-green-200'
                      }
                    `}
                  >
                    {ref.priority.toUpperCase()}
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
