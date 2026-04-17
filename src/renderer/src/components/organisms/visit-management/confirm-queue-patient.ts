type QueueLike = {
  patientId?: string
  patient?: {
    id?: string
    name?: string
    nik?: string
    birthDate?: string | Date
    medicalRecordNumber?: string
    address?: string
  } | null
  patientName?: string
  patientNik?: string
  patientBirthDate?: string | Date
  patientMedicalRecordNumber?: string
  patientAddress?: string
}

export type ConfirmQueueSelectedPatient = {
  id: string
  name: string
  nik: string
  birthDate?: string | Date
  medicalRecordNumber: string
  address: string
}

export function buildConfirmQueueSelectedPatient(
  queue?: QueueLike | null
): ConfirmQueueSelectedPatient | undefined {
  const patientId = String(queue?.patient?.id || queue?.patientId || '').trim()
  if (!patientId) return undefined

  const name = String(queue?.patient?.name || queue?.patientName || '').trim() || 'Pasien terpilih'
  const nik = String(queue?.patient?.nik || queue?.patientNik || '').trim() || '-'
  const birthDate = queue?.patient?.birthDate || queue?.patientBirthDate || undefined
  const medicalRecordNumber =
    String(queue?.patient?.medicalRecordNumber || queue?.patientMedicalRecordNumber || '').trim() ||
    '-'
  const address =
    String(queue?.patient?.address || queue?.patientAddress || '').trim() || 'Alamat belum tersedia'

  return {
    id: patientId,
    name,
    nik,
    ...(birthDate ? { birthDate } : {}),
    medicalRecordNumber,
    address
  }
}
