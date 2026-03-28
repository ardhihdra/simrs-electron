import { client } from '@renderer/utils/client'
import { Form, Input, Select } from 'antd'
import type { FormInstance } from 'antd'
import { useEffect, useMemo, useState } from 'react'

type ServiceRequestCategoryValue = 'laboratory' | 'imaging'

interface TerminologyItem {
  loinc: string
  name: string
  system?: string
}

function normalizeList<T>(data: unknown): T[] {
  const raw = data as { result?: T[]; data?: T[] } | T[]
  return ((raw as { result?: T[]; data?: T[] })?.result ?? (raw as { data?: T[] })?.data ?? (raw as T[]) ?? [])
}

function mapServiceRequestCategoryToTerminologyDomain(
  category?: ServiceRequestCategoryValue
): 'laboratory' | 'radiology' {
  return category === 'imaging' ? 'radiology' : 'laboratory'
}

interface Props {
  form: FormInstance
}

export default function CreateServiceRequestForm({ form }: Props) {
  const [terminologySearch, setTerminologySearch] = useState('')
  const selectedCategory = Form.useWatch('category', form) as ServiceRequestCategoryValue | undefined

  const terminologyDomain = useMemo(
    () => mapServiceRequestCategoryToTerminologyDomain(selectedCategory),
    [selectedCategory]
  )

  const terminologyQuery = useMemo(
    () => ({
      domain: terminologyDomain,
      query: terminologySearch.trim() || undefined,
      limit: 50
    }),
    [terminologyDomain, terminologySearch]
  )

  const { data: terminologyData, isLoading: isLoadingTerminology } =
    client.laboratoryManagement.searchTerminology.useQuery(terminologyQuery, {
      queryKey: ['lab-queue-terminology-search', terminologyQuery]
    } as Parameters<typeof client.laboratoryManagement.searchTerminology.useQuery>[1])

  const terminologyOptions = useMemo(() => {
    const items = normalizeList<TerminologyItem>(terminologyData)
    return items.map((item) => ({
      value: item.loinc,
      label: `${item.loinc} - ${item.name}`,
      meta: item
    }))
  }, [terminologyData])

  useEffect(() => {
    form.setFieldsValue({ code: undefined, display: undefined, system: 'http://loinc.org' })
    setTerminologySearch('')
  }, [selectedCategory, form])

  const handleSelectCode = (loincCode: string) => {
    const option = terminologyOptions.find((item) => item.value === loincCode)
    if (!option) return
    form.setFieldsValue({
      code: option.meta.loinc,
      display: option.meta.name,
      system: option.meta.system || 'http://loinc.org'
    })
  }

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
        name="code"
        label="Kode Pemeriksaan"
        rules={[{ required: true, message: 'Harap isi kode pemeriksaan' }]}
      >
        <Select
          showSearch
          filterOption={false}
          onSearch={setTerminologySearch}
          onChange={handleSelectCode}
          options={terminologyOptions}
          loading={isLoadingTerminology}
          placeholder="Cari kode pemeriksaan dari terminology service"
          notFoundContent="Kode pemeriksaan tidak ditemukan"
        />
      </Form.Item>

      <Form.Item
        name="display"
        label="Nama Pemeriksaan"
        rules={[{ required: true, message: 'Harap isi nama pemeriksaan' }]}
      >
        <Input placeholder="Contoh: Hemoglobin [Mass/volume] in Blood" />
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
