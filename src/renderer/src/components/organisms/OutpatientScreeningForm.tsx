import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  message
} from 'antd'
import { SaveOutlined } from '@ant-design/icons'

interface OutpatientScreeningFormProps {
  encounterId: string
  patientData?: any
}

export const OutpatientScreeningForm = ({ encounterId }: OutpatientScreeningFormProps) => {
  const [form] = Form.useForm()

  const handleFinish = (values: any) => {
    console.log('Outpatient Screening Data:', values)
    console.log('Encounter ID:', encounterId)
    message.success('Skrining Rawat Jalan berhasil disimpan')
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={{
        consciousness: 'Compos Mentis',
        breathing: 'Normal',
        get_up_go_1: 'Tidak',
        get_up_go_2: 'Tidak',
        fall_risk_action: 'Tidak Berisiko',
        pain_scale: 0,
        cough_screening: 'Tidak batuk',
        conclusion: 'Sesuai'
      }}
    >
      <Card title="Asesmen Awal Keperawatan Rawat Jalan" className="shadow-sm rounded-lg mb-4">
        {/* === 1. Status Fungsional === */}
        <div className="mb-6">
          <h3 className="text-blue-800 font-semibold mb-4 border-b pb-2">I. Status Fungsional</h3>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Penggunaan Alat Bantu" name="aids">
                <Select mode="multiple" placeholder="Pilih alat bantu jika ada">
                  <Select.Option value="Tidak Ada">Tidak Ada</Select.Option>
                  <Select.Option value="Tongkat">Tongkat</Select.Option>
                  <Select.Option value="Kursi Roda">Kursi Roda</Select.Option>
                  <Select.Option value="Walker">Walker</Select.Option>
                  <Select.Option value="Lainnya">Lainnya</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Cacat Tubuh" name="disability">
                <Select mode="multiple" placeholder="Pilih cacat tubuh jika ada">
                  <Select.Option value="Tidak Ada">Tidak Ada</Select.Option>
                  <Select.Option value="Tuna Netra">Tuna Netra</Select.Option>
                  <Select.Option value="Tuna Rungu">Tuna Rungu</Select.Option>
                  <Select.Option value="Tuna Wicara">Tuna Wicara</Select.Option>
                  <Select.Option value="Amputasi">Amputasi</Select.Option>
                  <Select.Option value="Lumpuh">Lumpuh</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Aktivitas Sehari-hari (ADL)" name="adl_status">
                <Radio.Group>
                  <Radio value="Mandiri">Mandiri</Radio>
                  <Radio value="Dibantu Sebagian">Dibantu Sebagian</Radio>
                  <Radio value="Dibantu Penuh">Dibantu Penuh</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* === 2. Riwayat Psiko-Sosial, Spiritual, Budaya === */}
        <div className="mb-6">
          <h3 className="text-blue-800 font-semibold mb-4 border-b pb-2">
            II. Riwayat Psiko-Sosial, Spiritual & Budaya
          </h3>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Status Psikologis" name="psychological_status">
                <Select placeholder="Pilih status">
                  <Select.Option value="Tenang">Tenang</Select.Option>
                  <Select.Option value="Cemas">Cemas</Select.Option>
                  <Select.Option value="Takut">Takut</Select.Option>
                  <Select.Option value="Marah">Marah</Select.Option>
                  <Select.Option value="Sedih">Sedih</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Hubungan dengan Keluarga" name="family_relation">
                <Select placeholder="Pilih hubungan">
                  <Select.Option value="Baik">Baik</Select.Option>
                  <Select.Option value="Kurang Baik">Kurang Baik</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tinggal Dengan" name="living_with">
                <Select placeholder="Pilih...">
                  <Select.Option value="Orang Tua">Orang Tua</Select.Option>
                  <Select.Option value="Suami/Istri">Suami/Istri</Select.Option>
                  <Select.Option value="Anak">Anak</Select.Option>
                  <Select.Option value="Sendiri">Sendiri</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Status Ekonomi" name="economic_status">
                <Select placeholder="Pilih...">
                  <Select.Option value="Baik">Baik</Select.Option>
                  <Select.Option value="Cukup">Cukup</Select.Option>
                  <Select.Option value="Kurang">Kurang</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Agama" name="religion">
                <Select placeholder="Pilih Agama">
                  <Select.Option value="Islam">Islam</Select.Option>
                  <Select.Option value="Kristen">Kristen</Select.Option>
                  <Select.Option value="Katolik">Katolik</Select.Option>
                  <Select.Option value="Hindu">Hindu</Select.Option>
                  <Select.Option value="Buddha">Buddha</Select.Option>
                  <Select.Option value="Konghucu">Konghucu</Select.Option>
                  <Select.Option value="Lainnya">Lainnya</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Kepercayaan/Budaya Khusus" name="culture_notes">
                <Input placeholder="Ada pantangan/kebiasaan khusus?" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Bahasa Sehari-hari" name="daily_language">
                <Input placeholder="Contoh: Indonesia, Jawa, dll" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* === 3. Pemeriksaan === */}
        <div className="mb-6">
          <h3 className="text-blue-800 font-semibold mb-4 border-b pb-2">
            III. Pemeriksaan & Skrining
          </h3>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Tingkat Kesadaran" name="consciousness">
                <Select>
                  <Select.Option value="Compos Mentis">Compos Mentis</Select.Option>
                  <Select.Option value="Apatis">Apatis</Select.Option>
                  <Select.Option value="Somnolen">Somnolen</Select.Option>
                  <Select.Option value="Sopor">Sopor</Select.Option>
                  <Select.Option value="Coma">Coma</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Pernapasan" name="breathing">
                <Radio.Group>
                  <Radio value="Normal">Normal</Radio>
                  <Radio value="Sesak">Sesak</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" style={{ borderColor: '#d9d9d9', color: '#1890ff' }}>
            Risiko Jatuh (Get Up and Go Test)
          </Divider>
          <Row gutter={24}>
            <Col span={24}>
              <p className="mb-2 text-gray-500 italic">
                Perhatikan cara berjalan pasien saat akan duduk di kursi. Apakah pasien tampak tidak
                seimbang (sempoyongan/limbung)?
              </p>
              <Form.Item name="get_up_go_1" noStyle>
                <Radio.Group className="mb-4">
                  <Radio value="Ya">a. Ya</Radio>
                  <Radio value="Tidak">b. Tidak</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={24}>
              <p className="mb-2 text-gray-500 italic">
                Apakah pasien memegang pinggiran kursi atau meja atau benda lain sebagai penopang
                saat akan duduk?
              </p>
              <Form.Item name="get_up_go_2" noStyle>
                <Radio.Group className="mb-4">
                  <Radio value="Ya">a. Ya</Radio>
                  <Radio value="Tidak">b. Tidak</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="Hasil Penilaian Risiko Jatuh (Kesimpulan)"
                name="fall_risk_conclusion"
              >
                <Select placeholder="Simpulan otomatis/manual">
                  <Select.Option value="Tidak Berisiko">Tidak Berisiko</Select.Option>
                  <Select.Option value="Risiko Rendah">Risiko Rendah</Select.Option>
                  <Select.Option value="Risiko Tinggi">Risiko Tinggi</Select.Option>
                </Select>
                <span className="text-xs text-gray-400">
                  Ket: Berisiko jika salah satu atau kedua jawaban di atas adalah &quot;Ya&quot;.
                </span>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" style={{ borderColor: '#d9d9d9', color: '#1890ff' }}>
            Skrining Nyeri
          </Divider>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item label="Nyeri Dada?" name="chest_pain">
                <Radio.Group>
                  <Radio value="Tidak">Tidak Ada</Radio>
                  <Radio value="Ada">Ada (Khas Kardiogenik)</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Skala Nyeri (0-10)" name="pain_scale">
                <InputNumber min={0} max={10} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Lokasi & Karakteristik Nyeri" name="pain_notes">
                <Input placeholder="Lokasi, durasi, frekuensi, sifat nyeri..." />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" style={{ borderColor: '#d9d9d9', color: '#1890ff' }}>
            Skrining Batuk
          </Divider>
          <Form.Item name="cough_screening">
            <Radio.Group>
              <Radio value="Tidak batuk">Tidak batuk</Radio>
              <Radio value="Batuk < 2 minggu">Batuk &lt; 2 minggu</Radio>
              <Radio value="Batuk > 2 minggu">Batuk &gt; 2 minggu (Curiga TB)</Radio>
            </Radio.Group>
          </Form.Item>
        </div>

        {/* === 4. Keputusan === */}
        <div className="mb-6">
          <h3 className="text-blue-800 font-semibold mb-4 border-b pb-2">IV. Keputusan</h3>
          <Form.Item label="Tindak Lanjut Keperawatan" name="conclusion">
            <Select>
              <Select.Option value="Sesuai">Sesuai (Lanjut Pemeriksaan Dokter)</Select.Option>
              <Select.Option value="Lapor Dokter">
                Lapor Dokter (Ada masalah prioritas/Emergency)
              </Select.Option>
              <Select.Option value="Edukasi">Perlu Edukasi Khusus</Select.Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large">
            Simpan Asesmen
          </Button>
        </Form.Item>
      </Card>
    </Form>
  )
}
