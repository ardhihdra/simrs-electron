/**
 * purpose: Render inpatient CPPT panel with mockup-parity layout (sidebar clinical snapshot + CPPT timeline/table + inline input form).
 * main callers: Rawat inap workspace that needs CPPT-specific panel while preserving existing CPPT workflow.
 * key dependencies: composition/observation/condition/allergy/medication hooks, performer/profile hooks, and composition status maps.
 * main/public functions: `CPPTInpatientEntryPanel`.
 * important side effects: reads clinical data by encounter and writes/upserts CPPT composition entries.
 */
import { useMemo, useState } from 'react'
import {
  App,
  Button,
  Card,
  Divider,
  Form,
  Input,
  Select,
  Spin,
  Typography,
  theme
} from 'antd'
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  HeartOutlined,
  LeftOutlined,
  MedicineBoxOutlined,
  PlusOutlined,
  RightOutlined,
  TableOutlined,
  UnorderedListOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import type { CompositionSection, CompositionStatus } from 'simrs-types'
import { useAllergyByEncounter } from '@renderer/hooks/query/use-allergy'
import {
  CompositionEncounterItem,
  CompositionUpsertPayload,
  useCompositionByEncounter,
  useUpsertComposition
} from '@renderer/hooks/query/use-composition'
import { useConditionByEncounter } from '@renderer/hooks/query/use-condition'
import { useMedicationRequestByEncounter } from '@renderer/hooks/query/use-medication-request'
import { useQueryObservationByEncounter } from '@renderer/hooks/query/use-observation'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { useMyProfile } from '@renderer/hooks/useProfile'
import { formatObservationSummary } from '@renderer/utils/formatters/observation-formatter'
import { PatientWithMedicalRecord } from '@renderer/types/doctor.types'
import { desktopThemeTokens } from '@renderer/components/design-system/foundation/desktop-theme'
import '../Dental/styles.css'

const { Text } = Typography
const { TextArea } = Input
const ds = desktopThemeTokens

interface CPPTInpatientEntryPanelProps {
  encounterId: string
  patientData: PatientWithMedicalRecord
  onSaveSuccess?: () => void
}

interface CPPTFormValues {
  id?: string | number
  performerId?: number
  status?: CompositionStatus
  soapSubjective?: string
  soapObjective?: string
  soapAssessment?: string
  soapPlan?: string
  assessment_date?: Dayjs
}

type CPPTCompositionRecord = CompositionEncounterItem & {
  authorName?: string | null
  role?: string | null
  sections?: CompositionSection[] | null
}

type CPPTRoleTone = 'doctor' | 'nurse' | 'nutrition' | 'rehab' | 'neutral'

const resolveRoleTone = (role?: string | null): CPPTRoleTone => {
  const normalized = String(role || '').toLowerCase()
  if (normalized.includes('dokter') || normalized.includes('doctor')) return 'doctor'
  if (normalized.includes('perawat') || normalized.includes('nurse')) return 'nurse'
  if (normalized.includes('gizi') || normalized.includes('nutrition')) return 'nutrition'
  if (normalized.includes('rehab')) return 'rehab'
  return 'neutral'
}

const toneColorMap = (token: ReturnType<typeof theme.useToken>['token']) => ({
  doctor: token.colorPrimary,
  nurse: token.colorSuccess,
  nutrition: token.colorWarning,
  rehab: token.colorError,
  neutral: token.colorTextSecondary
})

const parseVitalsTag = (text?: string | null): { chips: string[]; remainingText: string } => {
  const safe = String(text || '')
  const match = safe.match(/\[TTV\](.*?)\[\/TTV\]/s)
  if (!match) return { chips: [], remainingText: safe }

  const chips = String(match[1])
    .split('|')
    .map((entry) => entry.trim())
    .filter(Boolean)
  const remainingText = safe.replace(/\[TTV\](.*?)\[\/TTV\]/s, '').trim()
  return { chips, remainingText }
}

const formatInpatientInfoRows = (patientData: PatientWithMedicalRecord) => {
  const encounter = (patientData as any)?.encounter || {}
  const roomName =
    encounter?.inpatientInfo?.roomName ||
    encounter?.wardName ||
    patientData?.poli?.name ||
    (patientData as any)?.serviceType ||
    '-'
  const bedName = encounter?.inpatientInfo?.bedName || encounter?.bedName || '-'
  const kelasRawat =
    patientData?.kelasTarif || encounter?.kelasTarif || encounter?.kelasRawatDisplay || '-'
  const admissionDate =
    patientData?.registrationDate || encounter?.period?.start || encounter?.startTime || null
  const admissionDateLabel = admissionDate ? dayjs(admissionDate).format('DD MMM YYYY') : '-'
  const losDays = admissionDate ? Math.max(dayjs().diff(dayjs(admissionDate), 'day'), 0) : null
  const dpjpName =
    patientData?.doctor?.name ||
    (patientData as any)?.doctorName ||
    encounter?.inpatientInfo?.dpjpName ||
    encounter?.dpjpName ||
    '-'
  const sepNumber = encounter?.sep?.noSep || '-'
  const paymentMethod = patientData?.paymentMethod || encounter?.paymentMethod || '-'

  return [
    { label: 'Kamar', value: `${roomName}${bedName && bedName !== '-' ? ` / ${bedName}` : ''}` },
    { label: 'Kelas', value: kelasRawat },
    { label: 'Masuk', value: admissionDateLabel },
    { label: 'LOS', value: losDays === null ? '-' : `${losDays} hari` },
    { label: 'DPJP', value: dpjpName },
    { label: 'Penjamin', value: paymentMethod },
    { label: 'SEP', value: sepNumber }
  ]
}

const resolveMedicationName = (record: any): string => {
  const itemName = record?.item?.nama ? String(record.item.nama) : ''
  if (itemName) return itemName

  const note = String(record?.note || '')
  const racikanMatch = note.match(/^\[Racikan:([^\]]+)\]/)
  if (racikanMatch?.[1]) return `Racikan: ${racikanMatch[1].trim()}`

  return `Item ${record?.itemId || '-'}`
}

const resolveMedicationRegimen = (record: any): string => {
  const dosage = Array.isArray(record?.dosageInstruction)
    ? String(record.dosageInstruction?.[0]?.text || '')
    : ''
  if (dosage) return dosage

  const qty = record?.dispenseRequest?.quantity
  if (qty?.value) return `${qty.value} ${qty?.unit || ''}`.trim()
  return '-'
}

