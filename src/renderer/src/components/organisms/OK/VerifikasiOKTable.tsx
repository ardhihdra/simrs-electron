import {
  Alert,
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
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ReloadOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography

export type VerifikasiOkStatus =
  | 'menunggu'
  | 'diproses'
  | 'disetujui'
  | 'selesai'
  | 'ditolak'
  | 'dibatalkan'
export type VerifikasiOkSifat = 'cyto' | 'segera' | 'efektif'

export interface VerifikasiOkRow {
  id: number | string
  nomorAntrian: string
  namaPasien: string
  noRM: string
  tindakan: string
  spesialis: string
  kelas: string
  sifat: VerifikasiOkSifat
  tanggalRencana: string
  jamRencana: string
  dokterOperator: string
  ruangOK: string
  status: VerifikasiOkStatus
}

interface VerifikasiOKTableProps {
  rows: VerifikasiOkRow[]
  loading?: boolean
  errorMessage?: string | null
  onRetry?: () => void
}

const STATUS_MAP: Record<
  VerifikasiOkStatus,
  {
    label: string
    badge: 'success' | 'processing' | 'error' | 'warning'
    textColor?: string
  }
> = {
  menunggu: { label: 'Menunggu Verifikasi', badge: 'processing', textColor: '#d97706' },
  diproses: { label: 'Sedang Diproses', badge: 'warning', textColor: '#2563eb' },
  disetujui: { label: 'Disetujui', badge: 'success' },
  ditolak: { label: 'Ditolak', badge: 'error' },
  // conflict here
  selesai: { label: 'Selesai Operasi', textColor: 'green', badge: 'success' },
  dibatalkan: { label: 'Dibatalkan', textColor: 'red', badge: 'error' }
}

const SIFAT_MAP: Record<VerifikasiOkSifat, { color: string; label: string }> = {
  cyto: { color: 'red', label: 'CYTO' },
  segera: { color: 'orange', label: 'SEGERA' },
  efektif: { color: 'green', label: 'EFEKTIF' }
}

export const VerifikasiOKTable = ({
  rows,
  loading = false,
  errorMessage,
  onRetry
}: VerifikasiOKTableProps) => {
  const navigate = useNavigate()

  const columns: ColumnsType<VerifikasiOkRow> = [
    {
      title: 'No. Antrian',
      dataIndex: 'nomorAntrian',
      key: 'nomorAntrian',
      render: (v: string) => <Tag color="geekblue">{v}</Tag>
    },
    {
      title: 'Pasien',
      key: 'pasien',
      render: (_, row) => (
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
      render: (_, row) => (
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
      render: (v: VerifikasiOkSifat) => <Tag color={SIFAT_MAP[v].color}>{SIFAT_MAP[v].label}</Tag>
    },
    {
      title: 'Rencana Operasi',
      key: 'rencana',
      render: (_, row) => (
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
      render: (v: VerifikasiOkStatus) => (
        <Badge
          status={STATUS_MAP[v].badge}
          text={<span style={{ color: STATUS_MAP[v].textColor }}>{STATUS_MAP[v].label}</span>}
        />
      )
    },
    {
      title: 'Aksi',
      key: 'aksi',
      render: (_, row) => (
        <Space>
          <Tooltip title="Lihat Detail & BHP">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                navigate(`/dashboard/ok/verifikasi/${row.id}`)
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
            Verifikasi Pengajuan OK - Antrian Admin
          </Title>
          <Text type="secondary" className="text-xs">
            Daftar pengajuan tindakan operasi yang masuk
          </Text>
        </div>
      </div>

      {errorMessage && (
        <Alert
          type="error"
          showIcon
          className="mb-4"
          message={errorMessage}
          action={
            onRetry ? (
              <Button size="small" icon={<ReloadOutlined />} onClick={onRetry}>
                Muat Ulang
              </Button>
            ) : null
          }
        />
      )}

      <Row gutter={16} className="mb-4">
        <Col xs={8}>
          <Card size="small">
            <Statistic
              title="Total Pengajuan"
              value={rows.length}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic
              title="Menunggu Verifikasi"
              value={rows.filter((p) => p.status === 'menunggu').length}
              valueStyle={{ color: '#d97706' }}
            />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic
              title="Disetujui"
              value={rows.filter((p) => p.status === 'disetujui').length}
              valueStyle={{ color: '#16a34a' }}
            />
          </Card>
        </Col>
      </Row>

      <Table
        dataSource={rows}
        columns={columns}
        rowKey="id"
        size="small"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  )
}
