import { PlusOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons'
import CreatePatientModal from '@renderer/components/organisms/visit-management/CreatePatientModal'
import { useDebounce } from '@renderer/hooks/useDebounce'
import { client } from '@renderer/utils/client'
import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Input,
  InputNumber,
  Row,
  Space,
  Table,
  Tag,
  Typography
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { PatientAttributes } from 'simrs-types'
import {
  createPatientLookupQueryInput,
  INITIAL_PATIENT_LOOKUP_SEARCH_PARAMS
} from './patient-lookup-search'

type PatientLookupSelectorProps = {
  value?: PatientAttributes
  onChange: (patient?: PatientAttributes) => void
  disabled?: boolean
  title?: string
  showSelectionSummary?: boolean
  showClearButton?: boolean
  createButtonLabel?: string
}

type PatientLookupRow = PatientAttributes & {
  key: string
}

export default function PatientLookupSelector({
  value,
  onChange,
  disabled = false,
  title = 'Pilih Pasien',
  showSelectionSummary = true,
  showClearButton = true,
  createButtonLabel = 'Buat Pasien Baru'
}: PatientLookupSelectorProps) {
  const { message } = App.useApp()
  const [searchParams, setSearchParams] = useState(INITIAL_PATIENT_LOOKUP_SEARCH_PARAMS)
  const [createPatientOpen, setCreatePatientOpen] = useState(false)

  const debouncedName = useDebounce(searchParams.name, 400)
  const debouncedMedicalRecordNumber = useDebounce(searchParams.medicalRecordNumber, 400)
  const debouncedAddress = useDebounce(searchParams.address, 400)
  const debouncedNik = useDebounce(searchParams.nik, 400)

  const patientQueryInput = useMemo(
    () =>
      createPatientLookupQueryInput({
        ...searchParams,
        name: debouncedName,
        medicalRecordNumber: debouncedMedicalRecordNumber,
        address: debouncedAddress,
        nik: debouncedNik
      }),
    [
      debouncedAddress,
      debouncedMedicalRecordNumber,
      debouncedName,
      debouncedNik,
      searchParams.age,
      searchParams.birthDate
    ]
  )

  const patientQuery = client.visitManagement.getPatientList.useQuery(patientQueryInput, {
    queryKey: ['patientLookupSelector', patientQueryInput]
  })

  const rows: PatientLookupRow[] = useMemo(() => {
    return ((patientQuery.data?.result as PatientAttributes[] | undefined) ?? []).map((item) => ({
      ...item,
      key: item.id
    }))
  }, [patientQuery.data?.result])

  const columns: ColumnsType<PatientLookupRow> = [
    {
      title: 'RM',
      dataIndex: 'medicalRecordNumber',
      key: 'medicalRecordNumber',
      width: 120,
      render: (value: string) => <span className="font-mono text-xs">{value || '-'}</span>
    },
    {
      title: 'NIK',
      dataIndex: 'nik',
      key: 'nik',
      width: 160,
      render: (value: string) => value || '-'
    },
    {
      title: 'Nama',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (value: string) => <span className="font-medium">{value || '-'}</span>
    },
    {
      title: 'Alamat',
      dataIndex: 'address',
      key: 'address',
      render: (value: string) => value || '-'
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 120,
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

  const handleCreatedPatient = (data: any) => {
    const createdPatient = data?.result as PatientAttributes | undefined

    if (!createdPatient?.id) {
      message.warning('Pasien berhasil dibuat, tetapi data pasien belum bisa dipilih otomatis.')
      void patientQuery.refetch()
      return
    }

    onChange(createdPatient)
    setSearchParams({
      name: createdPatient.name || '',
      medicalRecordNumber: createdPatient.medicalRecordNumber || '',
      address: createdPatient.address || '',
      nik: createdPatient.nik || '',
      birthDate: createdPatient.birthDate || '',
      age: null
    })
    void patientQuery.refetch()
    message.success(`Pasien ${createdPatient.name} siap dipakai untuk pendaftaran.`)
  }

  return (
    <Card
      size="small"
      title={title}
      extra={
        <Space>
          {value && showClearButton ? (
            <Button size="small" onClick={() => onChange(undefined)} disabled={disabled}>
              Hapus Pilihan
            </Button>
          ) : null}
          <Button
            size="small"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreatePatientOpen(true)}
            disabled={disabled}
          >
            {createButtonLabel}
          </Button>
        </Space>
      }
    >
      {showSelectionSummary && value ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <Space align="start">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <UserOutlined />
            </div>
            <div>
              <Typography.Text strong>{value.name || '-'}</Typography.Text>
              <div className="mt-1 flex flex-wrap gap-2">
                <Tag color="green">RM {value.medicalRecordNumber || '-'}</Tag>
                <Tag>NIK {value.nik || '-'}</Tag>
              </div>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 8 }}>
                {value.address || 'Alamat belum tersedia'}
              </Typography.Paragraph>
            </div>
          </Space>
        </div>
      ) : showSelectionSummary ? (
        <div className="mb-4">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Belum ada pasien dipilih. Cari pasien atau buat pasien baru."
          />
        </div>
      ) : null}

      <Row gutter={[12, 12]}>
        <Col xs={24} md={12}>
          <Input
            allowClear
            value={searchParams.name}
            prefix={<SearchOutlined />}
            placeholder="Cari nama pasien"
            disabled={disabled}
            onChange={(event) =>
              setSearchParams((current) => ({ ...current, name: event.target.value }))
            }
          />
        </Col>
        <Col xs={24} md={12}>
          <Input
            allowClear
            value={searchParams.medicalRecordNumber}
            prefix={<SearchOutlined />}
            placeholder="Cari nomor rekam medis"
            disabled={disabled}
            onChange={(event) =>
              setSearchParams((current) => ({
                ...current,
                medicalRecordNumber: event.target.value
              }))
            }
          />
        </Col>
        <Col xs={24} md={12}>
          <Input
            allowClear
            value={searchParams.nik}
            prefix={<SearchOutlined />}
            placeholder="Cari NIK"
            disabled={disabled}
            onChange={(event) =>
              setSearchParams((current) => ({ ...current, nik: event.target.value }))
            }
          />
        </Col>
        <Col xs={24} md={12}>
          <Input
            allowClear
            value={searchParams.address}
            prefix={<SearchOutlined />}
            placeholder="Cari alamat"
            disabled={disabled}
            onChange={(event) =>
              setSearchParams((current) => ({ ...current, address: event.target.value }))
            }
          />
        </Col>
        <Col xs={24} md={12}>
          <DatePicker
            allowClear
            className="w-full"
            value={searchParams.birthDate ? dayjs(searchParams.birthDate) : null}
            placeholder="Cari tanggal lahir"
            disabled={disabled}
            format="YYYY-MM-DD"
            onChange={(value) =>
              setSearchParams((current) => ({
                ...current,
                birthDate: value ? value.format('YYYY-MM-DD') : ''
              }))
            }
          />
        </Col>
        <Col xs={24} md={12}>
          <InputNumber
            className="w-full"
            min={0}
            precision={0}
            value={searchParams.age}
            placeholder="Cari umur"
            disabled={disabled}
            onChange={(value) =>
              setSearchParams((current) => ({
                ...current,
                age: typeof value === 'number' ? value : null
              }))
            }
          />
        </Col>
      </Row>

      <Table<PatientLookupRow>
        className="mt-4"
        size="small"
        rowKey="id"
        dataSource={rows}
        columns={columns}
        loading={patientQuery.isLoading || patientQuery.isRefetching}
        pagination={{ pageSize: 5, showSizeChanger: false }}
        scroll={{ x: 900 }}
        locale={{ emptyText: 'Pasien tidak ditemukan.' }}
      />

      <CreatePatientModal
        open={createPatientOpen}
        onClose={() => setCreatePatientOpen(false)}
        onSuccess={handleCreatedPatient}
      />
    </Card>
  )
}
