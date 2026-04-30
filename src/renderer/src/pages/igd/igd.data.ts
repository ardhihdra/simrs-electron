import type { PatientAttributes } from 'simrs-types'

import type { IgdBedZoneName } from './igd.bed-zoning'
import type { IgdTriageLevel } from './igd.triage-level'
import { getQuickTriageLevel } from './igd.quick-triage'

export type IgdArrivalSource = 'Datang sendiri' | 'Rujukan' | 'Polisi'
export type IgdPaymentMethod = 'Umum' | 'BPJS' | 'Asuransi' | 'Perusahaan'
export type IgdRegistrationMode = 'baru' | 'existing' | 'temporary'
export type IgdDashboardPatientStatus = 'menunggu' | 'triase' | 'penanganan' | 'observasi' | 'disposisi'
export type IgdDashboardBedStatus = 'available' | 'occupied' | 'cleaning'
export type IgdDashboardBedZone = IgdBedZoneName

export type IgdDashboardPatientTimeTracking = {
  arrivalTime: string
  quickTriageTime?: string
  triageTime?: string
  doctorAssignedTime?: string
  bedAssignedTime?: string
  bedReleasedTime?: string
  referredTime?: string
  closedTime?: string
}

export type IgdDashboardPatient = {
  id: string
  encounterId: string
  registrationNumber: string
  encounterCode: string
  medicalRecordNumber?: string
  tempCode?: string
  isTemporaryPatient: boolean
  name: string
  ageLabel: string
  genderLabel: string
  complaint: string
  paymentLabel: IgdPaymentMethod
  arrivalSource: IgdArrivalSource
  triageLevel: IgdTriageLevel
  status: IgdDashboardPatientStatus
  unitLabel: string
  bedCode?: string
  arrivalTime: string
  triageTime?: string
  doctorName: string
  doctorTargetName: string
  timeTracking: IgdDashboardPatientTimeTracking
  guarantorName?: string | null
  estimatedCost?: number | null
}

export type IgdDashboardBed = {
  code: string
  zone: IgdDashboardBedZone
  status: IgdDashboardBedStatus
  patientId: string | null
  bedId?: string
  roomId?: string
  roomCodeId?: string
  roomClassCodeId?: string
  currentAssignmentId?: string
}

export type IgdDashboard = {
  summary: {
    totalActive: number
    triageCounts: Record<'0' | '1' | '2' | '3' | '4', number>
    bedAvailable: number
    bedTotal: number
    averageResponseMinutes: number
    totalToday: number
  }
  patients: IgdDashboardPatient[]
  beds: IgdDashboardBed[]
}

export type IgdDailyShiftReportItem = {
  key: 'morning' | 'afternoon' | 'night'
  label: string
  startTime: string
  endTime: string
  totalPatients: number
}

export type IgdDailyCaseTypeReportItem = {
  key: 'trauma' | 'non-trauma'
  label: string
  value: string
  note?: string
}

export type IgdDailyReport = {
  date: string
  generatedAt: string
  totalPatients: number
  shiftTotals: IgdDailyShiftReportItem[]
  caseTypeSummary: IgdDailyCaseTypeReportItem[]
}

export type IgdRegistrationDraft = {
  name: string
  nik: string
  birthDate: string
  gender: 'L' | 'P' | '?'
  religion: string
  phone: string
  estimatedAge: string
  arrivalDateTime: string
  arrivalSource: IgdArrivalSource
  paymentMethod: IgdPaymentMethod
  mitraId?: string
  complaint: string
  guarantorName: string
  guarantorRelationship: string
  guarantorNik: string
  guarantorPhone: string
}

export type IgdGuarantorRelatedPerson = {
  name: string
  phone: string
  relationship: string
  email?: string
  isGuarantor?: boolean
}

export type IgdGuarantorSource = 'new' | `existing:${number}`

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
      isGuarantor?: boolean
    }>
    active?: boolean
    familyEmployee?: number | null
    kepegawaianId?: number | null
    needEmr?: boolean
  }
  complaint: string
  arrivalSource: IgdArrivalSource
  paymentMethod: IgdPaymentMethod
  mitraId?: number
  arrivalDateTime?: string
  guarantor?: {
    name?: string
    relationship?: string
    nik?: string
    phone?: string
  }
  quickTriage?: {
    level: IgdTriageLevel
    conditionKey: string
    effectiveDateTime: string
  }
}

export type SubmitIgdRegistrationInput = {
  mode: IgdRegistrationMode
  draft: IgdRegistrationDraft
  selectedPatient?: PatientAttributes
  guarantorSource?: IgdGuarantorSource
  intent: 'daftar' | 'triase'
  quickCondition: string
}

