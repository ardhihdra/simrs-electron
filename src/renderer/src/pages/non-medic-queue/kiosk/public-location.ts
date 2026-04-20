import type { KioskaNonMedicServiceType } from '@renderer/pages/visit-management/kioska/public-client'

export type ServiceKioskPayload = {
  LokasiKerjaCode?: string
}

export function normalizeServiceKioskPayloadLokasiKerjaCode(
  payload?: ServiceKioskPayload
): string | undefined {
  const normalized = String(payload?.LokasiKerjaCode ?? '')
    .trim()
    .toUpperCase()

  return normalized.length > 0 ? normalized : undefined
}

export function createPublicKioskLocationResolverInput(
  serviceTypeCode: KioskaNonMedicServiceType,
  payload?: ServiceKioskPayload
) {
  const lokasiKerjaCode = normalizeServiceKioskPayloadLokasiKerjaCode(payload)

  if (lokasiKerjaCode) {
    return {
      serviceTypeCode,
      lokasiKerjaCode
    }
  }

  return {
    serviceTypeCode
  }
}

export function createServiceKioskTicketPayload(
  lokasiKerjaId: number,
  serviceTypeCode: KioskaNonMedicServiceType,
  queueDate: string
) {
  return {
    lokasiKerjaId,
    serviceTypeCode,
    queueDate,
    sourceChannel: 'KIOSK' as const
  }
}
