import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, Table, Space, App, Spin, Select } from 'antd'
import { SaveOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { PatientProcedure, PatientWithMedicalRecord } from '../../../../types/doctor.types'
import { saveDiagnosisAndProcedures } from '../../../../services/doctor.service'
import { useConditionByEncounter } from '../../../../hooks/query/use-condition'
import { useProcedureByEncounter } from '../../../../hooks/query/use-procedure'
import { useMasterProcedureList } from '../../../../hooks/query/use-master-procedure'
import { PROCEDURE_MAP } from '../../../../config/maps/procedure-maps'
import { DIAGNOSIS_MAP } from '../../../../config/maps/condition-maps'
import { AssessmentHeader } from '../AssesmentHeader/AssessmentHeader'
import { usePerformers } from '@renderer/hooks/query/use-performers'

const { Option } = Select

interface MedicalProcedure {
  id: string
  code: string
  name: string
  display: string
  id_display: string
  system: string
  url: string
  status: string
}

interface ProcedureTableData extends PatientProcedure {
  key: string
}

interface EducationFormProps {
  encounterId: string
  patientData: PatientWithMedicalRecord
}

export const EducationForm = ({ encounterId, patientData }: EducationFormProps) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const { data: conditionsData } = useConditionByEncounter(encounterId)
  const { data: proceduresData, isLoading: isLoadingProcedures } =
    useProcedureByEncounter(encounterId)

  const [procedureOptions, setProcedureOptions] = useState<MedicalProcedure[]>([])
  const [selectedProcedures, setSelectedProcedures] = useState<ProcedureTableData[]>([])
  const [procedureSearch, setProcedureSearch] = useState('')
  const [debouncedProcedureSearch, setDebouncedProcedureSearch] = useState('')

  const { data: masterProcedures, isLoading: isLoadingMasterProcedures } = useMasterProcedureList({
    q: debouncedProcedureSearch,
    items: 20
  })
  const { data: performersData, isLoading: isLoadingPerformers } = usePerformers(['doctor'])

  useEffect(() => {
    if (masterProcedures) {
      setProcedureOptions(masterProcedures as unknown as MedicalProcedure[])
    } else {
      setProcedureOptions([])
    }
  }, [masterProcedures])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedProcedureSearch(procedureSearch), 500)
    return () => clearTimeout(timer)
  }, [procedureSearch])

  useEffect(() => {
    if (proceduresData?.result && Array.isArray(proceduresData.result)) {
      const mappedProcedures: ProcedureTableData[] = proceduresData.result.map((proc: any) => {
        const codeCoding = proc.codeCoding?.[0]
        const procedureCode = codeCoding?.procedureCode
        return {
          key: `proc-${proc.id}`,
          procedure: {
            id: procedureCode?.id
              ? String(procedureCode.id)
              : codeCoding?.procedureCodeId
                ? String(codeCoding.procedureCodeId)
                : '',
            code: procedureCode?.code || codeCoding?.code || '',
            name: procedureCode?.name || procedureCode?.display || '',
            system: PROCEDURE_MAP[proc.category] || proc.category || procedureCode?.system || '',
            icd9Code: procedureCode?.code
          },
          notes: proc.notes?.[0]?.text || '',
          performedAt: proc.performedDateTime || new Date().toISOString()
        }
      })

      if (mappedProcedures.length > 0) {
        setSelectedProcedures(mappedProcedures)
      }
    }
  }, [proceduresData])

  const handleAddProcedure = (procedureId: string) => {
    const procedure = procedureOptions.find((p) => p.id === procedureId)
    if (!procedure) return

    if (selectedProcedures.find((p) => p.procedure.code === procedure.code)) {
      message.warning('Edukasi ini sudah ditambahkan')
      return
    }

    const newProcedure: ProcedureTableData = {
      key: `proc-${Date.now()}`,
      procedure: {
        id: procedure.id,
        code: procedure.code,
        name: procedure.id_display || procedure.display || procedure.name,
        system: PROCEDURE_MAP[procedure.system] || procedure.system,
        icd9Code: procedure.code
      },
      performedAt: new Date().toISOString()
    }

    setSelectedProcedures([...selectedProcedures, newProcedure])
    setProcedureSearch('')
    form.setFieldValue('procedureSearch', undefined)
  }

  const handleRemoveProcedure = (key: string) => {
    setSelectedProcedures(selectedProcedures.filter((p) => p.key !== key))
  }

  const handleProcedureNotesChange = (key: string, notes: string) => {
    setSelectedProcedures(selectedProcedures.map((p) => (p.key === key ? { ...p, notes } : p)))
  }

  // Ambil diagnosis yang ada untuk dikirim bersamaan (agar tidak ditimpa kosong)
  const getCurrentDiagnoses = () => {
    if (!conditionsData?.result || !Array.isArray(conditionsData.result)) return []
    return conditionsData.result
      .filter((cond: any) => {
        const category = cond.categories?.[0]?.code
        return !['complaint', 'history', 'anamnesis'].includes(category)
      })
      .map((cond: any) => {
        const codeCoding = cond.codeCoding?.[0]
        const diagnosisCode = codeCoding?.diagnosisCode
        return {
          key: `dx-${cond.id}`,
          diagnosisCode: {
            id: diagnosisCode?.id ? String(diagnosisCode.id) : '',
            code: diagnosisCode?.code || codeCoding?.code || '',
            name: diagnosisCode?.name || diagnosisCode?.display || '',
            category: DIAGNOSIS_MAP[cond.categories?.[0]?.code] || cond.categories?.[0]?.code || ''
          },
          isPrimary: codeCoding?.isPrimary || false,
          diagnosedAt: cond.recordedDate || new Date().toISOString()
        }
      })
  }

  const onFinish = async (values: any) => {
    setSubmitting(true)
    try {
      const response = await saveDiagnosisAndProcedures({
        encounterId,
        patientId: patientData?.patient.id,
        diagnoses: getCurrentDiagnoses(),
        procedures: selectedProcedures,
        assessmentDate: values.assessment_date?.toISOString(),
        doctorId: values.performerId
      })

      if (response.success) {
        message.success('Edukasi berhasil disimpan')
        const { queryClient } = await import('@renderer/query-client')
        queryClient.invalidateQueries({ queryKey: ['procedure', 'by-encounter', encounterId] })
        queryClient.invalidateQueries({ queryKey: ['encounter', 'detail', encounterId] })
        form.setFieldValue('assessment_date', dayjs())
      } else {
        message.error(response.message)
      }
    } catch (error) {
      message.error('Gagal menyimpan edukasi')
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  const procedureColumns: ColumnsType<ProcedureTableData> = [
    {
      title: 'Nama Edukasi',
      dataIndex: ['procedure', 'name'],
      key: 'name',
      width: 250
    },
    {
      title: 'System',
      dataIndex: ['procedure', 'system'],
      key: 'system',
      width: 120
    },
    {
      title: 'Catatan (Wajib Diisi)',
      key: 'notes',
      render: (_, record) => (
        <Input.TextArea
          rows={1}
          placeholder="Tambahkan detail edukasi yang diberikan..."
          value={record.notes}
          onChange={(e) => handleProcedureNotesChange(record.key, e.target.value)}
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
          onClick={() => handleRemoveProcedure(record.key)}
        />
      )
    }
  ]

  if (!patientData) return null

  if (isLoadingProcedures) {
    return (
      <div className="flex justify-center items-center h-48">
        <Spin size="large" tip="Memuat data edukasi..." />
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

      <Card title="Edukasi Pasien & Keluarga">
        <Space direction="vertical" className="w-full" size="large">
          <Form.Item label="Cari dan Tambah Edukasi" name="procedureSearch">
            <Select
              showSearch
              placeholder="Ketik kode atau nama edukasi"
              onSearch={(v) => setProcedureSearch(v)}
              onSelect={handleAddProcedure}
              filterOption={false}
              className="w-full"
              value={procedureSearch}
              defaultActiveFirstOption={true}
              notFoundContent={isLoadingMasterProcedures ? <Spin size="small" /> : null}
              allowClear
            >
              {procedureOptions.slice(0, procedureSearch.length > 0 ? 20 : 5).map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.code} - {p.id_display || p.display}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Table
            columns={procedureColumns}
            dataSource={selectedProcedures}
            pagination={false}
            locale={{ emptyText: 'Belum ada edukasi yang ditambahkan (opsional)' }}
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
            Simpan Edukasi
          </Button>
        </div>
      </Form.Item>
    </Form>
  )
}

export default EducationForm
