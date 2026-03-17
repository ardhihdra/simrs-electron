import { encounterRpc } from './encounter'
import { laboratoryRpc } from './laboratory'
import { laboratoryManagementRpc } from './laboratory-management'
import { mmoduleRpc } from './module'
import { patientRpc } from './patient'
import { practitionerRpc } from './practitioner'
import { queryProcedure } from './query'
import { registrationRpc } from './registration'
import { roomRpc } from './room'
import { triageRpc } from './triage'
import { visitManagementRpc } from './visit-management'
import { wilayahRpc } from './wilayah'
import { windowRpc } from './window'

export const rpcRouter = {
  patient: patientRpc,
  encounter: encounterRpc,
  laboratory: laboratoryRpc,
  room: roomRpc,
  practitioner: practitionerRpc,
  triage: triageRpc,
  visitManagement: visitManagementRpc,
  laboratoryManagement: laboratoryManagementRpc,
  wilayah: wilayahRpc,
  window: windowRpc,
  module: mmoduleRpc,
  registration: registrationRpc,
  query: queryProcedure
}

export type AppRouter = typeof rpcRouter
