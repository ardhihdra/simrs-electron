import { ExportOutlined } from '@ant-design/icons'
import GenericTable from '@renderer/components/organisms/GenericTable'
import { TableHeader } from '@renderer/components/TableHeader'
import { client } from '@renderer/utils/client'
import { message, Tag, Modal } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import { useNavigate } from 'react-router'
import { useState } from 'react'

export default function InitialTriage() {
    const navigate = useNavigate()
    const [triageModal, setTriageModal] = useState<{ open: boolean; record?: any }>({ open: false })
    const { data: queueData, isLoading, isRefetching, refetch } = client.visitManagement.getActiveQueues.useQuery({
        status: ['CALLED'] // Only show Called queues
    })

    const startEncounterMutation = client.visitManagement.startEncounter.useMutation()



    const handleStartTriageClick = (record: any) => {
        setTriageModal({ open: true, record })
    }

    const handleProcessTriage = async () => {
        const record = triageModal.record
        if (!record) return

        console.log('Starting triage for record:', record)
        if (!record.serviceUnit?.id && !record.serviceUnitCodeId) {
            message.error('Data Service Unit tidak lengkap')
            return
        }

        try {
            const payload = {
                queueId: record.id,
                patientId: record.patientId,
                serviceUnitId: record.serviceUnit?.id || record.serviceUnitCodeId,
                serviceUnitCodeId: record.serviceUnitCodeId,
                encounterType: 'AMB',
                arrivalType: 'WALK_IN'
            }
            console.log('Sending startEncounter payload:', payload)

            const result = await startEncounterMutation.mutateAsync(payload)
            console.log('Start encounter result:', result)
            
            message.success(`Triage dimulai untuk ${record.patient?.name}`)
            navigate('/dashboard/encounter/triage', { 
                state: { 
                    encounterId: result.data.encounterId,
                    patient: record.patient,
                    queueId: record.id
                } 
            })
            refetch() // Although we navigate away, good to refresh if they come back
            setTriageModal({ open: false, record: undefined })
        } catch (error: any) {
            console.error('Failed to start triage:', error)
            message.error(error.message || 'Gagal memulai triage')
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
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => <Tag color="green">{status}</Tag>
        }
    ]

    return (
        <div>
            <TableHeader
                title="Triage Awal"
                onSearch={() => {}}
                loading={isLoading || isRefetching}
            >
                <div />
            </TableHeader>

            <div className='mt-4'>
                <GenericTable
                    columns={columns}
                    dataSource={queueData?.data || []}
                    rowKey="id"
                    loading={isLoading || isRefetching}
                    action={{
                        title: 'Aksi',
                        width: 150,
                        items: (record) => [
                            {
                                label: 'Proses Triage',
                                icon: <ExportOutlined />,
                                type: 'primary',
                                onClick: () => handleStartTriageClick(record)
                            }
                        ]
                    }}
                />
            </div>


            <Modal
                title="Mulai Triage"
                open={triageModal.open}
                onCancel={() => setTriageModal({ open: false, record: undefined })}
                onOk={handleProcessTriage}
                okText="Mulai"
                cancelText="Batal"
            >
                <p>Mulai triage untuk pasien <b>{triageModal.record?.patient?.name}</b>?</p>
                <p className="text-sm text-gray-500">No. Antrian: {triageModal.record?.formattedQueueNumber}</p>
            </Modal>
        </div>
    )
}
