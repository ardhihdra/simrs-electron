import {
  App,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Typography,
  Space,
  Modal,
  Divider
} from 'antd'
import {
  SaveOutlined,
  PrinterOutlined,
  EditOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useState, useRef, useEffect } from 'react'
import { useReactToPrint } from 'react-to-print'
import { InformedConsentLetter } from './InformedConsentLetter'

const { Text, Paragraph } = Typography
const { TextArea } = Input

interface SignatureModalProps {
  title: string
  visible: boolean
  onClose: () => void
  onSave: (dataUrl: string) => void
}

const SignaturePadModal = ({ title, visible, onClose, onSave }: SignatureModalProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    if (visible && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
      }
    }
  }, [visible])

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true)
    draw(e)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    const ctx = canvasRef.current?.getContext('2d')
    ctx?.beginPath()
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    let x, y
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }

    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (canvas) {
      onSave(canvas.toDataURL())
      onClose()
    }
  }

  return (
    <Modal
      title={`Tanda Tangan: ${title}`}
      open={visible}
      onCancel={onClose}
      onOk={handleSave}
      okText="Simpan"
      cancelText="Batal"
      width={440}
    >
      <div className="border border-gray-300 rounded mb-2 bg-white">
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
          className="cursor-crosshair w-full"
        />
      </div>
      <Button size="small" onClick={clear}>
        Bersihkan
      </Button>
    </Modal>
  )
}

interface InformedConsentFormProps {
  encounterId: string
  patientData: any
}

