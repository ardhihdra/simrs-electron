/**
 * purpose: Render unified inpatient clinical workspace from rawat-inap patient detail route.
 * main callers: Dashboard rawat-inap route `/dashboard/rawat-inap/daftar-pasien/:encounterId`.
 * key dependencies: `DoctorWorkspace` and `EncounterType` enum.
 * main/public functions: `RawatInapDaftarPasienDetailRoute` default export.
 * important side effects: none.
 */
import { EncounterType } from '@shared/encounter'

import DoctorWorkspace from '../doctor-emr/doctor-workspace'
import { RAWAT_INAP_PAGE_PATHS } from './rawat-inap.config'

export default function RawatInapDaftarPasienDetailRoute() {
  return (
    <DoctorWorkspace backPath={RAWAT_INAP_PAGE_PATHS.pasien} forceEncounterType={EncounterType.IMP} />
  )
}
