import { CheckCircleOutlined, FileTextOutlined, SoundOutlined } from '@ant-design/icons'
import GenericTable from '@renderer/components/organisms/GenericTable'
import { TableHeader } from '@renderer/components/TableHeader'
import { client } from '@renderer/utils/client'
import { App, Button, DatePicker, Form, Input, Modal, Select, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import ConfirmQueueModal from './components/ConfirmQueueModal'

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
  const { message } = App.useApp()
  const [dischargeForm] = Form.useForm()
  const [referralForm] = Form.useForm()

  const referralType = Form.useWatch('referralType', referralForm)
  const referralDate = Form.useWatch('date', referralForm)
  const targetPoliId = Form.useWatch('targetDepartemenId', referralForm)

  const allSchedulesQuery = client.registration.getAvailableDoctors.useQuery(
    {
      date: referralDate ? dayjs(referralDate).format('YYYY-MM-DD') : undefined
    },
    {
      enabled: referralType === 'internal' && !!referralDate,
      queryKey: ['availableDoctors_all_referral', { date: referralDate }]
    }
  )

  const poliOptions = useMemo(() => {
    const data = allSchedulesQuery.data as any
    const doctors = data?.result?.doctors || data?.data?.doctors || data?.doctors || []

    // Extract unique poli from doctors
    const polisMap = new Map()
    doctors.forEach((d: any) => {
      if (d.poliId && d.poliName) {
        polisMap.set(d.poliId, d.poliName)
      }
    })

    return Array.from(polisMap.entries()).map(([id, name]) => ({
      value: id,
      label: name
    }))
  }, [allSchedulesQuery.data])

  const internalDoctorsQuery = client.registration.getAvailableDoctors.useQuery(
    {
      date: referralDate ? dayjs(referralDate).format('YYYY-MM-DD') : undefined,
      poliId: targetPoliId ? Number(targetPoliId) : undefined
    },
    {
      enabled: referralType === 'internal' && !!referralDate && !!targetPoliId,
      queryKey: ['availableDoctors_referral', { date: referralDate, poliId: targetPoliId }]
    }
  )

  const internalDoctorOptions = useMemo(() => {
    const data = internalDoctorsQuery.data as any
    const doctors = data?.result?.doctors || data?.data?.doctors || data?.doctors || []
    return doctors.map((d: any) => ({
      value: d.doctorScheduleId, // Need the schedule ID for queue creation
      label: `${d.doctorName}${d.timeSlot ? ` (${d.timeSlot.startTime} - ${d.timeSlot.endTime})` : ''}`
    }))
  }, [internalDoctorsQuery.data])

  useEffect(() => {
    referralForm.setFieldValue('targetDepartemenId', undefined)
    referralForm.setFieldValue('doctorScheduleId', undefined)
  }, [referralDate, referralForm])

  useEffect(() => {
    referralForm.setFieldValue('doctorScheduleId', undefined)
  }, [targetPoliId, referralForm])

  const {
    data: queueData,
    isLoading,
    isRefetching,
    refetch
  } = client.registration.getQueues.useQuery({
    queueDate: searchParams.queueDate,
    queueNumber: searchParams.queueNumber ? Number(searchParams.queueNumber) : undefined,
    status: ['PRE_RESERVED', 'RESERVED', 'REGISTERED', 'TRIAGE', 'TRIAGED', 'IN_PROGRESS'],
    practitionerId: searchParams.practitionerId ? Number(searchParams.practitionerId) : undefined
  })

  const updateStatusMutation = client.registration.updateQueueStatus.useMutation()
  const dischargeMutation = client.registration.dischargeEncounter.useMutation()
  const cancelEncounterMutation = client.registration.cancelEncounter.useMutation()
  const referMutation = client.registration.referPatient.useMutation()

  const [callModal, setCallModal] = useState<{ open: boolean; record?: any }>({ open: false })
  const [dischargeModal, setDischargeModal] = useState<{ open: boolean; record?: any }>({
    open: false
  })
  const [referralModal, setReferralModal] = useState<{ open: boolean; record?: any }>({
    open: false
  })

  const handleCallClick = (record: any) => {
    setCallModal({ open: true, record })
  }

  const handleCancelEncounter = async (record: any) => {
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

  const handleProcessCall = async (withTriage: boolean, recordToProcess?: any) => {
    const record = recordToProcess || callModal.record
    if (!record) return

    try {
      if (withTriage) {
        // Status becomes TRIAGE
        await updateStatusMutation.mutateAsync({
          queueId: record.queueId,
          action: 'CALL_TO_TRIAGE'
        })
        message.success(`Antrian ${record.formattedQueueNumber} dipanggil ke Triage`)
      } else {
        // Direct to Poli -> Start Encounter (Status IN_PROGRESS)
        await updateStatusMutation.mutateAsync({
          queueId: record.queueId,
          action: 'START_ENCOUNTER'
        })
        message.success(`Antrian ${record.formattedQueueNumber} dipanggil dan masuk Poli`)
      }
      refetch()
      setCallModal({ open: false, record: undefined })
    } catch (error: any) {
      console.log(error)
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
        let color = 'default'
        if (method === 'bpjs') color = 'blue'
        if (method === 'cash') color = 'green'
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
        if (record.noSep) {
          return <Tag color="cyan">{record.noSep}</Tag>
        }
        if (record.sepStatus === 'draft') {
          return <Tag color="orange">Draft SEP</Tag>
        }
        if (record.paymentMethod === 'bpjs') {
          return <span className="text-gray-400 italic text-xs">Belum ada SEP</span>
        }
        return null
      }
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
        if (status === 'TRIAGE') color = 'volcano'
        if (status === 'TRIAGED') color = 'geekblue'
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
              } else if (['RESERVED', 'REGISTERED', 'CALLED', 'TRIAGE'].includes(record.status)) {
                // Allow calling if reserved/registered/triage, or recalling
                actions.push({
                  label: 'Panggil',
                  icon: <SoundOutlined />,
                  onClick: () => handleCallClick(record)
                })
              } else if (record.status === 'TRIAGED') {
                actions.push({
                  label: 'Panggil ke Poli',
                  icon: <SoundOutlined />,
                  type: 'primary',
                  onClick: () => handleProcessCall(false, record)
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
                  onClick: async () => {
                    try {
                      await updateStatusMutation.mutateAsync({
                        queueId: record.queueId,
                        action: 'CREATE_SEP'
                      })
                      message.success('SEP Draft berhasil dibuat')
                      refetch()
                    } catch (error: any) {
                      message.error(error.message || 'Gagal membuat SEP')
                    }
                  }
                })
              }

              if (record.status === 'TRIAGE') {
                actions.push({
                  label: 'Triage Selesai',
                  icon: <CheckCircleOutlined />,
                  type: 'primary',
                  onClick: async () => {
                    try {
                      await updateStatusMutation.mutateAsync({
                        queueId: record.queueId,
                        action: 'TRIAGE_DONE'
                      })
                      message.success(
                        `Status antrian ${record.formattedQueueNumber} diperbarui: TRIAGED`
                      )
                      refetch()
                    } catch (error: any) {
                      message.error(error.message || 'Gagal memperbarui status')
                    }
                  }
                })
              }

              return actions
            }
          }}
        />
      </div>

      <Modal
        title="Konfirmasi Panggilan"
        open={callModal.open}
        onCancel={() => setCallModal({ open: false, record: undefined })}
        footer={[
          <Button key="cancel" onClick={() => setCallModal({ open: false, record: undefined })}>
            Batal
          </Button>,
          <Button key="triage" onClick={() => handleProcessCall(true)}>
            Ke Pemeriksaan Awal{' '}
          </Button>,
          <Button key="poli" type="primary" onClick={() => handleProcessCall(false)}>
            Langsung ke Poli
          </Button>
        ]}
      >
        <p>
          Pasien: <b>{callModal.record?.patientName}</b>
        </p>
        <p>
          No. Antrian: <b>{callModal.record?.formattedQueueNumber}</b>
        </p>
        <p>Apakah pasien memerlukan pemeriksaan Triage terlebih dahulu?</p>
      </Modal>

      <ConfirmQueueModal
        open={confirmModal.open}
        queue={confirmModal.queue}
        onClose={() => setConfirmModal({ open: false, queue: undefined })}
        onSuccess={() => refetch()}
      />

      <Modal
        title="Pulangkan Pasien"
        open={dischargeModal.open}
        onCancel={() => setDischargeModal({ open: false, record: undefined })}
        onOk={() => {
          dischargeForm.submit()
        }}
        destroyOnClose
      >
        <Form
          form={dischargeForm}
          layout="vertical"
          onFinish={async (values) => {
            try {
              await dischargeMutation.mutateAsync({
                id: dischargeModal.record.encounterId,
                dischargeDisposition: values.dischargeDisposition,
                dischargeNote: values.dischargeNote
              })
              message.success('Pasien berhasil dipulangkan')
              setDischargeModal({ open: false, record: undefined })
              refetch()
            } catch (error: any) {
              message.error(error.message || 'Gagal memulangkan pasien')
            }
          }}
        >
          <p>
            Pasien: <b>{dischargeModal.record?.patientName}</b>
          </p>
          <Form.Item
            name="dischargeDisposition"
            label="Disposisi"
            rules={[{ required: true, message: 'Harap pilih disposisi' }]}
          >
            <Select placeholder="Pilih disposisi" allowClear>
              <Select.Option value="home">Pulang ke Rumah</Select.Option>
              <Select.Option value="alt-home">Rumah Keluarga/Lainnya</Select.Option>
              <Select.Option value="other-hcf">Fasilitas Kesehatan Lainnya</Select.Option>
              <Select.Option value="hosp">Hospice/Paliatif</Select.Option>
              <Select.Option value="long">Layanan Jangka Panjang</Select.Option>
              <Select.Option value="aadvice">Atas Permintaan Sendiri (APS)</Select.Option>
              <Select.Option value="exp">Meninggal</Select.Option>
              <Select.Option value="psy">RS Jiwa</Select.Option>
              <Select.Option value="rehab">Rehabilitasi</Select.Option>
              <Select.Option value="snf">Layanan Perawatan Mahir</Select.Option>
              <Select.Option value="oth">Lainnya</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="dischargeNote" label="Catatan Pulang">
            <Input.TextArea placeholder="Tambahkan catatan jika perlu" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Rujuk Pasien"
        open={referralModal.open}
        onCancel={() => setReferralModal({ open: false, record: undefined })}
        onOk={() => {
          referralForm.submit()
        }}
        width={600}
        destroyOnClose
      >
        <Form
          form={referralForm}
          layout="vertical"
          onFinish={async (values) => {
            try {
              await referMutation.mutateAsync({
                encounterId: referralModal.record?.encounterId,
                referringPractitionerId: Number(practitionerId),
                referringPractitionerName: 'Petugas Pendaftaran', // Simplified
                direction: 'outgoing',
                referralType: values.referralType,
                referralDate: values.date ? values.date.toISOString() : new Date().toISOString(),
                diagnosisCode: values.diagnosisCode,
                diagnosisText: values.diagnosisText,
                keadaanKirim: values.keadaanKirim,
                reasonForReferral: values.reasonForReferral,
                targetOrganizationName:
                  values.referralType === 'internal'
                    ? 'RS Internal'
                    : values.targetOrganizationName,
                targetDepartemenId:
                  values.referralType === 'internal'
                    ? Number(values.targetDepartemenId)
                    : undefined,
                doctorScheduleId:
                  values.referralType === 'internal' ? values.doctorScheduleId : undefined,
                targetPractitionerName:
                  values.referralType === 'external' ? values.targetPractitionerName : undefined
              })
              message.success('Pasien berhasil dirujuk')
              setReferralModal({ open: false, record: undefined })
              refetch()
            } catch (error: any) {
              console.log(error)
              message.error(error.message || 'Gagal merujuk pasien')
            }
          }}
          initialValues={{ referralType: 'internal' }}
        >
          <p>
            Pasien: <b>{referralModal.record?.patientName}</b>
          </p>
          <Form.Item
            name="referralType"
            label="Jenis Rujukan"
            rules={[{ required: true, message: 'Harap pilih jenis rujukan' }]}
          >
            <Select style={{ width: '100%' }}>
              <Select.Option value="internal">Internal (Antar Poli)</Select.Option>
              <Select.Option value="external">External (RS Lain)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="date"
            label="Tanggal Rujukan"
            rules={[{ required: true, message: 'Harap pilih tanggal' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          {referralType === 'internal' && (
            <>
              <Form.Item
                name="targetDepartemenId"
                label="Poli Tujuan"
                rules={[{ required: true, message: 'Harap pilih poli tujuan' }]}
              >
                <Select
                  placeholder="Pilih Poli"
                  options={poliOptions}
                  loading={allSchedulesQuery.isLoading || allSchedulesQuery.isRefetching}
                  disabled={!referralDate}
                />
              </Form.Item>
              <Form.Item
                name="doctorScheduleId"
                label="Jadwal Dokter Tujuan"
                rules={[{ required: true, message: 'Harap pilih jadwal dokter' }]}
              >
                <Select
                  placeholder="Pilih Dokter & Jam"
                  options={internalDoctorOptions}
                  loading={internalDoctorsQuery.isLoading}
                />
              </Form.Item>
            </>
          )}

          {referralType === 'external' && (
            <>
              <Form.Item
                name="targetOrganizationName"
                label="Faskes Tujuan"
                rules={[{ required: true, message: 'Harap isi faskes tujuan' }]}
              >
                <Input placeholder="Nama RS Tujuan" />
              </Form.Item>
              <Form.Item name="targetPractitionerName" label="Dokter Tujuan">
                <Input placeholder="Nama Dokter (jika ada)" />
              </Form.Item>
            </>
          )}

          <Form.Item
            name="diagnosisText"
            label="Diagnosis"
            rules={[{ required: true, message: 'Harap isi diagnosis' }]}
          >
            <Input.TextArea placeholder="Diagnosis pasien" />
          </Form.Item>
          <Form.Item name="keadaanKirim" label="Keadaan Saat Kirim">
            <Input.TextArea placeholder="Keadaan Saat Kirim" />
          </Form.Item>
          <Form.Item
            name="reasonForReferral"
            label="Alasan Rujukan"
            rules={[{ required: true, message: 'Harap isi alasan rujukan' }]}
          >
            <Input.TextArea placeholder="Alasan merujuk pasien" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
