import {
  Button,
  DatePicker,
  Input,
  Select,
  Card,
  theme,
  Table,
  Spin,
  Dropdown,
  Modal,
  message
} from 'antd'
import type { MenuProps } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { PegawaiCategoryOptions } from '@shared/kepegawaian'

import type { ColumnsType } from 'antd/es/table'
import {
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
  MoreOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useKepegawaianList, useDeletePegawai, PegawaiRow } from '@renderer/hooks/use-kepegawaian'

type Row = PegawaiRow & {
  no: number
  kategori?: string | null
  idSatuSehat?: string | null
  bagianSpesialis?: string | null
  tanggalMulaiTugas?: string | null
}

const baseColumns: ColumnsType<Row> = [
  { title: 'No.', dataIndex: 'no', key: 'no', width: 60, align: 'center' },
  { title: 'Kategori', dataIndex: 'kategori', key: 'kategori', width: 120 },
  { title: 'Nama', dataIndex: 'namaLengkap', key: 'namaLengkap', width: 200 },
  { title: 'NIK', dataIndex: 'nik', key: 'nik', width: 160 },
  { title: 'Id Satu Sehat', dataIndex: 'idSatuSehat', key: 'idSatuSehat', width: 160 },
  { title: 'Bagian / Spesialis', dataIndex: 'bagianSpesialis', key: 'bagianSpesialis', width: 160 },
  { title: 'Alamat', dataIndex: 'alamat', key: 'alamat', width: 250 },
  {
    title: 'Tanggal Mulai Tugas',
    dataIndex: 'tanggalMulaiTugas',
    key: 'tanggalMulaiTugas',
    width: 180,
    render: (v?: string | null) => (v ? dayjs(v).format('DD MMMM YYYY') : '-')
  },
  {
    title: 'Nomor Telepon',
    dataIndex: 'nomorTelepon',
    key: 'nomorTelepon',
    width: 150
  },
  {
    title: 'Hak Akses',
    dataIndex: 'hakAksesId',
    key: 'hakAksesId',
    width: 120
  }
]

function RowActions({ record }: { record: PegawaiRow }) {
  const navigate = useNavigate()
  const deleteMutation = useDeletePegawai()

  const items: MenuProps['items'] = [
    {
      key: 'view',
      label: 'Lihat Detail',
      icon: <EyeOutlined />,
      onClick: () => {
        if (typeof record.id === 'number') navigate(`/dashboard/pegawai/edit/${record.id}`)
      }
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => {
        if (typeof record.id === 'number') navigate(`/dashboard/pegawai/edit/${record.id}`)
      }
    },
    { type: 'divider' },
    {
      key: 'delete',
      danger: true,
      label: 'Hapus',
      icon: <DeleteOutlined />,
      onClick: () => {
        if (typeof record.id === 'number') {
          Modal.confirm({
            title: 'Hapus Pegawai',
            content: 'Apakah Anda yakin ingin menghapus data pegawai ini?',
            okText: 'Ya, Hapus',
            okType: 'danger',
            cancelText: 'Batal',
            onOk: () => {
              deleteMutation.mutate(record.id as number, {
                onSuccess: () => message.success('Pegawai berhasil dihapus'),
                onError: (e) => message.error(`Gagal menghapus: ${e.message}`)
              })
            }
          })
        }
      }
    }
  ]

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <button
        type="button"
        aria-label="Actions"
        className="p-1 rounded bg-transparent border-none cursor-pointer text-gray-700 hover:bg-gray-100"
      >
        <MoreOutlined />
      </button>
    </Dropdown>
  )
}

