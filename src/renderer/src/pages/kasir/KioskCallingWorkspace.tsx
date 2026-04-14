import {
  CheckCircleOutlined,
  EyeOutlined,
  PhoneOutlined,
  ReloadOutlined,
  StopOutlined,
  SwapOutlined,
  UnorderedListOutlined
} from '@ant-design/icons'
import { client } from '@renderer/utils/client'
import {
  App,
  Button,
  DatePicker,
  Row,
  Space,
  Tag,
  Typography,
  Badge,
  Popover,
  Table,
  Divider,
  Col,
  Segmented,
  Tooltip
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { Dayjs } from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useActiveLokasiKerjaName } from '../non-medic-queue/useActiveLokasiKerjaName'

const { Text } = Typography

type TicketDto = {
  ticketId: string
  ticketNo: string
  sequenceNo: number
  queueDate: string
  serviceTypeCode: string
  status: string
  issuedAt?: string
  encounterId?: string | null
  patientId?: string | null
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

export default function KioskCallingWorkspace() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { lokasiKerjaId } = useActiveLokasiKerjaName()

  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [selectedServicePointId, setSelectedServicePointId] = useState<number | undefined>(undefined)

  // --- Kiosk Queue Queries & Mutations ---
  const servicePointQuery = client.nonMedicQueue.getServicePoints.useQuery(
    {
      lokasiKerjaId: lokasiKerjaId ?? 0
    },
    {
      enabled: Boolean(lokasiKerjaId),
      queryKey: [
        'nonMedicQueue.kasirWorkspace.servicePoints',
        {
          lokasiKerjaId: lokasiKerjaId ?? 0
        }
      ]
    }
  )

  const allServicePoints = (servicePointQuery.data?.result as ServicePointDto[] | undefined) ?? []
  const relevantServicePoints = useMemo(
    () => allServicePoints
      .filter((sp) => ['CASHIER', 'BILLING'].includes(sp.serviceTypeCode))
      .sort((a, b) => {
        if (a.serviceTypeCode === 'BILLING' && b.serviceTypeCode === 'CASHIER') return -1
        if (a.serviceTypeCode === 'CASHIER' && b.serviceTypeCode === 'BILLING') return 1
        return a.name.localeCompare(b.name)
      }),
    [allServicePoints]
  )

  const currentServicePoint = useMemo(
    () => relevantServicePoints.find((item) => item.id === selectedServicePointId) ?? null,
    [relevantServicePoints, selectedServicePointId]
  )

  useEffect(() => {
    if (!selectedServicePointId && relevantServicePoints.length > 0) {
      setSelectedServicePointId(relevantServicePoints[0].id)
    }
  }, [relevantServicePoints, selectedServicePointId])

  const boardQuery = client.nonMedicQueue.getBoard.useQuery(
    {
      lokasiKerjaId: lokasiKerjaId ?? 0,
      serviceTypeCode: currentServicePoint?.serviceTypeCode ?? '',
      queueDate: selectedDate.format('YYYY-MM-DD')
    },
    {
      enabled: Boolean(lokasiKerjaId && currentServicePoint?.serviceTypeCode),
      queryKey: [
        'nonMedicQueue.kasirWorkspace.board',
        {
          lokasiKerjaId: lokasiKerjaId ?? 0,
          serviceTypeCode: currentServicePoint?.serviceTypeCode ?? '',
          queueDate: selectedDate.format('YYYY-MM-DD')
        }
      ]
    }
  )

  const callNextMutation = client.nonMedicQueue.callNext.useMutation()
  const serveTicketMutation = client.nonMedicQueue.serveTicket.useMutation()
  const completeTicketMutation = client.nonMedicQueue.completeTicket.useMutation()
  const skipTicketMutation = client.nonMedicQueue.skipTicket.useMutation()
  const cancelTicketMutation = client.nonMedicQueue.cancelTicket.useMutation()
  const billingBoardQuery = client.nonMedicQueue.getBoard.useQuery(
    {
      lokasiKerjaId: lokasiKerjaId ?? 0,
      serviceTypeCode: 'BILLING',
      queueDate: selectedDate.format('YYYY-MM-DD')
    },
    {
      enabled: Boolean(lokasiKerjaId),
      refetchInterval: 30000,
      queryKey: [
        'nonMedicQueue.kasirWorkspace.billingBoard',
        {
          lokasiKerjaId: lokasiKerjaId ?? 0,
          serviceTypeCode: 'BILLING',
          queueDate: selectedDate.format('YYYY-MM-DD')
        }
      ]
    }
  )

  const cashierBoardQuery = client.nonMedicQueue.getBoard.useQuery(
    {
      lokasiKerjaId: lokasiKerjaId ?? 0,
      serviceTypeCode: 'CASHIER',
      queueDate: selectedDate.format('YYYY-MM-DD')
    },
    {
      enabled: Boolean(lokasiKerjaId),
      refetchInterval: 30000,
      queryKey: [
        'nonMedicQueue.kasirWorkspace.cashierBoard',
        {
          lokasiKerjaId: lokasiKerjaId ?? 0,
          serviceTypeCode: 'CASHIER',
          queueDate: selectedDate.format('YYYY-MM-DD')
        }
      ]
    }
  )

  const board = (boardQuery.data?.result as BoardDto | undefined) ?? null
  const servicePointFromBoard =
    board?.servicePoints.find((item) => item.id === selectedServicePointId) ?? currentServicePoint
  const currentTicket = servicePointFromBoard?.currentTicket ?? null

  const refreshKiosk = async () => {
    await Promise.all([servicePointQuery.refetch(), boardQuery.refetch()])
  }

  const handleTicketAction = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      await action()
      message.success(successMessage)
      await refreshKiosk()
    } catch (error: any) {
      message.error(error?.message ?? 'Aksi tiket gagal diproses.')
    }
  }

  const handleCallNext = async () => {
    if (!selectedServicePointId) {
      message.error('Pilih counter kasir terlebih dahulu.')
      return
    }

    try {
      await callNextMutation.mutateAsync({
        servicePointId: selectedServicePointId,
        queueDate: selectedDate.format('YYYY-MM-DD')
      })
      message.success('Nomor antrian berikutnya berhasil dipanggil.')
      await refreshKiosk()
    } catch (error: any) {
      message.error(error?.message ?? 'Gagal memanggil nomor berikutnya.')
    }
  }

  const waitingColumns: ColumnsType<TicketDto> = [
    { title: 'Nomor', dataIndex: 'ticketNo', key: 'ticketNo' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => <Tag color="gold" style={{ fontSize: '10px' }}>{v}</Tag>
    }
  ]

  const waitingListPopover = (
    <div style={{ width: 250 }}>
      <Table<TicketDto>
        rowKey="ticketId"
        dataSource={board?.waitingTickets ?? []}
        columns={waitingColumns}
        pagination={false}
        size="small"
        bordered
        locale={{ emptyText: 'Tidak ada antrian' }}
      />
    </div>
  )

  const handleOpenInvoice = () => {
    if (currentTicket?.encounterId && currentTicket?.patientId) {
      navigate(`/kasir/invoice/${currentTicket.encounterId}?patientId=${currentTicket.patientId}`)
    } else {
      message.warning('Data encounter tidak ditemukan pada tiket ini.')
    }
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-2 rounded-xl border border-blue-100 shadow-sm transition-all mb-4 hover:shadow-md">
      <Row justify="space-between" align="middle" gutter={[8, 8]}>
        {/* Left: Controls */}
        <Col>
          <Space wrap size="small">
            <div className="bg-white/60 p-0.5 rounded-lg border border-blue-200 shadow-inner">
               {relevantServicePoints.length > 0 ? (
                  <Segmented
                  size="small"
                  value={selectedServicePointId}
                  onChange={(id) => setSelectedServicePointId(id as number)}
                  options={relevantServicePoints.map((item) => {
                    const count = item.serviceTypeCode === 'CASHIER' 
                      ? (cashierBoardQuery.data?.result as any)?.waitingTotal ?? 0
                      : (billingBoardQuery.data?.result as any)?.waitingTotal ?? 0
                    
                    return {
                      label: (
                        <div className={`px-4 py-1 text-xs transition-colors flex items-center gap-1 ${selectedServicePointId === item.id ? 'font-bold' : ''}`}>
                          <span className="mr-1">{item.displayName || item.name}</span>
                          <Badge 
                            count={count} 
                            size="small" 
                            overflowCount={99} 
                            color="orange"
                            style={{ boxShadow: 'none' }}
                          />
                        </div>
                      ),
                      value: item.id
                    }
                  })}
                  className="bg-transparent border-none"
                />
               ) : (
                 <span className="text-xs text-slate-400 px-2 italic">Belum ada counter aktif</span>
               )}
            </div>
            
            <DatePicker
              size="small"
              value={selectedDate}
              onChange={(v) => v && setSelectedDate(v)}
              allowClear={false}
              style={{ width: 110 }}
              className="border-blue-200"
            />
            <Button
              size="small"
              icon={<ReloadOutlined className="text-blue-600" />}
              onClick={() => void refreshKiosk()}
              loading={servicePointQuery.isFetching || boardQuery.isFetching}
              className="border-blue-200 bg-white"
            />
            <Divider type="vertical" className="bg-blue-200 h-6" />
          </Space>
        </Col>

        {/* Right: Active Ticket & Actions */}
        <Col>
          <div className="flex items-center gap-3">
            {currentTicket ? (
              <div className="flex items-center gap-2 bg-white/90 px-3 py-1 rounded-full border-2 border-emerald-500 shadow-sm animate-in fade-in zoom-in duration-300">
                <div className="flex items-center leading-none pr-3 border-r border-slate-200 gap-3">
                  <div className="flex flex-col">
                    <Text type="secondary" style={{ fontSize: '10px', textTransform: 'uppercase' }}>Serving</Text>
                    <Text strong className="text-emerald-600" style={{ fontSize: '16px' }}>{currentTicket.ticketNo}</Text>
                  </div>
                  
                  {currentTicket.encounterId && (
                    <Tooltip title="Buka Detail Invoice">
                      <Button 
                        size="small" 
                        shape="circle" 
                        icon={<EyeOutlined />} 
                        onClick={handleOpenInvoice}
                        className="bg-indigo-600 text-white border-none hover:bg-indigo-700 h-7 w-7 flex items-center justify-center shadow-sm"
                      />
                    </Tooltip>
                  )}
                </div>
                
                <Space size={6}>
                  {currentTicket.status === 'CALLED' ? (
                    <>
                      <Button
                        size="small"
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={() => void handleTicketAction(() => serveTicketMutation.mutateAsync({ ticketId: currentTicket.ticketId }), 'Melayani Pasien')}
                        loading={serveTicketMutation.isPending}
                        className="bg-emerald-600 border-emerald-600 text-xs h-7 px-3 hover:bg-emerald-700"
                      >
                        Layani
                      </Button>
                      <Button
                        size="small"
                        icon={<SwapOutlined />}
                        onClick={() => void handleTicketAction(() => skipTicketMutation.mutateAsync({ ticketId: currentTicket.ticketId }), 'Antrian Dilewati')}
                        loading={skipTicketMutation.isPending}
                        className="text-xs h-7 border-slate-300"
                      >
                        Lewati
                      </Button>
                      <Button
                        size="small"
                        danger
                        type="text"
                        icon={<StopOutlined />}
                        onClick={() => void handleTicketAction(() => cancelTicketMutation.mutateAsync({ ticketId: currentTicket.ticketId }), 'Dibatalkan')}
                        loading={cancelTicketMutation.isPending}
                        className="h-7 w-7 flex items-center justify-center"
                      />
                    </>
                  ) : (
                    <Button
                      size="small"
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => void handleTicketAction(() => completeTicketMutation.mutateAsync({ ticketId: currentTicket.ticketId }), 'Selesai')}
                      loading={completeTicketMutation.isPending}
                      className="bg-green-600 border-green-600 text-xs h-7 px-4 hover:bg-green-700 shadow-md"
                    >
                      Selesai
                    </Button>
                  )}
                </Space>
              </div>
            ) : (
              <Button
                size="middle"
                type="primary"
                icon={<PhoneOutlined />}
                onClick={() => void handleCallNext()}
                loading={callNextMutation.isPending}
                disabled={!servicePointFromBoard?.isActive || board?.waitingTotal === 0}
                className="bg-blue-600 hover:bg-blue-700 h-8 px-6 rounded-lg font-semibold shadow-md border-none flex items-center gap-2"
              >
                Panggil Berikutnya
              </Button>
            )}
          </div>
        </Col>
      </Row>
    </div>
  )
}
