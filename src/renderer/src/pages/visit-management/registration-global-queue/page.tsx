import {
  CheckCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  GlobalOutlined,
  SoundOutlined
} from '@ant-design/icons'
import { PatientInfoCard } from '@renderer/components/molecules/PatientInfoCard'
import GenericTable from '@renderer/components/organisms/GenericTable'
import CallConfirmationModal from '@renderer/components/organisms/visit-management/CallConfirmationModal'
import CallQueueModal from '@renderer/components/organisms/visit-management/CallQueueModal'
import ConfirmQueueModal from '@renderer/components/organisms/visit-management/ConfirmQueueModal'
import DischargeModal from '@renderer/components/organisms/visit-management/DischargeModal'
import ReferralModal from '@renderer/components/organisms/visit-management/ReferralModal'
import RegistrationQueueDetailModal from '@renderer/components/organisms/visit-management/RegistrationQueueDetailModal'
import { TableHeader } from '@renderer/components/TableHeader'
import { client } from '@renderer/utils/client'
import { App, Button, DatePicker, Form, Input, Modal, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'

import {
  getNextGlobalCallQueue,
  getNextGlobalConfirmQueue,
  sortQueuesByGlobalNumber
} from './global-header-next-queue'

type QueueRow = {
  id?: string
  queueId?: string
  formattedQueueNumber?: string
  queueNumber?: string | number
  globalQueueNumber?: number
  queueDate?: string
  createdAt?: string
  patientId?: string
  patientName?: string
  patientBirthDate?: string | Date
  patientMedicalRecordNumber?: string
  patientGender?: string
  poliName?: string
  serviceUnitName?: string
  doctorName?: string
  paymentMethod?: string
  status?: string
  noSep?: string
  sepStatus?: string
  sepId?: string
  encounterId?: string
}

const formatGlobalQueueNumber = (value?: number) =>
  typeof value === 'number' && Number.isFinite(value) ? String(value).padStart(3, '0') : '-'

const mapQueueRowToPatientInfoCardData = (record: QueueRow) => {
  const birthDate = record.patientBirthDate ? dayjs(record.patientBirthDate) : null
  const age = birthDate && birthDate.isValid() ? dayjs().diff(birthDate, 'year') : null

  return {
    patient: {
      medicalRecordNumber: record.patientMedicalRecordNumber || '-',
      name: record.patientName || 'Belum ada pasien',
      gender: record.patientGender || null,
      age
    },
    poli: {
      name: record.poliName || record.serviceUnitName || '-'
    },
    doctor: {
      name: record.doctorName || '-'
    },
    visitDate: record.createdAt || record.queueDate,
    paymentMethod: record.paymentMethod || 'Umum',
    status: record.status
  }
}

export default function RegistrationGlobalQueue() {
  const IS_DEVELOPMENT = window.env.NODE_ENV !== 'production'

  const [searchParams, setSearchParams] = useState({
    queueDate: dayjs().format('YYYY-MM-DD'),
    globalQueueNumber: ''
  })

  const [confirmModal, setConfirmModal] = useState<{ open: boolean; queue?: any }>({ open: false })
  const [callConfirmModal, setCallConfirmModal] = useState<{ open: boolean; record?: any }>({
    open: false
  })
  const [isConfirmActionPending, setIsConfirmActionPending] = useState(false)
  const [isCallActionPending, setIsCallActionPending] = useState(false)
  const [callModal, setCallModal] = useState<{ open: boolean; record?: any }>({ open: false })
  const [dischargeModal, setDischargeModal] = useState<{ open: boolean; record?: any }>({
    open: false
  })
  const [referralModal, setReferralModal] = useState<{ open: boolean; record?: any }>({
    open: false
  })
  const [detailModal, setDetailModal] = useState<{ open: boolean; record?: QueueRow }>({
    open: false
  })
  const [queueDetailModal, setQueueDetailModal] = useState<{ open: boolean; record?: QueueRow }>({
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
    status: [
      'PRE_RESERVED',
      'RESERVED',
      'REGISTERED',
      'SKIPPED',
      ...(IS_DEVELOPMENT ? ['CALLED'] : [])
    ]
  })
  const updateStatusMutation = client.registration.updateQueueStatus.useMutation()

  const queueRows = useMemo(
    () => sortQueuesByGlobalNumber((queueData?.result as QueueRow[] | undefined) || []),
    [queueData?.result]
  )

  const filteredQueueRows = useMemo(() => {
    const searchValue = searchParams.globalQueueNumber.trim()
    if (!searchValue) return queueRows

    return queueRows.filter(
      (queue) =>
        queue.globalQueueNumber != null && String(queue.globalQueueNumber).includes(searchValue)
    )
  }, [queueRows, searchParams.globalQueueNumber])

  const nextConfirmQueue = useMemo(
    () => getNextGlobalConfirmQueue(filteredQueueRows),
    [filteredQueueRows]
  )
  const nextCallQueue = useMemo(
    () => getNextGlobalCallQueue(filteredQueueRows),
    [filteredQueueRows]
  )

  const handleCreateSep = async (record: any) => {
    try {
      await updateStatusMutation.mutateAsync({
        queueId: record.queueId,
        action: 'CREATE_SEP'
      } as any)
      message.success('SEP Draft berhasil dibuat')
      refetch()
    } catch (error: any) {
      message.error(error.message || 'Gagal membuat SEP')
    }
  }

  const columns: ColumnsType<QueueRow> = [
    {
      title: 'No. Global',
      dataIndex: 'globalQueueNumber',
      key: 'globalQueueNumber',
      width: 120,
      render: (value) => <span className="font-bold text-lg">{formatGlobalQueueNumber(value)}</span>
    },
    {
      title: 'No. Poli',
      dataIndex: 'formattedQueueNumber',
      key: 'formattedQueueNumber',
      width: 120,
      render: (value) => <span className="text-slate-600">{value || '-'}</span>
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
          SKIPPED: 'red',
          CALLED: 'green',
          TRIAGE: 'volcano',
          TRIAGED: 'geekblue',
          IN_PROGRESS: 'purple',
          REGISTERED: 'cyan'
        }
        return <Tag color={colorMap[status || ''] ?? 'default'}>{status}</Tag>
      }
    },
    {
      title: 'Detail',
      key: 'detail',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={(event) => {
              event.stopPropagation()
              setDetailModal({ open: true, record })
            }}
          >
            Detail Pasien
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={(event) => {
              event.stopPropagation()
              setQueueDetailModal({ open: true, record })
            }}
          >
            Detail Antrian
          </Button>
        </div>
      )
    }
  ]

  const onSearch = (values: any) => {
    setSearchParams({
      queueDate: values.queueDate ? dayjs(values.queueDate).format('YYYY-MM-DD') : '',
      globalQueueNumber: values.globalQueueNumber || ''
    })
    refetch()
  }

  const openNextConfirmQueue = () => {
    if (!nextConfirmQueue) {
      message.info('Tidak ada antrian PRE_RESERVED yang siap dikonfirmasi.')
      return
    }

    setConfirmModal({ open: true, queue: nextConfirmQueue })
  }

  const openNextCallQueue = () => {
    if (!nextCallQueue) {
      message.info('Tidak ada antrian RESERVED atau REGISTERED yang siap dipanggil.')
      return
    }

    setCallConfirmModal({ open: true, record: nextCallQueue })
  }

  return (
    <div>
      <TableHeader
        title="Antrian Global Pendaftaran"
        icon={GlobalOutlined}
        subtitle="Manajemen seluruh antrian pendaftaran harian dengan nomor global."
        onSearch={onSearch}
        loading={isLoading || isRefetching}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={openNextConfirmQueue}
              disabled={!nextConfirmQueue}
              loading={isConfirmActionPending}
            >
              Konfirmasi Pasien Selanjutnya
            </Button>
            <Button
              type="primary"
              icon={<SoundOutlined />}
              onClick={openNextCallQueue}
              disabled={!nextCallQueue}
              loading={isCallActionPending}
            >
              Panggil Pasien Selanjutnya
            </Button>
          </div>
        }
      >
        <Form.Item name="queueDate" style={{ width: '100%' }} initialValue={dayjs()}>
          <DatePicker allowClear={false} size="large" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="globalQueueNumber" style={{ width: '100%' }}>
          <Input placeholder="Cari No. Antrian Global" allowClear size="large" />
        </Form.Item>
      </TableHeader>

      <div className="mt-4">
        <GenericTable
          columns={columns}
          dataSource={filteredQueueRows}
          rowKey="queueId"
          loading={isLoading || isRefetching || updateStatusMutation.isPending}
          action={{
            title: 'Aksi',
            width: 150,
            items: (record) => {
              const actions: any[] = []
              const status = record.status ?? ''

              if (status === 'PRE_RESERVED') {
                actions.push({
                  label: 'Panggil',
                  icon: <SoundOutlined />,
                  onClick: () => setConfirmModal({ open: true, queue: record })
                })
              } else if (['RESERVED', 'REGISTERED', 'SKIPPED'].includes(status)) {
                actions.push({
                  label: status === 'SKIPPED' ? 'Panggil Ulang' : 'Panggil',
                  icon: <SoundOutlined />,
                  onClick: () => setCallConfirmModal({ open: true, record })
                })
              } else if (IS_DEVELOPMENT && record.status === 'CALLED') {
                actions.push({
                  label: 'Konfirmasi Tujuan',
                  icon: <CheckCircleOutlined />,
                  onClick: () => setCallModal({ open: true, record })
                })
              }

              if (record.paymentMethod === 'bpjs' && record.patientId && !record.sepId) {
                actions.push({
                  label: 'Buat SEP',
                  icon: <FileTextOutlined />,
                  onClick: () => handleCreateSep(record)
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
        onPendingChange={setIsCallActionPending}
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
        onPendingChange={setIsConfirmActionPending}
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
        onClose={() => setReferralModal({ open: false, record: undefined })}
        onSuccess={() => refetch()}
      />

      <Modal
        open={detailModal.open}
        title="Detail Pasien"
        onCancel={() => setDetailModal({ open: false, record: undefined })}
        footer={null}
        width={920}
      >
        {detailModal.record ? (
          <PatientInfoCard
            patientData={mapQueueRowToPatientInfoCardData(detailModal.record)}
            sections={{ showIdentityNumber: false, showAllergies: false }}
          />
        ) : null}
      </Modal>

      <RegistrationQueueDetailModal
        open={queueDetailModal.open}
        record={queueDetailModal.record}
        onClose={() => setQueueDetailModal({ open: false, record: undefined })}
      />
    </div>
  )
}
