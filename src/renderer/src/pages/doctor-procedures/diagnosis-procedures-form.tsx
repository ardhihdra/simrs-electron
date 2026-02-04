import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, Table, Space, App, Spin, AutoComplete, Checkbox } from 'antd'
import { SaveOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  PatientDiagnosis,
  PatientProcedure,
  PatientWithMedicalRecord
} from '../../types/doctor.types'
import { saveDiagnosisAndProcedures } from '../../services/doctor.service'
import { useConditionByEncounter } from '../../hooks/query/use-condition'
import { useProcedureByEncounter } from '../../hooks/query/use-procedure'
import { useClinicalNoteByEncounter } from '../../hooks/query/use-clinical-note'

const { TextArea } = Input

interface DiagnosisCode {
  id: string
  code: string
  display: string
  id_display: string
  system: string
  url: string
}

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

interface DiagnosisTableData extends PatientDiagnosis {
  key: string
}

interface ProcedureTableData extends PatientProcedure {
  key: string
}

interface DiagnosisProceduresFormProps {
  encounterId: string
  patientData: PatientWithMedicalRecord
}

export const DiagnosisProceduresForm = ({
  encounterId,
  patientData
}: DiagnosisProceduresFormProps) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const [submitting, setSubmitting] = useState(false)

  // Fetch existing data
  const { data: conditionsData, isLoading: isLoadingConditions } =
    useConditionByEncounter(encounterId)
  const { data: proceduresData, isLoading: isLoadingProcedures } =
    useProcedureByEncounter(encounterId)
  const { data: clinicalNotesData } = useClinicalNoteByEncounter(encounterId)

  const [diagnosisOptions, setDiagnosisOptions] = useState<DiagnosisCode[]>([])
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<DiagnosisTableData[]>([])
  const [diagnosisSearch, setDiagnosisSearch] = useState('')
  const [searchingDiagnosis, setSearchingDiagnosis] = useState(false)

  const [procedureOptions, setProcedureOptions] = useState<MedicalProcedure[]>([])
  const [selectedProcedures, setSelectedProcedures] = useState<ProcedureTableData[]>([])
  const [procedureSearch, setProcedureSearch] = useState('')
  const [searchingProcedure, setSearchingProcedure] = useState(false)

  // Populate form with existing data
  useEffect(() => {
    if (conditionsData?.result && Array.isArray(conditionsData.result)) {
      const mappedDiagnoses: DiagnosisTableData[] = conditionsData.result.map((cond: any) => {
        // Find existing code details from codeCoding
        const codeCoding = cond.codeCoding?.[0]
        const diagnosisCode = codeCoding?.diagnosisCode

        return {
          key: `dx-${cond.id}`, // Use actual ID from DB
          diagnosisCode: {
            id: diagnosisCode?.id ? String(diagnosisCode.id) : '',
            code: diagnosisCode?.code || codeCoding?.code || '',
            name: diagnosisCode?.name || diagnosisCode?.display || '',
            category: cond.categories?.[0]?.code || ''
          },
          isPrimary: codeCoding?.isPrimary || false,
          diagnosedAt: cond.recordedDate || new Date().toISOString()
        }
      })

      // Only set if we have data to avoid overwriting empty state on initial load if API is slow but empty
      if (mappedDiagnoses.length > 0) {
        setSelectedDiagnoses(mappedDiagnoses)
      }
    }
  }, [conditionsData])

  useEffect(() => {
    if (proceduresData?.result && Array.isArray(proceduresData.result)) {
      const mappedProcedures: ProcedureTableData[] = proceduresData.result.map((proc: any) => {
        const codeCoding = proc.codeCoding?.[0]
        const procedureCode = codeCoding?.procedureCode
        const notes = proc.notes?.[0]?.text || ''

        return {
          key: `proc-${proc.id}`,
          procedure: {
            id: procedureCode?.id ? String(procedureCode.id) : '',
            code: procedureCode?.code || codeCoding?.code || '',
            name: procedureCode?.name || procedureCode?.display || '',
            category: procedureCode?.system || '',
            icd9Code: procedureCode?.code
          },
          notes: notes,
          performedAt: proc.performedDateTime || new Date().toISOString()
        }
      })

      if (mappedProcedures.length > 0) {
        setSelectedProcedures(mappedProcedures)
      }
    }
  }, [proceduresData])

  // Populate Clinical Notes
  useEffect(() => {
    if (clinicalNotesData?.result && Array.isArray(clinicalNotesData.result)) {
      const notes = clinicalNotesData.result as any[]

      // Find latest progress note
      const progressNote = notes.find((n) => n.noteType === 'progress')
      // Find latest discharge note (referral)
      const referralNote = notes.find((n) => n.noteType === 'discharge')

      if (progressNote) {
        form.setFieldValue('clinicalNotes', progressNote.noteText)
      }
      if (referralNote) {
        form.setFieldValue('referralNotes', referralNote.noteText)
      }
    }
  }, [clinicalNotesData, form])

  const searchProcedures = async (value: string) => {
    if (value.length >= 2) {
      setSearchingProcedure(true)
      try {
        const fn = window.api?.query?.masterProcedure?.list
        if (!fn) {
          console.error('masterProcedure API not available')
          throw new Error('API master procedure tidak tersedia')
        }

        const response = await fn({
          search: value,
          items: 20
        })

        if (response.success) {
          const resultArray = Object.entries(response)
            .filter(([key]) => !isNaN(Number(key)))
            .map(([, value]) => value)
            .filter((item) => typeof item === 'object' && item !== null)

          const procedures: MedicalProcedure[] = resultArray.map((proc: any) => ({
            id: String(proc.id),
            code: proc.code,
            name: proc.name || proc.display,
            display: proc.display,
            id_display: proc.id_display,
            system: proc.system,
            url: proc.url,
            status: proc.status
          }))
          setProcedureOptions(procedures)
        }
      } catch (error) {
        console.error('Error searching procedures:', error)
      } finally {
        setSearchingProcedure(false)
      }
    } else {
      setProcedureOptions([])
    }
  }

  const debounce = <T extends (...args: any[]) => any>(func: T, delay: number) => {
    let timeoutId: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  }

  const searchDiagnosis = async (value: string) => {
    if (value.length >= 2) {
      setSearchingDiagnosis(true)
      try {
        const fn = window.api?.query?.diagnosisCode?.list
        if (!fn) {
          console.error('diagnosisCode API not available')
          throw new Error('API diagnosis code tidak tersedia')
        }

        const response = await fn({
          search: value,
          items: 20
        })

        if (response.success) {
          const resultArray = Object.entries(response)
            .filter(([key]) => !isNaN(Number(key)))
            .map(([, value]) => value)
            .filter((item) => typeof item === 'object' && item !== null)

          const codes: DiagnosisCode[] = resultArray.map((dx: any) => ({
            id: String(dx.id),
            code: dx.code,
            display: dx.display,
            id_display: dx.id_display,
            system: dx.system,
            url: dx.url
          }))
          setDiagnosisOptions(codes)
        }
      } catch (error) {
        console.error('Error searching diagnosis:', error)
      } finally {
        setSearchingDiagnosis(false)
      }
    } else {
      setDiagnosisOptions([])
    }
  }

  const debouncedSearchDiagnosis = debounce(searchDiagnosis, 500)
  const debouncedSearchProcedures = debounce(searchProcedures, 500)

  const handleDiagnosisSearch = (value: string) => {
    setDiagnosisSearch(value)
    debouncedSearchDiagnosis(value)
  }

  const handleProcedureSearch = (value: string) => {
    setProcedureSearch(value)
    debouncedSearchProcedures(value)
  }

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
        name: diagnosis.display,
        category: diagnosis.system
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
    const updated = selectedDiagnoses.map((d) => ({
      ...d,
      isPrimary: d.key === key
    }))
    setSelectedDiagnoses(updated)
  }

  const handleAddProcedure = (procedureId: string) => {
    const procedure = procedureOptions.find((p) => p.id === procedureId)
    if (!procedure) return

    if (selectedProcedures.find((p) => p.procedure.code === procedure.code)) {
      message.warning('Tindakan ini sudah ditambahkan')
      return
    }

    const newProcedure: ProcedureTableData = {
      key: `proc-${Date.now()}`,
      procedure: {
        id: procedure.id,
        code: procedure.code,
        name: procedure.name,
        category: procedure.system,
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
    const updated = selectedProcedures.map((p) => (p.key === key ? { ...p, notes } : p))
    setSelectedProcedures(updated)
  }

  const onFinish = async (values: { clinicalNotes?: string; referralNotes?: string }) => {
    if (selectedDiagnoses.length === 0) {
      message.error('Minimal harus ada 1 diagnosis')
      return
    }

    if (!encounterId) return

    setSubmitting(true)
    try {
      const response = await saveDiagnosisAndProcedures({
        encounterId,
        patientId: patientData?.patient.id, // Explicitly pass patientId
        diagnoses: selectedDiagnoses,
        procedures: selectedProcedures,
        clinicalNotes: values.clinicalNotes,
        referralNotes: values.referralNotes
      })

      if (response.success) {
        message.success('Data diagnosis dan tindakan berhasil disimpan')
      } else {
        message.error(response.message)
      }
    } catch (error) {
      message.error('Gagal menyimpan data')
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  const diagnosisColumns: ColumnsType<DiagnosisTableData> = [
    {
      title: 'Kode ICD-10',
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
      title: 'Kategori',
      dataIndex: ['diagnosisCode', 'category'],
      key: 'category',
      width: 150
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

  const procedureColumns: ColumnsType<ProcedureTableData> = [
    {
      title: 'Kode',
      dataIndex: ['procedure', 'code'],
      key: 'code',
      width: 100
    },
    {
      title: 'ICD-9-CM',
      dataIndex: ['procedure', 'icd9Code'],
      key: 'icd9Code',
      width: 100,
      render: (code: string | undefined) => code || '-'
    },
    {
      title: 'Nama Tindakan',
      dataIndex: ['procedure', 'name'],
      key: 'name',
      width: 250
    },
    {
      title: 'Kategori',
      dataIndex: ['procedure', 'category'],
      key: 'category',
      width: 120
    },
    {
      title: 'Catatan',
      key: 'notes',
      render: (_, record) => (
        <Input.TextArea
          rows={1}
          placeholder="Tambahkan catatan..."
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

  if (!patientData) {
    return null
  }

  // Show loading during initial data fetch
  if (isLoadingConditions || isLoadingProcedures) {
    return (
      <div className="flex justify-center items-center h-48">
        <Spin size="large" tip="Memuat data diagnosa dan tindakan..." />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Form form={form} layout="vertical" onFinish={onFinish} className="flex flex-col gap-4">
        <Card title="Diagnosis (ICD-10)">
          <Space direction="vertical" className="w-full" size="large">
            <div>
              <Form.Item label="Cari dan Tambah Diagnosis" name="diagnosisSearch">
                <AutoComplete
                  options={diagnosisOptions.map((d) => ({
                    value: d.id,
                    label: `${d.code} - ${d.id_display || d.display}`
                  }))}
                  onSearch={handleDiagnosisSearch}
                  onSelect={handleAddDiagnosis}
                  placeholder="Ketik kode ICD-10 atau nama diagnosis (min 2 karakter)"
                  className="w-full"
                  value={diagnosisSearch}
                  notFoundContent={searchingDiagnosis ? <Spin size="small" /> : null}
                />
              </Form.Item>
            </div>

            <Table
              columns={diagnosisColumns}
              dataSource={selectedDiagnoses}
              pagination={false}
              locale={{ emptyText: 'Belum ada diagnosis. Tambahkan minimal 1 diagnosis.' }}
            />
          </Space>
        </Card>

        <Card title="Tindakan Medis (ICD-9-CM)">
          <Space direction="vertical" className="w-full" size="large">
            <Form.Item label="Cari dan Tambah Tindakan" name="procedureSearch">
              <AutoComplete
                options={(() => {
                  const opts = procedureOptions.map((p) => ({
                    value: p.id,
                    label: `${p.code} - ${p.id_display || p.display}`
                  }))
                  return opts
                })()}
                onSearch={handleProcedureSearch}
                onSelect={handleAddProcedure}
                placeholder="Ketik kode ICD-9 atau nama tindakan (min 2 karakter)"
                className="w-full"
                value={procedureSearch}
                notFoundContent={searchingProcedure ? <Spin size="small" /> : null}
              />
            </Form.Item>

            <Table
              columns={procedureColumns}
              dataSource={selectedProcedures}
              pagination={false}
              locale={{ emptyText: 'Belum ada tindakan (opsional)' }}
            />
          </Space>
        </Card>

        <Card title="Catatan Tambahan">
          <Form.Item label="Catatan Klinis" name="clinicalNotes">
            <TextArea rows={4} placeholder="Catatan tambahan dokter..." />
          </Form.Item>

          <Form.Item label="Catatan Rujukan" name="referralNotes">
            <TextArea rows={3} placeholder="Catatan untuk rujukan (jika ada)..." />
          </Form.Item>
        </Card>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              size="large"
              loading={submitting}
            >
              Simpan Tindakan
            </Button>
            {/* Remove cancel functionality inside workspace, simple reset maybe? or nothing. Keeping cancel button but doing nothing for now or reload */}
          </Space>
        </Form.Item>
      </Form>
    </div>
  )
}

export default DiagnosisProceduresForm
