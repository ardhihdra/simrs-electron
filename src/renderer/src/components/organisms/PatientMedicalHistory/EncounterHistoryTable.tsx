import React, { useState } from 'react'
import {
  Table,
  Card,
  Button,
  DatePicker,
  Select,
  Popover,
  Typography,
  theme,
  Modal,
  Tag
} from 'antd'
import {
  EyeOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  InfoCircleOutlined,
  FilterOutlined,
  ProfileOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { usePatientEncountersPg } from '@renderer/hooks/query/use-patient-history'
import { ClinicalHistoryModal } from './ClinicalHistoryModal'

const { Text } = Typography
const { RangePicker } = DatePicker

interface EncounterHistoryTableProps {
  patientId: string
  onRowClick?: (record: any) => void
}

export const EncounterHistoryTable: React.FC<EncounterHistoryTableProps> = ({
  patientId,
  onRowClick
}) => {
  const { token } = theme.useToken()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [encounterType, setEncounterType] = useState<string | undefined>(undefined)

  const [soapModalOpen, setSoapModalOpen] = useState(false)
  const [labModalOpen, setLabModalOpen] = useState(false)
  const [clinicalModalOpen, setClinicalModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)

  const { data, isLoading } = usePatientEncountersPg({
    patientId,
    page,
    pageSize,
    type: encounterType,
    doctorId: undefined,
    dateFrom: dateRange?.[0] ? dateRange[0].toISOString() : undefined,
    dateTo: dateRange?.[1] ? dateRange[1].toISOString() : undefined
  })

  // Columns Configuration
  const columns = [
    {
      title: 'Tanggal & Waktu',
      dataIndex: 'date',
      key: 'date',
      render: (text: string) => dayjs(text).format('DD MMM YYYY, HH:mm'),
      width: 160
    },
    {
      title: 'Unit Layanan',
      dataIndex: 'serviceUnit',
      key: 'serviceUnit',
      width: 180
    },
    {
      title: 'Dokter Pemeriksa',
      dataIndex: 'doctorName',
      key: 'doctorName',
      width: 200
    },
    {
      title: 'Jenis',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (text: string) => (
        <Text style={{ textTransform: 'capitalize' }}>
          {text === 'ambulatory'
            ? 'Rawat Jalan'
            : text === 'inpatient'
              ? 'Rawat Inap'
              : text === 'emergency'
                ? 'IGD'
                : text}
        </Text>
      )
    },
    {
      title: 'Diagnosis Utama',
      dataIndex: 'primaryDiagnosis',
      key: 'primaryDiagnosis',
      render: (text: string, record: any) => (
        <Popover
          content={
            <div style={{ maxWidth: 350 }}>
              <div className="font-semibold mb-1">Diagnosis Utama</div>
              <div className="mb-2">{text || 'Tidak ada'}</div>
              {record.soapSummary && (
                <>
                  <div className="font-semibold mb-1">SOAP Summary</div>
                  <div className="whitespace-pre-wrap text-sm">{record.soapSummary}</div>
                </>
              )}
            </div>
          }
          title="Quick Preview"
          trigger="hover"
          placement="topLeft"
        >
          <div className="flex items-center gap-1 cursor-pointer">
            <span className="truncate max-w-[200px]" style={{ color: token.colorPrimary }}>
              {text || 'Tidak ada spesifikasi'}
            </span>
            <InfoCircleOutlined className="text-gray-400" />
          </div>
        </Popover>
      )
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 180,
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            title="Lihat Detail Kunjungan"
            onClick={(e) => {
              e.stopPropagation()
              if (onRowClick) onRowClick(record)
            }}
          />
          <Button
            type="text"
            icon={<FileTextOutlined />}
            size="small"
            title="Lihat SOAP"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedRecord(record)
              setSoapModalOpen(true)
            }}
          />
          <Button
            type="text"
            icon={<ExperimentOutlined />}
            size="small"
            title="Hasil Lab/Rad"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedRecord(record)
              setLabModalOpen(true)
            }}
          />
          <Button
            type="text"
            icon={<ProfileOutlined />}
            size="small"
            title="Riwayat Klinis Komprehensif"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedRecord(record)
              setClinicalModalOpen(true)
            }}
          />
        </div>
      )
    }
  ]

  const dummyLabData = [
    { id: 1, test: 'Hemoglobin', result: '14.2 g/dL', ref: '13.0 - 17.0', status: 'Normal' },
    { id: 2, test: 'Leukosit', result: '9,500 /uL', ref: '4,000 - 10,000', status: 'Normal' },
    { id: 3, test: 'Trombosit', result: '140,000 /uL', ref: '150,000 - 450,000', status: 'Low' },
    { id: 4, test: 'Gula Darah Puasa', result: '110 mg/dL', ref: '< 100', status: 'High' }
  ]

  return (
    <Card
      className="shadow-sm mb-4"
      title="Riwayat Kunjungan"
      extra={
        <Button icon={<FilterOutlined />} type="text">
          Advanced Filters
        </Button>
      }
    >
      <div className="flex flex-wrap gap-4 mb-4">
        <RangePicker
          className="w-64"
          onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
        />
        <Select
          placeholder="Jenis Kunjungan"
          allowClear
          style={{ width: 150 }}
          onChange={(value) => setEncounterType(value)}
          options={[
            { value: 'ambulatory', label: 'Rawat Jalan' },
            { value: 'inpatient', label: 'Rawat Inap' },
            { value: 'emergency', label: 'IGD' }
          ]}
        />
        {/* Could add Doctor Select here if generic doctor list is available */}
      </div>

      <Table
        columns={columns}
        dataSource={data?.result?.data || []}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: data?.result?.total || 0,
          showSizeChanger: true,
          onChange: (page, pageSize) => {
            setPage(page)
            setPageSize(pageSize)
          }
        }}
        onRow={(record) => ({
          onClick: () => {
            if (onRowClick) onRowClick(record)
          },
          className: 'cursor-pointer hover:bg-gray-50'
        })}
        size="small"
      />

      <Modal
        open={soapModalOpen}
        title="Catatan SOAP"
        onCancel={() => setSoapModalOpen(false)}
        footer={null}
      >
        <div className="whitespace-pre-wrap font-mono text-sm p-4 rounded border border-white/10">
          {selectedRecord?.soapSummary || 'Tidak ada catatan SOAP untuk kunjungan ini.'}
        </div>
      </Modal>

      <Modal
        open={labModalOpen}
        title={`Hasil Lab/Rad - Dummy`}
        onCancel={() => setLabModalOpen(false)}
        footer={null}
        width={600}
      >
        <div className="mb-4 text-gray-500 text-sm">
          {selectedRecord?.date ? dayjs(selectedRecord.date).format('DD MMM YYYY, HH:mm') : ''} •{' '}
          {selectedRecord?.serviceUnit}
        </div>
        <Table
          dataSource={dummyLabData}
          rowKey="id"
          columns={[
            { title: 'Pemeriksaan', dataIndex: 'test' },
            { title: 'Hasil', dataIndex: 'result' },
            { title: 'Nilai Rujukan', dataIndex: 'ref' },
            {
              title: 'Status',
              dataIndex: 'status',
              render: (val: string) => <Tag color={val === 'Normal' ? 'green' : 'red'}>{val}</Tag>
            }
          ]}
          pagination={false}
          size="small"
        />
      </Modal>

      <ClinicalHistoryModal
        open={clinicalModalOpen}
        onCancel={() => setClinicalModalOpen(false)}
        record={selectedRecord}
      />
    </Card>
  )
}
