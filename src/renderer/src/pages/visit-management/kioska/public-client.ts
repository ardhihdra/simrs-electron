import { rpc } from '@renderer/utils/client'
import type { KioskaPoliOption } from './shared'

export type KioskaDoctor = {
  doctorId: number
  doctorName?: string
  doctorScheduleId: number
  poliId: number
  poliName?: string
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
}

export async function fetchKioskaPolis() {
  return (await rpc.kioskaPublic.polis({})) as KioskaPoliOption[]
}

export async function fetchKioskaDoctors(input: { date: string; poliId: number }) {
  return (await rpc.kioskaPublic.availableDoctors(input)) as { doctors: KioskaDoctor[] }
}

export async function fetchKioskaPatients(input: { medicalRecordNumber: string }) {
  return (await rpc.kioskaPublic.patients(input)) as KioskaPatient[]
}

export async function registerKioskaQueue(payload: KioskaQueuePayload) {
  return await rpc.kioskaPublic.register(payload)
}
