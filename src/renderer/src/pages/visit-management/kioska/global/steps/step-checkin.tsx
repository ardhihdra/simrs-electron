import { useState } from 'react'

import { desktopThemeTokens as dt } from '@renderer/components/design-system/foundation/desktop-theme'

import { checkinKioskaQueue } from '../../public-client'
import { KioskFeedbackOverlay } from '../components/kiosk-feedback-overlay'
import { useKioskaGlobalFlow } from '../kioska-global-context'

const t = dt.colors
const r = dt.radius

const styles = {
  wrap: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 40px',
    gap: 32,
    height: '100%'
  } as React.CSSProperties,

  formBox: {
    flex: 1,
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  } as React.CSSProperties,

  formTitle: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: '-0.015em',
    color: t.text,
    marginBottom: 4
  } as React.CSSProperties,

  formSub: {
    fontSize: 12.5,
    color: t.textMuted,
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 1.5
  } as React.CSSProperties,

  fieldLabel: {
    fontSize: 11.5,
    fontWeight: 600,
    color: t.textMuted,
    marginBottom: 6
  } as React.CSSProperties,

  input: {
    width: '100%',
    height: 52,
    border: `1.5px solid ${t.borderStrong}`,
    borderRadius: r.md,
    padding: '0 16px',
    fontSize: 20,
    fontFamily: `'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace`,
    fontWeight: 600,
    color: t.text,
    background: t.surface,
    textAlign: 'center',
    letterSpacing: '0.12em',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s, box-shadow 0.15s'
  } as React.CSSProperties,

  inputFocus: {
    borderColor: t.accent,
    boxShadow: `0 0 0 3px ${t.accentSoft}`
  } as React.CSSProperties,

  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 44,
    background: t.accent,
    color: t.accentText,
    border: `1px solid ${t.accent}`,
    borderRadius: r.md,
    fontSize: 13.5,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.15s, transform 0.1s',
    letterSpacing: '0.01em'
  } as React.CSSProperties,

  btnPrimaryLoading: {
    opacity: 0.7,
    cursor: 'not-allowed'
  } as React.CSSProperties,

  btnGhost: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    background: 'transparent',
    color: t.textMuted,
    border: `1px solid ${t.border}`,
    borderRadius: r.md,
    fontSize: 12.5,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
    alignSelf: 'flex-start'
  } as React.CSSProperties,

  resultCard: {
    background: '#f0fdf8',
    border: `1px solid ${t.success}`,
    borderRadius: r.md,
    padding: '14px 16px'
  } as React.CSSProperties,

  resultCardLabel: {
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    color: t.success,
    marginBottom: 8
  } as React.CSSProperties,

  resultGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    fontSize: 12
  } as React.CSSProperties,

  resultItemLabel: {
    color: t.textSubtle
  } as React.CSSProperties,

  divider: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    color: t.textSubtle,
    fontSize: 11.5,
    padding: '0 8px',
    fontWeight: 500,
    flexShrink: 0,
    userSelect: 'none'
  } as React.CSSProperties,

  dividerLine: {
    width: 1,
    height: 60,
    background: t.border
  } as React.CSSProperties,

  qrSide: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14
  } as React.CSSProperties,

  qrSideLabel: {
    fontSize: 12.5,
    fontWeight: 600,
    color: t.textMuted
  } as React.CSSProperties,

  qrBox: {
    width: 200,
    height: 200,
    border: `2px dashed ${t.borderStrong}`,
    borderRadius: r.lg,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    background: t.surface,
    color: t.textSubtle
  } as React.CSSProperties,

  qrHint: {
    fontSize: 11,
    color: t.textSubtle,
    textAlign: 'center',
    maxWidth: 180,
    lineHeight: 1.4
  } as React.CSSProperties
}

