import type {
  KioskaRegistrationPaymentMethod,
  KioskaRegistrationServiceType,
  KioskaRegistrationTicketPayload
} from '../public-client'

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
