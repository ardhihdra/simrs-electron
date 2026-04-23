/**
 * purpose: Form triase IGD untuk input transportasi/rujukan, ringkasan field Primer/Sekunder berbasis pola anamnesis/vital signs, dan pengkajian pemeriksaan per tab.
 * main callers: `DoctorEmergencyWorkspace` menu `Data Triase`.
 * key dependencies: query observation, query performers, hook master triase IGD, dan builder observation batch.
 * main/public functions: `TriageForm`.
 * side effects: Read observation/master triase, submit observation transportasi/rujukan ke backend, update local state pengkajian pemeriksaan untuk satu submit global; sistem otomatis menghitung plan keputusan Primer/Sekunder dari level pemeriksaan dominan (UI-only, belum dipersist), dan disable opsi pemeriksaan yang sudah dipilih per tab untuk mencegah duplikasi input.
 */
import { SaveOutlined } from '@ant-design/icons'
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Radio,
  Row,
  Select,
  Spin,
  Tabs
} from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import type { PatientData } from '@renderer/types/doctor.types'
import {
  useBulkCreateObservation,
  useQueryObservationByEncounter
} from '@renderer/hooks/query/use-observation'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { TRANSPORTATION_SNOMED_MAP } from '@renderer/config/maps/observation-maps'
import {
  createObservationBatch,
  OBSERVATION_CATEGORIES,
  OBSERVATION_SYSTEMS
} from '@renderer/utils/builders/observation-builder'
import {
  type TriageCriteriaGroupedByGroup,
  useIgdTriageMaster
} from '@renderer/hooks/query/use-igd-triage-master'
import { AssessmentHeader } from '../AssesmentHeader/AssessmentHeader'

interface TriageFormProps {
  encounterId: string
  patientData: PatientData
}

type AssessmentTabKey = 'primer' | 'sekunder'

interface TriageAssessmentOption {
  value: number
  criteriaText: string
  label: string
  levelNo: number
}

interface TriageAssessmentRow {
  id: string
  criteriaId?: number
  pengkajian: string
}

type PrimerPlanZone = 'zona_kuning' | 'zona_hijau'
type SekunderPlanRoom = 'ruang_resusitasi' | 'ruang_kritis'

interface TriageFormValues {
  assessment_date?: dayjs.Dayjs
  performerId?: number
  transportation?: keyof typeof TRANSPORTATION_SNOMED_MAP
  referral_letter?: 'ya' | 'tidak'
  primer?: {
    chiefComplaint?: string
    vitalSigns?: {
      temperature?: string
      painScore?: string
      oxygenSaturation?: string
      respiratoryRate?: string
      bloodPressure?: string
      pulseRate?: string
    }
    specialNeeds?: string
    planZone?: PrimerPlanZone
  }
  sekunder?: {
    shortAnamnesis?: string
    notes?: string
    planRoom?: SekunderPlanRoom
  }
}

const TRIAGE_OBSERVATION_CODES = {
  TRANSPORTATION: '74286-6',
  REFERRAL_LETTER: 'OC000034'
} as const

const GROUP_LABELS: Record<keyof TriageCriteriaGroupedByGroup, string> = {
  airway: 'Airway',
  breathing: 'Breathing',
  circulation: 'Circulation',
  disability_and_other_dysfunction: 'Disability/Disfungsi',
  nyeri: 'Nyeri'
}

const createAssessmentRow = (index: number): TriageAssessmentRow => ({
  id: `triage-assessment-${Date.now()}-${index}`,
  criteriaId: undefined,
  pengkajian: ''
})

const SYSTEM_PRIMER_PLAN: PrimerPlanZone = 'zona_kuning'
const SYSTEM_SEKUNDER_PLAN: SekunderPlanRoom = 'ruang_kritis'
const PRIMER_PLAN_LABELS: Record<PrimerPlanZone, string> = {
  zona_kuning: 'Zona Kuning',
  zona_hijau: 'Zona Hijau'
}
const SEKUNDER_PLAN_LABELS: Record<SekunderPlanRoom, string> = {
  ruang_resusitasi: 'Ruang Resusitasi',
  ruang_kritis: 'Ruang Kritis'
}