export function StepCheckin() {
  const { resetFlow, goBack, setCheckinQueueNumber, state } = useKioskaGlobalFlow()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [successData, setSuccessData] = useState<{
    queueNumber: string
  } | null>(null)
  const [feedback, setFeedback] = useState<{
    tone: 'success' | 'error'
    title: string
    message: string
  } | null>(null)

  const handleSubmit = async () => {
    const normalizedQueueNumber = state.checkin.queueNumber.trim().toUpperCase()

    if (!normalizedQueueNumber) {
      setFeedback({
        tone: 'error',
        title: 'Kode Antrian Wajib Diisi',
        message: 'Masukkan kode antrian terlebih dahulu sebelum melakukan check-in.'
      })
      return
    }

    try {
      setIsSubmitting(true)
      await checkinKioskaQueue(normalizedQueueNumber)
      setSuccessData({ queueNumber: normalizedQueueNumber })
      setFeedback({
        tone: 'success',
        title: 'Check-in Berhasil',
        message: 'Antrian berhasil dikonfirmasi. Silakan lanjut ke petugas atau ruang layanan.'
      })
    } catch (error) {
      setFeedback({
        tone: 'error',
        title: 'Check-in Gagal',
        message: error instanceof Error ? error.message : 'Gagal check-in, silakan coba lagi'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div style={styles.wrap}>
        {/* Form side */}
        <div style={styles.formBox}>
          <div>
            <div style={styles.formTitle}>Konfirmasi Pendaftaran Online</div>
            <div style={styles.formSub} className="mt-4">
              Masukkan nomor booking atau pindai QR Code dari aplikasi / email konfirmasi Anda,
              misalnya A-001.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={styles.fieldLabel}>Kode Antrian</div>
            <input
              style={{
                ...styles.input,
                ...(inputFocused ? styles.inputFocus : {})
              }}
              type="text"
              value={state.checkin.queueNumber}
              maxLength={20}
              placeholder="Contoh: A-001"
              onChange={(e) => setCheckinQueueNumber(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && void handleSubmit()}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
          </div>

          <button
            style={{
              ...styles.btnPrimary,
              ...(isSubmitting ? styles.btnPrimaryLoading : {})
            }}
            disabled={isSubmitting}
            onClick={() => void handleSubmit()}
            onMouseOver={(e) => {
              if (!isSubmitting)
                (e.currentTarget as HTMLButtonElement).style.background = t.accentHover
            }}
            onMouseOut={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.background = t.accent
            }}
          >
            {isSubmitting ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ animation: 'spin 0.8s linear infinite' }}
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            )}
            {isSubmitting ? 'Memproses...' : 'Cari & Konfirmasi'}
          </button>

          {successData && (
            <div style={styles.resultCard}>
              <div style={styles.resultCardLabel}>Antrian ditemukan</div>
              <div style={styles.resultGrid}>
                <div>
                  <span style={styles.resultItemLabel}>Kode Antrian:</span>
                  <br />
                  <b style={{ fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.05em' }}>
                    {successData.queueNumber}
                  </b>
                </div>
              </div>
            </div>
          )}

          <button
            style={styles.btnGhost}
            onClick={goBack}
            onMouseOver={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = t.surfaceMuted
              el.style.color = t.text
            }}
            onMouseOut={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = 'transparent'
              el.style.color = t.textMuted
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Kembali
          </button>
        </div>

        {/* Vertical divider */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          atau
          <div style={styles.dividerLine} />
        </div>

        {/* QR scan side */}
        <div style={styles.qrSide}>
          <div style={styles.qrSideLabel}>Pindai QR Code</div>
          <div style={styles.qrBox}>
            <div style={{ opacity: 0.4 }}>
              <svg
                width="56"
                height="56"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="3" height="3" />
                <rect x="19" y="14" width="2" height="2" />
                <rect x="14" y="19" width="2" height="2" />
                <rect x="18" y="19" width="3" height="2" />
              </svg>
            </div>
            <div style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.4 }}>
              Arahkan QR Code
              <br />
              dari aplikasi ke kamera
            </div>
          </div>
          <div style={styles.qrHint}>
            Kamera aktif — posisikan kode di dalam kotak selama 2 detik
          </div>
        </div>
      </div>

      <KioskFeedbackOverlay
        open={Boolean(feedback)}
        tone={feedback?.tone || 'success'}
        title={feedback?.title || ''}
        message={feedback?.message || ''}
        primaryLabel={feedback?.tone === 'success' ? 'Kembali ke Awal' : 'Tutup'}
        onPrimary={() => {
          if (feedback?.tone === 'success') {
            resetFlow()
          }
          setFeedback(null)
        }}
      />
    </>
  )
}
