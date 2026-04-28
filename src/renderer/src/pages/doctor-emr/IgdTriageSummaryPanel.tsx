/**
 * purpose: Panel read-only ringkasan triase IGD di workspace dokter berdasarkan snapshot Observation triase terbaru per encounter.
 * main callers: `DoctorEmergencyWorkspace` tab `Data Triase`.
 * key dependencies: `useQueryObservationByEncounter`, `useIgdTriageMaster`, formatter `formatIgdTriaseFormsFromObservations`, util key triase `QUICK_TRIAGE_FIELD_NAMES`, dan util sinkronisasi matrix triase.
 * main/public functions: `IgdTriageSummaryPanel`.
 * side effects: Query data Observation backend (read-only) dan render state loading/empty/error lokal.
 */
import { Alert, Button, Card, Col, Descriptions, Empty, Row, Skeleton, Space, Tag, Typography } from 'antd'
import React, { useMemo } from 'react'

import { useQueryObservationByEncounter } from '../../hooks/query/use-observation'
import { useIgdTriageMaster } from '../../hooks/query/use-igd-triage-master'
import { QUICK_TRIAGE_FIELD_NAMES } from '../igd/igd-triase-form-state'
import {
  formatIgdTriaseFormsFromObservations,
  type IgdTriaseObservationLike
} from '../igd/igd-triage-observation-formatter'
import { type IgdTriaseFormBySection } from '../igd/igd-triage-observation'
import {
  buildMatrixCriteriaMetaById,
  deriveSelectedMatrixCriteriaIdsFromAssessment,
  MATRIX_GROUP_LABELS,
  MATRIX_GROUPS,
  readSelectedMatrixCriteriaIds
} from '../igd/igd-triage-matrix-sync'

type IgdTriageSummaryPanelProps = {
  encounterId: string
  patientData?: unknown
}

type TriageLevelMeta = {
  label: string
  name: string
  color: string
}

const TRIAGE_LEVEL_META: Record<number, TriageLevelMeta> = {
  0: { label: 'L0', name: 'Meninggal', color: 'default' },
  1: { label: 'L1', name: 'Kritis', color: 'red' },
  2: { label: 'L2', name: 'Urgent', color: 'orange' },
  3: { label: 'L3', name: 'Semi Urgent', color: 'green' },
  4: { label: 'L4', name: 'Tidak Urgent', color: 'default' }
}

const toSafeText = (value: string | undefined): string => (value ?? '').trim() || '—'

const parseLevel = (rawValue: string | undefined): number | undefined => {
  const parsed = Number.parseInt((rawValue ?? '').trim(), 10)
  if (!Number.isInteger(parsed) || parsed < 0) return undefined
  return parsed
}

const hasAnyTriageValue = (forms: IgdTriaseFormBySection): boolean =>
  (Object.keys(forms) as Array<keyof IgdTriaseFormBySection>).some((section) =>
    Object.entries(forms[section] ?? {}).some(([fieldName, fieldValue]) => {
      if (fieldName.startsWith('__')) return false
      return (fieldValue ?? '').trim().length > 0
    })
  )

const resolveLevelView = (forms: IgdTriaseFormBySection) => {
  const finalLevel = parseLevel(forms.umum?.__finalLevel)
  const quickLevel = parseLevel(forms.quick?.quickLevel)
  const levelNo = finalLevel ?? quickLevel
  if (typeof levelNo !== 'number') {
    return {
      levelNo: null as number | null,
      tagColor: 'default' as const,
      label: 'Belum ditentukan',
      description: 'Level triase final belum tersedia'
    }
  }
  const meta = TRIAGE_LEVEL_META[levelNo]
  if (meta) {
    return {
      levelNo,
      tagColor: meta.color,
      label: meta.label,
      description: meta.name
    }
  }

  return {
    levelNo,
    tagColor: 'default' as const,
    label: `L${levelNo}`,
    description: 'Level Dinamis'
  }
}

