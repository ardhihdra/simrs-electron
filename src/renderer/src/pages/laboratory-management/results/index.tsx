import { FileSearchOutlined } from '@ant-design/icons'
import GenericTable from '@renderer/components/organisms/GenericTable'
import { TableHeader } from '@renderer/components/TableHeader'
import { client } from '@renderer/utils/client'
import { DatePicker, Form, Input, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useNavigate } from 'react-router'

export default function LaboratoryResults() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useState({ 
        fromDate: dayjs().subtract(7, 'days').format('YYYY-MM-DD'),
        toDate: dayjs().format('YYYY-MM-DD'),
        // We assume 'results' page shows COMPLETED orders
        status: 'COMPLETED' 
    })

    const { data: requestData, isLoading, isRefetching } = client.laboratoryManagement.getPendingOrders.useQuery({
        fromDate: searchParams.fromDate,
        toDate: searchParams.toDate,
        status: searchParams.status as any
    })

    const columns: ColumnsType<any> = [
        { 
            title: 'Tgl. Selesai', 
            dataIndex: 'requestedAt', // Ideally completedAt, but using requestedAt for now
            key: 'requestedAt',
            width: 150,
            render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
        },
        { 
            title: 'No. Layanan', 
            dataIndex: 'encounterId',
            key: 'encounterId',
            render: (_, record) => (
                <div>
                     <span className="font-semibold text-gray-700">Encounter: {record.encounterId.substring(0, 8)}...</span>
                </div>
            )
        },
        { 
            title: 'Pemeriksaan', 
            dataIndex: 'testDisplay', 
            key: 'testDisplay',
            render: (text) => <span className="font-medium">{text}</span>
        },
        { 
            title: 'Hasil', 
            key: 'result',
            render: () => <span className="text-gray-500">Lihat Detail</span>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => <Tag color="green">{status}</Tag>
        }
    ]

    const onSearch = (values: any) => {
        setSearchParams({
            fromDate: values.dateRange ? dayjs(values.dateRange[0]).format('YYYY-MM-DD') : '',
            toDate: values.dateRange ? dayjs(values.dateRange[1]).format('YYYY-MM-DD') : '',
            status: 'COMPLETED'
        })
    }

    const handleViewReport = (record: any) => {
        // Navigate to report view
        navigate(`/dashboard/laboratory-management/results/${record.encounterId}`)
    }

    return (
        <div className="p-4">
             <TableHeader
                title="Daftar Hasil Pemeriksaan"
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
                    dataSource={requestData?.result || []}
                    rowKey="id"
                    loading={isLoading || isRefetching}
                    action={{
                        title: 'Aksi',
                        width: 100,
                        items: (record) => [
                            {
                                label: 'Lihat',
                                icon: <FileSearchOutlined />,
                                type: 'default',
                                onClick: () => handleViewReport(record)
                            }
                        ]
                    }}
                />
            </div>
        </div>
    )
}
