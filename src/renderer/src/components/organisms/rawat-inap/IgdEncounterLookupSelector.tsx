import { SearchOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Col, DatePicker, Empty, Input, Row, Select, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'

import { useDebounce } from '../../../hooks/useDebounce'
import { client } from '../../../utils/client'
import {
  buildSourceEncounterLookupQuery,
  normalizeSourceEncounterLookupRows,
  type SourceEncounterLookupRow,
  type SourceEncounterLookupType
} from './igd-encounter-lookup'

type IgdEncounterLookupSelectorProps = {
  value?: SourceEncounterLookupRow
  onChange: (encounter?: SourceEncounterLookupRow) => void
  disabled?: boolean
  title?: string
  encounterType?: SourceEncounterLookupType
  encounterLabel?: string
  showSelectionSummary?: boolean
  showClearButton?: boolean
}

type DateRangeValue = [dayjs.Dayjs | null, dayjs.Dayjs | null] | null

const extractRows = (payload: unknown): any[] => {
  if (!payload || typeof payload !== 'object') return []

  const record = payload as any
  const rows = record.result ?? record.data ?? []
  return Array.isArray(rows) ? rows : []
}

export default function IgdEncounterLookupSelector({
  value,
  onChange,
  disabled = false,
  title = 'Pilih Encounter IGD',
  encounterType = 'EMER',
  encounterLabel = 'IGD',
  showSelectionSummary = true,
  showClearButton = true
}: IgdEncounterLookupSelectorProps) {
  const [search, setSearch] = useState('')
  const [patient, setPatient] = useState('')
  const [practitionerId, setPractitionerId] = useState<string | undefined>()
  const [dateRange, setDateRange] = useState<DateRangeValue>(null)

  const debouncedSearch = useDebounce(search, 400)
  const debouncedPatient = useDebounce(patient, 400)

  const queryInput = useMemo(
    () =>
      buildSourceEncounterLookupQuery({
        encounterType,
        search: debouncedSearch,
        patient: debouncedPatient,
        practitionerId,
        dateFrom: dateRange?.[0]?.format('YYYY-MM-DD'),
        dateTo: dateRange?.[1]?.format('YYYY-MM-DD')
      }),
    [dateRange, debouncedPatient, debouncedSearch, encounterType, practitionerId]
  )

  const encounterQuery = useQuery({
    queryKey: ['sourceEncounterLookupSelector', queryInput],
    queryFn: async () => {
      const fn = window.api?.query?.encounter?.list
      if (!fn) throw new Error('API encounter tidak tersedia')
      return fn(queryInput as any)
    },
    enabled: typeof window !== 'undefined'
  })

  const practitionerQuery = client.practitioner.list.useQuery({
    hakAksesId: 'doctor'
  })

  const rows = useMemo(
    () => normalizeSourceEncounterLookupRows(encounterQuery.data, encounterType),
    [encounterQuery.data, encounterType]
  )

  const practitionerOptions = useMemo(
    () =>
      extractRows(practitionerQuery.data).map((item) => ({
        value: String(item.id),
        label: item.namaLengkap || item.name || `Dokter ${item.id}`
      })),
    [practitionerQuery.data]
  )

  const columns: ColumnsType<SourceEncounterLookupRow> = [
    {
      title: 'Encounter',
      dataIndex: 'id',
      key: 'id',
      width: 190,
      render: (id: string, record) => (
        <div>
          <div className="font-mono text-xs">{id}</div>
          <Tag className="mt-1" color="blue">
            {record.status || '-'}
          </Tag>
        </div>
      )
    },
    {
      title: 'Pasien',
      key: 'patient',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.patientName}</div>
          <div className="text-xs text-gray-500">RM {record.patientMrNo}</div>
        </div>
      )
    },
    {
      title: 'Tanggal',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 150,
      render: (value?: string) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '-')
    },
    {
      title: 'Dokter',
      dataIndex: 'practitionerName',
      key: 'practitionerName',
      width: 180
    },
    {
      title: 'Unit',
      dataIndex: 'serviceUnitName',
      key: 'serviceUnitName',
      width: 140
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 110,
      render: (_, record) => {
        const isSelected = value?.id === record.id

        return (
          <Button
            type={isSelected ? 'default' : 'primary'}
            size="small"
            disabled={disabled || isSelected}
            onClick={() => onChange(record)}
          >
            {isSelected ? 'Dipilih' : 'Pilih'}
          </Button>
        )
      }
    }
  ]

  return (
    <Card
      size="small"
      title={title}
      extra={
        value && showClearButton ? (
          <Button size="small" onClick={() => onChange(undefined)} disabled={disabled}>
            Hapus Pilihan
          </Button>
        ) : null
      }
    >
      {showSelectionSummary && value ? (
        <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 p-4">
          <Space direction="vertical" size={4}>
            <Typography.Text strong>{value.patientName}</Typography.Text>
            <Space wrap>
              <Tag color="blue">RM {value.patientMrNo}</Tag>
              <Tag>Encounter {value.id}</Tag>
              <Tag>{value.status || '-'}</Tag>
            </Space>
          </Space>
        </div>
      ) : showSelectionSummary ? (
        <div className="mb-4">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={`Belum ada encounter ${encounterLabel} dipilih.`}
          />
        </div>
      ) : null}

      <Row gutter={[12, 12]}>
        <Col xs={24} md={12}>
          <Input
            allowClear
            value={search}
            prefix={<SearchOutlined />}
            placeholder="Cari encounter / RM / nama"
            disabled={disabled}
            onChange={(event) => setSearch(event.target.value)}
          />
        </Col>
        <Col xs={24} md={12}>
          <Input
            allowClear
            value={patient}
            prefix={<SearchOutlined />}
            placeholder="Filter pasien"
            disabled={disabled}
            onChange={(event) => setPatient(event.target.value)}
          />
        </Col>
        <Col xs={24} md={12}>
          <DatePicker.RangePicker
            className="w-full"
            allowClear
            value={dateRange}
            format="YYYY-MM-DD"
            disabled={disabled}
            onChange={(value) => setDateRange(value as DateRangeValue)}
          />
        </Col>
        <Col xs={24} md={12}>
          <Select
            allowClear
            showSearch
            className="w-full"
            value={practitionerId}
            options={practitionerOptions}
            placeholder="Filter dokter"
            disabled={disabled}
            loading={practitionerQuery.isLoading || practitionerQuery.isRefetching}
            optionFilterProp="label"
            onChange={(nextValue) => setPractitionerId(nextValue)}
          />
        </Col>
      </Row>

      <Table<SourceEncounterLookupRow>
        className="mt-4"
        size="small"
        rowKey="id"
        dataSource={rows}
        columns={columns}
        loading={encounterQuery.isLoading || encounterQuery.isRefetching}
        pagination={{ pageSize: 5, showSizeChanger: false }}
        scroll={{ x: 900 }}
        locale={{ emptyText: `Encounter ${encounterLabel} tidak ditemukan.` }}
      />
    </Card>
  )
}
