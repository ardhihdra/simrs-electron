import type { KioskaGlobalFlowAction, KioskaGlobalFlowState } from './kioska-global-types'

export function createInitialKioskaGlobalFlowState(): KioskaGlobalFlowState {
  return {
    step: 'antrian_type',
    history: [],
    antrianType: null,
    rawatJalan: {
      location: null,
      hasMrn: null,
      mrn: '',
      matchedPatient: null,
      poli: null,
      selectedDoctor: null
    },
    checkin: {
      queueNumber: ''
    }
  }
}

function resetRawatJalanState(state: KioskaGlobalFlowState): KioskaGlobalFlowState['rawatJalan'] {
  return {
    ...state.rawatJalan,
    location: null,
    hasMrn: null,
    mrn: '',
    matchedPatient: null,
    poli: null,
    selectedDoctor: null
  }
}

export function getNextStepAfterMrnAnswer(hasMrn: boolean) {
  return hasMrn ? 'scan_mrn' : 'ambil_antrian'
}

export function formatKioskaGlobalSummary(state: KioskaGlobalFlowState) {
  if (state.antrianType !== 'rawat_jalan') return null

  const parts: string[] = []

  if (state.rawatJalan.mrn) parts.push(state.rawatJalan.mrn)
  if (state.rawatJalan.poli?.name) parts.push(state.rawatJalan.poli.name)
  if (state.rawatJalan.selectedDoctor?.doctorName)
    parts.push(state.rawatJalan.selectedDoctor.doctorName)

  return parts.length ? parts.join(' → ') : null
}

export function kioskaGlobalFlowReducer(
  state: KioskaGlobalFlowState,
  action: KioskaGlobalFlowAction
): KioskaGlobalFlowState {
  switch (action.type) {
    case 'SELECT_ANTRIAN_TYPE':
      return {
        ...createInitialKioskaGlobalFlowState(),
        antrianType: action.antrianType
      }

    case 'SET_RAWAT_JALAN_LOCATION':
      return {
        ...state,
        rawatJalan: {
          ...state.rawatJalan,
          location: action.location
        }
      }

    case 'SET_HAS_MRN':
      return {
        ...state,
        rawatJalan: {
          ...state.rawatJalan,
          hasMrn: action.hasMrn,
          mrn: action.hasMrn ? state.rawatJalan.mrn : '',
          matchedPatient: action.hasMrn ? state.rawatJalan.matchedPatient : null,
          poli: null,
          selectedDoctor: null
        }
      }

    case 'SET_MRN': {
      const nextMrn = action.mrn
      const shouldClearDependentState = nextMrn !== state.rawatJalan.mrn

      return {
        ...state,
        rawatJalan: {
          ...state.rawatJalan,
          mrn: nextMrn,
          matchedPatient: shouldClearDependentState ? null : state.rawatJalan.matchedPatient,
          poli: shouldClearDependentState ? null : state.rawatJalan.poli,
          selectedDoctor: shouldClearDependentState ? null : state.rawatJalan.selectedDoctor
        }
      }
    }

    case 'SET_MATCHED_PATIENT':
      return {
        ...state,
        rawatJalan: {
          ...state.rawatJalan,
          matchedPatient: action.patient
        }
      }

    case 'SET_POLI': {
      const shouldClearDoctor = action.poli?.id !== state.rawatJalan.poli?.id

      return {
        ...state,
        rawatJalan: {
          ...state.rawatJalan,
          poli: action.poli,
          selectedDoctor: shouldClearDoctor ? null : state.rawatJalan.selectedDoctor
        }
      }
    }

    case 'SET_SELECTED_DOCTOR':
      return {
        ...state,
        rawatJalan: {
          ...state.rawatJalan,
          selectedDoctor: action.doctor
        }
      }

    case 'SET_CHECKIN_QUEUE_NUMBER':
      return {
        ...state,
        checkin: {
          queueNumber: action.queueNumber
        }
      }

    case 'GO_TO':
      if (action.step === state.step) return state

      return {
        ...state,
        step: action.step,
        history: [...state.history, state.step]
      }

    case 'GO_BACK': {
      if (!state.history.length) return state

      const nextHistory = [...state.history]
      const previousStep = nextHistory.pop()

      if (!previousStep) return state

      return {
        ...state,
        step: previousStep,
        history: nextHistory
      }
    }

    case 'RESET_FLOW':
      return createInitialKioskaGlobalFlowState()

    default:
      return state
  }
}

export function clearRawatJalanFlowState(state: KioskaGlobalFlowState): KioskaGlobalFlowState {
  return {
    ...state,
    rawatJalan: resetRawatJalanState(state)
  }
}
