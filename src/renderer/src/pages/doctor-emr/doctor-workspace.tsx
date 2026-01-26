import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { App, Card, Tabs, Spin, Empty, Button, Row, Col, Tag, Modal, Select } from 'antd'
import {
  ArrowLeftOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  SolutionOutlined,
  FormOutlined,
  ExperimentOutlined,
  FileSearchOutlined,
  EditOutlined
} from '@ant-design/icons'
import { NurseAssessmentSummary } from '@renderer/components/organisms/NurseAssessmentSummary'
import { HeadToToeForm } from '@renderer/components/organisms/HeadToToeForm'
import { ClinicalAnnotationForm } from '@renderer/components/organisms/ClinicalAnnotationForm'
import { InpatientTimeline } from '@renderer/components/organisms/InpatientTimeline'
import { AssessmentDetailModal } from '@renderer/components/organisms/AssessmentDetailModal'
import { DiagnosisProceduresForm } from '@renderer/components/organisms/DiagnosisProceduresForm'
import { PrescriptionForm } from '@renderer/components/organisms/PrescriptionForm'
import { CPPTForm } from '@renderer/components/organisms/CPPTForm'
import { LabRadOrderForm } from '@renderer/components/organisms/LabRadOrderForm'
import { DiagnosticResultViewer } from '@renderer/components/organisms/DiagnosticResultViewer'
import { ClinicalNoteForm } from '@renderer/components/organisms/ClinicalNoteForm'
import { getPatientMedicalRecord } from '@renderer/services/doctor.service'
import { PatientWithMedicalRecord } from '../../types/doctor.types'
import dayjs from 'dayjs'
import { Gender } from '../../types/nurse.types'

import { useEncounterDetail, useUpdateEncounter } from '@renderer/hooks/query/use-encounter'
import { EncounterStatus } from '@shared/encounter'

