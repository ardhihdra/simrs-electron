import { patientRpc } from './patient'

export const rpcRouter = {
  patient: patientRpc
}

export type AppRouter = typeof rpcRouter
