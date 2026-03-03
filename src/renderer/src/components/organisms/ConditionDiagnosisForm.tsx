import { useState, useEffect } from 'react'
import {
  Form,
  Button,
  Card,
  Table,
  Space,
  App,
  Spin,
  AutoComplete,
  Tag,
  Select,
  Segmented
} from 'antd'
import { SaveOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { AssessmentHeader } from './Assessment/AssesmentHeader/AssessmentHeader'
import { usePerformers } from '@renderer/hooks/query/use-performers'
import { useDiagnosisCodeList } from '../../hooks/query/use-diagnosis-code'
import { useConditionByEncounter, useBulkCreateCondition } from '../../hooks/query/use-condition'
import { CONDITION_CATEGORIES, createConditionBatch } from '../../utils/builders/condition-builder'
import type { PatientData } from '@renderer/types/doctor.types'

// =====================================================
// Types
// =====================================================

type DiagnosisType = 'awal' | 'kerja' | 'banding'

interface DiagnosisCode {
  id: string
  code: string
  display: string
  id_display: string
  system: string
}

interface DiagnosisEntry {
  key: string
  id: string // diagnosisCodeId (master)
  code: string
  display: string
  type: DiagnosisType
  notes?: string
}

interface ConditionDiagnosisFormProps {
  encounterId: string
  patientData: PatientData
}

// =====================================================
// Mapping type → FHIR verificationStatus
// =====================================================

const DIAGNOSIS_TYPE_LABEL: Record<DiagnosisType, string> = {
  awal: 'Diagnosis Awal',
  kerja: 'Diagnosis Kerja',
  banding: 'Diagnosis Banding'
}

/**
 * Map jenis diagnosis → verificationStatus FHIR Condition.
 * - Diagnosis Awal: tidak memiliki verificationStatus (unconfirmed implicitly)
 * - Diagnosis Kerja: provisional
 * - Diagnosis Banding: differential
 */
const VERIFICATION_STATUS_MAP: Record<DiagnosisType, 'provisional' | 'differential' | undefined> = {
  awal: undefined, // Diagnosis awal tidak punya verificationStatus
  kerja: 'provisional',
  banding: 'differential'
}

// =====================================================
// Component
// =====================================================

export const ConditionDiagnosisForm = ({
  encounterId,
  patientData
}: ConditionDiagnosisFormProps) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const [activeType, setActiveType] = useState<DiagnosisType>('awal')
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [diagnosisOptions, setDiagnosisOptions] = useState<DiagnosisCode[]>([])
  const [entries, setEntries] = useState<DiagnosisEntry[]>([])

  const { data: conditionsData, isLoading: isLoadingConditions } =
    useConditionByEncounter(encounterId)
  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers(['doctor'])
  const { data: masterDiagnosis, isLoading: isLoadingMasterDiagnosis } = useDiagnosisCodeList({
    q: debouncedSearch,
    items: 20
  })
  const saveMutation = useBulkCreateCondition()

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText), 500)
    return () => clearTimeout(t)
  }, [searchText])

  // Populate autocomplete options
  useEffect(() => {
    if (debouncedSearch.length >= 2 && masterDiagnosis) {
      setDiagnosisOptions(masterDiagnosis as unknown as DiagnosisCode[])
    } else {
      setDiagnosisOptions([])
    }
  }, [masterDiagnosis, debouncedSearch])

  // Load existing Condition data (encounter-diagnosis category only)
  useEffect(() => {
    if (!conditionsData?.result || !Array.isArray(conditionsData.result)) return

    const mapped: DiagnosisEntry[] = conditionsData.result
      .filter((c: any) => c.categories?.[0]?.code === CONDITION_CATEGORIES.ENCOUNTER_DIAGNOSIS)
      .map((c: any) => {
        const coding = c.codeCoding?.[0]
        const dxCode = coding?.diagnosisCode

        // Determine type from verificationStatus
        let type: DiagnosisType = 'awal'
        if (c.verificationStatus === 'provisional') type = 'kerja'
        else if (c.verificationStatus === 'differential') type = 'banding'

        return {
          key: `cond-${c.id}`,
          id: dxCode?.id ? String(dxCode.id) : String(coding?.diagnosisCodeId || ''),
          code: dxCode?.code || coding?.code || '',
          display: dxCode?.name || dxCode?.display || coding?.display || '',
          type,
          notes: c.notes?.[0]?.text || undefined
        }
      })

    if (mapped.length > 0) setEntries(mapped)
  }, [conditionsData])

  // Add diagnosis entry from autocomplete selection
  const handleSelect = (id: string) => {
    const found = diagnosisOptions.find((d) => d.id === id)
    if (!found) return

    if (entries.find((e) => e.code === found.code && e.type === activeType)) {
      message.warning(`Kode ${found.code} sudah ditambahkan di ${DIAGNOSIS_TYPE_LABEL[activeType]}`)
      return
    }

    setEntries((prev) => [
      ...prev,
      {
        key: `new-${Date.now()}`,
        id: found.id,
        code: found.code,
        display: found.id_display || found.display,
        type: activeType
      }
    ])
    setSearchText('')
    form.setFieldValue('diagnosisSearch', undefined)
  }

  const handleRemove = (key: string) => setEntries((prev) => prev.filter((e) => e.key !== key))

  const handleChangeType = (key: string, type: DiagnosisType) => {
    setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, type } : e)))
  }

  const handleSave = async (values: any) => {
    if (entries.length === 0) {
      message.warning('Tambahkan minimal 1 diagnosis terlebih dahulu')
      return
    }
    if (!encounterId) return

    try {
      const conditionBatch = createConditionBatch(
        entries.map((e) => ({
          category: CONDITION_CATEGORIES.ENCOUNTER_DIAGNOSIS,
          diagnosisCodeId: e.id,
          clinicalStatus: 'active' as const,
          verificationStatus: VERIFICATION_STATUS_MAP[e.type],
          notes: e.notes,
          recordedDate: values.assessment_date
            ? values.assessment_date.toISOString()
            : dayjs().toISOString()
          // TODO: stage.assessment → ClinicalImpression (Rasional Klinis) belum diimplementasi.
          // Saat sudah ada integrasi Rasional Klinis, tambahkan:
          // stage: [{ assessment: [{ reference: `ClinicalImpression/${rasionalKlinisId}` }] }]
        }))
      )

      await saveMutation.mutateAsync({
        encounterId,
        patientId: String(patientData.patient.id),
        doctorId: Number(values.performerId),
        conditions: conditionBatch as any
      })

      message.success('Diagnosis berhasil disimpan')
    } catch (err: any) {
      console.error(err)
      message.error(err?.message || 'Gagal menyimpan diagnosis')
    }
  }

  // =====================================================
  // Table columns
  // =====================================================

  const columns: ColumnsType<DiagnosisEntry> = [
    {
      title: 'ICD-10',
      dataIndex: 'code',
      key: 'code',
      width: 110
    },
    {
      title: 'Nama Diagnosis',
      dataIndex: 'display',
      key: 'display'
    },
    {
      title: 'Jenis Diagnosis',
      key: 'type',
      width: 180,
      render: (_, record) => (
        <Select
          size="small"
          value={record.type}
          onChange={(val) => handleChangeType(record.key, val)}
          className="w-full"
        >
          <Select.Option value="awal">
            <Tag color="blue">Diagnosis Awal</Tag>
          </Select.Option>
          <Select.Option value="kerja">
            <Tag color="green">Diagnosis Kerja</Tag>
          </Select.Option>
          <Select.Option value="banding">
            <Tag color="orange">Diagnosis Banding</Tag>
          </Select.Option>
        </Select>
      )
    },
    {
      title: 'Status',
      key: 'status',
      width: 130,
      render: (_, record) => {
        const vs = VERIFICATION_STATUS_MAP[record.type]
        if (!vs) return <Tag color="default">—</Tag>
        const label = vs === 'provisional' ? 'Provisional' : 'Differential'
        return <Tag color={vs === 'provisional' ? 'processing' : 'warning'}>{label}</Tag>
      }
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 60,
      align: 'center',
      render: (_, record) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemove(record.key)}
        />
      )
    }
  ]

  // =====================================================
  // Derived data per type
  // =====================================================

  const filteredEntries = entries.filter((e) => e.type === activeType)
  const totalByType = (t: DiagnosisType) => entries.filter((e) => e.type === t).length

  if (!patientData) return null
  if (isLoadingConditions) {
    return (
      <div className="flex justify-center items-center h-48">
        <Spin size="large" tip="Memuat data diagnosis..." />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        className="flex flex-col gap-4"
        initialValues={{ assessment_date: dayjs() }}
      >
        <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />

        {/* Tambah Diagnosis */}
        <Card title="Tambah Diagnosis (ICD-10)">
          <Space direction="vertical" className="w-full" size="middle">
            {/* Pilih jenis diagnosis sebelum menambah */}
            <div>
              <div className="text-sm text-gray-500 mb-2">Jenis diagnosis yang akan ditambah:</div>
              <Segmented
                value={activeType}
                onChange={(v) => setActiveType(v as DiagnosisType)}
                options={[
                  {
                    label: (
                      <span>
                        Diagnosis Awal{' '}
                        {totalByType('awal') > 0 && <Tag color="blue">{totalByType('awal')}</Tag>}
                      </span>
                    ),
                    value: 'awal'
                  },
                  {
                    label: (
                      <span>
                        Diagnosis Kerja{' '}
                        {totalByType('kerja') > 0 && (
                          <Tag color="green">{totalByType('kerja')}</Tag>
                        )}
                      </span>
                    ),
                    value: 'kerja'
                  },
                  {
                    label: (
                      <span>
                        Diagnosis Banding{' '}
                        {totalByType('banding') > 0 && (
                          <Tag color="orange">{totalByType('banding')}</Tag>
                        )}
                      </span>
                    ),
                    value: 'banding'
                  }
                ]}
              />
            </div>

            <Form.Item
              label={`Cari kode ICD-10 untuk ${DIAGNOSIS_TYPE_LABEL[activeType]}`}
              name="diagnosisSearch"
              className="mb-0"
            >
              <AutoComplete
                options={diagnosisOptions.map((d) => ({
                  value: d.id,
                  label: `${d.code} – ${d.id_display || d.display}`
                }))}
                onSearch={(v) => setSearchText(v)}
                onSelect={handleSelect}
                placeholder="Ketik kode ICD-10 atau nama diagnosis (min 2 karakter)"
                className="w-full"
                value={searchText}
                notFoundContent={isLoadingMasterDiagnosis ? <Spin size="small" /> : null}
                suffixIcon={<PlusOutlined />}
              />
            </Form.Item>
          </Space>
        </Card>

        {/* Tabel semua diagnosis */}
        <Card
          title={
            <Space>
              <span>Daftar Diagnosis</span>
              <Tag>{entries.length} total</Tag>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={filteredEntries}
            pagination={false}
            size="small"
            locale={{
              emptyText: `Belum ada ${DIAGNOSIS_TYPE_LABEL[activeType]}. Cari dan tambahkan di atas.`
            }}
            footer={() =>
              entries.length > 0 ? (
                <div className="flex gap-3 text-sm text-gray-500">
                  <span>
                    <Tag color="blue">{totalByType('awal')}</Tag> Diagnosis Awal
                  </span>
                  <span>
                    <Tag color="green">{totalByType('kerja')}</Tag> Diagnosis Kerja
                  </span>
                  <span>
                    <Tag color="orange">{totalByType('banding')}</Tag> Diagnosis Banding
                  </span>
                </div>
              ) : null
            }
          />
        </Card>

        <Form.Item className="mb-0">
          <div className="flex justify-end">
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              size="large"
              loading={saveMutation.isPending}
              disabled={entries.length === 0}
            >
              Simpan Diagnosis
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  )
}

export default ConditionDiagnosisForm
