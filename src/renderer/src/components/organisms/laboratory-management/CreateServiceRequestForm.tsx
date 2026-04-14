import { SearchOutlined } from '@ant-design/icons'
import { client } from '@renderer/utils/client'
import type { FormInstance } from 'antd'
import { Card, Checkbox, Empty, Form, Input, Select, Tag } from 'antd'
import type { ReactElement } from 'react'
import { useEffect, useMemo, useState } from 'react'

type ServiceRequestDomainValue = 'laboratory' | 'radiology'
type ServiceRequestCategoriesResponse = {
  laboratory?: string[]
  radiology?: string[]
}

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
  category: string
}

function mapServiceRequestCategoryToTerminologyDomain(
  category?: ServiceRequestDomainValue
): 'laboratory' | 'radiology' {
  return category === 'radiology' ? 'radiology' : 'laboratory'
}

function formatCategoryLabel(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

interface Props {
  form: FormInstance
  fixedCategory?: ServiceRequestDomainValue
  extraFields?: () => ReactElement | null
}

interface ServiceRequestCodeSelectorProps {
  domain?: ServiceRequestDomainValue
  categoryCodes?: string[]
  value?: SelectedServiceRequestCodeValue[]
  onChange?: (value: SelectedServiceRequestCodeValue[]) => void
}

function ServiceRequestCodeSelector({
  domain,
  categoryCodes = [],
  value = [],
  onChange
}: ServiceRequestCodeSelectorProps) {
  const [terminologySearch, setTerminologySearch] = useState('')
  const categoryCodesKey = useMemo(() => categoryCodes.join('|'), [categoryCodes])

  const terminologyDomain = useMemo(
    () => mapServiceRequestCategoryToTerminologyDomain(domain),
    [domain]
  )

  const { data: terminologyData, isLoading: isLoadingTerminology } =
    client.laboratoryManagement.getServiceRequestCodes.useQuery(
      {
        domain: terminologyDomain,
        query: terminologySearch.trim() || undefined
      },
      {
        enabled: !!domain,
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

    const selectedCategoryKeys = new Set(
      categoryCodes.map((category) => String(category).trim().toLowerCase()).filter(Boolean)
    )

    return items
      .filter((item) =>
        selectedCategoryKeys.size === 0
          ? false
          : selectedCategoryKeys.has(String(item.category).trim().toLowerCase())
      )
      .map((item) => ({
        masterServiceRequestCodeId: item.id,
        code: item.loinc,
        display: item.display,
        system: 'http://loinc.org',
        category: item.category
      }))
  }, [categoryCodes, terminologyData])

  const selectedIds = useMemo(
    () => new Set(value.map((item) => item.masterServiceRequestCodeId)),
    [value]
  )

  useEffect(() => {
    setTerminologySearch('')
  }, [categoryCodesKey, domain])

  const hasSelectedCategories = categoryCodes.length > 0

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
        disabled={!domain || !hasSelectedCategories}
        value={terminologySearch}
        onChange={(event) => setTerminologySearch(event.target.value)}
        placeholder={
          !domain
            ? 'Pilih kategori service request terlebih dahulu'
            : !hasSelectedCategories
              ? 'Pilih minimal satu kategori pemeriksaan terlebih dahulu'
              : 'Cari kode atau nama pemeriksaan'
        }
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
          {domain && hasSelectedCategories
            ? 'Pilih satu atau lebih kode pemeriksaan dari daftar di bawah.'
            : 'Pilih kategori service request dan kategori pemeriksaan untuk menampilkan daftar kode.'}
        </div>
      )}

      {domain && hasSelectedCategories && terminologyOptions.length > 0 ? (
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
              !domain
                ? 'Pilih kategori service request terlebih dahulu'
                : !hasSelectedCategories
                  ? 'Pilih minimal satu kategori pemeriksaan terlebih dahulu'
                  : isLoadingTerminology
                    ? 'Memuat kode pemeriksaan...'
                    : 'Kode pemeriksaan tidak ditemukan'
            }
          />
        </div>
      )}
    </div>
  )
}

export default function CreateServiceRequestForm({ form, fixedCategory, extraFields }: Props) {
  const watchedCategory = Form.useWatch('category', form) as ServiceRequestDomainValue | undefined
  const selectedCategory = fixedCategory || watchedCategory
  const selectedCategoryCodes = (Form.useWatch('serviceRequestCodeCategories', form) as
    | string[]
    | undefined) ?? []
  const selectedCategoryCodesKey = useMemo(
    () => selectedCategoryCodes.join('|'),
    [selectedCategoryCodes]
  )

  const { data: categoryData, isLoading: isLoadingCategories } =
    client.laboratoryManagement.getServiceRequestCategories.useQuery(
      {},
      {
        // @ts-ignore - queryKey is not assignable to type never
        queryKey: ['lab-service-request-categories']
      }
    )

  const categoryOptions = useMemo(() => {
    const result = categoryData?.result as ServiceRequestCategoriesResponse | undefined
    const items =
      selectedCategory === 'radiology' ? (result?.radiology ?? []) : (result?.laboratory ?? [])

    return items.map((item) => ({
      value: item,
      label: formatCategoryLabel(item)
    }))
  }, [categoryData, selectedCategory])

  useEffect(() => {
    if (fixedCategory) {
      form.setFieldValue('category', fixedCategory)
    }
  }, [fixedCategory, form])

  useEffect(() => {
    form.setFieldsValue({
      serviceRequestCodeCategories: [],
      selectedServiceRequestCodes: [],
      system: 'http://loinc.org'
    })
  }, [selectedCategory, form])

  useEffect(() => {
    form.setFieldValue('selectedServiceRequestCodes', [])
  }, [selectedCategoryCodesKey, form])

  return (
    <Form form={form} layout="vertical">
      <Form.Item
        name="category"
        label="Kategori Service Request"
        rules={[{ required: true, message: 'Harap pilih kategori' }]}
      >
        <Select
          disabled={!!fixedCategory}
          options={[
            { value: 'laboratory', label: 'Laboratory' },
            { value: 'radiology', label: 'Radiology' }
          ]}
        />
      </Form.Item>

      <Form.Item
        name="serviceRequestCodeCategories"
        label="Kategori Pemeriksaan"
        rules={[
          {
            validator: (_, value: string[] | undefined) => {
              if (Array.isArray(value) && value.length > 0) {
                return Promise.resolve()
              }

              return Promise.reject(new Error('Harap pilih minimal satu kategori pemeriksaan'))
            }
          }
        ]}
      >
        <Checkbox.Group
          disabled={!selectedCategory || isLoadingCategories}
          options={categoryOptions}
          className="grid grid-cols-1 gap-2 md:grid-cols-2"
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
        <ServiceRequestCodeSelector
          domain={selectedCategory}
          categoryCodes={selectedCategoryCodes}
        />
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

      {extraFields ? <>{extraFields()}</> : null}
    </Form>
  )
}
