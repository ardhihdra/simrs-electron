export type KioskaRegistrationTicketPayload = {
  lokasiKerjaId: number
  serviceTypeCode: 'REGISTRASI'
  queueDate: string
  sourceChannel: 'KIOSK'
}

export function createKioskaRegistrationTicketPayload(
  lokasiKerjaId: number,
  queueDate: string
): KioskaRegistrationTicketPayload {
  return {
    lokasiKerjaId,
    serviceTypeCode: 'REGISTRASI',
    queueDate,
    sourceChannel: 'KIOSK'
  }
}
