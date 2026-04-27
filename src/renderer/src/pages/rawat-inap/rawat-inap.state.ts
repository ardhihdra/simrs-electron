import { create } from 'zustand'

export type RawatInapBedStatus = 'occupied' | 'available' | 'cleaning'
export type RawatInapTransferReason = 'upgrade' | 'downgrade' | 'icu' | 'other'

export type RawatInapBedMapSnapshot = {
  generatedAt: string
  summary: {
    totalRooms: number
    totalBeds: number
    occupiedBeds: number
    availableBeds: number
    cleaningBeds: number
  }
  wards: ReadonlyArray<{
    roomId: string
    roomName: string
    floor: string | null
    classLabel: string | null
    capacity: number | null
    occupancy: {
      occupied: number
      total: number
      percentage: number
    }
    beds: ReadonlyArray<{
      bedId: string
      bedName: string
      status: string
      roomId: string
      roomName: string
      patient: null | {
        encounterId: string
        patientId: string
        medicalRecordNumber: string | null
        patientName: string
        gender: string | null
        ageLabel: string | null
        dpjpName: string | null
        diagnosisSummary: string | null
        admissionDateTime: string | null
        lengthOfStayLabel: string | null
        paymentLabel: string | null
        vitalSigns: {
          systolicBp: string | null
          diastolicBp: string | null
          heartRate: string | null
          respiratoryRate: string | null
          temperature: string | null
          oxygenSaturation: string | null
        }
      }
    }>
  }>
}

export type RawatInapWard = {
  id: string
  name: string
  classLabel: string
  floorLabel: string
  totalBeds: number
}

export type RawatInapPatient = {
  id: string
  name: string
  rm: string
  diagnosis: string
  payor: string
  dpjp: string
  masukLabel: string
  estimatedDischargeLabel: string
  sepNumber: string
  inaCbg: string
  vitalSignSummary: Array<{
    label: string
    value: string
    tone?: 'default' | 'warning'
  }>
  currentWardId: string
  currentBedId: string
}

export type RawatInapBed = {
  id: string
  wardId: string
  roomId: string
  roomNo: string
  bedLabel: string
  status: RawatInapBedStatus
  patientId: string | null
  cleaningLabel?: string
  losDays: number
}

export type RawatInapTransferDraft = {
  sourceBedId: string | null
  transferReason: RawatInapTransferReason
  targetWardId: string
  targetBedId: string
  transferNote: string
}

export type RawatInapState = {
  wards: RawatInapWard[]
  beds: RawatInapBed[]
  patients: RawatInapPatient[]
  activeWardId: string
  selectedBedId: string | null
  transferDraft: RawatInapTransferDraft
}

export type SubmitWardTransferInput = {
  sourceBedId: string
  targetWardId: string
  targetBedId: string
  transferReason: RawatInapTransferReason
  transferNote: string
}

type RawatInapBedMapSnapshotPatient = NonNullable<
  RawatInapBedMapSnapshot['wards'][number]['beds'][number]['patient']
>

const createWardFixture = (): RawatInapWard[] => [
  { id: 'bangsal-mawar', name: 'Mawar', classLabel: 'VIP', floorLabel: 'Lantai 1', totalBeds: 4 },
  { id: 'bangsal-melati', name: 'Melati', classLabel: 'Kelas 1', floorLabel: 'Lantai 3', totalBeds: 6 },
  { id: 'bangsal-anggrek', name: 'Anggrek', classLabel: 'Kelas 2', floorLabel: 'Lantai 2', totalBeds: 4 },
  { id: 'bangsal-icu', name: 'ICU', classLabel: 'Intensive', floorLabel: 'Lantai 2', totalBeds: 2 }
]

