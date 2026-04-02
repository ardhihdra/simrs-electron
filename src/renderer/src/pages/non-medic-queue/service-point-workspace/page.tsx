import {
    CheckCircleOutlined,
    PhoneOutlined,
    ReloadOutlined,
    StopOutlined,
    SwapOutlined,
} from '@ant-design/icons'
import { client } from '@renderer/utils/client'
import { Alert, App, Button, Card, Col, DatePicker, Empty, Row, Select, Space, Statistic, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useActiveLokasiKerjaName } from '../useActiveLokasiKerjaName'

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
    lokasiKerjaId: number
    serviceTypeCode: string
    serviceTypeName: string
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

function NonMedicQueueServicePointWorkspacePage() {
    const { message } = App.useApp()
    const navigate = useNavigate()
    const { lokasiKerjaId, lokasiKerjaName } = useActiveLokasiKerjaName()
    const { servicePointId } = useParams()
    const parsedServicePointId = servicePointId ? Number(servicePointId) : NaN
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
    const [selectedServicePointId, setSelectedServicePointId] = useState<number | undefined>(
        Number.isFinite(parsedServicePointId) ? parsedServicePointId : undefined
    )

    const servicePointQuery = client.nonMedicQueue.getServicePoints.useQuery(
        {
            lokasiKerjaId: lokasiKerjaId ?? 0,
        },
        {
            enabled: Boolean(lokasiKerjaId),
            queryKey: [
                'nonMedicQueue.servicePointWorkspace.servicePoints',
                {
                    lokasiKerjaId: lokasiKerjaId ?? 0,
                },
            ],
        }
    )

    const allServicePoints = (servicePointQuery.data?.result as ServicePointDto[] | undefined) ?? []
    const effectiveServicePointId = Number.isFinite(parsedServicePointId)
        ? parsedServicePointId
        : selectedServicePointId
    const currentServicePoint = useMemo(
        () => allServicePoints.find((item) => item.id === effectiveServicePointId) ?? null,
        [allServicePoints, effectiveServicePointId]
    )

    useEffect(() => {
        if (Number.isFinite(parsedServicePointId)) {
            setSelectedServicePointId(parsedServicePointId)
            return
        }

        if (!selectedServicePointId && allServicePoints.length > 0) {
            setSelectedServicePointId(allServicePoints[0]?.id)
        }
    }, [allServicePoints, parsedServicePointId, selectedServicePointId])

    const boardQuery = client.nonMedicQueue.getBoard.useQuery(
        {
            lokasiKerjaId: lokasiKerjaId ?? 0,
            serviceTypeCode: currentServicePoint?.serviceTypeCode ?? '',
            queueDate: selectedDate.format('YYYY-MM-DD'),
        },
        {
            enabled: Boolean(lokasiKerjaId && currentServicePoint?.serviceTypeCode),
            queryKey: [
                'nonMedicQueue.servicePointWorkspace.board',
                {
                    lokasiKerjaId: lokasiKerjaId ?? 0,
                    serviceTypeCode: currentServicePoint?.serviceTypeCode ?? '',
                    queueDate: selectedDate.format('YYYY-MM-DD'),
                },
            ],
        }
    )

    const callNextMutation = client.nonMedicQueue.callNext.useMutation()
    const serveTicketMutation = client.nonMedicQueue.serveTicket.useMutation()
    const completeTicketMutation = client.nonMedicQueue.completeTicket.useMutation()
    const skipTicketMutation = client.nonMedicQueue.skipTicket.useMutation()
    const cancelTicketMutation = client.nonMedicQueue.cancelTicket.useMutation()

    const board = (boardQuery.data?.result as BoardDto | undefined) ?? null
    const servicePointFromBoard =
        board?.servicePoints.find((item) => item.id === effectiveServicePointId) ??
        currentServicePoint
    const currentTicket = servicePointFromBoard?.currentTicket ?? null

    const waitingColumns: ColumnsType<TicketDto> = [
        {
            title: 'Nomor',
            dataIndex: 'ticketNo',
            key: 'ticketNo',
            render: (value: string) => <span className="font-semibold text-slate-900">{value}</span>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (value: string) => <Tag color={value === 'WAITING' ? 'gold' : 'blue'}>{value}</Tag>,
        },
    ]

    async function refreshAll() {
        await Promise.all([servicePointQuery.refetch(), boardQuery.refetch()])
    }

    async function handleTicketAction(action: () => Promise<unknown>, successMessage: string) {
        try {
            await action()
            message.success(successMessage)
            await refreshAll()
        } catch (error: any) {
            message.error(error?.message ?? 'Aksi tiket gagal diproses.')
        }
    }

    async function handleCallNext() {
        if (!Number.isFinite(parsedServicePointId)) {
            if (!selectedServicePointId) {
                message.error('Pilih service point terlebih dahulu.')
                return
            }
        }

        const targetServicePointId = Number.isFinite(parsedServicePointId) ? parsedServicePointId : selectedServicePointId

        if (!targetServicePointId) {
            message.error('Service point tidak valid.')
            return
        }

        try {
            await callNextMutation.mutateAsync({
                servicePointId: targetServicePointId,
                queueDate: selectedDate.format('YYYY-MM-DD'),
            })
            message.success('Nomor berikutnya berhasil dipanggil.')
            await refreshAll()
        } catch (error: any) {
            message.error(error?.message ?? 'Gagal memanggil nomor berikutnya.')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <Typography.Title level={2} style={{ marginBottom: 0 }}>
                        Workspace Service Point
                    </Typography.Title>
                    <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                        Halaman operasional counter untuk pemanggilan dan pelayanan antrean non-medis.
                    </Typography.Paragraph>
                </div>

                <Space wrap>
                    <Select
                        placeholder="Pilih service point"
                        value={effectiveServicePointId}
                        onChange={(nextId) => {
                            setSelectedServicePointId(nextId)
                            navigate(`/dashboard/non-medic-queue/service-points/${nextId}/workspace`)
                        }}
                        options={allServicePoints.map((item) => ({
                            label: `${item.displayName || item.name} - ${item.serviceTypeCode}`,
                            value: item.id,
                        }))}
                        style={{ minWidth: 260 }}
                        disabled={!allServicePoints.length}
                    />
                    <DatePicker
                        value={selectedDate}
                        onChange={(value) => value && setSelectedDate(value)}
                        allowClear={false}
                    />
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => void refreshAll()}
                        loading={servicePointQuery.isFetching || boardQuery.isFetching}
                        disabled={!lokasiKerjaId || !effectiveServicePointId}
                    >
                        Refresh
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

            {lokasiKerjaId && !effectiveServicePointId ? (
                <Alert
                    type="warning"
                    showIcon
                    message="Pilih service point terlebih dahulu untuk membuka workspace counter."
                />
            ) : null}

            {lokasiKerjaId && effectiveServicePointId && !currentServicePoint ? (
                <Alert
                    type="warning"
                    showIcon
                    message="Service point tidak ditemukan di lokasi kerja aktif."
                />
            ) : null}

            <Row gutter={[16, 16]}>
                <Col xs={24} md={6}>
                    <Card>
                        <Statistic
                            title="Lokasi Aktif"
                            value={lokasiKerjaName}
                        />
                    </Card>
                </Col>
                <Col xs={24} md={6}>
                    <Card>
                        <Statistic
                            title="Service Point Kamu"
                            value={servicePointFromBoard?.displayName || servicePointFromBoard?.name || '-'}
                        />
                        <Typography.Text type="secondary">
                            {servicePointFromBoard?.code ? `Code: ${servicePointFromBoard.code}` : 'Belum dipilih'}
                        </Typography.Text>
                    </Card>
                </Col>
                <Col xs={24} md={6}>
                    <Card>
                        <Statistic title="Service Type" value={servicePointFromBoard?.serviceTypeCode ?? '-'} />
                    </Card>
                </Col>
                <Col xs={24} md={6}>
                    <Card>
                        <Statistic title="Sisa Antrian" value={board?.waitingTotal ?? 0} />
                    </Card>
                </Col>
            </Row>

            <Card
                title="Status Counter"
                extra={
                    servicePointFromBoard ? (
                        <Tag color={servicePointFromBoard.isActive ? 'green' : 'default'}>
                            {servicePointFromBoard.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </Tag>
                    ) : null
                }
            >
                {!servicePointFromBoard ? (
                    <Empty description="Service point belum tersedia." />
                ) : (
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        {currentTicket ? (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <Typography.Text type="secondary">Tiket Aktif</Typography.Text>
                                <div className="mt-2 text-3xl font-semibold text-slate-900">
                                    {currentTicket.ticketNo}
                                </div>
                                <Tag color={currentTicket.status === 'SERVING' ? 'green' : 'gold'}>
                                    {currentTicket.status}
                                </Tag>
                            </div>
                        ) : (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Belum ada tiket aktif di counter ini." />
                        )}

                        <Space wrap>
                            {!currentTicket ? (
                                <Button
                                    type="primary"
                                    icon={<PhoneOutlined />}
                                    onClick={() => void handleCallNext()}
                                    loading={callNextMutation.isPending}
                                    disabled={!servicePointFromBoard.isActive}
                                >
                                    Panggil Berikutnya
                                </Button>
                            ) : null}

                            {currentTicket?.status === 'CALLED' ? (
                                <>
                                    <Button
                                        icon={<CheckCircleOutlined />}
                                        onClick={() =>
                                            void handleTicketAction(
                                                () => serveTicketMutation.mutateAsync({ ticketId: currentTicket.ticketId }),
                                                'Tiket masuk proses pelayanan.'
                                            )
                                        }
                                        loading={serveTicketMutation.isPending}
                                    >
                                        Layani
                                    </Button>
                                    <Button
                                        icon={<SwapOutlined />}
                                        onClick={() =>
                                            void handleTicketAction(
                                                () => skipTicketMutation.mutateAsync({ ticketId: currentTicket.ticketId }),
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
                                            void handleTicketAction(
                                                () => cancelTicketMutation.mutateAsync({ ticketId: currentTicket.ticketId }),
                                                'Tiket berhasil dibatalkan.'
                                            )
                                        }
                                        loading={cancelTicketMutation.isPending}
                                    >
                                        Batal
                                    </Button>
                                </>
                            ) : null}

                            {currentTicket?.status === 'SERVING' ? (
                                <Button
                                    type="primary"
                                    icon={<CheckCircleOutlined />}
                                    onClick={() =>
                                        void handleTicketAction(
                                            () => completeTicketMutation.mutateAsync({ ticketId: currentTicket.ticketId }),
                                            'Pelayanan tiket berhasil diselesaikan.'
                                        )
                                    }
                                    loading={completeTicketMutation.isPending}
                                >
                                    Selesai
                                </Button>
                            ) : null}
                        </Space>
                    </Space>
                )}
            </Card>

            <Card title="Antrian Tersisa">
                <Table<TicketDto>
                    rowKey="ticketId"
                    dataSource={board?.waitingTickets ?? []}
                    columns={waitingColumns}
                    pagination={false}
                    locale={{ emptyText: 'Tidak ada antrian tersisa.' }}
                    loading={boardQuery.isLoading}
                />
            </Card>
        </div>
    )
}

export default NonMedicQueueServicePointWorkspacePage
