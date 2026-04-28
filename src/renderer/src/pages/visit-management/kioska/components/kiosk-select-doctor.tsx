import { Alert, App } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { fetchKioskaDoctors, KioskaDoctor } from '../public-client'

type Props = {
  poliId: number
  value?: string | number
  onChange?: (doctorScheduleId: string, doctor: KioskaDoctor) => void
  autoFetch?: boolean // default true
}

function getInitials(name?: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

function formatTime(time?: string): string {
  if (!time) return ''
  return time.slice(0, 5)
}

type QuotaStatus = 'ok' | 'warn' | 'full' | 'unlimited'

function getQuotaStatus(doctor: KioskaDoctor): QuotaStatus {
  const quota = doctor.quota
  if (!quota) return 'unlimited'
  if (quota.isUnlimited) return 'unlimited'
  if (quota.remainingQuota === null) return 'unlimited'
  if (quota.remainingQuota === 0) return 'full'
  if (quota.remainingQuota <= 3) return 'warn'
  return 'ok'
}

const quotaStyles: Record<QuotaStatus, { badge: string; avatar: string }> = {
  ok: {
    badge: 'bg-green-100 text-green-700',
    avatar: 'bg-blue-100 text-blue-700',
  },
  warn: {
    badge: 'bg-amber-100 text-amber-700',
    avatar: 'bg-amber-100 text-amber-700',
  },
  full: {
    badge: 'bg-red-100 text-red-500',
    avatar: 'bg-slate-100 text-slate-400',
  },
  unlimited: {
    badge: 'bg-green-100 text-green-700',
    avatar: 'bg-blue-100 text-blue-700',
  },
}

function QuotaBadge({ doctor }: { doctor: KioskaDoctor }) {
  const status = getQuotaStatus(doctor)
  const { badge } = quotaStyles[status]

  let label: string
  if (status === 'full') {
    label = 'Kuota penuh'
  } else if (status === 'unlimited') {
    label = 'Kuota tersedia'
  } else {
    label = `Sisa ${doctor.quota!.remainingQuota} kuota`
  }

  return (
    <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${badge}`}>
      {label}
    </span>
  )
}

export function KioskSelectDoctor({ poliId, value, onChange, autoFetch = true }: Props) {
  const { message } = App.useApp()

  const [doctors, setDoctors] = useState<KioskaDoctor[]>([])
  const [loading, setLoading] = useState(true)

  const selectedId = String(value || '')
  const queueDate = dayjs().format('YYYY-MM-DD')

  useEffect(() => {
    if (!autoFetch) return
    if (!poliId) return

    let cancelled = false

    void (async () => {
      try {
        setLoading(true)
        const result = await fetchKioskaDoctors({ date: queueDate, poliId })
        if (cancelled) return
        setDoctors(result.doctors || [])
      } catch (error: any) {
        if (cancelled) return
        setDoctors([])
        message.error(error?.message || 'Gagal memuat jadwal dokter')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [poliId, queueDate, autoFetch, message])

  if (loading) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
        Memuat jadwal dokter...
      </div>
    )
  }

  if (!doctors.length) {
    return <Alert type="warning" showIcon message="Belum ada dokter tersedia hari ini" />
  }

  return (
    <div className="h-full overflow-y-auto pr-1">
      <div className="grid grid-cols-3 gap-2.5">
        {doctors.map((doctor) => {
          const isSelected = selectedId === String(doctor.doctorScheduleId)
          const status = getQuotaStatus(doctor)
          const isFull = status === 'full'
          const { avatar } = quotaStyles[status]

          const timeSlot = doctor.timeSlot
          const schedule =
            timeSlot ? `Praktik: ${formatTime(timeSlot.startTime)} – ${formatTime(timeSlot.endTime)}` : null

          return (
            <div
              key={doctor.doctorScheduleId}
              onClick={() => !isFull && onChange?.(String(doctor.doctorScheduleId), doctor)}
              className={[
                'flex items-center gap-3 rounded-xl border p-3.5 transition-all',
                isFull
                  ? 'cursor-default opacity-50'
                  : 'cursor-pointer hover:border-slate-400 hover:bg-slate-50 active:bg-blue-50 active:border-blue-400',
                isSelected
                  ? '!border-blue-500 !bg-blue-50'
                  : 'border-slate-200 bg-white',
              ].join(' ')}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatar}`}
              >
                {getInitials(doctor.doctorName)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-bold leading-tight">
                  {doctor.doctorName || 'Dokter'}
                </div>
                <div className="mt-0.5 text-[11px] leading-snug text-slate-500">
                  {doctor.kategori && <span>{doctor.kategori}</span>}
                  {schedule && (
                    <>
                      {doctor.kategori && <br />}
                      <span>{schedule}</span>
                    </>
                  )}
                </div>
                <QuotaBadge doctor={doctor} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