const createPatientFixture = (): RawatInapPatient[] => [
  {
    id: 'patient-hasan',
    name: 'Hasan Basri',
    rm: 'RM-202604-019',
    diagnosis: 'Pneumonia komunitas',
    payor: 'BPJS',
    dpjp: 'dr. Andi, Sp.PD',
    masukLabel: '22 Apr 08:14',
    estimatedDischargeLabel: '25 Apr',
    sepNumber: '0301R-142',
    inaCbg: 'I-4-13-I',
    vitalSignSummary: [
      { label: 'TD', value: '148/88', tone: 'warning' },
      { label: 'HR', value: '76' },
      { label: 'Suhu', value: '36.6' },
      { label: 'SpO2', value: '98' }
    ],
    currentWardId: 'bangsal-melati',
    currentBedId: 'melati-302-b'
  },
  {
    id: 'patient-dina',
    name: 'Dina Puspasari',
    rm: 'RM-202604-101',
    diagnosis: 'Demam tifoid',
    payor: 'Umum',
    dpjp: 'dr. Rina, Sp.PD',
    masukLabel: '23 Apr 10:00',
    estimatedDischargeLabel: '27 Apr',
    sepNumber: '0301R-188',
    inaCbg: 'I-4-18-II',
    vitalSignSummary: [
      { label: 'TD', value: '118/76' },
      { label: 'HR', value: '82' },
      { label: 'Suhu', value: '37.2' },
      { label: 'SpO2', value: '99' }
    ],
    currentWardId: 'bangsal-melati',
    currentBedId: 'melati-302-a'
  },
  {
    id: 'patient-nadia',
    name: 'Nadia Lestari',
    rm: 'RM-202604-145',
    diagnosis: 'Post operasi laparatomi',
    payor: 'Asuransi',
    dpjp: 'dr. Bimo, Sp.B',
    masukLabel: '23 Apr 14:20',
    estimatedDischargeLabel: '28 Apr',
    sepNumber: '0301R-204',
    inaCbg: 'I-3-11-II',
    vitalSignSummary: [
      { label: 'TD', value: '122/82' },
      { label: 'HR', value: '90' },
      { label: 'Suhu', value: '36.9' },
      { label: 'SpO2', value: '97' }
    ],
    currentWardId: 'bangsal-anggrek',
    currentBedId: 'anggrek-201-a'
  }
]

const createBedFixture = (): RawatInapBed[] => [
  { id: 'mawar-101-a', wardId: 'bangsal-mawar', roomId: 'room-mawar-101', roomNo: '101', bedLabel: 'A', status: 'available', patientId: null, losDays: 0 },
  { id: 'mawar-101-b', wardId: 'bangsal-mawar', roomId: 'room-mawar-101', roomNo: '101', bedLabel: 'B', status: 'available', patientId: null, losDays: 0 },
  { id: 'mawar-102-a', wardId: 'bangsal-mawar', roomId: 'room-mawar-102', roomNo: '102', bedLabel: 'A', status: 'cleaning', patientId: null, cleaningLabel: 'Cleaning', losDays: 0 },
  { id: 'mawar-102-b', wardId: 'bangsal-mawar', roomId: 'room-mawar-102', roomNo: '102', bedLabel: 'B', status: 'available', patientId: null, losDays: 0 },
  { id: 'melati-302-a', wardId: 'bangsal-melati', roomId: 'room-melati-302', roomNo: '302', bedLabel: 'A', status: 'occupied', patientId: 'patient-dina', losDays: 2 },
  { id: 'melati-302-b', wardId: 'bangsal-melati', roomId: 'room-melati-302', roomNo: '302', bedLabel: 'B', status: 'occupied', patientId: 'patient-hasan', losDays: 3 },
  { id: 'melati-303-a', wardId: 'bangsal-melati', roomId: 'room-melati-303', roomNo: '303', bedLabel: 'A', status: 'available', patientId: null, losDays: 0 },
  { id: 'melati-303-b', wardId: 'bangsal-melati', roomId: 'room-melati-303', roomNo: '303', bedLabel: 'B', status: 'available', patientId: null, losDays: 0 },
  { id: 'melati-304-a', wardId: 'bangsal-melati', roomId: 'room-melati-304', roomNo: '304', bedLabel: 'A', status: 'cleaning', patientId: null, cleaningLabel: 'Cleaning', losDays: 0 },
  { id: 'melati-304-b', wardId: 'bangsal-melati', roomId: 'room-melati-304', roomNo: '304', bedLabel: 'B', status: 'available', patientId: null, losDays: 0 },
  { id: 'anggrek-201-a', wardId: 'bangsal-anggrek', roomId: 'room-anggrek-201', roomNo: '201', bedLabel: 'A', status: 'occupied', patientId: 'patient-nadia', losDays: 1 },
  { id: 'anggrek-201-b', wardId: 'bangsal-anggrek', roomId: 'room-anggrek-201', roomNo: '201', bedLabel: 'B', status: 'available', patientId: null, losDays: 0 },
  { id: 'anggrek-202-a', wardId: 'bangsal-anggrek', roomId: 'room-anggrek-202', roomNo: '202', bedLabel: 'A', status: 'available', patientId: null, losDays: 0 },
  { id: 'anggrek-202-b', wardId: 'bangsal-anggrek', roomId: 'room-anggrek-202', roomNo: '202', bedLabel: 'B', status: 'available', patientId: null, losDays: 0 },
  { id: 'icu-icu-01', wardId: 'bangsal-icu', roomId: 'room-icu-01', roomNo: 'ICU-01', bedLabel: 'A', status: 'available', patientId: null, losDays: 0 },
  { id: 'icu-icu-02', wardId: 'bangsal-icu', roomId: 'room-icu-02', roomNo: 'ICU-02', bedLabel: 'A', status: 'available', patientId: null, losDays: 0 }
]

