import { Button, Card, Input, Typography } from 'antd'
import { useState } from 'react'

import { checkinKioskaQueue } from '../../public-client'
import { KioskFeedbackOverlay } from '../components/kiosk-feedback-overlay'
import { useKioskaGlobalFlow } from '../kioska-global-context'

export function StepCheckin() {
  const { resetFlow, setCheckinQueueNumber, state } = useKioskaGlobalFlow()
  const [isSubmitting, setIsSubmitting] = useState(false)
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
      <div className="relative flex h-full flex-col items-center justify-center gap-6 text-center">
        <div className="max-w-2xl">
          <Typography.Title level={2} className="!mb-2">
            Check-in Antrian
          </Typography.Title>
          <Typography.Text className="text-base text-slate-500">
            Masukkan kode antrian dengan format <strong>PREFIX-NOMOR</strong>, misalnya A-001.
          </Typography.Text>
        </div>

        <Card className="!w-full !max-w-2xl !rounded-[28px] !border-slate-200">
          <div className="flex flex-col gap-4">
            <Input
              size="large"
              value={state.checkin.queueNumber}
              placeholder="Contoh: A-001"
              className="!h-16 !rounded-2xl !text-center !text-2xl !uppercase"
              onChange={(event) => setCheckinQueueNumber(event.target.value.toUpperCase())}
              onPressEnter={() => void handleSubmit()}
            />
            <Typography.Text className="text-sm text-slate-500">
              Silahkan Masukan Kode Antrian Anda.
            </Typography.Text>
          </div>
        </Card>

        <Button
          loading={isSubmitting}
          type="primary"
          className="!h-16 !rounded-2xl !px-10 !text-xl"
          onClick={() => void handleSubmit()}
        >
          Check-in
        </Button>

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
      </div>
    </>
  )
}
