import { encounterRpc } from './encounter'
import { laboratoryRpc } from './laboratory'
import { laboratoryManagementRpc } from './laboratory-management'
import { patientRpc } from './patient'
import { practitionerRpc } from './practitioner'
import { roomRpc } from './room'
import { triageRpc } from './triage'
import { visitManagementRpc } from './visit-management'

export const rpcRouter = {
  patient: patientRpc,
  encounter: encounterRpc,
  laboratory: laboratoryRpc,
  room: roomRpc,
  practitioner: practitionerRpc,
  triage: triageRpc,
  visitManagement: visitManagementRpc,
  laboratoryManagement: laboratoryManagementRpc
}

export type AppRouter = typeof rpcRouter
