import { FileTextOutlined } from '@ant-design/icons'
import { ExportButton } from '@renderer/components/molecules/ExportButton'
import GenericTable from '@renderer/components/organisms/GenericTable'
import { TableHeader } from '@renderer/components/TableHeader'
import { client } from '@renderer/utils/client'
import { Card, Col, DatePicker, Form, Row, Select, Statistic, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'

type PaymentMethod = 'cash' | 'bpjs' | 'asuransi' | 'company'

interface VisitItem extends Record<string, unknown> {
    queueTicketId: string
    patientMrn: string
    patientName: string
    visitDate: string
    poliName: string
    doctorName: string
    paymentMethod: string
    status: string
}

const PAYMENT_METHOD_OPTIONS = [
    { value: '', label: 'Semua Cara Bayar' },
    { value: 'cash', label: 'Umum' },
    { value: 'bpjs', label: 'BPJS' },
    { value: 'asuransi', label: 'Asuransi' },
    { value: 'company', label: 'Perusahaan' },
]

const PAYMENT_LABEL: Record<string, string> = {
    cash: 'Umum',
    bpjs: 'BPJS',
    asuransi: 'Asuransi',
    company: 'Perusahaan',
}

const PAYMENT_COLOR: Record<string, string> = {
    cash: 'default',
    bpjs: 'green',
    asuransi: 'blue',
    company: 'purple',
}

export default function LaporanKunjunganPage() {
    const [filters, setFilters] = useState({
        fromDate: dayjs().startOf('month').format('YYYY-MM-DD'),
        toDate: dayjs().format('YYYY-MM-DD'),
        poliCodeId: undefined as number | undefined,
        paymentMethod: undefined as PaymentMethod | undefined,
    })

    const { data, isLoading, isRefetching, refetch } = client.outpatientReporting.getVisitReport.useQuery({
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        poliCodeId: filters.poliCodeId,
        paymentMethod: filters.paymentMethod,
    })

    const { data: poliData } = client.visitManagement.poli.useQuery({})
    const poliOptions = useMemo(() => {
        const list: any[] = poliData?.result ?? []
        return [
            { value: '', label: 'Semua Poli' },
            ...list.map((p: any) => ({ value: p.id, label: p.name })),
        ]
    }, [poliData])

    const items: VisitItem[] = data?.result?.items ?? []

    const stats = useMemo(() => {
        const byPayment = items.reduce(
            (acc, item) => {
                acc[item.paymentMethod] = (acc[item.paymentMethod] ?? 0) + 1
                return acc
            },
            {} as Record<string, number>
        )
        return { total: items.length, byPayment }
    }, [items])

    const onSearch = (values: any) => {
        setFilters({
            fromDate: values.dateRange ? dayjs(values.dateRange[0]).format('YYYY-MM-DD') : filters.fromDate,
            toDate: values.dateRange ? dayjs(values.dateRange[1]).format('YYYY-MM-DD') : filters.toDate,
            poliCodeId: values.poliCodeId || undefined,
            paymentMethod: (values.paymentMethod || undefined) as PaymentMethod | undefined,
        })
    }

    const columns: ColumnsType<VisitItem> = [
        {
            title: 'No. RM',
            dataIndex: 'patientMrn',
            key: 'patientMrn',
            width: 110,
        },
        {
            title: 'Nama Pasien',
            dataIndex: 'patientName',
            key: 'patientName',
        },
        {
            title: 'Tanggal Kunjungan',
            dataIndex: 'visitDate',
            key: 'visitDate',
            width: 150,
            render: (d: string) => dayjs(d).format('DD/MM/YYYY'),
        },
        {
            title: 'Poli / Ruangan',
            dataIndex: 'poliName',
            key: 'poliName',
        },
        {
            title: 'Dokter',
            dataIndex: 'doctorName',
            key: 'doctorName',
        },
        {
            title: 'Cara Bayar',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            width: 120,
            render: (m: string) => (
                <Tag color={PAYMENT_COLOR[m] ?? 'default'}>{PAYMENT_LABEL[m] ?? m}</Tag>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 130,
        },
    ]

    const exportColumns = [
        { key: 'patientMrn', label: 'No. RM' },
        { key: 'patientName', label: 'Nama Pasien' },
        { key: 'visitDate', label: 'Tanggal Kunjungan', render: (v: unknown) => dayjs(v as string).format('DD/MM/YYYY') },
        { key: 'poliName', label: 'Poli / Ruangan' },
        { key: 'doctorName', label: 'Dokter' },
        { key: 'paymentMethod', label: 'Cara Bayar', render: (v: unknown) => PAYMENT_LABEL[v as string] ?? String(v) },
        { key: 'status', label: 'Status' },
    ]

    return (
        <div className="p-4">
            <Row gutter={[16, 16]} className="mb-4">
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small">
                        <Statistic title="Total Kunjungan" value={stats.total} valueStyle={{ color: '#1677ff' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small">
                        <Statistic title="Umum" value={stats.byPayment['cash'] ?? 0} />
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small">
                        <Statistic title="BPJS" value={stats.byPayment['bpjs'] ?? 0} valueStyle={{ color: '#52c41a' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small">
                        <Statistic title="Asuransi" value={stats.byPayment['asuransi'] ?? 0} valueStyle={{ color: '#1890ff' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card size="small">
                        <Statistic title="Perusahaan" value={stats.byPayment['company'] ?? 0} valueStyle={{ color: '#722ed1' }} />
                    </Card>
                </Col>
            </Row>

            <TableHeader
                title="Laporan Kunjungan Pasien Rawat Jalan"
                subtitle="Kunjungan per ruangan · per dokter · per cara bayar"
                icon={<FileTextOutlined className="text-white text-lg" />}
                onSearch={onSearch}
                onRefresh={() => refetch()}
                loading={isLoading || isRefetching}
                action={
                    <ExportButton
                        data={items}
                        fileName={`laporan-kunjungan-${filters.fromDate}-${filters.toDate}`}
                        title={`Laporan Kunjungan Pasien Rawat Jalan\n${filters.fromDate} s/d ${filters.toDate}`}
                        columns={exportColumns}
                    />
                }
            >
                <Form.Item
                    name="dateRange"
                    label="Tanggal"
                    initialValue={[dayjs().startOf('month'), dayjs()]}
                    style={{ width: '100%' }}
                >
                    <DatePicker.RangePicker allowClear={false} style={{ width: '100%' }} size="large" />
                </Form.Item>
                <Form.Item name="poliCodeId" label="Poli" style={{ width: '100%' }}>
                    <Select options={poliOptions} placeholder="Semua Poli" allowClear size="large" />
                </Form.Item>
                <Form.Item name="paymentMethod" label="Cara Bayar" style={{ width: '100%' }}>
                    <Select options={PAYMENT_METHOD_OPTIONS} placeholder="Semua Cara Bayar" allowClear size="large" />
                </Form.Item>
            </TableHeader>

            <GenericTable
                columns={columns}
                dataSource={items}
                rowKey="queueTicketId"
                loading={isLoading || isRefetching}
            />
        </div>
    )
}
