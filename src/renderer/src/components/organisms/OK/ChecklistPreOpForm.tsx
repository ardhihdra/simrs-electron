import {
  Form,
  Card,
  Checkbox,
  Input,
  Button,
  Row,
  Col,
  Typography,
  Tag,
  Alert,
  Radio,
  FormInstance
} from 'antd'
import { SaveOutlined } from '@ant-design/icons'

const CHECKLIST_PREOP = [
  {
    kategori: 'Identitas & Administrasi',
    items: [
      'Gelang identitas terpasang dan sesuai',
      'Surat persetujuan operasi (Informed Consent) sudah ditandatangani',
      'Surat persetujuan anestesi sudah ditandatangani',
      'Berkas rekam medis lengkap tersedia',
      'Formulir penandaan area operasi sudah diisi'
    ]
  },
  {
    kategori: 'Persiapan Fisik Pasien',
    items: [
      'Pasien sudah berpuasa minimal 6 jam',
      'Pasien sudah mandi dan bersih',
      'Perhiasan, gigi palsu, kacamata sudah dilepas',
      'Area operasi sudah dicukur (bila diperlukan)',
      'Kulit area operasi sudah dibersihkan / persiapan antiseptik'
    ]
  },
  {
    kategori: 'Obat-Obatan & Laboratorium',
    items: [
      'Hasil laboratorium pre-op tersedia dan dalam batas normal',
      'Hasil foto thorax tersedia (bila diperlukan)',
      'EKG pre-op tersedia (bila diperlukan)',
      'Pemberian antibiotik profilaksis sudah tercatat',
      'Pre-medikasi sudah diberikan sesuai instruksi anestesi'
    ]
  },
  {
    kategori: 'Penandaan & Kondisi Khusus',
    items: [
      'Site marking (penandaan area operasi) sudah dilakukan oleh dokter operator',
      'Kondisi alergi sudah diverifikasi dan tercatat',
      'Infus line terpasang dengan baik',
      'Kondisi pasien stabil untuk menjalani operasi'
    ]
  }
]

interface ChecklistPreOpFormProps {
  standalone?: boolean
  externalForm?: FormInstance
}

export const ChecklistPreOpForm = ({
  standalone = true,
  externalForm
}: ChecklistPreOpFormProps) => {
  const [internalForm] = Form.useForm()
  const form = externalForm || internalForm

  const content = (
    <div className="flex flex-col gap-4">
      {CHECKLIST_PREOP.map((group) => (
        <Card
          key={group.kategori}
          size="small"
          title={<span className="font-semibold text-gray-700">{group.kategori}</span>}
          className="shadow-none border-gray-100"
        >
          <Form.Item name={`checklist_${group.kategori}`} noStyle>
            <Checkbox.Group className="w-full">
              <div className="space-y-3 w-full py-2">
                {group.items.map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <Checkbox value={item} className="mt-0.5" />
                    <span className="text-sm text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
            </Checkbox.Group>
          </Form.Item>
        </Card>
      ))}

      <Card
        size="small"
        title={<span className="font-semibold text-gray-700">Penilaian Pre-Operasi oleh DPJP</span>}
        className="shadow-none border-gray-100"
      >
        <Row gutter={[16, 16]} className="py-2">
          <Col xs={24} md={12}>
            <Form.Item name="statusFisikASA" label="Klasifikasi Status Fisik ASA">
              <Radio.Group>
                {['I', 'II', 'III', 'IV', 'V'].map((asa) => (
                  <Radio.Button key={asa} value={asa}>
                    ASA {asa}
                  </Radio.Button>
                ))}
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="risikoOperasi" label="Risiko Operasi">
              <Radio.Group>
                <Radio value="rendah">
                  <Tag color="green">Rendah</Tag>
                </Radio>
                <Radio value="sedang">
                  <Tag color="orange">Sedang</Tag>
                </Radio>
                <Radio value="tinggi">
                  <Tag color="red">Tinggi</Tag>
                </Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="catatanDPJP" label="Catatan DPJP / Instruksi Khusus">
              <Input.TextArea
                rows={3}
                placeholder="Tuliskan catatan atau instruksi khusus dari DPJP..."
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Penilaian Pre-Anestesi */}
      <Card
        size="small"
        title={<span className="font-semibold text-gray-700">Penilaian Pre-Anestesi</span>}
        className="shadow-none border-gray-100"
      >
        <Row gutter={[16, 16]} className="py-2">
          <Col xs={24} md={12}>
            <Form.Item name="jenisAnestesi" label="Rencana Jenis Anestesi">
              <Radio.Group className="flex flex-wrap gap-2">
                <Radio value="general">Anestesi Umum (GA)</Radio>
                <Radio value="regional">Regional (Spinal/Epidural)</Radio>
                <Radio value="lokal">Anestesi Lokal</Radio>
                <Radio value="kombinasi">Kombinasi</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="mallampati" label="Mallampati Score">
              <Radio.Group>
                {['I', 'II', 'III', 'IV'].map((m) => (
                  <Radio.Button key={m} value={m}>
                    Kelas {m}
                  </Radio.Button>
                ))}
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="catatanAnestesi" label="Catatan Anestesiologi">
              <Input.TextArea rows={3} placeholder="Catatan risiko dan rencana anestesi..." />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </div>
  )

  return (
    <div className="space-y-4">
      <Alert
        type="info"
        showIcon
        message="Semua item wajib dicentang sebelum pasien dapat masuk ruang operasi. Checklist ini dilengkapi oleh perawat kamar operasi."
        className="mb-2"
      />

      {standalone ? (
        <Form form={form} layout="vertical">
          {content}
          <div className="flex justify-end gap-2 mt-6">
            <Button size="large">Reset</Button>
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              style={{ background: '#3b82f6', border: 'none' }}
              htmlType="submit"
            >
              Simpan Checklist Pre-Op
            </Button>
          </div>
        </Form>
      ) : (
        <div className="mt-2">{content}</div>
      )}
    </div>
  )
}