const defaultTransferDraft = (): RawatInapTransferDraft => ({
  sourceBedId: 'melati-302-b',
  transferReason: 'upgrade',
  targetWardId: 'bangsal-mawar',
  targetBedId: 'mawar-101-a',
  transferNote: ''
})

const mapBackendBedStatus = (status: string): RawatInapBedStatus => {
  if (status === 'TERISI') return 'occupied'
  if (status === 'TERSEDIA') return 'available'
  return 'cleaning'
}

const parseLosDays = (label: string | null | undefined) => {
  if (!label) return 0
  const match = label.match(/(\d+)/)
  return match ? Number(match[1]) : 0
}

const deriveBangsalLabelFromRoomName = (roomName: string) => {
  const normalized = String(roomName || '').trim().replace(/\s+/g, ' ')
  if (!normalized) return '-'

  const firstDigitIndex = normalized.search(/\d/)
  if (firstDigitIndex < 0) return normalized

  const prefix = normalized.slice(0, firstDigitIndex).replace(/[-_\s]+$/g, '').trim()
  return prefix || normalized
}

const createBangsalId = (label: string) => {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `bangsal-${slug || 'unknown'}`
}

const formatJoinedLabels = (labels: Array<string | null | undefined>, fallback = '-') => {
  const uniqueLabels = Array.from(new Set(labels.map((label) => label?.trim()).filter(Boolean)))
  return uniqueLabels.length > 0 ? uniqueLabels.join(', ') : fallback
}

const parseBedIdentity = (bedName: string, roomName: string) => {
  const normalized = String(bedName || '').trim()
  const dashParts = normalized.split('-').filter(Boolean)

  if (dashParts.length >= 2) {
    return {
      roomNo: dashParts.slice(0, -1).join('-'),
      bedLabel: dashParts[dashParts.length - 1].toUpperCase()
    }
  }

  return {
    roomNo: roomName,
    bedLabel: normalized || roomName
  }
}

const buildVitalSignSummary = (vitalSigns: RawatInapBedMapSnapshotPatient['vitalSigns']) => {
  const summary: RawatInapPatient['vitalSignSummary'] = []
  const bloodPressure =
    vitalSigns.systolicBp && vitalSigns.diastolicBp
      ? `${vitalSigns.systolicBp}/${vitalSigns.diastolicBp}`
      : vitalSigns.systolicBp || vitalSigns.diastolicBp

  if (bloodPressure) summary.push({ label: 'TD', value: bloodPressure })
  if (vitalSigns.heartRate) summary.push({ label: 'HR', value: vitalSigns.heartRate })
  if (vitalSigns.temperature) summary.push({ label: 'Suhu', value: vitalSigns.temperature })
  if (vitalSigns.oxygenSaturation) summary.push({ label: 'SpO2', value: vitalSigns.oxygenSaturation })

  return summary
}

