import { useState, useEffect } from 'react'
import { Select, Radio, Typography, Tag, theme } from 'antd'
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
  needEmr?: boolean
  birthDate?: string
  address?: string
  city?: string
  createdAt: string
}

interface EncounterResult {
  id: string
  startTime?: string
  createdAt: string
  patient: PatientResult
}

/**
 * similar functionality with PatientLookupSelector
 * @param param0
 * @returns
 */
export const PatientSelectorWithService = ({
  onSelect,
  initialValue,
  disabled
}: PatientSelectorWithServiceProps) => {
  const { token } = theme.useToken()
  const [serviceType, setServiceType] = useState<string>('AMB') // Default to Rawat Jalan
  const [searchText, setSearchText] = useState<string>('')
  const [selectedValue, setSelectedValue] = useState<string | undefined>(initialValue)

  const { data: results, isLoading } = useQuery({
    queryKey: ['patient-search', serviceType, searchText],
    queryFn: async () => {
      if (serviceType === 'LUAR') {
        const fn = window.api?.query?.patient?.list
        if (!fn) throw new Error('API patient tidak tersedia')
        // Search specifically for patients registered as "Pasien Luar" (needEmr: false)
        return fn({ name: searchText, needEmr: false, limit: 50 })
      } else {
        const fn = window.api?.query?.encounter?.list
        if (!fn) throw new Error('API encounter tidak tersedia')

        const params: any = {
          serviceType: serviceType,
          q: searchText
        }

        const res = await fn(params)
        console.log('[PatientSelectorWithService] results for params:', params, res)
        return res
      }
    },
    enabled: true
  })

  useEffect(() => {
    if (initialValue) {
      setSelectedValue(initialValue)
    }
  }, [initialValue])

  const options = (results?.data || results?.result || []).map((item: any) => {
    // We still use any for the raw item because it can be either EncounterResult or PatientResult
    // but we'll cast it appropriately
    const isEncounter = serviceType !== 'LUAR'
    const patient: PatientResult = isEncounter
      ? (item as EncounterResult).patient || {}
      : (item as any)
    const mrn = patient.medicalRecordNumber || '-'
    const name = (patient as any).fullName || patient.name || 'Unknown'
    const visitDate = isEncounter
      ? (item as EncounterResult).startTime || (item as EncounterResult).createdAt
      : patient.createdAt
    const age = patient.birthDate ? dayjs().diff(dayjs(patient.birthDate), 'year') : null
    const address = [patient.address, patient.city].filter(Boolean).join(', ')

    return {
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Text strong>{name}</Text>
              {patient.needEmr === false && (
                <Tag
                  color="purple"
                  bordered={false}
                  style={{ fontSize: '10px', lineHeight: '16px' }}
                >
                  Pasien Luar (Farmasi)
                </Tag>
              )}
            </div>
            <div style={{ fontSize: '12px', color: token.colorTextTertiary }}>
              RM: {mrn}
              {patient.birthDate && (
                <span>
                  {' '}·{' '}
                  {dayjs(patient.birthDate).format('DD MMM YYYY')}
                  {age !== null && ` (${age} thn)`}
                </span>
              )}
            </div>
            {address && (
              <div
                style={{
                  fontSize: '11px',
                  color: token.colorTextQuaternary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '320px'
                }}
              >
                {address}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <Tag bordered={false} color={isEncounter ? 'blue' : 'orange'}>
              {dayjs(visitDate).format('DD MMM HH:mm')}
            </Tag>
          </div>
        </div>
      ),
      display: `${name} | RM: ${mrn}`,
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
    const option = options.find((o) => o.value === val)
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

  // const handleManualChange = (nameValue: string, rmValue: string) => {
  //   setManualName(nameValue)
  //   setManualRM(rmValue)
  //   if (nameValue) {
  //     onSelect({
  //       patientId: 'MANUAL',
  //       patientName: nameValue,
  //       medicalRecordNumber: rmValue,
  //       encounterId: null,
  //       serviceType: 'LUAR'
  //     })
  //   } else {
  //     onSelect(null)
  //   }
  // }

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

      <div className="flex-1">
        <Select
          className="w-full"
          optionLabelProp="display"
          showSearch
          placeholder={
            serviceType === 'LUAR'
              ? 'Cari Pasien Luar (Ketik nama)...'
              : 'Cari Nama Pasien atau No. RM (Pilih layanan dulu)'
          }
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
