import {
  CheckCircleOutlined,
  PhoneOutlined,
  PlusOutlined,
  ReloadOutlined,
  StopOutlined,
  SwapOutlined
} from '@ant-design/icons'
import VisitQueueForm from '@renderer/components/organisms/visit-management/VisitQueueForm'
import { client } from '@renderer/utils/client'
import {
  buildRegistrationServeSummary,
  type RegistrationServeContext,
  isRegistrationQueueServiceType
} from './registration-workflow'
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import { useMemo, useState } from 'react'
import { useActiveLokasiKerjaName } from './useActiveLokasiKerjaName'
import type { PatientAttributes } from '@shared/patient'

type TicketDto = {
  ticketId: string
  ticketNo: string
  sequenceNo: number
  queueDate: string
  serviceTypeCode: string
  status: string
  issuedAt?: string
}

type ServicePointDto = {
  id: number
  code: string
  name: string
  displayName?: string | null
  isActive: boolean
  currentTicket?: TicketDto | null
}

type BoardDto = {
  queueDate: string
  lokasiKerjaId: number
  serviceTypeCode: string
  serviceTypeName: string
  waitingTotal: number
  waitingTickets: TicketDto[]
  servicePoints: ServicePointDto[]
}

type QueueConfigDto = {
  id: number
  lokasiKerjaId: number
  serviceTypeCode: string
  serviceTypeName: string
  queuePrefix: string
  isActive: boolean
}

type NonMedicQueuePageProps = {
  title: string
  description: string
  serviceTypeCode: 'BILLING' | 'CASHIER' | 'PHARMACY' | 'REGISTRASI' | 'REGISTRASI_ASURANSI'
}