const getMatrixLevelPalette = (level: { levelNo: number; color?: string | null }) => {
  const normalizedColor = (level.color ?? '').toLowerCase().trim()
  if (level.levelNo === 0 || normalizedColor === 'hitam' || normalizedColor === 'black') {
    return {
      background: '#1F2937',
      borderColor: '#030712',
      textColor: '#F9FAFB'
    }
  }
  if (level.levelNo === 1 || normalizedColor === 'merah' || normalizedColor === 'red') {
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

const getFinalLevelBannerPalette = (levelNo?: number | null) => {
  if (levelNo === 0) {
    return {
      background: '#111827',
      borderColor: '#030712',
      textColor: '#F9FAFB'
    }
  }
  if (levelNo === 1) {
    return {
      background: '#FEE2E2',
      borderColor: '#DC2626',
      textColor: '#7F1D1D'
    }
  }
  if (levelNo === 2) {
    return {
      background: '#FFEDD5',
      borderColor: '#EA580C',
      textColor: '#9A3412'
    }
  }
  if (levelNo === 3) {
    return {
      background: '#FEF3C7',
      borderColor: '#CA8A04',
      textColor: '#713F12'
    }
  }
  if (levelNo === 4) {
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

export function IgdTriageSummaryPanel({ encounterId }: IgdTriageSummaryPanelProps) {
  const observationQuery = useQueryObservationByEncounter(encounterId, ['doctor-emergency-triage-summary'])
  const triageMaster = useIgdTriageMaster()
  const sortedLevels = useMemo(
    () => [...triageMaster.levels].sort((left, right) => left.levelNo - right.levelNo),
    [triageMaster.levels]
  )
  const criteriaMetaById = useMemo(
    () => buildMatrixCriteriaMetaById(triageMaster.criteria, sortedLevels),
    [triageMaster.criteria, sortedLevels]
  )
  const hasAnyMatrixCriteria = triageMaster.criteria.length > 0

  const queryData = observationQuery.data as
    | { success?: boolean; result?: unknown; error?: string; message?: string }
    | undefined
  const observationRows = Array.isArray(queryData?.result)
    ? (queryData.result as IgdTriaseObservationLike[])
    : []

  const triageForms = useMemo(
    () => formatIgdTriaseFormsFromObservations(observationRows),
    [observationRows]
  )
  const hasTriageData = useMemo(() => hasAnyTriageValue(triageForms), [triageForms])
  const levelView = useMemo(() => resolveLevelView(triageForms), [triageForms])
  const matrixSelectedCriteriaIds = useMemo(() => {
    const fromMatrixSection = readSelectedMatrixCriteriaIds(triageForms.matrix)
    if (fromMatrixSection.length > 0) return fromMatrixSection
    return deriveSelectedMatrixCriteriaIdsFromAssessment({
      criteriaMetaById,
      primerValues: triageForms.primer,
      sekunderValues: triageForms.sekunder
    })
  }, [criteriaMetaById, triageForms.matrix, triageForms.primer, triageForms.sekunder])
  const matrixSelectedIdSet = useMemo(
    () => new Set(matrixSelectedCriteriaIds),
    [matrixSelectedCriteriaIds]
  )
  const matrixLevelNoByCriteriaId = useMemo(() => {
    const levelMap = new Map<number, number>()
    for (const meta of criteriaMetaById.values()) {
      levelMap.set(meta.id, meta.levelNo)
    }
    return levelMap
  }, [criteriaMetaById])
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
      if (
        count > maxCount ||
        (count === maxCount && (selectedLevelNo === null || levelNo < selectedLevelNo))
      ) {
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
  const finalMatrixLevelView = useMemo(() => {
    const levelNo = matrixDerivedLevel?.levelNo ?? levelView.levelNo
    if (typeof levelNo !== 'number') return null
    const level = sortedLevels.find((item) => item.levelNo === levelNo)
    const label = level?.label ?? level?.name ?? `Kategori ${levelNo}`
    const color = (level?.color ?? '').replaceAll('_', ' ').trim()
    const fallbackColorName =
      levelNo === 0
        ? 'Hitam'
        : levelNo === 1
          ? 'Merah'
          : levelNo === 2
            ? 'Kuning'
            : levelNo === 3
              ? 'Hijau'
              : levelNo === 4
                ? 'Putih'
                : 'Netral'
    return {
      levelNo,
      label,
      color: color || fallbackColorName
    }
  }, [levelView.levelNo, matrixDerivedLevel?.levelNo, sortedLevels])
  const finalMatrixLevelPalette = useMemo(
    () => getFinalLevelBannerPalette(finalMatrixLevelView?.levelNo),
    [finalMatrixLevelView?.levelNo]
  )

  if (observationQuery.isLoading) {
    return (
      <Card title="Ringkasan Triase IGD">
        <Skeleton active paragraph={{ rows: 6 }} title />
      </Card>
    )
  }

  if (observationQuery.isError || queryData?.success === false) {
    return (
      <Card title="Ringkasan Triase IGD">
        <Space direction="vertical" size={12} className="w-full">
          <Alert
            type="error"
            showIcon
            message="Gagal memuat data triase IGD"
            description={queryData?.error || queryData?.message || 'Terjadi kesalahan saat membaca data triase.'}
          />
          <div>
            <Button onClick={() => void observationQuery.refetch()}>Muat Ulang</Button>
          </div>
        </Space>
      </Card>
    )
  }

  if (!hasTriageData) {
    return (
      <Card title="Ringkasan Triase IGD">
        <Empty description="Data triase belum tersedia" />
      </Card>
    )
  }

  return (
    <Space direction="vertical" size={12} className="w-full">
      <Card title="Ringkasan Triase IGD">
        <Space direction="vertical" size={8} className="w-full">
          <Typography.Text type="secondary">Level Triase Final</Typography.Text>
          <div className="flex items-center gap-2">
            <Tag color={levelView.tagColor} className="px-2 py-[2px] text-sm font-semibold">
              {levelView.label}
            </Tag>
            <Typography.Text strong>{levelView.description}</Typography.Text>
          </div>
        </Space>
      </Card>

      <Card title="Triase Cepat">
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Kondisi Umum">
            {toSafeText(triageForms.quick?.[QUICK_TRIAGE_FIELD_NAMES.condition])}
          </Descriptions.Item>
          <Descriptions.Item label="Level Triase Awal">
            {toSafeText(triageForms.quick?.[QUICK_TRIAGE_FIELD_NAMES.level])}
          </Descriptions.Item>
          <Descriptions.Item label="Keluhan Singkat">
            {toSafeText(triageForms.quick?.[QUICK_TRIAGE_FIELD_NAMES.complaint])}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Informasi Klinis Utama">
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Keluhan Utama">
            {toSafeText(triageForms.primer?.chiefComplaint)}
          </Descriptions.Item>
          <Descriptions.Item label="Anamnesa Singkat">
            {toSafeText(triageForms.sekunder?.shortAnamnesis)}
          </Descriptions.Item>
          <Descriptions.Item label="Kebutuhan Khusus">
            {toSafeText(triageForms.umum?.specialNeeds)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Vital Sign + Kesadaran">
        <Row gutter={[12, 12]}>
          <Col span={8}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Tensi">{toSafeText(triageForms.umum?.bloodPressure)}</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={8}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Nadi">{toSafeText(triageForms.umum?.pulseRate)}</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={8}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="RR">{toSafeText(triageForms.umum?.respiratoryRate)}</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={8}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="SpO₂">{toSafeText(triageForms.umum?.oxygenSaturation)}</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={8}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Suhu">{toSafeText(triageForms.umum?.temperature)}</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={8}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Skor Nyeri">{toSafeText(triageForms.umum?.painScore)}</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={24}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Kesadaran">{toSafeText(triageForms.umum?.consciousness)}</Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      <Card title="Pemeriksaan + Pengkajian">
        {triageMaster.isLoading ? (
          <Alert
            type="warning"
            showIcon
            message="Memuat master triase..."
            description="Daftar checkbox kriteria per level sedang disiapkan."
          />
        ) : null}

        {triageMaster.isError ? (
          <Alert
            type="error"
            showIcon
            message="Gagal memuat master triase"
            description={
              triageMaster.error instanceof Error
                ? triageMaster.error.message
                : 'Terjadi kesalahan query master triase.'
            }
          />
        ) : null}

        {!triageMaster.isLoading && !triageMaster.isError ? (
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
                            key={`summary-matrix-level-${level.id}`}
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
                      <tr key={`summary-matrix-group-${group}`}>
                        <td className="align-top border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-sm)] py-[var(--ds-space-sm)] text-[length:var(--ds-font-size-body)] font-medium">
                          {MATRIX_GROUP_LABELS[group]}
                        </td>
                        {sortedLevels.map((level) => {
                          const rows = [...(triageMaster.criteriaByLevel.get(level.id)?.[group] ?? [])].sort(
                            (left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0)
                          )
                          const palette = getMatrixLevelPalette(level)

                          return (
                            <td
                              key={`summary-matrix-cell-${group}-${level.id}`}
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
                                  {rows.map((row) => (
                                    <label
                                      key={`summary-matrix-check-${row.id}`}
                                      className="flex items-start gap-[6px] text-[11px]"
                                      style={{ color: palette.textColor }}
                                    >
                                      <input
                                        type="checkbox"
                                        className="mt-[2px] h-4 w-4"
                                        style={{ accentColor: palette.textColor }}
                                        checked={matrixSelectedIdSet.has(row.id)}
                                        readOnly
                                        disabled
                                      />
                                      <span>{row.criteriaText}</span>
                                    </label>
                                  ))}
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
                className="mt-[var(--ds-space-sm)] rounded-[var(--ds-radius-md)] border px-[var(--ds-space-md)] py-[var(--ds-space-sm)]"
                style={{
                  background: finalMatrixLevelPalette.background,
                  borderColor: finalMatrixLevelPalette.borderColor
                }}
              >
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.07em]"
                  style={{ color: finalMatrixLevelPalette.textColor }}
                >
                  Level Triase Final
                </div>
                {finalMatrixLevelView ? (
                  <div className="mt-[4px] flex items-center gap-[8px]">
                    <span
                      className="inline-flex rounded-[var(--ds-radius-sm)] border px-[8px] py-[3px] text-[11px] font-semibold"
                      style={{
                        borderColor: finalMatrixLevelPalette.borderColor,
                        background: finalMatrixLevelPalette.background,
                        color: finalMatrixLevelPalette.textColor
                      }}
                    >
                      L{finalMatrixLevelView.levelNo}
                    </span>
                    <b style={{ color: finalMatrixLevelPalette.textColor }}>
                      {finalMatrixLevelView.label} · {finalMatrixLevelView.color}
                    </b>
                  </div>
                ) : (
                  <div className="mt-[4px] text-[12px] text-[var(--ds-color-text-muted)]">
                    Belum ada checkbox dipilih.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Alert
              type="warning"
              showIcon
              message="Belum ada kriteria aktif"
              description="Master kriteria triase belum tersedia untuk ditampilkan pada tabel checkbox."
            />
          )
        ) : null}
      </Card>
    </Space>
  )
}