export const InformedConsentForm = ({ encounterId, patientData }: InformedConsentFormProps) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [sigModal, setSigModal] = useState<{ visible: boolean; type: string; title: string }>({
    visible: false,
    type: '',
    title: ''
  })
  const [signatures, setSignatures] = useState<Record<string, string>>({})
  const [isPreviewVisible, setIsPreviewVisible] = useState(false)
  const [formDataForPrint, setFormDataForPrint] = useState<any>(null)

  const handleFinish = (values: any) => {
    const finalData = {
      ...values,
      signatures,
      encounterId
    }
    console.log('Informed Consent Saved:', finalData)
    message.success('Informed Consent berhasil disimpan')
  }

  const openSigModal = (type: string, title: string) => {
    setSigModal({ visible: true, type, title })
  }

  const saveSignature = (dataUrl: string) => {
    setSignatures((prev) => ({ ...prev, [sigModal.type]: dataUrl }))
  }

  const handlePreviewPrint = () => {
    const values = form.getFieldsValue()
    setFormDataForPrint(values)
    setIsPreviewVisible(true)
  }

  const printRef = useRef<HTMLDivElement>(null)
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Informed_Consent_${patientData?.patient?.name || ''}`
  })

  const renderInfoRow = (label: string, name: string, checkboxName: string) => (
    <div className="mb-4">
      <Row gutter={16}>
        <Col span={18}>
          <Form.Item label={label} name={name} className="mb-1">
            <TextArea rows={2} placeholder={`Penjelasan tentang ${label.toLowerCase()}...`} />
          </Form.Item>
        </Col>
        <Col span={6} className="pt-8 text-right">
          <Form.Item name={checkboxName} valuePropName="checked" className="mb-0">
            <Checkbox>Sudah Dijelaskan</Checkbox>
          </Form.Item>
        </Col>
      </Row>
      <Divider className="my-2" />
    </div>
  )

  const signatureBox = (type: string, label: string) => (
    <div className="flex flex-col items-center bg-gray-50 p-4 rounded border border-gray-200">
      <Text strong className="mb-2 uppercase text-xs tracking-wider text-gray-500">
        {label}
      </Text>
      <div className="border border-gray-300 w-full h-32 flex items-center justify-center mb-3 bg-white rounded shadow-inner overflow-hidden">
        {signatures[type] ? (
          <img src={signatures[type]} alt="Signature" className="max-h-full" />
        ) : (
          <Text type="secondary" className="text-xs italic">
            Tanda Tangan Kosong
          </Text>
        )}
      </div>
      <Button icon={<EditOutlined />} size="small" onClick={() => openSigModal(type, label)}>
        Tanda Tangan
      </Button>
    </div>
  )

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      className="flex flex-col gap-4"
      initialValues={{
        info_date: dayjs(),
        doctor_executor: patientData?.doctorName || '',
        info_provider: patientData?.doctorName || '',
        receiver_name: patientData?.patient?.name || '',
        receiver_birthdate: patientData?.patient?.birthDate
          ? dayjs(patientData.patient.birthDate)
          : undefined,
        receiver_address: patientData?.patient?.addressLine || '',
        consent_type: 'agree'
      }}
    >
      <Card title={<Text strong>Persetujuan Tindakan Kedokteran (Informed Consent)</Text>}>
        <Paragraph type="secondary" className="mb-0">
          Sesuai dengan PMK No. 290 Tahun 2008 dan Manual Persetujuan Tindakan Kedokteran.
        </Paragraph>
      </Card>

      <Card title="1. Pemberian Informasi" className="">
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item label="Tanggal & Jam" name="info_date" rules={[{ required: true }]}>
              <DatePicker showTime className="w-full" format="DD MMM YYYY HH:mm" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Dokter Pelaksana Tindakan"
              name="doctor_executor"
              rules={[{ required: true }]}
            >
              <Input placeholder="Nama dokter" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Pemberi Informasi" name="info_provider" rules={[{ required: true }]}>
              <Input placeholder="Nama pemberi informasi" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="2. Penerima Informasi / Wali" className="">
        <Row gutter={24}>
          <Col span={8}>
            <Form.Item label="Nama Penerima" name="receiver_name" rules={[{ required: true }]}>
              <Input placeholder="Nama pasien/wali" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Tanggal Lahir" name="receiver_birthdate">
              <DatePicker className="w-full" format="DD MMM YYYY" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Alamat" name="receiver_address">
              <Input placeholder="Alamat lengkap" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="3. Jenis Informasi (Materi Edukasi)" className="">
        {renderInfoRow('Diagnosis (WD & DD)', 'info_diagnosis', 'check_diagnosis')}
        {renderInfoRow('Dasar Diagnosis', 'info_basis', 'check_basis')}
        {renderInfoRow('Tindakan Kedokteran', 'info_procedure', 'check_procedure')}
        {renderInfoRow('Indikasi Tindakan', 'info_indication', 'check_indication')}
        {renderInfoRow('Tata Cara', 'info_method', 'check_method')}
        {renderInfoRow('Tujuan', 'info_objective', 'check_objective')}
        {renderInfoRow('Risiko', 'info_risk', 'check_risk')}
        {renderInfoRow('Komplikasi', 'info_complication', 'check_complication')}
        {renderInfoRow('Prognosis', 'info_prognosis', 'check_prognosis')}
        {renderInfoRow('Alternatif & Risiko', 'info_alternative', 'check_alternative')}
      </Card>

      <Card
        title="4. Pernyataan Persetujuan / Penolakan"
        className=""
        headStyle={{ background: '#f0f5ff' }}
      >
        <div className="mb-6">
          <Form.Item
            name="consent_type"
            label={<Text strong>Pernyataan Pasien / Keluarga</Text>}
            rules={[{ required: true }]}
          >
            <Select
              size="large"
              className="w-full"
              options={[
                { label: 'SAYA SETUJU (MENYETUJUI) Dilakukan Tindakan Tersebut', value: 'agree' },
                {
                  label: 'SAYA TIDAK SETUJU (MENOLAK) Dilakukan Tindakan Tersebut',
                  value: 'reject'
                }
              ]}
            />
          </Form.Item>
          <Paragraph className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
            Terhadap diri saya sendiri / Istri / Suami / Anak / Ayah / Ibu saya dengan Nama
            <Text strong className="mx-2 text-blue-600 underline">
              {patientData?.patient?.name || '..........'}
            </Text>
            , Lahir pada tanggal
            <Text strong className="mx-2 text-blue-600 underline">
              {patientData?.patient?.birthDate || '..........'}
            </Text>
          </Paragraph>
        </div>

        <Row gutter={24}>
          <Col span={12}>
            <Paragraph className="text-xs text-justify italic mb-4 text-gray-500">
              &quot;Dengan ini saya menyatakan bahwa saya telah memberikan informasi di atas secara
              jujur and lengkap kepada pasien/wali.&quot;
            </Paragraph>
            {signatureBox('doctor', 'Dokter Pelaksana')}
          </Col>
          <Col span={12}>
            <Paragraph className="text-xs text-justify italic mb-4 text-gray-500">
              &quot;Dengan ini saya menyatakan bahwa saya telah menerima informasi, memahami
              sepenuhnya, dan telah diberikan kesempatan bertanya.&quot;
            </Paragraph>
            {signatureBox('receiver', 'Pasien / Penerima Informasi')}
          </Col>
        </Row>
      </Card>

      <Card title="5. Saksi-Saksi" className="">
        <Row gutter={32}>
          <Col span={12}>
            <Form.Item label="Saksi 1 (Pihak Keluarga)" name="witness1_name">
              <Input placeholder="Nama lengkap saksi" className="mb-4" />
            </Form.Item>
            {signatureBox('witness1', 'Tanda Tangan Saksi 1')}
          </Col>
          <Col span={12}>
            <Form.Item label="Saksi 2 (Paramedis/Saksi RS)" name="witness2_name">
              <Input placeholder="Nama lengkap saksi" className="mb-4" />
            </Form.Item>
            {signatureBox('witness2', 'Tanda Tangan Saksi 2')}
          </Col>
        </Row>
      </Card>

      <div className="flex justify-end pt-4 pb-8">
        <Space size="middle">
          <Button
            size="large"
            icon={<PrinterOutlined />}
            onClick={handlePreviewPrint}
            className="px-8 h-12 rounded-lg"
          >
            Preview & Print
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            className="px-8 h-12 rounded-lg shadow-lg"
            onClick={() => form.submit()}
          >
            Simpan Final
          </Button>
        </Space>
      </div>

      <SignaturePadModal
        title={sigModal.title}
        visible={sigModal.visible}
        onClose={() => setSigModal({ ...sigModal, visible: false })}
        onSave={saveSignature}
      />

      <Modal
        title="Preview Cetak Informed Consent"
        open={isPreviewVisible}
        onCancel={() => setIsPreviewVisible(false)}
        width={900}
        centered
        footer={[
          <Button key="close" onClick={() => setIsPreviewVisible(false)}>
            Tutup
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            Cetak Sekarang
          </Button>
        ]}
        bodyStyle={{ padding: 0, background: '#f0f2f5', maxHeight: '80vh', overflow: 'auto' }}
      >
        <div className="p-8 flex justify-center bg-gray-200">
          <InformedConsentLetter
            ref={printRef}
            data={formDataForPrint}
            patientData={patientData}
            signatures={signatures}
          />
        </div>
      </Modal>
    </Form>
  )
}