const buildAssessmentOptions = (
  levels: Array<{ id: number; levelNo: number; name?: string | null }>,
  criteriaByLevel: Map<number, TriageCriteriaGroupedByGroup>
): TriageAssessmentOption[] => {
  const options: TriageAssessmentOption[] = []

  for (const level of levels) {
    const grouped = criteriaByLevel.get(level.id)
    if (!grouped) continue

    for (const groupKey of Object.keys(GROUP_LABELS) as Array<keyof TriageCriteriaGroupedByGroup>) {
      const rows = grouped[groupKey] ?? []
      for (const row of rows) {
        options.push({
          value: row.id,
          criteriaText: row.criteriaText,
          label: `L${level.levelNo} · ${GROUP_LABELS[groupKey]} · ${row.criteriaText}`,
          levelNo: level.levelNo
        })
      }
    }
  }

  return options
}

export const TriageForm = ({ encounterId, patientData }: TriageFormProps) => {
  const { message } = App.useApp()
  const [form] = Form.useForm<TriageFormValues>()
  const [assessmentTabKey, setAssessmentTabKey] = useState<AssessmentTabKey>('primer')
  const [assessmentRows, setAssessmentRows] = useState<
    Record<AssessmentTabKey, TriageAssessmentRow[]>
  >({
    primer: [createAssessmentRow(0)],
    sekunder: [createAssessmentRow(1)]
  })

  const { data: response, refetch } = useQueryObservationByEncounter(encounterId)
  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers([
    'nurse',
    'doctor'
  ])
  const bulkCreateObservation = useBulkCreateObservation()

  const {
    primerLevels,
    sekunderLevels,
    criteriaByLevel,
    isLoading: isMasterLoading,
    isError: isMasterError,
    error: masterError
  } = useIgdTriageMaster()

  const primerOptions = useMemo(
    () => buildAssessmentOptions(primerLevels, criteriaByLevel),
    [primerLevels, criteriaByLevel]
  )
  const sekunderOptions = useMemo(
    () => buildAssessmentOptions(sekunderLevels, criteriaByLevel),
    [sekunderLevels, criteriaByLevel]
  )

  const primerOptionMap = useMemo(
    () => new Map(primerOptions.map((option) => [option.value, option])),
    [primerOptions]
  )
  const sekunderOptionMap = useMemo(
    () => new Map(sekunderOptions.map((option) => [option.value, option])),
    [sekunderOptions]
  )

  const getDominantLevelNo = (
    rows: TriageAssessmentRow[],
    optionMap: Map<number, TriageAssessmentOption>
  ): number | undefined => {
    const levelCount = new Map<number, number>()

    for (const row of rows) {
      if (typeof row.criteriaId !== 'number') continue
      const levelNo = optionMap.get(row.criteriaId)?.levelNo
      if (typeof levelNo !== 'number') continue
      levelCount.set(levelNo, (levelCount.get(levelNo) ?? 0) + 1)
    }

    let dominantLevelNo: number | undefined
    let highestCount = -1

    for (const [levelNo, count] of levelCount.entries()) {
      const shouldPick =
        count > highestCount ||
        (count === highestCount &&
          (typeof dominantLevelNo !== 'number' || levelNo < dominantLevelNo))
      if (!shouldPick) continue
      dominantLevelNo = levelNo
      highestCount = count
    }

    return dominantLevelNo
  }

  const resolvePrimerPlanZone = (levelNo: number | undefined): PrimerPlanZone => {
    if (levelNo === 2) return 'zona_hijau'
    return 'zona_kuning'
  }

  const resolveSekunderPlanRoom = (levelNo: number | undefined): SekunderPlanRoom => {
    if (levelNo === 3) return 'ruang_resusitasi'
    return 'ruang_kritis'
  }

  const applySystemPlanDecisions = () => {
    const primerDominantLevel = getDominantLevelNo(assessmentRows.primer, primerOptionMap)
    const sekunderDominantLevel = getDominantLevelNo(assessmentRows.sekunder, sekunderOptionMap)

    form.setFieldsValue({
      primer: { planZone: resolvePrimerPlanZone(primerDominantLevel) },
      sekunder: { planRoom: resolveSekunderPlanRoom(sekunderDominantLevel) }
    })
  }

  useEffect(() => {
    applySystemPlanDecisions()
  }, [assessmentRows, primerOptionMap, sekunderOptionMap])

  const primerPlanZone =
    Form.useWatch<PrimerPlanZone | undefined>(['primer', 'planZone'], form) ?? SYSTEM_PRIMER_PLAN
  const sekunderPlanRoom =
    Form.useWatch<SekunderPlanRoom | undefined>(['sekunder', 'planRoom'], form) ??
    SYSTEM_SEKUNDER_PLAN

  useEffect(() => {
    const observations = response?.result
    if (!response?.success || !Array.isArray(observations) || observations.length === 0) return

    const triageObs = observations.filter(
      (obs: any) =>
        obs.category === OBSERVATION_CATEGORIES.SURVEY &&
        Object.values(TRIAGE_OBSERVATION_CODES).includes(obs.code)
    )

    if (triageObs.length === 0) return

    const sorted = [...triageObs].sort(
      (a: any, b: any) =>
        dayjs(b.effectiveDateTime || b.issued || b.createdAt).valueOf() -
        dayjs(a.effectiveDateTime || a.issued || a.createdAt).valueOf()
    )

    const getLatestByCode = (code: string) => sorted.find((obs: any) => obs.code === code)

    const transportation = getLatestByCode(TRIAGE_OBSERVATION_CODES.TRANSPORTATION)
    const referralLetter = getLatestByCode(TRIAGE_OBSERVATION_CODES.REFERRAL_LETTER)

    const fieldsToSet: Record<string, any> = {}

    if (transportation?.valueCodeableConcept?.coding?.[0]?.code) {
      const code = transportation.valueCodeableConcept.coding[0].code
      const keyMatch = Object.entries(TRANSPORTATION_SNOMED_MAP).find(
        ([_, v]) => v.code === code
      )?.[0]
      if (keyMatch) fieldsToSet.transportation = keyMatch
    }

    if (referralLetter !== undefined && referralLetter?.valueBoolean !== undefined) {
      fieldsToSet.referral_letter = referralLetter.valueBoolean ? 'ya' : 'tidak'
    }

    const firstObs = sorted[0] as any
    if (firstObs?.effectiveDateTime) {
      fieldsToSet.assessment_date = dayjs(firstObs.effectiveDateTime)
    }
    if (firstObs?.performers?.[0]?.practitionerId) {
      fieldsToSet.performerId = Number(firstObs.performers[0].practitionerId)
    }

    form.setFieldsValue(fieldsToSet)
  }, [response, form])

  const handleFinish = async (values: TriageFormValues) => {
    if (!encounterId) {
      message.error('Data kunjungan tidak ditemukan')
      return
    }

    try {
      const obsToCreate: any[] = []
      const assessmentDate = values.assessment_date?.toISOString() || dayjs().toISOString()

      if (values.transportation) {
        const snomed = TRANSPORTATION_SNOMED_MAP[values.transportation]
        if (snomed) {
          obsToCreate.push({
            category: OBSERVATION_CATEGORIES.SURVEY,
            code: TRIAGE_OBSERVATION_CODES.TRANSPORTATION,
            display: 'Transport mode to hospital',
            system: OBSERVATION_SYSTEMS.LOINC,
            codeCoding: [
              {
                system: OBSERVATION_SYSTEMS.LOINC,
                code: TRIAGE_OBSERVATION_CODES.TRANSPORTATION,
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
        }
      }

      if (values.referral_letter !== undefined) {
        const isYes = values.referral_letter === 'ya'
        obsToCreate.push({
          category: OBSERVATION_CATEGORIES.SURVEY,
          code: TRIAGE_OBSERVATION_CODES.REFERRAL_LETTER,
          display: 'Surat Pengantar Rujukan',
          system: 'http://terminology.kemkes.go.id/CodeSystem/clinical-term',
          codeCoding: [
            {
              system: 'http://terminology.kemkes.go.id/CodeSystem/clinical-term',
              code: TRIAGE_OBSERVATION_CODES.REFERRAL_LETTER,
              display: 'Surat Pengantar Rujukan'
            }
          ],
          valueBoolean: isYes
        })
      }

      if (obsToCreate.length === 0) {
        message.warning('Tidak ada data triase yang diisi')
        return
      }

      const observations = createObservationBatch(obsToCreate, assessmentDate)
      const performerName =
        performersData?.find((p: any) => p.id === values.performerId)?.name || 'Unknown'

      await bulkCreateObservation.mutateAsync({
        encounterId,
        patientId: patientData.patient.id,
        observations,
        performerId: String(values.performerId),
        performerName
      })

      message.success('Data triase berhasil disimpan')
      refetch()
    } catch (error: any) {
      console.error('Error saving triage data:', error)
      message.error(error?.message || 'Gagal menyimpan data triase')
    }
  }

  const handleReset = () => {
    form.resetFields()
    setAssessmentTabKey('primer')
    applySystemPlanDecisions()
  }

  const updateAssessmentRow = (
    tab: AssessmentTabKey,
    rowId: string,
    key: keyof TriageAssessmentRow,
    value: number | string | undefined
  ) => {
    setAssessmentRows((prev) => ({
      ...prev,
      [tab]: prev[tab].map((row) => {
        if (row.id !== rowId) return row

        if (key === 'criteriaId') {
          const optionMap = tab === 'primer' ? primerOptionMap : sekunderOptionMap
          const option = typeof value === 'number' ? optionMap.get(value) : undefined
          return {
            ...row,
            criteriaId: typeof value === 'number' ? value : undefined,
            pengkajian: row.pengkajian || option?.criteriaText || ''
          }
        }

        return { ...row, [key]: typeof value === 'string' ? value : '' }
      })
    }))
  }

  const addAssessmentRow = (tab: AssessmentTabKey) => {
    setAssessmentRows((prev) => ({
      ...prev,
      [tab]: [...prev[tab], createAssessmentRow(prev[tab].length)]
    }))
  }

  const removeAssessmentRow = (tab: AssessmentTabKey, rowId: string) => {
    setAssessmentRows((prev) => {
      if (prev[tab].length <= 1) return prev
      return {
        ...prev,
        [tab]: prev[tab].filter((row) => row.id !== rowId)
      }
    })
  }

  const renderAssessmentTabContent = (tab: AssessmentTabKey) => {
    const rows = assessmentRows[tab]
    const options = tab === 'primer' ? primerOptions : sekunderOptions
    const selectedCriteriaIds = new Set(
      rows
        .map((row) => row.criteriaId)
        .filter((criteriaId): criteriaId is number => typeof criteriaId === 'number')
    )

    return (
      <div className="flex flex-col gap-4">
        {tab === 'primer' ? (
          <div className="rounded-lg border border-red-100 bg-red-50/30 p-3">
            <Row gutter={[12, 12]}>
              <Col span={24}>
                <Form.Item
                  label="Keluhan Utama"
                  name={['primer', 'chiefComplaint']}
                  className="mb-0"
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Masukkan keluhan utama pasien..."
                    autoSize={{ minRows: 3, maxRows: 5 }}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Vital Signs Inti
                </div>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Form.Item
                  label="Suhu (°C)"
                  name={['primer', 'vitalSigns', 'temperature']}
                  className="mb-0"
                >
                  <Input placeholder="36.5" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Form.Item
                  label="Nyeri (VAS)"
                  name={['primer', 'vitalSigns', 'painScore']}
                  className="mb-0"
                >
                  <Input placeholder="0 - 10" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Form.Item
                  label="Saturasi Oksigen (%)"
                  name={['primer', 'vitalSigns', 'oxygenSaturation']}
                  className="mb-0"
                >
                  <Input placeholder="98" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Form.Item
                  label="Respirasi (/mnt)"
                  name={['primer', 'vitalSigns', 'respiratoryRate']}
                  className="mb-0"
                >
                  <Input placeholder="20" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Form.Item
                  label="Tensi (mmHg)"
                  name={['primer', 'vitalSigns', 'bloodPressure']}
                  className="mb-0"
                >
                  <Input placeholder="120/80" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Form.Item
                  label="Nadi (/mnt)"
                  name={['primer', 'vitalSigns', 'pulseRate']}
                  className="mb-0"
                >
                  <Input placeholder="80" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  label="Kebutuhan Khusus"
                  name={['primer', 'specialNeeds']}
                  className="mb-0"
                >
                  <Input placeholder="Alat bantu, pendamping, kebutuhan khusus lainnya..." />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name={['primer', 'planZone']} hidden>
                  <Input />
                </Form.Item>
                <Form.Item label="Plan Keputusan (Otomatis Sistem)" className="mb-0">
                  <Input value={PRIMER_PLAN_LABELS[primerPlanZone]} readOnly disabled />
                </Form.Item>
              </Col>
            </Row>
          </div>
        ) : (
          <div className="rounded-lg border border-amber-100 bg-amber-50/30 p-3">
            <Row gutter={[12, 12]}>
              <Col span={24}>
                <Form.Item
                  label="Anamnesa Singkat"
                  name={['sekunder', 'shortAnamnesis']}
                  className="mb-0"
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Masukkan anamnesa singkat pasien..."
                    autoSize={{ minRows: 3, maxRows: 5 }}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Catatan" name={['sekunder', 'notes']} className="mb-0">
                  <Input.TextArea
                    rows={3}
                    placeholder="Tambahkan catatan klinis triase sekunder..."
                    autoSize={{ minRows: 3, maxRows: 5 }}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name={['sekunder', 'planRoom']} hidden>
                  <Input />
                </Form.Item>
                <Form.Item label="Plan Keputusan (Otomatis Sistem)" className="mb-0">
                  <Input value={SEKUNDER_PLAN_LABELS[sekunderPlanRoom]} readOnly disabled />
                </Form.Item>
              </Col>
            </Row>
          </div>
        )}

        <Divider className="my-0" />

        <div className="text-sm font-medium text-gray-600">Pemeriksaan + Pengkajian</div>
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <Row gutter={[8, 8]} key={row.id} align="middle">
              <Col xs={24} md={10}>
                <Select
                  className="w-full"
                  value={row.criteriaId}
                  onChange={(value) => updateAssessmentRow(tab, row.id, 'criteriaId', value)}
                  placeholder="Pilih pemeriksaan"
                  options={options.map((option) => ({
                    ...option,
                    disabled: selectedCriteriaIds.has(option.value) && option.value !== row.criteriaId
                  }))}
                  showSearch
                  optionFilterProp="label"
                />
              </Col>
              <Col xs={24} md={12}>
                <Input
                  value={row.pengkajian}
                  onChange={(event) =>
                    updateAssessmentRow(tab, row.id, 'pengkajian', event.target.value)
                  }
                  placeholder="Masukkan pengkajian"
                />
              </Col>
              <Col xs={24} md={2}>
                <Button danger block onClick={() => removeAssessmentRow(tab, row.id)}>
                  Hapus
                </Button>
              </Col>
            </Row>
          ))}
          <div className="flex justify-start gap-2">
            <Button onClick={() => addAssessmentRow(tab)}>Tambah Pemeriksaan</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex! flex-col! gap-4!">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="flex! flex-col! gap-4!"
        initialValues={{
          assessment_date: dayjs(),
          primer: { planZone: SYSTEM_PRIMER_PLAN },
          sekunder: { planRoom: SYSTEM_SEKUNDER_PLAN }
        }}
      >
        <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />
        <Card title="Sarana Transportasi Kedatangan">
          <Form.Item
            label="Transportasi yang Digunakan"
            name="transportation"
            rules={[{ required: true, message: 'Pilih sarana transportasi' }]}
          >
            <Radio.Group className="flex flex-col gap-2">
              {Object.keys(TRANSPORTATION_SNOMED_MAP).map((key) => (
                <Radio key={key} value={key}>
                  {key}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
        </Card>

        <Card title="Surat Pengantar Rujukan">
          <Form.Item
            label="Apakah pasien membawa surat pengantar rujukan?"
            name="referral_letter"
            rules={[{ required: true, message: 'Pilih salah satu' }]}
          >
            <Radio.Group>
              <Radio value="ya">
                <span className="font-medium">Ya</span>
                <span className="text-gray-400 ml-2 text-sm">
                  (Pasien datang dengan surat rujukan)
                </span>
              </Radio>
              <Radio value="tidak">
                <span className="font-medium">Tidak</span>
                <span className="text-gray-400 ml-2 text-sm">(Pasien tanpa surat rujukan)</span>
              </Radio>
            </Radio.Group>
          </Form.Item>
        </Card>

        <Card title="Pengkajian Triase Primer & Sekunder">
          {isMasterLoading ? (
            <div className="min-h-[120px] flex items-center justify-center">
              <Spin />
            </div>
          ) : isMasterError ? (
            <Alert
              type="warning"
              showIcon
              message="Master triase belum tersedia"
              description={
                masterError instanceof Error ? masterError.message : 'Gagal memuat master triase'
              }
            />
          ) : (
            <Tabs
              activeKey={assessmentTabKey}
              onChange={(key) => setAssessmentTabKey(key as AssessmentTabKey)}
              items={[
                {
                  key: 'primer',
                  label: 'Primer',
                  children: renderAssessmentTabContent('primer')
                },
                {
                  key: 'sekunder',
                  label: 'Sekunder',
                  children: renderAssessmentTabContent('sekunder')
                }
              ]}
            />
          )}
        </Card>

        <Form.Item>
          <div className="flex justify-end gap-2">
            <Button size="large" onClick={handleReset}>
              Reset
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              loading={bulkCreateObservation.isPending}
              onClick={() => form.submit()}
            >
              Simpan Data Triase
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  )
}
