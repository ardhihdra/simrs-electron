import {
  buildReferralSummary,
  type ReferralInfoSource
} from '@renderer/pages/laboratory-management/table-info'
import { client } from '@renderer/utils/client'
import { Alert, Descriptions, Modal, Spin } from 'antd'
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

function renderSummaryRows(rows: Array<{ label: string; value: string }>) {
  return (
    <div className="space-y-1 text-xs leading-relaxed">
      <Descriptions bordered column={1}>
        {rows.map((row) => (
          <Descriptions.Item key={row.label} label={row.label}>
            {row.value}
          </Descriptions.Item>
        ))}
      </Descriptions>
    </div>
  )
}

export default function ReferralInfoModal({
  open,
  onClose,
  encounterId,
  sourcePoliName
}: ReferralInfoModalProps) {
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
  console.log('ref:', data)
  return (
    <Modal open={open} title="Data Rujukan" width={680} footer={null} onCancel={onClose}>
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
            renderSummaryRows(summary)
          ) : (
            <div className="text-sm text-gray-500">Data rujukan tidak ditemukan.</div>
          )}
        </div>
      )}
    </Modal>
  )
}