export const EMPTY_IGD_DASHBOARD: IgdDashboard = {
  summary: {
    totalActive: 0,
    triageCounts: { '0': 0, '1': 0, '2': 0, '3': 0, '4': 0 },
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
      triageCounts: { '0': 1, '1': 1, '2': 1, '3': 1, '4': 0 },
      bedAvailable: 11,
      bedTotal: 14,
      averageResponseMinutes: 4,
      totalToday: 4
    },
    patients: [
      {
        id: 'patient-temp-1',
        encounterId: 'encounter-temp-1',
        registrationNumber: 'IGD-2604-001',
        encounterCode: 'ENC-20260423-000001',
        tempCode: 'TMP-IGD-001',
        isTemporaryPatient: true,
        name: 'TIDAK DIKENAL',
        ageLabel: '~50 L',
        genderLabel: 'Laki-laki',
        complaint: 'Trauma kepala berat',
        paymentLabel: 'Umum',
        arrivalSource: 'Polisi',
        triageLevel: 0,
        status: 'observasi',
        unitLabel: 'IGD',
        bedCode: 'R-01',
        arrivalTime: '09:15',
        triageTime: '09:25',
        doctorName: 'dr. IGD',
        doctorTargetName: 'dr. IGD',
        timeTracking: {
          arrivalTime: '09:15',
          quickTriageTime: '09:18',
          triageTime: '09:25',
          doctorAssignedTime: '09:23',
          bedAssignedTime: '09:55',
          bedReleasedTime: '09:50'
        },
        guarantorName: 'Siti Aminah',
        estimatedCost: 725000
      },
      {
        id: 'patient-2',
        encounterId: 'encounter-2',
        registrationNumber: 'IGD-2604-002',
        encounterCode: 'ENC-20260423-000002',
        medicalRecordNumber: 'MRN-IGD-002',
        isTemporaryPatient: false,
        name: 'Wahyu Handayani',
        ageLabel: '34 P',
        genderLabel: 'Perempuan',
        complaint: 'Perdarahan aktif post partum',
        paymentLabel: 'BPJS',
        arrivalSource: 'Rujukan',
        triageLevel: 1,
        status: 'triase',
        unitLabel: 'IGD',
        arrivalTime: '09:22',
        triageTime: '09:27',
        doctorName: '',
        doctorTargetName: '',
        timeTracking: {
          arrivalTime: '09:22',
          quickTriageTime: '09:27'
        },
        guarantorName: 'Sri Wahyuni',
        estimatedCost: null
      },
      {
        id: 'patient-3',
        encounterId: 'encounter-3',
        registrationNumber: 'IGD-2604-003',
        encounterCode: 'ENC-20260423-000003',
        medicalRecordNumber: 'MRN-IGD-003',
        isTemporaryPatient: false,
        name: 'Sutrisno Hadi',
        ageLabel: '62 L',
        genderLabel: 'Laki-laki',
        complaint: 'Nyeri dada hebat',
        paymentLabel: 'BPJS',
        arrivalSource: 'Datang sendiri',
        triageLevel: 2,
        status: 'penanganan',
        unitLabel: 'IGD',
        bedCode: 'O-01',
        arrivalTime: '09:35',
        triageTime: '09:42',
        doctorName: 'dr. IGD',
        doctorTargetName: 'dr. IGD',
        timeTracking: {
          arrivalTime: '09:35',
          quickTriageTime: '09:40',
          triageTime: '09:42',
          doctorAssignedTime: '09:45',
          bedAssignedTime: '09:47',
          referredTime: '11:20'
        },
        guarantorName: null,
        estimatedCost: 460000
      },
      {
        id: 'patient-4',
        encounterId: 'encounter-4',
        registrationNumber: 'IGD-2604-004',
        encounterCode: 'ENC-20260423-000004',
        medicalRecordNumber: 'MRN-IGD-004',
        isTemporaryPatient: false,
        name: 'Ahmad Saputra',
        ageLabel: '38 L',
        genderLabel: 'Laki-laki',
        complaint: 'Vulnus scissum jari tangan kanan',
        paymentLabel: 'Umum',
        arrivalSource: 'Datang sendiri',
        triageLevel: 3,
        status: 'menunggu',
        unitLabel: 'IGD',
        arrivalTime: '09:55',
        doctorName: '',
        doctorTargetName: '',
        timeTracking: {
          arrivalTime: '09:55'
        },
        guarantorName: null,
        estimatedCost: null
      }
    ],
    beds: [
      {
        code: 'R-01',
        zone: 'Resusitasi',
        status: 'occupied',
        patientId: 'patient-temp-1',
        bedId: 'bed-r-01',
        roomId: 'room-resus',
        roomCodeId: 'IGD-RESUS',
        roomClassCodeId: 'RESUS',
        currentAssignmentId: 'assign-r-01'
      },
      {
        code: 'R-02',
        zone: 'Resusitasi',
        status: 'available',
        patientId: null,
        bedId: 'bed-r-02',
        roomId: 'room-resus',
        roomCodeId: 'IGD-RESUS',
        roomClassCodeId: 'RESUS'
      },
      {
        code: 'R-03',
        zone: 'Resusitasi',
        status: 'available',
        patientId: null,
        bedId: 'bed-r-03',
        roomId: 'room-resus',
        roomCodeId: 'IGD-RESUS',
        roomClassCodeId: 'RESUS'
      },
      {
        code: 'R-04',
        zone: 'Resusitasi',
        status: 'available',
        patientId: null,
        bedId: 'bed-r-04',
        roomId: 'room-resus',
        roomCodeId: 'IGD-RESUS',
        roomClassCodeId: 'RESUS'
      },
      {
        code: 'O-01',
        zone: 'Observasi',
        status: 'occupied',
        patientId: 'patient-3',
        bedId: 'bed-o-01',
        roomId: 'room-obs',
        roomCodeId: 'IGD-OBS',
        roomClassCodeId: 'OBS',
        currentAssignmentId: 'assign-o-01'
      },
      {
        code: 'O-02',
        zone: 'Observasi',
        status: 'available',
        patientId: null,
        bedId: 'bed-o-02',
        roomId: 'room-obs',
        roomCodeId: 'IGD-OBS',
        roomClassCodeId: 'OBS'
      },
      {
        code: 'O-03',
        zone: 'Observasi',
        status: 'available',
        patientId: null,
        bedId: 'bed-o-03',
        roomId: 'room-obs',
        roomCodeId: 'IGD-OBS',
        roomClassCodeId: 'OBS'
      },
      {
        code: 'O-04',
        zone: 'Observasi',
        status: 'cleaning',
        patientId: null,
        bedId: 'bed-o-04',
        roomId: 'room-obs',
        roomCodeId: 'IGD-OBS',
        roomClassCodeId: 'OBS'
      },
      {
        code: 'O-05',
        zone: 'Observasi',
        status: 'available',
        patientId: null,
        bedId: 'bed-o-05',
        roomId: 'room-obs',
        roomCodeId: 'IGD-OBS',
        roomClassCodeId: 'OBS'
      },
      {
        code: 'O-06',
        zone: 'Observasi',
        status: 'available',
        patientId: null,
        bedId: 'bed-o-06',
        roomId: 'room-obs',
        roomCodeId: 'IGD-OBS',
        roomClassCodeId: 'OBS'
      },
      {
        code: 'T-01',
        zone: 'Tindakan',
        status: 'available',
        patientId: null,
        bedId: 'bed-t-01',
        roomId: 'room-treat',
        roomCodeId: 'IGD-TINDAKAN',
        roomClassCodeId: 'IGD_TINDAKAN'
      },
      {
        code: 'T-02',
        zone: 'Tindakan',
        status: 'available',
        patientId: null,
        bedId: 'bed-t-02',
        roomId: 'room-treat',
        roomCodeId: 'IGD-TINDAKAN',
        roomClassCodeId: 'IGD_TINDAKAN'
      },
      {
        code: 'I-01',
        zone: 'Isolasi',
        status: 'available',
        patientId: null,
        bedId: 'bed-i-01',
        roomId: 'room-isol',
        roomCodeId: 'IGD-ISOLASI',
        roomClassCodeId: 'IGD_ISOLASI'
      },
      {
        code: 'I-02',
        zone: 'Isolasi',
        status: 'available',
        patientId: null,
        bedId: 'bed-i-02',
        roomId: 'room-isol',
        roomCodeId: 'IGD-ISOLASI',
        roomClassCodeId: 'IGD_ISOLASI'
      },
    ]
  }
}

