import {
  buildReferralSummary,
  type ReferralInfoSource
} from '@renderer/pages/laboratory-management/table-info'
import { client } from '@renderer/utils/client'
import {
  ApartmentOutlined,
  CalendarOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  UserOutlined
} from '@ant-design/icons'
import { Alert, Card, Empty, Modal, Spin, Tag, Typography, theme } from 'antd'
import type { ReactNode } from 'react'
import { useMemo } from 'react'

interface ReferralInfoModalProps {
  open: boolean
  onClose: () => void
  encounterId?: string
  sourcePoliName?: string
}

interface ReferralRecord {
  referralDate?: string
  createdAt?: string
  referringPractitionerName?: string
  diagnosisText?: string
  conditionAtTransfer?: string
  keadaanKirim?: string
  reasonForReferral?: string
}

function normalizeList<T>(data: unknown): T[] {
  const raw = data as { result?: T[]; data?: T[] } | T[]
  return (
    (raw as { result?: T[]; data?: T[] })?.result ??
    (raw as { data?: T[] })?.data ??
    (raw as T[]) ??
    []
  )
}

function getLatestReferral(rows: ReferralInfoSource[]) {
  return [...rows].sort((left, right) => {
    const leftTime = new Date(left.referralDate || left.createdAt || 0).getTime()
    const rightTime = new Date(right.referralDate || right.createdAt || 0).getTime()
    return rightTime - leftTime
  })[0]
}

function ReferralDetailItem({
  icon,
  label,
  value
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  const { token } = theme.useToken()

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <span style={{ color: token.colorTextTertiary, fontSize: token.fontSizeSM }}>{icon}</span>
        <span
          style={{
            color: token.colorTextTertiary,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}
        >
          {label}
        </span>
      </div>
      <div
        className="rounded-xl px-3 py-2"
        style={{
          background: token.colorBgLayout,
          border: `1px solid ${token.colorBorderSecondary}`,
          color: token.colorText
        }}
      >
        <Typography.Text>{value}</Typography.Text>
      </div>
    </div>
  )
}

export default function ReferralInfoModal({
  open,
  onClose,
  encounterId,
  sourcePoliName
}: ReferralInfoModalProps) {
  const { token } = theme.useToken()
  const referralQueryInput = useMemo(
    () => ({
      model: 'referral',
      path: 'filter',
      method: 'get' as const,
      params: encounterId ? { encounterId } : undefined
    }),
    [encounterId]
  )

  const { data, isLoading, isFetching, isError, error } = client.query.entity.useQuery(
    referralQueryInput,
    {
      enabled: open && !!encounterId,
      queryKey: ['ancillary-referral-info', encounterId]
    } as any
  )

  const summary = useMemo(() => {
    const referrals = normalizeList<ReferralRecord>(data?.result).map<ReferralInfoSource>(
      (item) => ({
        referralDate: item.referralDate,
        createdAt: item.createdAt,
        referringPractitionerName: item.referringPractitionerName,
        diagnosisText: item.diagnosisText,
        conditionAtTransfer: item.conditionAtTransfer,
        keadaanKirim: item.keadaanKirim,
        reasonForReferral: item.reasonForReferral
      })
    )

    return buildReferralSummary({
      referrals,
      fallbackSourcePoliName: sourcePoliName
    })
  }, [data, sourcePoliName])
  const latestReferral = useMemo(() => {
    const referrals = normalizeList<ReferralRecord>(data?.result).map<ReferralInfoSource>(
      (item) => ({
        referralDate: item.referralDate,
        createdAt: item.createdAt,
        referringPractitionerName: item.referringPractitionerName,
        diagnosisText: item.diagnosisText,
        conditionAtTransfer: item.conditionAtTransfer,
        keadaanKirim: item.keadaanKirim,
        reasonForReferral: item.reasonForReferral
      })
    )

    return referrals.length ? getLatestReferral(referrals) : null
  }, [data])

  return (
    <Modal open={open} title="Data Rujukan" width={760} footer={null} onCancel={onClose}>
      {open && encounterId && (isLoading || isFetching) ? (
        <div className="py-10 flex justify-center">
          <Spin />
        </div>
      ) : (
        <div className="space-y-3">
          {isError ? (
            <Alert
              type="error"
              showIcon
              message="Gagal memuat data rujukan"
              description={(error as Error)?.message || 'Terjadi kesalahan saat memuat rujukan.'}
            />
          ) : null}
          {summary.length > 0 ? (
            <Card styles={{ body: { padding: 0 } }} className="overflow-hidden rounded-xl" bordered={false}>
              <div
                className="flex items-start justify-between gap-4 px-6 py-4"
                style={{
                  background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`
                }}
              >
                <div>
                  <Typography.Title
                    level={4}
                    className="!mb-1"
                    style={{ color: token.colorTextLightSolid }}
                  >
                    Informasi Rujukan
                  </Typography.Title>
                  <Typography.Text style={{ color: 'rgba(255,255,255,0.82)' }}>
                    Ringkasan rujukan pasien dari encounter terkait.
                  </Typography.Text>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Tag color="processing" bordered={false} className="m-0 rounded-lg px-3 py-1 font-semibold">
                    Rujukan Aktif
                  </Tag>
                  <Typography.Text style={{ color: 'rgba(255,255,255,0.82)' }}>
                    {latestReferral?.referralDate || latestReferral?.createdAt
                      ? new Date(latestReferral.referralDate || latestReferral.createdAt || '')
                          .toLocaleString()
                      : '-'}
                  </Typography.Text>
                </div>
              </div>

              <div className="space-y-4 px-6 py-5" style={{ background: token.colorBgContainer }}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {summary.map((row) => {
                    const lowerLabel = row.label.toLowerCase()
                    const icon = lowerLabel.includes('poli')
                      ? <ApartmentOutlined />
                      : lowerLabel.includes('dokter')
                        ? <UserOutlined />
                        : lowerLabel.includes('diagnosis')
                          ? <FileTextOutlined />
                          : lowerLabel.includes('alasan')
                            ? <InfoCircleOutlined />
                            : <CalendarOutlined />

                    return (
                      <ReferralDetailItem
                        key={row.label}
                        icon={icon}
                        label={row.label}
                        value={row.value}
                      />
                    )
                  })}
                </div>
              </div>
            </Card>
          ) : (
            <Empty description="Data rujukan tidak ditemukan." image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </div>
      )}
    </Modal>
  )
}
