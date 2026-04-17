type CollectorSource = {
  id?: number
  namaLengkap?: string
  hakAksesId?: string | null
  hakAkses?: string | null
  kontrakPegawai?: Array<{
    kodeJabatan?: string | null
    role?: string | null
  }>
}

type ReferenceCodeSource = {
  id?: string | number
  display?: string
  category?: string
}

type SpecimenSource = {
  id?: string
  labelNumber?: number
  collectedAt?: string
  status?: string
}

export type SpecimenCollectorOption = {
  label: string
  value: number
}

export type SpecimenTypeOption = {
  label: string
  value: string
}

export function buildSpecimenTypeOptions(rows: ReferenceCodeSource[]): SpecimenTypeOption[] {
  return rows
    .filter((row) => String(row.category || '').toUpperCase() === 'SPECIMEN_TYPE')
    .map((row) => ({
      label: String(row.display || '-'),
      value: String(row.id || '')
    }))
    .filter((row) => row.value.length > 0)
}

export function getLatestCollectedSpecimen<T extends SpecimenSource>(
  specimens: T[]
): T | undefined {
  return [...specimens]
    .filter((specimen) => specimen && String(specimen.status || '').toUpperCase() === 'COLLECTED')
    .sort((left, right) => {
      const leftTime = new Date(left.collectedAt || 0).getTime()
      const rightTime = new Date(right.collectedAt || 0).getTime()
      return rightTime - leftTime
    })[0]
}
