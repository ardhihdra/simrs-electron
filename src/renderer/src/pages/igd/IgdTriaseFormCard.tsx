/**
 * purpose: Kartu form triase IGD dengan 3 tab utama (`Triase Cepat`, `Info Umum`, `Utama`), quick level editable berbasis master level aktif, sinkronisasi `AssessmentHeader` petugas yang menjaga kecocokan tipe value select, tab `Utama` untuk gabungan vital+matrix, dan submit tunggal di card.
 * main callers: `IgdTriasePage`.
 * key dependencies: `DesktopCard`, `DesktopSegmentedControl`, `DesktopInputField`, `DesktopButton`, `DesktopNoticePanel`, `AssessmentHeader`, `useIgdTriageMaster`, `usePerformers`, `useModuleScopeStore`, `TRANSPORTATION_SNOMED_MAP`.
 * main/public functions: `IgdTriaseFormCard`.
 * side effects: Men-trigger query read-only master triase/petugas dan mengirim event perubahan field/section/simpan lewat callback props.
 */
import { DesktopButton } from '../../components/design-system/atoms/DesktopButton'
import { DesktopCard } from '../../components/design-system/molecules/DesktopCard'
import {
  DesktopInputField,
  type DesktopInputFieldOption
} from '../../components/design-system/molecules/DesktopInputField'
import { DesktopNoticePanel } from '../../components/design-system/molecules/DesktopNoticePanel'
import { DesktopSegmentedControl } from '../../components/design-system/molecules/DesktopSegmentedControl'
import { AssessmentHeader } from '../../components/organisms/Assessment/AssesmentHeader/AssessmentHeader'
import {
  type TriageCriteriaGroupedByGroup,
  useIgdTriageMaster
} from '../../hooks/query/use-igd-triage-master'
import { usePerformers } from '../../hooks/query/use-performers'
import { useModuleScopeStore } from '../../services/ModuleScope/store'
import {
  CONSCIOUSNESS_SNOMED_MAP,
  TRANSPORTATION_SNOMED_MAP
} from '../../config/maps/observation-maps'
import { IGD_QUICK_TRIAGE_OPTIONS } from './igd.quick-triage'
import { Form } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import React, { useEffect, useMemo, useRef } from 'react'

import { type IgdTriageSection } from './igd.state'
import { QUICK_TRIAGE_FIELD_NAMES, resolveQuickLevelFromCondition } from './igd-triase-form-state'
import {
  getMatrixFieldKey,
  MATRIX_GROUPS,
  readSelectedMatrixCriteriaIds
} from './igd-triage-matrix-sync'

type IgdTriaseField = {
  name: string
  label: string
  type?: 'input' | 'textarea' | 'select'
  rows?: number
  placeholder?: string
  disabled?: boolean
  defaultValue?: string
  colSpan?: 1 | 2 | 3
  required?: boolean
  options?: DesktopInputFieldOption[]
}

type TriageHeaderFormValues = {
  assessment_date?: Dayjs
  performerId?: number | string
}

const TRIAGE_INTERNAL_KEYS = {
  assessmentDate: '__assessmentDate',
  performerId: '__performerId',
  performerName: '__performerName',
  suggestedLevel: '__suggestedLevel',
  finalLevel: '__finalLevel',
  finalLevelSource: '__finalLevelSource'
} as const

const GROUP_LABELS: Record<keyof TriageCriteriaGroupedByGroup, string> = {
  airway: 'Airway',
  breathing: 'Breathing',
  circulation: 'Circulation',
  disability_and_other_dysfunction: 'Disability/Disfungsi',
  nyeri: 'Nyeri'
}

const TRANSPORTATION_OPTIONS: DesktopInputFieldOption[] = Object.keys(
  TRANSPORTATION_SNOMED_MAP
).map((key) => ({
  label: key,
  value: key
}))

const CARA_MASUK_OPTIONS: DesktopInputFieldOption[] = [
  { label: 'Jalan', value: 'jalan' },
  { label: 'Kursi Roda', value: 'kursi_roda' },
  { label: 'Brankar', value: 'brankar' }
]

