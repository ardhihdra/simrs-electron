import { ArrowLeftOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  message
} from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { SelectAsync } from '../../components/dynamic/SelectAsync'

const { TextArea } = Input

export default function ReferralRequestPage() {
  // const { id } = useParams()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  // Auto-calculate BMI
  const handleValuesChange = (_, allValues) => {
    const { height, weight } = allValues
    if (height && weight) {
      const heightInM = height / 100
      const bmi = (weight / (heightInM * heightInM)).toFixed(2)
      form.setFieldsValue({ bmi })
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()
      console.log('Form Values:', values)
      message.success('Referral request created (Dummy)')
      navigate('/dashboard/encounter')
    } catch (error) {
      console.error('Validation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      <Space className="mb-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <h1 className="text-xl font-bold m-0">Buat Surat Rujukan</h1>
      </Space>

      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        initialValues={{
          suhu: 36,
          sistole: 120,
          diastole: 80,
          respiratoryRate: 20,
          heartRate: 88,
          planDate: null
        }}
      >
        <div className="flex flex-col gap-4">
          <Card className="mb-4" title="Data Klinis">
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item label="Terapi Obat" name="drugTherapy">
                  <TextArea rows={2} placeholder="none" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Terapi Non Obat" name="nonDrugTherapy">
                  <TextArea rows={2} placeholder="rujuk" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="BMHP" name="bmhp">
                  <TextArea rows={2} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Diagnosa" name="diagnosis" rules={[{ required: true }]}>
                  <Select
                    placeholder="Cari diagnosa (Dummy)..."
                    className="w-full"
                    showSearch
                    options={[
                      { value: 'A01.0', label: 'A01.0 - Typhoid fever' },
                      {
                        value: 'A09',
                        label: 'A09 - Infectious gastroenteritis and colitis, unspecified'
                      },
                      { value: 'R50.9', label: 'R50.9 - Fever, unspecified' },
                      { value: 'J00', label: 'J00 - Acute nasopharyngitis [common cold]' },
                      { value: 'I10', label: 'I10 - Essential (primary) hypertension' },
                      {
                        value: 'E11.9',
                        label: 'E11.9 - Type 2 diabetes mellitus without complications'
                      }
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Kesadaran" name="consciousness">
                  <Select
                    options={[
                      { value: 'Compos Mentis', label: 'Compos Mentis' },
                      { value: 'Somnolen', label: 'Somnolen' },
                      { value: 'Sopor', label: 'Sopor' },
                      { value: 'Coma', label: 'Coma' }
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Suhu" name="suhu">
                  <InputNumber addonAfter="°C" className="w-full" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <Card className="mb-4" title="Pemeriksaan Fisik">
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="Tinggi Badan" name="height">
                  <InputNumber addonAfter="cm" className="w-full" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Berat Badan" name="weight">
                  <InputNumber addonAfter="kg" className="w-full" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Lingkar Perut" name="waistCircumference">
                  <InputNumber addonAfter="cm" className="w-full" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="IMT" name="bmi">
                  <InputNumber addonAfter="kg/m²" className="w-full" readOnly />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <Card className="mb-4" title="Tekanan Darah & Vital">
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item label="Sistole" name="sistole">
                  <InputNumber addonAfter="mmHg" className="w-full" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Diastole" name="diastole">
                  <InputNumber addonAfter="mmHg" className="w-full" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Respiratory Rate" name="respiratoryRate">
                  <InputNumber addonAfter="/ minute" className="w-full" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label="Heart Rate" name="heartRate">
                  <InputNumber addonAfter="bpm" className="w-full" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
          <Card className="mb-4" title="Rujukan">
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item label="Kasus KLL" name="accidentCase" valuePropName="checked">
                  {/* Checkbox implementation if needed, using simple boolean for now */}
                  <Input type="checkbox" className="w-4 h-4" />{' '}
                  <span className="ml-2">Kecelakaan Lalu Lintas</span>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Tenaga Medis" name="practitioner">
                  <SelectAsync
                    display="namaLengkap"
                    entity="kepegawaian"
                    output="id"
                    filters={{
                      hakAksesId: 'doctor'
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Pelayanan Non Kapitasi" name="nonCapitationService">
                  <Input placeholder="Pilih Tindakan Non Kapitasi" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Status Pulang" name="dischargeStatus">
                  <Select
                    options={[
                      { value: 'Rujuk', label: 'Rujuk' },
                      { value: 'Pulang', label: 'Pulang' }
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="PPK Rujukan" name="referralTarget">
                  <Select
                    showSearch
                    placeholder="Pilih RS Rujukan"
                    options={[
                      { value: 'RSUD DR SLAMET GARUT', label: 'RSUD DR SLAMET GARUT' },
                      { value: 'RSCM', label: 'RSCM' }
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Spesialis/Subspesialis" name="specialty">
                  <Input placeholder="Penyakit Dalam" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Tgl. Rencana Berkunjung" name="planDate">
                  <DatePicker className="w-full" format="DD-MM-YYYY" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Catatan" name="notes">
                  <TextArea rows={2} placeholder="-" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </div>

        <Row justify="end">
          <Space>
            <Button onClick={() => navigate(-1)}>Batal</Button>
            <Button type="primary" onClick={handleSubmit} loading={loading}>
              Simpan & Cetak
            </Button>
          </Space>
        </Row>
      </Form>
    </div>
  )
}
