import { encounterRpc } from './encounter'
import { laboratoryRpc } from './laboratory'
import { patientRpc } from './patient'
import { practitionerRpc } from './practitioner'
import { roomRpc } from './room'
import { triageRpc } from './triage'

export const rpcRouter = {
  patient: patientRpc,
  encounter: encounterRpc,
  laboratory: laboratoryRpc,
  room: roomRpc,
  practitioner: practitionerRpc,
  triage: triageRpc
}

export type AppRouter = typeof rpcRouter