const MACAM_KASUS_OPTIONS: DesktopInputFieldOption[] = [
  { label: 'Trauma', value: 'trauma' },
  { label: 'Non-Trauma', value: 'non_trauma' }
]
const CONSCIOUSNESS_GCS_OPTIONS: DesktopInputFieldOption[] = Object.keys(
  CONSCIOUSNESS_SNOMED_MAP
).map((key) => ({
  label: key,
  value: key
}))
const QUICK_CONDITION_OPTIONS: DesktopInputFieldOption[] = IGD_QUICK_TRIAGE_OPTIONS.map((item) => ({
  label: item.label,
  value: item.value
}))

const UMUM_INFO_FIELDS: IgdTriaseField[] = [
  {
    name: 'transportation',
    label: 'Transportasi',
    type: 'select',
    placeholder: 'Pilih transportasi',
    options: TRANSPORTATION_OPTIONS
  },
  {
    name: 'caraMasuk',
    label: 'Cara Masuk',
    type: 'select',
    placeholder: 'Pilih cara masuk',
    options: CARA_MASUK_OPTIONS
  },
  {
    name: 'macamKasus',
    label: 'Macam Kasus',
    type: 'select',
    placeholder: 'Pilih macam kasus',
    options: MACAM_KASUS_OPTIONS
  },
  { name: 'allergy', label: 'Alergi', type: 'textarea', rows: 3, colSpan: 2 },
  { name: 'arrivalMode', label: 'Moda Kedatangan', type: 'textarea', rows: 3 }
]

const UTAMA_CORE_FIELDS: IgdTriaseField[] = [
  {
    name: 'chiefComplaint',
    label: 'Keluhan Utama',
    type: 'textarea',
    rows: 3,
    placeholder: 'Masukkan keluhan utama pasien...',
    colSpan: 3
  },
  {
    name: 'shortAnamnesis',
    label: 'Anamnesa Singkat',
    type: 'textarea',
    rows: 3,
    placeholder: 'Masukkan anamnesa singkat pasien...',
    colSpan: 3
  }
]

const UTAMA_EXAM_FIELDS: IgdTriaseField[] = [
  { name: 'temperature', label: 'Suhu (°C)', type: 'input', placeholder: '36.5' },
  { name: 'painScore', label: 'Nyeri (VAS)', type: 'input', placeholder: '0 - 10' },
  {
    name: 'oxygenSaturation',
    label: 'Saturasi Oksigen (%)',
    type: 'input',
    placeholder: '98'
  },
  { name: 'respiratoryRate', label: 'Respirasi (/mnt)', type: 'input', placeholder: '20' },
  { name: 'bloodPressure', label: 'Tensi (mmHg)', type: 'input', placeholder: '120/80' },
  { name: 'pulseRate', label: 'Nadi (/mnt)', type: 'input', placeholder: '80' },
  {
    name: 'consciousness',
    label: 'Kesadaran (GCS)',
    type: 'select',
    placeholder: 'Pilih tingkat kesadaran',
    options: CONSCIOUSNESS_GCS_OPTIONS
  },
  {
    name: 'specialNeeds',
    label: 'Kebutuhan Khusus',
    type: 'input',
    placeholder: 'Alat bantu, pendamping, kebutuhan khusus lainnya...',
    colSpan: 3
  }
]

const QUICK_FIELDS: IgdTriaseField[] = [
  {
    name: QUICK_TRIAGE_FIELD_NAMES.condition,
    label: 'Kondisi Umum',
    required: true,
    type: 'select',
    placeholder: 'Pilih kondisi umum',
    options: QUICK_CONDITION_OPTIONS,
    colSpan: 3
  },
  {
    name: QUICK_TRIAGE_FIELD_NAMES.level,
    label: 'Level Triase Awal',
    required: true,
    type: 'select',
    placeholder: 'Pilih level triase awal'
  },
  {
    name: QUICK_TRIAGE_FIELD_NAMES.complaint,
    label: 'Keluhan Singkat',
    required: true,
    type: 'textarea',
    rows: 3,
    placeholder: 'Masukkan keluhan singkat pasien...',
    colSpan: 3
  }
]

