import { useState, useEffect } from 'react'
import { Form, Button, Card, Table, Space, App, Spin, AutoComplete, Checkbox } from 'antd'
import { SaveOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { PatientDiagnosis, PatientWithMedicalRecord } from '../../../../types/doctor.types'
import { saveDiagnosisAndProcedures } from '../../../../services/doctor.service'
import { useConditionByEncounter } from '../../../../hooks/query/use-condition'
import { useDiagnosisCodeList } from '../../../../hooks/query/use-diagnosis-code'
import { DIAGNOSIS_MAP } from '../../../../config/maps/condition-maps'
import { AssessmentHeader } from '../AssesmentHeader/AssessmentHeader'
import { usePerformers } from '@renderer/hooks/query/use-performers'

interface DiagnosisCode {
  id: string
  code: string
  display: string
  id_display: string
  system: string
  url: string
}

interface DiagnosisTableData extends PatientDiagnosis {
  key: string
}

interface DiagnosisFormProps {
  encounterId: string
  patientData: PatientWithMedicalRecord
}

export const DiagnosisForm = ({ encounterId, patientData }: DiagnosisFormProps) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const { data: conditionsData, isLoading: isLoadingConditions } =
    useConditionByEncounter(encounterId)

  const [diagnosisOptions, setDiagnosisOptions] = useState<DiagnosisCode[]>([])
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<DiagnosisTableData[]>([])
  const [diagnosisSearch, setDiagnosisSearch] = useState('')
  const [debouncedDiagnosisSearch, setDebouncedDiagnosisSearch] = useState('')

  const { data: masterDiagnosis, isLoading: isLoadingMasterDiagnosis } = useDiagnosisCodeList({
    q: debouncedDiagnosisSearch,
    items: 20
  })
  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers(['doctor'])

  useEffect(() => {
    if (debouncedDiagnosisSearch.length >= 2 && masterDiagnosis) {
      setDiagnosisOptions(masterDiagnosis as unknown as DiagnosisCode[])
    } else {
      setDiagnosisOptions([])
    }
  }, [masterDiagnosis, debouncedDiagnosisSearch])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedDiagnosisSearch(diagnosisSearch), 500)
    return () => clearTimeout(timer)
  }, [diagnosisSearch])

  useEffect(() => {
    if (conditionsData?.result && Array.isArray(conditionsData.result)) {
      const mappedDiagnoses: DiagnosisTableData[] = conditionsData.result
        .filter((cond: any) => {
          const category = cond.categories?.[0]?.code
          return category === 'problem-list-item'
        })
        .map((cond: any) => {
          const codeCoding = cond.codeCoding?.[0]
          const diagnosisCode = codeCoding?.diagnosisCode
          return {
            key: `dx-${cond.id}`,
            diagnosisCode: {
              id: diagnosisCode?.id
                ? String(diagnosisCode.id)
                : codeCoding?.diagnosisCodeId
                  ? String(codeCoding.diagnosisCodeId)
                  : '',
              code: diagnosisCode?.code || codeCoding?.code || '',
              name: diagnosisCode?.name || diagnosisCode?.display || '',
              category:
                DIAGNOSIS_MAP[cond.categories?.[0]?.code] || cond.categories?.[0]?.code || ''
            },
            isPrimary: codeCoding?.isPrimary || false,
            diagnosedAt: cond.recordedDate || new Date().toISOString()
          }
        })

      if (mappedDiagnoses.length > 0) {
        setSelectedDiagnoses(mappedDiagnoses)
      }
    }
  }, [conditionsData])

  const handleAddDiagnosis = (value: string) => {
    const diagnosis = diagnosisOptions.find((d) => d.id === value)
    if (!diagnosis) return

    if (selectedDiagnoses.find((d) => d.diagnosisCode.code === diagnosis.code)) {
      message.warning('Diagnosis ini sudah ditambahkan')
      return
    }

    const newDiagnosis: DiagnosisTableData = {
      key: `dx-${Date.now()}`,
      diagnosisCode: {
        id: diagnosis.id,
        code: diagnosis.code,
        name: diagnosis.id_display || diagnosis.display,
        category: DIAGNOSIS_MAP[diagnosis.system] || diagnosis.system
      },
      isPrimary: selectedDiagnoses.length === 0,
      diagnosedAt: new Date().toISOString()
    }

    setSelectedDiagnoses([...selectedDiagnoses, newDiagnosis])
    setDiagnosisSearch('')
    form.setFieldValue('diagnosisSearch', undefined)
  }

  const handleRemoveDiagnosis = (key: string) => {
    const updated = selectedDiagnoses.filter((d) => d.key !== key)
    if (updated.length > 0 && !updated.some((d) => d.isPrimary)) {
      updated[0].isPrimary = true
    }
    setSelectedDiagnoses(updated)
  }

  const handleSetPrimaryDiagnosis = (key: string) => {
    setSelectedDiagnoses(selectedDiagnoses.map((d) => ({ ...d, isPrimary: d.key === key })))
  }

  const onFinish = async (values: any) => {
    if (selectedDiagnoses.length === 0) {
      message.error('Minimal harus ada 1 diagnosis')
      return
    }

    setSubmitting(true)
    try {
      const response = await saveDiagnosisAndProcedures({
        encounterId,
        patientId: patientData?.patient.id,
        diagnoses: selectedDiagnoses,
        procedures: [],
        assessmentDate: values.assessment_date?.toISOString(),
        doctorId: values.performerId
      })

      if (response.success) {
        message.success('Diagnosis berhasil disimpan')
        const { queryClient } = await import('@renderer/query-client')
        queryClient.invalidateQueries({ queryKey: ['condition', 'by-encounter', encounterId] })
        queryClient.invalidateQueries({ queryKey: ['encounter', 'detail', encounterId] })
        form.setFieldValue('assessment_date', dayjs())
      } else {
        message.error(response.message)
      }
    } catch (error) {
      message.error('Gagal menyimpan diagnosis')
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  const diagnosisColumns: ColumnsType<DiagnosisTableData> = [
    {
      title: 'ICD-10',
      dataIndex: ['diagnosisCode', 'code'],
      key: 'code',
      width: 120
    },
    {
      title: 'Nama Diagnosis',
      dataIndex: ['diagnosisCode', 'name'],
      key: 'name'
    },
    {
      title: 'Primary',
      key: 'isPrimary',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Checkbox
          checked={record.isPrimary}
          onChange={() => handleSetPrimaryDiagnosis(record.key)}
        />
      )
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveDiagnosis(record.key)}
        />
      )
    }
  ]

  if (!patientData) return null

  if (isLoadingConditions) {
    return (
      <div className="flex justify-center items-center h-48">
        <Spin size="large" tip="Memuat data diagnosis..." />
      </div>
    )
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      className="flex flex-col gap-4"
      initialValues={{ assessment_date: dayjs() }}
    >
      <AssessmentHeader performers={performersData || []} loading={isLoadingPerformers} />

      <Card title="Diagnosis (ICD-10)">
        <Space direction="vertical" className="w-full" size="large">
          <Form.Item label="Cari dan Tambah Diagnosis" name="diagnosisSearch">
            <AutoComplete
              options={diagnosisOptions.map((d) => ({
                value: d.id,
                label: `${d.code} - ${d.id_display || d.display}`
              }))}
              onSearch={(v) => setDiagnosisSearch(v)}
              onSelect={handleAddDiagnosis}
              placeholder="Ketik kode ICD-10 atau nama diagnosis (min 2 karakter)"
              className="w-full"
              value={diagnosisSearch}
              notFoundContent={isLoadingMasterDiagnosis ? <Spin size="small" /> : null}
            />
          </Form.Item>

          <Table
            columns={diagnosisColumns}
            dataSource={selectedDiagnoses}
            pagination={false}
            locale={{ emptyText: 'Belum ada diagnosis. Tambahkan minimal 1 diagnosis.' }}
          />
        </Space>
      </Card>

      <Form.Item className="mb-0">
        <div className="flex justify-end">
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            size="large"
            loading={submitting}
          >
            Simpan Diagnosis
          </Button>
        </div>
      </Form.Item>
    </Form>
  )
}

export default DiagnosisForm
