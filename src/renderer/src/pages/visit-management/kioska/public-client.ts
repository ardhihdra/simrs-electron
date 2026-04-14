import { rpc } from '@renderer/utils/client'
import type { KioskaCheckinError } from './global/kioska-checkin-error'
import { createKioskaCheckinError } from './global/kioska-checkin-error'
import type { KioskaPoliOption } from './shared'

export type KioskaDoctor = {
  doctorId: number
  doctorName?: string
  doctorScheduleId: number
  poliId: number
  poliName?: string
}

export type KioskaWorkLocation = {
  id: number
  code: string
  name: string
}

export type KioskaQueuePayload = {
  queueDate: string
  visitDate: string
  practitionerId: number
  doctorScheduleId: number
  patientId?: string
  registrationType: 'OFFLINE'
  paymentMethod: 'CASH'
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
  serviceTypeCode: 'REGISTRASI'
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

export async function fetchKioskaRegistrationLocation() {
  return (await rpc.kioskaPublic.registrationLocation({})) as KioskaWorkLocation
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
