import { UserOutlined } from '@ant-design/icons'
import { Alert, App, Card } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { fetchKioskaDoctors, KioskaDoctor } from '../public-client'

type Props = {
  poliId: number
  value?: string | number
  onChange?: (doctorScheduleId: string, doctor: KioskaDoctor) => void
  autoFetch?: boolean // default true
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
        const result = await fetchKioskaDoctors({
          date: queueDate,
          poliId
        })

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

  // ===== UI =====

  if (loading) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
        Memuat jadwal dokter...
      </div>
    )
  }

  if (!doctors.length) {
    return <Alert type="warning" showIcon message={`Belum ada dokter tersedia hari ini`} />
  }

  return (
    <div className="max-h-[28rem] overflow-y-auto rounded-[28px] border border-slate-100 bg-slate-50/60 p-3">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {doctors.map((doctor) => {
          const isSelected = selectedId === String(doctor.doctorScheduleId)

          return (
            <Card
              key={doctor.doctorScheduleId}
              hoverable
              onClick={() => onChange?.(String(doctor.doctorScheduleId), doctor)}
              className={`group !rounded-[24px] transition-all duration-300 ${
                isSelected
                  ? '!border-blue-500 !bg-blue-50 shadow-lg'
                  : '!border-slate-200 hover:!border-blue-300 hover:shadow-md'
              }`}
              styles={{ body: { padding: 20 } }}
            >
              <div className="flex aspect-square h-full w-full flex-col items-center justify-center gap-4 text-center">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full `}>
                  <UserOutlined className={`text-2xl group-hover:text-white `} />
                </div>

                <div className="text-xs font-bold capitalize">{doctor.doctorName || 'Dokter'}</div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
