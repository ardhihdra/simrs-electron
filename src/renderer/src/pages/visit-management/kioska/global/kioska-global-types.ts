import type {
  KioskaDoctor,
  KioskaPatient,
  KioskaRegistrationPaymentMethod,
  KioskaWorkLocation
} from '../public-client'
import type { KioskaPoliOption } from '../shared'

export type AntrianType =
  | 'rawat_jalan'
  | 'rawat_inap'
  | 'penunjang'
  | 'billing'
  | 'cashier'
  | 'pharmacy'
  | 'checkin'
export type KioskaNonMedicQueueTarget =
  | 'rawat_inap'
  | 'laboratory'
  | 'radiology'
  | 'billing'
  | 'cashier'
  | 'pharmacy'

export type KioskaGlobalStep =
  | 'antrian_type'
  | 'penunjang_type'
  | 'payment_method'
  | 'has_mrn'
  | 'scan_mrn'
  | 'poli'
  | 'dokter'
  | 'ambil_antrian'
  | 'non_medic_kiosk'
  | 'input_kode_antrian'

export type KioskaSelectedPatient = KioskaPatient
export type KioskaSelectedPoli = KioskaPoliOption
export type KioskaSelectedDoctor = KioskaDoctor
export type KioskaSelectedWorkLocation = KioskaWorkLocation

export type KioskaRawatJalanFlowState = {
  location: KioskaSelectedWorkLocation | null
  paymentMethod: KioskaRegistrationPaymentMethod | null
  hasMrn: boolean | null
  mrn: string
  matchedPatient: KioskaSelectedPatient | null
  poli: KioskaSelectedPoli | null
  selectedDoctor: KioskaSelectedDoctor | null
}

export type KioskaCheckinFlowState = {
  queueNumber: string
}

export type KioskaPublicQueueFlowState = {
  target: KioskaNonMedicQueueTarget | null
  paymentMethod: KioskaRegistrationPaymentMethod | null
}

export type KioskaGlobalFlowState = {
  step: KioskaGlobalStep
  history: KioskaGlobalStep[]
  antrianType: AntrianType | null
  rawatJalan: KioskaRawatJalanFlowState
  publicQueue: KioskaPublicQueueFlowState
  checkin: KioskaCheckinFlowState
}

export type KioskaGlobalFlowAction =
  | { type: 'SELECT_ANTRIAN_TYPE'; antrianType: AntrianType | null }
  | { type: 'SET_RAWAT_JALAN_LOCATION'; location: KioskaSelectedWorkLocation | null }
  | { type: 'SET_PAYMENT_METHOD'; paymentMethod: KioskaRegistrationPaymentMethod | null }
  | { type: 'SET_HAS_MRN'; hasMrn: boolean | null }
  | { type: 'SET_MRN'; mrn: string }
  | { type: 'SET_MATCHED_PATIENT'; patient: KioskaSelectedPatient | null }
  | { type: 'SET_POLI'; poli: KioskaSelectedPoli | null }
  | { type: 'SET_SELECTED_DOCTOR'; doctor: KioskaSelectedDoctor | null }
  | { type: 'SET_PUBLIC_QUEUE_TARGET'; target: KioskaNonMedicQueueTarget | null }
  | {
      type: 'SET_PUBLIC_QUEUE_PAYMENT_METHOD'
      paymentMethod: KioskaRegistrationPaymentMethod | null
    }
  | { type: 'SET_CHECKIN_QUEUE_NUMBER'; queueNumber: string }
  | { type: 'GO_TO'; step: KioskaGlobalStep }
  | { type: 'GO_BACK' }
  | { type: 'RESET_FLOW' }