const buildTransferDraftFromState = (state: RawatInapState): RawatInapTransferDraft => {
  const sourceBedId = state.selectedBedId ?? findFirstSelectableBedId(state, state.activeWardId) ?? ''
  const sourceBed = state.beds.find((bed) => bed.id === sourceBedId)
  const targetWardId =
    state.wards.find((ward) => ward.id !== sourceBed?.wardId && getAvailableBedsForWard(state, ward.id).length > 0)
      ?.id ?? state.wards.find((ward) => ward.id !== sourceBed?.wardId)?.id ?? state.activeWardId
  const targetBedId = getAvailableBedsForWard(state, targetWardId)[0]?.id ?? ''

  return {
    sourceBedId,
    transferReason: 'upgrade',
    targetWardId,
    targetBedId,
    transferNote: ''
  }
}

export function createRawatInapStateFromBedMapSnapshot(snapshot: RawatInapBedMapSnapshot): RawatInapState {
  const sourceRoomsByBangsalId = new Map<string, RawatInapBedMapSnapshot['wards']>()

  snapshot.wards.forEach((room) => {
    const bangsalName = deriveBangsalLabelFromRoomName(room.roomName)
    const bangsalId = createBangsalId(bangsalName)
    const existingRooms = sourceRoomsByBangsalId.get(bangsalId) ?? []
    sourceRoomsByBangsalId.set(bangsalId, [...existingRooms, room])
  })

  const wards = Array.from(sourceRoomsByBangsalId.entries()).map<RawatInapWard>(([bangsalId, rooms]) => ({
    id: bangsalId,
    name: deriveBangsalLabelFromRoomName(rooms[0]?.roomName ?? '-'),
    classLabel: formatJoinedLabels(rooms.map((room) => room.classLabel)),
    floorLabel: formatJoinedLabels(rooms.map((room) => (room.floor ? `Lantai ${room.floor}` : null))),
    totalBeds: rooms.reduce((total, room) => total + room.beds.length, 0)
  }))

  const beds = snapshot.wards.flatMap<RawatInapBed>((ward) =>
    ward.beds.map((bed) => {
      const identity = parseBedIdentity(bed.bedName, ward.roomName)
      const status = mapBackendBedStatus(bed.status)
      const wardId = createBangsalId(deriveBangsalLabelFromRoomName(ward.roomName))

      return {
        id: bed.bedId,
        wardId,
        roomId: ward.roomId,
        roomNo: identity.roomNo,
        bedLabel: identity.bedLabel,
        status,
        patientId: bed.patient?.patientId ?? null,
        cleaningLabel: status === 'cleaning' ? 'Cleaning' : undefined,
        losDays: parseLosDays(bed.patient?.lengthOfStayLabel)
      }
    })
  )

  const patients = snapshot.wards.flatMap<RawatInapPatient>((ward) =>
    ward.beds.flatMap((bed) => {
      if (!bed.patient) return []

      return [
        {
          id: bed.patient.patientId,
          name: bed.patient.patientName,
          rm: bed.patient.medicalRecordNumber ?? '-',
          diagnosis: bed.patient.diagnosisSummary ?? '-',
          payor: bed.patient.paymentLabel ?? '-',
          dpjp: bed.patient.dpjpName ?? '-',
          masukLabel: bed.patient.admissionDateTime ?? '-',
          estimatedDischargeLabel: '-',
          sepNumber: '-',
          inaCbg: '-',
          vitalSignSummary: buildVitalSignSummary(bed.patient.vitalSigns),
          currentWardId: createBangsalId(deriveBangsalLabelFromRoomName(ward.roomName)),
          currentBedId: bed.bedId
        }
      ]
    })
  )

  const activeWardId = wards[0]?.id ?? ''
  const state: RawatInapState = {
    wards,
    beds,
    patients,
    activeWardId,
    selectedBedId: findFirstSelectableBedId(
      {
        wards,
        beds,
        patients,
        activeWardId,
        selectedBedId: null,
        transferDraft: defaultTransferDraft()
      },
      activeWardId
    ),
    transferDraft: defaultTransferDraft()
  }

  return {
    ...state,
    transferDraft: buildTransferDraftFromState(state)
  }
}

