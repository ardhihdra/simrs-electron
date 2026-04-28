/**
 * purpose: Halaman triase IGD berbasis dashboard backend dengan shell operasional (header/stat strip) setara daftar pasien, draft form lokal lintas section (UI tab `quick|umum|utama`), validasi wajib quick+klinis sebelum submit, level panel kanan yang mengikuti draft aktif, hydrate Observation, dan submit via hook Observation.
 * main callers: `IgdTriaseRoute` (menu triase IGD).
 * key dependencies: `client.igd.dashboard`, `IgdTriaseFormCard`, `IgdPatientInfoPanel`, `useBulkCreateObservation`, `useQueryObservationByEncounter`, mapper/formatter observation triase, resolver level triase, dan util sinkronisasi matrix triase.
 * main/public functions: `IgdTriasePage`, `IgdTriaseRoute`.
 * side effects: Query dashboard+Observation backend (read), simpan draft triase lokal (in-memory), write Observation ke backend lewat mutation hook dengan metadata petugas/tanggal asesmen, dan refetch observation pasien aktif setelah submit sukses.
 */
import { DesktopBadge } from '../../components/design-system/atoms/DesktopBadge'
import { DesktopButton } from '../../components/design-system/atoms/DesktopButton'
import { DesktopStatusDot } from '../../components/design-system/atoms/DesktopStatusDot'
import type { DesktopTriageBadgeTone } from '../../components/design-system/atoms/DesktopTriageBadge'
import { DesktopCard } from '../../components/design-system/molecules/DesktopCard'
import { DesktopCompactStatStrip } from '../../components/design-system/molecules/DesktopCompactStatStrip'
import { DesktopNoticePanel } from '../../components/design-system/molecules/DesktopNoticePanel'
import { DesktopPageHeader } from '../../components/design-system/organisms/DesktopPageHeader'
import { App } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import {
  useBulkCreateObservation,
  useQueryObservationByEncounter
} from '../../hooks/query/use-observation'
import { useIgdTriageMaster } from '../../hooks/query/use-igd-triage-master'
import { showApiError } from '../../utils/form-feedback'
import { createObservationBatch } from '../../utils/builders/observation-builder'
import { client } from '../../utils/client'

import { IGD_PAGE_PATHS } from './igd.config'
import { type IgdPatient, type IgdTriageSection, useIgdStore } from './igd.state'
import { getIgdTriageLevelMeta } from './igd.triage-level'
import { buildIgdTriaseObservationDrafts } from './igd-triage-observation'
import { IgdTriaseObservationLike } from './igd-triage-observation-formatter'

type IgdTriasePageProps = {
  dashboard: IgdDashboard
  initialSelectedPatientId?: string
  isLoading?: boolean
  errorMessage?: string
  onRetry?: () => void
  onBack?: () => void
}

type IgdTriaseRouteState = {
  selectedPatientId?: string
}

type IgdTriaseLocalForms = Partial<Record<string, IgdTriaseFormBySection>>
const TRIAGE_VISIBLE_SECTIONS: IgdTriageSection[] = ['quick', 'umum', 'utama']
const TRIAGE_INTERNAL_KEYS = {
  assessmentDate: '__assessmentDate',
  performerId: '__performerId',
  performerName: '__performerName',
  suggestedLevel: '__suggestedLevel',
  finalLevel: '__finalLevel',
  finalLevelSource: '__finalLevelSource'
} as const

const parseTriageLevelNumber = (rawValue: string | number | undefined): number | undefined => {
  const value = Number.parseInt(String(rawValue ?? '').trim(), 10)
  if (!Number.isInteger(value) || value < 0) return undefined
  return value
}

const getQuickLevelFromForms = (
  forms: IgdTriaseFormBySection | undefined,
  fallbackLevel: number | undefined
): number | undefined => parseTriageLevelNumber(forms?.quick?.quickLevel) ?? fallbackLevel

const hasNonEmptyText = (value: string | undefined): boolean => (value ?? '').trim().length > 0

