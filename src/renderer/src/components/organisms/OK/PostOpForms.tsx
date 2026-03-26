import {
  Form,
  Card,
  Checkbox,
  Input,
  Select,
  Button,
  Row,
  Col,
  Tag,
  Alert,
  Tabs,
  Slider,
  Statistic,
  Table,
  Typography,
  FormInstance
} from 'antd'
import { DollarOutlined, SaveOutlined } from '@ant-design/icons'

const { Text } = Typography

interface PostOpFormProps {
  standalone?: boolean
  externalForm?: FormInstance
}

// ─── Checklist Post-Op ─────────────────────────────────────────
const CHECKLIST_POSTOP = [
  {
    kategori: 'Kondisi Pasien',
    items: [
      'Airway paten dan aman',
      'Pernapasan adekuat (SpO2 > 95%)',
      'Sirkulasi stabil (TD, nadi dalam batas normal)',
      'Tingkat kesadaran sesuai ekspektasi pasca anestesi',
      'Tidak ada tanda perdarahan aktif'
    ]
  },
  {
    kategori: 'Luka Operasi',
    items: [
      'Balutan luka dalam kondisi baik, tidak basah berlebihan',
      'Drain (jika ada) berfungsi dan tercatat output-nya',
      'Tidak ada tanda infeksi dini (kemerahan berlebihan, panas)'
    ]
  },
  {
    kategori: 'Administrasi Keluar OK',
    items: [
      'Laporan anestesi sudah dilengkapi',
      'Form sign-out WHO sudah ditandatangani',
      'Instruksi post-op dari operator sudah tertulis',
      'Pasien sudah diidentifikasi ulang sebelum transfer'
    ]
  }
]