export function syncRawatInapStateWithBedMapSnapshot(
  currentState: RawatInapState,
  snapshot: RawatInapBedMapSnapshot
): RawatInapState {
  const nextState = createRawatInapStateFromBedMapSnapshot(snapshot)
  const activeWardId = nextState.wards.some((ward) => ward.id === currentState.activeWardId)
    ? currentState.activeWardId
    : nextState.activeWardId
  const selectedBedId = nextState.beds.some((bed) => bed.id === currentState.selectedBedId)
    ? currentState.selectedBedId
    : findFirstSelectableBedId(nextState, activeWardId)

  const mergedState = {
    ...nextState,
    activeWardId,
    selectedBedId
  }

  return {
    ...mergedState,
    transferDraft: buildTransferDraftFromState(mergedState)
  }
}

const findFirstSelectableBedId = (state: RawatInapState, wardId: string): string | null => {
  const occupied = state.beds.find((bed) => bed.wardId === wardId && bed.status === 'occupied')
  if (occupied) return occupied.id

  const available = state.beds.find((bed) => bed.wardId === wardId)
  return available?.id ?? null
}

export function createRawatInapInitialState(): RawatInapState {
  return {
    wards: createWardFixture(),
    beds: createBedFixture(),
    patients: createPatientFixture(),
    activeWardId: 'bangsal-melati',
    selectedBedId: 'melati-302-b',
    transferDraft: defaultTransferDraft()
  }
}

export function selectWard(state: RawatInapState, input: { wardId: string }): RawatInapState {
  return {
    ...state,
    activeWardId: input.wardId,
    selectedBedId: findFirstSelectableBedId(state, input.wardId)
  }
}

export function selectBed(state: RawatInapState, input: { bedId: string }): RawatInapState {
  return {
    ...state,
    selectedBedId: input.bedId
  }
}

export function updateTransferDraft(
  state: RawatInapState,
  patch: Partial<RawatInapTransferDraft>
): RawatInapState {
  return {
    ...state,
    transferDraft: {
      ...state.transferDraft,
      ...patch
    }
  }
}

export function prepareTransferDraft(
  state: RawatInapState,
  input: { sourceBedId: string }
): RawatInapState {
  const sourceBed = state.beds.find((bed) => bed.id === input.sourceBedId)
  const defaultTargetWardId =
    state.wards.find((ward) => ward.id !== sourceBed?.wardId && getAvailableBedsForWard(state, ward.id).length > 0)
      ?.id ?? state.transferDraft.targetWardId
  const defaultTargetBedId = getAvailableBedsForWard(state, defaultTargetWardId)[0]?.id ?? ''

  return updateTransferDraft(state, {
    sourceBedId: input.sourceBedId,
    targetWardId: defaultTargetWardId,
    targetBedId: defaultTargetBedId
  })
}