const DoctorWorkspace = () => {
  const { encounterId } = useParams<{ encounterId: string }>()
  const navigate = useNavigate()
  const { message } = App.useApp()

  const [loading, setLoading] = useState(false)
  const [patientData, setPatientData] = useState<PatientWithMedicalRecord | null>(null)
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<EncounterStatus | null>(null)

  const [activeTab, setActiveTab] = useState('1')

  const [selectedAssessment, setSelectedAssessment] = useState<any>(null)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)

  const { data: encounterDetail } = useEncounterDetail(encounterId)
  const updateEncounter = useUpdateEncounter()

  const loadData = useCallback(async () => {
    if (!encounterId) return

    setLoading(true)
    try {
      const data = await getPatientMedicalRecord(encounterId)
      if (data) {
        setPatientData(data)
      } else {
        message.error('Data pasien tidak ditemukan')
        navigate('/dashboard/doctor')
      }
    } catch (error) {
      message.error('Gagal memuat data medis pasien')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [encounterId, message, navigate])

  useEffect(() => {
    loadData()
  }, [encounterId, loadData])

  const handleStatusUpdate = () => {
    if (!encounterId || !selectedStatus) return

    updateEncounter.mutate(
      {
        id: encounterId,
        status: selectedStatus,
        patientId: patientData?.patient.id || '',
        visitDate: new Date(),
        serviceType: 'outpatient'
      },
      {
        onSuccess: () => {
          message.success('Status berhasil diperbarui')
          setIsStatusModalVisible(false)
        },
        onError: () => {
          message.error('Gagal memperbarui status')
        }
      }
    )
  }

  const openStatusModal = () => {
    if (encounterDetail?.data?.status) {
      setSelectedStatus(encounterDetail.data.status as EncounterStatus)
    }
    setIsStatusModalVisible(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Spin size="large" tip="Memuat Rekam Medis..." />
      </div>
    )
  }

  if (!patientData) {
    return <Empty description="Data pasien tidak ditemukan" />
  }

  const handleBack = () => {
    navigate('/dashboard/doctor')
  }

  const patient = patientData.patient
  const age = patient.birthDate ? dayjs().diff(dayjs(patient.birthDate), 'year') : 0

  const queueNumber = (patientData as any).queueNumber || Math.floor(Math.random() * 50) + 1
  const poliName = (patientData as any).serviceType || 'Poli Umum'
  const doctorName = (patientData as any).doctorName || 'Dr. Dokter'
  const visitDate = (patientData as any).visitDate
    ? dayjs((patientData as any).visitDate).format('DD MMM YYYY, HH:mm')
    : dayjs().format('DD MMM YYYY, HH:mm')
  const paymentMethod = patientData.paymentMethod || 'Umum'
  const allergies = patientData.nurseRecord?.anamnesis?.allergyHistory || '-'

  const currentStatus = encounterDetail?.data?.status || EncounterStatus.Arrived

  const getStatusColor = (status: string) => {
    switch (status) {
      case EncounterStatus.Planned:
        return 'default'
      case EncounterStatus.Arrived:
        return 'blue'
      case EncounterStatus.Triaged:
        return 'cyan'
      case EncounterStatus.InProgress:
        return 'processing'
      case EncounterStatus.OnHold:
        return 'warning'
      case EncounterStatus.Finished:
        return 'success'
      case EncounterStatus.Cancelled:
        return 'error'
      default:
        return 'default'
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen">
      <div className="px-4 pt-4 flex justify-between items-center">
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack} className="mb-4">
          Kembali ke Daftar Pasien
        </Button>
      </div>

      <div className="px-4 py-4">
        <Card className="mb-4 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold m-0">Informasi Pasien</h3>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Status:</span>
              <Tag color={getStatusColor(currentStatus)} className="mr-0">
                {currentStatus.toUpperCase()}
              </Tag>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={openStatusModal}
                size="small"
                title="Ubah Status"
              />
            </div>
          </div>
          <Row gutter={[16, 16]}>
            <Col span={4}>
              <div className="text-gray-500 text-sm">No. Antrian</div>
              <div className="text-3xl font-bold text-blue-600">{queueNumber}</div>
            </Col>
            <Col span={5}>
              <div className="text-gray-500 text-sm">No. Rekam Medis</div>
              <div className="text-lg font-semibold">{patient.medicalRecordNumber || '-'}</div>
            </Col>
            <Col span={5}>
              <div className="text-gray-500 text-sm">Nama Pasien</div>
              <div className="text-lg font-semibold">{patient.name || 'Unknown'}</div>
            </Col>
            <Col span={5}>
              <div className="text-gray-500 text-sm">Jenis Kelamin / Umur</div>
              <div className="text-lg">
                {patient.gender === Gender.MALE ? 'Laki-laki' : 'Perempuan'} / {age} tahun
              </div>
            </Col>
            <Col span={5}>
              <div className="text-gray-500 text-sm">Tanggal Kunjungan</div>
              <div className="text-lg">{visitDate}</div>
            </Col>
          </Row>
          <Row gutter={[16, 16]} className="mt-4">
            <Col span={4}>
              <div className="text-gray-500 text-sm">Poli</div>
              <div className="text-lg">{poliName}</div>
            </Col>
            <Col span={5}>
              <div className="text-gray-500 text-sm">Dokter</div>
              <div className="text-lg">{doctorName}</div>
            </Col>
            <Col span={5}>
              <div className="text-gray-500 text-sm">Penjamin</div>
              <Tag color="green" className="mt-1">
                {paymentMethod}
              </Tag>
            </Col>
            <Col span={5}>
              <div className="text-gray-500 text-sm">Alergi</div>
              <div className="text-lg">
                {allergies !== '-' ? (
                  <Tag color="red">{allergies}</Tag>
                ) : (
                  <span className="text-gray-400">Tidak ada</span>
                )}
              </div>
            </Col>
            <Col span={5}>
              <div className="text-gray-500 text-sm">NIK</div>
              <div className="text-lg">{patient.identityNumber || '-'}</div>
            </Col>
          </Row>
        </Card>
      </div>

      <div className="px-4 mb-4">
        <InpatientTimeline
          encounterId={encounterId || ''}
          onViewDetail={(time, items) => {
            setSelectedAssessment({ time, items })
            setIsDetailModalVisible(true)
          }}
        />
      </div>

      <div className="flex-1 px-4 pb-4 overflow-auto">
        <Card className="shadow-sm rounded-lg" bordered={false}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            type="card"
            size="large"
            items={[
              {
                key: '1',
                label: (
                  <span>
                    <SolutionOutlined />
                    Anamnesis & Pemeriksaan Fisik
                  </span>
                ),
                children: (
                  <div className="p-4 h-[calc(100vh-250px)] overflow-auto">
                    <div className="mb-6">
                      <NurseAssessmentSummary encounterId={encounterId || ''} />
                    </div>
                    <div className="mb-6">
                      <HeadToToeForm
                        encounterId={encounterId || ''}
                        patientId={patientData?.patient.id}
                      />
                    </div>
                    <div>
                      <ClinicalAnnotationForm
                        encounterId={encounterId || ''}
                        patientId={patientData?.patient.id}
                      />
                    </div>
                  </div>
                )
              },
              {
                key: '2',
                label: (
                  <span>
                    <FileTextOutlined />
                    Diagnosis & Tindakan (CPPT)
                  </span>
                ),
                children: (
                  <div className="p-4">
                    <DiagnosisProceduresForm
                      encounterId={encounterId || ''}
                      patientData={patientData}
                    />
                  </div>
                )
              },
              {
                key: '3',
                label: (
                  <span>
                    <MedicineBoxOutlined />
                    E-Resep
                  </span>
                ),
                children: (
                  <div className="p-4">
                    <PrescriptionForm encounterId={encounterId || ''} patientData={patientData} />
                  </div>
                )
              },
              {
                key: '4',
                label: (
                  <span>
                    <FormOutlined />
                    CPPT (SOAP)
                  </span>
                ),
                children: (
                  <div className="p-4">
                    <CPPTForm encounterId={encounterId || ''} patientData={patientData} />
                  </div>
                )
              },
              {
                key: '5',
                label: (
                  <span>
                    <ExperimentOutlined />
                    Lab & Radiologi
                  </span>
                ),
                children: (
                  <div className="p-4">
                    <LabRadOrderForm encounterId={encounterId || ''} patientData={patientData} />
                  </div>
                )
              },
              {
                key: '6',
                label: (
                  <span>
                    <FileSearchOutlined />
                    Hasil Penunjang
                  </span>
                ),
                children: (
                  <div className="p-4">
                    <DiagnosticResultViewer
                      encounterId={encounterId || ''}
                      patientId={patientData.patient.id}
                    />
                  </div>
                )
              },
              {
                key: '8',
                label: (
                  <span>
                    <FormOutlined />
                    Catatan Tambahan
                  </span>
                ),
                children: (
                  <div className="p-4 h-[600px]">
                    <ClinicalNoteForm encounterId={encounterId || ''} />
                  </div>
                )
              }
            ]}
          />
        </Card>
      </div>

      <Modal
        title="Update Status Encounter"
        open={isStatusModalVisible}
        onOk={handleStatusUpdate}
        onCancel={() => setIsStatusModalVisible(false)}
        confirmLoading={updateEncounter.isPending}
        okText="Simpan"
        cancelText="Batal"
      >
        <div className="py-4">
          <p className="mb-2">Pilih status baru untuk kunjungan ini:</p>
          <Select
            value={selectedStatus}
            onChange={(val) => setSelectedStatus(val as EncounterStatus)}
            style={{ width: '100%' }}
            options={[
              { label: 'Planned', value: EncounterStatus.Planned },
              { label: 'Arrived', value: EncounterStatus.Arrived },
              { label: 'Triaged', value: EncounterStatus.Triaged },
              { label: 'In Progress', value: EncounterStatus.InProgress },
              { label: 'On Hold', value: EncounterStatus.OnHold },
              { label: 'Finished', value: EncounterStatus.Finished },
              { label: 'Cancelled', value: EncounterStatus.Cancelled },
              { label: 'Entered in Error', value: EncounterStatus.EnteredInError }
            ]}
          />
        </div>
      </Modal>
      <AssessmentDetailModal
        visible={isDetailModalVisible}
        onClose={() => setIsDetailModalVisible(false)}
        data={selectedAssessment}
      />
    </div>
  )
}

export default DoctorWorkspace
