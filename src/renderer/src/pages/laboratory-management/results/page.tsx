import { ApartmentOutlined, FileSearchOutlined, ProfileOutlined } from '@ant-design/icons'
import { ExportButton } from '@renderer/components/molecules/ExportButton'
import GenericTable from '@renderer/components/organisms/GenericTable'
import PatientInfoModal from '@renderer/components/organisms/laboratory-management/PatientInfoModal'
import ReferralInfoModal from '@renderer/components/organisms/laboratory-management/ReferralInfoModal'
import { TableHeader } from '@renderer/components/TableHeader'
import { client } from '@renderer/utils/client'
import { Button, DatePicker, Form, Input, Space, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import type { PatientInfoCardData } from '@renderer/components/molecules/PatientInfoCard'
import {
  buildPatientInfoCardData,
  type ReferralInfoSource
} from '../table-info'
import {
  type AncillaryCategory,
  getAncillarySectionConfig,
  getAncillarySectionConfigByCategory,
  type AncillarySection
} from '../section-config'

interface LaboratoryResultsProps {
  fixedCategory?: AncillaryCategory
  section?: AncillarySection
}

interface ResultRow {
  id: string
  encounterId: string
  requestedAt?: string
  status?: string
  testDisplay?: string
  category?: AncillaryCategory
  patient?: {
    name?: string
    mrn?: string
    medicalRecordNumber?: string
    nik?: string
    birthDate?: string
    address?: string
  }
  referrals?: ReferralInfoSource[]
  sourcePoliName?: string
  queueTicket?: {
    number?: string | number
  }
}

interface EncounterResultGroup {
  key: string
  encounterId: string
  queueNumber?: string | number
  patient?: {
    name?: string
    mrn?: string
    medicalRecordNumber?: string
    nik?: string
    birthDate?: string
    address?: string
  }
  referrals?: ReferralInfoSource[]
  sourcePoliName?: string
  requestedAt?: string
  status?: string
  tests: ResultRow[]
}

export default function LaboratoryResults({
  fixedCategory = 'LABORATORY',
  section
}: LaboratoryResultsProps = {}) {
  const navigate = useNavigate()
  const sectionConfig = section
    ? getAncillarySectionConfig(section)
    : getAncillarySectionConfigByCategory(fixedCategory)
  const [searchParams, setSearchParams] = useState({
    fromDate: dayjs().subtract(7, 'days').format('YYYY-MM-DD'),
    toDate: dayjs().format('YYYY-MM-DD'),
    patientName: '',
    status: 'COMPLETED'
  })
  const [patientInfo, setPatientInfo] = useState<PatientInfoCardData | null>(null)
  const [referralInfo, setReferralInfo] = useState<{
    encounterId?: string
    sourcePoliName?: string
  } | null>(null)

  const {
    data: requestData,
    isLoading,
    isRefetching,
    refetch
  } = client.laboratoryManagement.getOrders.useQuery({
    fromDate: searchParams.fromDate,
    toDate: searchParams.toDate,
    status: searchParams.status as any,
    category: fixedCategory
  })

  const groupedData = useMemo<EncounterResultGroup[]>(() => {
    if (!requestData?.result) return []

    const groups = requestData.result.reduce((acc: Record<string, EncounterResultGroup>, current: any) => {
      const encounterId = String(current.encounterId || '')
      if (!encounterId) {
        return acc
      }

      if (!acc[encounterId]) {
        acc[encounterId] = {
          key: encounterId,
          encounterId,
          queueNumber: current.queueTicket?.number,
          patient: current.patient,
          referrals: current.referrals,
          sourcePoliName: current.sourcePoliName,
          requestedAt: current.requestedAt,
          status: current.status,
          tests: []
        }
      }

      acc[encounterId].tests.push({
        ...current,
        id: String(current.id)
      })
      return acc
    }, {})

    const patientKeyword = searchParams.patientName.trim().toLowerCase()

    return (Object.values(groups) as EncounterResultGroup[]).filter((group) => {
      if (!patientKeyword) return true
      const name = String(group.patient?.name || '').toLowerCase()
      const mrn = String(group.patient?.mrn || '').toLowerCase()
      return name.includes(patientKeyword) || mrn.includes(patientKeyword)
    })
  }, [requestData?.result, searchParams.patientName])

  const parentColumns: ColumnsType<EncounterResultGroup> = useMemo(() => {
    return [
      {
        title: 'Tgl. Selesai',
        dataIndex: 'requestedAt',
        key: 'requestedAt',
        width: 150,
        render: (date?: string) => (date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-')
      },
      {
        title: 'No. Antrian',
        dataIndex: 'queueNumber',
        key: 'queueNumber',
        render: (_, record) => (
          <span className="font-semibold text-gray-700">{record.queueNumber || '-'}</span>
        )
      },
      {
        title: 'Pasien',
        dataIndex: ['patient', 'name'],
        key: 'patientName',
        render: (text, record) => (
          <div>
            <span className="text-gray-500 text-xs">
              {record.patient?.medicalRecordNumber || record.patient?.mrn || '-'} -{' '}
            </span>
            <span className="font-medium">{text || '-'}</span>
          </div>
        )
      },
      {
        title: 'Total Pemeriksaan',
        key: 'totalTests',
        render: (_, record) => <span>{record.tests.length} Pemeriksaan</span>
      }
    ]
  }, [])

  const childColumns: ColumnsType<ResultRow> = [
    {
      title: 'Pemeriksaan',
      dataIndex: 'testDisplay',
      key: 'testDisplay',
      render: (text?: string) => <span className="font-medium">{text || '-'}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status?: string) => <Tag color="green">{status || '-'}</Tag>
    }
  ]

  const onSearch = (values: { dateRange?: dayjs.Dayjs[]; patientName?: string }) => {
    setSearchParams({
      fromDate: values.dateRange ? dayjs(values.dateRange[0]).format('YYYY-MM-DD') : '',
      toDate: values.dateRange ? dayjs(values.dateRange[1]).format('YYYY-MM-DD') : '',
      patientName: values.patientName || '',
      status: 'COMPLETED'
    })
  }

  const handleViewReport = (record: EncounterResultGroup) => {
    navigate(`/dashboard/laboratory/report/${record.encounterId}`)
  }

  return (
    <div className="p-4">
      <TableHeader
        title={sectionConfig.resultsTitle}
        subtitle={sectionConfig.resultsSubtitle}
        onSearch={onSearch}
        onRefresh={() => {
          refetch()
        }}
        loading={isLoading || isRefetching}
        action={
          <ExportButton
            data={groupedData as any}
            fileName={`daftar-hasil-pemeriksaan-${sectionConfig.section}`}
            title={sectionConfig.resultsExportTitle}
            columns={[
              { key: 'queueNumber', label: 'No. Antrian' },
              { key: 'patient.mrn', label: 'MRN' },
              { key: 'patient.name', label: 'Nama Pasien' },
              {
                key: 'requestedAt',
                label: 'Tgl. Selesai',
                render: (value) => (value ? dayjs(value as string).format('DD/MM/YYYY HH:mm') : '-')
              },
              {
                key: 'tests',
                label: 'Total Pemeriksaan',
                render: (value) => `${(value as unknown[]).length} Pemeriksaan`
              }
            ]}
            nestedTable={{
              getChildren: (parent) => parent.tests as Record<string, unknown>[],
              columns: [
                { key: 'testDisplay', label: 'Pemeriksaan' },
                { key: 'status', label: 'Status' }
              ]
            }}
          />
        }
      >
        <Form.Item
          name="dateRange"
          label="Tanggal"
          initialValue={[dayjs().subtract(7, 'days'), dayjs()]}
          style={{ width: '100%' }}
        >
          <DatePicker.RangePicker allowClear={false} style={{ width: '100%' }} size="large" />
        </Form.Item>
        <Form.Item name="patientName" label="Pasien" style={{ width: '100%' }}>
          <Input placeholder="Cari Nama / No. RM Pasien" allowClear size="large" />
        </Form.Item>
      </TableHeader>

      <div className="mt-4 bg-white p-4 rounded-lg border border-gray-100">
        <GenericTable
          columns={parentColumns}
          dataSource={groupedData}
          rowKey="key"
          loading={isLoading || isRefetching}
          tableProps={{
            expandable: {
              expandedRowRender: (record) => (
                <div className="px-10 py-2 bg-gray-50">
                  <GenericTable
                    columns={childColumns}
                    dataSource={record.tests}
                    rowKey="id"
                    tableProps={{ pagination: false }}
                  />
                </div>
              )
            }
          }}
          action={{
            title: 'Aksi',
            width: 160,
            render: (record) => (
              <Space size="small">
                <Tooltip title="Info Pasien">
                  <Button
                    size="small"
                    icon={<ProfileOutlined />}
                    onClick={() =>
                      setPatientInfo(
                        record.patient
                          ? buildPatientInfoCardData({
                              ...record.patient,
                              poliName: record.sourcePoliName,
                              visitDate: record.requestedAt,
                              status: record.status
                            })
                          : null
                      )
                    }
                  />
                </Tooltip>
                {record.sourcePoliName ? (
                  <Tooltip title="Info Rujukan">
                    <Button
                      size="small"
                      icon={<ApartmentOutlined />}
                      onClick={() =>
                        setReferralInfo({
                          encounterId: record.encounterId,
                          sourcePoliName: record.sourcePoliName
                        })
                      }
                    />
                  </Tooltip>
                ) : null}
                <Tooltip title="Lihat Hasil">
                  <Button
                    size="small"
                    icon={<FileSearchOutlined />}
                    onClick={() => handleViewReport(record)}
                  />
                </Tooltip>
              </Space>
            )
          }}
        />
      </div>
      <PatientInfoModal
        open={!!patientInfo}
        onClose={() => setPatientInfo(null)}
        patientData={patientInfo}
      />
      <ReferralInfoModal
        open={!!referralInfo}
        onClose={() => setReferralInfo(null)}
        encounterId={referralInfo?.encounterId}
        sourcePoliName={referralInfo?.sourcePoliName}
      />
    </div>
  )
}
