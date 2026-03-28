import { ResourceSyncCount, SatuSehatSyncStatus } from "@renderer/types/satu-sehat"
import { theme } from "antd"


const resourceLabel: Record<string, string> = {
  observation: 'Observasi',
  condition: 'Diagnosis',
  procedure: 'Prosedur',
  allergyIntolerance: 'Alergi',
  composition: 'Catatan'
}

export const SyncPopoverContent = ({ s }: { s: SatuSehatSyncStatus }) => {
  const { token } = theme.useToken()
  const resources = s?.resources || {
    observation: { total: 0, synced: 0, needsResync: 0, logSummary: null },
    condition: { total: 0, synced: 0, needsResync: 0, logSummary: null },
    procedure: { total: 0, synced: 0, needsResync: 0, logSummary: null },
    allergyIntolerance: { total: 0, synced: 0, needsResync: 0, logSummary: null },
    composition: { total: 0, synced: 0, needsResync: 0, logSummary: null }
  }

  return (
    <div className="text-sm mt-3">
      <div
        className="flex items-center justify-between p-3 mb-4 rounded-lg"
        style={{
          background: token.colorFillAlter,
          border: `1px solid ${token.colorBorderSecondary}`
        }}
      >
        <div className="flex items-center gap-2">
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: s?.encounterSynced
                ? token.colorSuccess
                : s?.encounterLog?.status === 'failed'
                  ? token.colorError
                  : token.colorTextQuaternary
            }}
          />
          <span style={{ fontWeight: 600, color: token.colorText }}>Data Kunjungan Dasar</span>
        </div>
        <Tag
          color={
            s?.encounterSynced
              ? 'success'
              : s?.encounterLog?.status === 'failed'
                ? 'error'
                : 'default'
          }
          bordered={false}
          className="m-0 font-medium"
        >
          {s?.encounterSynced
            ? 'Terkirim'
            : s?.encounterLog?.status === 'failed'
              ? 'Gagal'
              : 'Belum Dikirim'}
        </Tag>
      </div>
      {s?.encounterLog?.errorMessage && (
        <div
          className="mb-4 px-3 py-2 rounded-lg"
          style={{ background: token.colorErrorBg, border: `1px solid ${token.colorErrorBorder}` }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: token.colorError,
              textTransform: 'uppercase',
              marginBottom: 4
            }}
          >
            Error Kunjungan
          </div>
          <div
            style={{
              fontSize: 12,
              color: token.colorErrorText,
              fontFamily: 'monospace',
              wordBreak: 'break-word'
            }}
          >
            {s.encounterLog.errorMessage}
          </div>
          {s.encounterLog.lastAttemptAt && (
            <div style={{ fontSize: 10, color: token.colorError, marginTop: 4 }}>
              Percobaan ke-{s.encounterLog.attemptCount} ·{' '}
              {new Date(s.encounterLog.lastAttemptAt).toLocaleString('id-ID')}
            </div>
          )}
        </div>
      )}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: token.colorTextTertiary,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 12,
          padding: '0 4px'
        }}
      >
        Rincian Resource Klinis
      </div>
      <div className="grid gap-2">
        {(Object.keys(resourceLabel) as (keyof typeof resourceLabel)[]).map((k) => {
          const r = (resources as any)[k] as ResourceSyncCount | undefined
          if (!r) return null

          const isAllSynced = r.total > 0 && r.synced === r.total
          const hasFailed = (r.logSummary?.failed ?? 0) > 0 || (r.logSummary?.retry ?? 0) > 0
          const isPartial = r.synced > 0 && r.synced < r.total
          const hasResync = (r.needsResync ?? 0) > 0

          let bgStyle: React.CSSProperties = { background: token.colorFillAlter }
          let textColor = token.colorTextTertiary
          let statusBadge = (
            <span
              style={{
                color: token.colorTextTertiary,
                border: `1px solid ${token.colorBorderSecondary}`,
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500
              }}
            >
              Tidak Ada (0/0)
            </span>
          )

          if (isAllSynced && hasResync) {
            bgStyle = {
              background: token.colorWarningBg,
              border: `1px solid ${token.colorWarningBorder}`
            }
            textColor = token.colorWarningText
            statusBadge = (
              <span
                style={{
                  color: token.colorWarning,
                  background: token.colorBgContainer,
                  border: `1px solid ${token.colorWarningBorder}`,
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700
                }}
              >
                Perlu Resync ({r.needsResync})
              </span>
            )
          } else if (isAllSynced) {
            bgStyle = {
              background: token.colorSuccessBg,
              border: `1px solid ${token.colorSuccessBorder}`
            }
            textColor = token.colorSuccessText
            statusBadge = (
              <span
                style={{
                  color: token.colorSuccessText,
                  background: token.colorBgContainer,
                  border: `1px solid ${token.colorSuccessBorder}`,
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700
                }}
              >
                Lengkap ({r.synced}/{r.total})
              </span>
            )
          } else if (hasFailed) {
            bgStyle = {
              background: token.colorErrorBg,
              border: `1px solid ${token.colorErrorBorder}`
            }
            textColor = token.colorErrorText
            const failedCount = (r.logSummary?.failed ?? 0) + (r.logSummary?.retry ?? 0)
            statusBadge = (
              <span
                style={{
                  color: token.colorErrorText,
                  background: token.colorBgContainer,
                  border: `1px solid ${token.colorErrorBorder}`,
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700
                }}
              >
                {r.synced}/{r.total} · {failedCount} Gagal
              </span>
            )
          } else if (isPartial) {
            bgStyle = {
              background: token.colorWarningBg,
              border: `1px solid ${token.colorWarningBorder}`
            }
            textColor = token.colorWarningText
            statusBadge = (
              <span
                style={{
                  color: token.colorWarningText,
                  background: token.colorBgContainer,
                  border: `1px solid ${token.colorWarningBorder}`,
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700
                }}
              >
                Proses ({r.synced}/{r.total})
              </span>
            )
          } else if (r.total > 0 && r.synced === 0) {
            bgStyle = {
              background: token.colorErrorBg,
              border: `1px solid ${token.colorErrorBorder}`
            }
            textColor = token.colorErrorText
            statusBadge = (
              <span
                style={{
                  color: token.colorErrorText,
                  background: token.colorBgContainer,
                  border: `1px solid ${token.colorErrorBorder}`,
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700
                }}
              >
                Belum ({r.synced}/{r.total})
              </span>
            )
          }

          const errorDetail = r.logSummary?.lastFailedLog

          return (
            <div key={k} className="rounded-lg transition-colors" style={bgStyle}>
              <div className="flex justify-between items-center p-2.5" style={bgStyle}>
                <span style={{ fontWeight: 500, color: textColor }}>{resourceLabel[k]}</span>
                {statusBadge}
              </div>
              {errorDetail?.errorMessage && (
                <div className="px-3 pb-2.5 pt-1">
                  <div
                    className="font-mono wrap-break-word px-2 py-1 rounded"
                    style={{
                      fontSize: 10,
                      color: token.colorError,
                      background: token.colorErrorBg,
                      border: `1px solid ${token.colorErrorBorder}`
                    }}
                  >
                    {errorDetail.errorMessage}
                  </div>
                  {errorDetail.lastAttemptAt && (
                    <div style={{ fontSize: 9, color: token.colorError, marginTop: 2 }}>
                      Percobaan ke-{errorDetail.attemptCount} ·{' '}
                      {new Date(errorDetail.lastAttemptAt).toLocaleString('id-ID')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
