import { create } from 'zustand'

import type { IgdBedZoneName } from './igd.bed-zoning'
import type { IgdTriageLevel } from './igd.triage-level'

export type IgdPatientStatus = 'menunggu' | 'triase' | 'penanganan' | 'observasi' | 'disposisi'
export type IgdBedStatus = 'available' | 'occupied' | 'cleaning'
export type IgdBedZone = IgdBedZoneName
export type IgdTriageSection = 'quick' | 'umum' | 'primer' | 'sekunder'

export type IgdVitalSigns = {
  bloodPressure: string
  pulse: number
  oxygenSaturation: number
  temperature: number
  respiratoryRate: number
  gcs: number
}

export type IgdPatient = {
  id: number
  registrationNumber: string
  medicalRecordNumber?: string
  tempCode?: string
  isTemporaryPatient: boolean
  name: string
  ageLabel: string
  complaint: string
  paymentLabel: string
  arrivalSource: string
  triageLevel: IgdTriageLevel
  status: IgdPatientStatus
  bedCode?: string
  arrivalTime: string
  triageTime?: string
  doctorName?: string
  doctorTime?: string
  treatmentTime?: string
  vitalSigns?: IgdVitalSigns
}

export type IgdBed = {
  code: string
  zone: IgdBedZone
  status: IgdBedStatus
  patientId: number | null
}

export type IgdRegistrationDraft = {
  hasMedicalRecord: boolean
  medicalRecordNumber: string
  name: string
  ageLabel: string
  complaint: string
  paymentLabel: string
  arrivalSource: string
  guarantorLabel: string
  notes: string
}

export type IgdRegistrationInput = Omit<
  IgdRegistrationDraft,
  'medicalRecordNumber' | 'guarantorLabel' | 'notes'
> & {
  medicalRecordNumber?: string
}

export type IgdStateData = {
  patients: IgdPatient[]
  beds: IgdBed[]
  selectedPatientId: number
  activeTriageSection: IgdTriageSection
  triageForms: Record<number, Partial<Record<IgdTriageSection, Record<string, string>>>>
  registrationDraft: IgdRegistrationDraft
}

type SaveTriageInput = {
  patientId: number
  section: IgdTriageSection
  values: Record<string, string>
}

type AssignBedInput = {
  patientId: number
  bedCode: string
}