const TRIAGE_SECTION_LABELS: Record<IgdTriageSection, string> = {
  quick: 'Triase Cepat',
  umum: 'Info Umum',
  utama: 'Utama',
  matrix: 'Pemeriksaan Cepat',
  primer: 'Primer (L1–2)',
  sekunder: 'Sekunder (L3–5)'
}

const getLevelLabel = (levelNo: number): string => `L${levelNo}`

const getFinalLevelBannerPalette = (levelNo?: number | null) => {
  if (levelNo === 0) {
    return {
      background: '#111827',
      borderColor: '#030712',
      textColor: '#F9FAFB',
      buttonBackground: '#1F2937',
      buttonTextColor: '#FFFFFF'
    }
  }
  if (levelNo === 1) {
    return {
      background: '#FEE2E2',
      borderColor: '#DC2626',
      textColor: '#7F1D1D',
      buttonBackground: '#DC2626',
      buttonTextColor: '#FFFFFF'
    }
  }
  if (levelNo === 2) {
    return {
      background: '#FFEDD5',
      borderColor: '#EA580C',
      textColor: '#9A3412',
      buttonBackground: '#EA580C',
      buttonTextColor: '#FFFFFF'
    }
  }
  if (levelNo === 3) {
    return {
      background: '#FEF3C7',
      borderColor: '#CA8A04',
      textColor: '#713F12',
      buttonBackground: '#CA8A04',
      buttonTextColor: '#111827'
    }
  }
  if (levelNo === 4) {
    return {
      background: '#F3F4F6',
      borderColor: '#9CA3AF',
      textColor: '#111827',
      buttonBackground: '#4B5563',
      buttonTextColor: '#FFFFFF'
    }
  }
  return {
    background: 'var(--ds-color-surface-muted)',
    borderColor: 'var(--ds-color-border-strong)',
    textColor: 'var(--ds-color-text-muted)',
    buttonBackground: 'var(--ds-color-accent)',
    buttonTextColor: '#FFFFFF'
  }
}

