import { Typography } from 'antd'

import { KioskSelectPoli } from '../../components/kiosk-select-poli'
import { useKioskaGlobalFlow } from '../kioska-global-context'

export function StepSelectPoli() {
  const { goTo, setPoli } = useKioskaGlobalFlow()

  return (
    <div className="flex h-full max-h-[55vh] flex-col gap-6 overflow-hidden">
      <div className="text-center">
        <Typography.Title level={2} className="!mb-2">
          Pilih Poli
        </Typography.Title>
        <Typography.Text className="text-base text-slate-500">
          Daftar poli akan tampil di bawah. Pilih poli tujuan untuk melihat dokter yang tersedia.
        </Typography.Text>
      </div>

      <div className="min-h-0 flex-1">
        <KioskSelectPoli
          onSelect={(poli) => {
            setPoli(poli)
            goTo('dokter')
          }}
        />
      </div>
    </div>
  )
}
