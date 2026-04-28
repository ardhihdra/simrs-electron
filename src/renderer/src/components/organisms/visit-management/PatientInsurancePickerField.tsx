import { useQuery } from '@tanstack/react-query'
import type { FormInstance } from 'antd'
import { Button, Empty, Form, Input, List, Modal, Space, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'

import {
  buildPatientInsuranceLabel,
  filterPatientInsuranceRows,
  normalizePatientInsuranceRows,
  type PatientInsuranceRecord
} from './patient-insurance-picker'

type MitraOption = {
  value: number
  label: string
}

type PatientInsurancePickerFieldProps = {
  form: FormInstance
  patientId?: string
  mitraOptions?: MitraOption[]
  numberFieldName?: string
  mitraFieldName?: string
  insuranceIdFieldName?: string
  expiredFieldName?: string
  label?: string
  required?: boolean
  disabled?: boolean
}

const toOptionalNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

const buildSelectionDescription = (
  row: PatientInsuranceRecord | undefined,
  mitraNameMap: Record<number, string>
) => {
  if (!row) return null

  const mitraName =
    row.mitraId != null
      ? mitraNameMap[Number(row.mitraId)] || `Mitra ${row.mitraId}`
      : 'Tanpa mitra'
  const expiry = row.mitraCodeExpiredDate
    ? dayjs(row.mitraCodeExpiredDate).isValid()
      ? dayjs(row.mitraCodeExpiredDate).format('DD MMM YYYY')
      : 'Tanggal expired tidak valid'
    : 'Tanpa expired'

  return `${mitraName} • ${expiry}`
}

export default function PatientInsurancePickerField({
  form,
  patientId,
  mitraOptions = [],
  numberFieldName = 'mitraCodeNumber',
  mitraFieldName = 'mitraId',
  insuranceIdFieldName = 'patientInsuranceId',
  expiredFieldName = 'mitraCodeExpiredDate',
  label = 'Nomor Kartu',
  required = true,
  disabled = false
}: PatientInsurancePickerFieldProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const selectedMitraId = Form.useWatch(mitraFieldName, form)
  const selectedInsuranceId = Form.useWatch(insuranceIdFieldName, form)
  const queryApi = (window.api?.query as any)?.patientInsurance

  const insuranceQuery = useQuery({
    queryKey: ['patientInsurancePicker', patientId],
    enabled: !!patientId && !!queryApi?.listAll,
    queryFn: () =>
      queryApi.listAll({
        patientId,
        isActive: true
      })
  })

  const mitraNameMap = useMemo(() => {
    return mitraOptions.reduce<Record<number, string>>((acc, option) => {
      acc[Number(option.value)] = option.label
      return acc
    }, {})
  }, [mitraOptions])

  const insuranceRows = useMemo(
    () => normalizePatientInsuranceRows(insuranceQuery.data),
    [insuranceQuery.data]
  )

  const filteredRows = useMemo(() => {
    return filterPatientInsuranceRows(
      insuranceRows,
      mitraOptions.map((option) => Number(option.value)),
      toOptionalNumber(selectedMitraId)
    )
  }, [insuranceRows, mitraOptions, selectedMitraId])

  const selectedInsurance = useMemo(
    () => filteredRows.find((row) => Number(row.id) === Number(selectedInsuranceId)),
    [filteredRows, selectedInsuranceId]
  )

  useEffect(() => {
    if (!selectedInsuranceId) {
      return
    }

    if (!patientId) {
      form.setFieldValue(insuranceIdFieldName, undefined)
      return
    }

    if (insuranceQuery.isLoading || insuranceQuery.isRefetching) {
      return
    }

    if (selectedInsurance) {
      return
    }

    form.setFieldValue(insuranceIdFieldName, undefined)
  }, [
    form,
    insuranceIdFieldName,
    insuranceQuery.isLoading,
    insuranceQuery.isRefetching,
    patientId,
    selectedInsurance,
    selectedInsuranceId
  ])

  const selectedInsuranceLabel = useMemo(
    () => buildSelectionDescription(selectedInsurance, mitraNameMap),
    [mitraNameMap, selectedInsurance]
  )

  const handleManualNumberChange = () => {
    if (!form.getFieldValue(insuranceIdFieldName)) {
      return
    }

    form.setFieldValue(insuranceIdFieldName, undefined)
  }

  const handleSelectInsurance = (row: PatientInsuranceRecord) => {
    form.setFieldsValue({
      [insuranceIdFieldName]: row.id,
      [mitraFieldName]: row.mitraId ?? undefined,
      [numberFieldName]: row.mitraCodeNumber ?? undefined,
      [expiredFieldName]: row.mitraCodeExpiredDate ? dayjs(row.mitraCodeExpiredDate) : undefined
    })
    setIsModalOpen(false)
  }
  return (
    <>
      <Form.Item label={label} required={required}>
        <Space.Compact style={{ width: '100%' }}>
          <Form.Item
            name={numberFieldName}
            noStyle
            rules={required ? [{ required: true, message: 'Harap isi nomor kartu' }] : undefined}
          >
            <Input
              disabled={disabled}
              onChange={handleManualNumberChange}
              placeholder="Nomor kartu/nomor mitra"
            />
          </Form.Item>
          <Button disabled={disabled || !patientId} onClick={() => setIsModalOpen(true)}>
            Ambil Data Pasien
          </Button>
        </Space.Compact>
      </Form.Item>

      {selectedInsurance ? (
        <div style={{ marginBottom: 16 }}>
          <Tag color="blue">Data pasien terpilih</Tag>
          <Typography.Text type="secondary">{selectedInsuranceLabel}</Typography.Text>
        </div>
      ) : null}

      <Modal
        title="Pilih Data Asuransi Pasien"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        {!patientId ? (
          <Empty description="Pilih pasien terlebih dahulu" />
        ) : filteredRows.length === 0 &&
          !insuranceQuery.isLoading &&
          !insuranceQuery.isRefetching ? (
          <Empty description="Belum ada data asuransi pasien yang cocok" />
        ) : (
          <List
            dataSource={filteredRows}
            loading={insuranceQuery.isLoading || insuranceQuery.isRefetching}
            renderItem={(row) => (
              <List.Item
                actions={[
                  <Button
                    key={`pick-${row.id}`}
                    type="link"
                    onClick={() => handleSelectInsurance(row)}
                  >
                    Pilih
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={buildPatientInsuranceLabel(row, mitraNameMap)}
                  // description={
                  //   row.mitraId != null ? `Mitra ID: ${row.mitraId}` : 'Data mitra belum ditentukan'
                  // }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </>
  )
}