const CPPTTimelineEntry = ({
  record,
  isOpen,
  onToggle,
  token
}: {
  record: CPPTCompositionRecord
  isOpen: boolean
  onToggle: () => void
  token: ReturnType<typeof theme.useToken>['token']
}) => {
  const tone = resolveRoleTone(record.author?.hakAkses?.nama || record.role)
  const colors = toneColorMap(token)
  const color = colors[tone]
  const { remainingText: objectiveText } = parseVitalsTag(record.soapObjective || '')
  const shortAssessment =
    String(record.soapAssessment || '').length > 90
      ? `${String(record.soapAssessment || '').slice(0, 90)}…`
      : String(record.soapAssessment || '-')
  const timestamp = dayjs(record.date)
    .format('DD MMM YYYY · HH:mm')
    .replace(` ${dayjs().format('YYYY')}`, '')

  return (
    <div className="ri-cppt-timeline-entry">
      <div className="ri-cppt-timeline-entry-left">
        <div
          className="ri-cppt-timeline-avatar"
          style={{ background: color }}
        >
          {String(record.author?.hakAkses?.nama || record.role || 'P')
            .slice(0, 1)
            .toUpperCase()}
        </div>
        <div className="ri-cppt-timeline-track" style={{ background: token.colorBorderSecondary }} />
      </div>

      <div className="ri-cppt-timeline-content" style={{ paddingBottom: isOpen ? 20 : 10 }}>
        <div
          className="ri-cppt-timeline-head"
          style={{ marginBottom: isOpen ? ds.spacing.xs : 0 }}
          onClick={onToggle}
        >
          <Text strong style={{ color }} className="ri-cppt-timeline-role">
            {record.author?.hakAkses?.nama || record.role || 'PPA'}
          </Text>
          <Text className="ri-cppt-timeline-author" type="secondary">
            {record.author?.namaLengkap || record.authorName || '-'}
          </Text>
          <Text className="ri-cppt-timeline-time" type="secondary">
            {timestamp}
          </Text>
          <RightOutlined rotate={isOpen ? 90 : 0} style={{ fontSize: 13 }} />
        </div>

        {!isOpen && (
          <div className="ri-cppt-timeline-preview" style={{ color: token.colorTextTertiary }}>
            <span className="ri-cppt-timeline-preview-label" style={{ color: token.colorWarning }}>
              A
            </span>
            {shortAssessment}
          </div>
        )}

        {isOpen && (
          <div
            className="ri-cppt-timeline-soap"
            style={{
              border: `1px solid ${token.colorBorderSecondary}`,
              background: token.colorFillAlter
            }}
          >
            {[
              ['S', record.soapSubjective, token.colorInfo],
              ['O', objectiveText || '-', token.colorSuccess],
              ['A', record.soapAssessment, token.colorWarning],
              ['P', record.soapPlan, token.colorPrimary]
            ].map(([label, value, labelColor], index, list) => (
              <div
                key={String(label)}
                className="ri-cppt-timeline-soap-row"
                style={{
                  borderBottom:
                    index < list.length - 1 ? `1px solid ${token.colorBorderSecondary}` : 'none'
                }}
              >
                <span className="ri-cppt-timeline-soap-key" style={{ color: String(labelColor) }}>
                  {label}
                </span>
                <span className="ri-cppt-timeline-soap-val" style={{ color: token.colorTextSecondary }}>
                  {String(value || '-')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export const CPPTInpatientEntryPanel = ({
  encounterId,
  patientData,
  onSaveSuccess
}: CPPTInpatientEntryPanelProps) => {
  const { token } = theme.useToken()
  const { message } = App.useApp()
  const [form] = Form.useForm<CPPTFormValues>()

  const [activeTab, setActiveTab] = useState<'cppt' | 'orders' | 'asuhan'>('cppt')
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline')
  const [formOpen, setFormOpen] = useState(false)
  const [openedTimelineId, setOpenedTimelineId] = useState<string | number | null>(null)
  const [dateIndex, setDateIndex] = useState(0)

  const { profile } = useMyProfile()
  const { data: compositionData, isLoading, refetch } = useCompositionByEncounter(encounterId)
  const { data: obsData } = useQueryObservationByEncounter(encounterId)
  const { data: condData } = useConditionByEncounter(encounterId)
  const { data: allergyResponse } = useAllergyByEncounter(encounterId)
  const { data: medicationHistory, isLoading: isLoadingMedication } =
    useMedicationRequestByEncounter(encounterId)
  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers([
    'doctor',
    'nurse'
  ])
  const upsertMutation = useUpsertComposition()

  const selectedPerformerId = Form.useWatch('performerId', form)
  const selectedPerformer = useMemo(
    () =>
      (
        performersData as Array<{ id: number | string; name: string; role: string }> | undefined
      )?.find((item) => String(item.id) === String(selectedPerformerId)),
    [performersData, selectedPerformerId]
  )
  const currentRole = selectedPerformer?.role || profile?.hakAksesId || ''
  const roleNormalized = String(currentRole).toLowerCase()
  const isDoctorRole = roleNormalized.includes('doctor') || roleNormalized.includes('dokter')
  const isNurseRole = roleNormalized.includes('nurse') || roleNormalized.includes('perawat')

  const performerOptions = useMemo(
    () =>
      (
        performersData as Array<{ id: number | string; name: string; role: string }> | undefined
      )?.map((item) => ({
        id: String(item.id),
        name: item.name,
        role: String(item.role || '')
      })) || [],
    [performersData]
  )

  const resolveRoleKey = (role?: string): 'doctor' | 'nurse' | 'nutrition' | 'rehab' | 'other' => {
    const normalized = String(role || '').toLowerCase()
    if (normalized.includes('doctor') || normalized.includes('dokter')) return 'doctor'
    if (normalized.includes('nurse') || normalized.includes('perawat')) return 'nurse'
    if (normalized.includes('gizi') || normalized.includes('nutrition')) return 'nutrition'
    if (normalized.includes('rehab')) return 'rehab'
    return 'other'
  }

  const activeRoleTab = resolveRoleKey(currentRole)

  const observationData: Parameters<typeof formatObservationSummary>[0] = Array.isArray(
    obsData?.result
  )
    ? (obsData.result as Parameters<typeof formatObservationSummary>[0])
    : []
  const conditionData: Parameters<typeof formatObservationSummary>[1] = Array.isArray(
    condData?.result
  )
    ? (condData.result as Parameters<typeof formatObservationSummary>[1])
    : []

  const vitalSummary = useMemo(
    () => formatObservationSummary(observationData, conditionData),
    [observationData, conditionData]
  )

  const vitalsSnapshot = useMemo(() => {
    const vitals = vitalSummary.vitalSigns
    const gcsScore = [vitals.gcsEye, vitals.gcsVerbal, vitals.gcsMotor]
      .filter((value): value is number => typeof value === 'number')
      .reduce((sum, value) => sum + value, 0)

    return {
      timestamp: vitalSummary.examinationDate,
      rows: [
        {
          label: 'TD',
          value:
            vitals.systolicBloodPressure && vitals.diastolicBloodPressure
              ? `${vitals.systolicBloodPressure}/${vitals.diastolicBloodPressure}`
              : '-'
        },
        { label: 'HR', value: vitals.pulseRate ? String(vitals.pulseRate) : '-' },
        { label: 'RR', value: vitals.respiratoryRate ? String(vitals.respiratoryRate) : '-' },
        { label: 'Suhu', value: vitals.temperature ? String(vitals.temperature) : '-' },
        { label: 'SpO₂', value: vitals.oxygenSaturation ? `${vitals.oxygenSaturation}%` : '-' },
        {
          label: 'GCS',
          value:
            gcsScore > 0 ? String(gcsScore) : vitalSummary.physicalExamination.consciousness || '-'
        }
      ]
    }
  }, [vitalSummary])

  const allergyItems = useMemo(() => {
    const result = allergyResponse?.result
    if (!Array.isArray(result)) return []
    return result.map((item: any) => String(item?.note || '').trim()).filter(Boolean)
  }, [allergyResponse?.result])

  const activeMedications = useMemo(() => {
    const raw = medicationHistory as any
    const source = raw?.result ?? raw?.data ?? []
    if (!Array.isArray(source)) return []

    return source
      .filter((item: any) => String(item?.status || '').toLowerCase() === 'active')
      .map((item: any) => ({
        id: item.id,
        name: resolveMedicationName(item),
        regimen: resolveMedicationRegimen(item),
        status: String(item?.status || 'active')
      }))
  }, [medicationHistory])

  const cpptHistory = useMemo(() => {
    const rows: CPPTCompositionRecord[] = (compositionData?.result || []).filter(
      (item): item is CPPTCompositionRecord =>
        item.title === 'CPPT - Catatan Perkembangan Pasien Terintegrasi'
    )

    return rows.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
  }, [compositionData?.result])

  const dateKeys = useMemo(() => {
    const dates = Array.from(
      new Set(cpptHistory.map((item) => dayjs(item.date).format('YYYY-MM-DD')))
    )
    return ['all', ...dates]
  }, [cpptHistory])

  const activeDateKey = dateKeys[Math.min(dateIndex, dateKeys.length - 1)] || 'all'

  const filteredCpptHistory = useMemo(() => {
    if (activeDateKey === 'all') return cpptHistory
    return cpptHistory.filter((item) => dayjs(item.date).format('YYYY-MM-DD') === activeDateKey)
  }, [activeDateKey, cpptHistory])

  const handleFetchVitalsToObjective = () => {
    const v = vitalSummary.vitalSigns
    const physical = vitalSummary.physicalExamination

    const vitalsParts: string[] = []
    if (v.systolicBloodPressure && v.diastolicBloodPressure) {
      vitalsParts.push(`TD: ${v.systolicBloodPressure}/${v.diastolicBloodPressure} mmHg`)
    }
    if (v.pulseRate) vitalsParts.push(`N: ${v.pulseRate} x/m`)
    if (v.respiratoryRate) vitalsParts.push(`RR: ${v.respiratoryRate} x/m`)
    if (v.temperature) vitalsParts.push(`S: ${v.temperature} °C`)
    if (physical.consciousness) vitalsParts.push(`Kesadaran: ${physical.consciousness}`)

    if (vitalsParts.length === 0) {
      message.warning('Data TTV kosong')
      return
    }

    const ttvString = `[TTV] ${vitalsParts.join(' | ')} [/TTV]`
    const currentObjective = form.getFieldValue('soapObjective') || ''
    const cleanedObjective = String(currentObjective)
      .replace(/\[TTV\].*?\[\/TTV\]/s, '')
      .trim()
    form.setFieldValue('soapObjective', `${ttvString}\n\n${cleanedObjective}`.trim())
    message.success('Data TTV berhasil diambil ke kolom Objective')
  }

  const handleStartCreate = () => {
    form.resetFields()
    form.setFieldsValue({ status: 'preliminary', assessment_date: dayjs(), id: undefined })
    setFormOpen(true)
  }

  const handleSidebarFeatureClick = (feature: 'vitals' | 'medication') => {
    if (feature === 'vitals') {
      message.info('Fitur lihat semua TTV akan dihubungkan pada fase berikutnya')
      return
    }
    message.info('Fitur kelola resep akan dihubungkan pada fase berikutnya')
  }

  const handleRoleTabSelect = (roleKey: 'doctor' | 'nurse' | 'nutrition' | 'rehab') => {
    const performer = performerOptions.find((item) => resolveRoleKey(item.role) === roleKey)
    if (!performer) {
      message.info(`Performer ${roleKey} belum tersedia`)
      return
    }
    form.setFieldValue('performerId', Number(performer.id))
  }

  const handleEdit = (record: CPPTCompositionRecord) => {
    form.setFieldsValue({
      id: record.id ?? undefined,
      performerId: record.authorId?.[0] ? Number(record.authorId[0]) : undefined,
      soapSubjective: record.soapSubjective ?? undefined,
      soapObjective: record.soapObjective ?? undefined,
      soapAssessment: record.soapAssessment ?? undefined,
      soapPlan: record.soapPlan ?? undefined,
      status: (record.status ?? undefined) as CompositionStatus | undefined,
      assessment_date: dayjs(record.date)
    })
    setFormOpen(true)
  }

  const handleSubmit = async (values: CPPTFormValues) => {
    try {
      const assessmentDate = values.assessment_date ? dayjs(values.assessment_date) : dayjs()
      const commonSectionData = {
        author: [String(values.performerId)],
        focus: {
          reference: `Patient/${patientData.patient.id}`,
          display: patientData.patient.name
        },
        mode: 'working',
        entry: [],
        emptyReason: null,
        orderedBy: null
      }

      const sections: CompositionSection[] = [
        {
          title: 'Subjective',
          code: {
            coding: [{ system: 'http://loinc.org', code: '61150-9', display: 'Subjective' }]
          },
          text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml">${values.soapSubjective?.replace(/\n/g, '<br/>') || '-'}</div>`
          },
          ...commonSectionData
        },
        {
          title: 'Objective',
          code: { coding: [{ system: 'http://loinc.org', code: '61149-1', display: 'Objective' }] },
          text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml">${values.soapObjective?.replace(/\n/g, '<br/>') || '-'}</div>`
          },
          ...commonSectionData
        },
        {
          title: 'Assessment',
          code: {
            coding: [{ system: 'http://loinc.org', code: '51848-0', display: 'Assessment' }]
          },
          text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml">${values.soapAssessment?.replace(/\n/g, '<br/>') || '-'}</div>`
          },
          ...commonSectionData
        },
        {
          title: 'Plan',
          code: {
            coding: [{ system: 'http://loinc.org', code: '18776-5', display: 'Plan of care note' }]
          },
          text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml">${values.soapPlan?.replace(/\n/g, '<br/>') || '-'}</div>`
          },
          ...commonSectionData
        }
      ]

      const payload: CompositionUpsertPayload = {
        id: values.id,
        encounterId,
        patientId: patientData.patient.id,
        doctorId: Number(values.performerId),
        authorName: selectedPerformer?.name || undefined,
        title: 'CPPT - Catatan Perkembangan Pasien Terintegrasi',
        status: values.status,
        date: assessmentDate.toISOString(),
        type: {
          coding: [{ system: 'http://loinc.org', code: '11506-3', display: 'Progress note' }]
        },
        category: [
          {
            coding: [{ system: 'http://loinc.org', code: 'LP173421-1', display: 'Report' }]
          }
        ],
        soapSubjective: values.soapSubjective,
        soapObjective: values.soapObjective,
        soapAssessment: values.soapAssessment,
        soapPlan: values.soapPlan,
        section: sections
      }

      await upsertMutation.mutateAsync(payload)

      const statusMsg = values.status === 'final' ? 'Final' : 'Draft'
      message.success(`CPPT berhasil disimpan (${statusMsg})`)
      setFormOpen(false)
      form.resetFields()
      await refetch()
      onSaveSuccess?.()
    } catch (error) {
      console.error('Error saving CPPT:', error)
      message.error('Gagal menyimpan CPPT')
    }
  }

  const handleVerify = async (record: CPPTCompositionRecord) => {
    try {
      if (record.status === 'final') return
      if (!isDoctorRole) {
        message.error('Hanya dokter yang dapat melakukan verifikasi')
        return
      }

      const verifierId = Number(selectedPerformer?.id || profile?.id || record.authorId?.[0])
      if (!Number.isFinite(verifierId) || verifierId <= 0) {
        message.error('Pilih dokter verifikator terlebih dahulu')
        return
      }

      const sections: CompositionSection[] =
        record.sections && record.sections.length > 0
          ? record.sections
          : [
              {
                title: 'Subjective',
                code: {
                  coding: [{ system: 'http://loinc.org', code: '61150-9', display: 'Subjective' }]
                },
                text: {
                  status: 'generated',
                  div: `<div xmlns="http://www.w3.org/1999/xhtml">${record.soapSubjective?.replace(/\n/g, '<br/>') || '-'}</div>`
                }
              },
              {
                title: 'Objective',
                code: {
                  coding: [{ system: 'http://loinc.org', code: '61149-1', display: 'Objective' }]
                },
                text: {
                  status: 'generated',
                  div: `<div xmlns="http://www.w3.org/1999/xhtml">${record.soapObjective?.replace(/\n/g, '<br/>') || '-'}</div>`
                }
              },
              {
                title: 'Assessment',
                code: {
                  coding: [{ system: 'http://loinc.org', code: '51848-0', display: 'Assessment' }]
                },
                text: {
                  status: 'generated',
                  div: `<div xmlns="http://www.w3.org/1999/xhtml">${record.soapAssessment?.replace(/\n/g, '<br/>') || '-'}</div>`
                }
              },
              {
                title: 'Plan',
                code: {
                  coding: [
                    { system: 'http://loinc.org', code: '18776-5', display: 'Plan of care note' }
                  ]
                },
                text: {
                  status: 'generated',
                  div: `<div xmlns="http://www.w3.org/1999/xhtml">${record.soapPlan?.replace(/\n/g, '<br/>') || '-'}</div>`
                }
              }
            ]

      await upsertMutation.mutateAsync({
        id: record.id,
        encounterId,
        patientId: patientData.patient.id,
        doctorId: verifierId,
        authorName: selectedPerformer?.name || profile?.username || 'Dokter',
        title: record.title || 'CPPT - Catatan Perkembangan Pasien Terintegrasi',
        status: 'final',
        date: record.date,
        type: {
          coding: [{ system: 'http://loinc.org', code: '11506-3', display: 'Progress note' }]
        },
        category: [
          {
            coding: [{ system: 'http://loinc.org', code: 'LP173421-1', display: 'Report' }]
          }
        ],
        soapSubjective: record.soapSubjective,
        soapObjective: record.soapObjective,
        soapAssessment: record.soapAssessment,
        soapPlan: record.soapPlan,
        section: sections
      })

      message.success('CPPT berhasil diverifikasi (Final)')
      await refetch()
    } catch (error) {
      console.error('Error verify CPPT:', error)
      message.error('Gagal verifikasi CPPT')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center" style={{ padding: `${ds.spacing.xl}px 0` }}>
        <Spin size="large" tip="Memuat panel CPPT ranap..." />
      </div>
    )
  }

  const inpatientInfoRows = formatInpatientInfoRows(patientData)

  const cardHeaderStyles = {
    padding: `${ds.spacing.xs}px ${ds.spacing.sm}px`,
    minHeight: ds.components.card.headerHeight,
    borderBottom: `1px solid ${token.colorBorderSecondary}`
  }

  const cardBodyStyles = {
    padding: `${ds.spacing.xs}px ${ds.spacing.sm}px`
  }

  const timelineTableCss = `
    .cppt-mock .mono {
      font-family: ${token.fontFamilyCode};
      font-feature-settings: 'zero';
    }
    .cppt-mock .cppt-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 32px;
      padding: 0 12px;
      border-radius: 6px;
      border: 1px solid ${token.colorBorder};
      background: ${token.colorBgContainer};
      color: ${token.colorText};
      font-size: 12.5px;
      font-weight: 500;
      transition: background 0.1s;
      cursor: pointer;
    }
    .cppt-mock .cppt-btn:hover { background: ${token.colorFillAlter}; }
    .cppt-mock .cppt-btn:disabled { opacity: 0.25; cursor: not-allowed; }
    .cppt-mock .cppt-btn-sm { height: 26px; padding: 0 9px; font-size: 11.5px; }
    .cppt-mock .cppt-btn-ghost { border-color: transparent; background: transparent; }
    .cppt-mock .cppt-btn-ghost:hover { background: ${token.colorFillAlter}; }

    .cppt-mock .cppt-seg {
      display: flex;
      width: auto;
      background: ${token.colorFillAlter};
      border-radius: 6px;
      padding: 2px;
      gap: 2px;
      border: 1px solid ${token.colorBorder};
    }
    .cppt-mock .cppt-seg button {
      flex: 1;
      height: 26px;
      font-size: 11.5px;
      font-weight: 500;
      background: none;
      border: none;
      border-radius: 4px;
      color: ${token.colorTextSecondary};
      display: inline-flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      padding: 0 9px;
    }
    .cppt-mock .cppt-seg button.on {
      background: ${token.colorBgContainer};
      color: ${token.colorText};
      box-shadow: ${ds.shadow.xs};
    }

    .cppt-mock .cppt-table-wrap {
      border: 1px solid ${token.colorBorderSecondary};
      border-radius: 6px;
      overflow: hidden;
    }
    .cppt-mock table.cppt-t {
      width: 100%;
      border-collapse: collapse;
      font-size: 11.5px;
    }
    .cppt-mock table.cppt-t thead th {
      padding: 8px 10px;
      text-align: left;
      font-weight: 600;
      font-size: 10px;
      color: ${token.colorTextTertiary};
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 2px solid ${token.colorBorderSecondary};
      background: ${token.colorFillAlter};
      white-space: nowrap;
    }
    .cppt-mock table.cppt-t tbody td {
      padding: 9px 10px;
      border-bottom: 1px solid ${token.colorBorderSecondary};
      vertical-align: middle;
      font-size: 11px;
    }
    .cppt-mock table.cppt-t tbody tr:last-child td { border-bottom: none; }
    .cppt-mock .cppt-empty {
      text-align: center;
      padding: 32px 0;
      color: ${token.colorTextTertiary};
      font-size: 12px;
    }
    .cppt-mock .cppt-side-card {
      background: ${token.colorBgContainer};
      border: 1px solid ${token.colorBorderSecondary};
      border-radius: 8px;
      box-shadow: ${ds.shadow.xs};
    }
    .cppt-mock .cppt-side-card-h {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-bottom: 1px solid ${token.colorBorderSecondary};
    }
    .cppt-mock .cppt-side-card-h h3 {
      margin: 0;
      font-size: 11.5px;
      font-weight: 600;
      line-height: 1.2;
      color: ${token.colorText};
    }
    .cppt-mock .cppt-side-card-h .spacer { flex: 1; }
    .cppt-mock .cppt-side-card-b { padding: 10px 14px; }
    .cppt-mock .cppt-side-card-b.tight-med { padding: 8px 14px 12px; }
    .cppt-mock .cppt-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      font-size: 11.5px;
    }
    .cppt-mock .cppt-info-label {
      font-size: 10px;
      color: ${token.colorTextTertiary};
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .cppt-mock .cppt-info-value {
      font-weight: 500;
      font-size: 11.5px;
      color: ${token.colorText};
      word-break: break-word;
    }
    .cppt-mock .cppt-vitals-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .cppt-mock .cppt-vital-tile {
      padding: 6px 8px;
      background: ${token.colorFillAlter};
      border-radius: 6px;
      text-align: center;
    }
    .cppt-mock .cppt-vital-label {
      font-size: 9.5px;
      color: ${token.colorTextTertiary};
      font-weight: 600;
    }
    .cppt-mock .cppt-vital-value {
      font-size: 13px;
      font-weight: 700;
      color: ${token.colorText};
      font-family: ${token.fontFamilyCode};
    }
    .cppt-mock .cppt-vital-value.warn { color: ${token.colorWarning}; }
    .cppt-mock .cppt-side-subtime {
      font-size: 10px;
      color: ${token.colorTextTertiary};
      font-family: ${token.fontFamilyCode};
    }
    .cppt-mock .cppt-allergy-box {
      padding: 6px 8px;
      background: ${token.colorErrorBg};
      border: 1px solid ${token.colorErrorBorder};
      border-radius: 6px;
      font-size: 11px;
      color: ${token.colorErrorText};
      line-height: 1.45;
    }
    .cppt-mock .cppt-med-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 0;
      border-bottom: 1px solid ${token.colorBorderSecondary};
      font-size: 11px;
      gap: 8px;
    }
    .cppt-mock .cppt-med-row:last-child { border-bottom: none; }
    .cppt-mock .cppt-med-name { font-weight: 600; color: ${token.colorText}; }
    .cppt-mock .cppt-med-dose {
      color: ${token.colorTextTertiary};
      margin-left: 4px;
      font-size: 11px;
    }
    .cppt-mock .cppt-badge {
      display: inline-flex;
      align-items: center;
      height: 20px;
      padding: 0 7px;
      border-radius: 999px;
      font-size: 10.5px;
      font-weight: 600;
      letter-spacing: 0.02em;
      white-space: nowrap;
      background: ${token.colorInfoBg};
      color: ${token.colorInfo};
    }
    .cppt-mock .cppt-side-btn {
      width: 100%;
      margin-top: 8px;
      justify-content: center;
    }

    .cppt-mock .ri-cppt-timeline-entry { display: flex; gap: 12px; }
    .cppt-mock .ri-cppt-timeline-entry-left {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .cppt-mock .ri-cppt-timeline-avatar {
      width: 32px;
      height: 32px;
      border-radius: 999px;
      color: #fff;
      display: grid;
      place-items: center;
      font-size: 10.5px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .cppt-mock .ri-cppt-timeline-track {
      width: 2px;
      flex: 1;
      border-radius: 1px;
      min-height: 20px;
    }
    .cppt-mock .ri-cppt-timeline-content { flex: 1; }
    .cppt-mock .ri-cppt-timeline-head {
      display: flex;
      gap: 8px;
      align-items: center;
      cursor: pointer;
      user-select: none;
    }
    .cppt-mock .ri-cppt-timeline-role { font-size: 12.5px; }
    .cppt-mock .ri-cppt-timeline-author { font-size: 11.5px; color: ${token.colorTextSecondary}; }
    .cppt-mock .ri-cppt-timeline-time {
      margin-left: auto;
      font-size: 10.5px;
      color: ${token.colorTextTertiary};
      font-family: ${token.fontFamilyCode};
    }
    .cppt-mock .ri-cppt-timeline-preview {
      font-size: 11px;
      line-height: 1.5;
      margin-top: 2px;
    }
    .cppt-mock .ri-cppt-timeline-preview-label {
      font-weight: 700;
      margin-right: 4px;
    }
    .cppt-mock .ri-cppt-timeline-soap {
      border-radius: 6px;
      overflow: hidden;
    }
    .cppt-mock .ri-cppt-timeline-soap-row {
      display: flex;
      gap: 10px;
      padding: 8px 12px;
    }
    .cppt-mock .ri-cppt-timeline-soap-key {
      width: 14px;
      flex-shrink: 0;
      font-size: 11px;
      font-weight: 700;
    }
    .cppt-mock .ri-cppt-timeline-soap-val {
      font-size: 11.5px;
      line-height: 1.5;
      white-space: pre-wrap;
      flex: 1;
    }
  `

  return (
    <>
      <style>{timelineTableCss}</style>
      <div
        className="grid cppt-mock"
        style={{ gridTemplateColumns: '240px minmax(0, 1fr)', gap: ds.spacing.sm }}
      >
      <div className="flex flex-col" style={{ gap: ds.spacing.sm }}>
        <div className="cppt-side-card">
          <div className="cppt-side-card-h">
            <h3>Info Rawat Inap</h3>
          </div>
          <div className="cppt-side-card-b">
            <div className="cppt-info-grid">
              {inpatientInfoRows.map((row) => (
                <div key={row.label}>
                  <div className="cppt-info-label">{row.label}</div>
                  <div
                    className="cppt-info-value"
                    style={{ fontFamily: row.label === 'SEP' ? token.fontFamilyCode : token.fontFamily }}
                  >
                    {row.value || '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="cppt-side-card">
          <div className="cppt-side-card-h">
            <h3>Vital Sign Terkini</h3>
            <div className="spacer" />
            <span className="cppt-side-subtime">
              {vitalsSnapshot.timestamp ? dayjs(vitalsSnapshot.timestamp).format('HH:mm') : '--:--'}
            </span>
          </div>
          <div className="cppt-side-card-b">
            <div className="cppt-vitals-grid">
              {vitalsSnapshot.rows.map((row) => (
                <div key={row.label} className="cppt-vital-tile">
                  <div className="cppt-vital-label">{row.label}</div>
                  <div className={`cppt-vital-value ${row.label === 'TD' ? 'warn' : ''}`}>
                    {row.value || '-'}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="cppt-btn cppt-btn-sm cppt-side-btn"
              onClick={() => handleSidebarFeatureClick('vitals')}
            >
              <HeartOutlined style={{ fontSize: 11 }} />
              Lihat semua TTV
            </button>
          </div>
        </div>

        <div className="cppt-side-card">
          <div className="cppt-side-card-h">
            <h3>Alergi</h3>
          </div>
          <div className="cppt-side-card-b">
            {allergyItems.length === 0 && (
              <Text type="secondary">Tidak ada catatan alergi aktif</Text>
            )}
            {allergyItems.length > 0 && (
              <div className="cppt-allergy-box">
                {allergyItems.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    style={{ fontWeight: index === 0 ? 600 : 500 }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="cppt-side-card">
          <div className="cppt-side-card-h">
            <h3>Obat Aktif</h3>
          </div>
          <div className="cppt-side-card-b tight-med">
            {isLoadingMedication && (
              <div style={{ padding: '8px 0' }}>
                <Spin size="small" />
              </div>
            )}
            {!isLoadingMedication && activeMedications.length === 0 && (
              <Text type="secondary">Tidak ada obat aktif</Text>
            )}
            {!isLoadingMedication &&
              activeMedications.slice(0, 6).map((item) => (
                <div key={String(item.id)} className="cppt-med-row">
                  <div style={{ minWidth: 0 }}>
                    <span className="cppt-med-name">{item.name}</span>
                    <span className="cppt-med-dose">{item.regimen}</span>
                  </div>
                  <span className="cppt-badge">{item.status}</span>
                </div>
              ))}
            <button
              type="button"
              className="cppt-btn cppt-btn-sm cppt-side-btn"
              onClick={() => handleSidebarFeatureClick('medication')}
            >
              <MedicineBoxOutlined style={{ fontSize: 11 }} />
              Kelola Resep
            </button>
          </div>
        </div>
      </div>

      <Card styles={{ body: { padding: 0 } }}>
        <div
          className="flex items-center"
          style={{ padding: `${ds.spacing.sm}px ${ds.spacing.sm + 2}px 0` }}
        >
          <div
            className="flex items-center"
            style={{
              gap: 0,
              borderRadius: ds.radius.md,
              border: `1px solid ${token.colorBorder}`,
              background: token.colorFillAlter,
              overflow: 'hidden'
            }}
          >
            {[
              { key: 'cppt', label: 'CPPT / SOAP' },
              { key: 'orders', label: 'Order Baru' },
              { key: 'asuhan', label: 'Asuhan Keperawatan' }
            ].map((tab) => {
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as 'cppt' | 'orders' | 'asuhan')}
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                    padding: `${ds.spacing.xs - 1}px ${ds.spacing.sm + 2}px`,
                    fontSize: ds.typography.baseFontSize,
                    fontWeight: active ? 600 : 500,
                    background: active ? token.colorBgContainer : 'transparent',
                    color: active ? token.colorText : token.colorTextSecondary
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
          <div className="ml-auto">
            <Text style={{ fontFamily: token.fontFamilyCode, fontSize: 11 }} type="secondary">
              {dayjs().format('DD MMM YYYY')}
            </Text>
          </div>
        </div>

        {activeTab === 'cppt' && (
          <div style={{ padding: `${ds.spacing.sm + 2}px` }}>
            <div
              style={{
                marginBottom: ds.spacing.md,
                border: `1px solid ${formOpen ? ds.colors.accent : token.colorBorder}`,
                borderRadius: ds.radius.md,
                overflow: 'hidden'
              }}
            >
              <div
                className="flex items-center"
                style={{
                  gap: ds.spacing.xs,
                  padding: `${ds.spacing.xs + 2}px ${ds.spacing.sm + 2}px`,
                  background: formOpen ? ds.colors.accentSoft : token.colorFillAlter,
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                onClick={() => setFormOpen((prev) => !prev)}
              >
                <RightOutlined rotate={formOpen ? 90 : 0} style={{ fontSize: 13 }} />
                <Text
                  style={{
                    fontSize: ds.typography.labelFontSize,
                    fontWeight: 700,
                    color: formOpen ? ds.colors.accent : token.colorTextSecondary,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase'
                  }}
                >
                  Input CPPT Baru
                </Text>
                <Text type="secondary" style={{ fontSize: 10.5 }}>
                  {formOpen ? '— klik untuk tutup' : '— klik untuk buka form'}
                </Text>
                <div className="ml-auto">
                  {!formOpen && (
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      size="small"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleStartCreate()
                      }}
                    >
                      Buat CPPT
                    </Button>
                  )}
                </div>
              </div>

              {formOpen && (
                <div
                  style={{
                    padding: ds.spacing.sm + 2,
                    background: token.colorFillAlter
                  }}
                >
                  <Form<CPPTFormValues>
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{ status: 'preliminary', assessment_date: dayjs() }}
                  >
                    <div className="flex items-center" style={{ gap: ds.spacing.xs, marginBottom: 10 }}>
                      <div
                        className="flex items-center"
                        style={{
                          gap: 0,
                          borderRadius: ds.radius.md,
                          border: `1px solid ${token.colorBorder}`,
                          background: token.colorBgContainer,
                          overflow: 'hidden'
                        }}
                      >
                        {[
                          { key: 'doctor', label: 'Dokter' },
                          { key: 'nurse', label: 'Perawat' },
                          { key: 'nutrition', label: 'Gizi' },
                          { key: 'rehab', label: 'Rehab' }
                        ].map((roleTab) => {
                          const isActive = activeRoleTab === roleTab.key
                          return (
                            <button
                              key={roleTab.key}
                              type="button"
                              onClick={() =>
                                handleRoleTabSelect(
                                  roleTab.key as 'doctor' | 'nurse' | 'nutrition' | 'rehab'
                                )
                              }
                              style={{
                                border: 'none',
                                cursor: 'pointer',
                                padding: `${ds.spacing.xxs + 1}px ${ds.spacing.xs}px`,
                                fontSize: 11,
                                fontWeight: isActive ? 600 : 500,
                                background: isActive ? ds.colors.accentSoft : 'transparent',
                                color: isActive ? ds.colors.accentDeep : token.colorTextSecondary
                              }}
                            >
                              {roleTab.label}
                            </button>
                          )
                        })}
                      </div>
                      <div className="ml-auto" style={{ minWidth: 240 }}>
                        <Form.Item name="performerId" className="!mb-0">
                          <Select
                            size="small"
                            loading={isLoadingPerformers}
                            placeholder="Pilih penulis"
                            options={performerOptions.map((item) => ({
                              value: Number(item.id),
                              label: item.name
                            }))}
                          />
                        </Form.Item>
                      </div>
                    </div>

                    <div className="flex justify-end" style={{ marginBottom: ds.spacing.xs }}>
                      <Button
                        type="primary"
                        ghost
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={handleFetchVitalsToObjective}
                      >
                        Ambil TTV Terakhir
                      </Button>
                    </div>

                    <div className="flex flex-col" style={{ gap: ds.spacing.xs }}>
                      <div className="flex items-start" style={{ gap: ds.spacing.xs }}>
                        <Text
                          style={{
                            width: 14,
                            flexShrink: 0,
                            marginTop: 8,
                            fontSize: 11,
                            fontWeight: 700,
                            color: token.colorInfo
                          }}
                        >
                          S
                        </Text>
                        <Form.Item
                          name="soapSubjective"
                          className="!mb-0 flex-1"
                          rules={[{ required: true, message: 'Wajib diisi' }]}
                        >
                          <TextArea rows={2} placeholder="Subjektif — Keluhan & anamnesis" />
                        </Form.Item>
                      </div>

                      <div className="flex items-start" style={{ gap: ds.spacing.xs }}>
                        <Text
                          style={{
                            width: 14,
                            flexShrink: 0,
                            marginTop: 8,
                            fontSize: 11,
                            fontWeight: 700,
                            color: token.colorSuccess
                          }}
                        >
                          O
                        </Text>
                        <Form.Item name="soapObjective" className="!mb-0 flex-1">
                          <TextArea rows={2} placeholder="Objektif — Pemeriksaan fisik & vital" />
                        </Form.Item>
                      </div>

                      <div className="flex items-start" style={{ gap: ds.spacing.xs }}>
                        <Text
                          style={{
                            width: 14,
                            flexShrink: 0,
                            marginTop: 8,
                            fontSize: 11,
                            fontWeight: 700,
                            color: token.colorWarning
                          }}
                        >
                          A
                        </Text>
                        <Form.Item
                          name="soapAssessment"
                          className="!mb-0 flex-1"
                          rules={[{ required: isDoctorRole, message: 'Wajib diisi' }]}
                        >
                          <TextArea
                            rows={2}
                            disabled={isNurseRole}
                            placeholder="Asesmen — Diagnosis & interpretasi"
                          />
                        </Form.Item>
                      </div>

                      <div className="flex items-start" style={{ gap: ds.spacing.xs }}>
                        <Text
                          style={{
                            width: 14,
                            flexShrink: 0,
                            marginTop: 8,
                            fontSize: 11,
                            fontWeight: 700,
                            color: ds.colors.accent
                          }}
                        >
                          P
                        </Text>
                        <Form.Item
                          name="soapPlan"
                          className="!mb-0 flex-1"
                          rules={[{ required: isDoctorRole, message: 'Wajib diisi' }]}
                        >
                          <TextArea
                            rows={2}
                            disabled={isNurseRole}
                            placeholder="Plan — Rencana tindak lanjut"
                          />
                        </Form.Item>
                      </div>
                    </div>

                    <Form.Item name="status" hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name="id" hidden>
                      <Input />
                    </Form.Item>

                    <div className="flex items-center" style={{ gap: ds.spacing.xs, marginTop: 10 }}>
                      <Button
                        onClick={() => {
                          form.setFieldValue('status', 'preliminary')
                          form.submit()
                        }}
                        loading={upsertMutation.isPending}
                      >
                        Simpan Draft
                      </Button>
                      <div className="ml-auto" />
                      {isDoctorRole && (
                        <Button
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          onClick={() => {
                            form.setFieldValue('status', 'final')
                            form.submit()
                          }}
                          loading={upsertMutation.isPending}
                        >
                          Submit CPPT
                        </Button>
                      )}
                    </div>
                  </Form>
                </div>
              )}
            </div>

            <div className="flex items-center" style={{ gap: ds.spacing.xs, marginBottom: ds.spacing.sm }}>
              <CalendarOutlined />
              <button
                type="button"
                className="cppt-btn cppt-btn-ghost cppt-btn-sm"
                disabled={dateIndex === 0}
                onClick={() => setDateIndex((prev) => Math.max(prev - 1, 0))}
              >
                <LeftOutlined style={{ fontSize: 13 }} />
              </button>
              <div className="text-center" style={{ minWidth: 190 }}>
                <Text strong style={{ fontSize: ds.typography.baseFontSize }}>
                  {activeDateKey === 'all'
                    ? 'Semua tanggal'
                    : dayjs(activeDateKey).format('DD MMM YYYY')}
                </Text>
                <Text
                  className="ml-2"
                  style={{ fontFamily: token.fontFamilyCode, fontSize: 11 }}
                  type="secondary"
                >
                  {filteredCpptHistory.length} catatan
                </Text>
              </div>
              <button
                type="button"
                className="cppt-btn cppt-btn-ghost cppt-btn-sm"
                disabled={dateIndex >= dateKeys.length - 1}
                onClick={() => setDateIndex((prev) => Math.min(prev + 1, dateKeys.length - 1))}
              >
                <RightOutlined style={{ fontSize: 13 }} />
              </button>
              {dateIndex !== 0 && (
                <button
                  type="button"
                  className="cppt-btn cppt-btn-ghost cppt-btn-sm"
                  style={{ fontSize: 10.5, color: token.colorTextTertiary }}
                  onClick={() => setDateIndex(0)}
                >
                  Reset
                </button>
              )}

              <div className="ml-auto">
                <div className="cppt-seg">
                  <button
                    type="button"
                    onClick={() => setViewMode('timeline')}
                    className={viewMode === 'timeline' ? 'on' : ''}
                  >
                    <UnorderedListOutlined />
                    Timeline
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={viewMode === 'table' ? 'on' : ''}
                  >
                    <TableOutlined />
                    Tabel
                  </button>
                </div>
              </div>
            </div>

            {viewMode === 'timeline' && (
              <div style={{ paddingTop: 4 }}>
                {filteredCpptHistory.map((record) => {
                  const targetId = record.id ?? null
                  const isOpen = openedTimelineId === targetId
                  return (
                    <CPPTTimelineEntry
                      key={String(record.id)}
                      record={record}
                      token={token}
                      isOpen={isOpen}
                      onToggle={() =>
                        setOpenedTimelineId((prev) => (prev === targetId ? null : targetId))
                      }
                    />
                  )
                })}
                {filteredCpptHistory.length === 0 && (
                  <div className="cppt-empty">
                    Tidak ada catatan untuk tanggal ini.
                  </div>
                )}
              </div>
            )}

            {viewMode === 'table' && (
              <div className="cppt-table-wrap">
                <table className="cppt-t">
                  <thead>
                    <tr>
                      {['Waktu', 'Profesi', 'Penulis', 'Asesmen (A)', 'Plan (P)'].map((header) => (
                        <th key={header}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCpptHistory.map((record, index) => {
                      const profesi = record.author?.hakAkses?.nama || record.role || '-'
                      const tone = resolveRoleTone(profesi)
                      const colors = toneColorMap(token)
                      const professionColor = colors[tone]
                      const timestamp = dayjs(record.date)
                        .format('DD MMM YYYY · HH:mm')
                        .replace(` ${dayjs().format('YYYY')}`, '')

                      return (
                        <tr
                          key={String(record.id)}
                          style={{
                            borderBottom: `1px solid ${token.colorBorderSecondary}`,
                            background: index % 2 === 1 ? token.colorFillAlter : token.colorBgContainer
                          }}
                        >
                          <td
                            className="mono"
                            style={{
                              whiteSpace: 'nowrap',
                              color: token.colorTextTertiary,
                              fontSize: 11
                            }}
                          >
                            {timestamp}
                          </td>
                          <td style={{ padding: '9px 10px', whiteSpace: 'nowrap' }}>
                            <span style={{ fontWeight: 700, color: professionColor, fontSize: 11 }}>
                              {profesi}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: '9px 10px',
                              whiteSpace: 'nowrap',
                              color: token.colorTextSecondary,
                              fontSize: 11
                            }}
                          >
                            {record.author?.namaLengkap || record.authorName || '-'}
                          </td>
                          <td
                            style={{
                              padding: '9px 10px',
                              maxWidth: 220,
                              color: token.colorTextSecondary,
                              fontSize: 11,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            title={record.soapAssessment || '-'}
                          >
                            {record.soapAssessment || '-'}
                          </td>
                          <td
                            style={{
                              padding: '9px 10px',
                              maxWidth: 220,
                              color: token.colorTextSecondary,
                              fontSize: 11,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            title={record.soapPlan || '-'}
                          >
                            {record.soapPlan || '-'}
                          </td>
                        </tr>
                      )
                    })}
                    {filteredCpptHistory.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            textAlign: 'center',
                            padding: 28,
                            color: token.colorTextTertiary,
                            fontSize: 12
                          }}
                        >
                          Tidak ada catatan untuk tanggal ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div style={{ padding: ds.spacing.sm + 2 }}>
            <Card size="small" styles={{ header: cardHeaderStyles, body: cardBodyStyles }}>
              <Text strong>Order Baru</Text>
              <Divider style={{ margin: `${ds.spacing.xs}px 0` }} />
              <Text type="secondary">Fase ini masih placeholder UI sesuai mockup.</Text>
            </Card>
          </div>
        )}

        {activeTab === 'asuhan' && (
          <div style={{ padding: ds.spacing.sm + 2 }}>
            <Card size="small" styles={{ header: cardHeaderStyles, body: cardBodyStyles }}>
              <Text strong>Asuhan Keperawatan</Text>
              <Divider style={{ margin: `${ds.spacing.xs}px 0` }} />
              <Text type="secondary">Fase ini masih placeholder UI sesuai mockup.</Text>
            </Card>
          </div>
        )}
      </Card>
    </div>
    </>
  )
}
