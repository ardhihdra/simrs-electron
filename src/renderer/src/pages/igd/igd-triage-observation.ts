/**
 * purpose: Mapper triase IGD dari draft form per section menjadi payload Observation builder yang konsisten untuk submit backend (termasuk transportasi, kesadaran, dan final level `IGD_TRIAGE_LEVEL`), sekaligus mengabaikan section UI-only (`matrix` dan `utama`) serta field alergi yang disimpan ke model allergy.
 * main callers: `IgdTriasePage` saat aksi simpan triase.
 * key dependencies: `OBSERVATION_CATEGORIES`, `OBSERVATION_SYSTEMS`, `TRANSPORTATION_SNOMED_MAP`, `CONSCIOUSNESS_SNOMED_MAP`, dan tipe `ObservationBuilderOptions` dari observation builder.
 * main/public functions: `buildIgdTriaseObservationDrafts`, `IGD_TRIAGE_SNAPSHOT_CODE`.
 * side effects: Tidak ada; pure transform dari input form ke array draft observation.
 */
import {
  OBSERVATION_CATEGORIES,
  OBSERVATION_SYSTEMS,
  type ObservationBuilderOptions
} from '../../utils/builders/observation-builder'
import { CONSCIOUSNESS_SNOMED_MAP, TRANSPORTATION_SNOMED_MAP } from '../../config/maps/observation-maps'

import { type IgdTriageSection } from './igd.state'

export type IgdTriaseFormBySection = Partial<Record<IgdTriageSection, Record<string, string>>>
export const IGD_TRIAGE_SNAPSHOT_CODE = 'igd-triage-snapshot'
export const IGD_TRIAGE_TRANSPORTATION_CODE = '74286-6'
export const IGD_TRIAGE_LEVEL_OBSERVATION_CODE = 'IGD_TRIAGE_LEVEL'

type ObservationDraft = Omit<ObservationBuilderOptions, 'effectiveDateTime'>

type VitalQuantityMeta = {
  code: string
  display: string
  unit: string
  unitCode: string
}

const VITAL_QUANTITY_FIELDS: Partial<Record<string, VitalQuantityMeta>> = {
  pulseRate: {
    code: '8867-4',
    display: 'Denyut Nadi',
    unit: '{beats}/min',
    unitCode: '{beats}/min'
  },
  respiratoryRate: {
    code: '9279-1',
    display: 'Frekuensi Napas',
    unit: 'breaths/min',
    unitCode: '/min'
  },
  temperature: {
    code: '8310-5',
    display: 'Suhu Tubuh',
    unit: 'Cel',
    unitCode: 'Cel'
  },
  oxygenSaturation: {
    code: '59408-5',
    display: 'Saturasi Oksigen',
    unit: '%',
    unitCode: '%'
  },
  painScore: {
    code: 'pain-score',
    display: 'Skor Nyeri',
    unit: '{score}',
    unitCode: '{score}'
  }
}

const FIELD_LABELS: Record<string, string> = {
  quickCondition: 'Kondisi Umum',
  quickLevel: 'Level Triase Awal',
  chiefComplaint: 'Keluhan',
  consciousness: 'Kesadaran',
  perfusion: 'Perfusi',
  transportation: 'Transportasi',
  referralLetter: 'Surat Pengantar Rujukan',
  caraMasuk: 'Cara Masuk',
  macamKasus: 'Macam Kasus',
  arrivalMode: 'Moda Kedatangan',
  bloodPressure: 'Tekanan Darah',
  pulseRate: 'Nadi',
  respiratoryRate: 'Frekuensi Napas',
  oxygenSaturation: 'Saturasi Oksigen',
  temperature: 'Suhu Tubuh',
  painScore: 'Skala Nyeri',
  specialNeeds: 'Kebutuhan Khusus',
  planZone: 'Plan Zona',
  shortAnamnesis: 'Anamnesa Singkat',
  notes: 'Catatan',
  planRoom: 'Plan Ruang'
}

const trimValue = (value: string | undefined) => (value ?? '').trim()

const parseFinalTriageLevel = (forms: IgdTriaseFormBySection): number | undefined => {
  const rawLevel = trimValue(forms.umum?.__finalLevel)
  const parsed = Number.parseInt(rawLevel, 10)
  if (!Number.isInteger(parsed) || parsed < 0) return undefined
  return parsed
}

const parseNumericValue = (rawValue: string | undefined): number | null => {
  const value = trimValue(rawValue)
  if (!value) return null
  const normalized = value.replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

const parseBloodPressure = (
  rawValue: string | undefined
): { systolic: number; diastolic: number } | null => {
  const value = trimValue(rawValue)
  if (!value) return null

  const match = value.match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/)
  if (!match) return null

  const systolic = Number(match[1])
  const diastolic = Number(match[2])
  if (!Number.isFinite(systolic) || !Number.isFinite(diastolic)) return null

  return { systolic, diastolic }
}

const sanitizeCodeSegment = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

const buildCustomCode = (section: IgdTriageSection, field: string) =>
  `igd-triage-${sanitizeCodeSegment(section)}-${sanitizeCodeSegment(field)}`

const resolveObservationCategory = (section: IgdTriageSection) => {
  if (section === 'umum') return OBSERVATION_CATEGORIES.EXAM
  if (section === 'quick') return OBSERVATION_CATEGORIES.EXAM
  return OBSERVATION_CATEGORIES.SURVEY
}

