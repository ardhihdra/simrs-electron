export interface BillingChargeRow {
  key: string
  kategori: 'Tarif Paket' | 'BHP Tambahan'
  paket: string
  keterangan: string
  kelas: string
  jumlah: number
  satuan: string
  harga: number
  subtotal: number
}

export interface BillingKomponenRow {
  key: string
  paket: string
  kelas: string
  tindakan: string
  komponen: string
  nominal: number
}

export interface BillingComputedData {
  chargeRows: BillingChargeRow[]
  komponenRows: BillingKomponenRow[]
  totals: {
    tarifPaketTotal: number
    bhpTambahanTotal: number
    grandTotal: number
  }
}

export interface BillingLetterMeta {
  transactionCode?: string | null
  encounterId?: string | null
  patientName?: string | null
  medicalRecordNumber?: string | null
  dpjpName?: string | null
  operatingRoomName?: string | null
  plannedDate?: string | null
  plannedTime?: string | null
  createdByName?: string | null
  verifiedByName?: string | null
}