const INITIAL_PATIENTS: IgdPatient[] = [
  {
    id: 1,
    registrationNumber: 'IGD-2604-001',
    tempCode: 'TMP-IGD-001',
    isTemporaryPatient: true,
    name: 'TIDAK DIKENAL',
    ageLabel: '~50 L',
    complaint: 'Tidak sadarkan diri, trauma kepala berat',
    paymentLabel: 'Umum',
    arrivalSource: 'Polisi',
    triageLevel: 0,
    status: 'penanganan',
    bedCode: 'R-01',
    arrivalTime: '09:15',
    triageTime: '09:18',
    doctorName: 'dr. Fahreza, Sp.EM',
    doctorTime: '09:20',
    treatmentTime: '09:35',
    vitalSigns: {
      bloodPressure: '80/50',
      pulse: 38,
      oxygenSaturation: 88,
      temperature: 36.2,
      respiratoryRate: 8,
      gcs: 5
    }
  },
  {
    id: 2,
    registrationNumber: 'IGD-2604-002',
    medicalRecordNumber: '02-14-88-92',
    isTemporaryPatient: false,
    name: 'Sutrisno Hadi',
    ageLabel: '62 L',
    complaint: 'Nyeri dada hebat, sesak nafas akut, diaphoresis',
    paymentLabel: 'BPJS',
    arrivalSource: 'Datang sendiri',
    triageLevel: 0,
    status: 'penanganan',
    bedCode: 'R-02',
    arrivalTime: '09:22',
    triageTime: '09:24',
    doctorName: 'dr. Fahreza, Sp.EM',
    doctorTime: '09:26',
    treatmentTime: '09:35',
    vitalSigns: {
      bloodPressure: '90/60',
      pulse: 110,
      oxygenSaturation: 91,
      temperature: 37.1,
      respiratoryRate: 28,
      gcs: 15
    }
  },
  {
    id: 3,
    registrationNumber: 'IGD-2604-003',
    medicalRecordNumber: '02-14-88-93',
    isTemporaryPatient: false,
    name: 'Wahyu Handayani',
    ageLabel: '34 P',
    complaint: 'Perdarahan aktif post partum, G2P1A0',
    paymentLabel: 'BPJS',
    arrivalSource: 'Rujukan',
    triageLevel: 1,
    status: 'triase',
    bedCode: 'R-03',
    arrivalTime: '09:31',
    triageTime: '09:33',
    vitalSigns: {
      bloodPressure: '100/70',
      pulse: 118,
      oxygenSaturation: 96,
      temperature: 36.8,
      respiratoryRate: 22,
      gcs: 15
    }
  },
  {
    id: 4,
    registrationNumber: 'IGD-2604-004',
    medicalRecordNumber: '02-14-88-94',
    isTemporaryPatient: false,
    name: 'Hendra Gunawan',
    ageLabel: '45 L',
    complaint: 'Fraktur tibia fibula dextra, nyeri VAS 8/10',
    paymentLabel: 'Umum',
    arrivalSource: 'Datang sendiri',
    triageLevel: 2,
    status: 'observasi',
    bedCode: 'O-01',
    arrivalTime: '09:35',
    triageTime: '09:40',
    doctorName: 'dr. Rizal',
    doctorTime: '09:52',
    vitalSigns: {
      bloodPressure: '130/80',
      pulse: 95,
      oxygenSaturation: 98,
      temperature: 37,
      respiratoryRate: 18,
      gcs: 15
    }
  },
  {
    id: 5,
    registrationNumber: 'IGD-2604-005',
    medicalRecordNumber: '02-14-88-95',
    isTemporaryPatient: false,
    name: 'Indah Rahmawati',
    ageLabel: '28 P',
    complaint: 'Demam tinggi disertai kejang satu kali',
    paymentLabel: 'BPJS',
    arrivalSource: 'Datang sendiri',
    triageLevel: 2,
    status: 'penanganan',
    bedCode: 'O-02',
    arrivalTime: '09:42',
    triageTime: '09:47',
    doctorName: 'dr. Rizal',
    doctorTime: '10:00',
    vitalSigns: {
      bloodPressure: '120/75',
      pulse: 105,
      oxygenSaturation: 97,
      temperature: 39.8,
      respiratoryRate: 20,
      gcs: 14
    }
  },
  {
    id: 6,
    registrationNumber: 'IGD-2604-006',
    medicalRecordNumber: '02-14-88-96',
    isTemporaryPatient: false,
    name: 'Ahmad Saputra',
    ageLabel: '38 L',
    complaint: 'Vulnus scissum jari tangan kanan, perdarahan minor',
    paymentLabel: 'Umum',
    arrivalSource: 'Datang sendiri',
    triageLevel: 3,
    status: 'triase',
    arrivalTime: '09:55',
    triageTime: '10:05',
    vitalSigns: {
      bloodPressure: '125/80',
      pulse: 88,
      oxygenSaturation: 99,
      temperature: 36.6,
      respiratoryRate: 18,
      gcs: 15
    }
  },
  {
    id: 7,
    registrationNumber: 'IGD-2604-007',
    medicalRecordNumber: '02-14-88-97',
    isTemporaryPatient: false,
    name: 'Siti Munawaroh',
    ageLabel: '55 P',
    complaint: 'Nyeri abdomen kanan bawah, mual muntah tiga kali',
    paymentLabel: 'BPJS',
    arrivalSource: 'Datang sendiri',
    triageLevel: 3,
    status: 'menunggu',
    arrivalTime: '10:02'
  },
  {
    id: 8,
    registrationNumber: 'IGD-2604-008',
    medicalRecordNumber: '02-14-88-98',
    isTemporaryPatient: false,
    name: 'Dodi Setiawan',
    ageLabel: '25 L',
    complaint: 'ISPA ringan, febris, rhinitis',
    paymentLabel: 'BPJS',
    arrivalSource: 'Datang sendiri',
    triageLevel: 4,
    status: 'menunggu',
    arrivalTime: '10:10'
  }
]

const INITIAL_BEDS: IgdBed[] = [
  { code: 'R-01', zone: 'Resusitasi', status: 'occupied', patientId: 1 },
  { code: 'R-02', zone: 'Resusitasi', status: 'occupied', patientId: 2 },
  { code: 'R-03', zone: 'Resusitasi', status: 'occupied', patientId: 3 },
  { code: 'R-04', zone: 'Resusitasi', status: 'available', patientId: null },
  { code: 'O-01', zone: 'Observasi', status: 'occupied', patientId: 4 },
  { code: 'O-02', zone: 'Observasi', status: 'occupied', patientId: 5 },
  { code: 'O-03', zone: 'Observasi', status: 'available', patientId: null },
  { code: 'O-04', zone: 'Observasi', status: 'cleaning', patientId: null },
  { code: 'O-05', zone: 'Observasi', status: 'available', patientId: null },
  { code: 'O-06', zone: 'Observasi', status: 'available', patientId: null },
  { code: 'T-01', zone: 'Tindakan', status: 'available', patientId: null },
  { code: 'T-02', zone: 'Tindakan', status: 'available', patientId: null },
  { code: 'I-01', zone: 'Isolasi', status: 'available', patientId: null },
  { code: 'I-02', zone: 'Isolasi', status: 'available', patientId: null }
]

const INITIAL_TRIAGE_FORMS: IgdStateData['triageForms'] = {
  2: {
    quick: {
      chiefComplaint: 'Nyeri dada hebat sejak 30 menit',
      consciousness: 'Compos mentis',
      perfusion: 'Akral dingin'
    },
    primer: {
      airway: 'Paten',
      breathing: 'Sesak sedang',
      circulation: 'Nadi cepat'
    }
  }
}