const hasAnyUtamaClinicalInput = (forms: IgdTriaseFormBySection | undefined): boolean =>
  Object.values(buildUtamaViewValues(forms)).some((value) => hasNonEmptyText(value))

const resolveTriageTone = (levelNo: number): DesktopTriageBadgeTone => {
  if (levelNo <= 1) return 'danger'
  if (levelNo === 2) return 'warning'
  if (levelNo === 3) return 'success'
  return 'neutral'
}

const hasFilledSectionValues = (sectionValues: Record<string, string> | undefined): boolean => {
  if (!sectionValues) return false
  return Object.entries(sectionValues).some(([fieldName, rawValue]) => {
    if (fieldName.startsWith('__')) return false
    return (rawValue ?? '').trim().length > 0
  })
}

const hasFilledTriageForms = (forms: IgdTriaseFormBySection | undefined): boolean => {
  if (!forms) return false
  return (Object.keys(forms) as IgdTriageSection[]).some((section) =>
    hasFilledSectionValues(forms[section])
  )
}

const TRIAGE_SECTION_LABELS: Record<IgdTriageSection, string> = {
  quick: 'Triase Cepat',
  umum: 'Info Umum',
  primer: 'Primer',
  sekunder: 'Sekunder'
}

const getTriageTone = (level: IgdPatient['triageLevel']): DesktopBadgeTone => {
  return getIgdTriageLevelMeta(level).statTone
}

