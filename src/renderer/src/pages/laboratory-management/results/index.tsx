import { FileSearchOutlined } from '@ant-design/icons'
import GenericTable from '@renderer/components/organisms/GenericTable'
import { TableHeader } from '@renderer/components/TableHeader'
import { client } from '@renderer/utils/client'
import { DatePicker, Form, Input, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

export default function LaboratoryResults() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useState({ 
        fromDate: dayjs().subtract(7, 'days').format('YYYY-MM-DD'),
        toDate: dayjs().format('YYYY-MM-DD'),
        // We assume 'results' page shows COMPLETED orders
        status: 'COMPLETED' 
    })

    const { data: requestData, isLoading, isRefetching } = client.laboratoryManagement.getOrders.useQuery({
        fromDate: searchParams.fromDate,
        toDate: searchParams.toDate,
        status: searchParams.status as any
    })

    // Grouping logic by encounterId
    const groupedData = useMemo(() => {
        if (!requestData?.result) return []

        const groups = requestData.result.reduce((acc: Record<string, any>, current: any) => {
            if (!acc[current.encounterId]) {
                acc[current.encounterId] = {
                    key: current.encounterId,
                    encounterId: current.encounterId,
                    queueNumber: current.queueTicket?.number,
                    patient: current.patient,
                    requestedAt: current.requestedAt, // Using first test's requestedAt for group
                    status: current.status, // Can accumulate statuses if needed
                    tests: []
                }
            }
            acc[current.encounterId].tests.push({ ...current, key: current.id })
            return acc
        }, {})

        return Object.values(groups)
    }, [requestData?.result])

    const parentColumns: ColumnsType<any> = [
        { 
            title: 'Tgl. Selesai', 
            dataIndex: 'requestedAt', 
            key: 'requestedAt',
            width: 150,
            render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
        },
        { 
            title: 'No. Antrian', 
            dataIndex: 'queueNumber',
            key: 'queueNumber',
            render: (_, record) => (
                <div>
                     <span className="font-semibold text-gray-700">{record.queueNumber}</span>
                </div>
            )
        },
        { 
            title: 'Pasien', 
            dataIndex: ['patient', 'name'], 
            key: 'patientName',
            render: (text, record) => <div>
                <span className="text-gray-500 text-xs">{record.patient.mrn} - </span>
                <span className="font-medium">{text || '-'}</span>
            </div>  
        },
        { 
            title: 'Total Pemeriksaan', 
            key: 'totalTests',
            render: (_, record) => <span>{record.tests.length} Pemeriksaan</span>
        },
        // {
        //     title: 'Status',
        //     dataIndex: 'status',
        //     key: 'status',
        //     width: 120,
        //     render: (status) => <Tag color="green">{status}</Tag>
        // }
    ]

    const childColumns: ColumnsType<any> = [
        { 
            title: 'Pemeriksaan', 
            dataIndex: 'testDisplay', 
            key: 'testDisplay',
            render: (text) => <span className="font-medium">{text}</span>
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
        // Navigate to report view using encounterId
        navigate(`/dashboard/laboratory/report/${record.encounterId}`)
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

            <div className="mt-4 bg-white p-4 rounded-lg border border-gray-100">
                <GenericTable
                    columns={parentColumns}
                    dataSource={groupedData}
                    rowKey="key"
                    loading={isLoading || isRefetching}
                    tableProps={{
                        expandable: {
                            expandedRowRender: (record) => (
                                <div className="px-10 py-2 bg-gray-50">
                                    <GenericTable 
                                        columns={childColumns} 
                                        dataSource={record.tests} 
                                        rowKey="key" 
                                        tableProps={{ pagination: false }}
                                    />
                                </div>
                            )
                        }
                    }}
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
