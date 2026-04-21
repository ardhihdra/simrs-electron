import {
  BarcodeOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  ShopOutlined,
  TeamOutlined
} from '@ant-design/icons'
import { client } from '@renderer/utils/client'
import { Alert, App, Button, Card, Col, Row, Space, Tag, Typography, theme } from 'antd'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import {
  createPublicKioskLocationResolverInput,
  createServiceKioskTicketPayload,
  type ServiceKioskPayload
} from './public-location'

type QueueConfigDto = {
  id: number
  lokasiKerjaId: number
  serviceTypeCode: string
  serviceTypeName: string
  queuePrefix: string
  isActive: boolean
}

type ServicePointDto = {
  id: number
  serviceTypeCode: string
  isActive: boolean
}

type BoardDto = {
  queueDate: string
  lokasiKerjaId: number
  serviceTypeCode: string
  serviceTypeName: string
  waitingTotal: number
}

type CreatedTicketDto = {
  ticketId?: string
  ticketNo?: string
  serviceTypeCode?: string
  queueDate?: string
}

export type ServiceKioskPageProps = {
  title: string
  description: string
  serviceTypeCode: 'BILLING' | 'CASHIER' | 'PHARMACY' | 'REGISTRASI' | 'REGISTRASI_ASURANSI'
  serviceLabel: string
  icon: ReactNode
  payload?: ServiceKioskPayload
  showHeader?: boolean
}

