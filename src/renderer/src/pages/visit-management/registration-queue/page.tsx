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
import { IconCircleCheck, IconClipboardList, IconEye, IconVolume } from '@tabler/icons-react'
import { App, Button, DatePicker, Form, Input, Modal, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router'

import { ReloadOutlined, SoundOutlined } from '@ant-design/icons'
import { getNextCallQueue, getNextConfirmQueue } from './header-next-queue'

type QueueRow = {
  id?: string
  queueId?: string
  formattedQueueNumber?: string
  queueNumber?: string | number
  queueDate?: string
  createdAt?: string
  patientId?: string
  patientName?: string
  patientBirthDate?: string | Date
  patientMedicalRecordNumber?: string
  patientGender?: string
  practitionerId?: string | number
  poliCodeId?: string | number
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

export default function RegistrationQueue({
  practitionerId: propPractitionerId
}: {
  practitionerId?: string
}) {
  const IS_DEVELOPMENT = window.env.NODE_ENV !== 'production'
  const { practitionerId: urlPractitionerId } = useParams()
  const practitionerId = propPractitionerId || urlPractitionerId
  const activePractitionerId = practitionerId ? String(practitionerId) : ''

  const [searchParams, setSearchParams] = useState({
    queueDate: dayjs().format('YYYY-MM-DD'),
    queueNumber: ''
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
  const parsedQueueNumberFilter = useMemo(() => {
    const normalizedQueueNumber = searchParams.queueNumber.trim()
    return /^\d+$/.test(normalizedQueueNumber) ? Number(normalizedQueueNumber) : undefined
  }, [searchParams.queueNumber])

  const {
    data: queueData,
    isLoading,
    isRefetching,
    refetch
  } = client.registration.getQueues.useQuery({
    queueDate: searchParams.queueDate,
    queueNumber: parsedQueueNumberFilter,
    status: [
      'PRE_RESERVED',
      'RESERVED',
      'REGISTERED',
      'SKIPPED',
      ...(IS_DEVELOPMENT ? ['CALLED'] : [])
      // 'TRIAGE',
      // 'TRIAGED',
      // 'IN_PROGRESS'
    ],
    practitionerId: activePractitionerId ? Number(activePractitionerId) : undefined
  })

  const updateStatusMutation = client.registration.updateQueueStatus.useMutation()
  const queueRows = useMemo(() => queueData?.result || [], [queueData?.result])
  const filteredQueueRows = useMemo(() => {
    if (!activePractitionerId) return []

    const searchValue = searchParams.queueNumber.trim().toLowerCase()

    return queueRows.filter((row: QueueRow) => {
      if (String(row.practitionerId ?? '') !== activePractitionerId) {
        return false
      }

      if (!searchValue) return true

      const formattedQueueNumber = String(row.formattedQueueNumber ?? '').toLowerCase()
      const rawQueueNumber = String(row.queueNumber ?? '').toLowerCase()

      return (
        formattedQueueNumber.includes(searchValue) ||
        rawQueueNumber.includes(searchValue)
      )
    })
  }, [activePractitionerId, queueRows, searchParams.queueNumber])
  const nextConfirmQueue = useMemo(
    () => getNextConfirmQueue(filteredQueueRows),
    [filteredQueueRows]
  )
  const nextCallQueue = useMemo(() => getNextCallQueue(filteredQueueRows), [filteredQueueRows])

  // const handleCancelEncounter = (record: any) => {
  //   Modal.confirm({
  //     title: 'Batalkan Antrian',
  //     content: `Apakah Anda yakin ingin membatalkan antrian untuk ${record.patientName}?`,
  //     okText: 'Ya, Batalkan',
  //     okType: 'danger',
  //     cancelText: 'Tidak',
  //     onOk: async () => {
  //       try {
  //         await cancelEncounterMutation.mutateAsync({
  //           id: record.encounterId,
  //           reason: 'Dibatalkan oleh petugas pendaftaran'
  //         })
  //         message.success('Antrian berhasil dibatalkan')
  //         refetch()
  //       } catch (error: any) {
  //         message.error(error.message || 'Gagal membatalkan antrian')
  //       }
  //     }
  //   })
  // }

  // const handleTriagedCallToPoli = async (record: any) => {
  //   try {
  //     await updateStatusMutation.mutateAsync({ queueId: record.queueId, action: 'START_ENCOUNTER' })
  //     message.success(`Antrian ${record.formattedQueueNumber} dipanggil dan masuk Poli`)
  //     refetch()
  //   } catch (error: any) {
  //     message.error(error.message || 'Gagal memproses antrian')
  //   }
  // }

  const handleCreateSep = async (record: any) => {
    try {
      await updateStatusMutation.mutateAsync({ queueId: record.queueId, action: 'CREATE_SEP' })
      message.success('SEP Draft berhasil dibuat')
      refetch()
    } catch (error: any) {
      message.error(error.message || 'Gagal membuat SEP')
    }
  }

  // const handleTriageDone = async (record: any) => {
  //   try {
  //     await updateStatusMutation.mutateAsync({ queueId: record.queueId, action: 'TRIAGE_DONE' })
  //     message.success(`Status antrian ${record.formattedQueueNumber} diperbarui: TRIAGED`)
  //     refetch()
  //   } catch (error: any) {
  //     message.error(error.message || 'Gagal memperbarui status')
  //   }
  // }

  const columns: ColumnsType<QueueRow> = [
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
          SKIPPED: 'red',
          CALLED: 'green',
          TRIAGE: 'volcano',
          TRIAGED: 'geekblue',
          IN_PROGRESS: 'purple',
          REGISTERED: 'cyan'
        }
        return <Tag color={colorMap[status] ?? 'default'}>{status}</Tag>
      }
    },
    {
      title: 'Detail',
      key: 'detail',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <div className="flex gap-2">
          <Tooltip title="Detail Pasien">
            <Button
              type="link"
              size="small"
              icon={<IconEye size={20} />}
              onClick={(event) => {
                event.stopPropagation()
                setDetailModal({ open: true, record })
              }}
            />
          </Tooltip>
          <Tooltip title="Detail Antrian">
            <Button
              type="link"
              size="small"
              icon={<IconClipboardList size={20} color="violet" />}
              onClick={(event) => {
                event.stopPropagation()
                setQueueDetailModal({ open: true, record })
              }}
            />
          </Tooltip>
        </div>
      )
    }
  ]

  const onSearch = (values: any) => {
    setSearchParams({
      ...searchParams,
      queueDate: values.queueDate ? dayjs(values.queueDate).format('YYYY-MM-DD') : '',
      queueNumber: values.queueNumber || ''
    })
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
        title="Antrian Pendaftaran"
        subtitle="Manajemen antrian pendaftaran pasien"
        onSearch={onSearch}
        loading={isLoading || isRefetching}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
              loading={isRefetching}
            >
              Refresh
            </Button>
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
        <Form.Item name="queueNumber" style={{ width: '100%' }}>
          <Input placeholder="Cari No. Antrian" allowClear size="large" />
        </Form.Item>
      </TableHeader>

      <div className="mt-4">
        <GenericTable
          columns={columns}
          dataSource={filteredQueueRows}
          rowKey="queueId"
          loading={isLoading || isRefetching}
          action={{
            title: 'Aksi',
            width: 150,
            items: (record) => {
              const actions: any[] = []
              const status = record.status ?? ''

              if (status === 'PRE_RESERVED') {
                actions.push({
                  label: 'Panggil',
                  icon: <IconVolume size={16} />,
                  onClick: () => setConfirmModal({ open: true, queue: record })
                })
              } else if (['RESERVED', 'REGISTERED', 'SKIPPED'].includes(status)) {
                actions.push({
                  label: status === 'SKIPPED' ? 'Panggil Ulang' : 'Panggil',
                  icon: <IconVolume size={16} />,
                  onClick: () => setCallConfirmModal({ open: true, record })
                })
              } else if (IS_DEVELOPMENT && record.status === 'CALLED') {
                actions.push({
                  label: 'Konfirmasi Tujuan (dev mode)',
                  icon: <IconCircleCheck size={16} />,
                  onClick: () => setCallModal({ open: true, record })
                })
              }
              // } else if (record.status === 'TRIAGED') {
              //   actions.push({
              //     label: 'Panggil ke Poli',
              //     icon: <IconVolume size={16} />,
              //     type: 'primary',
              //     onClick: () => handleTriagedCallToPoli(record)
              //   })
              // } else if (record.status === 'IN_PROGRESS') {
              //   actions.push(
              //     {
              //       label: 'Pulangkan',
              //       icon: <IconCircleCheck size={16} />,
              //       onClick: () => setDischargeModal({ open: true, record })
              //     },
              //     {
              //       label: 'Rujuk',
              //       icon: <IconClipboardList size={16} />,
              //       onClick: () => setReferralModal({ open: true, record })
              //     },
              //     {
              //       label: 'Batal',
              //       danger: true,
              //       onClick: () => handleCancelEncounter(record)
              //     }
              //   )
              // }

              if (record.paymentMethod === 'bpjs' && record.patientId && !record.sepId) {
                actions.push({
                  label: 'Buat SEP',
                  icon: <IconClipboardList size={16} />,
                  onClick: () => handleCreateSep(record)
                })
              }

              // only nurse can confirm triage action
              // if (record.status === 'TRIAGE') {
              //   actions.push({
              //     label: 'Triage Selesai',
              //     icon: <IconCircleCheck size={16} />,
              //     type: 'primary',
              //     onClick: () => handleTriageDone(record)
              //   })
              // }

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
        practitionerId={practitionerId}
        onClose={() => setReferralModal({ open: false, record: undefined })}
        onSuccess={() => refetch()}
      />

      <Modal
        open={detailModal.open}
        title="Detail Pasien"
        onCancel={() => setDetailModal({ open: false, record: undefined })}
        footer={null}
        // destroyOnClose
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
