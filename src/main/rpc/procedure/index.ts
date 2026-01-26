import { encounterRpc } from './encounter'
import { patientRpc } from './patient'
import { roomRpc } from './room'

export const rpcRouter = {
  patient: patientRpc,
  encounter: encounterRpc,
  room: roomRpc
}

export type AppRouter = typeof rpcRouter
