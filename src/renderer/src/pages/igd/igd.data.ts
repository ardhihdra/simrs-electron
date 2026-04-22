import type { PatientAttributes } from 'simrs-types'

export type IgdArrivalSource = 'Datang sendiri' | 'Rujukan' | 'Polisi'
export type IgdPaymentMethod = 'Umum' | 'BPJS' | 'Asuransi' | 'Perusahaan'
export type IgdRegistrationMode = 'baru' | 'existing' | 'temporary'
export type IgdDashboardPatientStatus = 'menunggu' | 'triase' | 'penanganan' | 'observasi' | 'disposisi'
export type IgdDashboardBedStatus = 'available' | 'occupied' | 'cleaning'
export type IgdDashboardBedZone = 'Resusitasi' | 'Observasi' | 'Treatment'

export type IgdDashboardPatient = {
  id: string
  registrationNumber: string
  medicalRecordNumber?: string
  tempCode?: string
  isTemporaryPatient: boolean
  name: string
  ageLabel: string
  complaint: string
  paymentLabel: IgdPaymentMethod
  arrivalSource: IgdArrivalSource
  triageLevel: 1 | 2 | 3 | 4 | 5
  status: IgdDashboardPatientStatus
  bedCode?: string
  arrivalTime: string
  triageTime?: string
  doctorName: string
}

export type IgdDashboardBed = {
  code: string
  zone: IgdDashboardBedZone
  status: IgdDashboardBedStatus
  patientId: string | null
}

export type IgdDashboard = {
  summary: {
    totalActive: number
    triageCounts: Record<'1' | '2' | '3' | '4' | '5', number>
    bedAvailable: number
    bedTotal: number
    averageResponseMinutes: number
    totalToday: number
  }
  patients: IgdDashboardPatient[]
  beds: IgdDashboardBed[]
}

export type IgdRegistrationDraft = {
  name: string
  nik: string
  birthDate: string
  gender: 'L' | 'P' | '?'
  phone: string
  estimatedAge: string
  arrivalDateTime: string
  arrivalSource: IgdArrivalSource
  paymentMethod: IgdPaymentMethod
  complaint: string
  guarantorName: string
  guarantorRelationship: string
  guarantorNik: string
  guarantorPhone: string
}

export type IgdRegistrationCommand = {
  patientType: 'existing' | 'new' | 'temporary'
  patientId?: string
  patientData?: {
    nik?: string
    name?: string
    gender?: 'male' | 'female' | 'other' | 'L' | 'P' | '?'
    birthDate?: string
    estimatedAge?: string
    phone?: string
    email?: string
    address?: string
    maritalStatus?: string
    city?: string
    province?: string
    postalCode?: string
    country?: string
    religion?: string
    district?: string
    village?: string
    rt?: string
    rw?: string
    relatedPerson?: Array<{
      name: string
      phone: string
      relationship: string
      email?: string
    }>
    active?: boolean
    familyEmployee?: number | null
    kepegawaianId?: number | null
    needEmr?: boolean
  }
  complaint: string
  arrivalSource: IgdArrivalSource
  paymentMethod: IgdPaymentMethod
  arrivalDateTime?: string
  guarantor?: {
    name?: string
    relationship?: string
    nik?: string
    phone?: string
  }
}

export type SubmitIgdRegistrationInput = {
  mode: IgdRegistrationMode
  draft: IgdRegistrationDraft
  selectedPatient?: PatientAttributes
}

export const EMPTY_IGD_DASHBOARD: IgdDashboard = {
  summary: {
    totalActive: 0,
    triageCounts: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
    bedAvailable: 0,
    bedTotal: 0,
    averageResponseMinutes: 0,
    totalToday: 0
  },
  patients: [],
  beds: []
}

