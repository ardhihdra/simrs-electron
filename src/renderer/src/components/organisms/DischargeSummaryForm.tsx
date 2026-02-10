import { Button, Card, Col, DatePicker, Form, Input, Row, Select, message } from 'antd'
import { SaveOutlined, PrinterOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { TextArea } = Input

interface DischargeSummaryFormProps {
  encounterId: string
  patientData: any
}

export const DischargeSummaryForm = ({ encounterId, patientData }: DischargeSummaryFormProps) => {
  const [form] = Form.useForm()

  const handleFinish = (values: any) => {
    console.log('Discharge Summary Data:', values)
    console.log('Encounter ID:', encounterId)
    message.success('Resume Medis berhasil disimpan')
  }

  return (
    <Card
      title="Resume Medis Pulang (Discharge Summary)"
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
          discharge_date: dayjs(),
          doctor_name: patientData?.doctorName || '',
          patient_name: patientData?.patient?.name || '',
          admission_date: patientData?.registrationDate
            ? dayjs(patientData.registrationDate)
            : dayjs()
        }}
      >
        <div className="mb-6 border-b pb-4">
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item label="Tanggal Masuk" name="admission_date">
                <DatePicker className="w-full" format="DD MMM YYYY" disabled />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Tanggal Keluar" name="discharge_date">
                <DatePicker className="w-full" format="DD MMM YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Dokter Penanggung Jawab" name="doctor_name">
                <Input readOnly className="bg-gray-50" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <div className="mb-6 border-b pb-4">
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                label="Diagnosis Akhir (Utama)"
                name="final_diagnosis_primary"
                rules={[{ required: true, message: 'Wajib diisi' }]}
              >
                <Input placeholder="Diagnosis utama saat pulang" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Diagnosis Sekunder / Komplikasi" name="final_diagnosis_secondary">
                <TextArea rows={2} placeholder="Diagnosis tambahan atau komplikasi" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Ringkasan Riwayat Penyakit" name="history_summary">
                <TextArea rows={3} placeholder="Ringkasan anamnesis dan perjalanan penyakit" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Ringkasan Pemeriksaan Fisik" name="physical_summary">
                <TextArea rows={3} placeholder="Temuan penting pemeriksaan fisik" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="Pemeriksaan Penunjang (Lab/Rad/Lainnya)"
                name="investigation_summary"
              >
                <TextArea rows={3} placeholder="Hasil penting pemeriksaan penunjang" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Terapi / Tindakan Selama Rawat" name="treatment_summary">
                <TextArea rows={3} placeholder="Obat-obatan dan tindakan yang telah diberikan" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <div className="mb-6">
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Kondisi Saat Pulang"
                name="discharge_condition"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { label: 'Sembuh', value: 'Sembuh' },
                    { label: 'Membaik', value: 'Membaik' },
                    { label: 'Belum Sembuh', value: 'Belum Sembuh' },
                    { label: 'Meninggal < 48 jam', value: 'Meninggal < 48 jam' },
                    { label: 'Meninggal > 48 jam', value: 'Meninggal > 48 jam' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Cara Pulang" name="discharge_method" rules={[{ required: true }]}>
                <Select
                  options={[
                    { label: 'Atas Persetujuan Dokter', value: 'Atas Persetujuan Dokter' },
                    { label: 'Atas Permintaan Sendiri (APS)', value: 'APS' },
                    { label: 'Rujuk', value: 'Rujuk' },
                    { label: 'Meninggal', value: 'Meninggal' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Instruksi Tindak Lanjut / Kontrol" name="follow_up_instruction">
                <TextArea rows={2} placeholder="Jadwal kontrol dan instruksi khusus" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Obat Pulang" name="discharge_medication">
                <TextArea rows={3} placeholder="Daftar obat yang dibawa pulang" />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </Form>
    </Card>
  )
}
