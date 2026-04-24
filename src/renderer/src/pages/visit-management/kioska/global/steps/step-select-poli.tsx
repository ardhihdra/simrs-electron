import { KioskSelectPoli } from '../../components/kiosk-select-poli'
import { useKioskaGlobalFlow } from '../kioska-global-context'

export function StepSelectPoli() {
  const { goTo, setPoli } = useKioskaGlobalFlow()

  return (
    <div className="flex h-full max-h-[55vh] flex-col gap-4 overflow-hidden">
      <div className="text-base font-bold text-[#172033]">Pilih Poliklinik</div>
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
