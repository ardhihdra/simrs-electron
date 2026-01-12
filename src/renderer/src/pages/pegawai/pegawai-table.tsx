import { Button, DatePicker, Input, Select } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { PegawaiCategoryOptions } from '@shared/kepegawaian'

import type { ColumnsType } from 'antd/es/table'
import GenericTable from '@renderer/components/GenericTable'
import { EditOutlined, EyeOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
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
  { title: 'No.', dataIndex: 'no', key: 'no', width: 60 },
  { title: 'Kategori', dataIndex: 'kategori', key: 'kategori' },
  { title: 'Nama', dataIndex: 'namaLengkap', key: 'namaLengkap' },
  { title: 'NIK', dataIndex: 'nik', key: 'nik' },
  { title: 'Id Satu Sehat', dataIndex: 'idSatuSehat', key: 'idSatuSehat' },
  { title: 'Bagian / Spesialis', dataIndex: 'bagianSpesialis', key: 'bagianSpesialis' },
  { title: 'Alamat', dataIndex: 'alamat', key: 'alamat' },
  {
    title: 'Tanggal Mulai Tugas',
    dataIndex: 'tanggalMulaiTugas',
    key: 'tanggalMulaiTugas',
    render: (v?: string | null) => (v ? dayjs(v).format('DD MMMM YYYY') : '-')
  },
  {
    title: 'Nomor Telepon',
    dataIndex: 'nomorTelepon',
    key: 'nomorTelepon'
  },
  {
    title: 'Hak Akses',
    dataIndex: 'hakAksesId',
    key: 'hakAksesId',
  },
]

function RowActions({ record }: { record: PegawaiRow }) {
  const navigate = useNavigate()
  const deleteMutation = useDeletePegawai()
  return (
    <div className="flex gap-2">
      <EyeOutlined onClick={() => { if (typeof record.id === 'number') navigate(`/dashboard/pegawai/edit/${record.id}`) }} />
      <EditOutlined onClick={() => { if (typeof record.id === 'number') navigate(`/dashboard/pegawai/edit/${record.id}`) }} />
      <DeleteOutlined onClick={() => { if (typeof record.id === 'number') deleteMutation.mutate(record.id) }} />
    </div>
  )
}

function PegawaiTable() {
  const navigate = useNavigate()
  const [searchNama, setSearchNama] = useState('')
  const [searchNik, setSearchNik] = useState('')
  const [searchIdSehat, setSearchIdSehat] = useState('')
  const [searchBagian, setSearchBagian] = useState('')
  const [searchAlamat, setSearchAlamat] = useState('')
  const [kategori, setKategori] = useState<string | undefined>(undefined)
  const [mulaiTugas, setMulaiTugas] = useState<string | null>(null)
  const { data: filtered = [], refetch } = useKepegawaianList({
    searchNama,
    searchNik,
    searchIdSehat,
    searchBagian,
    searchAlamat,
    kategori,
    mulaiTugas
  })

  return (
    <div>
      <h2 className="text-4xl font-bold mb-4 justify-center flex">Data Petugas Medis</h2>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/dashboard/pegawai/create')}>Tambah</Button>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Refresh</Button>
        <Button
          onClick={async () => {
            try {
              const res = await window.api.query.export.exportCsv({
                entity: 'kepegawaian',
                usePagination: false
              })
              if (res && typeof res === 'object' && 'success' in res && res.success && 'url' in res && res.url) {
                window.open(res.url as string, '_blank')
              }
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : String(e)
              console.error(msg)
            }
          }}
        >Export CSV</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-3 mb-3">
        <Select
          allowClear
          placeholder="SEMUA KATEGORI"
          value={kategori}
          onChange={(v) => setKategori(v)}
          options={PegawaiCategoryOptions}
        />
        <Input placeholder="Nama" value={searchNama} onChange={(e) => setSearchNama(e.target.value)} />
        <Input placeholder="NIK" value={searchNik} onChange={(e) => setSearchNik(e.target.value)} />
        <Input placeholder="Id Satu Sehat" value={searchIdSehat} onChange={(e) => setSearchIdSehat(e.target.value)} />
        <Input placeholder="Bagian/Spesialis" value={searchBagian} onChange={(e) => setSearchBagian(e.target.value)} />
        <Input placeholder="Alamat" value={searchAlamat} onChange={(e) => setSearchAlamat(e.target.value)} />
        <DatePicker
          placeholder="Tanggal Mulai Tugas"
          value={mulaiTugas ? dayjs(mulaiTugas) : null}
          onChange={(d) => setMulaiTugas(d ? d.toISOString() : null)}
          className="w-full"
        />
      </div>
      <div className="">
        <GenericTable<Row>
          rowKey={(r) => String(r.id ?? `${r.nik}-${r.email}`)}
          dataSource={filtered}
          columns={baseColumns}
          action={{
            title: 'Action',
            width: 100,
            align: 'center',
            fixedRight: true,
            render: (record) => <RowActions record={record} />
          }}
        />
      </div>
    </div>
  )
}

export default PegawaiTable
