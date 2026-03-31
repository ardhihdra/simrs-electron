import { useState, useEffect, useCallback, useMemo } from 'react'
import { App, Spin, Layout, Menu, theme, Input, Modal, Empty, Typography, Button } from 'antd'
import type { MenuProps } from 'antd'
import {
  MonitorOutlined,
  SolutionOutlined,
  FormOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  MedicineBoxOutlined,
  AlertOutlined,
  UserOutlined,
  SearchOutlined,
  SoundOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router'
import { client } from '@renderer/utils/client'
import { PatientQueue } from '@renderer/types/nurse.types'
import { PatientStatus } from '@renderer/types/nurse.types'
import { PatientInfoCard } from '@renderer/components/molecules/PatientInfoCard'
import { InitialAssessmentForm } from '@renderer/components/organisms/Assessment/InitialAssessment/InitialAssessmentForm'
import { GeneralSOAPForm } from '@renderer/components/organisms/Assessment/GeneralSOAP/GeneralSOAPForm'
import { VitalSignsMonitoringForm } from '@renderer/components/organisms/Assessment/VitalSignsMonitoring/VitalSignsMonitoringForm'
import { CPPTForm } from '@renderer/components/organisms/Assessment/CPPT/CPPTForm'
import { TriageForm } from '@renderer/components/organisms/Assessment/Triage/TriageForm'
import { EncounterTimeline } from '@renderer/components/organisms/EncounterTimeline'
import { PatientMedicalHistoryTab } from '@renderer/components/organisms/PatientMedicalHistory/PatientMedicalHistoryTab'
import { useMyProfile } from '@renderer/hooks/useProfile'
import { useEncounterDetail } from '@renderer/hooks/query/use-encounter'

type MenuItem = Required<MenuProps>['items'][number]

const rawatInapMenu: MenuItem[] = [
  {
    key: 'monitoring-ttv',
    icon: <MonitorOutlined />,
    label: 'Monitoring TTV'
  },
  {
    key: 'cppt',
    icon: <SolutionOutlined />,
    label: 'Catatan Perkembangan (CPPT)'
  }
]

const MedicalRecordForm = () => {
  const navigate = useNavigate()
  const { encounterId } = useParams<{ encounterId: string }>()
  const { message, modal } = App.useApp()
  const [collapsed, setCollapsed] = useState(false)
  const [selectedKey, setSelectedKey] = useState('patient-info')
  const [searchText, setSearchText] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalSearch, setModalSearch] = useState('')
  const { token } = theme.useToken()
  const { profile } = useMyProfile()

  const updateStatusMutation = client.registration.updateQueueStatus.useMutation()

  const handleCallToPoli = () => {
    const queueId = patientData?.queueId
    if (!queueId) {
      message.error('ID Antrian tidak ditemukan')
      return
    }

    const isTriage = patientData.status === 'TRIAGE'
    const actionVal = isTriage ? 'TRIAGE_DONE' : 'START_ENCOUNTER'
    const titleText = isTriage
      ? 'Selesai & Pindahkan ke Antrean Poli?'
      : 'Panggil Pasien Masuk Poli?'
    const contentText = isTriage
      ? 'Pemeriksaan awal sudah selesai? Status antrian pasien akan dipindah menjadi "Siap Diperiksa" oleh Dokter.'
      : 'Panggil pasien ini masuk ke ruang Poli? Status antrian akan menjadi "Sedang Diperiksa".'

    modal.confirm({
      title: titleText,
      content: contentText,
      okText: 'Ya, Lanjutkan',
      cancelText: 'Batal',
      onOk: async () => {
        try {
          await updateStatusMutation.mutateAsync({
            queueId,
            action: actionVal
          })
          message.success('Status antrian berhasil diperbarui')
          window.close()
        } catch (error: any) {
          message.error(error.message || 'Gagal memproses antrian')
        }
      }
    })
  }

  const {
    data: encounterResponse,
    isLoading: isEncounterLoading,
    isError
  } = useEncounterDetail(encounterId)

  const patientData = useMemo<PatientQueue | null>(() => {
    const enc = encounterResponse?.result as any
    if (!enc) return null

    const validDate = enc.patient?.birthDate ? new Date(enc.patient.birthDate) : null
    const age = validDate ? new Date().getFullYear() - validDate.getFullYear() : 0

    return {
      id: enc.id,
      encounterId: enc.id,
      queueId: enc.queueTicket?.id,
      queueNumber: enc.queueTicket?.queueNumber || 0,
      patient: {
        id: enc.patient?.id || '',
        name: enc.patient?.name || 'Unknown',
        medicalRecordNumber: enc.patient?.medicalRecordNumber || '',
        gender: (enc.patient?.gender === 'male' ? 'MALE' : 'FEMALE') as any,
        birthDate: enc.patient?.birthDate || '',
        age: age,
        phone: '',
        address: '',
        identityNumber: enc.patient?.nik || ''
      },
      poli: {
        id: enc.queueTicket?.poli?.id?.toString() || '1',
        code: 'POL',
        name: enc.queueTicket?.poli?.name || enc.serviceUnitCodeId || '-'
      },
      doctor: {
        id: enc.queueTicket?.practitioner?.id?.toString() || 'doc1',
        name: enc.queueTicket?.practitioner?.namaLengkap || 'Dr. Umum',
        specialization: 'General',
        sipNumber: enc.queueTicket?.practitioner?.nik || '-'
      },
      status: enc.queueTicket?.status || enc.status || PatientStatus.EXAMINING,
      registrationDate: enc.startTime || enc.createdAt || enc.visitDate || new Date().toISOString(),
      visitDate: enc.visitDate || enc.startTime || enc.createdAt || new Date().toISOString(),
      paymentMethod: enc.queueTicket?.assuranceCodeId || enc.queueTicket?.assuranceType || 'Umum',
      allergies: enc.patient?.allergies || '-'
    }
  }, [encounterResponse?.result])

  const encounterType = (encounterResponse?.result as any)?.encounterType || ''

  useEffect(() => {
    if (isEncounterLoading) return
    if (isError) {
      message.error('Gagal memuat data pasien')
      navigate('/dashboard/nurse-calling')
      return
    }
    if (encounterResponse && (!encounterResponse.success || !encounterResponse.result)) {
      message.error(`Data pasien tidak ditemukan: ${encounterResponse.error || 'Server error'}`)
      console.error('API Error Response:', encounterResponse)
      navigate('/dashboard/nurse-calling')
    }
  }, [isEncounterLoading, isError, encounterResponse, message, navigate])

  const menuItems: MenuItem[] = useMemo(
    () => [
      {
        key: 'patient-info',
        icon: <UserOutlined />,
        label: 'Informasi Pasien'
      },
      {
        key: 'overview',
        icon: <MonitorOutlined />,
        label: 'Ringkasan & Timeline'
      },
      {
        key: 'medical-history',
        icon: <FileTextOutlined />,
        label: 'Riwayat Rekam Medis'
      },
      ...(encounterType === 'EMER'
        ? [
            {
              key: 'triage',
              icon: <AlertOutlined style={{ color: token.colorError }} />,
              label: 'Data Triase'
            }
          ]
        : []),
      {
        key: 'initial-assessment',
        icon: <SolutionOutlined />,
        label: 'Asesmen Awal'
      },
      {
        key: 'general-soap',
        icon: <FormOutlined />,
        label: 'SOAP Umum'
      },
      ...(patientData?.poli?.name?.includes('RAWAT_INAP') ||
      patientData?.poli?.code === 'RAWAT_INAP'
        ? rawatInapMenu
        : [])
    ],
    [encounterType, patientData, token.colorError]
  )

  const filteredItems = useMemo(() => {
    if (!searchText) return menuItems
    const lowerSearch = searchText.toLowerCase()

    return menuItems
      .map((item: any) => {
        const isParentMatch = item?.label?.toString().toLowerCase().includes(lowerSearch)

        if (item?.children && Array.isArray(item.children)) {
          const matchingChildren = item.children.filter((child: any) =>
            child?.label?.toString().toLowerCase().includes(lowerSearch)
          )

          if (matchingChildren.length > 0) {
            return { ...item, children: matchingChildren }
          } else if (isParentMatch) {
            return item
          }
          return null
        }

        return isParentMatch ? item : null
      })
      .filter(Boolean) as MenuItem[]
  }, [menuItems, searchText])

  const filteredModalItems = useMemo(() => {
    if (!modalSearch) return menuItems
    const lowerSearch = modalSearch.toLowerCase()

    return menuItems
      .map((item: any) => {
        const isParentMatch = item?.label?.toString().toLowerCase().includes(lowerSearch)

        if (item?.children && Array.isArray(item.children)) {
          const matchingChildren = item.children.filter((child: any) =>
            child?.label?.toString().toLowerCase().includes(lowerSearch)
          )

          if (matchingChildren.length > 0) {
            return { ...item, children: matchingChildren }
          } else if (isParentMatch) {
            return item
          }
          return null
        }

        return isParentMatch ? item : null
      })
      .filter(Boolean) as MenuItem[]
  }, [menuItems, modalSearch])

  const renderContent = () => {
    if (!patientData || !encounterId) return null

    switch (selectedKey) {
      case 'patient-info':
        return (
          <PatientInfoCard
            patientData={patientData}
            action={
              patientData?.status === 'TRIAGED' || patientData?.status === 'TRIAGE' ? (
                <Button
                  type="primary"
                  icon={<SoundOutlined />}
                  onClick={handleCallToPoli}
                  loading={updateStatusMutation.isPending}
                  size="small"
                >
                  {patientData.status === 'TRIAGE' ? 'Pindah Antrean Poli' : 'Panggil ke Poli'}
                </Button>
              ) : undefined
            }
          />
        )
      case 'overview':
        return <EncounterTimeline encounterId={encounterId || ''} />
      case 'medical-history':
        return <PatientMedicalHistoryTab patientId={patientData?.patient?.id} />
      case 'initial-assessment':
        return (
          <InitialAssessmentForm
            encounterId={encounterId}
            patientData={patientData as any}
            mode="outpatient"
            role="nurse"
          />
        )
      case 'triage':
        return <TriageForm encounterId={encounterId} patientData={patientData as any} />
      case 'monitoring-ttv':
        return <VitalSignsMonitoringForm encounterId={encounterId} patientData={patientData} />
      case 'general-soap':
        return (
          <GeneralSOAPForm
            encounterId={encounterId}
            patientData={patientData}
            showTTVSection={true}
            allowedRoles={['nurse']}
          />
        )
      case 'cppt':
        return <CPPTForm encounterId={encounterId} patientData={patientData} />
      default:
        return null
    }
  }

  if (isEncounterLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    )
  }

  if (!patientData || !encounterId) {
    return null
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex-1 px-4 pb-4 overflow-hidden relative flex flex-col min-h-0">
        <Modal
          open={modalOpen}
          onCancel={() => {
            setModalOpen(false)
            setModalSearch('')
          }}
          footer={null}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MedicineBoxOutlined style={{ color: token.colorPrimary }} />
              <span>Perawat — Pilih Form</span>
            </div>
          }
          width={500}
          styles={{ body: { padding: 0, maxHeight: '70vh', overflowY: 'auto' } }}
          centered
        >
          <div
            className="px-4 py-3"
            style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}
          >
            <Input.Search
              placeholder="Cari menu/form..."
              allowClear
              autoFocus
              value={modalSearch}
              onChange={(e) => setModalSearch(e.target.value)}
            />
          </div>
          {filteredModalItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ fontSize: 14, color: token.colorTextTertiary }}>
                    Form tidak ditemukan
                  </span>
                }
              />
            </div>
          ) : (
            <Menu
              className="custom-menu"
              mode="inline"
              selectedKeys={[selectedKey]}
              defaultOpenKeys={
                modalSearch
                  ? filteredModalItems.map((item) => item?.key as string).filter(Boolean)
                  : []
              }
              style={{ borderRight: 0 }}
              items={filteredModalItems}
              onSelect={({ key }) => {
                setSelectedKey(key)
                setModalOpen(false)
                setModalSearch('')
              }}
            />
          )}
        </Modal>

        <Layout
          className="rounded-lg overflow-hidden h-full"
          style={{ border: `1px solid ${token.colorBorderSecondary}` }}
        >
          <Layout.Sider
            width={260}
            collapsible
            collapsed={collapsed}
            onCollapse={(value) => setCollapsed(value)}
            theme="light"
            className=""
            trigger={
              <div className="flex items-center justify-center h-12 cursor-pointer transition-colors">
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </div>
            }
          >
            <div className="h-full flex flex-col">
              <div
                className={`p-4 ${collapsed ? 'text-center' : ''}`}
                style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}
              >
                {collapsed ? (
                  <SearchOutlined
                    style={{ fontSize: 18, color: token.colorPrimary, cursor: 'pointer' }}
                    onClick={() => setModalOpen(true)}
                  />
                ) : (
                  <>
                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <MedicineBoxOutlined style={{ color: token.colorPrimary }} />
                      <span style={{ color: token.colorText }}>Perawat</span>
                    </div>
                    <Typography className="ml-6">{profile?.username}</Typography>
                  </>
                )}
              </div>
              <div className="flex flex-col flex-1 overflow-hidden mt-2">
                {!collapsed && (
                  <div
                    className="px-4 pb-2"
                    style={{
                      borderBottom: `1px solid ${token.colorBorderSecondary}`,
                      paddingBottom: 10
                    }}
                  >
                    <Input.Search
                      placeholder="Cari menu/form..."
                      allowClear
                      onChange={(e) => setSearchText(e.target.value)}
                      className="w-full"
                    />
                  </div>
                )}
                <div className="flex-1 overflow-y-auto pb-4">
                  {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 mt-10">
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <span style={{ fontSize: 14, color: token.colorTextTertiary }}>
                            Form tidak ditemukan
                          </span>
                        }
                      />
                    </div>
                  ) : (
                    <Menu
                      className="custom-menu"
                      mode="inline"
                      selectedKeys={[selectedKey]}
                      defaultSelectedKeys={['initial-assessment']}
                      defaultOpenKeys={
                        searchText
                          ? filteredItems.map((item) => item?.key as string).filter(Boolean)
                          : []
                      }
                      style={{ borderRight: 0 }}
                      items={filteredItems}
                      onSelect={({ key }) => setSelectedKey(key)}
                    />
                  )}
                </div>
              </div>
            </div>
          </Layout.Sider>
          <Layout>
            <Layout.Content className="p-6 overflow-y-auto h-full">
              {renderContent()}
            </Layout.Content>
          </Layout>
        </Layout>
      </div>
    </div>
  )
}

export default MedicalRecordForm
