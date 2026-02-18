import { CheckCircleOutlined, SoundOutlined } from '@ant-design/icons'
import GenericTable from '@renderer/components/organisms/GenericTable'
import { TableHeader } from '@renderer/components/TableHeader'
import { client } from '@renderer/utils/client'
import { DatePicker, Form, Tag, message, Input, Modal, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useState } from 'react'
import ConfirmQueueModal from './components/ConfirmQueueModal'

export default function RegistrationQueue() {
    const [searchParams, setSearchParams] = useState({ queueDate: dayjs().format('YYYY-MM-DD'), queueNumber: '' })
    const [confirmModal, setConfirmModal] = useState<{ open: boolean; queue?: any }>({ open: false })

    const { data: queueData, isLoading, isRefetching, refetch } = client.visitManagement.getActiveQueues.useQuery({
        queueDate: searchParams.queueDate,
        queueNumber: searchParams.queueNumber ? Number(searchParams.queueNumber) : undefined,
        status: ['PRE_RESERVED', 'RESERVED', 'REGISTERED']
        // Add other filters if needed (poli, etc.)
    })

    const startEncounterMutation = client.visitManagement.startEncounter.useMutation()
    const callMutation = client.visitManagement.callPatient.useMutation()

    const [callModal, setCallModal] = useState<{ open: boolean; record?: any }>({ open: false })

    const handleCallClick = (record: any) => {
        setCallModal({ open: true, record })
    }

    const handleProcessCall = async (withTriage: boolean) => {
        const record = callModal.record
        if (!record) return

        try {
            // Always call first to announce
            await callMutation.mutateAsync({ queueId: record.id })
            
            if (withTriage) {
                // Status becomes CALLED (default behavior of callPatient)
                message.success(`Antrian ${record.formattedQueueNumber} dipanggil ke Triage`)
            } else {
                // Skip Triage -> Start Encounter (Status IN_PROGRESS)
                await startEncounterMutation.mutateAsync({
                    queueId: record.id,
                    patientId: record.patientId,
                    serviceUnitId: record.serviceUnit?.id || record.serviceUnitCodeId, // Fallback if id missing
                    serviceUnitCodeId: record.serviceUnitCodeId,
                    encounterType: 'AMB', // Default
                    arrivalType: 'WALK_IN' // Default
                })
                message.success(`Antrian ${record.formattedQueueNumber} dipanggil dan masuk Poli`)
            }
            refetch()
            setCallModal({ open: false, record: undefined })
        } catch (error: any) {
             message.error(error.message || 'Gagal memproses antrian')
        }
    }

    const columns: ColumnsType<any> = [
        { 
            title: 'No. Antrian', 
            dataIndex: 'formattedQueueNumber', 
            key: 'formattedQueueNumber',
            width: 120,
            render: (text) => <span className="font-bold text-lg">{text}</span>
        },
        { 
            title: 'Pasien', 
            dataIndex: 'patient', 
            key: 'patient',
            render: (patient) => patient ? patient.name : <span className="text-gray-400 italic">Belum ada pasien</span>
        },
        {
            title: 'Poli / Unit',
            key: 'unit',
            render: (_, record) => (
                <div className="flex flex-col">
                    <span className="font-medium">{record.poli?.name}</span>
                    <span className="text-xs text-gray-500">{record.serviceUnit?.name}</span>
                </div>
            )
        },
        {
            title:"Asuransi",
            dataIndex: 'assuranceCodeId',
            key: 'assuranceCodeId',
            render: (insurance) => insurance ? insurance : <span className="text-gray-400 italic">Tidak ada asuransi</span>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'default'
                if (status === 'PRE_RESERVED') color = 'orange'
                if (status === 'RESERVED') color = 'blue'
                if (status === 'CALLED') color = 'green'
                if (status === 'IN_PROGRESS') color = 'purple'
                if (status === 'REGISTERED') color = 'cyan'
                
                return <Tag color={color}>{status}</Tag>
            }
        }
    ]

    const onSearch = (values: any) => {
        setSearchParams({
            ...searchParams,
            queueDate: values.queueDate ? dayjs(values.queueDate).format('YYYY-MM-DD') : '',
            queueNumber: values.queueNumber
        })
    }
console.log(queueData)
    return (
        <div>
            <TableHeader
                title="Antrian Pendaftaran"
                onSearch={onSearch}
                loading={isLoading || isRefetching}
            >
                <div className="flex gap-4">
                    <Form.Item name="queueDate" label="Tanggal" initialValue={dayjs()}>
                         <DatePicker allowClear={false} />
                    </Form.Item>
                    <Form.Item name="queueNumber" label="No. Antrian">
                         <Input placeholder="Cari No. Antrian" allowClear />
                    </Form.Item>
                </div>
            </TableHeader>

            <div className='mt-4'><GenericTable
                columns={columns}
                dataSource={queueData?.data || []}
                rowKey="id"
                loading={isLoading || isRefetching}
                action={{
                    title: 'Aksi',
                    width: 150,
                    items: (record) => {
                        const actions: any[] = []

                        if (record.status === 'PRE_RESERVED') {
                            actions.push({
                                label: 'Konfirmasi',
                                icon: <CheckCircleOutlined />,
                                type: 'primary',
                                onClick: () => setConfirmModal({ open: true, queue: record })
                            })
                        } else if (['RESERVED', 'REGISTERED', 'CALLED'].includes(record.status)) {
                             // Allow calling if reserved/registered, or recalling if already called
                            actions.push({
                                label: 'Panggil',
                                icon: <SoundOutlined />,
                                onClick: () => handleCallClick(record)
                            })
                        }

                        return actions
                    }
                }}
            /></div>

            <Modal
                title="Konfirmasi Panggilan"
                open={callModal.open}
                onCancel={() => setCallModal({ open: false, record: undefined })}
                footer={[
                    <Button key="cancel" onClick={() => setCallModal({ open: false, record: undefined })}>
                        Batal
                    </Button>,
                    <Button key="triage" onClick={() => handleProcessCall(true)}>
                        Panggil ke Triage
                    </Button>,
                    <Button key="poli" type="primary" onClick={() => handleProcessCall(false)}>
                        Langsung ke Poli
                    </Button>,
                ]}
            >
                <p>Pasien: <b>{callModal.record?.patient?.name}</b></p>
                <p>No. Antrian: <b>{callModal.record?.formattedQueueNumber}</b></p>
                <p>Apakah pasien memerlukan pemeriksaan Triage terlebih dahulu?</p>
            </Modal>

            <ConfirmQueueModal
                open={confirmModal.open}
                queue={confirmModal.queue}
                onClose={() => setConfirmModal({ open: false, queue: undefined })}
                onSuccess={() => refetch()}
            />
        </div>
    )
}