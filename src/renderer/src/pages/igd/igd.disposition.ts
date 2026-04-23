import type { DesktopTableActionItem } from '../../components/design-system/organisms/DesktopGenericTable'

import type { IgdDashboardPatient } from './igd.data'

type BuildIgdTableActionsArgs = {
  patient: IgdDashboardPatient
  onOpenTriase?: (patient: IgdDashboardPatient) => void
  onOpenBedMap?: (patient: IgdDashboardPatient) => void
  onOpenDisposition?: (patient: IgdDashboardPatient) => void
  onOpenReplacePatient?: (patient: IgdDashboardPatient) => void
}

export const IGD_DISCHARGE_OPTIONS = [
  { label: 'Sembuh (Cured)', value: 'CURED' },
  { label: 'Rujuk (Referred)', value: 'REFERRED' },
  { label: 'Pulang Paksa (Against Advice)', value: 'AGAINST_ADVICE' }
] as const

export function buildIgdTableActions({
  patient,
  onOpenTriase,
  onOpenBedMap,
  onOpenDisposition,
  onOpenReplacePatient
}: BuildIgdTableActionsArgs): DesktopTableActionItem<IgdDashboardPatient>[] {
  const actions: DesktopTableActionItem<IgdDashboardPatient>[] = []

  if (patient.status === 'menunggu' || patient.status === 'triase') {
    actions.push({
      label: 'Triase',
      onClick: () => onOpenTriase?.(patient)
    })
  } else if (patient.status === 'penanganan' || patient.status === 'observasi') {
    actions.push({
      label: 'Bed',
      onClick: () => onOpenBedMap?.(patient)
    })
  }

  actions.push({
    label: 'Disposisi',
    onClick: () => onOpenDisposition?.(patient)
  })

  if (patient.isTemporaryPatient) {
    actions.push({
      label: 'Ubah Pasien',
      onClick: () => onOpenReplacePatient?.(patient)
    })
  }

  return actions
}