function ServiceKioskPage({
  title,
  description,
  serviceTypeCode,
  serviceLabel,
  icon,
  payload,
  showHeader = true
}: ServiceKioskPageProps) {
  const { message, modal } = App.useApp()
  const { token } = theme.useToken()
  const [lastCreatedTicket, setLastCreatedTicket] = useState<CreatedTicketDto | null>(null)
  const queueDate = dayjs().format('YYYY-MM-DD')
  const kioskGradient = `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`
  const locationResolverInput = useMemo(
    () => createPublicKioskLocationResolverInput(serviceTypeCode, payload),
    [payload, serviceTypeCode]
  )

  const publicLocationQuery = client.kioskaPublic.nonMedicLocation.useQuery(locationResolverInput, {
    queryKey: ['kioskaPublic.nonMedicLocation', locationResolverInput]
  })
  const publicLocation =
    (publicLocationQuery.data as
      | {
          id: number
          code: string
          name: string
        }
      | undefined) ?? null
  const lokasiKerjaId = publicLocation?.id ?? null
  const lokasiKerjaName = publicLocation?.name ?? 'Lokasi belum diketahui'

  const configQuery = client.kioskaPublic.nonMedicConfigs.useQuery(
    {
      lokasiKerjaId: lokasiKerjaId ?? 0,
      serviceTypeCode,
      isActive: true
    },
    {
      enabled: Boolean(lokasiKerjaId),
      queryKey: [
        'kioskaPublic.nonMedicConfigs',
        {
          lokasiKerjaId: lokasiKerjaId ?? 0,
          serviceTypeCode,
          isActive: true
        }
      ]
    }
  )

  const servicePointQuery = client.kioskaPublic.nonMedicServicePoints.useQuery(
    {
      lokasiKerjaId: lokasiKerjaId ?? 0,
      serviceTypeCode,
      isActive: true
    },
    {
      enabled: Boolean(lokasiKerjaId),
      queryKey: [
        'kioskaPublic.nonMedicServicePoints',
        {
          lokasiKerjaId: lokasiKerjaId ?? 0,
          serviceTypeCode,
          isActive: true
        }
      ]
    }
  )

  const boardQuery = client.kioskaPublic.nonMedicBoard.useQuery(
    {
      lokasiKerjaId: lokasiKerjaId ?? 0,
      serviceTypeCode,
      queueDate
    },
    {
      enabled: Boolean(lokasiKerjaId),
      queryKey: [
        'kioskaPublic.nonMedicBoard',
        {
          lokasiKerjaId: lokasiKerjaId ?? 0,
          serviceTypeCode,
          queueDate
        }
      ]
    }
  )

  const createTicketMutation = client.kioskaPublic.nonMedicTicket.useMutation()

  const activeConfig = useMemo(() => {
    const configs = ((configQuery.data as QueueConfigDto[] | undefined) ?? []).filter(
      (item) => item.isActive
    )
    return configs[0] ?? null
  }, [configQuery.data])

  const activeServicePointCount = useMemo(() => {
    const servicePoints = (servicePointQuery.data as ServicePointDto[] | undefined) ?? []
    return servicePoints.filter((servicePoint) => servicePoint.isActive).length
  }, [servicePointQuery.data])

  const board = (boardQuery.data as BoardDto | undefined) ?? null
  const waitingTotal = board?.waitingTotal ?? 0
  const hasActiveConfig = Boolean(activeConfig)

  async function handleTakeTicket() {
    if (!lokasiKerjaId) {
      message.error('Lokasi kiosk publik belum tersedia.')
      return
    }

    if (!hasActiveConfig) {
      message.error(`Config antrian aktif untuk ${serviceLabel} belum tersedia.`)
      return
    }

    try {
      const response = await createTicketMutation.mutateAsync(
        createServiceKioskTicketPayload(lokasiKerjaId, serviceTypeCode, queueDate)
      )

      const ticket = (response as CreatedTicketDto | undefined) ?? null
      setLastCreatedTicket(ticket)
      message.success(`Nomor ${ticket?.ticketNo ?? 'antrian'} berhasil dibuat.`)
      modal.success({
        title: `Nomor ${serviceLabel} berhasil dibuat`,
        centered: true,
        width: 520,
        icon: null,
        okText: 'Selesai',
        content: (
          <div className="pt-4 text-center">
            <div className="rounded-[28px] px-6 py-8" style={{ background: kioskGradient }}>
              <Typography.Text className="!text-white/80">Nomor antrean kamu</Typography.Text>
              <div className="mt-3 text-6xl font-semibold tracking-[0.16em] text-white">
                {ticket?.ticketNo ?? '-'}
              </div>
              <Typography.Text className="!mt-3 !block !text-white/80">
                {lokasiKerjaName} • {dayjs(ticket?.queueDate ?? queueDate).format('DD MMM YYYY')}
              </Typography.Text>
            </div>
          </div>
        )
      })
      await boardQuery.refetch()
    } catch (error: any) {
      message.error(error?.message ?? 'Gagal membuat nomor antrian dari KIOSK.')
    }
  }

  return (
    <div className="space-y-6">
      <Card
        className="!overflow-hidden !rounded-[36px] !border-0"
        styles={{
          body: {
            minHeight: showHeader ? 'calc(100vh - 11rem)' : 'auto',
            padding: 0,
            background: kioskGradient
          }
        }}
      >
        <div className="flex flex-col px-6 py-6 md:px-8 md:py-8">
          <div className={showHeader ? 'block' : 'hidden'}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <Tag
                  className="mb-4 border-0 px-4 py-1 text-sm font-semibold !text-white"
                  style={{ backgroundColor: 'rgba(255,255,255,0.16)' }}
                >
                  KIOSK {serviceLabel.toUpperCase()}
                </Tag>
                <Typography.Title
                  level={1}
                  className="!mb-3 !text-4xl !leading-tight !text-white md:!text-5xl"
                >
                  {title}
                </Typography.Title>
                <Typography.Paragraph className="!mb-4 !max-w-2xl !text-base !text-white/85 md:!text-lg">
                  {description}
                </Typography.Paragraph>
                <Space wrap size="middle">
                  <div className="rounded-full bg-white/12 px-4 py-2 text-sm text-white/90">
                    Lokasi: {lokasiKerjaName}
                  </div>
                  <div className="rounded-full bg-white/12 px-4 py-2 text-sm text-white/90">
                    Tanggal: {dayjs(queueDate).format('DD MMM YYYY')}
                  </div>
                  <div className="rounded-full bg-white/12 px-4 py-2 text-sm text-white/90">
                    Prefix: {activeConfig?.queuePrefix ?? '-'}
                  </div>
                </Space>
              </div>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  void publicLocationQuery.refetch()
                  void configQuery.refetch()
                  void servicePointQuery.refetch()
                  void boardQuery.refetch()
                }}
                loading={
                  publicLocationQuery.isFetching ||
                  configQuery.isFetching ||
                  servicePointQuery.isFetching ||
                  boardQuery.isFetching
                }
                disabled={!lokasiKerjaId}
                className="!h-12 !rounded-2xl !border-0 !px-6 !text-base !font-medium !text-white"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                Refresh Data
              </Button>
            </div>
          </div>

          {publicLocationQuery.isError ? (
            <Alert
              type="error"
              showIcon
              message={publicLocationQuery.error?.message ?? 'Lokasi kiosk publik tidak ditemukan.'}
              style={{ marginTop: 24 }}
            />
          ) : null}

          {!publicLocationQuery.isLoading && !publicLocationQuery.isError && !lokasiKerjaId ? (
            <Alert
              type="error"
              showIcon
              message="Lokasi kiosk publik tidak ditemukan."
              style={{ marginTop: 24 }}
            />
          ) : null}

          {lokasiKerjaId && !hasActiveConfig ? (
            <Alert
              type="warning"
              showIcon
              message={`Belum ada config antrian aktif untuk layanan ${serviceLabel} di lokasi ini.`}
              style={{ marginTop: 24 }}
            />
          ) : null}

          <div className="flex flex-1 items-center justify-center py-8">
            <div className="w-full max-w-5xl text-center">
              {showHeader && (
                <div
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] text-white shadow-lg"
                  style={{ backgroundColor: 'rgba(255,255,255,0.16)' }}
                >
                  {icon}
                </div>
              )}
              <Typography.Title level={2} className="!mb-3 !text-2xl !text-white md:!text-4xl">
                Sentuh Untuk Ambil Nomor {serviceLabel}
              </Typography.Title>
              <Typography.Paragraph className="!mx-auto !mb-8 !max-w-2xl !text-lg !text-white/80">
                Nomor antrean akan langsung dibuat untuk layanan {serviceLabel.toLowerCase()} di
                lokasi {lokasiKerjaName}.
              </Typography.Paragraph>

              <div className="mx-auto mb-8 max-w-md rounded-[32px] bg-white/10 px-6 py-8 text-white backdrop-blur-sm">
                <Typography.Text className="!text-white/75">Nomor Terakhir</Typography.Text>
                <div className="mt-4 text-6xl font-semibold tracking-[0.18em]">
                  {lastCreatedTicket?.ticketNo ?? '--'}
                </div>
                <Typography.Text className="!mt-4 !block !text-white/75">
                  {lastCreatedTicket
                    ? `Dibuat ${dayjs(lastCreatedTicket.queueDate ?? queueDate).format('DD MMM YYYY')}`
                    : 'Belum ada nomor yang diambil'}
                </Typography.Text>
              </div>

              <Button
                type="primary"
                size="large"
                icon={<BarcodeOutlined />}
                onClick={() => void handleTakeTicket()}
                loading={createTicketMutation.isPending}
                disabled={!lokasiKerjaId || !hasActiveConfig}
                className="!h-28 !rounded-[28px] !border-0 !px-12 !text-2xl !font-semibold md:!text-3xl"
                style={{
                  backgroundColor: token.colorBgContainer,
                  color: token.colorPrimary,
                  boxShadow: token.boxShadowSecondary
                }}
              >
                Ambil Nomor {serviceLabel}
              </Button>

              {showHeader && (
                <div className="mt-8 text-base text-white/75 md:text-lg">
                  1. Sentuh tombol untuk mengambil nomor.
                  <br />
                  2. Catat nomor yang muncul di layar.
                  <br />
                  3. Tunggu panggilan dari service point.
                </div>
              )}
            </div>
          </div>

          {showHeader && (
            <div className="mt-auto">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12} xl={6}>
                  <Card
                    className="!rounded-[24px] !border-0"
                    styles={{ body: { backgroundColor: token.colorBgContainer } }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <Typography.Text type="secondary">Service Point Aktif</Typography.Text>
                        <div className="mt-2 text-3xl font-semibold text-slate-900">
                          {activeServicePointCount}
                        </div>
                      </div>
                      <div
                        className="rounded-2xl p-3 text-white"
                        style={{ background: kioskGradient }}
                      >
                        <ShopOutlined className="text-2xl" />
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} md={12} xl={6}>
                  <Card
                    className="!rounded-[24px] !border-0"
                    styles={{ body: { backgroundColor: token.colorBgContainer } }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <Typography.Text type="secondary">Antrian Menunggu</Typography.Text>
                        <div className="mt-2 text-3xl font-semibold text-slate-900">
                          {waitingTotal}
                        </div>
                      </div>
                      <div
                        className="rounded-2xl p-3 text-white"
                        style={{ background: kioskGradient }}
                      >
                        <TeamOutlined className="text-2xl" />
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} md={12} xl={6}>
                  <Card
                    className="!rounded-[24px] !border-0"
                    styles={{ body: { backgroundColor: token.colorBgContainer } }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <Typography.Text type="secondary">Layanan</Typography.Text>
                        <div className="mt-2 text-3xl font-semibold text-slate-900">
                          {serviceLabel}
                        </div>
                      </div>
                      <div
                        className="rounded-2xl p-3 text-white"
                        style={{ background: kioskGradient }}
                      >
                        {icon}
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} md={12} xl={6}>
                  <Card
                    className="!rounded-[24px] !border-0"
                    styles={{ body: { backgroundColor: token.colorBgContainer } }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <Typography.Text type="secondary">Update</Typography.Text>
                        <div className="mt-2 text-2xl font-semibold text-slate-900">
                          {dayjs().format('HH:mm')}
                        </div>
                      </div>
                      <div
                        className="rounded-2xl p-3 text-white"
                        style={{ background: kioskGradient }}
                      >
                        <ClockCircleOutlined className="text-2xl" />
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default ServiceKioskPage
