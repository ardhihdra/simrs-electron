import { PrinterOutlined } from '@ant-design/icons'
import GenericTable from '@renderer/components/organisms/GenericTable'
import { TableHeader } from '@renderer/components/TableHeader'
import { client } from '@renderer/utils/client'
import { DatePicker, Form, Input, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'

export default function LaboratoryReports() {
    const [searchParams, setSearchParams] = useState({ 
        fromDate: dayjs().subtract(7, 'days').format('YYYY-MM-DD'),
        toDate: dayjs().format('YYYY-MM-DD'),
        status: 'COMPLETED'
    })

    const { data: requestData, isLoading, isRefetching } = client.laboratoryManagement.getPendingOrders.useQuery({
        fromDate: searchParams.fromDate,
        toDate: searchParams.toDate,
        status: searchParams.status as any
    })

    // Group by Encounter ID to show one row per encounter (Report)
    const reportList = useMemo(() => {
        if (!requestData?.result) return []
        
        const grouped = new Map()
        requestData.result.forEach((item: any) => {
            if (!grouped.has(item.encounterId)) {
                grouped.set(item.encounterId, {
                    id: item.encounterId, // Use encounterId as row key
                    encounterId: item.encounterId,
                    patientId: item.patientId,
                    lastUpdate: item.requestedAt, // Approximate
                    requestCount: 0,
                    items: []
                })
            }
            const group = grouped.get(item.encounterId)
            group.requestCount++
            group.items.push(item)
            if (new Date(item.requestedAt) > new Date(group.lastUpdate)) {
                group.lastUpdate = item.requestedAt
            }
        })
        return Array.from(grouped.values())
    }, [requestData])

    const columns: ColumnsType<any> = [
        { 
            title: 'Tanggal', 
            dataIndex: 'lastUpdate', 
            key: 'lastUpdate',
            width: 150,
            render: (date) => dayjs(date).format('DD/MM/YYYY')
        },
        { 
            title: 'No. Layanan', 
            dataIndex: 'encounterId',
            key: 'encounterId',
            render: (text) => <span className="font-semibold">{text.substring(0, 8)}...</span>
        },
        {
            title: 'Jumlah Pemeriksaan',
            dataIndex: 'requestCount',
            key: 'requestCount',
            render: (count) => <Tag color="blue">{count} Item</Tag>
        },
        {
             title: 'Status',
             key: 'status',
             render: () => <Tag color="green">Finalized</Tag>
        }
    ]

    const onSearch = (values: any) => {
        setSearchParams({
            fromDate: values.dateRange ? dayjs(values.dateRange[0]).format('YYYY-MM-DD') : '',
            toDate: values.dateRange ? dayjs(values.dateRange[1]).format('YYYY-MM-DD') : '',
            status: 'COMPLETED'
        })
    }

    const handlePrintReport = (record: any) => {
        // Validation: Ensure we can print
        // For now, just log or show message
        console.log('Printing report for encounter:', record.encounterId)
        // In a real app, this would open a PDF or print window
        // window.open(`/api/module/laboratory-management/report/${record.encounterId}/pdf`)
    }

    return (
        <div className="p-4">
             <TableHeader
                title="Laporan Diagnostik"
                onSearch={onSearch}
                loading={isLoading || isRefetching}
            >
                <div className="flex gap-4">
                    <Form.Item name="dateRange" label="Tanggal" initialValue={[dayjs().subtract(7, 'days'), dayjs()]}>
                         <DatePicker.RangePicker allowClear={false} />
                    </Form.Item>
                    <Form.Item name="patientName" label="Pasien">
                         <Input placeholder="Cari Nama Pasien" allowClear />
                    </Form.Item>
                </div>
            </TableHeader>

            <div className="mt-4">
                <GenericTable
                    columns={columns}
                    dataSource={reportList}
                    rowKey="id"
                    loading={isLoading || isRefetching}
                    action={{
                        title: 'Aksi',
                        width: 100,
                        items: (record) => [
                            {
                                label: 'Cetak',
                                icon: <PrinterOutlined />,
                                type: 'primary',
                                onClick: () => handlePrintReport(record)
                            }
                        ]
                    }}
                />
            </div>
        </div>
    )
}