export function createIgdDashboardFixture(): IgdDashboard {
  return {
    summary: {
      totalActive: 4,
      triageCounts: { '1': 1, '2': 1, '3': 1, '4': 1, '5': 0 },
      bedAvailable: 8,
      bedTotal: 12,
      averageResponseMinutes: 4,
      totalToday: 4
    },
    patients: [
      {
        id: 'patient-temp-1',
        registrationNumber: 'IGD-2604-001',
        tempCode: 'TMP-IGD-001',
        isTemporaryPatient: true,
        name: 'TIDAK DIKENAL',
        ageLabel: '~50 L',
        complaint: 'Trauma kepala berat',
        paymentLabel: 'Umum',
        arrivalSource: 'Polisi',
        triageLevel: 1,
        status: 'observasi',
        bedCode: 'R-01',
        arrivalTime: '09:15',
        triageTime: '09:18',
        doctorName: 'dr. IGD'
      },
      {
        id: 'patient-2',
        registrationNumber: 'IGD-2604-002',
        medicalRecordNumber: 'MRN-IGD-002',
        isTemporaryPatient: false,
        name: 'Wahyu Handayani',
        ageLabel: '34 P',
        complaint: 'Perdarahan aktif post partum',
        paymentLabel: 'BPJS',
        arrivalSource: 'Rujukan',
        triageLevel: 2,
        status: 'triase',
        arrivalTime: '09:22',
        triageTime: '09:27',
        doctorName: ''
      },
      {
        id: 'patient-3',
        registrationNumber: 'IGD-2604-003',
        medicalRecordNumber: 'MRN-IGD-003',
        isTemporaryPatient: false,
        name: 'Sutrisno Hadi',
        ageLabel: '62 L',
        complaint: 'Nyeri dada hebat',
        paymentLabel: 'BPJS',
        arrivalSource: 'Datang sendiri',
        triageLevel: 3,
        status: 'penanganan',
        bedCode: 'O-01',
        arrivalTime: '09:35',
        triageTime: '09:40',
        doctorName: 'dr. IGD'
      },
      {
        id: 'patient-4',
        registrationNumber: 'IGD-2604-004',
        medicalRecordNumber: 'MRN-IGD-004',
        isTemporaryPatient: false,
        name: 'Ahmad Saputra',
        ageLabel: '38 L',
        complaint: 'Vulnus scissum jari tangan kanan',
        paymentLabel: 'Umum',
        arrivalSource: 'Datang sendiri',
        triageLevel: 4,
        status: 'menunggu',
        arrivalTime: '09:55',
        doctorName: ''
      }
    ],
    beds: [
      { code: 'R-01', zone: 'Resusitasi', status: 'occupied', patientId: 'patient-temp-1' },
      { code: 'R-02', zone: 'Resusitasi', status: 'available', patientId: null },
      { code: 'R-03', zone: 'Resusitasi', status: 'available', patientId: null },
      { code: 'R-04', zone: 'Resusitasi', status: 'available', patientId: null },
      { code: 'O-01', zone: 'Observasi', status: 'occupied', patientId: 'patient-3' },
      { code: 'O-02', zone: 'Observasi', status: 'available', patientId: null },
      { code: 'O-03', zone: 'Observasi', status: 'available', patientId: null },
      { code: 'O-04', zone: 'Observasi', status: 'cleaning', patientId: null },
      { code: 'O-05', zone: 'Observasi', status: 'available', patientId: null },
      { code: 'O-06', zone: 'Observasi', status: 'available', patientId: null },
      { code: 'T-01', zone: 'Treatment', status: 'available', patientId: null },
      { code: 'T-02', zone: 'Treatment', status: 'available', patientId: null }
    ]
  }
}

function mapGender(gender: IgdRegistrationDraft['gender']): 'male' | 'female' | 'other' {
  if (gender === 'L') return 'male'
  if (gender === 'P') return 'female'
  return 'other'
}

function buildGuarantor(draft: IgdRegistrationDraft) {
  if (
    !draft.guarantorName.trim() &&
    !draft.guarantorRelationship.trim() &&
    !draft.guarantorNik.trim() &&
    !draft.guarantorPhone.trim()
  ) {
    return undefined
  }

  return {
    name: draft.guarantorName.trim() || undefined,
    relationship: draft.guarantorRelationship.trim() || undefined,
    nik: draft.guarantorNik.trim() || undefined,
    phone: draft.guarantorPhone.trim() || undefined
  }
}

export function buildIgdRegistrationCommand({
  mode,
  draft,
  selectedPatient
}: SubmitIgdRegistrationInput): IgdRegistrationCommand {
  const baseCommand = {
    complaint: draft.complaint.trim(),
    arrivalSource: draft.arrivalSource,
    paymentMethod: draft.paymentMethod,
    arrivalDateTime: draft.arrivalDateTime,
    guarantor: buildGuarantor(draft)
  } satisfies Omit<IgdRegistrationCommand, 'patientType'>

  if (mode === 'existing') {
    if (!selectedPatient?.id) {
      throw new Error('Pilih pasien terlebih dahulu.')
    }

    return {
      ...baseCommand,
      patientType: 'existing',
      patientId: selectedPatient.id
    }
  }

  if (mode === 'temporary') {
    return {
      ...baseCommand,
      patientType: 'temporary',
      patientData: {
        name: draft.name.trim(),
        gender: draft.gender,
        estimatedAge: draft.estimatedAge.trim() || undefined,
        phone: draft.phone.trim() || undefined
      }
    }
  }

  return {
    ...baseCommand,
    patientType: 'new',
    patientData: {
      nik: draft.nik.trim() || undefined,
      name: draft.name.trim(),
      gender: mapGender(draft.gender),
      birthDate: draft.birthDate || undefined,
      phone: draft.phone.trim() || undefined,
      email: '',
      address: '',
      maritalStatus: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'ID',
      religion: '',
      district: '',
      village: '',
      rt: '',
      rw: '',
      relatedPerson: [],
      active: true,
      familyEmployee: null,
      kepegawaianId: null,
      needEmr: true
    }
  }
}
