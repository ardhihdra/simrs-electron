import { Button, DatePicker, Input, Popconfirm, Select, Table, Tooltip } from 'antd'
import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import type { EncounterRow, EncounterTableRow } from '@shared/encounter'
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import GenericTable from '@renderer/components/GenericTable'
import { useDeleteEncounter, useEncounterList } from '@renderer/hooks/query/use-encounter'
import { SelectPoli } from '@renderer/components/dynamic/SelectPoli'


const baseColumns: ColumnsType<EncounterTableRow> = [
  { title: 'No.', dataIndex: 'no', key: 'no', width: 60 },
  { title: 'Kode Antrian', dataIndex: 'encounterCode', key: 'encounterCode', render: (v: string | null) => (v ? v : '-') },
  { title: 'Tanggal Kunjungan', dataIndex: 'visitDate', key: 'visitDate', render: (v: string | Date) => (v ? dayjs(v).format('DD MMMM YYYY HH:mm') : '-') },
  { title: 'Pasien', dataIndex: ['patient', 'name'], key: 'patient' },
  { title: 'Layanan', dataIndex: 'serviceType', key: 'serviceType' },
  { title: 'Alasan', dataIndex: 'reason', key: 'reason' },
  { title: 'Status', dataIndex: 'status', key: 'status' },
  { title: 'Catatan', dataIndex: 'note', key: 'note' },
]

function RowActions({ record }: { record: EncounterTableRow }) {
  const navigate = useNavigate()
  const deleteMutation = useDeleteEncounter()
  return (
    <div className="flex gap-2">
      <Tooltip title="Lihat Detail">
        <Button
          icon={<EyeOutlined />}
          size="small"
          onClick={() => { if (record.id) navigate(`/dashboard/encounter/edit/${record.id}?mode=view`) }}
        />
      </Tooltip>
      <Tooltip title="Edit">
        <Button
          icon={<EditOutlined />}
          size="small"
          onClick={() => { if (record.id) navigate(`/dashboard/encounter/edit/${record.id}`) }}
        />
      </Tooltip>
      <Popconfirm
        title="Hapus Kunjungan"
        description="Apakah anda yakin ingin menghapus data ini?"
        onConfirm={() => { if (record.id) deleteMutation.mutate(record.id) }}
        okText="Ya"
        cancelText="Batal"
        disabled={deleteMutation.isPending}
      >
        <Tooltip title="Hapus">
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            loading={deleteMutation.isPending}
          />
        </Tooltip>
      </Popconfirm>
    </div>
  )
}

export function EncounterTable() {
  const navigate = useNavigate()
  const [searchPatient, setSearchPatient] = useState('')
  const [searchService, setSearchService] = useState('')
  const [searchReason, setSearchReason] = useState('')
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [visitDate, setVisitDate] = useState<string | null>(null)
  const { data, refetch, isError } = useEncounterList()

  const filtered = useMemo(() => {
    const source: EncounterRow[] = Array.isArray(data?.data) ? (data!.data as EncounterRow[]) : []
    const rows: EncounterTableRow[] = source.map((e, idx) => ({ ...e, no: idx + 1 }))
    return rows.filter((r) => {
      const matchPatient = searchPatient ? String(r.patient?.name || '').toLowerCase().includes(searchPatient.toLowerCase()) : true
      const matchService = searchService ? String(r.serviceType || '').toLowerCase().includes(searchService.toLowerCase()) : true
      const matchReason = searchReason ? String(r.reason || '').toLowerCase().includes(searchReason.toLowerCase()) : true
      const matchStatus = status ? String(r.status || '').toLowerCase() === status.toLowerCase() : true
      const matchDate = visitDate ? dayjs(r.visitDate).isSame(dayjs(visitDate), 'day') : true
      return matchPatient && matchService && matchReason && matchStatus && matchDate
    })
  }, [data, searchPatient, searchService, searchReason, status, visitDate])

  return (
    <div>
      <h2 className="text-4xl font-bold mb-4 justify-center flex">Daftar Kunjungan</h2>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/dashboard/encounter/create')}>Tambah</Button>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Refresh</Button>
        <Button
          onClick={async () => {
            try {
              const res = await window.api.query.export.exportCsv({
                entity: 'encounter',
                usePagination: false
              })
              if (res && typeof res === 'object' && 'success' in res && res.success && 'url' in res && res.url) {
                window.open(res.url as string, '_blank')
              }
            } catch (e) {
              console.error(e instanceof Error ? e.message : String(e))
            }
          }}
        >Export CSV</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-3 mb-3">
        <Input placeholder="Pasien" value={searchPatient} onChange={(e) => setSearchPatient(e.target.value)} />
        <SelectPoli
          valueType="name"
          placeholder="Layanan"
          value={searchService}
          onChange={(val) => setSearchService(val as string)}
          allowClear
          className="w-full"
        />
        <Input placeholder="Alasan" value={searchReason} onChange={(e) => setSearchReason(e.target.value)} />
        <Select
          allowClear
          placeholder="SEMUA STATUS"
          value={status}
          onChange={(v) => setStatus(v)}
          options={[
            { label: 'Planned', value: 'planned' },
            { label: 'Arrived', value: 'arrived' },
            { label: 'Triaged', value: 'triaged' },
            { label: 'In Progress', value: 'in-progress' },
            { label: 'On Hold', value: 'onhold' },
            { label: 'Finished', value: 'finished' },
            { label: 'Cancelled', value: 'cancelled' },
            { label: 'Entered In Error', value: 'entered-in-error' },
            { label: 'Unknown', value: 'unknown' }
          ]}
        />
        <DatePicker
          placeholder="Tanggal Kunjungan"
          value={visitDate ? dayjs(visitDate) : null}
          onChange={(d) => setVisitDate(d ? d.toISOString() : null)}
          className="w-full"
        />
        <div />
        <div />
      </div>
      {isError || (!data?.success && <div className="text-red-500">{data?.error}</div>)}
      <GenericTable<EncounterTableRow>
        columns={baseColumns}
        dataSource={filtered}
        rowKey={(r) => String(r.id ?? `${r.serviceType}-${r.patient?.name || ''}`)}
        action={{
          title: 'Action',
          width: 100,
          align: 'center',
          fixedRight: true,
          render: (record) => <RowActions record={record} />
        }}
      />
    </div>
  )
}

export default EncounterTable