export const ChecklistPostOpForm = ({ standalone = true, externalForm }: PostOpFormProps) => {
  const [internalForm] = Form.useForm()
  const form = externalForm || internalForm

  const content = (
    <div className="space-y-4">
      {CHECKLIST_POSTOP.map((group) => (
        <Card key={group.kategori} size="small" title={group.kategori}>
          <Form.Item name={`postop_${group.kategori}`} noStyle>
            <Checkbox.Group className="w-full">
              <div className="space-y-2 w-full py-2">
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

      <Card size="small" title="Monitoring Tanda Vital Keluar OK">
        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Form.Item name="tekananDarahSistol" label="TD Sistol">
              <Input type="number" suffix="mmHg" />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="tekananDarahDiastol" label="TD Diastol">
              <Input type="number" suffix="mmHg" />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="nadiPostOp" label="Nadi">
              <Input type="number" suffix="x/mnt" />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="spo2PostOp" label="SpO2">
              <Input type="number" suffix="%" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="skorNyeri" label="Skala Nyeri (0-10)">
              <Slider min={0} max={10} marks={{ 0: '0', 3: '3', 7: '7', 10: '10' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="transferKe" label="Pasien Ditransfer ke">
              <Select
                placeholder="Tujuan transfer"
                options={[
                  { label: 'Ruang Pulih Sadar (Recovery Room)', value: 'RPS' },
                  { label: 'ICU', value: 'ICU' },
                  { label: 'Langsung ke Ruang Rawat Inap', value: 'RANAP' }
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="instruksiPostOp" label="Instruksi Post-Op">
              <Input.TextArea
                rows={3}
                placeholder="Instruksi dari dokter operator untuk perawatan pasca operasi..."
              />
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
        message="Checklist ini dilengkapi oleh perawat OK sebelum pasien ditransfer ke Ruang Pulih Sadar (RPS) atau ke ruang rawat."
        className="mb-2"
      />
      {standalone ? (
        <Form form={form} layout="vertical">
          {content}
          <div className="flex justify-end gap-2 mt-4">
            <Button size="large">Reset</Button>
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              style={{ background: '#3b82f6', border: 'none' }}
            >
              Selesai — Transfer Pasien
            </Button>
          </div>
        </Form>
      ) : (
        <div className="mt-2">{content}</div>
      )}
    </div>
  )
}

// ─── Administrasi OK ─────────────────────────────────────────
export const AdministrasiOKForm = () => {
  const tabItems = [
    {
      key: 'lab',
      label: 'Permintaan Lab',
      children: (
        <Form layout="vertical">
          <Alert
            type="info"
            showIcon
            message="Permintaan lab post-operasi dikirim ke laboratorium."
            className="mb-4"
          />
          <Form.Item name="pemeriksaanLab" label="Pilih Pemeriksaan">
            <Checkbox.Group className="w-full">
              <div className="space-y-2 py-2">
                {[
                  'Darah Lengkap Post-Op',
                  'Elektrolit Darah',
                  'Fungsi Hemostasis (PT/APTT)',
                  'Kultur Spesimen Intraop',
                  'Analisa Gas Darah (AGD)',
                  'Patologi Anatomi (Spesimen Operasi)'
                ].map((item) => (
                  <div key={item}>
                    <Checkbox value={item}>{item}</Checkbox>
                  </div>
                ))}
              </div>
            </Checkbox.Group>
          </Form.Item>
          <Form.Item name="catatanLab" label="Catatan untuk Laboratorium">
            <Input.TextArea rows={2} />
          </Form.Item>
          <div className="flex justify-end">
            <Button type="primary">Kirim Permintaan Lab</Button>
          </div>
        </Form>
      )
    },
    {
      key: 'resep',
      label: 'Resep Obat',
      children: (
        <Form layout="vertical">
          <Alert
            type="info"
            showIcon
            message="Resep post-operasi (analgetik, antibiotik lanjutan, dll)."
            className="mb-4"
          />
          <Form.Item name="obatPostOp" label="Obat-Obatan Post-Op">
            <Checkbox.Group className="w-full">
              <div className="space-y-2 py-2">
                {[
                  'Ketorolac 30mg IV — Analgetik',
                  'Tramadol 100mg IV — Analgetik',
                  'Ceftriaxone 1gr IV — Antibiotik',
                  'Ranitidine 50mg IV — PPI',
                  'Ondansetron 4mg IV — Antiemetik'
                ].map((item) => (
                  <div key={item}>
                    <Checkbox value={item}>{item}</Checkbox>
                  </div>
                ))}
              </div>
            </Checkbox.Group>
          </Form.Item>
          <Form.Item name="catatanResep" label="Catatan Resep Tambahan">
            <Input.TextArea rows={2} />
          </Form.Item>
          <div className="flex justify-end">
            <Button type="primary">Kirim ke Farmasi</Button>
          </div>
        </Form>
      )
    },
    {
      key: 'transfer',
      label: 'Transfer Pasien',
      children: (
        <Form layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="tujuanTransfer" label="Tujuan Transfer">
                <Select
                  placeholder="Pilih tujuan"
                  options={[
                    { label: 'ICU', value: 'ICU' },
                    { label: 'Ruang Rawat Inap', value: 'RANAP' },
                    { label: 'Ruang Bersalin', value: 'VK' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="ruangTujuan" label="Ruang / Kamar Tujuan">
                <Input placeholder="Contoh: Dahlia 302" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="kondisiTransfer" label="Kondisi Saat Transfer">
                <Input.TextArea rows={2} placeholder="Kondisi umum pasien saat ditransfer..." />
              </Form.Item>
            </Col>
          </Row>
          <div className="flex justify-end">
            <Button type="primary">Buat Surat Transfer</Button>
          </div>
        </Form>
      )
    }
  ]
  return (
    <div className="space-y-4">
      <Alert
        type="info"
        showIcon
        message="Permintaan laboratorium, resep post-op, dan dokumentasi transfer pasien."
        className="mb-2"
      />
      <Tabs items={tabItems} size="small" />
    </div>
  )
}

// ─── Tagihan OK ───────────────────────────────────────────────
const MOCK_TAGIHAN = [
  {
    kategori: 'Jasa Operator',
    nama: 'dr. Ahmad Fadillah, Sp.B',
    jumlah: 1,
    satuan: 'tindakan',
    harga: 2500000
  },
  {
    kategori: 'Jasa Anestesi',
    nama: 'dr. Eko Prasetyo, Sp.An',
    jumlah: 1,
    satuan: 'tindakan',
    harga: 1500000
  },
  { kategori: 'Jasa RS', nama: 'Fasilitas Kamar OK 1', jumlah: 1, satuan: 'paket', harga: 1000000 },
  { kategori: 'BHP', nama: 'Sarung Tangan Steril', jumlah: 6, satuan: 'pasang', harga: 15000 },
  { kategori: 'BHP', nama: 'Benang Absorbable 3-0', jumlah: 2, satuan: 'box', harga: 45000 },
  { kategori: 'BHP', nama: 'Kasa Steril', jumlah: 10, satuan: 'lembar', harga: 3000 },
  { kategori: 'BHP', nama: 'Spuit 10cc', jumlah: 5, satuan: 'pcs', harga: 5000 }
]

export const TagihanOKView = () => {
  const total = MOCK_TAGIHAN.reduce((sum, r) => sum + r.jumlah * r.harga, 0)
  const jasaTotal = MOCK_TAGIHAN.filter((r) => r.kategori !== 'BHP').reduce(
    (sum, r) => sum + r.jumlah * r.harga,
    0
  )
  const bhpTotal = MOCK_TAGIHAN.filter((r) => r.kategori === 'BHP').reduce(
    (sum, r) => sum + r.jumlah * r.harga,
    0
  )

  return (
    <div className="space-y-4">
      <Alert
        type="success"
        showIcon
        message="Tagihan terkelola otomatis berdasarkan master paket tindakan dan pemakaian BHP."
        className="mb-2"
      />
      <Row gutter={16} className="mb-4">
        <Col xs={8}>
          <Card size="small">
            <Statistic
              title="Total Jasa"
              value={jasaTotal}
              prefix="Rp"
              formatter={(v) => Number(v).toLocaleString('id-ID')}
              valueStyle={{ color: '#3b82f6', fontSize: 14 }}
            />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic
              title="Total BHP"
              value={bhpTotal}
              prefix="Rp"
              formatter={(v) => Number(v).toLocaleString('id-ID')}
              valueStyle={{ color: '#d97706', fontSize: 14 }}
            />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic
              title="Grand Total"
              value={total}
              prefix="Rp"
              formatter={(v) => Number(v).toLocaleString('id-ID')}
              valueStyle={{ color: '#16a34a', fontWeight: 'bold', fontSize: 14 }}
            />
          </Card>
        </Col>
      </Row>

      <Table
        dataSource={MOCK_TAGIHAN}
        rowKey={(r) => `${r.kategori}-${r.nama}`}
        size="small"
        pagination={false}
        columns={[
          {
            title: 'Kategori',
            dataIndex: 'kategori',
            key: 'kategori',
            render: (v: string) => <Tag color={v === 'BHP' ? 'orange' : 'blue'}>{v}</Tag>
          },
          { title: 'Keterangan', dataIndex: 'nama', key: 'nama' },
          { title: 'Qty', dataIndex: 'jumlah', key: 'jumlah', align: 'right' as const },
          { title: 'Satuan', dataIndex: 'satuan', key: 'satuan' },
          {
            title: 'Harga/Unit',
            dataIndex: 'harga',
            key: 'harga',
            align: 'right' as const,
            render: (v: number) => `Rp ${v.toLocaleString('id-ID')}`
          },
          {
            title: 'Subtotal',
            key: 'sub',
            align: 'right' as const,
            render: (_: any, r: any) => (
              <Text strong>Rp {(r.jumlah * r.harga).toLocaleString('id-ID')}</Text>
            )
          }
        ]}
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={5}>
              <Text strong>Grand Total</Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={1} align="right">
              <Text strong style={{ color: '#16a34a' }}>
                Rp {total.toLocaleString('id-ID')}
              </Text>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />

      <Alert
        type="success"
        showIcon
        message="Tagihan ini sudah diverifikasi oleh Admin OK. Klik tombol di bawah untuk menerbitkan tagihan ke sistem billing."
        className="mt-4"
      />
      <div className="flex justify-end gap-2">
        <Button size="large">Cetak Rincian</Button>
        <Button type="primary" size="large" icon={<DollarOutlined />} style={{ background: '#10b981', border: 'none' }}>
          Terbitkan Tagihan
        </Button>
      </div>
    </div>
  )
}
