import { CheckCircleOutlined, FileTextOutlined, SoundOutlined } from '@ant-design/icons'
import GenericTable from '@renderer/components/organisms/GenericTable'
import CallConfirmationModal from '@renderer/components/organisms/visit-management/CallConfirmationModal'
import CallQueueModal from '@renderer/components/organisms/visit-management/CallQueueModal'
import ConfirmQueueModal from '@renderer/components/organisms/visit-management/ConfirmQueueModal'
import DischargeModal from '@renderer/components/organisms/visit-management/DischargeModal'
import ReferralModal from '@renderer/components/organisms/visit-management/ReferralModal'
import { TableHeader } from '@renderer/components/TableHeader'
import { client } from '@renderer/utils/client'
import { App, DatePicker, Form, Input, Modal, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useParams } from 'react-router'

export default function RegistrationQueue({
  practitionerId: propPractitionerId
}: {
  practitionerId?: string
}) {
  const { practitionerId: urlPractitionerId } = useParams()
  const practitionerId = propPractitionerId || urlPractitionerId

  const [searchParams, setSearchParams] = useState({
    queueDate: dayjs().format('YYYY-MM-DD'),
    queueNumber: '',
    practitionerId: practitionerId || ''
  })

  const [confirmModal, setConfirmModal] = useState<{ open: boolean; queue?: any }>({ open: false })
  const [callConfirmModal, setCallConfirmModal] = useState<{ open: boolean; record?: any }>({
    open: false
  })
  const [callModal, setCallModal] = useState<{ open: boolean; record?: any }>({ open: false })
  const [dischargeModal, setDischargeModal] = useState<{ open: boolean; record?: any }>({
    open: false
  })
  const [referralModal, setReferralModal] = useState<{ open: boolean; record?: any }>({
    open: false
  })

  const { message } = App.useApp()

  const {
    data: queueData,
    isLoading,
    isRefetching,
    refetch
  } = client.registration.getQueues.useQuery({
    queueDate: searchParams.queueDate,
    queueNumber: searchParams.queueNumber ? Number(searchParams.queueNumber) : undefined,
    status: [
      'PRE_RESERVED',
      'RESERVED',
      'REGISTERED',
      'CALLED',
      'TRIAGE',
      'TRIAGED',
      'IN_PROGRESS'
    ],
    practitionerId: searchParams.practitionerId ? Number(searchParams.practitionerId) : undefined
  })
  console.log('searchParams', searchParams)
  console.log('queueData', queueData)

  const updateStatusMutation = client.registration.updateQueueStatus.useMutation()
  const cancelEncounterMutation = client.registration.cancelEncounter.useMutation()

  const handleCancelEncounter = (record: any) => {
    Modal.confirm({
      title: 'Batalkan Antrian',
      content: `Apakah Anda yakin ingin membatalkan antrian untuk ${record.patientName}?`,
      okText: 'Ya, Batalkan',
      okType: 'danger',
      cancelText: 'Tidak',
      onOk: async () => {
        try {
          await cancelEncounterMutation.mutateAsync({
            id: record.encounterId,
            reason: 'Dibatalkan oleh petugas pendaftaran'
          })
          message.success('Antrian berhasil dibatalkan')
          refetch()
        } catch (error: any) {
          message.error(error.message || 'Gagal membatalkan antrian')
        }
      }
    })
  }

  const handleTriagedCallToPoli = async (record: any) => {
    try {
      await updateStatusMutation.mutateAsync({ queueId: record.queueId, action: 'START_ENCOUNTER' })
      message.success(`Antrian ${record.formattedQueueNumber} dipanggil dan masuk Poli`)
      refetch()
    } catch (error: any) {
      message.error(error.message || 'Gagal memproses antrian')
    }
  }

  const handleCreateSep = async (record: any) => {
    try {
      await updateStatusMutation.mutateAsync({ queueId: record.queueId, action: 'CREATE_SEP' })
      message.success('SEP Draft berhasil dibuat')
      refetch()
    } catch (error: any) {
      message.error(error.message || 'Gagal membuat SEP')
    }
  }

  const handleTriageDone = async (record: any) => {
    try {
      await updateStatusMutation.mutateAsync({ queueId: record.queueId, action: 'TRIAGE_DONE' })
      message.success(`Status antrian ${record.formattedQueueNumber} diperbarui: TRIAGED`)
      refetch()
    } catch (error: any) {
      message.error(error.message || 'Gagal memperbarui status')
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
      dataIndex: 'patientName',
      key: 'patientName',
      render: (patient) =>
        patient ? patient : <span className="text-gray-400 italic">Belum ada pasien</span>
    },
    {
      title: 'Poli / Unit',
      key: 'poliName',
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="font-medium">{record.poliName}</span>
          <span className="text-xs text-gray-500">{record.serviceUnitName}</span>
        </div>
      )
    },
    {
      title: 'Metode Bayar',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method) => {
        const color = method === 'bpjs' ? 'blue' : method === 'cash' ? 'green' : 'default'
        return (
          <Tag color={color} className="uppercase">
            {method}
          </Tag>
        )
      }
    },
    {
      title: 'SEP',
      key: 'sep',
      width: 150,
      render: (_, record) => {
        if (record.noSep) return <Tag color="cyan">{record.noSep}</Tag>
        if (record.sepStatus === 'draft') return <Tag color="orange">Draft SEP</Tag>
        if (record.paymentMethod === 'bpjs')
          return <span className="text-gray-400 italic text-xs">Belum ada SEP</span>
        return null
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap: Record<string, string> = {
          PRE_RESERVED: 'orange',
          RESERVED: 'blue',
          CALLED: 'green',
          TRIAGE: 'volcano',
          TRIAGED: 'geekblue',
          IN_PROGRESS: 'purple',
          REGISTERED: 'cyan'
        }
        return <Tag color={colorMap[status] ?? 'default'}>{status}</Tag>
      }
    }
  ]

  const onSearch = (values: any) => {
    setSearchParams({
      ...searchParams,
      queueDate: values.queueDate ? dayjs(values.queueDate).format('YYYY-MM-DD') : '',
      queueNumber: values.queueNumber,
      practitionerId: values.practitionerId
    })
    refetch()
  }

  return (
    <div>
      <TableHeader
        title="Antrian Pendaftaran"
        subtitle="Manajemen antrian pendaftaran pasien"
        onSearch={onSearch}
        loading={isLoading || isRefetching}
      >
        <Form.Item name="queueDate" style={{ width: '100%' }} initialValue={dayjs()}>
          <DatePicker allowClear={false} size="large" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="queueNumber" style={{ width: '100%' }}>
          <Input placeholder="Cari No. Antrian" allowClear size="large" />
        </Form.Item>
      </TableHeader>

      <div className="mt-4">
        <GenericTable
          columns={columns}
          dataSource={queueData?.result || []}
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
              } else if (['RESERVED', 'REGISTERED'].includes(record.status)) {
                actions.push({
                  label: 'Panggil',
                  icon: <SoundOutlined />,
                  onClick: () => setCallConfirmModal({ open: true, record })
                })
              } else if (record.status === 'CALLED') {
                actions.push({
                  label: 'Konfirmasi Tujuan',
                  icon: <CheckCircleOutlined />,
                  type: 'primary',
                  onClick: () => setCallModal({ open: true, record })
                })
              } else if (record.status === 'TRIAGED') {
                actions.push({
                  label: 'Panggil ke Poli',
                  icon: <SoundOutlined />,
                  type: 'primary',
                  onClick: () => handleTriagedCallToPoli(record)
                })
              } else if (record.status === 'IN_PROGRESS') {
                actions.push(
                  {
                    label: 'Pulangkan',
                    icon: <CheckCircleOutlined />,
                    onClick: () => setDischargeModal({ open: true, record })
                  },
                  {
                    label: 'Rujuk',
                    icon: <FileTextOutlined />,
                    onClick: () => setReferralModal({ open: true, record })
                  },
                  {
                    label: 'Batal',
                    danger: true,
                    onClick: () => handleCancelEncounter(record)
                  }
                )
              }

              if (record.paymentMethod === 'bpjs' && record.patientId && !record.sepId) {
                actions.push({
                  label: 'Buat SEP',
                  icon: <FileTextOutlined />,
                  onClick: () => handleCreateSep(record)
                })
              }

              if (record.status === 'TRIAGE') {
                actions.push({
                  label: 'Triage Selesai',
                  icon: <CheckCircleOutlined />,
                  type: 'primary',
                  onClick: () => handleTriageDone(record)
                })
              }

              return actions
            }
          }}
        />
      </div>

      <CallConfirmationModal
        open={callConfirmModal.open}
        record={callConfirmModal.record}
        onClose={() => setCallConfirmModal({ open: false, record: undefined })}
        onSuccess={() => refetch()}
      />

      <CallQueueModal
        open={callModal.open}
        record={callModal.record}
        onClose={() => setCallModal({ open: false, record: undefined })}
        onSuccess={() => refetch()}
      />

      <ConfirmQueueModal
        open={confirmModal.open}
        queue={confirmModal.queue}
        onClose={() => setConfirmModal({ open: false, queue: undefined })}
        onSuccess={() => refetch()}
      />

      <DischargeModal
        open={dischargeModal.open}
        record={dischargeModal.record}
        onClose={() => setDischargeModal({ open: false, record: undefined })}
        onSuccess={() => refetch()}
      />

      <ReferralModal
        open={referralModal.open}
        record={referralModal.record}
        practitionerId={practitionerId}
        onClose={() => setReferralModal({ open: false, record: undefined })}
        onSuccess={() => refetch()}
      />
    </div>
  )
}
