import { Button, Table, Tag, Tooltip, Typography, theme } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'

const { Text } = Typography

export type VerifikasiOkStatus = 'menunggu' | 'diproses' | 'disetujui' | 'ditolak'
export type VerifikasiOkSifat = 'cyto' | 'segera' | 'efektif'

export interface VerifikasiOkRow {
  id: number | string
  nomorAntrian: string
  namaPasien: string
  noRM: string
  kelas: string
  sifat: VerifikasiOkSifat
  tanggalRencana: string
  jamRencana: string
  dpjp: string
  ruangOK: string
  status: VerifikasiOkStatus
}

interface VerifikasiOKTableProps {
  rows: VerifikasiOkRow[]
  loading?: boolean
}

const STATUS_MAP: Record<VerifikasiOkStatus, { label: string; color: string }> = {
  menunggu: { label: 'Menunggu Verifikasi', color: 'orange' },
  diproses: { label: 'Sedang Diproses', color: 'blue' },
  disetujui: { label: 'Disetujui', color: 'green' },
  ditolak: { label: 'Ditolak', color: 'red' }
}

const SIFAT_MAP: Record<VerifikasiOkSifat, { color: string; label: string }> = {
  cyto: { color: 'red', label: 'CYTO' },
  segera: { color: 'orange', label: 'SEGERA' },
  efektif: { color: 'green', label: 'EFEKTIF' }
}

export const VerifikasiOKTable = ({ rows, loading = false }: VerifikasiOKTableProps) => {
  const navigate = useNavigate()
  const { token } = theme.useToken()

  const columns: ColumnsType<VerifikasiOkRow> = [
    {
      title: '#',
      key: 'no',
      width: 44,
      align: 'center',
      render: (_, __, index) => (
        <span style={{ fontSize: 12, fontWeight: 500, color: token.colorTextTertiary }}>
          {index + 1}
        </span>
      )
    },
    {
      title: 'No. Antrian',
      dataIndex: 'nomorAntrian',
      key: 'nomorAntrian',
      width: 170,
      render: (value: string) => (
        <span
          className="font-mono rounded-md"
          style={{
            fontSize: 11,
            color: token.colorPrimaryText,
            background: token.colorPrimaryBg,
            border: `1px solid ${token.colorPrimaryBorder}`,
            padding: '3px 8px'
          }}
        >
          {value || '-'}
        </span>
      )
    },
    {
      title: 'Pasien',
      key: 'pasien',
      width: 260,
      render: (_, row) => (
        <div className="flex items-center gap-3 py-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: token.colorPrimaryBg,
              border: `1px solid ${token.colorPrimaryBorder}`
            }}
          >
            <span style={{ color: token.colorPrimary, fontSize: 12, fontWeight: 700 }}>
              {String(row.namaPasien || '?').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <div
              style={{ fontWeight: 600, fontSize: 14, color: token.colorText }}
              className="truncate leading-tight"
            >
              {row.namaPasien || '-'}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="font-mono rounded"
                style={{
                  fontSize: 10,
                  color: token.colorTextTertiary,
                  background: token.colorFillAlter,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  padding: '1px 6px'
                }}
              >
                {row.noRM || '-'}
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Kelas',
      dataIndex: 'kelas',
      key: 'kelas',
      width: 130,
      render: (value: string) => (
        <Tag bordered={false} className="rounded-md font-medium text-[11px]">
          {value || '-'}
        </Tag>
      )
    },
    {
      title: 'Sifat',
      dataIndex: 'sifat',
      key: 'sifat',
      width: 120,
      render: (value: VerifikasiOkSifat) => (
        <Tag color={SIFAT_MAP[value].color} bordered={false} className="rounded-md font-medium text-[11px]">
          {SIFAT_MAP[value].label}
        </Tag>
      )
    },
    {
      title: 'Rencana Operasi',
      key: 'rencana',
      width: 180,
      render: (_, row) => (
        <div>
          <div style={{ fontSize: 14, color: token.colorText, fontWeight: 500 }}>
            {row.tanggalRencana}
          </div>
          <Text type="secondary" className="text-xs">
            {row.jamRencana}
          </Text>
        </div>
      )
    },
    {
      title: 'Ruang OK',
      dataIndex: 'ruangOK',
      key: 'ruangOK',
      width: 180,
      render: (value: string) => (
        <span style={{ fontSize: 13, color: token.colorText, fontWeight: 500 }}>{value || '-'}</span>
      )
    },
    {
      title: 'DPJP',
      dataIndex: 'dpjp',
      key: 'dpjp',
      width: 200,
      render: (value: string) => (
        <span
          style={{ fontSize: 13, color: token.colorText, fontWeight: 500 }}
          className="truncate"
          title={value || '-'}
        >
          {value || '-'}
        </span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 170,
      render: (value: VerifikasiOkStatus) => (
        <Tag
          color={STATUS_MAP[value].color}
          bordered={false}
          className="rounded-md font-medium text-[11px]"
          style={{ margin: 0 }}
        >
          {STATUS_MAP[value].label}
        </Tag>
      )
    },
    {
      title: 'Aksi',
      key: 'aksi',
      width: 120,
      align: 'center',
      fixed: 'right',
      render: (_, row) => (
        <Tooltip title="Lihat Detail Verifikasi">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              navigate(`/dashboard/ok/verifikasi/${row.id}`)
            }}
            style={{
              borderColor: token.colorBorderSecondary,
              color: token.colorText
            }}
          >
            Detail
          </Button>
        </Tooltip>
      )
    }
  ]

  return (
    <Table
      dataSource={rows}
      columns={columns}
      rowKey="id"
      size="middle"
      loading={loading}
      scroll={{ x: 1250, y: 'calc(100vh - 460px)' }}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} pengajuan`
      }}
    />
  )
}