function PegawaiTable() {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const [searchNama, setSearchNama] = useState('')
  const [searchNik, setSearchNik] = useState('')
  const [searchIdSehat, setSearchIdSehat] = useState('')
  const [searchBagian, setSearchBagian] = useState('')
  const [searchAlamat, setSearchAlamat] = useState('')
  const [kategori, setKategori] = useState<string | undefined>(undefined)
  const [mulaiTugas, setMulaiTugas] = useState<string | null>(null)

  const {
    data: filtered = [],
    refetch,
    isLoading
  } = useKepegawaianList({
    searchNama,
    searchNik,
    searchIdSehat,
    searchBagian,
    searchAlamat,
    kategori,
    mulaiTugas
  })

  // Provide numbers to base on returned hooks
  const dataSource = filtered.map((row, index) => ({
    ...row,
    no: index + 1
  })) as Row[]

  const tableColumns = [
    ...baseColumns,
    {
      title: 'Aksi',
      key: 'action',
      width: 120,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_, record: Row) => <RowActions record={record} />
    }
  ]

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* 1. Header Card */}
      <Card
        styles={{ body: { padding: '20px 24px' } }}
        variant="borderless"
        style={{
          background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`
        }}
      >
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                  <TeamOutlined
                    className="text-base"
                    style={{ color: token.colorSuccessBg, fontSize: 16 }}
                  />
                </div>
                <h1 className="text-xl font-bold text-white m-0 leading-tight">
                  Data Petugas Medis
                </h1>
              </div>
              <p className="text-sm text-blue-200 m-0 ml-12">
                Manajemen data kepegawaian staf dan tenaga medis
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#fff'
                }}
                ghost
              >
                Refresh
              </Button>
              <Button
                type="default"
                onClick={async () => {
                  try {
                    const res = await window.api.query.export.exportCsv({
                      entity: 'kepegawaian',
                      usePagination: false
                    })
                    if (
                      res &&
                      typeof res === 'object' &&
                      'success' in res &&
                      res.success &&
                      'url' in res &&
                      res.url
                    ) {
                      window.open(res.url as string, '_blank')
                    }
                  } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : String(e)
                    console.error(msg)
                  }
                }}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#fff'
                }}
              >
                Export CSV
              </Button>
              <Button
                icon={<PlusOutlined />}
                onClick={() => navigate('/dashboard/pegawai/create')}
                style={{
                  background: '#fff',
                  borderColor: '#fff',
                  color: token.colorPrimaryActive
                }}
              >
                Tambah Petugas
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,255,255,0.10)' }}
              >
                <TeamOutlined style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {filtered.length}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                  Total Pegawai
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Search Filter Card */}
      <Card styles={{ body: { padding: '16px 20px' } }} variant="borderless">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: token.colorTextTertiary,
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Kategori
            </div>
            <Select
              allowClear
              placeholder="SEMUA KATEGORI"
              value={kategori}
              onChange={(v) => setKategori(v)}
              options={PegawaiCategoryOptions}
              className="w-full"
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: token.colorTextTertiary,
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Pencarian Nama
            </div>
            <Input
              placeholder="Ketik nama"
              value={searchNama}
              onChange={(e) => setSearchNama(e.target.value)}
              prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
              allowClear
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: token.colorTextTertiary,
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Pencarian NIK
            </div>
            <Input
              placeholder="Ketik NIK"
              value={searchNik}
              onChange={(e) => setSearchNik(e.target.value)}
              allowClear
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: token.colorTextTertiary,
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              ID SatuSehat
            </div>
            <Input
              placeholder="Ketik ID"
              value={searchIdSehat}
              onChange={(e) => setSearchIdSehat(e.target.value)}
              allowClear
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: token.colorTextTertiary,
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Bagian / Spesialis
            </div>
            <Input
              placeholder="Ketik bagian"
              value={searchBagian}
              onChange={(e) => setSearchBagian(e.target.value)}
              allowClear
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: token.colorTextTertiary,
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Pencarian Alamat
            </div>
            <Input
              placeholder="Ketik alamat"
              value={searchAlamat}
              onChange={(e) => setSearchAlamat(e.target.value)}
              allowClear
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: token.colorTextTertiary,
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Mulai Tugas
            </div>
            <DatePicker
              placeholder="Pilih tanggal"
              value={mulaiTugas ? dayjs(mulaiTugas) : null}
              onChange={(d) => setMulaiTugas(d ? d.toISOString() : null)}
              className="w-full"
            />
          </div>
        </div>
      </Card>

      {/* 3. Main Data Table Card */}
      <Card className="flex-1 overflow-hidden flex flex-col" variant="borderless">
        <Spin spinning={isLoading}>
          <div className="flex-1" style={{ background: token.colorBgContainer }}>
            <Table
              columns={tableColumns}
              dataSource={dataSource}
              rowKey={(r) => String(r.id ?? `${r.nik}-${r.idSatuSehat}`)}
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Total ${total} pegawai`,
                showSizeChanger: true
              }}
              scroll={{ x: 1500, y: 'calc(100vh - 460px)' }}
              className="flex-1 h-full"
              size="middle"
            />
          </div>
        </Spin>
      </Card>
    </div>
  )
}

export default PegawaiTable
