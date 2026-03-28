import { FileTextOutlined, ReloadOutlined } from '@ant-design/icons'
import GenericTable from '@renderer/components/organisms/GenericTable'
import { useQuery } from '@tanstack/react-query'
import { Button, DatePicker, Input, Select, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

interface EncounterRow {
    id: string
    no?: number
    encounterCode?: string | null
    visitDate?: string | Date
    startTime?: string | Date | null
    arrivalType?: string | null
    patient?: { name?: string; id?: string }
    serviceUnit?: { id?: string; name?: string; type?: string } | null
    serviceType?: string
    reason?: string
    status?: string
}

const columns: ColumnsType<EncounterRow> = [
    { title: 'No.', dataIndex: 'no', key: 'no', width: 55 },
    {
        title: 'Kode Antrian',
        dataIndex: 'encounterCode',
        key: 'encounterCode',
        render: (v) => v ?? '-'
    },
    {
        title: 'Tanggal Kunjungan',
        dataIndex: 'visitDate',
        key: 'visitDate',
        render: (v) => (v ? dayjs(v).format('DD MMM YYYY HH:mm') : '-')
    },
    {
        title: 'Jam Mulai',
        dataIndex: 'startTime',
        key: 'startTime',
        render: (v) => (v ? dayjs(v).format('HH:mm') : '-')
    },
    {
        title: 'Jenis Kedatangan',
        dataIndex: 'arrivalType',
        key: 'arrivalType',
        render: (v) => v ?? '-'
    },
    { title: 'Pasien', dataIndex: ['patient', 'name'], key: 'patient' },
    {
        title: 'Unit Layanan',
        dataIndex: ['serviceUnit', 'name'],
        key: 'serviceUnit',
        render: (v) => v ?? '-'
    },
    { title: 'Layanan', dataIndex: 'serviceType', key: 'serviceType' },
    { title: 'Status', dataIndex: 'status', key: 'status' }
]

export default function KasirEncounterTable() {
    const navigate = useNavigate()

    const [searchPatient, setSearchPatient] = useState('')
    const [status, setStatus] = useState<string | undefined>(undefined)
    const [visitDate, setVisitDate] = useState<string | null>(null)

    const { data, isLoading, isRefetching, refetch } = useQuery({
        queryKey: ['kasir-encounter-list'],
        queryFn: () => window.api.query.encounter.list({})
    })
    console.log('cek encounter', data)

    const rows = useMemo<EncounterRow[]>(() => {
        const source: EncounterRow[] = Array.isArray((data as any)?.result)
            ? ((data as any).result as EncounterRow[])
            : []
        return source
            .filter((r) => {
                const matchPatient = searchPatient
                    ? String(r.patient?.name ?? '')
                          .toLowerCase()
                          .includes(searchPatient.toLowerCase())
                    : true
                const matchStatus = status
                    ? String(r.status ?? '').toLowerCase() === status.toLowerCase()
                    : true
                const matchDate = visitDate
                    ? dayjs(r.visitDate).isSame(dayjs(visitDate), 'day')
                    : true
                return matchPatient && matchStatus && matchDate
            })
            .map((r, idx) => ({ ...r, no: idx + 1 }))
    }, [data, searchPatient, status, visitDate])

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Tagihan Pasien</h2>

            <div className="flex flex-wrap items-center gap-2 mb-3">
                <Button
                    icon={<ReloadOutlined />}
                    onClick={() => refetch()}
                    loading={isRefetching}
                >
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
                <Input
                    placeholder="Cari Pasien"
                    value={searchPatient}
                    onChange={(e) => setSearchPatient(e.target.value)}
                    allowClear
                />
                <Select
                    allowClear
                    placeholder="Semua Status"
                    value={status}
                    onChange={(v) => setStatus(v)}
                    options={[
                        { label: 'Planned', value: 'planned' },
                        { label: 'Arrived', value: 'arrived' },
                        { label: 'In Progress', value: 'in_progress' },
                        { label: 'Finished', value: 'finished' },
                        { label: 'Cancelled', value: 'cancelled' }
                    ]}
                />
                <DatePicker
                    placeholder="Tanggal Kunjungan"
                    value={visitDate ? dayjs(visitDate) : null}
                    onChange={(d) => setVisitDate(d ? d.toISOString() : null)}
                    className="w-full"
                />
            </div>

            <GenericTable<EncounterRow>
                loading={isLoading || isRefetching}
                columns={columns}
                dataSource={rows}
                rowKey={(r) => String(r.id)}
                action={{
                    title: 'Aksi',
                    width: 80,
                    align: 'center',
                    fixedRight: true,
                    render: (record) => (
                        <Tooltip title="Lihat Invoice">
                            <Button
                                icon={<FileTextOutlined />}
                                size="small"
                                type="primary"
                                onClick={() => {
                                    const patientId = record.patient?.id ?? ''
                                    navigate(
                                        `/dashboard/kasir/invoice/${record.id}?patientId=${patientId}`
                                    )
                                }}
                            />
                        </Tooltip>
                    )
                }}
            />
        </div>
    )
}
