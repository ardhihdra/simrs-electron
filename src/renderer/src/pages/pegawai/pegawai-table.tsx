import { Button, DatePicker, Input, Select, Table } from 'antd'
import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { queryClient } from '@renderer/query-client'
import type { KepegawaianAttributes } from '@shared/kepegawaian'
import type { ColumnsType } from 'antd/es/table'
import { EditOutlined, EyeOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

type Row = KepegawaianAttributes & {
  no: number
  kategori?: string | null
  idSatuSehat?: string | null
  bagianSpesialis?: string | null
  tanggalMulaiTugas?: string | null
}

const columns: ColumnsType<Row> = [
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
    title: 'Action',
    key: 'action',
    width: 100,
    render: (_: Row, record: Row) => <RowActions record={record} />
  },
]

function RowActions({ record }: { record: Row }) {
  const navigate = useNavigate()
  const deleteMutation = useMutation({
    mutationKey: ['pegawai', 'delete'],
    mutationFn: (id: number) => {
      const fn = window.api?.query?.pegawai?.deleteById
      if (!fn) throw new Error('API pegawai tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn({ id })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pegawai', 'list'] })
    }
  })
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
  const { data, refetch } = useQuery({
    queryKey: ['pegawai', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.pegawai?.list
      if (!fn) throw new Error('API pegawai tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn()
    }
  })

  const filtered = useMemo(() => {
    const source: KepegawaianAttributes[] = (data?.data as KepegawaianAttributes[]) || []
    const rows: Row[] = source.map((p, idx) => {
      const kontrak = Array.isArray(p.kontrakPegawai) ? p.kontrakPegawai[0] : undefined
      return {
        ...p,
        no: idx + 1,
        kategori: p.hakAkses ?? null,
        idSatuSehat: p.idSatuSehat ?? null,
        bagianSpesialis: kontrak?.kodeJabatan || kontrak?.kodeDepartemen || null,
        tanggalMulaiTugas: kontrak?.tanggalMulaiKontrak ? String(kontrak.tanggalMulaiKontrak) : null
      }
    })
    return rows.filter((r) => {
      const matchKategori = kategori ? String(r.kategori || '').toLowerCase() === kategori.toLowerCase() : true
      const matchNama = searchNama ? String(r.namaLengkap || '').toLowerCase().includes(searchNama.toLowerCase()) : true
      const matchNik = searchNik ? String(r.nik || '').toLowerCase().includes(searchNik.toLowerCase()) : true
      const matchIdSehat = searchIdSehat ? String(r.idSatuSehat || '').toLowerCase().includes(searchIdSehat.toLowerCase()) : true
      const matchBagian = searchBagian ? String(r.bagianSpesialis || '').toLowerCase().includes(searchBagian.toLowerCase()) : true
      const matchAlamat = searchAlamat ? String(r.alamat || '').toLowerCase().includes(searchAlamat.toLowerCase()) : true
      const matchMulai = mulaiTugas ? dayjs(r.tanggalMulaiTugas).isSame(dayjs(mulaiTugas), 'day') : true
      return matchKategori && matchNama && matchNik && matchIdSehat && matchBagian && matchAlamat && matchMulai
    })
  }, [data?.data, kategori, searchNama, searchNik, searchIdSehat, searchBagian, searchAlamat, mulaiTugas])

  return (
    <div>
      <h2 className="text-4xl font-bold mb-4 justify-center flex">Data Petugas Medis</h2>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/dashboard/pegawai/create')}>Tambah</Button>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Refresh</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-3 mb-3">
        <Select
          allowClear
          placeholder="SEMUA KATEGORI"
          value={kategori}
          onChange={(v) => setKategori(v)}
          options={[
            { label: 'Dokter', value: 'doctor' },
            { label: 'Perawat', value: 'nurse' },
            { label: 'Apoteker', value: 'pharmacist' },
            { label: 'Lab', value: 'lab_technician' },
            { label: 'Radiologi', value: 'radiologist' }
          ]}
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
        <Table<Row>
          rowKey={(r) => String(r.id ?? `${r.nik}-${r.email}`)}
          dataSource={filtered}
          columns={columns}
        />
      </div>
    </div>
  )
}

export default PegawaiTable
