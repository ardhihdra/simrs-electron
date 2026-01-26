import { encounterRpc } from './encounter'
import { patientRpc } from './patient'
import { practitionerRpc } from './practitioner'
import { roomRpc } from './room'
import { triageRpc } from './triage'

export const rpcRouter = {
  patient: patientRpc,
  encounter: encounterRpc,
  room: roomRpc,
  practitioner: practitionerRpc,
  triage: triageRpc
}

export type AppRouter = typeof rpcRouter