function PatientSelector({
  patient,
  active,
  onSelect
}: {
  patient: IgdPatient
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-[var(--ds-radius-md)] border px-[var(--ds-space-md)] py-[var(--ds-space-sm)] text-left transition-colors ${
        active
          ? 'border-[var(--ds-color-accent)] bg-[var(--ds-color-accent-soft)]'
          : 'border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] hover:border-[var(--ds-color-border-strong)]'
      }`}
    >
      <div className="flex items-center justify-between gap-[var(--ds-space-sm)]">
        <div className="min-w-0">
          <div className="truncate font-semibold text-[var(--ds-color-text)]">{patient.name}</div>
          <div className="text-[length:var(--ds-font-size-label)] text-[var(--ds-color-text-muted)]">
            {patient.registrationNumber}
          </div>
        </div>
        <DesktopBadge
          tone={getTriageTone(patient.triageLevel)}
          style={getIgdTriageLevelMeta(patient.triageLevel).badgeStyle}
        >
          {getIgdTriageLevelMeta(patient.triageLevel).label}
        </DesktopBadge>
      </div>
    </button>
  )
}

export function IgdTriasePage({
  dashboard,
  initialSelectedPatientId,
  isLoading = false,
  errorMessage,
  onRetry,
  onBack
}: IgdTriasePageProps) {
  const { message } = App.useApp()
  const bulkCreateObservation = useBulkCreateObservation()
  const triageMaster = useIgdTriageMaster()
  const criteriaMetaById = useMemo(
    () =>
      buildMatrixCriteriaMetaById(
        triageMaster.criteria,
        triageMaster.levels.map((level) => ({ id: level.id, levelNo: level.levelNo }))
      ),
    [triageMaster.criteria, triageMaster.levels]
  )
  const activeTriageLevels = useMemo(
    () =>
      Array.from(
        new Set(
          triageMaster.levels
            .map((level) => level.levelNo)
            .filter((levelNo) => Number.isInteger(levelNo) && levelNo >= 0)
        )
      ).sort((left, right) => left - right),
    [triageMaster.levels]
  )

  const patients = dashboard.patients
  const criticalCount = patients.filter((patient) => patient.triageLevel <= 2).length
  const statStripActiveLevels = useMemo(() => {
    const fromSummary = (dashboard.summary.activeTriageLevels ?? [])
      .filter((levelNo) => Number.isInteger(levelNo) && levelNo >= 0)
      .sort((left, right) => left - right)
    if (fromSummary.length > 0) return fromSummary
    if (activeTriageLevels.length > 0) return activeTriageLevels

    const fromCounts = Object.keys(dashboard.summary.triageCounts)
      .map((raw) => Number.parseInt(raw, 10))
      .filter((levelNo) => Number.isInteger(levelNo) && levelNo >= 0)
      .sort((left, right) => left - right)
    if (fromCounts.length > 0) return fromCounts

    return [0, 1, 2, 3, 4]
  }, [activeTriageLevels, dashboard.summary.activeTriageLevels, dashboard.summary.triageCounts])
  const triageLevels = useMemo(
    () =>
      statStripActiveLevels.map((levelNo) => ({
        label: `L${levelNo}`,
        value: String(dashboard.summary.triageCounts[String(levelNo)] ?? 0),
        tone: resolveTriageTone(levelNo)
      })),
    [dashboard.summary.triageCounts, statStripActiveLevels]
  )
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(
    initialSelectedPatientId ?? patients[0]?.id
  )
  const [activeSection, setActiveSection] = useState<IgdTriageSection>('quick')
  const [triageForms, setTriageForms] = useState<IgdTriaseLocalForms>({})
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [hydrationTargetPatientId, setHydrationTargetPatientId] = useState<string | undefined>(
    initialSelectedPatientId
  )
  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId)
  const observationByEncounterQuery = useQueryObservationByEncounter(selectedPatient?.encounterId, [
    'igd-triase',
    selectedPatient?.id ?? ''
  ])

  const persistSectionDraft = (
    patientId: string,
    section: IgdTriageSection,
    values: Record<string, string>
  ) => {
    setTriageForms((currentForms) => ({
      ...currentForms,
      [patientId]: {
        ...(currentForms[patientId] ?? {}),
        [section]: { ...values }
      }
    }))
  }

  useEffect(() => {
    if (patients.length === 0) {
      setSelectedPatientId(undefined)
      return
    }

    if (selectedPatientId && patients.some((patient) => patient.id === selectedPatientId)) {
      return
    }

    if (
      initialSelectedPatientId &&
      patients.some((patient) => patient.id === initialSelectedPatientId)
    ) {
      setSelectedPatientId(initialSelectedPatientId)
      return
    }

    setSelectedPatientId(patients[0]?.id)
  }, [initialSelectedPatientId, patients, selectedPatientId])

  useEffect(() => {
    if (!selectedPatient?.id) return
    setHydrationTargetPatientId(selectedPatient.id)
  }, [selectedPatient?.id])

  useEffect(() => {
    if (!selectedPatient?.id) return
    if (hydrationTargetPatientId !== selectedPatient.id) return
    if (observationByEncounterQuery.isLoading) return

    if (observationByEncounterQuery.isError) {
      setHydrationTargetPatientId(undefined)
      return
    }

    const response = observationByEncounterQuery.data as
      | { success?: boolean; result?: unknown }
      | undefined
    const observations = Array.isArray(response?.result)
      ? (response.result as IgdTriaseObservationLike[])
      : []
    const hydratedForms =
      response?.success === false
        ? {}
        : hydrateMatrixSectionFromAssessment(
            formatIgdTriaseFormsFromObservations(observations),
            criteriaMetaById
          )
    const nextHydratedForms = withResolvedTriageLevelFields(hydratedForms, {
      quickLevel: getQuickLevelFromForms(hydratedForms, selectedPatient.triageLevel),
      activeLevels: activeTriageLevels,
      criteriaMetaById
    })

    setTriageForms((currentForms) => {
      const currentPatientForms = currentForms[selectedPatient.id]
      const shouldKeepLocalDraft =
        hasFilledTriageForms(currentPatientForms) && !hasFilledTriageForms(nextHydratedForms)

      if (shouldKeepLocalDraft) return currentForms

      return {
        ...currentForms,
        [selectedPatient.id]: nextHydratedForms
      }
    })
    setHydrationTargetPatientId(undefined)
  }, [
    activeTriageLevels,
    hydrationTargetPatientId,
    observationByEncounterQuery.data,
    observationByEncounterQuery.isError,
    observationByEncounterQuery.isLoading,
    criteriaMetaById,
    selectedPatient?.id,
    selectedPatient?.triageLevel
  ])

  useEffect(() => {
    if (!selectedPatient?.id) return

    setTriageForms((currentForms) => {
      const currentPatientForms = currentForms[selectedPatient.id] ?? {}

      const selectedCriteriaIds =
        criteriaMetaById.size > 0
          ? deriveSelectedMatrixCriteriaIdsFromAssessment({
              criteriaMetaById,
              primerValues: currentPatientForms.primer,
              sekunderValues: currentPatientForms.sekunder
            })
          : []
      const nextMatrixValues = selectedCriteriaIdsToMatrixSectionValues(selectedCriteriaIds)
      const nextPatientForms = withResolvedTriageLevelFields(
        {
          ...currentPatientForms,
          matrix: nextMatrixValues
        },
        {
          quickLevel: getQuickLevelFromForms(currentPatientForms, selectedPatient.triageLevel),
          activeLevels: activeTriageLevels,
          criteriaMetaById
        }
      )

      if (isFormsBySectionEqual(currentPatientForms, nextPatientForms)) {
        return currentForms
      }

      return {
        ...currentForms,
        [selectedPatient.id]: nextPatientForms
      }
    })
  }, [activeTriageLevels, criteriaMetaById, selectedPatient?.id, selectedPatient?.triageLevel])

  useEffect(() => {
    if (!selectedPatient) {
      setFormValues({})
      return
    }
    const currentPatientForms = triageForms[selectedPatient.id]
    if (activeSection === 'utama') {
      setFormValues(buildUtamaViewValues(currentPatientForms))
      return
    }
    setFormValues(currentPatientForms?.[activeSection] ?? {})
  }, [activeSection, selectedPatient?.id, triageForms])

  const handleSectionChange = (nextSection: IgdTriageSection) => {
    if (selectedPatient?.id) {
      if (activeSection === 'utama') {
        setTriageForms((currentForms) => {
          const currentPatientForms = currentForms[selectedPatient.id] ?? {}
          const nextPatientForms = applyUtamaViewValuesToForms(
            currentPatientForms,
            formValues,
            criteriaMetaById
          )
          return {
            ...currentForms,
            [selectedPatient.id]: nextPatientForms
          }
        })
      } else {
        persistSectionDraft(selectedPatient.id, activeSection, formValues)
      }
    }
    const normalizedNextSection = TRIAGE_VISIBLE_SECTIONS.includes(nextSection)
      ? nextSection
      : 'quick'
    setActiveSection(normalizedNextSection)
  }

  const handleFieldChange = (name: string, value: string) => {
    setFormValues((currentValues) => {
      const nextValues = {
        ...currentValues,
        [name]: value
      }

      if (selectedPatient?.id) {
        const patientId = selectedPatient.id
        setTriageForms((currentForms) => {
          const currentPatientForms = currentForms[patientId] ?? {}
          const nextPatientForms =
            activeSection === 'utama'
              ? applyUtamaViewValuesToForms(currentPatientForms, nextValues, criteriaMetaById)
              : {
                  ...currentPatientForms,
                  [activeSection]: { ...nextValues }
                }

          const resolvedQuickLevel = getQuickLevelFromForms(
            nextPatientForms,
            selectedPatient?.triageLevel
          )
          const resolvedPatientForms = withResolvedTriageLevelFields(nextPatientForms, {
            quickLevel: resolvedQuickLevel,
            activeLevels: activeTriageLevels,
            criteriaMetaById
          })

          return {
            ...currentForms,
            [patientId]: resolvedPatientForms
          }
        })
      }

      return nextValues
    })
  }

  const handleSaveTriage = async () => {
    if (!selectedPatient) {
      message.error('Pasien triase belum dipilih')
      return
    }

    const currentPatientForms = triageForms[selectedPatient.id] ?? {}
    const draftWithActiveSection =
      activeSection === 'utama'
        ? applyUtamaViewValuesToForms(currentPatientForms, formValues, criteriaMetaById)
        : {
            ...currentPatientForms,
            [activeSection]: { ...formValues }
          }
    const mergedPatientForms = withResolvedTriageLevelFields(draftWithActiveSection, {
      quickLevel: getQuickLevelFromForms(draftWithActiveSection, selectedPatient.triageLevel),
      activeLevels: activeTriageLevels,
      criteriaMetaById
    })
    const quickValues = mergedPatientForms.quick ?? {}
    const quickCondition = quickValues[QUICK_TRIAGE_FIELD_NAMES.condition]
    const quickLevel = quickValues[QUICK_TRIAGE_FIELD_NAMES.level]
    const quickComplaint = quickValues[QUICK_TRIAGE_FIELD_NAMES.complaint]

    if (!hasNonEmptyText(quickCondition)) {
      message.error('Kondisi Umum wajib diisi sebelum simpan')
      return
    }
    if (!hasNonEmptyText(quickLevel)) {
      message.error('Level Triase Awal wajib diisi sebelum simpan')
      return
    }
    if (!hasNonEmptyText(quickComplaint)) {
      message.error('Keluhan Singkat wajib diisi sebelum simpan')
      return
    }
    if (!hasAnyUtamaClinicalInput(mergedPatientForms)) {
      message.error('Minimal isi 1 data klinis di tab Utama sebelum simpan')
      return
    }

    setTriageForms((currentForms) => ({
      ...currentForms,
      [selectedPatient.id]: {
        ...mergedPatientForms
      }
    }))

    const triageObservationDrafts = buildIgdTriaseObservationDrafts(mergedPatientForms)
    if (triageObservationDrafts.length === 0) {
      message.warning('Belum ada data triase yang bisa disimpan')
      return
    }

    const umumValues = mergedPatientForms.umum ?? {}
    const performerId = (umumValues[TRIAGE_INTERNAL_KEYS.performerId] ?? '').trim()
    const performerName = (umumValues[TRIAGE_INTERNAL_KEYS.performerName] ?? '').trim()
    const assessmentDateRaw = (umumValues[TRIAGE_INTERNAL_KEYS.assessmentDate] ?? '').trim()

    if (!performerId) {
      message.error('Petugas triase wajib dipilih sebelum simpan')
      return
    }

    const assessmentDate = assessmentDateRaw ? new Date(assessmentDateRaw) : new Date()
    const effectiveDate = Number.isNaN(assessmentDate.getTime()) ? new Date() : assessmentDate
    const observations = createObservationBatch(triageObservationDrafts, effectiveDate)

    try {
      await bulkCreateObservation.mutateAsync({
        encounterId: selectedPatient.encounterId,
        patientId: selectedPatient.id,
        observations,
        performerId,
        performerName: performerName || undefined
      })
      setHydrationTargetPatientId(selectedPatient.id)
      await observationByEncounterQuery.refetch()

      message.success('Triase berhasil disimpan ke Observation')
    } catch (error) {
      showApiError(message, error, 'Gagal menyimpan triase')
    }
  }

  const isSaving = bulkCreateObservation.isPending
  const isSubmitDisabled = !selectedPatient || isLoading || !!errorMessage || isSaving
  const selectedPatientDraft = selectedPatient ? triageForms[selectedPatient.id] : undefined
  const triageLevelOverride = useMemo(() => {
    if (!selectedPatient) return undefined
    const finalLevel = parseTriageLevelNumber(
      selectedPatientDraft?.umum?.[TRIAGE_INTERNAL_KEYS.finalLevel]
    )
    if (typeof finalLevel === 'number') return finalLevel
    const quickLevel = parseTriageLevelNumber(selectedPatientDraft?.quick?.quickLevel)
    if (typeof quickLevel === 'number') return quickLevel
    return selectedPatient.triageLevel
  }, [selectedPatient, selectedPatientDraft])

  return (
    <div className="igd-parity-scope flex flex-col gap-4">
      <DesktopPageHeader
        eyebrow="Modul IGD"
        title="Daftar Pasien IGD"
        subtitle="Ringkasan operasional pasien aktif, prioritas triase, dan utilisasi bed instalasi gawat darurat."
        status={isLoading ? 'Memuat data' : isSaving ? 'Menyimpan triase...' : 'Terhubung backend'}
        metadata={
          selectedPatient ? (
            <div className="flex flex-wrap items-center gap-[var(--ds-space-sm)]">
              <DesktopBadge
                tone={getTriageTone(selectedPatient.triageLevel)}
                style={getIgdTriageLevelMeta(selectedPatient.triageLevel).badgeStyle}
              >
                {getIgdTriageLevelMeta(selectedPatient.triageLevel).label}
              </DesktopBadge>
              <DesktopTag tone="accent">{selectedPatient.registrationNumber}</DesktopTag>
              <DesktopTag tone="neutral">{selectedPatient.bedCode ?? 'Tanpa bed'}</DesktopTag>
            </div>
          ) : null
        }
        actions={
          <DesktopButton emphasis="toolbar" onClick={onBack}>
            Kembali ke Daftar
          </DesktopButton>
        }
      />

      <DesktopCompactStatStrip
        totalActive={String(dashboard.summary.totalActive)}
        triageLevels={triageLevels}
        bedAvailable={String(dashboard.summary.bedAvailable)}
        bedTotal={String(dashboard.summary.bedTotal)}
        averageResponse={String(dashboard.summary.averageResponseMinutes)}
        totalToday={String(dashboard.summary.totalToday)}
        statusBadges={[
          { label: 'SATUSEHAT', tone: 'success' },
          { label: 'EMR Aktif', tone: 'accent' }
        ]}
      />

      {isLoading ? (
        <DesktopCard
          title="Memuat dashboard IGD"
          subtitle="Mengambil pasien aktif untuk workspace triase."
        >
          <DesktopNoticePanel
            title="Memuat pasien triase"
            description="Data pasien aktif IGD sedang disinkronkan dari backend."
          />
        </DesktopCard>
      ) : null}

      {!isLoading && errorMessage ? (
        <DesktopCard
          title="Gagal memuat dashboard triase"
          subtitle="Coba muat ulang koneksi ke backend IGD."
        >
          <div className="grid gap-[12px]">
            <DesktopNoticePanel
              title="Gagal memuat dashboard"
              description={errorMessage}
              tone="danger"
            />
            <div>
              <DesktopButton emphasis="primary" onClick={onRetry}>
                Muat Ulang
              </DesktopButton>
            </div>
          </div>
        </DesktopCard>
      ) : null}

      {!isLoading && !errorMessage ? (
        <div className="igd-daftar-grid">
          {selectedPatient ? (
            <IgdTriaseFormCard
              activeSection={activeSection}
              activeTriageLevel={triageLevelOverride}
              formValues={formValues}
              onSectionChange={handleSectionChange}
              onFieldChange={handleFieldChange}
              onSave={handleSaveTriage}
              isSaveDisabled={isSubmitDisabled}
            />
          ) : (
            <DesktopCard
              title="Belum ada pasien aktif"
              subtitle="Tidak ada pasien IGD aktif untuk proses triase."
            >
              <DesktopNoticePanel
                title="Belum ada pasien aktif"
                description="Silakan registrasi pasien IGD terlebih dahulu untuk mulai proses triase."
              />
            </DesktopCard>
          )}

          <IgdPatientInfoPanel
            patient={selectedPatient ?? null}
            triageLevelOverride={triageLevelOverride}
          />
        </div>
      ) : null}
    </div>
  )
}

export default function IgdTriaseRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const dashboardQuery = client.igd.dashboard.useQuery({})
  const locationState = (location.state as IgdTriaseRouteState | null) ?? null
  const selectedPatientIdFromState = locationState?.selectedPatientId?.trim()

  return (
    <IgdTriasePage
      dashboard={dashboardQuery.data ?? EMPTY_IGD_DASHBOARD}
      initialSelectedPatientId={selectedPatientIdFromState}
      isLoading={dashboardQuery.isLoading}
      errorMessage={dashboardQuery.error?.message}
      onRetry={() => {
        void dashboardQuery.refetch()
      }}
      onBack={() => navigate(IGD_PAGE_PATHS.daftar)}
    />
  )
}
