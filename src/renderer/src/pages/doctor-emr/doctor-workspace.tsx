import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import { App, Card, Tabs, Spin, Empty, Button, Row, Col, Tag, Modal, Select, Collapse } from 'antd'
import {
  ArrowLeftOutlined,
  MedicineBoxOutlined,
  FileTextOutlined,
  SolutionOutlined,
  FormOutlined,
  ExperimentOutlined,
  FileSearchOutlined,
  EditOutlined,
  ExportOutlined,
  LockOutlined,
  MonitorOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons'
import { NurseAssessmentSummary } from '@renderer/components/organisms/NurseAssessmentSummary'
import { ClinicalAnnotationForm } from '@renderer/components/organisms/ClinicalAnnotationForm'

import { DiagnosisProceduresForm } from '@renderer/components/organisms/DiagnosisProceduresForm'
import { PrescriptionForm } from '@renderer/components/organisms/PrescriptionForm'
import { CPPTForm } from '@renderer/components/organisms/CPPTForm'
import { LabRadOrderForm } from '@renderer/components/organisms/LabRadOrderForm'
import { DiagnosticResultViewer } from '@renderer/components/organisms/DiagnosticResultViewer'
import { ClinicalNoteForm } from '@renderer/components/organisms/ClinicalNoteForm'
import { ReferralForm } from '@renderer/components/organisms/ReferralForm'
import { getPatientMedicalRecord } from '@renderer/services/doctor.service'
import { PatientWithMedicalRecord } from '../../types/doctor.types'
import dayjs from 'dayjs'
import { Gender } from '../../types/nurse.types'

import { useEncounterDetail, useUpdateEncounter } from '@renderer/hooks/query/use-encounter'
import { useObservationByEncounter } from '@renderer/hooks/query/use-observation'
import { useConditionByEncounter } from '@renderer/hooks/query/use-condition'
import { useAllergyByEncounter } from '@renderer/hooks/query/use-allergy'
import { EncounterStatus } from '@shared/encounter'
import { DoctorInpatientWorkspace } from './doctor-inpatient-workspace'
import { InitialAssessmentForm } from '../../components/organisms/Assessment/InitialAssessmentForm'
import { EncounterTimeline } from '../../components/organisms/EncounterTimeline'
import { DentalAssessmentForm } from '../../components/organisms/Assessment/DentalAssessmentForm'

const DoctorWorkspace = () => {
  const { encounterId } = useParams<{ encounterId: string }>()
  const navigate = useNavigate()
  const { message } = App.useApp()

  const [loading, setLoading] = useState(false)
  const [patientData, setPatientData] = useState<PatientWithMedicalRecord | null>(null)
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<EncounterStatus | null>(null)

  const [activeTab, setActiveTab] = useState('1')

  const { data: encounterDetail } = useEncounterDetail(encounterId)
  const updateEncounter = useUpdateEncounter()

  const { data: obsData } = useObservationByEncounter(encounterId || '')
  const { data: condData } = useConditionByEncounter(encounterId || '')
  const { data: allergyData } = useAllergyByEncounter(encounterId || '')

  const hasNurseAssessment =
    (obsData?.result?.all?.length || 0) > 0 || (condData?.result?.length || 0) > 0

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

  const allergies =
    allergyData?.result && Array.isArray(allergyData.result) && allergyData.result.length > 0
      ? allergyData.result
          .map((a: any) => a.note)
          .filter(Boolean)
          .join(', ')
      : '-'

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
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <div className="px-4 pt-4 flex justify-between items-center">
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack} className="mb-4">
          Kembali ke Daftar Pasien
        </Button>
      </div>

      <div className="px-4 py-4">
        <Card className="mb-4">
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

      <div className="flex-1 px-4 pb-4 overflow-hidden relative flex flex-col min-h-0">
        {currentStatus === EncounterStatus.Finished && (
          <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center backdrop-blur-[2px] rounded-lg">
            <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md">
              <LockOutlined className="text-5xl text-red-500 mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Pemeriksaan Selesai</h3>
              <p className="text-gray-600 mb-6">
                Encounter ini telah diselesaikan. Formulir dikunci dan tidak dapat diubah lagi.
              </p>
              <Button
                type="primary"
                onClick={() => {
                  handleBack()
                }}
              >
                Kembali ke Dashboard
              </Button>
            </div>
          </div>
        )}

        {encounterDetail?.data?.class?.code === 'IMP' ? (
          <DoctorInpatientWorkspace encounterId={encounterId || ''} patientData={patientData} />
        ) : (
          <Card
            className="shadow-sm rounded-lg flex-1 flex flex-col min-h-0 overflow-hidden bg-white"
            bordered={false}
            bodyStyle={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              padding: 0
            }}
          >
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              type="card"
              size="large"
              className="h-full flex flex-col"
              items={[
                {
                  key: '0',
                  label: (
                    <span className="px-4">
                      <MonitorOutlined />
                      Ringkasan & Timeline
                    </span>
                  ),
                  children: (
                    <div className="p-4 overflow-y-auto h-[calc(100vh-380px)]">
                      <EncounterTimeline encounterId={encounterId || ''} />
                    </div>
                  )
                },
                {
                  key: '1',
                  label: (
                    <span className="px-4">
                      <SolutionOutlined />
                      Anamnesis & Pemeriksaan Fisik
                    </span>
                  ),
                  children: (
                    <div className="p-4 overflow-y-auto h-[calc(100vh-380px)] space-y-4">
                      {hasNurseAssessment && (
                        <div className="mb-4">
                          <Collapse
                            ghost
                            items={[
                              {
                                key: 'nurse-summary',
                                label: (
                                  <div className="flex items-center gap-2 text-blue-600 font-medium">
                                    <SolutionOutlined />
                                    <span>Lihat Hasil Pemeriksaan Awal Perawat</span>
                                  </div>
                                ),
                                children: (
                                  <NurseAssessmentSummary
                                    encounterId={encounterId || ''}
                                    patientId={patientData?.patient.id}
                                    mode="outpatient"
                                  />
                                )
                              }
                            ]}
                          />
                        </div>
                      )}

                      <div className="mb-6">
                        <InitialAssessmentForm
                          encounterId={encounterId!}
                          patientData={patientData}
                          mode="outpatient"
                          performer={{
                            id: (patientData as any).doctorId || 'doc-default',
                            name: (patientData as any).doctorName || 'Dokter',
                            role: 'Doctor'
                          }}
                        />
                      </div>
                      <div />
                    </div>
                  )
                },
                {
                  key: '1.5',
                  label: (
                    <span className="px-4">
                      <SafetyCertificateOutlined />
                      Pemeriksaan Gigi (Odontogram)
                    </span>
                  ),
                  children: (
                    <div className="p-4 overflow-y-auto h-[calc(100vh-380px)]">
                      <DentalAssessmentForm encounterId={encounterId!} patientData={patientData} />
                    </div>
                  )
                },
                {
                  key: '2',
                  label: (
                    <span className="px-4">
                      <FileTextOutlined />
                      Diagnosis & Tindakan (CPPT)
                    </span>
                  ),
                  children: (
                    <div className="p-4 overflow-y-auto h-[calc(100vh-280px)]">
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
                    <span className="px-4">
                      <MedicineBoxOutlined />
                      E-Resep
                    </span>
                  ),
                  children: (
                    <div className="p-4 overflow-y-auto h-[calc(100vh-280px)]">
                      <PrescriptionForm encounterId={encounterId || ''} patientData={patientData} />
                    </div>
                  )
                },
                {
                  key: '4',
                  label: (
                    <span className="px-4">
                      <FormOutlined />
                      CPPT (SOAP)
                    </span>
                  ),
                  children: (
                    <div className="p-4 overflow-y-auto h-[calc(100vh-280px)]">
                      <CPPTForm encounterId={encounterId || ''} patientData={patientData} />
                    </div>
                  )
                },
                {
                  key: '5',
                  label: (
                    <span className="px-4">
                      <ExperimentOutlined />
                      Lab & Radiologi
                    </span>
                  ),
                  children: (
                    <div className="p-4 overflow-y-auto h-[calc(100vh-280px)]">
                      <LabRadOrderForm encounterId={encounterId || ''} patientData={patientData} />
                    </div>
                  )
                },
                {
                  key: '6',
                  label: (
                    <span className="px-4">
                      <FileSearchOutlined />
                      Hasil Penunjang
                    </span>
                  ),
                  children: (
                    <div className="p-4 overflow-y-auto h-[calc(100vh-280px)]">
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
                    <span className="px-4">
                      <ExportOutlined />
                      Rujukan
                    </span>
                  ),
                  children: (
                    <div className="p-4 overflow-y-auto h-[calc(100vh-280px)]">
                      <ReferralForm
                        encounterId={encounterId || ''}
                        patientId={patientData.patient.id}
                        patientData={patientData}
                      />
                    </div>
                  )
                },
                {
                  key: '9',
                  label: (
                    <span className="px-4">
                      <FormOutlined />
                      Catatan Tambahan
                    </span>
                  ),
                  children: (
                    <div className="p-4 overflow-y-auto h-[calc(100vh-280px)]">
                      <ClinicalNoteForm encounterId={encounterId || ''} />
                    </div>
                  )
                }
              ]}
            />
          </Card>
        )}
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
    </div>
  )
}

export default DoctorWorkspace
