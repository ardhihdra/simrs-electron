import {
  Form,
  Card,
  Select,
  DatePicker,
  TimePicker,
  Button,
  Row,
  Col,
  Typography,
  Tag,
  Divider,
  Statistic,
  Alert
} from 'antd'
import {
  CalendarOutlined,
  DollarOutlined,
  UserOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography

const RUANG_OPERASI = [
  { label: 'Kamar OK 1 — Bedah Umum', value: 'OK1' },
  { label: 'Kamar OK 2 — Ortopedi', value: 'OK2' },
  { label: 'Kamar OK 3 — Obsgyn', value: 'OK3' },
  { label: 'Kamar OK Cyto', value: 'OK_CYTO' }
]

const TARIF_SIMULASI = {
  OK1: { VIP: 8500000, KELAS_1: 6000000, KELAS_2: 4500000, KELAS_3: 3000000, BPJS: 2500000 },
  OK2: { VIP: 10000000, KELAS_1: 7500000, KELAS_2: 5500000, KELAS_3: 4000000, BPJS: 3000000 },
  OK3: { VIP: 9000000, KELAS_1: 6500000, KELAS_2: 5000000, KELAS_3: 3500000, BPJS: 2800000 },
  OK_CYTO: { VIP: 12000000, KELAS_1: 9000000, KELAS_2: 7000000, KELAS_3: 5000000, BPJS: 4000000 }
}

interface DetailPengajuanFormProps {
  encounterId: string
  patientData: any
}

export const DetailPengajuanForm = ({ encounterId, patientData }: DetailPengajuanFormProps) => {
  const [form] = Form.useForm()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg"
          style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
        >
          <CalendarOutlined className="text-white text-lg" />
        </div>
        <div>
          <Title level={4} className="mb-0">
            Detail Pengajuan OK — Jadwal & Tim Operasi
          </Title>
          <Text type="secondary" className="text-xs">
            Encounter ID: {encounterId}
          </Text>
        </div>
      </div>

      <Form form={form} layout="vertical">
        {/* Ruang Operasi */}
        <Card
          size="small"
          title={
            <span>
              <EnvironmentOutlined className="mr-2 text-blue-500" />
              Ruang Operasi
            </span>
          }
          className="mb-4"
        >
          <Form.Item
            name="ruangOperasi"
            label="Pilih Ruang Operasi"
            rules={[{ required: true, message: 'Ruang operasi wajib dipilih' }]}
          >
            <Select
              placeholder="Pilih ruang operasi yang tersedia"
              options={RUANG_OPERASI}
              size="large"
            />
          </Form.Item>
        </Card>

        {/* Perujuk & Rujukan */}
        <Card
          size="small"
          title={
            <span>
              <UserOutlined className="mr-2 text-green-500" />
              Data Perujuk
            </span>
          }
          className="mb-4"
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="perujuk"
                label="Nama Perujuk / Dokter DPJP"
                rules={[{ required: true, message: 'Nama perujuk wajib diisi' }]}
              >
                <Select
                  placeholder="Cari dokter perujuk..."
                  options={[
                    { label: 'dr. Ahmad Fadillah, Sp.B', value: 'dr_ahmad' },
                    { label: 'dr. Budi Santoso, Sp.OT', value: 'dr_budi' },
                    { label: 'dr. Citra Dewi, Sp.OG', value: 'dr_citra' }
                  ]}
                  showSearch
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="tanggalRujukan"
                label="Tanggal Rujukan"
                rules={[{ required: true }]}
              >
                <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Jadwal Operasi */}
        <Card
          size="small"
          title={
            <span>
              <ClockCircleOutlined className="mr-2 text-purple-500" />
              Rencana Tanggal & Jam Operasi
            </span>
          }
          className="mb-4"
        >
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="tanggalRencana"
                label="Tanggal Rencana Operasi"
                rules={[{ required: true }]}
              >
                <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="jamMulai"
                label="Jam Mulai"
                rules={[{ required: true }]}
              >
                <TimePicker className="w-full" format="HH:mm" minuteStep={15} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="jamSelesai"
                label="Estimasi Jam Selesai"
                rules={[{ required: true }]}
              >
                <TimePicker className="w-full" format="HH:mm" minuteStep={15} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Dokter Operator */}
        <Card
          size="small"
          title={
            <span>
              <UserOutlined className="mr-2 text-red-500" />
              Dokter Operator
            </span>
          }
          className="mb-4"
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="dokterOperator"
                label="Dokter Operator Utama"
                rules={[{ required: true, message: 'Dokter operator wajib dipilih' }]}
              >
                <Select
                  placeholder="Pilih dokter operator"
                  options={[
                    { label: 'dr. Ahmad Fadillah, Sp.B', value: 'dr_ahmad' },
                    { label: 'dr. Budi Santoso, Sp.OT', value: 'dr_budi' },
                    { label: 'dr. Citra Dewi, Sp.OG', value: 'dr_citra' }
                  ]}
                  showSearch
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="dokterAnestesi" label="Dokter Anestesiologi">
                <Select
                  placeholder="Pilih dokter anestesi"
                  options={[
                    { label: 'dr. Eko Prasetyo, Sp.An', value: 'dr_eko' },
                    { label: 'dr. Fitri Handayani, Sp.An', value: 'dr_fitri' }
                  ]}
                  showSearch
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Informasi Tarif */}
        <Card
          size="small"
          title={
            <span>
              <DollarOutlined className="mr-2 text-yellow-500" />
              Estimasi Tarif (Otomatis dari Master Harga)
            </span>
          }
          className="mb-4"
          style={{ background: '#fffbeb', borderColor: '#fcd34d' }}
        >
          <Alert
            type="warning"
            showIcon
            message="Tarif di bawah ini adalah estimasi berdasarkan tindakan dan kelas layanan yang dipilih. Tarif final akan dikonfirmasi setelah verifikasi Admin OK."
            className="mb-4 text-xs"
          />
          <Row gutter={16}>
            <Col xs={12} md={6}>
              <Statistic
                title="Jasa Operator"
                value={2500000}
                prefix="Rp"
                valueStyle={{ fontSize: 14 }}
                formatter={(v) => Number(v).toLocaleString('id-ID')}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="Jasa Anestesi"
                value={1500000}
                prefix="Rp"
                valueStyle={{ fontSize: 14 }}
                formatter={(v) => Number(v).toLocaleString('id-ID')}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title="Jasa RS / Fasilitas"
                value={1000000}
                prefix="Rp"
                valueStyle={{ fontSize: 14 }}
                formatter={(v) => Number(v).toLocaleString('id-ID')}
              />
            </Col>
            <Col xs={12} md={6}>
              <Statistic
                title={<span className="font-bold">Total Estimasi</span>}
                value={5000000}
                prefix="Rp"
                valueStyle={{ fontSize: 14, color: '#d97706', fontWeight: 'bold' }}
                formatter={(v) => Number(v).toLocaleString('id-ID')}
              />
            </Col>
          </Row>
          <Divider className="my-3" />
          <Text type="secondary" className="text-xs">
            BHP (Bahan Habis Pakai) akan dihitung terpisah setelah operasi selesai berdasarkan pemakaian aktual.
          </Text>
        </Card>

        <div className="flex justify-end gap-2">
          <Button>Kembali</Button>
          <Button type="primary" htmlType="submit" icon={<CalendarOutlined />}>
            Simpan Detail Pengajuan
          </Button>
        </div>
      </Form>
    </div>
  )
}
