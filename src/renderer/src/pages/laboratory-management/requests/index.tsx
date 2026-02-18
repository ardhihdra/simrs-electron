import { ExperimentOutlined, FileTextOutlined } from '@ant-design/icons'
import GenericTable from '@renderer/components/organisms/GenericTable'
import { TableHeader } from '@renderer/components/TableHeader'
import { client } from '@renderer/utils/client'
import { DatePicker, Form, Select, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useNavigate } from 'react-router'

export default function LaboratoryRequests() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useState({ 
        fromDate: dayjs().format('YYYY-MM-DD'),
        toDate: dayjs().format('YYYY-MM-DD'),
        status: undefined as string | undefined
    })

    const { data: requestData, isLoading, isRefetching } = client.laboratoryManagement.getPendingOrders.useQuery({
        fromDate: searchParams.fromDate,
        toDate: searchParams.toDate,
        status: searchParams.status as any
    },{
        enabled: !!searchParams.fromDate && !!searchParams.toDate,
        queryKey: ['laboratory-management-requests', {fromDate: searchParams.fromDate, toDate: searchParams.toDate, status: searchParams.status as any}]
    })

    // Group data by patient
    const patientGroups = requestData?.result?.reduce((acc: any[], item: any) => {
        const existingGroup = acc.find(g => g.patientId === item.patientId)
        if (existingGroup) {
            existingGroup.requests.push(item)
        } else {
            acc.push({
                id: item.patientId,
                patientId: item.patientId,
                patient: item.patient,
                requests: [item]
            })
        }
        return acc
    }, []) || []

    const handleAction = (record: any, action: 'specimen' | 'result') => {
        if (action === 'specimen') {
            // Navigate to specimen collection
             navigate('/dashboard/laboratory-management/requests/specimen', { state: { requestId: record.id, ...record } })
        } else {
            // Navigate to result entry
             navigate('/dashboard/laboratory-management/results/entry', { state: { requestId: record.id, ...record } })
        }
    }

    const patientColumns: ColumnsType<any> = [
        { 
            title: 'Pasien', 
            dataIndex: 'patient', 
            key: 'patient',
            render: (patient) => (
                <div>
                    <div className="font-bold">{patient?.name}</div>
                    <div className="text-xs text-gray-500">{patient?.mrn}</div>
                </div>
            )
        },
        { 
            title: 'Jumlah Permintaan', 
            key: 'count',
            render: (_, record) => record.requests?.length || 0
        },
        { 
            title: 'Selesai', 
            key: 'completed',
            render: (_, record) => {
                const completedCount = record.requests?.filter((r: any) => r.status === 'COMPLETED').length || 0
                const totalCount = record.requests?.length || 0
                const allCompleted = totalCount > 0 && completedCount === totalCount
                
                return (
                    <Tag color={allCompleted ? 'green' : 'default'}>
                        {completedCount} / {totalCount}
                    </Tag>
                )
            }
        },
    ]

    const requestColumns: ColumnsType<any> = [
        { 
            title: 'Tgl. Order', 
            dataIndex: 'requestedAt', 
            key: 'requestedAt',
            width: 150,
            render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
        },
        { 
            title: 'Pemeriksaan', 
            dataIndex: 'test', 
            key: 'test',
            render: (text) => <span className="font-medium">{text?.display}</span>
        },
        {
            title: 'Prioritas',
            dataIndex: 'priority',
            key: 'priority',
            width: 100,
            render: (priority) => {
                let color = 'default'
                if (priority === 'URGENT') color = 'orange'
                if (priority === 'STAT') color = 'red'
                return <Tag color={color}>{priority}</Tag>
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => {
                let color = 'default'
                if (status === 'REQUESTED') color = 'blue'
                if (status === 'IN_PROGRESS') color = 'orange'
                if (status === 'COMPLETED') color = 'green'
                if (status === 'CANCELLED' || status === 'ENTERED_IN_ERROR') color = 'red'
                return <Tag color={color}>{status}</Tag>
            }
        }
    ]

    const onSearch = (values: any) => {
        const date = values.date ? dayjs(values.date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
        setSearchParams({
            fromDate: date, 
            toDate: date,
            status: values.status
        })
    }

    return (
        <div className="p-4">
             <TableHeader
                title="Daftar Permintaan Laboratorium"
                onSearch={onSearch}
                loading={isLoading || isRefetching}
            >
                <div className="flex gap-4">
                    <Form.Item name="date" label="Tanggal" initialValue={dayjs()}>
                         <DatePicker allowClear={false} />
                    </Form.Item>
                    <Form.Item name="status" label="Status">
                         <Select placeholder="Semua Status" allowClear style={{ width: 150 }}>
                             <Select.Option value="REQUESTED">Requested</Select.Option>
                             <Select.Option value="IN_PROGRESS">In Progress</Select.Option>
                             <Select.Option value="COMPLETED">Completed</Select.Option>
                             <Select.Option value="CANCELLED">Cancelled</Select.Option>
                         </Select>
                    </Form.Item>
                </div>
            </TableHeader>

            <div className="mt-4">
                <GenericTable
                    columns={patientColumns}
                    dataSource={patientGroups}
                    rowKey="id"
                    loading={isLoading || isRefetching}
                    tableProps={{
                        expandable: {
                            expandedRowRender: (record) => (
                                <div className="p-2 bg-gray-50">
                                    <GenericTable
                                        columns={requestColumns}
                                        dataSource={record.requests}
                                        rowKey="id"
                                        action={{
                                            title: 'Aksi',
                                            width: 150,
                                            items: (record) => {
                                                const actions: any[] = []
                                                
                                                // Logic for available actions based on status
                                                if (record.status === 'REQUESTED') {
                                                    actions.push({
                                                        label: 'Ambil Sampel',
                                                        icon: <ExperimentOutlined />,
                                                        onClick: () => handleAction(record, 'specimen')
                                                    })
                                                }
                                                
                                                if (record.status === 'REQUESTED' || record.status === 'IN_PROGRESS') {
                                                     actions.push({
                                                        label: 'Input Hasil',
                                                        icon: <FileTextOutlined />,
                                                        type: 'primary',
                                                        onClick: () => handleAction(record, 'result')
                                                    })
                                                }
                    
                                                return actions
                                            }
                                        }}
                                    />
                                </div>
                            )
                        }
                    }}
                />
            </div>
        </div>
    )
}
