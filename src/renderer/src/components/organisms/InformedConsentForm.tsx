import {
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
  message
} from 'antd'
import { SaveOutlined, PrinterOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title } = Typography
const { TextArea } = Input

interface InformedConsentFormProps {
  encounterId: string
  patientData: any
}

export const InformedConsentForm = ({ encounterId, patientData }: InformedConsentFormProps) => {
  const [form] = Form.useForm()

  const handleFinish = (values: any) => {
    console.log('Informed Consent Data:', values)
    console.log('Encounter ID:', encounterId)
    message.success('Informed Consent berhasil disimpan')
  }

  return (
    <Card
      title="Persetujuan Tindakan Kedokteran (Informed Consent)"
      className="shadow-sm rounded-lg"
      extra={
        <div className="flex gap-2">
          <Button icon={<PrinterOutlined />}>Cetak</Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()}>
            Simpan
          </Button>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          date: dayjs(),
          doctor_name: patientData?.doctorName || '',
          patient_name: patientData?.patient?.name || '',
          approver_name: patientData?.patient?.name || '', // Default to patient
          approver_relation: 'Diri Sendiri'
        }}
      >
        <div className="mb-6 border-b pb-4">
          <Title level={5} className="mb-4 text-blue-800">
            A. Pemberi & Penerima Informasi
          </Title>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Dokter Pelaksana Tindakan" name="doctor_name">
                <Input readOnly className="bg-gray-50" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Penerima Informasi" name="receiver_name">
                <Input placeholder="Nama penerima informasi" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <div className="mb-6 border-b pb-4">
          <Title level={5} className="mb-4 text-blue-800">
            B. Informasi Kesehatan
          </Title>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                label="Diagnosis (WD & DD)"
                name="diagnosis_info"
                rules={[{ required: true, message: 'Wajib diisi' }]}
              >
                <TextArea rows={2} placeholder="Diagnosis kerja dan banding" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="Dasar Diagnosis"
                name="diagnosis_basis"
                rules={[{ required: true, message: 'Wajib diisi' }]}
              >
                <TextArea rows={2} placeholder="Anamnesis, Pemeriksaan Fisik, Penunjang" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="Tindakan Kedokteran"
                name="procedure_name"
                rules={[{ required: true, message: 'Wajib diisi' }]}
              >
                <Input placeholder="Nama tindakan yang akan dilakukan" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Indikasi Tindakan" name="indication">
                <TextArea rows={2} placeholder="Tujuan dan indikasi tindakan" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tata Cara" name="procedure_method">
                <TextArea rows={2} placeholder="Uraian singkat tata cara" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Risiko & Komplikasi" name="risks">
                <TextArea rows={2} placeholder="Risiko yang mungkin terjadi" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Prognosis" name="prognosis">
                <TextArea rows={2} placeholder="Prognosis tindakan" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Alternatif & Risiko" name="alternatives">
                <TextArea rows={2} placeholder="Alternatif tindakan dan risikonya" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="info_confirmation"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(new Error('Harus menyatakan sudah menerima informasi'))
              }
            ]}
          >
            <Checkbox>
              Saya menyatakan bahwa saya telah menerima informasi di atas dan telah memahaminya.
            </Checkbox>
          </Form.Item>
        </div>

        <div className="mb-6">
          <Title level={5} className="mb-4 text-blue-800">
            C. Pernyataan Persetujuan / Penolakan
          </Title>
          <Row gutter={24}>
            <Col span={24} className="mb-4">
              <Form.Item
                name="consent_type"
                label="Jenis Pernyataan"
                rules={[{ required: true }]}
                initialValue="consent"
              >
                <Select
                  options={[
                    { label: 'PERSETUJUAN (Saya SETUJU)', value: 'consent' },
                    { label: 'PENOLAKAN (Saya MENOLAK)', value: 'refusal' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Yang Membuat Pernyataan (Nama)" name="approver_name">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Hubungan dengan Pasien" name="approver_relation">
                <Select
                  options={[
                    { label: 'Diri Sendiri', value: 'Diri Sendiri' },
                    { label: 'Suami', value: 'Suami' },
                    { label: 'Istri', value: 'Istri' },
                    { label: 'Ayah', value: 'Ayah' },
                    { label: 'Ibu', value: 'Ibu' },
                    { label: 'Anak', value: 'Anak' },
                    { label: 'Wali', value: 'Wali' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tanggal & Jam" name="date">
                <DatePicker showTime className="w-full" format="DD MMM YYYY HH:mm" />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </Form>
    </Card>
  )
}
