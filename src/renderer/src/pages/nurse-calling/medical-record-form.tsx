import { useState, useEffect, useCallback, useMemo } from 'react'
import { App, Spin, Layout, Menu, theme, Input, Modal, Empty } from 'antd'
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
  SearchOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router'
import { PatientQueue } from '@renderer/types/nurse.types'
import { PatientStatus } from '@renderer/types/nurse.types'
import { PatientInfoCard } from '@renderer/components/molecules/PatientInfoCard'
import { InitialAssessmentForm } from '@renderer/components/organisms/Assessment/InitialAssessment/InitialAssessmentForm'
import { GeneralSOAPForm } from '@renderer/components/organisms/Assessment/GeneralSOAP/GeneralSOAPForm'
import { VitalSignsMonitoringForm } from '@renderer/components/organisms/Assessment/VitalSignsMonitoring/VitalSignsMonitoringForm'
import { CPPTForm } from '@renderer/components/organisms/Assessment/CPPT/CPPTForm'
import { TriageForm } from '@renderer/components/organisms/Assessment/Triage/TriageForm'

type MenuItem = Required<MenuProps>['items'][number]

const MedicalRecordForm = () => {
  const navigate = useNavigate()
  const { encounterId } = useParams<{ encounterId: string }>()
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [patientData, setPatientData] = useState<PatientQueue | null>(null)
  const [encounterType, setEncounterType] = useState<string>('')
  const [collapsed, setCollapsed] = useState(false)
  const [selectedKey, setSelectedKey] = useState('initial-assessment')
  const [searchText, setSearchText] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalSearch, setModalSearch] = useState('')
  const { token } = theme.useToken()

  const loadPatientData = useCallback(async () => {
    if (!encounterId) return

    setLoading(true)
    try {
      const fn = window.api?.query?.encounter?.read
      if (!fn) throw new Error('API encounter tidak tersedia')

      const response = await fn({ id: encounterId })

      if (response.success && response.result) {
        const enc = response.result as any
        const validDate = enc.patient?.birthDate ? new Date(enc.patient.birthDate) : null
        const age = validDate ? new Date().getFullYear() - validDate.getFullYear() : 0

        const mappedData: PatientQueue = {
          id: enc.id,
          encounterId: enc.id,
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
          status: PatientStatus.EXAMINING,
          registrationDate:
            enc.startTime || enc.createdAt || enc.visitDate || new Date().toISOString()
        }

        setPatientData(mappedData)
        setEncounterType(enc.encounterType || '')
      } else {
        message.error('Data pasien tidak ditemukan')
        navigate('/dashboard/nurse-calling')
      }
    } catch (error) {
      message.error('Gagal memuat data pasien')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [encounterId, message, navigate])

  useEffect(() => {
    loadPatientData()
  }, [encounterId, loadPatientData])

  const menuItems: MenuItem[] = useMemo(
    () => [
      {
        key: 'patient-info',
        icon: <UserOutlined />,
        label: 'Informasi Pasien'
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
        key: 'monitoring-ttv',
        icon: <MonitorOutlined />,
        label: 'Monitoring TTV'
      },
      {
        key: 'general-soap',
        icon: <FormOutlined />,
        label: 'SOAP Umum'
      },
      ...(patientData?.poli?.name?.includes('RAWAT_INAP') ||
        patientData?.poli?.code === 'RAWAT_INAP'
        ? [
          {
            key: 'cppt',
            icon: <SolutionOutlined />,
            label: 'Catatan Perkembangan (CPPT)'
          }
        ]
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
        return <PatientInfoCard patientData={patientData} />
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

  if (loading) {
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
              defaultOpenKeys={modalSearch ? filteredModalItems.map((item) => item?.key as string).filter(Boolean) : []}
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
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MedicineBoxOutlined style={{ color: token.colorPrimary }} />
                    <span style={{ color: token.colorText }}>Perawat</span>
                  </div>
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
                      defaultOpenKeys={searchText ? filteredItems.map((item) => item?.key as string).filter(Boolean) : []}
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
