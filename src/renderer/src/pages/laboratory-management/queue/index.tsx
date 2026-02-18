import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import GenericTable from '@renderer/components/organisms/GenericTable'
import { TableHeader } from '@renderer/components/TableHeader'
import { client } from '@renderer/utils/client'
import { DatePicker, Form, Input, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useState } from 'react'
import CreateOrderModal from './components/CreateOrderModal'

export default function LaboratoryQueue() {
    const [searchParams, setSearchParams] = useState({ 
        queueDate: dayjs().format('YYYY-MM-DD'), 
        queueNumber: '', 
        status: ['IN_PROGRESS', 'CALLED'] 
    })
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState<any>(null)

    const { data: queueData, isLoading, isRefetching } = client.visitManagement.getActiveQueues.useQuery({
        queueDate: searchParams.queueDate,
        queueNumber: searchParams.queueNumber ? Number(searchParams.queueNumber) : undefined,
        status: searchParams.status,
        serviceUnitCodeId: "LAB"
    })

    const columns: ColumnsType<any> = [
        { 
            title: 'No. Antrian', 
            dataIndex: 'formattedQueueNumber', 
            key: 'formattedQueueNumber',
            width: 120,
            render: (text: string) => <span className="font-bold text-lg">{text}</span>
        },
        { 
            title: 'Pasien', 
            dataIndex: 'patient', 
            key: 'patient',
            render: (patient: any) => patient ? (
                <div>
                    <div className="font-medium">{patient.name}</div>
                    <div className="text-xs text-gray-500">{patient.mrn}</div>
                </div>
            ) : <span className="text-gray-400 italic">Belum ada pasien</span>
        },
        { 
            title: 'Poli / Unit', 
            key: 'unit',
            render: (_, record: any) => record.serviceUnit?.name || record.poli?.name || '-'
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => <Tag color={status === 'IN_PROGRESS' ? 'blue' : 'green'}>{status}</Tag>
        }
    ]

    const onSearch = (values: any) => {
        setSearchParams({
            ...searchParams,
            queueDate: values.queueDate ? dayjs(values.queueDate).format('YYYY-MM-DD') : '',
            queueNumber: values.queueNumber
        })
    }

    const handleCreateOrder = (record: any) => {
        setSelectedRecord(record)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setSelectedRecord(null)
    }
    console.log(queueData)

    return (
        <div className="p-4">
             <TableHeader
                title="Antrian Laboratorium"
                onSearch={onSearch}
                loading={isLoading || isRefetching}
            >
                <div className="flex gap-4">
                    <Form.Item name="queueDate" label="Tanggal" initialValue={dayjs()}>
                         <DatePicker allowClear={false} />
                    </Form.Item>
                    <Form.Item name="queueNumber" label="No. Antrian">
                         <Input placeholder="Cari No. Antrian" allowClear suffix={<SearchOutlined />} />
                    </Form.Item>
                </div>
            </TableHeader>

            <div className="mt-4">
                <GenericTable
                    columns={columns}
                    dataSource={queueData?.data || []}
                    rowKey="id"
                    loading={isLoading || isRefetching}
                    action={{
                        title: 'Aksi',
                        width: 150,
                        items: (record: any) => [
                            {
                                label: 'Buat Order',
                                icon: <PlusOutlined />,
                                type: 'primary',
                                onClick: () => handleCreateOrder(record)
                            }
                        ]
                    }}
                />
            </div>

            <CreateOrderModal 
                open={isModalOpen}
                onClose={handleCloseModal}
                patient={selectedRecord?.patient}
                encounterId={selectedRecord?.encounter?.id}
            />
        </div>
    )
}

