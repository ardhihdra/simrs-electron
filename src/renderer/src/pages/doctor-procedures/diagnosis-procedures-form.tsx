import { useState, useEffect } from 'react'
import {
  Form,
  Input,
  Button,
  Card,
  Table,
  Space,
  App,
  Spin,
  Select,
  AutoComplete,
  Checkbox,
  Row,
  Col
} from 'antd'
import { SaveOutlined, DeleteOutlined, PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router'
import type { ColumnsType } from 'antd/es/table'
import {
  DiagnosisCode,
  MedicalProcedure,
  PatientDiagnosis,
  PatientProcedure,
  PatientWithMedicalRecord
} from '../../types/doctor.types'
import {
  getPatientMedicalRecord,
  searchDiagnosisCodes,
  searchMedicalProcedures,
  saveDiagnosisAndProcedures
} from '../../services/doctor.service'

const { TextArea } = Input
const { Option } = Select

interface DiagnosisTableData extends PatientDiagnosis {
  key: string
}

interface ProcedureTableData extends PatientProcedure {
  key: string
}

const DiagnosisProceduresForm = () => {
  const navigate = useNavigate()
  const { encounterId } = useParams<{ encounterId: string }>()
  const { message, modal } = App.useApp()
  const [form] = Form.useForm()

  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [patientData, setPatientData] = useState<PatientWithMedicalRecord | null>(null)

  // Diagnosis states
  const [diagnosisOptions, setDiagnosisOptions] = useState<DiagnosisCode[]>([])
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<DiagnosisTableData[]>([])
  const [diagnosisSearch, setDiagnosisSearch] = useState('')

  // Procedure states
  const [procedureOptions, setProcedureOptions] = useState<MedicalProcedure[]>([])
  const [selectedProcedures, setSelectedProcedures] = useState<ProcedureTableData[]>([])

  useEffect(() => {
    loadPatientData()
    loadProcedures()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encounterId])

  const loadPatientData = async () => {
    if (!encounterId) return

    setLoading(true)
    try {
      const data = await getPatientMedicalRecord(encounterId)
      if (data) {
        setPatientData(data)
      } else {
        message.error('Data pasien tidak ditemukan')
        navigate('/dashboard/doctor-medical-records')
      }
    } catch (error) {
      message.error('Gagal memuat data pasien')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadProcedures = async () => {
    try {
      const procedures = await searchMedicalProcedures('')
      setProcedureOptions(procedures)
    } catch (error) {
      console.error('Error loading procedures:', error)
    }
  }

  const handleDiagnosisSearch = async (value: string) => {
    setDiagnosisSearch(value)
    if (value.length >= 2) {
      const results = await searchDiagnosisCodes(value)
      setDiagnosisOptions(results)
    }
  }

  const handleAddDiagnosis = (value: string) => {
    const diagnosis = diagnosisOptions.find((d) => d.id === value)
    if (!diagnosis) return

    // Check if already added
    if (selectedDiagnoses.find((d) => d.diagnosisCode.id === diagnosis.id)) {
      message.warning('Diagnosis ini sudah ditambahkan')
      return
    }

    const newDiagnosis: DiagnosisTableData = {
      key: `dx-${Date.now()}`,
      diagnosisCode: diagnosis,
      isPrimary: selectedDiagnoses.length === 0, // First one is primary
      diagnosedAt: new Date().toISOString()
    }

    setSelectedDiagnoses([...selectedDiagnoses, newDiagnosis])
    setDiagnosisSearch('')
    form.setFieldValue('diagnosisSearch', undefined)
  }

  const handleRemoveDiagnosis = (key: string) => {
    const updated = selectedDiagnoses.filter((d) => d.key !== key)
    // If removed was primary and there are others, make first one primary
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

    // Check if already added
    if (selectedProcedures.find((p) => p.procedure.id === procedure.id)) {
      message.warning('Tindakan ini sudah ditambahkan')
      return
    }

    const newProcedure: ProcedureTableData = {
      key: `proc-${Date.now()}`,
      procedure,
      performedAt: new Date().toISOString()
    }

    setSelectedProcedures([...selectedProcedures, newProcedure])
    form.setFieldValue('procedureSelect', undefined)
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
        diagnoses: selectedDiagnoses,
        procedures: selectedProcedures,
        clinicalNotes: values.clinicalNotes,
        referralNotes: values.referralNotes
      })

      if (response.success) {
        modal.success({
          title: 'Berhasil!',
          content:
            'Data diagnosis dan tindakan berhasil disimpan. Pasien dapat mengambil surat rujukan di konter pelayanan.',
          onOk: () => {
            // Option to continue to prescription
            modal.confirm({
              title: 'Lanjut ke Resep?',
              content: 'Apakah Anda ingin melanjutkan untuk membuat resep?',
              okText: 'Ya, Lanjut',
              cancelText: 'Tidak',
              onOk: () => {
                navigate(`/dashboard/doctor-prescription/${encounterId}`)
              },
              onCancel: () => {
                navigate('/dashboard/doctor-medical-records')
              }
            })
          }
        })
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    )
  }

  if (!patientData) {
    return null
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(`/dashboard/doctor-medical-records/detail/${encounterId}`)}
        className="mb-4"
      >
        Kembali ke Rekam Medis
      </Button>

      {/* Patient Summary Card */}
      <Card className="mb-4" size="small">
        <Row gutter={16}>
          <Col span={4}>
            <div className="text-gray-500 text-xs">No. Antrian</div>
            <div className="text-xl font-bold text-blue-600">{patientData.queueNumber}</div>
          </Col>
          <Col span={5}>
            <div className="text-gray-500 text-xs">No. RM</div>
            <div className="font-semibold">{patientData.patient.medicalRecordNumber}</div>
          </Col>
          <Col span={5}>
            <div className="text-gray-500 text-xs">Nama</div>
            <div className="font-semibold">{patientData.patient.name}</div>
          </Col>
          <Col span={5}>
            <div className="text-gray-500 text-xs">Umur</div>
            <div>{patientData.patient.age} tahun</div>
          </Col>
          <Col span={5}>
            <Button
              type="link"
              size="small"
              onClick={() => navigate(`/dashboard/doctor-medical-records/detail/${encounterId}`)}
            >
              Lihat Rekam Medis Lengkap →
            </Button>
          </Col>
        </Row>
      </Card>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        {/* Diagnosis Section */}
        <Card title="Diagnosis (ICD-10)" className="mb-4">
          <Space direction="vertical" className="w-full" size="large">
            <div>
              <Form.Item label="Cari dan Tambah Diagnosis" name="diagnosisSearch">
                <AutoComplete
                  options={diagnosisOptions.map((d) => ({
                    value: d.id,
                    label: `${d.code} - ${d.name}`
                  }))}
                  onSearch={handleDiagnosisSearch}
                  onSelect={handleAddDiagnosis}
                  placeholder="Ketik kode ICD-10 atau nama diagnosis (min 2 karakter)"
                  className="w-full"
                  value={diagnosisSearch}
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

        {/* Procedures Section */}
        <Card title="Tindakan Medis" className="mb-4">
          <Space direction="vertical" className="w-full" size="large">
            <Form.Item label="Pilih Tindakan" name="procedureSelect">
              <Select
                placeholder="Pilih tindakan medis"
                showSearch
                optionFilterProp="children"
                onSelect={handleAddProcedure}
                suffixIcon={<PlusOutlined />}
              >
                {procedureOptions.map((proc) => (
                  <Option key={proc.id} value={proc.id}>
                    {proc.code} {proc.icd9Code ? `[${proc.icd9Code}]` : ''} - {proc.name} (
                    {proc.category})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Table
              columns={procedureColumns}
              dataSource={selectedProcedures}
              pagination={false}
              locale={{ emptyText: 'Belum ada tindakan (opsional)' }}
            />
          </Space>
        </Card>

        {/* Additional Notes */}
        <Card title="Catatan Tambahan" className="mb-4">
          <Form.Item label="Catatan Klinis" name="clinicalNotes">
            <TextArea rows={4} placeholder="Catatan tambahan dokter..." />
          </Form.Item>

          <Form.Item label="Catatan Rujukan" name="referralNotes">
            <TextArea rows={3} placeholder="Catatan untuk rujukan (jika ada)..." />
          </Form.Item>
        </Card>

        {/* Action Buttons */}
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
            <Button
              size="large"
              onClick={() => navigate(`/dashboard/doctor-medical-records/detail/${encounterId}`)}
            >
              Batal
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  )
}

export default DiagnosisProceduresForm
