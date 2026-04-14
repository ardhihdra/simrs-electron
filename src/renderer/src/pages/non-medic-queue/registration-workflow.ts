export type RegistrationServeContext = {
  ticketId: string
  ticketNo: string
  servicePointId?: number
  servicePointName?: string
}

export function isRegistrationQueueServiceType(serviceTypeCode: string) {
  return serviceTypeCode === 'REGISTRASI'
}

export function buildRegistrationServeSummary(context: RegistrationServeContext) {
  return {
    title: 'Buat Antrian Poli',
    ticketLabel: `Tiket ${context.ticketNo}`,
    servicePointLabel: context.servicePointName
  }
}
