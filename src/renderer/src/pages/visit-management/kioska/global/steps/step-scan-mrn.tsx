import { App, Button, Card, Input, Typography, type InputRef } from 'antd'
import { useEffect, useRef, useState } from 'react'

import { useKioskaGlobalFlow } from '../kioska-global-context'
import { useKioskaPatientLookup } from '../use-kioska-patient-lookup'
import { getScanMrnSubmitDecision } from './step-scan-mrn-logic'

export function StepScanMrn() {
  const { message } = App.useApp()
  const { goTo, setMrn, state } = useKioskaGlobalFlow()
  const { isResolvingPatient } = useKioskaPatientLookup()
  const inputRef = useRef<InputRef>(null)
  const [shouldAdvanceAfterLookup, setShouldAdvanceAfterLookup] = useState(false)

  // make sure autofocus
  useEffect(() => {
    const focusInput = () => inputRef.current?.focus()
    const timer = window.setTimeout(focusInput, 0)

    window.addEventListener('focus', focusInput)
    document.addEventListener('visibilitychange', focusInput)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('focus', focusInput)
      document.removeEventListener('visibilitychange', focusInput)
    }
  }, [])

  useEffect(() => {
    if (!shouldAdvanceAfterLookup) return

    const decision = getScanMrnSubmitDecision({
      mrn: state.rawatJalan.mrn,
      matchedPatient: state.rawatJalan.matchedPatient,
      isResolvingPatient
    })

    if (decision === 'wait') return

    setShouldAdvanceAfterLookup(false)

    if (decision === 'advance') {
      goTo('poli')
      return
    }

    if (decision === 'error_empty') {
      message.error('MRN wajib diisi')
      return
    }

    message.error('Pasien tidak ditemukan')
  }, [
    goTo,
    isResolvingPatient,
    message,
    shouldAdvanceAfterLookup,
    state.rawatJalan.matchedPatient,
    state.rawatJalan.mrn
  ])

  const handleSubmit = () => {
    const decision = getScanMrnSubmitDecision({
      mrn: state.rawatJalan.mrn,
      matchedPatient: state.rawatJalan.matchedPatient,
      isResolvingPatient
    })

    if (decision === 'error_empty') {
      setShouldAdvanceAfterLookup(false)
      message.error('MRN wajib diisi')
      return
    }

    if (decision === 'advance') {
      setShouldAdvanceAfterLookup(false)
      goTo('poli')
      return
    }

    setShouldAdvanceAfterLookup(true)
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="text-center">
        <Typography.Title level={2} className="!mb-2">
          Scan / Input MRN
        </Typography.Title>
        <Typography.Text className="text-base text-slate-500">
          Masukkan nomor rekam medis untuk mengambil data pasien.
        </Typography.Text>
      </div>

      <Card className="!rounded-[28px] !border-slate-200">
        <div className="flex flex-col gap-4">
          <Input
            ref={inputRef}
            autoFocus
            size="large"
            value={state.rawatJalan.mrn}
            placeholder="Contoh: 123456"
            className="!h-16 !rounded-2xl !text-xl"
            onChange={(event) => setMrn(event.target.value)}
            onPressEnter={() => handleSubmit()}
          />

          {isResolvingPatient && (
            <Typography.Text type="secondary">Mencari data pasien...</Typography.Text>
          )}

          {state.rawatJalan.mrn && !isResolvingPatient && !state.rawatJalan.matchedPatient && (
            <Typography.Text type="danger">Pasien tidak ditemukan.</Typography.Text>
          )}

          {state.rawatJalan.matchedPatient && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <Typography.Text className="block font-semibold text-emerald-700">
                {state.rawatJalan.matchedPatient.name || 'Pasien ditemukan'}
              </Typography.Text>
              <Typography.Text className="text-emerald-700/80">
                MRN: {state.rawatJalan.matchedPatient.medicalRecordNumber || '-'}
              </Typography.Text>
            </div>
          )}
        </div>
      </Card>

      <div className="mt-auto flex justify-end">
        <Button type="primary" size="large" className="scale-125 m-8" onClick={handleSubmit}>
          Lanjut Pilih Poli
        </Button>
      </div>
    </div>
  )
}
