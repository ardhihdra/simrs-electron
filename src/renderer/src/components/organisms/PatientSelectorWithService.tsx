import { useState, useEffect } from 'react'
import { Select, Radio, Typography, Tag, theme, Input } from 'antd'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'

const { Text } = Typography

export interface PatientSelectorValue {
  patientId: string
  patientName: string
  medicalRecordNumber: string
  encounterId: string | null
  serviceType: string
}

interface PatientSelectorWithServiceProps {
  onSelect: (value: PatientSelectorValue | null) => void
  initialValue?: string // encounterId
  disabled?: boolean
}

interface PatientResult {
  id: string
  name: string
  medicalRecordNumber: string
  createdAt: string
}

interface EncounterResult {
  id: string
  startTime?: string
  createdAt: string
  patient: PatientResult
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
  
  // Local state for manual input (LUAR)
  const [manualName, setManualName] = useState('')
  const [manualRM, setManualRM] = useState('')

  const { data: results, isLoading } = useQuery({
    queryKey: ['patient-search', serviceType, searchText],
    queryFn: async () => {
      if (serviceType === 'LUAR') {
        const fn = window.api?.query?.patient?.list
        if (!fn) throw new Error('API patient tidak tersedia')
        return fn({ q: searchText, limit: 50 })
      } else {
        const fn = window.api?.query?.encounter?.list
        if (!fn) throw new Error('API encounter tidak tersedia')

        const params: any = {
          limit: 50,
          status: 'IN_PROGRESS',
          serviceType: serviceType,
          q: searchText
        }

        return fn(params)
      }
    },
    enabled: serviceType !== 'LUAR'
  })

  useEffect(() => {
    if (initialValue) {
      setSelectedValue(initialValue)
    }
  }, [initialValue])

  const options = (results?.result || []).map((item: any) => {
    // We still use any for the raw item because it can be either EncounterResult or PatientResult
    // but we'll cast it appropriately
    const isEncounter = serviceType !== 'LUAR'
    const patient: PatientResult = isEncounter ? (item as EncounterResult).patient || {} : (item as PatientResult)
    const mrn = patient.medicalRecordNumber || '-'
    const name = patient.name || 'Unknown'
    const visitDate = isEncounter ? ((item as EncounterResult).startTime || (item as EncounterResult).createdAt) : patient.createdAt

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
            <Tag bordered={false} color={isEncounter ? "blue" : "orange"}>
              {dayjs(visitDate).format('DD MMM HH:mm')}
            </Tag>
          </div>
        </div>
      ),
      value: isEncounter ? (item as EncounterResult).id : patient.id,
      data: {
        patientId: patient.id,
        patientName: name,
        medicalRecordNumber: mrn,
        encounterId: isEncounter ? (item as EncounterResult).id : null,
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
    setManualName('')
    setManualRM('')
    onSelect(null)
  }

  const handleManualChange = (nameValue: string, rmValue: string) => {
    setManualName(nameValue)
    setManualRM(rmValue)
    if (nameValue) {
      onSelect({
        patientId: 'MANUAL',
        patientName: nameValue,
        medicalRecordNumber: rmValue,
        encounterId: null,
        serviceType: 'LUAR'
      })
    } else {
      onSelect(null)
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-xl">
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
          <Radio.Button value="LUAR">Pasien Luar</Radio.Button>
        </Radio.Group>
      </div>

      {serviceType === 'LUAR' ? (
        <div className="flex gap-3">
          <div className="flex-1">
            <Text className="mb-1 block">Nama Pasien:</Text>
            <Input
              placeholder="Ketik Nama Pasien Luar..."
              size="large"
              value={manualName}
              onChange={(e) => handleManualChange(e.target.value, manualRM)}
            />
          </div>
          <div className="w-1/3">
            <Text className="mb-1 block">No. RM (Opsional):</Text>
            <Input
              placeholder="No. RM..."
              size="large"
              value={manualRM}
              onChange={(e) => handleManualChange(manualName, e.target.value)}
            />
          </div>
        </div>
      ) : (
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
      )}
    </div>
  )
}