function UmumAssessmentHeader({
  formValues,
  onFieldChange
}: {
  formValues: Record<string, string>
  onFieldChange: (name: string, value: string) => void
}) {
  const [headerForm] = Form.useForm<TriageHeaderFormValues>()
  const isHydratingFormRef = useRef(false)
  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers([
    'doctor',
    'nurse'
  ])
  const session = useModuleScopeStore((state) => state.session)
  const performers = useMemo(
    () => (performersData ?? []).map((performer) => ({ id: performer.id, name: performer.name })),
    [performersData]
  )

  const assessmentDateValue = formValues[TRIAGE_INTERNAL_KEYS.assessmentDate]
  const performerIdValue = formValues[TRIAGE_INTERNAL_KEYS.performerId]
  const watchedAssessmentDate = Form.useWatch('assessment_date', headerForm)
  const watchedPerformerId = Form.useWatch('performerId', headerForm)

  const syncAssessmentDateToDraft = (nextDate: Dayjs | undefined) => {
    const nextDateIso = dayjs.isDayjs(nextDate) && nextDate.isValid() ? nextDate.toISOString() : ''
    if ((assessmentDateValue ?? '') === nextDateIso) return
    onFieldChange(TRIAGE_INTERNAL_KEYS.assessmentDate, nextDateIso)
  }

  const syncPerformerToDraft = (nextPerformerIdRaw: number | string | undefined) => {
    const nextPerformerId = nextPerformerIdRaw ? String(nextPerformerIdRaw) : ''
    const nextPerformerName =
      performers.find((performer) => String(performer.id) === nextPerformerId)?.name ?? ''
    if ((performerIdValue ?? '') !== nextPerformerId) {
      onFieldChange(TRIAGE_INTERNAL_KEYS.performerId, nextPerformerId)
    }
    if ((formValues[TRIAGE_INTERNAL_KEYS.performerName] ?? '') !== nextPerformerName) {
      onFieldChange(TRIAGE_INTERNAL_KEYS.performerName, nextPerformerName)
    }
  }

  useEffect(() => {
    const nextDate = assessmentDateValue ? dayjs(assessmentDateValue) : undefined
    const normalizedPerformerId = performerIdValue
      ? (performers.find((performer) => String(performer.id) === performerIdValue)?.id ??
        performerIdValue)
      : undefined
    const nextDateValue = nextDate?.isValid() ? nextDate : undefined
    const currentDateValue = headerForm.getFieldValue('assessment_date')
    const currentPerformerValue = headerForm.getFieldValue('performerId')

    const currentDateIso =
      dayjs.isDayjs(currentDateValue) && currentDateValue.isValid()
        ? currentDateValue.toISOString()
        : ''
    const nextDateIso =
      dayjs.isDayjs(nextDateValue) && nextDateValue.isValid() ? nextDateValue.toISOString() : ''
    const shouldSyncDate = currentDateIso !== nextDateIso
    const shouldSyncPerformer = currentPerformerValue !== normalizedPerformerId

    if (!shouldSyncDate && !shouldSyncPerformer) return
    isHydratingFormRef.current = true
    headerForm.setFieldsValue({
      assessment_date: nextDateValue,
      performerId: normalizedPerformerId
    })
    queueMicrotask(() => {
      isHydratingFormRef.current = false
    })
  }, [assessmentDateValue, headerForm, performerIdValue, performers])

  useEffect(() => {
    if (performerIdValue) return
    const sessionPerformerId = session?.kepegawaianId
    if (typeof sessionPerformerId !== 'number' || !Number.isFinite(sessionPerformerId)) return
    const matched = performers.find(
      (performer) => String(performer.id) === String(sessionPerformerId)
    )
    if (!matched) return
    isHydratingFormRef.current = true
    headerForm.setFieldValue('performerId', matched.id)
    queueMicrotask(() => {
      isHydratingFormRef.current = false
    })
    syncPerformerToDraft(matched.id)
  }, [headerForm, performerIdValue, performers, session?.kepegawaianId])

  useEffect(() => {
    syncAssessmentDateToDraft(watchedAssessmentDate)
  }, [watchedAssessmentDate])

  useEffect(() => {
    syncPerformerToDraft(watchedPerformerId)
  }, [watchedPerformerId, performers])

  return (
    <Form
      form={headerForm}
      layout="vertical"
      onValuesChange={(changedValues, allValues) => {
        if (isHydratingFormRef.current) return
        if ('assessment_date' in changedValues) {
          syncAssessmentDateToDraft(allValues.assessment_date)
        }
        if ('performerId' in changedValues) {
          syncPerformerToDraft(allValues.performerId)
        }
      }}
    >
      <AssessmentHeader performers={performers} loading={isLoadingPerformers} forceCurrentLogin />
    </Form>
  )
}

export type IgdTriaseFormCardProps = {
  activeSection: IgdTriageSection
  activeTriageLevel?: number
  formValues: Record<string, string>
  onSectionChange: (section: IgdTriageSection) => void
  onFieldChange: (name: string, value: string) => void
  onSave: () => void
  isSaveDisabled?: boolean
}

