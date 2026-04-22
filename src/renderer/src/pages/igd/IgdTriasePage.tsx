import { DesktopBadge, type DesktopBadgeTone } from '../../components/design-system/atoms/DesktopBadge'
import { DesktopButton } from '../../components/design-system/atoms/DesktopButton'
import { DesktopTag } from '../../components/design-system/atoms/DesktopTag'
import { DesktopCard } from '../../components/design-system/molecules/DesktopCard'
import { DesktopInputField } from '../../components/design-system/molecules/DesktopInputField'
import { DesktopSegmentedControl } from '../../components/design-system/molecules/DesktopSegmentedControl'
import { DesktopPageHeader } from '../../components/design-system/organisms/DesktopPageHeader'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import { IGD_PAGE_PATHS } from './igd.config'
import { type IgdPatient, type IgdTriageSection, useIgdStore } from './igd.state'

type IgdTriasePageProps = {
  onBack?: () => void
}

const TRIAGE_SECTION_FIELDS: Record<IgdTriageSection, Array<{ name: string; label: string; rows?: number }>> = {
  quick: [
    { name: 'chiefComplaint', label: 'Keluhan Ringkas' },
    { name: 'consciousness', label: 'Kesadaran' },
    { name: 'perfusion', label: 'Perfusi' }
  ],
  umum: [
    { name: 'allergy', label: 'Alergi' },
    { name: 'arrivalMode', label: 'Moda Kedatangan' },
    { name: 'painScale', label: 'Skala Nyeri' }
  ],
  primer: [
    { name: 'airway', label: 'Airway' },
    { name: 'breathing', label: 'Breathing' },
    { name: 'circulation', label: 'Circulation' }
  ],
  sekunder: [
    { name: 'anamnesis', label: 'Anamnesis Singkat', rows: 4 },
    { name: 'vitalSigns', label: 'Vital Sign', rows: 4 },
    { name: 'specialNeeds', label: 'Kebutuhan Khusus', rows: 4 }
  ]
}

const TRIAGE_SECTION_LABELS: Record<IgdTriageSection, string> = {
  quick: 'Triase Cepat',
  umum: 'Info Umum',
  primer: 'Primer',
  sekunder: 'Sekunder'
}

const getTriageTone = (level: IgdPatient['triageLevel']): DesktopBadgeTone => {
  if (level === 1) return 'danger'
  if (level === 2) return 'warning'
  if (level === 3) return 'info'
  return 'success'
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
        <DesktopBadge tone={getTriageTone(patient.triageLevel)}>L{patient.triageLevel}</DesktopBadge>
      </div>
    </button>
  )
}

