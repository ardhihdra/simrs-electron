import { useState, useEffect } from 'react'
import { Select, Radio, Typography, Tag, theme } from 'antd'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'

const { Text } = Typography

export interface PatientSelectorValue {
  patientId: string
  patientName: string
  medicalRecordNumber: string
  encounterId: string
  serviceType: string
}

interface PatientSelectorWithServiceProps {
  onSelect: (value: PatientSelectorValue | null) => void
  initialValue?: string // encounterId
  disabled?: boolean
}

export const PatientSelectorWithService = ({
  onSelect,
  initialValue,
  disabled
}: PatientSelectorWithServiceProps) => {
  const { token } = theme.useToken()
  const [serviceType, setServiceType] = useState<string>('AMB') // Default to Rawat Jalan
  const [searchText, setSearchText] = useState<string>('')
  const [selectedValue, setSelectedValue] = useState<string | undefined>(initialValue)

  const { data: encounters, isLoading } = useQuery({
    queryKey: ['encounter', 'list', serviceType, searchText],
    queryFn: async () => {
      const fn = window.api?.query?.encounter?.list
      if (!fn) throw new Error('API encounter tidak tersedia')

      const params: any = {
        limit: 50,
        status: 'IN_PROGRESS', // Only show active encounters
        serviceType: serviceType,
        q: searchText
      }

      return fn(params)
    },
    enabled: true
  })

  useEffect(() => {
    if (initialValue) {
      setSelectedValue(initialValue)
    }
  }, [initialValue])

  const options = (encounters?.result || []).map((enc: any) => {
    const patient = enc.patient || {}
    const mrn = patient.medicalRecordNumber || '-'
    const name = patient.name || 'Unknown'
    const visitDate = enc.startTime || enc.createdAt

    return {
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong>{name}</Text>
            <div style={{ fontSize: '12px', color: token.colorTextTertiary }}>
              RM: {mrn}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Tag bordered={false} color="blue">
              {dayjs(visitDate).format('DD MMM HH:mm')}
            </Tag>
          </div>
        </div>
      ),
      value: enc.id,
      data: {
        patientId: patient.id,
        patientName: name,
        medicalRecordNumber: mrn,
        encounterId: enc.id,
        serviceType: serviceType
      }
    }
  })

  const handleSelect = (val: string) => {
    const option = options.find(o => o.value === val)
    if (option) {
      setSelectedValue(val)
      onSelect(option.data)
    }
  }

  const handleClear = () => {
    setSelectedValue(undefined)
    onSelect(null)
  }

  const handleServiceChange = (e: any) => {
    setServiceType(e.target.value)
    setSelectedValue(undefined)
    onSelect(null)
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-gray-50">
      <div className="flex items-center gap-4">
        <Text strong>Pilih Layanan:</Text>
        <Radio.Group
          value={serviceType}
          onChange={handleServiceChange}
          disabled={disabled}
          buttonStyle="solid"
        >
          <Radio.Button value="AMB">Rawat Jalan</Radio.Button>
          <Radio.Button value="IMP">Rawat Inap</Radio.Button>
          <Radio.Button value="EMER">IGD</Radio.Button>
        </Radio.Group>
      </div>

      <div className="flex-1">
        <Select
          className="w-full"
          showSearch
          placeholder="Cari Nama Pasien atau No. RM (Pilih layanan dulu)"
          loading={isLoading}
          onSearch={setSearchText}
          onChange={handleSelect}
          onClear={handleClear}
          value={selectedValue}
          options={options}
          filterOption={false} // Loading server-side
          allowClear
          disabled={disabled}
          size="large"
          notFoundContent={isLoading ? 'Mencari...' : 'Data tidak ditemukan'}
        />
      </div>
    </div>
  )
}