const INITIAL_REGISTRATION_DRAFT: IgdRegistrationDraft = {
  hasMedicalRecord: true,
  medicalRecordNumber: '',
  name: '',
  ageLabel: '',
  complaint: '',
  paymentLabel: 'Umum',
  arrivalSource: 'Datang sendiri',
  guarantorLabel: '',
  notes: ''
}

const cloneTriageForms = (
  forms: IgdStateData['triageForms']
): IgdStateData['triageForms'] =>
  Object.fromEntries(
    Object.entries(forms).map(([patientId, sections]) => [
      Number(patientId),
      Object.fromEntries(
        Object.entries(sections).map(([section, values]) => [section, { ...values }])
      )
    ])
  )

export const createIgdInitialState = (): IgdStateData => ({
  patients: INITIAL_PATIENTS.map((patient) => ({ ...patient })),
  beds: INITIAL_BEDS.map((bed) => ({ ...bed })),
  selectedPatientId: 2,
  activeTriageSection: 'quick',
  triageForms: cloneTriageForms(INITIAL_TRIAGE_FORMS),
  registrationDraft: { ...INITIAL_REGISTRATION_DRAFT }
})

export const registerIgdPatient = (
  state: IgdStateData,
  input: IgdRegistrationInput
): IgdStateData => {
  const nextId = Math.max(...state.patients.map((patient) => patient.id)) + 1
  const suffix = String(nextId).padStart(3, '0')
  const nextPatient: IgdPatient = {
    id: nextId,
    registrationNumber: `IGD-2604-${suffix}`,
    medicalRecordNumber: input.hasMedicalRecord ? input.medicalRecordNumber || undefined : undefined,
    tempCode: input.hasMedicalRecord ? undefined : `TMP-IGD-${suffix}`,
    isTemporaryPatient: !input.hasMedicalRecord,
    name: input.name,
    ageLabel: input.ageLabel,
    complaint: input.complaint,
    paymentLabel: input.paymentLabel,
    arrivalSource: input.arrivalSource,
    triageLevel: 3,
    status: 'menunggu',
    arrivalTime: '10:25'
  }

  return {
    ...state,
    patients: [nextPatient, ...state.patients],
    selectedPatientId: nextId,
    registrationDraft: { ...INITIAL_REGISTRATION_DRAFT }
  }
}

export const assignBedToPatient = (state: IgdStateData, input: AssignBedInput): IgdStateData => {
  const currentPatient = state.patients.find((patient) => patient.id === input.patientId)
  if (!currentPatient) return state

  const previousBedCode = currentPatient.bedCode

  return {
    ...state,
    patients: state.patients.map((patient) =>
      patient.id === input.patientId ? { ...patient, bedCode: input.bedCode, status: 'observasi' } : patient
    ),
    beds: state.beds.map((bed) => {
      if (bed.code === input.bedCode) {
        return { ...bed, patientId: input.patientId, status: 'occupied' }
      }
      if (previousBedCode && bed.code === previousBedCode) {
        return { ...bed, patientId: null, status: 'available' }
      }
      return bed
    })
  }
}

export const savePatientTriage = (state: IgdStateData, input: SaveTriageInput): IgdStateData => ({
  ...state,
  triageForms: {
    ...state.triageForms,
    [input.patientId]: {
      ...(state.triageForms[input.patientId] ?? {}),
      [input.section]: { ...input.values }
    }
  },
  patients: state.patients.map((patient) =>
    patient.id === input.patientId
      ? {
          ...patient,
          status: input.section === 'quick' ? 'triase' : 'penanganan',
          triageTime: patient.triageTime ?? '10:25'
        }
      : patient
  )
})

type IgdStore = IgdStateData & {
  setSelectedPatient: (patientId: number) => void
  setActiveTriageSection: (section: IgdTriageSection) => void
  updateRegistrationDraft: (values: Partial<IgdRegistrationDraft>) => void
  submitRegistration: (input: IgdRegistrationInput) => number
  assignBed: (input: AssignBedInput) => void
  saveTriage: (input: SaveTriageInput) => void
  reset: () => void
}

export const useIgdStore = create<IgdStore>()((set) => ({
  ...createIgdInitialState(),
  setSelectedPatient: (patientId) => set({ selectedPatientId: patientId }),
  setActiveTriageSection: (section) => set({ activeTriageSection: section }),
  updateRegistrationDraft: (values) =>
    set((state) => ({
      registrationDraft: {
        ...state.registrationDraft,
        ...values
      }
    })),
  submitRegistration: (input) => {
    let nextId = 0

    set((state) => {
      const nextState = registerIgdPatient(state, input)
      nextId = nextState.selectedPatientId
      return nextState
    })

    return nextId
  },
  assignBed: (input) => set((state) => assignBedToPatient(state, input)),
  saveTriage: (input) => set((state) => savePatientTriage(state, input)),
  reset: () => set(createIgdInitialState())
}))
