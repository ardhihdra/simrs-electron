import {
  ClockCircleOutlined,
  MedicineBoxOutlined,
  ReloadOutlined,
  SoundOutlined,
  TeamOutlined
} from '@ant-design/icons'
import { useMemo, useState } from 'react'

import { Alert, Button, Card, Empty, Select, Spin, Typography, theme } from 'antd'
import dayjs from 'dayjs'

import { client } from '@renderer/utils/client'

import {
  buildDoctorFilterOptions,
  buildPublicQueueSummaries,
  getSelectedDoctorValue,
  type MonitorQueueTicket,
  type PublicQueueSummary
} from './encounter-monitor.helpers'

const { Text, Title } = Typography

function MonitorStat({
  label,
  value,
  note,
  token,
  emphasize = false
}: {
  label: string
  value: string | number
  note?: string
  token: ReturnType<typeof theme.useToken>['token']
  emphasize?: boolean
}) {
  return (
    <div
      className="rounded-3xl px-5 py-4"
      style={{
        background: emphasize ? token.colorPrimaryBg : token.colorBgContainer,
        border: `1px solid ${emphasize ? token.colorPrimaryBorder : token.colorBorderSecondary}`,
        boxShadow: token.boxShadowTertiary
      }}
    >
      <div
        className="text-xs font-semibold uppercase tracking-[0.24em]"
        style={{ color: emphasize ? token.colorPrimary : token.colorTextSecondary }}
      >
        {label}
      </div>
      <div
        className="mt-2 text-3xl font-black leading-none md:text-4xl"
        style={{ color: token.colorTextHeading }}
      >
        {value}
      </div>
      {note ? (
        <div className="mt-2 text-sm font-medium" style={{ color: token.colorTextSecondary }}>
          {note}
        </div>
      ) : null}
    </div>
  )
}

function SummaryCard({
  summary,
  token
}: {
  summary: PublicQueueSummary
  token: ReturnType<typeof theme.useToken>['token']
}) {
  return (
    <Card
      variant="borderless"
      styles={{ body: { padding: 24 } }}
      style={{
        background: token.colorBgContainer,
        border: `1px solid ${summary.isActive ? token.colorPrimaryBorder : token.colorBorderSecondary}`,
        borderRadius: 28,
        boxShadow: token.boxShadowSecondary
      }}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div
              className="text-2xl font-bold leading-tight"
              style={{ color: token.colorTextHeading }}
            >
              {summary.poli}
            </div>
            <div className="mt-2 text-base" style={{ color: token.colorTextSecondary }}>
              {summary.doctor}
            </div>
          </div>

          <div
            className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold"
            style={{
              background: summary.isActive ? token.colorPrimaryBg : token.colorFillQuaternary,
              color: summary.isActive ? token.colorPrimary : token.colorTextSecondary,
              border: `1px solid ${summary.isActive ? token.colorPrimaryBorder : token.colorBorder}`
            }}
          >
            {summary.isActive ? 'Sedang melayani pasien' : 'Menunggu panggilan berikutnya'}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MonitorStat
            label="Sedang Dipanggil"
            value={summary.currentQueueLabel}
            note={
              summary.patientInitials === '--'
                ? 'Pasien aktif belum tersedia'
                : `Inisial ${summary.patientInitials}`
            }
            token={token}
            emphasize={summary.isActive}
          />
          {summary.nextQueueLabel ? (
            <MonitorStat label="Berikutnya" value={summary.nextQueueLabel} token={token} />
          ) : null}
          <MonitorStat label="Sisa Antrian" value={summary.remainingCount} token={token} />
          <MonitorStat label="Sudah Dilayani" value={summary.handledCount} token={token} />
        </div>
      </div>
    </Card>
  )
}

