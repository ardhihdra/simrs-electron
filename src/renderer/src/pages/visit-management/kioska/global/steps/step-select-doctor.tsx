import { Alert, Typography } from 'antd'

import { KioskSelectDoctor } from '../../components/kiosk-select-doctor'
import { useKioskaGlobalFlow } from '../kioska-global-context'

export function StepSelectDoctor() {
  const { goTo, setSelectedDoctor, state } = useKioskaGlobalFlow()

  if (!state.rawatJalan.poli) {
    return <Alert type="warning" showIcon message="Pilih poli terlebih dahulu." />
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-hidden">
      <div className="text-center">
        <Typography.Title level={2} className="!mb-2">
          Pilih Dokter
        </Typography.Title>
        <Typography.Text className="text-base text-slate-500">
          Dokter tersedia untuk {state.rawatJalan.poli.name}.
        </Typography.Text>
      </div>

      <div className="min-h-0 flex-1">
        <KioskSelectDoctor
          poliId={state.rawatJalan.poli.id}
          value={state.rawatJalan.selectedDoctor?.doctorScheduleId}
          onChange={(_doctorScheduleId, doctor) => {
            setSelectedDoctor(doctor)
            goTo('ambil_antrian')
          }}
        />
      </div>
    </div>
  )
}