export function IgdTriaseFormCard({
  activeSection,
  activeTriageLevel,
  formValues,
  onSectionChange,
  onFieldChange,
  onSave,
  isSaveDisabled = false
}: IgdTriaseFormCardProps) {
  const {
    levels,
    criteria,
    criteriaByLevel,
    isLoading: isMasterLoading,
    isError: isMasterError,
    error: masterError
  } = useIgdTriageMaster()
  const sortedLevels = useMemo(
    () => [...levels].sort((left, right) => left.levelNo - right.levelNo),
    [levels]
  )
  const triageLevelOptions: DesktopInputFieldOption[] = useMemo(() => {
    if (sortedLevels.length === 0) {
      return [0, 1, 2, 3, 4].map((levelNo) => ({
        label: getLevelLabel(levelNo),
        value: String(levelNo)
      }))
    }

    return sortedLevels.map((level) => ({
      label: `${getLevelLabel(level.levelNo)} · ${level.label ?? level.name ?? `Kategori ${level.levelNo}`}`,
      value: String(level.levelNo)
    }))
  }, [sortedLevels])
  const hasAnyMatrixCriteria = criteria.length > 0
  const suggestedLevelRaw = (formValues[TRIAGE_INTERNAL_KEYS.suggestedLevel] ?? '').trim()
  const finalLevelRaw =
    (formValues[TRIAGE_INTERNAL_KEYS.finalLevel] ?? '').trim() || suggestedLevelRaw
  const matrixSelectedCriteriaIds = useMemo(
    () => readSelectedMatrixCriteriaIds(formValues),
    [formValues]
  )
  const matrixLevelNoByCriteriaId = useMemo(() => {
    const result = new Map<number, number>()
    for (const level of sortedLevels) {
      const grouped = criteriaByLevel.get(level.id)
      if (!grouped) continue
      for (const groupKey of MATRIX_GROUPS) {
        const rows = grouped[groupKey] ?? []
        for (const row of rows) {
          result.set(row.id, level.levelNo)
        }
      }
    }
    return result
  }, [criteriaByLevel, sortedLevels])
  const matrixDerivedLevel = useMemo(() => {
    if (matrixSelectedCriteriaIds.length === 0) return null
    const levelCount = new Map<number, number>()
    for (const criteriaId of matrixSelectedCriteriaIds) {
      const levelNo = matrixLevelNoByCriteriaId.get(criteriaId)
      if (typeof levelNo !== 'number') continue
      levelCount.set(levelNo, (levelCount.get(levelNo) ?? 0) + 1)
    }
    if (levelCount.size === 0) return null

    let selectedLevelNo: number | null = null
    let maxCount = -1
    for (const [levelNo, count] of levelCount.entries()) {
      if (count > maxCount || (count === maxCount && (selectedLevelNo === null || levelNo < selectedLevelNo))) {
        selectedLevelNo = levelNo
        maxCount = count
      }
    }
    if (selectedLevelNo === null) return null

    const selectedLevel = sortedLevels.find((item) => item.levelNo === selectedLevelNo)
    return {
      levelNo: selectedLevelNo,
      level: selectedLevel,
      label: selectedLevel?.label ?? selectedLevel?.name ?? `Kategori ${selectedLevelNo}`,
      itemCount: levelCount.get(selectedLevelNo) ?? 0
    }
  }, [matrixLevelNoByCriteriaId, matrixSelectedCriteriaIds, sortedLevels])
  const finalLevelNo = useMemo(() => {
    const parsed = Number(finalLevelRaw)
    if (Number.isFinite(parsed) && parsed >= 0) return parsed
    return null
  }, [finalLevelRaw])
  const finalLevelView = useMemo(() => {
    const levelNo = matrixDerivedLevel?.levelNo ?? finalLevelNo
    if (levelNo === null) return null
    const level = sortedLevels.find((item) => item.levelNo === levelNo)
    const label = level?.label ?? level?.name ?? `Kategori ${levelNo}`
    const color = (level?.color ?? '').replaceAll('_', ' ').trim()
    const fallbackColorName =
      levelNo === 0 ? 'Hitam' : levelNo === 1 ? 'Merah' : levelNo === 2 ? 'Kuning' : levelNo === 3 ? 'Hijau' : levelNo === 4 ? 'Putih' : 'Netral'

    return {
      levelNo,
      label,
      color: color || fallbackColorName
    }
  }, [finalLevelNo, matrixDerivedLevel?.levelNo, sortedLevels])
  const finalLevelPalette = useMemo(
    () => getFinalLevelBannerPalette(finalLevelView?.levelNo),
    [finalLevelView?.levelNo]
  )
  const hasInlineSaveBanner =
    activeSection === 'utama' && hasAnyMatrixCriteria && !isMasterLoading && !isMasterError

  const renderFieldGrid = (fields: IgdTriaseField[], section: IgdTriageSection = activeSection) => (
    <div className="grid gap-[var(--ds-space-md)] md:grid-cols-3">
      {fields.map((field) => {
        let value = formValues[field.name] ?? field.defaultValue ?? ''
        const runtimeField =
          section === 'quick' && field.name === QUICK_TRIAGE_FIELD_NAMES.level
            ? {
                ...field,
                type: 'select' as const,
                options: triageLevelOptions
              }
            : field

        return (
          <div
            key={field.name}
            className={
              field.colSpan === 3
                ? 'md:col-span-3'
                : field.colSpan === 2
                  ? 'md:col-span-2'
                  : undefined
            }
          >
            <DesktopInputField
              label={runtimeField.label}
              required={runtimeField.required}
              type={runtimeField.type ?? 'textarea'}
              rows={runtimeField.rows ?? 3}
              placeholder={runtimeField.placeholder ?? `Isi ${runtimeField.label.toLowerCase()}`}
              value={value}
              options={runtimeField.options}
              disabled={runtimeField.disabled}
              onChange={(nextValue) => {
                if (runtimeField.disabled) return
                if (section === 'quick' && runtimeField.name === QUICK_TRIAGE_FIELD_NAMES.condition) {
                  onFieldChange(QUICK_TRIAGE_FIELD_NAMES.condition, nextValue)
                  onFieldChange(
                    QUICK_TRIAGE_FIELD_NAMES.level,
                    resolveQuickLevelFromCondition(nextValue)
                  )
                  return
                }
                onFieldChange(field.name, nextValue)
              }}
            />
          </div>
        )
      })}
    </div>
  )

  const getMatrixLevelPalette = (level: { levelNo: number; color?: string | null }) => {
    const normalizedColor = (level.color ?? '').toLowerCase().trim()
    if (
      level.levelNo === 0 ||
      normalizedColor === 'hitam' ||
      normalizedColor === 'black'
    ) {
      return {
        background: '#1F2937',
        borderColor: '#030712',
        textColor: '#F9FAFB'
      }
    }
    if (level.levelNo === 1 || normalizedColor === 'merah') {
      return {
        background: '#FECACA',
        borderColor: '#DC2626',
        textColor: '#7F1D1D'
      }
    }
    if (
      level.levelNo === 2 ||
      normalizedColor === 'orange' ||
      normalizedColor === 'oranye' ||
      normalizedColor === 'kuning' ||
      normalizedColor === 'yellow'
    ) {
      return {
        background: '#FEF08A',
        borderColor: '#CA8A04',
        textColor: '#713F12'
      }
    }
    if (level.levelNo === 3 || normalizedColor === 'hijau' || normalizedColor === 'green') {
      return {
        background: '#DCFCE7',
        borderColor: '#16A34A',
        textColor: '#14532D'
      }
    }
    if (level.levelNo === 4 || normalizedColor === 'putih' || normalizedColor === 'white') {
      return {
        background: '#F3F4F6',
        borderColor: '#9CA3AF',
        textColor: '#111827'
      }
    }
    return {
      background: '#E5E7EB',
      borderColor: '#6B7280',
      textColor: '#1F2937'
    }
  }

  const renderMatrixShortcut = () => (
    <div className="grid gap-[var(--ds-space-md)]">
      {isMasterLoading ? (
        <DesktopNoticePanel
          tone="warning"
          title="Memuat master triase..."
          description="Daftar checkbox kriteria per level sedang disiapkan."
        />
      ) : null}

      {isMasterError ? (
        <DesktopNoticePanel
          tone="danger"
          title="Gagal memuat master triase"
          description={
            masterError instanceof Error
              ? masterError.message
              : 'Terjadi kesalahan query master triase.'
          }
        />
      ) : null}

      {!isMasterLoading && !isMasterError ? (
        hasAnyMatrixCriteria ? (
          <div className="grid gap-[var(--ds-space-sm)]">
            <div className="overflow-x-auto rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)]">
              <table className="w-full min-w-[920px] border-collapse">
                <thead>
                  <tr>
                    <th className="border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-sm)] py-[var(--ds-space-xs)] text-left text-[length:var(--ds-font-size-label)] font-semibold">
                      Pemeriksaan
                    </th>
                    {sortedLevels.map((level) => {
                      const palette = getMatrixLevelPalette(level)

                      return (
                        <th
                          key={`matrix-level-${level.id}`}
                          className="border px-[var(--ds-space-sm)] py-[var(--ds-space-xs)] text-left text-[length:var(--ds-font-size-label)] font-semibold"
                          style={{
                            background: palette.background,
                            borderColor: palette.borderColor,
                            color: palette.textColor
                          }}
                        >
                          <div className="flex flex-col gap-[2px]">
                            <span>L{level.levelNo}</span>
                            <span className="text-[10px] font-normal">
                              {level.label ?? level.name ?? `Kategori ${level.levelNo}`}
                            </span>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {MATRIX_GROUPS.map((group) => (
                    <tr key={`matrix-group-${group}`}>
                      <td className="align-top border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-sm)] py-[var(--ds-space-sm)] text-[length:var(--ds-font-size-body)] font-medium">
                        {GROUP_LABELS[group]}
                      </td>
                      {sortedLevels.map((level) => {
                        const rows = [...(criteriaByLevel.get(level.id)?.[group] ?? [])].sort(
                          (left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0)
                        )
                        const palette = getMatrixLevelPalette(level)

                        return (
                          <td
                            key={`matrix-cell-${group}-${level.id}`}
                            className="align-top border border-[var(--ds-color-border)] px-[var(--ds-space-sm)] py-[var(--ds-space-xs)]"
                            style={{
                              background: palette.background,
                              borderColor: palette.borderColor
                            }}
                          >
                            {rows.length === 0 ? (
                              <div className="text-[11px]" style={{ color: palette.textColor }}>
                                -
                              </div>
                            ) : (
                              <div className="grid gap-[6px]">
                                {rows.map((row) => {
                                  const fieldKey = getMatrixFieldKey(row.id)
                                  const isChecked = formValues[fieldKey] === '1'

                                  return (
                                    <label
                                      key={`matrix-check-${row.id}`}
                                      className="flex cursor-pointer items-start gap-[6px] text-[11px]"
                                      style={{ color: palette.textColor }}
                                    >
                                      <input
                                        type="checkbox"
                                        className="mt-[2px] h-4 w-4"
                                        style={{ accentColor: palette.textColor }}
                                        checked={isChecked}
                                        onChange={(event) =>
                                          onFieldChange(
                                            fieldKey,
                                            event.currentTarget.checked ? '1' : ''
                                          )
                                        }
                                      />
                                      <span>{row.criteriaText}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              className="mt-[var(--ds-space-sm)] flex items-center gap-[var(--ds-space-md)] rounded-[var(--ds-radius-md)] border px-[var(--ds-space-md)] py-[var(--ds-space-sm)]"
              style={{
                background: finalLevelPalette.background,
                borderColor: finalLevelPalette.borderColor
              }}
            >
              <div>
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.07em]"
                  style={{ color: finalLevelPalette.textColor }}
                >
                  Level Triase Final
                </div>
                {finalLevelView ? (
                  <div className="mt-[4px] flex items-center gap-[8px]">
                    <span
                      className="inline-flex rounded-[var(--ds-radius-sm)] border px-[8px] py-[3px] text-[11px] font-semibold"
                      style={{
                        borderColor: finalLevelPalette.borderColor,
                        background: finalLevelPalette.background,
                        color: finalLevelPalette.textColor
                      }}
                    >
                      L{finalLevelView.levelNo}
                    </span>
                    <b style={{ color: finalLevelPalette.textColor }}>
                      {finalLevelView.label} · {finalLevelView.color}
                    </b>
                  </div>
                ) : (
                  <div className="mt-[4px] text-[12px] text-[var(--ds-color-text-muted)]">
                    Belum ada checkbox dipilih.
                  </div>
                )}
              </div>
              <div className="flex-1" />
              <DesktopButton
                emphasis="primary"
                disabled={isSaveDisabled}
                onClick={onSave}
                style={{
                  background: finalLevelPalette.buttonBackground,
                  color: finalLevelPalette.buttonTextColor,
                  borderColor: finalLevelPalette.buttonBackground
                }}
              >
                Simpan Triase Final
              </DesktopButton>
            </div>
          </div>
        ) : (
          <DesktopNoticePanel
            tone="warning"
            title="Belum ada kriteria aktif"
            description="Master kriteria triase belum tersedia untuk ditampilkan pada tabel checkbox."
          />
        )
      ) : null}
    </div>
  )

  return (
    <DesktopCard
      title="Form Triase"
      subtitle="Bagian form berubah sesuai section aktif, disimpan sebagai draft lokal per pasien, lalu dikirim ke Observation backend saat submit."
    >
      <div className="grid gap-[var(--ds-space-md)]">
        <DesktopSegmentedControl
          value={activeSection}
          options={(['quick', 'umum', 'utama'] as IgdTriageSection[]).map((section) => ({
            label: TRIAGE_SECTION_LABELS[section],
            value: section
          }))}
          onChange={(value) => onSectionChange(value as IgdTriageSection)}
        />

        {activeSection === 'quick' ? (
          <div className="grid gap-[var(--ds-space-md)]">{renderFieldGrid(QUICK_FIELDS, 'quick')}</div>
        ) : activeSection === 'umum' ? (
          <div className="grid gap-[var(--ds-space-md)]">
            <UmumAssessmentHeader formValues={formValues} onFieldChange={onFieldChange} />
            {renderFieldGrid(UMUM_INFO_FIELDS)}
          </div>
        ) : (
          <div className="grid gap-[var(--ds-space-md)]">
            {renderFieldGrid(UTAMA_CORE_FIELDS, 'utama')}
            <div className="grid gap-[var(--ds-space-sm)] border-t border-dashed border-[var(--ds-color-border-strong)] pt-[var(--ds-space-md)]">
              <div className="text-[length:var(--ds-font-size-label)] font-semibold uppercase tracking-wide text-[var(--ds-color-text-muted)]">
                Vital Sign + Kesadaran + Kebutuhan Khusus
              </div>
              {renderFieldGrid(UTAMA_EXAM_FIELDS, 'utama')}
            </div>
            <div className="grid gap-[var(--ds-space-sm)] border-t border-dashed border-[var(--ds-color-border-strong)] pt-[var(--ds-space-md)]">
              <div className="text-[length:var(--ds-font-size-label)] font-semibold uppercase tracking-wide text-[var(--ds-color-text-muted)]">
                Pemeriksaan + Pengkajian
              </div>
              {renderMatrixShortcut()}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-[var(--ds-space-sm)]">
          {activeSection === 'quick' ? (
            <DesktopButton emphasis="secondary" onClick={() => onSectionChange('umum')}>
              Lanjut Info Umum
            </DesktopButton>
          ) : null}
          {activeSection === 'umum' ? (
            <DesktopButton emphasis="secondary" onClick={() => onSectionChange('utama')}>
              Lanjut Utama
            </DesktopButton>
          ) : null}
          {!hasInlineSaveBanner ? (
            <DesktopButton emphasis="primary" disabled={isSaveDisabled} onClick={onSave}>
              Simpan Triase
            </DesktopButton>
          ) : null}
        </div>
      </div>
    </DesktopCard>
  )
}