function HeroCard({
  summary,
  token
}: {
  summary?: PublicQueueSummary
  token: ReturnType<typeof theme.useToken>['token']
}) {
  const hasActiveQueue = Boolean(summary?.isActive)
  const queueLabel = summary?.currentQueueLabel ?? '-'
  const patientLabel =
    summary?.patientInitials && summary.patientInitials !== '--'
      ? `Pasien ${summary.patientInitials}`
      : 'Identitas pasien belum tersedia'
  const subtitle = summary
    ? `${summary.poli} • ${summary.doctor}`
    : 'Belum ada panggilan aktif saat ini'
  const helperText = hasActiveQueue
    ? summary?.nextQueueLabel
      ? `Nomor berikutnya ${summary.nextQueueLabel}`
      : 'Belum ada antrian berikutnya'
    : 'Silakan menunggu pengumuman nomor berikutnya'

  return (
    <Card
      variant="borderless"
      styles={{ body: { padding: 32 } }}
      style={{
        background: `linear-gradient(145deg, ${token.colorBgContainer} 0%, ${token.colorPrimaryBg} 100%)`,
        border: `1px solid ${token.colorPrimaryBorder}`,
        borderRadius: 36,
        boxShadow: token.boxShadowSecondary
      }}
    >
      <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-3xl">
          <div
            className="inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em]"
            style={{
              background: token.colorBgContainer,
              color: token.colorPrimary,
              border: `1px solid ${token.colorPrimaryBorder}`
            }}
          >
            <SoundOutlined />
            Sedang Dipanggil
          </div>

          <div
            className="mt-6 text-[72px] font-black leading-none md:text-[112px]"
            style={{ color: token.colorPrimary }}
          >
            {queueLabel}
          </div>

          <div
            className="mt-4 text-2xl font-semibold md:text-3xl"
            style={{ color: token.colorTextHeading }}
          >
            {patientLabel}
          </div>

          <div className="mt-3 text-lg" style={{ color: token.colorTextSecondary }}>
            {subtitle}
          </div>
        </div>

        <div
          className="rounded-[32px] p-6 xl:min-w-[320px]"
          style={{
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorderSecondary}`,
            boxShadow: token.boxShadowTertiary
          }}
        >
          <div
            className="text-sm font-semibold uppercase tracking-[0.24em]"
            style={{ color: token.colorTextSecondary }}
          >
            Informasi Layar
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <div className="text-sm" style={{ color: token.colorTextSecondary }}>
                Status
              </div>
              <div className="mt-1 text-xl font-semibold" style={{ color: token.colorTextHeading }}>
                {hasActiveQueue ? 'Nomor aktif tersedia' : 'Belum ada panggilan aktif'}
              </div>
            </div>
            <div>
              <div className="text-sm" style={{ color: token.colorTextSecondary }}>
                Petunjuk
              </div>
              <div className="mt-1 text-lg font-medium" style={{ color: token.colorTextHeading }}>
                {helperText}
              </div>
            </div>
            {summary ? (
              <div>
                <div className="text-sm" style={{ color: token.colorTextSecondary }}>
                  Sudah dilayani
                </div>
                <div
                  className="mt-1 text-lg font-semibold"
                  style={{ color: token.colorTextHeading }}
                >
                  {summary.handledCount} pasien
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function EncounterMonitor() {
  const { token } = theme.useToken()
  const [selectedDoctor, setSelectedDoctor] = useState<string | undefined>(undefined)
  const queueDate = dayjs().format('YYYY-MM-DD')

  const queueQuery = client.visitManagement.getActiveQueues.useQuery(
    {
      queueDate
    },
    {
      refetchInterval: 10000,
      staleTime: 10000,
      placeholderData: (previous) => previous,
      queryKey: ['queue-monitor', { queueDate }]
    }
  )

  const tickets = useMemo<MonitorQueueTicket[]>(() => {
    if (!Array.isArray(queueQuery.data?.result)) return []
    return queueQuery.data.result as MonitorQueueTicket[]
  }, [queueQuery.data])

  const summaries = useMemo(() => buildPublicQueueSummaries(tickets), [tickets])
  const doctorOptions = useMemo(() => buildDoctorFilterOptions(summaries), [summaries])
  const effectiveSelectedDoctor = useMemo(
    () => getSelectedDoctorValue(selectedDoctor, summaries),
    [selectedDoctor, summaries]
  )

  const filteredSummaries = useMemo(() => {
    if (!effectiveSelectedDoctor) return []

    return summaries.filter((summary) => {
      const summaryValue = summary.practitionerId || `name:${summary.doctor}`
      return summaryValue === effectiveSelectedDoctor
    })
  }, [effectiveSelectedDoctor, summaries])

  const featuredSummary = useMemo(
    () => filteredSummaries.find((summary) => summary.isActive) ?? filteredSummaries[0],
    [filteredSummaries]
  )

  const totalRemaining = useMemo(
    () => filteredSummaries.reduce((total, summary) => total + summary.remainingCount, 0),
    [filteredSummaries]
  )
  const totalHandled = useMemo(
    () => filteredSummaries.reduce((total, summary) => total + summary.handledCount, 0),
    [filteredSummaries]
  )
  const activePoliCount = useMemo(
    () => filteredSummaries.filter((summary) => summary.isActive).length,
    [filteredSummaries]
  )

  const hasUsableData = filteredSummaries.length > 0
  const isInitialLoading = queueQuery.isPending && !queueQuery.data
  const showBlockingError = queueQuery.isError && !queueQuery.data
  const lastUpdatedLabel = queueQuery.dataUpdatedAt
    ? dayjs(queueQuery.dataUpdatedAt).format('HH:mm:ss')
    : '-'

  return (
    <div
      className="min-h-screen px-4 py-6 md:px-8"
      style={{
        background: `linear-gradient(180deg, ${token.colorBgLayout} 0%, ${token.colorPrimaryBg} 100%)`
      }}
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
        <Card
          variant="borderless"
          styles={{ body: { padding: 24 } }}
          style={{
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorderSecondary}`,
            borderRadius: 28,
            boxShadow: token.boxShadowTertiary
          }}
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
                style={{
                  background: token.colorPrimaryBg,
                  color: token.colorPrimary,
                  border: `1px solid ${token.colorPrimaryBorder}`
                }}
              >
                <MedicineBoxOutlined />
              </div>
              <div>
                <Title level={2} className="!mb-1" style={{ color: token.colorTextHeading }}>
                  Monitor Antrian Poli
                </Title>
                <Text className="text-base" style={{ color: token.colorTextSecondary }}>
                  Layar informasi pasien untuk antrian rawat jalan hari ini,{' '}
                  {dayjs(queueDate).format('DD MMMM YYYY')}.
                </Text>
              </div>
            </div>

            <div className="flex flex-col gap-3 xl:items-end">
              <div className="flex flex-wrap gap-3">
                <Select
                  showSearch
                  placeholder="Filter dokter"
                  className="min-w-[260px]"
                  value={effectiveSelectedDoctor}
                  onChange={(value) => setSelectedDoctor(value)}
                  options={doctorOptions}
                  optionFilterProp="label"
                />
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => void queueQuery.refetch()}
                  loading={queueQuery.isFetching}
                >
                  Refresh
                </Button>
              </div>

              <div className="flex flex-wrap gap-3">
                <div
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
                  style={{
                    background: token.colorFillQuaternary,
                    color: token.colorTextSecondary,
                    border: `1px solid ${token.colorBorderSecondary}`
                  }}
                >
                  <ClockCircleOutlined />
                  Update terakhir {lastUpdatedLabel}
                </div>
                <div
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
                  style={{
                    background: queueQuery.isFetching
                      ? token.colorPrimaryBg
                      : token.colorFillQuaternary,
                    color: queueQuery.isFetching ? token.colorPrimary : token.colorTextSecondary,
                    border: `1px solid ${queueQuery.isFetching ? token.colorPrimaryBorder : token.colorBorderSecondary}`
                  }}
                >
                  <TeamOutlined />
                  {queueQuery.isFetching ? 'Memperbarui data' : 'Auto-refresh setiap 10 detik'}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <MonitorStat label="Poli Aktif" value={filteredSummaries.length} token={token} />
            <MonitorStat label="Sedang Melayani" value={activePoliCount} token={token} />
            <MonitorStat
              label="Sisa Antrian Hari Ini"
              value={totalRemaining}
              note={`${totalHandled} pasien sudah dilayani`}
              token={token}
            />
          </div>
        </Card>

        {queueQuery.isError && queueQuery.data ? (
          <Alert
            type="warning"
            showIcon
            message="Koneksi terakhir bermasalah"
            description="Monitor tetap menampilkan data terakhir yang berhasil dimuat sambil menunggu pembaruan berikutnya."
            style={{
              borderRadius: 20,
              borderColor: token.colorWarningBorder,
              background: token.colorWarningBg
            }}
          />
        ) : null}

        {isInitialLoading ? (
          <Card
            variant="borderless"
            style={{
              background: token.colorBgContainer,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: 28
            }}
          >
            <div className="flex items-center justify-center py-24">
              <Spin size="large" />
            </div>
          </Card>
        ) : showBlockingError ? (
          <Card
            variant="borderless"
            style={{
              background: token.colorBgContainer,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: 28
            }}
          >
            <Alert
              type="error"
              showIcon
              message="Gagal memuat data monitor antrian"
              description="Silakan periksa koneksi lalu coba kembali."
            />
          </Card>
        ) : hasUsableData ? (
          <>
            <HeroCard summary={featuredSummary} token={token} />

            <div className="grid grid-cols-1 gap-5">
              {filteredSummaries.map((summary) => (
                <SummaryCard key={summary.key} summary={summary} token={token} />
              ))}
            </div>
          </>
        ) : (
          <Card
            variant="borderless"
            style={{
              background: token.colorBgContainer,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: 28
            }}
          >
            <Empty
              description={
                effectiveSelectedDoctor
                  ? 'Tidak ada antrian untuk dokter yang dipilih.'
                  : `Belum ada antrian aktif untuk ${dayjs(queueDate).format('DD MMMM YYYY')}.`
              }
            />
          </Card>
        )}
      </div>
    </div>
  )
}