function NonMedicQueuePage({ title, description, serviceTypeCode }: NonMedicQueuePageProps) {
  const { message } = App.useApp()
  const { lokasiKerjaId, lokasiKerjaName } = useActiveLokasiKerjaName()
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false)
  const [registrationServeContext, setRegistrationServeContext] =
    useState<RegistrationServeContext | null>(null)
  const [registrationServePatient, setRegistrationServePatient] = useState<
    PatientAttributes | undefined
  >(undefined)
  const [createTicketForm] = Form.useForm()

  const configQuery = client.nonMedicQueue.getConfigs.useQuery(
    {
      lokasiKerjaId: lokasiKerjaId ?? 0,
      serviceTypeCode,
      isActive: true
    },
    {
      enabled: Boolean(lokasiKerjaId),
      queryKey: [
        'nonMedicQueue.configs',
        {
          lokasiKerjaId: lokasiKerjaId ?? 0,
          serviceTypeCode,
          isActive: true
        }
      ]
    }
  )

  const boardQuery = client.nonMedicQueue.getBoard.useQuery(
    {
      lokasiKerjaId: lokasiKerjaId ?? 0,
      serviceTypeCode,
      queueDate: selectedDate.format('YYYY-MM-DD')
    },
    {
      enabled: Boolean(lokasiKerjaId),
      queryKey: [
        'nonMedicQueue.board',
        {
          lokasiKerjaId: lokasiKerjaId ?? 0,
          serviceTypeCode,
          queueDate: selectedDate.format('YYYY-MM-DD')
        }
      ]
    }
  )

  const createTicketMutation = client.nonMedicQueue.createTicket.useMutation()
  const callNextMutation = client.nonMedicQueue.callNext.useMutation()
  const serveTicketMutation = client.nonMedicQueue.serveTicket.useMutation()
  const completeTicketMutation = client.nonMedicQueue.completeTicket.useMutation()
  const skipTicketMutation = client.nonMedicQueue.skipTicket.useMutation()
  const cancelTicketMutation = client.nonMedicQueue.cancelTicket.useMutation()

  const board = (boardQuery.data?.result as BoardDto | undefined) ?? null
  const activeConfig = ((configQuery.data?.result as QueueConfigDto[] | undefined) ?? [])[0] ?? null
  const hasActiveConfig = Boolean(activeConfig)
  const activeServicePoints =
    board?.servicePoints.filter((servicePoint) => servicePoint.currentTicket).length ?? 0
  const isRegistrationServiceType = isRegistrationQueueServiceType(serviceTypeCode)

  const waitingColumns: ColumnsType<TicketDto> = [
    {
      title: 'Nomor',
      dataIndex: 'ticketNo',
      key: 'ticketNo',
      render: (value: string) => <span className="font-semibold text-slate-900">{value}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value: string) => <Tag color={value === 'WAITING' ? 'gold' : 'blue'}>{value}</Tag>
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (_, record) => (
        <Space wrap>
          <Button
            size="small"
            icon={<SwapOutlined />}
            onClick={() =>
              handleTicketAction(
                () => skipTicketMutation.mutateAsync({ ticketId: record.ticketId }),
                'Tiket berhasil dilewati.'
              )
            }
            loading={skipTicketMutation.isPending}
          >
            Lewati
          </Button>
          <Button
            size="small"
            danger
            icon={<StopOutlined />}
            onClick={() =>
              handleTicketAction(
                () => cancelTicketMutation.mutateAsync({ ticketId: record.ticketId }),
                'Tiket berhasil dibatalkan.'
              )
            }
            loading={cancelTicketMutation.isPending}
          >
            Batal
          </Button>
        </Space>
      )
    }
  ]

  async function handleTicketAction(action: () => Promise<unknown>, successMessage: string) {
    try {
      await action()
      message.success(successMessage)
      await boardQuery.refetch()
    } catch (error: any) {
      message.error(error?.message ?? 'Aksi tiket gagal diproses.')
    }
  }

  function triggerSound(ticketNo: string) {
    message.success(`Memanggil antrian ${ticketNo}`)
    return ticketNo
  }

  async function handleCallNext(servicePointId: number) {
    try {
      await callNextMutation.mutateAsync({
        servicePointId,
        queueDate: selectedDate.format('YYYY-MM-DD')
      })
      // should call the code here
      // triggerSound(ticketNo)
      message.success('Nomor berikutnya berhasil dipanggil.')
      await boardQuery.refetch()
    } catch (error: any) {
      message.error(error?.message ?? 'Gagal memanggil nomor berikutnya.')
    }
  }

  function openRegistrationServeModal(ticket: TicketDto, servicePoint: ServicePointDto) {
    setRegistrationServePatient(undefined)
    setRegistrationServeContext({
      ticketId: ticket.ticketId,
      ticketNo: ticket.ticketNo,
      servicePointId: servicePoint.id,
      servicePointName: servicePoint.displayName || servicePoint.name
    })
  }

  async function handleServeRegistrationTicket(ticket: TicketDto, servicePoint: ServicePointDto) {
    try {
      await serveTicketMutation.mutateAsync({
        ticketId: ticket.ticketId
      })
      await boardQuery.refetch()
      openRegistrationServeModal(ticket, servicePoint)
      message.success('Tiket masuk proses pelayanan. Form antrian poli dibuka.')
    } catch (error: any) {
      message.error(error?.message ?? 'Gagal memulai pelayanan tiket pendaftaran.')
    }
  }

  function handleContinueRegistrationTicket(ticket: TicketDto, servicePoint: ServicePointDto) {
    openRegistrationServeModal(ticket, servicePoint)
  }

  async function handleCreateTicket() {
    if (!lokasiKerjaId) {
      message.error('Lokasi kerja aktif belum tersedia.')
      return
    }

    if (!hasActiveConfig) {
      message.error('Config antrian aktif belum tersedia untuk service type ini.')
      return
    }

    try {
      const response = await createTicketMutation.mutateAsync({
        lokasiKerjaId,
        serviceTypeCode,
        queueDate: selectedDate.format('YYYY-MM-DD'),
        sourceChannel: 'DESK'
      })

      setIsCreateTicketOpen(false)
      createTicketForm.resetFields()
      message.success(`Nomor ${response.result?.ticketNo ?? 'antrian'} berhasil dibuat.`)
      await boardQuery.refetch()
    } catch (error: any) {
      message.error(error?.message ?? 'Gagal membuat nomor antrian.')
    }
  }

  const servicePointCards = board?.servicePoints ?? []
  const registrationServeSummary = registrationServeContext
    ? buildRegistrationServeSummary(registrationServeContext)
    : null
  const defaultRegistrationPaymentMethod =
    serviceTypeCode === 'REGISTRASI_ASURANSI' ? 'INSURANCE' : 'CASH'

  console.log('servicePoint', servicePointCards)
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Typography.Title level={2} style={{ marginBottom: 0 }}>
            {title}
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            {description}
          </Typography.Paragraph>
          <Typography.Text type="secondary">Lokasi aktif: {lokasiKerjaName}</Typography.Text>
        </div>

        <Space wrap>
          <DatePicker
            value={selectedDate}
            onChange={(value) => value && setSelectedDate(value)}
            allowClear={false}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              void configQuery.refetch()
              void boardQuery.refetch()
            }}
            loading={boardQuery.isFetching || configQuery.isFetching}
            disabled={!lokasiKerjaId}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateTicketOpen(true)}
            disabled={!lokasiKerjaId || !hasActiveConfig}
          >
            Ambil Nomor
          </Button>
        </Space>
      </div>

      {!lokasiKerjaId ? (
        <Alert
          type="error"
          showIcon
          message="Lokasi kerja aktif belum ditemukan. Pilih module scope dengan lokasi kerja terlebih dahulu."
        />
      ) : null}

      {lokasiKerjaId && !hasActiveConfig ? (
        <Alert
          type="warning"
          showIcon
          message={`Config antrian aktif untuk ${serviceTypeCode} belum tersedia di lokasi kerja aktif.`}
        />
      ) : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Tanggal Antrian" value={selectedDate.format('DD MMM YYYY')} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Prefix" value={activeConfig?.queuePrefix ?? '-'} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Menunggu" value={board?.waitingTotal ?? 0} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Counter Aktif" value={activeServicePoints} />
          </Card>
        </Col>
      </Row>

      <Card
        title="Service Point"
        extra={
          board ? (
            <Tag color="blue">
              {board.serviceTypeName} • {board.queueDate}
            </Tag>
          ) : (
            <Tag color="default">{serviceTypeCode}</Tag>
          )
        }
      >
        {servicePointCards.length === 0 ? (
          <Empty description="Belum ada service point aktif untuk service type ini." />
        ) : (
          <Row gutter={[16, 16]}>
            {servicePointCards.map((servicePoint) => {
              const currentTicket = servicePoint.currentTicket ?? null
              return (
                <Col xs={24} md={12} xl={8} key={servicePoint.id}>
                  <Card
                    size="small"
                    title={servicePoint.displayName || servicePoint.name}
                    extra={<Tag>{servicePoint.code}</Tag>}
                  >
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      <div>
                        <Typography.Text type="secondary">Status counter</Typography.Text>
                        <div className="mt-1">
                          <Tag color={servicePoint.isActive ? 'green' : 'default'}>
                            {servicePoint.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </Tag>
                        </div>
                      </div>

                      {currentTicket ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <Typography.Text type="secondary">Tiket aktif</Typography.Text>
                          <div className="text-2xl font-semibold text-slate-900">
                            {currentTicket.ticketNo}
                          </div>
                          <Tag color={currentTicket.status === 'SERVING' ? 'green' : 'gold'}>
                            {currentTicket.status}
                          </Tag>
                        </div>
                      ) : (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description="Belum ada tiket aktif"
                        />
                      )}

                      <Space wrap>
                        {!currentTicket ? (
                          <Button
                            type="primary"
                            icon={<PhoneOutlined />}
                            onClick={() => handleCallNext(servicePoint.id)}
                            loading={callNextMutation.isPending}
                          >
                            Panggil Berikutnya
                          </Button>
                        ) : null}

                        {currentTicket?.status === 'CALLED' ? (
                          <>
                            <Button
                              icon={<CheckCircleOutlined />}
                              onClick={() => {
                                if (isRegistrationServiceType) {
                                  void handleServeRegistrationTicket(currentTicket, servicePoint)
                                  return
                                }

                                void handleTicketAction(
                                  () =>
                                    serveTicketMutation.mutateAsync({
                                      ticketId: currentTicket.ticketId
                                    }),
                                  'Tiket masuk proses pelayanan.'
                                )
                              }}
                              loading={serveTicketMutation.isPending}
                            >
                              Layani
                            </Button>
                            <Button
                              icon={<SwapOutlined />}
                              onClick={() =>
                                handleTicketAction(
                                  () =>
                                    skipTicketMutation.mutateAsync({
                                      ticketId: currentTicket.ticketId
                                    }),
                                  'Tiket berhasil dilewati.'
                                )
                              }
                              loading={skipTicketMutation.isPending}
                            >
                              Lewati
                            </Button>
                            <Button
                              danger
                              icon={<StopOutlined />}
                              onClick={() =>
                                handleTicketAction(
                                  () =>
                                    cancelTicketMutation.mutateAsync({
                                      ticketId: currentTicket.ticketId
                                    }),
                                  'Tiket berhasil dibatalkan.'
                                )
                              }
                              loading={cancelTicketMutation.isPending}
                            >
                              Batal
                            </Button>
                            <Button
                              onClick={() => triggerSound(currentTicket.ticketNo)}
                              icon={<PhoneOutlined />}
                            >
                              Panggil Lagi
                            </Button>
                          </>
                        ) : null}

                        {currentTicket?.status === 'SERVING' ? (
                          isRegistrationServiceType ? (
                            <Button
                              type="primary"
                              icon={<PlusOutlined />}
                              onClick={() =>
                                handleContinueRegistrationTicket(currentTicket, servicePoint)
                              }
                            >
                              Lanjutkan Form Poli
                            </Button>
                          ) : (
                            <Button
                              type="primary"
                              icon={<CheckCircleOutlined />}
                              onClick={() =>
                                handleTicketAction(
                                  () =>
                                    completeTicketMutation.mutateAsync({
                                      ticketId: currentTicket.ticketId
                                    }),
                                  'Pelayanan tiket berhasil diselesaikan.'
                                )
                              }
                              loading={completeTicketMutation.isPending}
                            >
                              Selesai
                            </Button>
                          )
                        ) : null}
                      </Space>
                    </Space>
                  </Card>
                </Col>
              )
            })}
          </Row>
        )}
      </Card>

      <Card title="Antrian Menunggu">
        <Table<TicketDto>
          rowKey="ticketId"
          dataSource={board?.waitingTickets ?? []}
          columns={waitingColumns}
          pagination={false}
          locale={{ emptyText: 'Tidak ada tiket yang menunggu.' }}
          loading={boardQuery.isLoading}
        />
      </Card>

      <Modal
        title={registrationServeSummary?.title || 'Buat Antrian Poli'}
        open={Boolean(registrationServeContext)}
        footer={null}
        destroyOnClose
        width={1000}
        onCancel={() => {
          setRegistrationServeContext(null)
          setRegistrationServePatient(undefined)
        }}
      >
        {registrationServeSummary ? (
          <div className="mb-4 flex flex-wrap gap-2">
            <Tag color="blue">{registrationServeSummary.ticketLabel}</Tag>
            {registrationServeSummary.servicePointLabel ? (
              <Tag>{registrationServeSummary.servicePointLabel}</Tag>
            ) : null}
          </div>
        ) : null}

        {registrationServeContext ? (
          <VisitQueueForm
            patient={registrationServePatient}
            onPatientChange={setRegistrationServePatient}
            showDate={false}
            showPatientLookup
            patientRequired
            successMessage={false}
            submitLabel="Buat Antrian Poli"
            cancelLabel="Tutup"
            defaultPaymentMethod={defaultRegistrationPaymentMethod}
            onCancel={() => {
              setRegistrationServeContext(null)
              setRegistrationServePatient(undefined)
            }}
            onSuccess={async () => {
              await completeTicketMutation.mutateAsync({
                ticketId: registrationServeContext.ticketId
              })
              await boardQuery.refetch()
              setRegistrationServeContext(null)
              setRegistrationServePatient(undefined)
              message.success(
                'Antrian poli berhasil dibuat dan tiket pendaftaran otomatis diselesaikan.'
              )
            }}
          />
        ) : null}
      </Modal>

      <Modal
        title="Buat Nomor Antrian"
        open={isCreateTicketOpen}
        onCancel={() => {
          setIsCreateTicketOpen(false)
          createTicketForm.resetFields()
        }}
        onOk={() => void handleCreateTicket()}
        okText="Buat Nomor"
        confirmLoading={createTicketMutation.isPending}
      >
        <Form form={createTicketForm} layout="vertical">
          <Form.Item label="Service Type">
            <Input value={serviceTypeCode} disabled />
          </Form.Item>
          <Form.Item label="Sumber Antrian">
            <Input value="DESK" disabled />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default NonMedicQueuePage
