import { client } from '@renderer/utils/client'
import { Form, Input, Select } from 'antd'
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

  const { data: terminologyData, isLoading: isLoadingTerminology } =
    client.laboratoryManagement.getServiceRequestCodes.useQuery(
      {
        domain: terminologyDomain,
        query: terminologySearch.trim() || undefined,
      },
      {
        queryKey: ['lab-queue-service-request-codes', { domain: terminologyDomain, query: terminologySearch }],
      }
    )

  const terminologyOptions = useMemo(() => {
    const result = terminologyData?.result as { laboratory?: MasterServiceRequestCodeItem[]; radiology?: MasterServiceRequestCodeItem[] } | undefined
    const items: MasterServiceRequestCodeItem[] = [
      ...(result?.laboratory ?? []),
      ...(result?.radiology ?? []),
    ]
    return items.map((item) => ({
      value: item.id,
      label: `${item.loinc} - ${item.display}`,
      meta: item,
    }))
  }, [terminologyData])

  useEffect(() => {
    form.setFieldsValue({ code: undefined, display: undefined, system: 'http://loinc.org', masterServiceRequestCodeId: undefined })
    setTerminologySearch('')
  }, [selectedCategory, form])

  const handleSelectCode = (id: number) => {
    const option = terminologyOptions.find((item) => item.value === id)
    if (!option) return
    form.setFieldsValue({
      masterServiceRequestCodeId: option.meta.id,
      code: option.meta.loinc,
      display: option.meta.display,
      system: 'http://loinc.org',
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
        name="masterServiceRequestCodeId"
        label="Kode Pemeriksaan"
        rules={[{ required: true, message: 'Harap pilih kode pemeriksaan' }]}
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

      <Form.Item name="code" label="LOINC Code">
        <Input readOnly placeholder="Terisi otomatis" />
      </Form.Item>

      <Form.Item
        name="display"
        label="Nama Pemeriksaan"
        rules={[{ required: true, message: 'Harap isi nama pemeriksaan' }]}
      >
        <Input placeholder="Terisi otomatis" />
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
