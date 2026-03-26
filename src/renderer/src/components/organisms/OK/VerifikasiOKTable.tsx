import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  Typography,
  Badge,
  Tooltip,
  Row,
  Col,
  Statistic
} from 'antd'
import { useNavigate } from 'react-router'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography

const MOCK_PENGAJUAN = [
  {
    id: '1',
    nomorAntrian: 'OK-2026-001',
    namaPasien: 'Budi Santoso',
    noRM: '2024-00012',
    tindakan: 'Appendektomi',
    spesialis: 'Bedah Umum',
    kelas: 'Kelas II',
    sifat: 'cyto',
    tanggalRencana: '2026-03-28',
    jamRencana: '08:00 — 10:00',
    dokterOperator: 'dr. Ahmad Fadillah, Sp.B',
    ruangOK: 'Kamar OK 1',
    status: 'menunggu',
    bhp: [
      { nama: 'Sarung Tangan Steril', qty: 4, satuan: 'pasang', harga: 15000 },
      { nama: 'Benang Absorbable 3-0', qty: 2, satuan: 'box', harga: 45000 },
      { nama: 'Kasa Steril', qty: 10, satuan: 'lembar', harga: 3000 }
    ]
  },
  {
    id: '2',
    nomorAntrian: 'OK-2026-002',
    namaPasien: 'Siti Rahayu',
    noRM: '2024-00034',
    tindakan: 'Sectio Caesarea (SC)',
    spesialis: 'Obstetri & Ginekologi',
    kelas: 'VIP',
    sifat: 'segera',
    tanggalRencana: '2026-03-29',
    jamRencana: '10:00 — 12:00',
    dokterOperator: 'dr. Citra Dewi, Sp.OG',
    ruangOK: 'Kamar OK 3',
    status: 'menunggu',
    bhp: [
      { nama: 'Sarung Tangan Steril', qty: 6, satuan: 'pasang', harga: 15000 },
      { nama: 'Benang Absorbable 1-0', qty: 3, satuan: 'box', harga: 60000 },
      { nama: 'Spuit 20cc', qty: 5, satuan: 'pcs', harga: 8000 }
    ]
  },
  {
    id: '3',
    nomorAntrian: 'OK-2026-003',
    namaPasien: 'Ahmad Fauzi',
    noRM: '2023-00098',
    tindakan: 'ORIF Fraktur Femur',
    spesialis: 'Ortopedi',
    kelas: 'Kelas I',
    sifat: 'efektif',
    tanggalRencana: '2026-03-30',
    jamRencana: '13:00 — 16:00',
    dokterOperator: 'dr. Budi Santoso, Sp.OT',
    ruangOK: 'Kamar OK 2',
    status: 'disetujui',
    bhp: [
      { nama: 'Plate & Screw Set', qty: 1, satuan: 'set', harga: 2500000 },
      { nama: 'Sarung Tangan Steril', qty: 8, satuan: 'pasang', harga: 15000 },
      { nama: 'Benang Non-Absorbable 2-0', qty: 2, satuan: 'box', harga: 55000 }
    ]
  }
]

const STATUS_MAP = {
  menunggu: { color: 'orange', label: 'Menunggu Verifikasi', icon: <ClockCircleOutlined /> },
  disetujui: { color: 'green', label: 'Disetujui', icon: <CheckCircleOutlined /> },
  ditolak: { color: 'red', label: 'Ditolak', icon: <CloseCircleOutlined /> }
}

const SIFAT_MAP = {
  cyto: { color: 'red', label: 'CYTO' },
  segera: { color: 'orange', label: 'SEGERA' },
  efektif: { color: 'green', label: 'EFEKTIF' }
}

export const VerifikasiOKTable = () => {
  const navigate = useNavigate()

  const columns = [
    {
      title: 'No. Antrian',
      dataIndex: 'nomorAntrian',
      key: 'nomorAntrian',
      render: (v: string) => <Tag color="geekblue">{v}</Tag>
    },
    {
      title: 'Pasien',
      key: 'pasien',
      render: (_: any, row: any) => (
        <div>
          <div className="font-semibold">{row.namaPasien}</div>
          <Text type="secondary" className="text-xs">
            {row.noRM}
          </Text>
        </div>
      )
    },
    {
      title: 'Tindakan',
      key: 'tindakan',
      render: (_: any, row: any) => (
        <div>
          <div>{row.tindakan}</div>
          <Tag className="text-xs">{row.spesialis}</Tag>
        </div>
      )
    },
    {
      title: 'Kelas',
      dataIndex: 'kelas',
      key: 'kelas',
      render: (v: string) => <Tag>{v}</Tag>
    },
    {
      title: 'Sifat',
      dataIndex: 'sifat',
      key: 'sifat',
      render: (v: keyof typeof SIFAT_MAP) => (
        <Tag color={SIFAT_MAP[v]?.color}>{SIFAT_MAP[v]?.label}</Tag>
      )
    },
    {
      title: 'Rencana Operasi',
      key: 'rencana',
      render: (_: any, row: any) => (
        <div>
          <div>{row.tanggalRencana}</div>
          <Text type="secondary" className="text-xs">
            {row.jamRencana}
          </Text>
        </div>
      )
    },
    {
      title: 'Ruang OK',
      dataIndex: 'ruangOK',
      key: 'ruangOK'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v: keyof typeof STATUS_MAP) => (
        <Badge
          status={v === 'disetujui' ? 'success' : v === 'ditolak' ? 'error' : 'processing'}
          text={
            <span style={{ color: v === 'menunggu' ? '#d97706' : undefined }}>
              {STATUS_MAP[v]?.label}
            </span>
          }
        />
      )
    },
    {
      title: 'Aksi',
      key: 'aksi',
      render: (_: any, row: any) => (
        <Space>
          <Tooltip title="Lihat Detail & BHP">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                navigate(`/dashboard/ok/verifikasi/${row.nomorAntrian}`)
              }}
            >
              Detail
            </Button>
          </Tooltip>
          {row.status === 'menunggu' && (
            <>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />}>
                Approve
              </Button>
              <Button size="small" danger icon={<CloseCircleOutlined />}>
                Tolak
              </Button>
            </>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg"
          style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}
        >
          <CheckCircleOutlined className="text-white text-lg" />
        </div>
        <div>
          <Title level={4} className="mb-0">
            Verifikasi Pengajuan OK — Antrian Admin
          </Title>
          <Text type="secondary" className="text-xs">
            Daftar pengajuan tindakan operasi yang masuk
          </Text>
        </div>
      </div>

      <Row gutter={16} className="mb-4">
        <Col xs={8}>
          <Card size="small">
            <Statistic
              title="Total Pengajuan"
              value={MOCK_PENGAJUAN.length}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic
              title="Menunggu Verifikasi"
              value={MOCK_PENGAJUAN.filter((p) => p.status === 'menunggu').length}
              valueStyle={{ color: '#d97706' }}
            />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic
              title="Disetujui"
              value={MOCK_PENGAJUAN.filter((p) => p.status === 'disetujui').length}
              valueStyle={{ color: '#16a34a' }}
            />
          </Card>
        </Col>
      </Row>

      <Table
        dataSource={MOCK_PENGAJUAN}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 10 }}
      />
    </div>
  )
}
