import { createContext, ReactNode, useContext, useMemo, useReducer } from 'react'

import { createInitialKioskaGlobalFlowState, kioskaGlobalFlowReducer } from './kioska-global-flow'
import type {
  AntrianType,
  KioskaGlobalFlowAction,
  KioskaGlobalFlowState,
  KioskaGlobalStep,
  KioskaSelectedDoctor,
  KioskaSelectedPatient,
  KioskaSelectedPoli,
  KioskaSelectedWorkLocation
} from './kioska-global-types'

const KioskaGlobalFlowStateContext = createContext<KioskaGlobalFlowState | null>(null)
const KioskaGlobalFlowDispatchContext =
  createContext<React.Dispatch<KioskaGlobalFlowAction> | null>(null)

type KioskaGlobalFlowActions = {
  selectAntrianType: (antrianType: AntrianType | null) => void
  setRawatJalanLocation: (location: KioskaSelectedWorkLocation | null) => void
  setHasMrn: (hasMrn: boolean | null) => void
  setMrn: (mrn: string) => void
  setMatchedPatient: (patient: KioskaSelectedPatient | null) => void
  setPoli: (poli: KioskaSelectedPoli | null) => void
  setSelectedDoctor: (doctor: KioskaSelectedDoctor | null) => void
  setCheckinQueueNumber: (queueNumber: string) => void
  goTo: (step: KioskaGlobalStep) => void
  goBack: () => void
  resetFlow: () => void
}

export function KioskaGlobalFlowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    kioskaGlobalFlowReducer,
    undefined,
    createInitialKioskaGlobalFlowState
  )

  return (
    <KioskaGlobalFlowStateContext.Provider value={state}>
      <KioskaGlobalFlowDispatchContext.Provider value={dispatch}>
        {children}
      </KioskaGlobalFlowDispatchContext.Provider>
    </KioskaGlobalFlowStateContext.Provider>
  )
}

export function useKioskaGlobalFlowState() {
  const context = useContext(KioskaGlobalFlowStateContext)
  if (!context) {
    throw new Error('useKioskaGlobalFlowState must be used within KioskaGlobalFlowProvider')
  }

  return context
}

export function useKioskaGlobalFlowActions(): KioskaGlobalFlowActions {
  const dispatch = useContext(KioskaGlobalFlowDispatchContext)

  if (!dispatch) {
    throw new Error('useKioskaGlobalFlowActions must be used within KioskaGlobalFlowProvider')
  }

  return useMemo(
    () => ({
      selectAntrianType: (antrianType: AntrianType | null) =>
        dispatch({ type: 'SELECT_ANTRIAN_TYPE', antrianType }),
      setRawatJalanLocation: (location: KioskaSelectedWorkLocation | null) =>
        dispatch({ type: 'SET_RAWAT_JALAN_LOCATION', location }),
      setHasMrn: (hasMrn: boolean | null) => dispatch({ type: 'SET_HAS_MRN', hasMrn }),
      setMrn: (mrn: string) => dispatch({ type: 'SET_MRN', mrn }),
      setMatchedPatient: (patient: KioskaSelectedPatient | null) =>
        dispatch({ type: 'SET_MATCHED_PATIENT', patient }),
      setPoli: (poli: KioskaSelectedPoli | null) => dispatch({ type: 'SET_POLI', poli }),
      setSelectedDoctor: (doctor: KioskaSelectedDoctor | null) =>
        dispatch({ type: 'SET_SELECTED_DOCTOR', doctor }),
      setCheckinQueueNumber: (queueNumber: string) =>
        dispatch({ type: 'SET_CHECKIN_QUEUE_NUMBER', queueNumber }),
      goTo: (step: KioskaGlobalStep) => dispatch({ type: 'GO_TO', step }),
      goBack: () => dispatch({ type: 'GO_BACK' }),
      resetFlow: () => dispatch({ type: 'RESET_FLOW' })
    }),
    [dispatch]
  )
}

export function useKioskaGlobalFlow() {
  const state = useKioskaGlobalFlowState()
  const actions = useKioskaGlobalFlowActions()

  return useMemo(
    () => ({
      state,
      ...actions
    }),
    [actions, state]
  )
}
