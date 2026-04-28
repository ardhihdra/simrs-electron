import { rpc } from '@renderer/utils/client'
import type { KioskaCheckinError } from './global/kioska-checkin-error'
import { createKioskaCheckinError } from './global/kioska-checkin-error'
import type { KioskaPoliOption } from './shared'

export type KioskaDoctorSession = {
  sessionNumber: number
  startTime: string
  endTime: string
  quota?: number
}

export type KioskaDoctorTimeSlot = {
  startTime: string
  endTime: string
}

export type KioskaDoctorQuota = {
  isUnlimited: boolean
  totalQuota: number | null
  usedQuota: number
  cancelledQuota: number
  remainingQuota: number | null
}

export type KioskaDoctor = {
  doctorId: number
  doctorName?: string
  doctorScheduleId: number
  poliId: number
  poliName?: string
  kategori?: string
  timeSlot?: KioskaDoctorTimeSlot | null
  sessions?: KioskaDoctorSession[]
  quota?: KioskaDoctorQuota
}

export type KioskaWorkLocation = {
  id: number
  code: string
  name: string
}

export type KioskaNonMedicServiceType =
  | 'BILLING'
  | 'CASHIER'
  | 'PHARMACY'
  | 'REGISTRASI'
  | 'REGISTRASI_ASURANSI'

export type KioskaRegistrationServiceType = 'REGISTRASI' | 'REGISTRASI_ASURANSI'
export type KioskaRegistrationPaymentMethod = 'CASH' | 'ASURANSI'

export type KioskaQueuePayload = {
  queueDate: string
  visitDate: string
  practitionerId: number
  doctorScheduleId: number
  patientId?: string
  registrationType: 'OFFLINE'
  paymentMethod: KioskaRegistrationPaymentMethod
  reason: string
  notes?: string
}

export type KioskaPatient = {
  id: string
  name?: string
  medicalRecordNumber?: string
  address?: string
  birthDate?: string | Date | null
}

export type KioskaRegisterQueueResult = {
  queueNumber: string
}

export type KioskaRegistrationTicketPayload = {
  lokasiKerjaId: number
  serviceTypeCode: KioskaRegistrationServiceType
  queueDate: string
  sourceChannel: 'KIOSK'
}

export type KioskaRegistrationTicketResult = {
  ticketId?: string
  ticketNo?: string
  queueDate?: string
}

export async function fetchKioskaPolis() {
  return (await rpc.kioskaPublic.polis({})) as KioskaPoliOption[]
}

export async function fetchKioskaRegistrationLocation(input?: {
  serviceTypeCode?: KioskaRegistrationServiceType
  lokasiKerjaCode?: string
}) {
  return (await rpc.kioskaPublic.registrationLocation(input ?? {})) as KioskaWorkLocation
}

export async function fetchKioskaNonMedicLocation(input: {
  serviceTypeCode: KioskaNonMedicServiceType
  lokasiKerjaCode?: string
}) {
  return (await rpc.kioskaPublic.nonMedicLocation(input)) as KioskaWorkLocation
}

export async function fetchKioskaDoctors(input: { date: string; poliId: number }) {
  return (await rpc.kioskaPublic.availableDoctors(input)) as { doctors: KioskaDoctor[] }
}

export async function fetchKioskaPatients(input: { medicalRecordNumber: string }) {
  return (await rpc.kioskaPublic.patients(input)) as KioskaPatient[]
}

export async function registerKioskaQueue(payload: KioskaQueuePayload) {
  return (await rpc.kioskaPublic.register(payload)) as KioskaRegisterQueueResult
}

export async function createKioskaRegistrationTicket(payload: KioskaRegistrationTicketPayload) {
  return (await rpc.kioskaPublic.registrationTicket(payload)) as KioskaRegistrationTicketResult
}

export async function checkinKioskaQueue(queueNumber: string) {
  try {
    return await rpc.kioskaPublic.checkin({ queueNumber })
  } catch (error) {
    throw createKioskaCheckinError(error) as KioskaCheckinError
  }
}