function mapGender(gender: IgdRegistrationDraft['gender']): 'male' | 'female' | 'other' {
  if (gender === 'L') return 'male'
  if (gender === 'P') return 'female'
  return 'other'
}

function buildGuarantor(draft: IgdRegistrationDraft) {
  const hasMeaningfulGuarantorData =
    !!draft.guarantorName.trim() || !!draft.guarantorNik.trim() || !!draft.guarantorPhone.trim()

  if (!hasMeaningfulGuarantorData) {
    return undefined
  }

  return {
    name: draft.guarantorName.trim() || undefined,
    relationship: draft.guarantorRelationship.trim() || undefined,
    nik: draft.guarantorNik.trim() || undefined,
    phone: draft.guarantorPhone.trim() || undefined
  }
}

export function getExistingPatientRelatedPersons(
  selectedPatient?: PatientAttributes
): IgdGuarantorRelatedPerson[] {
  const relatedPerson = (selectedPatient as (PatientAttributes & { relatedPerson?: unknown }) | undefined)
    ?.relatedPerson
  const raw = Array.isArray(relatedPerson) ? relatedPerson : []

  return raw
    .map((person) => {
      const row = person as Partial<
        Record<'name' | 'phone' | 'relationship' | 'email' | 'isGuarantor', unknown>
      >

      return {
        name: String(row.name ?? '').trim(),
        phone: String(row.phone ?? '').trim(),
        relationship: String(row.relationship ?? '').trim(),
        email: row.email ? String(row.email).trim() : undefined,
        isGuarantor: row.isGuarantor === true || undefined
      }
    })
    .filter((person) => person.name || person.phone || person.relationship || person.email)
}