export function IgdTriasePage({ onBack }: IgdTriasePageProps) {
  const patients = useIgdStore((state) => state.patients)
  const selectedPatientId = useIgdStore((state) => state.selectedPatientId)
  const setSelectedPatient = useIgdStore((state) => state.setSelectedPatient)
  const activeSection = useIgdStore((state) => state.activeTriageSection)
  const setActiveSection = useIgdStore((state) => state.setActiveTriageSection)
  const triageForms = useIgdStore((state) => state.triageForms)
  const saveTriage = useIgdStore((state) => state.saveTriage)
  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId) ?? patients[0]
  const [formValues, setFormValues] = useState<Record<string, string>>({})

  useEffect(() => {
    setFormValues(triageForms[selectedPatient?.id]?.[activeSection] ?? {})
  }, [activeSection, selectedPatient?.id, triageForms])

  return (
    <div className="flex flex-col gap-[var(--ds-layout-section-gap)]">
      <DesktopPageHeader
        eyebrow="Modul IGD"
        title="Triase IGD"
        subtitle="Dokumentasi cepat prioritas klinis, assessment primer, dan catatan sekunder pasien aktif."
        status="Mock aktif"
        metadata={
          selectedPatient ? (
            <div className="flex flex-wrap items-center gap-[var(--ds-space-sm)]">
              <DesktopBadge tone={getTriageTone(selectedPatient.triageLevel)}>
                Level {selectedPatient.triageLevel}
              </DesktopBadge>
              <DesktopTag tone="accent">{selectedPatient.registrationNumber}</DesktopTag>
              <DesktopTag tone="neutral">{selectedPatient.bedCode ?? 'Tanpa bed'}</DesktopTag>
            </div>
          ) : null
        }
        actions={
          <>
            <DesktopButton emphasis="toolbar" onClick={onBack}>
              Kembali ke Daftar
            </DesktopButton>
            <DesktopButton
              emphasis="primary"
              onClick={() => {
                if (!selectedPatient) return
                saveTriage({
                  patientId: selectedPatient.id,
                  section: activeSection,
                  values: formValues
                })
              }}
            >
              Simpan Triase
            </DesktopButton>
          </>
        }
      />

      <div className="grid gap-[var(--ds-space-md)] xl:grid-cols-[0.82fr_1.18fr]">
        <div className="flex flex-col gap-[var(--ds-space-md)]">
          <DesktopCard title="Pasien Aktif" subtitle="Pilih pasien yang akan ditriase lebih dulu.">
            <div className="grid gap-[var(--ds-space-sm)]">
              {patients.map((patient) => (
                <PatientSelector
                  key={patient.id}
                  patient={patient}
                  active={patient.id === selectedPatient?.id}
                  onSelect={() => setSelectedPatient(patient.id)}
                />
              ))}
            </div>
          </DesktopCard>

          <DesktopCard
            title="Snapshot Klinis"
            subtitle="Keluhan utama dan konteks kedatangan pasien yang sedang aktif."
          >
            {selectedPatient ? (
              <div className="grid gap-[var(--ds-space-sm)]">
                <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-md)] py-[var(--ds-space-sm)] text-[length:var(--ds-font-size-body)] text-[var(--ds-color-text)]">
                  {selectedPatient.complaint}
                </div>
                <div className="flex flex-wrap gap-[var(--ds-space-sm)]">
                  <DesktopTag tone="accent">{selectedPatient.arrivalSource}</DesktopTag>
                  <DesktopTag tone="neutral">{selectedPatient.ageLabel}</DesktopTag>
                  <DesktopTag tone="neutral">{selectedPatient.paymentLabel}</DesktopTag>
                </div>
              </div>
            ) : null}
          </DesktopCard>
        </div>

        <DesktopCard
          title="Form Triase"
          subtitle="Bagian form berubah sesuai section aktif dan disimpan per pasien pada mock store lokal."
        >
          <div className="grid gap-[var(--ds-space-md)]">
            <DesktopSegmentedControl
              value={activeSection}
              options={(Object.keys(TRIAGE_SECTION_LABELS) as IgdTriageSection[]).map((section) => ({
                label: TRIAGE_SECTION_LABELS[section],
                value: section
              }))}
              onChange={(value) => setActiveSection(value as IgdTriageSection)}
            />

            <div className="grid gap-[var(--ds-space-md)] md:grid-cols-2">
              {TRIAGE_SECTION_FIELDS[activeSection].map((field) => (
                <DesktopInputField
                  key={field.name}
                  label={field.label}
                  type="textarea"
                  rows={field.rows ?? 3}
                  placeholder={`Isi ${field.label.toLowerCase()}`}
                  value={formValues[field.name] ?? ''}
                  onChange={(value) =>
                    setFormValues((currentValues) => ({
                      ...currentValues,
                      [field.name]: value
                    }))
                  }
                />
              ))}
            </div>

            <div className="flex justify-end">
              <DesktopButton
                emphasis="primary"
                onClick={() => {
                  if (!selectedPatient) return
                  saveTriage({
                    patientId: selectedPatient.id,
                    section: activeSection,
                    values: formValues
                  })
                }}
              >
                Simpan Triase
              </DesktopButton>
            </div>
          </div>
        </DesktopCard>
      </div>
    </div>
  )
}

export default function IgdTriaseRoute() {
  const navigate = useNavigate()

  return <IgdTriasePage onBack={() => navigate(IGD_PAGE_PATHS.daftar)} />
}
