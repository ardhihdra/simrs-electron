import { encounterRpc } from './encounter'
import { kasirRpc } from './kasir'
import { laboratoryRpc } from './laboratory'
import { laboratoryManagementRpc } from './laboratory-management'
import { mmoduleRpc } from './module'
import { nonMedicQueueRpc } from './non-medic-queue'
import { pageAccessRpc } from './pageAccess'
import { patientRpc } from './patient'
import { practitionerRpc } from './practitioner'
import { queryProcedure } from './query'
import { referralRpc } from './referral'
import { registrationRpc } from './registration'
import { roomRpc } from './room'
import { triageRpc } from './triage'
import { visitManagementRpc } from './visit-management'
import { wilayahRpc } from './wilayah'
import { windowRpc } from './window'

export const rpcRouter = {
  patient: patientRpc,
  encounter: encounterRpc,
  room: roomRpc,
  practitioner: practitionerRpc,
  triage: triageRpc,
  visitManagement: visitManagementRpc,
  laboratory: laboratoryRpc,
  laboratoryManagement: laboratoryManagementRpc,
  wilayah: wilayahRpc,
  window: windowRpc,
  module: mmoduleRpc,
  nonMedicQueue: nonMedicQueueRpc,
  registration: registrationRpc,
  referral: referralRpc,
  query: queryProcedure,
  pageAccess: pageAccessRpc,
  kasir: kasirRpc
}

export type AppRouter = typeof rpcRouter
