import type {
  KioskaRegistrationPaymentMethod,
  KioskaRegistrationServiceType,
  KioskaRegistrationTicketPayload
} from '../public-client'
import type { KioskaQueuePayload } from '../public-client'
import type { KioskaRawatJalanFlowState } from './kioska-global-types'

export function createKioskaRegistrationTicketPayload(
  lokasiKerjaId: number,
  queueDate: string,
  serviceTypeCode: KioskaRegistrationServiceType = 'REGISTRASI'
): KioskaRegistrationTicketPayload {
  return {
    lokasiKerjaId,
    serviceTypeCode,
    queueDate,
    sourceChannel: 'KIOSK'
  }
}

export function resolveKioskaRegistrationServiceTypeFromPath(
  pathname: string
): KioskaRegistrationServiceType {
  return pathname.includes('/registration-insurance') ? 'REGISTRASI_ASURANSI' : 'REGISTRASI'
}

export function resolveInitialKioskaRegistrationPaymentMethodFromPath(
  pathname: string
): KioskaRegistrationPaymentMethod {
  return resolveKioskaRegistrationPaymentMethod(resolveKioskaRegistrationServiceTypeFromPath(pathname))
}

export function resolveKioskaRegistrationPaymentMethod(
  serviceTypeCode: KioskaRegistrationServiceType
): KioskaRegistrationPaymentMethod {
  return serviceTypeCode === 'REGISTRASI_ASURANSI' ? 'ASURANSI' : 'CASH'
}

export function resolveKioskaRegistrationServiceTypeFromPaymentMethod(
  paymentMethod: KioskaRegistrationPaymentMethod
): KioskaRegistrationServiceType {
  return paymentMethod === 'ASURANSI' ? 'REGISTRASI_ASURANSI' : 'REGISTRASI'
}

export function resolveKioskaQueueSummaryMode(
  rawatJalan: KioskaRawatJalanFlowState
): 'registration_ticket' | 'queue' {
  return rawatJalan.hasMrn === false && rawatJalan.newPatientRoute !== 'poli'
    ? 'registration_ticket'
    : 'queue'
}

export function createKioskaQueuePayload(input: {
  queueDate: string
  paymentMethod: KioskaRegistrationPaymentMethod
  rawatJalan: KioskaRawatJalanFlowState
}): KioskaQueuePayload {
  const { queueDate, paymentMethod, rawatJalan } = input

  if (!rawatJalan.selectedDoctor) {
    throw new Error('Silakan pilih dokter terlebih dahulu sebelum mengambil nomor antrian.')
  }

  const normalizedMrn = rawatJalan.mrn.trim()
  const shouldLinkPatient = Boolean(rawatJalan.hasMrn)

  if (shouldLinkPatient && normalizedMrn && !rawatJalan.matchedPatient?.id) {
    throw new Error('Periksa kembali MRN pasien sebelum melanjutkan proses antrian.')
  }

  const payload: KioskaQueuePayload = {
    queueDate,
    visitDate: queueDate,
    practitionerId: Number(rawatJalan.selectedDoctor.doctorId),
    doctorScheduleId: Number(rawatJalan.selectedDoctor.doctorScheduleId),
    registrationType: 'OFFLINE',
    paymentMethod,
    reason: 'Registrasi Kioska'
  }

  if (shouldLinkPatient && rawatJalan.matchedPatient?.id) {
    payload.patientId = rawatJalan.matchedPatient.id
  }

  if (shouldLinkPatient && normalizedMrn) {
    payload.notes = `KIOSKA_MRN:${normalizedMrn}`
  }

  return payload
}