const appendFieldObservation = (
  drafts: ObservationDraft[],
  section: IgdTriageSection,
  fieldName: string,
  rawValue: string
) => {
  if (section === 'umum' && fieldName === 'consciousness') {
    const consciousness = trimValue(rawValue)
    const snomed = CONSCIOUSNESS_SNOMED_MAP[consciousness]
    drafts.push({
      category: OBSERVATION_CATEGORIES.EXAM,
      code: 'consciousness',
      display: 'Level of consciousness',
      valueString: consciousness,
      valueCodeableConcept: snomed
        ? {
            coding: [
              {
                system: OBSERVATION_SYSTEMS.SNOMED,
                code: snomed.code,
                display: snomed.display
              }
            ]
          }
        : undefined
    })
    return
  }

  if (section === 'umum' && fieldName === 'transportation') {
    const transportationKey = trimValue(rawValue)
    const snomed = TRANSPORTATION_SNOMED_MAP[transportationKey]
    if (snomed) {
      drafts.push({
        category: OBSERVATION_CATEGORIES.SURVEY,
        code: IGD_TRIAGE_TRANSPORTATION_CODE,
        display: 'Transport mode to hospital',
        system: OBSERVATION_SYSTEMS.LOINC,
        codeCoding: [
          {
            system: OBSERVATION_SYSTEMS.LOINC,
            code: IGD_TRIAGE_TRANSPORTATION_CODE,
            display: 'Transport mode to hospital'
          }
        ],
        valueCodeableConcept: {
          coding: [
            {
              system: OBSERVATION_SYSTEMS.SNOMED,
              code: snomed.code,
              display: snomed.display
            }
          ]
        }
      })
      return
    }
  }

  if (fieldName === 'bloodPressure') {
    const parsedPressure = parseBloodPressure(rawValue)
    if (parsedPressure) {
      drafts.push({
        category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
        code: '85354-9',
        display: 'Tekanan Darah',
        valueString: trimValue(rawValue),
        components: [
          {
            code: '8480-6',
            display: 'Tekanan Darah Sistolik',
            valueQuantity: {
              value: parsedPressure.systolic,
              unit: 'mm[Hg]',
              system: 'http://unitsofmeasure.org',
              code: 'mm[Hg]'
            }
          },
          {
            code: '8462-4',
            display: 'Tekanan Darah Diastolik',
            valueQuantity: {
              value: parsedPressure.diastolic,
              unit: 'mm[Hg]',
              system: 'http://unitsofmeasure.org',
              code: 'mm[Hg]'
            }
          }
        ]
      })
      return
    }
  }

  const vitalMeta = VITAL_QUANTITY_FIELDS[fieldName]
  if (vitalMeta) {
    const parsedQuantity = parseNumericValue(rawValue)
    if (parsedQuantity !== null) {
      drafts.push({
        category: OBSERVATION_CATEGORIES.VITAL_SIGNS,
        code: vitalMeta.code,
        display: vitalMeta.display,
        valueQuantity: {
          value: parsedQuantity,
          unit: vitalMeta.unit,
          system: 'http://unitsofmeasure.org',
          code: vitalMeta.unitCode
        }
      })
      return
    }
  }

  drafts.push({
    category: resolveObservationCategory(section),
    code: buildCustomCode(section, fieldName),
    display: FIELD_LABELS[fieldName] ?? fieldName,
    valueString: trimValue(rawValue)
  })
}

const appendAssessmentObservations = (
  drafts: ObservationDraft[],
  section: 'primer' | 'sekunder',
  values: Record<string, string>
) => {
  const countRaw = Number.parseInt(values[`__${section}AssessmentCount`] ?? '0', 10)
  const count = Number.isNaN(countRaw) || countRaw < 1 ? 0 : countRaw
  for (let index = 0; index < count; index += 1) {
    const criteriaId = trimValue(values[`${section}AssessmentCriteria_${index}`])
    const review = trimValue(values[`${section}AssessmentReview_${index}`])
    if (!criteriaId && !review) continue

    drafts.push({
      category: OBSERVATION_CATEGORIES.EXAM,
      code: `igd-triage-${section}-assessment-${index + 1}`,
      display: `${section} assessment ${index + 1}`,
      valueString: `criteria=${criteriaId || '-'}; review=${review || '-'}`
    })
  }
}

export const buildIgdTriaseObservationDrafts = (
  triageForms: IgdTriaseFormBySection
): ObservationDraft[] => {
  const drafts: ObservationDraft[] = []

  for (const section of Object.keys(triageForms) as IgdTriageSection[]) {
    if (section === 'matrix' || section === 'utama') continue
    const sectionValues = triageForms[section] ?? {}

    for (const [fieldName, rawValue] of Object.entries(sectionValues)) {
      if (fieldName.startsWith('__')) continue
      if (fieldName.includes('AssessmentCriteria_') || fieldName.includes('AssessmentReview_')) {
        continue
      }
      if (fieldName === 'allergy') continue

      if (!trimValue(rawValue)) continue
      appendFieldObservation(drafts, section, fieldName, rawValue)
    }
  }

  if (triageForms.primer) {
    appendAssessmentObservations(drafts, 'primer', triageForms.primer)
  }
  if (triageForms.sekunder) {
    appendAssessmentObservations(drafts, 'sekunder', triageForms.sekunder)
  }

  const finalLevel = parseFinalTriageLevel(triageForms)
  if (typeof finalLevel === 'number') {
    drafts.push({
      category: OBSERVATION_CATEGORIES.SURVEY,
      code: IGD_TRIAGE_LEVEL_OBSERVATION_CODE,
      display: 'IGD Triage Final Level',
      valueString: `L${finalLevel}`
    })
  }

  if (drafts.length > 0) {
    drafts.push({
      category: OBSERVATION_CATEGORIES.SURVEY,
      code: IGD_TRIAGE_SNAPSHOT_CODE,
      display: 'IGD Triase Snapshot',
      valueString: 'snapshot:v1'
    })
  }

  return drafts
}