export function getDefaultGuarantorSource(selectedPatient?: PatientAttributes): IgdGuarantorSource {
  const relatedPersons = getExistingPatientRelatedPersons(selectedPatient)
  const guarantorIndex = relatedPersons.findIndex((person) => person.isGuarantor)

  return guarantorIndex >= 0 ? (`existing:${guarantorIndex}` as IgdGuarantorSource) : 'new'
}

export function getSelectedExistingGuarantor(
  selectedPatient: PatientAttributes | undefined,
  guarantorSource: IgdGuarantorSource | undefined
): IgdGuarantorRelatedPerson | undefined {
  if (!guarantorSource || guarantorSource === 'new') {
    return undefined
  }

  const index = Number(guarantorSource.replace('existing:', ''))
  if (!Number.isInteger(index) || index < 0) {
    return undefined
  }

  return getExistingPatientRelatedPersons(selectedPatient)[index]
}

function buildRelatedPersons(draft: IgdRegistrationDraft) {
  const guarantor = buildGuarantor(draft)

  if (!guarantor) {
    return []
  }

  return [
    {
      name: guarantor.name || guarantor.nik || 'Penanggung Jawab',
      phone: guarantor.phone || '',
      relationship: guarantor.relationship || 'Penanggung Jawab',
      isGuarantor: true
    }
  ]
}

function buildQuickTriage({
  intent,
  draft,
  quickCondition
}: Pick<SubmitIgdRegistrationInput, 'intent' | 'draft' | 'quickCondition'>) {
  if (intent !== 'triase') {
    return undefined
  }

  return {
    level: getQuickTriageLevel(quickCondition),
    conditionKey: quickCondition,
    effectiveDateTime: draft.arrivalDateTime
  }
}

function resolveMitraId(draft: IgdRegistrationDraft): number | undefined {
  if (draft.paymentMethod === 'Umum') {
    return undefined
  }

  const numericMitraId = Number(draft.mitraId)
  return Number.isFinite(numericMitraId) && numericMitraId > 0 ? numericMitraId : undefined
}

export function buildIgdRegistrationCommand({
  mode,
  draft,
  selectedPatient,
  guarantorSource = 'new',
  intent,
  quickCondition
}: SubmitIgdRegistrationInput): IgdRegistrationCommand {
  const selectedExistingGuarantor = getSelectedExistingGuarantor(selectedPatient, guarantorSource)
  const baseCommand = {
    complaint: draft.complaint.trim(),
    arrivalSource: draft.arrivalSource,
    paymentMethod: draft.paymentMethod,
    ...(resolveMitraId(draft) !== undefined ? { mitraId: resolveMitraId(draft) } : {}),
    arrivalDateTime: draft.arrivalDateTime,
    guarantor: selectedExistingGuarantor
      ? {
          name: selectedExistingGuarantor.name || undefined,
          relationship: selectedExistingGuarantor.relationship || undefined,
          phone: selectedExistingGuarantor.phone || undefined
        }
      : buildGuarantor(draft),
    quickTriage: buildQuickTriage({ intent, draft, quickCondition })
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
        phone: draft.phone.trim() || undefined,
        relatedPerson: buildRelatedPersons(draft)
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
      religion: draft.religion.trim(),
      district: '',
      village: '',
      rt: '',
      rw: '',
      relatedPerson: buildRelatedPersons(draft),
      active: true,
      familyEmployee: null,
      kepegawaianId: null,
      needEmr: true
    }
  }
}
