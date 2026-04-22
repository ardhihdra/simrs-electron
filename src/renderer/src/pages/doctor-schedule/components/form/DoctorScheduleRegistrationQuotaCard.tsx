import { Card, Form, InputNumber } from 'antd'
import {
  DAY_OPTIONS,
  REGISTRATION_QUOTA_FIELDS,
  buildRegistrationQuotaKey
} from '../../doctor-schedule-form.constants'

function sumQuota(quota: Record<string, number | undefined>, keys: string[]): number {
  return keys.reduce((acc, key) => acc + (quota?.[key] ?? 0), 0)
}

export function DoctorScheduleRegistrationQuotaCard() {
  const quota = Form.useWatch('registrationQuota') as Record<string, number | undefined> | undefined

  return (
    <Card
      bodyStyle={{ padding: '20px 24px' }}
      className="border-none mt-4"
      title="Quota Registrasi"
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
          Quota ini dipakai untuk membatasi registrasi per bucket `online/offline` dan metode
          pembayaran. Jika dikosongkan, sistem akan fallback ke `JadwalDokterSesi.kuota`.
        </div>

        <div className="flex flex-col gap-4">
          {DAY_OPTIONS.map((day) => {
            const onlineKeys = REGISTRATION_QUOTA_FIELDS.filter((f) => f.source === 'online').map(
              (f) => buildRegistrationQuotaKey(day.value, f.source, f.paymentMethod)
            )
            const offlineKeys = REGISTRATION_QUOTA_FIELDS.filter((f) => f.source === 'offline').map(
              (f) => buildRegistrationQuotaKey(day.value, f.source, f.paymentMethod)
            )
            const totalOnline = sumQuota(quota ?? {}, onlineKeys)
            const totalOffline = sumQuota(quota ?? {}, offlineKeys)
            const totalAll = totalOnline + totalOffline

            return (
              <div key={day.value} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium">{day.label}</div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-blue-600 font-medium">Online: {totalOnline}</span>
                    <span className="text-orange-600 font-medium">Offline: {totalOffline}</span>
                    <span className="bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded">
                      Total: {totalAll}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {(['online', 'offline'] as const).map((source) => (
                    <div key={`${day.value}-${source}`} className="rounded-lg border border-gray-100 p-4">
                      <div className="font-medium mb-3 capitalize">{source}</div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {REGISTRATION_QUOTA_FIELDS.filter((field) => field.source === source).map((field) => (
                          <Form.Item
                            key={`${day.value}-${field.key}`}
                            label={field.label.replace(`${source === 'online' ? 'Online' : 'Offline'} - `, '')}
                            name={[
                              'registrationQuota',
                              buildRegistrationQuotaKey(day.value, field.source, field.paymentMethod)
                            ]}
                          >
                            <InputNumber
                              className="w-full"
                              min={0}
                              placeholder="Kosongkan untuk fallback kuota sesi"
                            />
                          </Form.Item>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