export function submitWardTransfer(
  state: RawatInapState,
  input: SubmitWardTransferInput
): RawatInapState {
  const sourceBed = state.beds.find((bed) => bed.id === input.sourceBedId)
  const targetBed = state.beds.find((bed) => bed.id === input.targetBedId)
  const sourcePatient = state.patients.find((patient) => patient.currentBedId === input.sourceBedId)

  if (!sourceBed || !targetBed || !sourcePatient) {
    return state
  }

  const nextBeds = state.beds.map((bed) => {
    if (bed.id === input.sourceBedId) {
      return {
        ...bed,
        status: 'available' as const,
        patientId: null,
        losDays: 0
      }
    }

    if (bed.id === input.targetBedId) {
      return {
        ...bed,
        status: 'occupied' as const,
        patientId: sourcePatient.id,
        losDays: sourceBed.losDays
      }
    }

    return bed
  })

  const nextPatients = state.patients.map((patient) => {
    if (patient.id !== sourcePatient.id) return patient

    return {
      ...patient,
      currentWardId: input.targetWardId,
      currentBedId: input.targetBedId
    }
  })

  return {
    ...state,
    beds: nextBeds,
    patients: nextPatients,
    activeWardId: input.targetWardId,
    selectedBedId: input.targetBedId,
    transferDraft: {
      sourceBedId: input.targetBedId,
      transferReason: input.transferReason,
      targetWardId: input.targetWardId,
      targetBedId: input.targetBedId,
      transferNote: input.transferNote
    }
  }
}

export function getWardOccupancy(state: RawatInapState, wardId: string) {
  const occupiedBeds = state.beds.filter((bed) => bed.wardId === wardId && bed.status === 'occupied').length
  const totalBeds = state.beds.filter((bed) => bed.wardId === wardId).length

  return { occupiedBeds, totalBeds }
}

export function getBedsForWard(state: RawatInapState, wardId: string) {
  return state.beds.filter((bed) => bed.wardId === wardId)
}

export function getAvailableBedsForWard(state: RawatInapState, wardId: string) {
  return state.beds.filter((bed) => bed.wardId === wardId && bed.status === 'available')
}

export function getRoomsForWard(state: RawatInapState, wardId: string) {
  const grouped = new Map<string, RawatInapBed[]>()

  getBedsForWard(state, wardId).forEach((bed) => {
    const existing = grouped.get(bed.roomNo) ?? []
    existing.push(bed)
    grouped.set(bed.roomNo, existing)
  })

  return Array.from(grouped.entries()).map(([roomNo, beds]) => ({
    roomNo,
    beds: beds.sort((left, right) => left.bedLabel.localeCompare(right.bedLabel))
  }))
}

export function getBedById(state: RawatInapState, bedId: string | null | undefined) {
  if (!bedId) return null
  return state.beds.find((bed) => bed.id === bedId) ?? null
}

export function getPatientByBedId(state: RawatInapState, bedId: string | null | undefined) {
  const bed = getBedById(state, bedId)
  if (!bed?.patientId) return null
  return state.patients.find((patient) => patient.id === bed.patientId) ?? null
}

export function getTransferSourceBed(state: RawatInapState) {
  return getBedById(state, state.transferDraft.sourceBedId ?? state.selectedBedId)
}

type RawatInapStore = {
  state: RawatInapState
  reset: () => void
  selectWard: (input: { wardId: string }) => void
  selectBed: (input: { bedId: string }) => void
  hydrateBedMap: (snapshot: RawatInapBedMapSnapshot) => void
  prepareTransferDraft: (input: { sourceBedId: string }) => void
  updateTransferDraft: (patch: Partial<RawatInapTransferDraft>) => void
  submitTransfer: (input: SubmitWardTransferInput) => void
}

export const useRawatInapStore = create<RawatInapStore>((set) => ({
  state: createRawatInapInitialState(),
  reset: () => set({ state: createRawatInapInitialState() }),
  selectWard: (input) =>
    set((current) => ({
      state: selectWard(current.state, input)
    })),
  selectBed: (input) =>
    set((current) => ({
      state: selectBed(current.state, input)
    })),
  hydrateBedMap: (snapshot) =>
    set((current) => ({
      state: syncRawatInapStateWithBedMapSnapshot(current.state, snapshot)
    })),
  prepareTransferDraft: (input) =>
    set((current) => ({
      state: prepareTransferDraft(current.state, input)
    })),
  updateTransferDraft: (patch) =>
    set((current) => ({
      state: updateTransferDraft(current.state, patch)
    })),
  submitTransfer: (input) =>
    set((current) => ({
      state: submitWardTransfer(current.state, input)
    }))
}))
