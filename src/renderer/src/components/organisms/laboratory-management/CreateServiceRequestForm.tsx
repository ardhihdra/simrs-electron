import { SearchOutlined } from '@ant-design/icons'
import { client } from '@renderer/utils/client'
import type { FormInstance } from 'antd'
import { Checkbox, Empty, Form, Input, Select, Switch, Tag } from 'antd'
import type { ReactElement } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { mapCitoToServiceRequestPriority } from './CreateServiceRequestForm.helpers'

type ServiceRequestDomainValue = 'laboratory' | 'radiology'

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
  value?: SelectedServiceRequestCodeValue[]
  onChange?: (value: SelectedServiceRequestCodeValue[]) => void
}

function ServiceRequestCodeSelector({
  domain,
  value = [],
  onChange
}: ServiceRequestCodeSelectorProps) {
  const [search, setSearch] = useState('')

  const terminologyDomain = useMemo(
    () => mapServiceRequestCategoryToTerminologyDomain(domain),
    [domain]
  )

  const { data: terminologyData, isLoading } =
    client.laboratoryManagement.getServiceRequestCodes.useQuery(
      {
        domain: terminologyDomain,
        query: search.trim() || undefined
      },
      {
        enabled: !!domain,
        queryKey: ['lab-queue-service-request-codes', { domain: terminologyDomain, query: search }]
      }
    )

  const groupedItems = useMemo(() => {
    const result = terminologyData?.result as
      | { laboratory?: MasterServiceRequestCodeItem[]; radiology?: MasterServiceRequestCodeItem[] }
      | undefined
    const items: MasterServiceRequestCodeItem[] = [
      ...(result?.laboratory ?? []),
      ...(result?.radiology ?? [])
    ]

    const groups = new Map<string, MasterServiceRequestCodeItem[]>()
    for (const item of items) {
      if (!groups.has(item.category)) groups.set(item.category, [])
      groups.get(item.category)!.push(item)
    }
    return groups
  }, [terminologyData])

  const selectedIds = useMemo(
    () => new Set(value.map((item) => item.masterServiceRequestCodeId)),
    [value]
  )

  useEffect(() => {
    setSearch('')
  }, [domain])

  const handleCheckedChange = (checked: boolean, item: SelectedServiceRequestCodeValue) => {
    if (checked) {
      if (selectedIds.has(item.masterServiceRequestCodeId)) return
      onChange?.([...value, item])
      return
    }
    onChange?.(
      value.filter((v) => v.masterServiceRequestCodeId !== item.masterServiceRequestCodeId)
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
        disabled={!domain}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={
          !domain
            ? 'Pilih kategori service request terlebih dahulu'
            : 'Cari kode atau nama pemeriksaan'
        }
        prefix={<SearchOutlined />}
      />

      {value.length > 0 && (
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
      )}

      {domain ? (
        groupedItems.size > 0 ? (
          <div className="max-h-96 overflow-y-auto grid grid-cols-1 gap-3 pr-1 md:grid-cols-2">
            {Array.from(groupedItems.entries()).map(([category, items]) => (
              <div key={category} className="overflow-hidden rounded-lg border border-gray-200">
                <div className="flex items-center gap-2.5 border-b border-blue-200 bg-blue-500 px-3 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white">
                    {formatCategoryLabel(category)}
                  </span>
                  <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium text-white">
                    {items.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5 p-2 md:grid-cols-2">
                  {items.map((item) => {
                    const mapped: SelectedServiceRequestCodeValue = {
                      masterServiceRequestCodeId: item.id,
                      code: item.loinc,
                      display: item.display,
                      system: 'http://loinc.org',
                      category: item.category
                    }
                    const isChecked = selectedIds.has(item.id)

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleCheckedChange(!isChecked, mapped)}
                        className={`flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2 transition-all ${
                          isChecked
                            ? 'border-blue-400 bg-blue-50 shadow-sm'
                            : 'border-transparent bg-white hover:border-blue-200 hover:bg-blue-50/40'
                        }`}
                      >
                        <Checkbox
                          checked={isChecked}
                          onChange={(event) => handleCheckedChange(event.target.checked, mapped)}
                          onClick={(event) => event.stopPropagation()}
                          className="mt-0.5 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium leading-snug text-gray-800">
                            {item.display}
                          </div>
                          <div className="mt-0.5 font-mono text-xs text-gray-400">{item.loinc}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-gray-200 p-4">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                isLoading ? 'Memuat kode pemeriksaan...' : 'Kode pemeriksaan tidak ditemukan'
              }
            />
          </div>
        )
      ) : (
        <div className="rounded-md border border-dashed border-gray-200 p-4">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Pilih kategori service request terlebih dahulu"
          />
        </div>
      )}
    </div>
  )
}

export default function CreateServiceRequestForm({ form, fixedCategory, extraFields }: Props) {
  const watchedCategory = Form.useWatch('category', form) as ServiceRequestDomainValue | undefined
  const watchedCito = Form.useWatch('cito', form) as boolean | undefined
  const selectedCategory = fixedCategory || watchedCategory

  useEffect(() => {
    if (fixedCategory) {
      form.setFieldValue('category', fixedCategory)
    }
  }, [fixedCategory, form])

  useEffect(() => {
    form.setFieldsValue({
      selectedServiceRequestCodes: [],
      cito: false,
      priority: mapCitoToServiceRequestPriority(false),
      system: 'http://loinc.org'
    })
  }, [selectedCategory, form])

  useEffect(() => {
    form.setFieldValue('priority', mapCitoToServiceRequestPriority(watchedCito))
  }, [form, watchedCito])

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
        <ServiceRequestCodeSelector domain={selectedCategory} />
      </Form.Item>

      <Form.Item
        name="cito"
        label="Cito"
        valuePropName="checked"
        tooltip="Aktifkan untuk order cito/stat"
      >
        <Switch checkedChildren="Ya" unCheckedChildren="Tidak" />
      </Form.Item>

      <Form.Item name="priority" hidden>
        <Input type="hidden" />
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
