import { SearchOutlined } from '@ant-design/icons'
import { client } from '@renderer/utils/client'
import { Card, Checkbox, Empty, Form, Input, Select, Tag } from 'antd'
import type { FormInstance } from 'antd'
import { useEffect, useMemo, useState } from 'react'

type ServiceRequestCategoryValue = 'laboratory' | 'imaging'

interface MasterServiceRequestCodeItem {
  id: number
  loinc: string
  display: string
  category: string
  serviceType: 'laboratory' | 'radiology'
}

interface SelectedServiceRequestCodeValue {
  masterServiceRequestCodeId: number
  code: string
  display: string
  system: string
}

function mapServiceRequestCategoryToTerminologyDomain(
  category?: ServiceRequestCategoryValue
): 'laboratory' | 'radiology' {
  return category === 'imaging' ? 'radiology' : 'laboratory'
}

interface Props {
  form: FormInstance
}

interface ServiceRequestCodeSelectorProps {
  category?: ServiceRequestCategoryValue
  value?: SelectedServiceRequestCodeValue[]
  onChange?: (value: SelectedServiceRequestCodeValue[]) => void
}

function ServiceRequestCodeSelector({
  category,
  value = [],
  onChange
}: ServiceRequestCodeSelectorProps) {
  const [terminologySearch, setTerminologySearch] = useState('')

  const terminologyDomain = useMemo(
    () => mapServiceRequestCategoryToTerminologyDomain(category),
    [category]
  )

  const { data: terminologyData, isLoading: isLoadingTerminology } =
    client.laboratoryManagement.getServiceRequestCodes.useQuery(
      {
        domain: terminologyDomain,
        query: terminologySearch.trim() || undefined
      },
      {
        queryKey: [
          'lab-queue-service-request-codes',
          { domain: terminologyDomain, query: terminologySearch }
        ]
      }
    )

  const terminologyOptions = useMemo(() => {
    const result = terminologyData?.result as
      | { laboratory?: MasterServiceRequestCodeItem[]; radiology?: MasterServiceRequestCodeItem[] }
      | undefined
    const items: MasterServiceRequestCodeItem[] = [
      ...(result?.laboratory ?? []),
      ...(result?.radiology ?? [])
    ]

    return items.map((item) => ({
      masterServiceRequestCodeId: item.id,
      code: item.loinc,
      display: item.display,
      system: 'http://loinc.org'
    }))
  }, [terminologyData])

  const selectedIds = useMemo(
    () => new Set(value.map((item) => item.masterServiceRequestCodeId)),
    [value]
  )

  useEffect(() => {
    setTerminologySearch('')
  }, [category])

  const handleCheckedChange = (checked: boolean, item: SelectedServiceRequestCodeValue) => {
    if (checked) {
      if (selectedIds.has(item.masterServiceRequestCodeId)) return
      onChange?.([...value, item])
      return
    }

    onChange?.(
      value.filter(
        (selectedItem) =>
          selectedItem.masterServiceRequestCodeId !== item.masterServiceRequestCodeId
      )
    )
  }

  const handleRemoveSelected = (masterServiceRequestCodeId: number) => {
    onChange?.(
      value.filter((item) => item.masterServiceRequestCodeId !== masterServiceRequestCodeId)
    )
  }

  return (
    <div className="space-y-3">
      <Input
        allowClear
        value={terminologySearch}
        onChange={(event) => setTerminologySearch(event.target.value)}
        placeholder="Cari kode atau nama pemeriksaan"
        prefix={<SearchOutlined />}
      />

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((item) => (
            <Tag
              key={item.masterServiceRequestCodeId}
              color="blue"
              closable
              onClose={() => handleRemoveSelected(item.masterServiceRequestCodeId)}
            >
              {item.code} - {item.display}
            </Tag>
          ))}
        </div>
      ) : (
        <div className="text-xs text-gray-500">
          Pilih satu atau lebih kode pemeriksaan dari daftar di bawah.
        </div>
      )}

      {terminologyOptions.length > 0 ? (
        <div className="grid max-h-72 grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2">
          {terminologyOptions.map((item) => {
            const isChecked = selectedIds.has(item.masterServiceRequestCodeId)

            return (
              <Card
                key={item.masterServiceRequestCodeId}
                size="small"
                className={`cursor-pointer transition-all ${
                  isChecked ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => handleCheckedChange(!isChecked, item)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isChecked}
                    onChange={(event) => handleCheckedChange(event.target.checked, item)}
                    onClick={(event) => event.stopPropagation()}
                  />
                  <div className="min-w-0">
                    <div className="font-medium text-gray-800">{item.display}</div>
                    <div className="text-xs text-gray-500">{item.code}</div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-gray-200 p-4">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              isLoadingTerminology
                ? 'Memuat kode pemeriksaan...'
                : 'Kode pemeriksaan tidak ditemukan'
            }
          />
        </div>
      )}
    </div>
  )
}

export default function CreateServiceRequestForm({ form }: Props) {
  const selectedCategory = Form.useWatch('category', form) as
    | ServiceRequestCategoryValue
    | undefined

  useEffect(() => {
    form.setFieldsValue({
      selectedServiceRequestCodes: [],
      system: 'http://loinc.org'
    })
  }, [selectedCategory, form])

  return (
    <Form form={form} layout="vertical">
      <Form.Item
        name="category"
        label="Kategori Service Request"
        rules={[{ required: true, message: 'Harap pilih kategori' }]}
      >
        <Select
          options={[
            { value: 'laboratory', label: 'Laboratory' },
            { value: 'imaging', label: 'Imaging (Radiology)' }
          ]}
        />
      </Form.Item>

      <Form.Item
        name="selectedServiceRequestCodes"
        label="Kode Pemeriksaan"
        rules={[
          {
            validator: (_, value: SelectedServiceRequestCodeValue[] | undefined) => {
              if (Array.isArray(value) && value.length > 0) {
                return Promise.resolve()
              }

              return Promise.reject(new Error('Harap pilih minimal satu kode pemeriksaan'))
            }
          }
        ]}
      >
        <ServiceRequestCodeSelector category={selectedCategory} />
      </Form.Item>

      <Form.Item
        name="priority"
        label="Prioritas"
        rules={[{ required: true, message: 'Harap pilih prioritas' }]}
      >
        <Select
          options={[
            { value: 'routine', label: 'Routine' },
            { value: 'urgent', label: 'Urgent' },
            { value: 'asap', label: 'ASAP' },
            { value: 'stat', label: 'STAT' }
          ]}
        />
      </Form.Item>

      <Form.Item name="system" label="Coding System">
        <Input placeholder="http://loinc.org" />
      </Form.Item>

      <Form.Item name="patientInstruction" label="Instruksi Pasien (opsional)">
        <Input.TextArea rows={3} placeholder="Tambahkan instruksi bila diperlukan" />
      </Form.Item>
    </Form>
  )
}
