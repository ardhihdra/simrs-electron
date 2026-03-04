import { GeneralConsentForm } from '@renderer/components/organisms/GeneralConsentForm'
import { client } from '@renderer/utils/client'

import { Button, DatePicker, Form, Input, message, Select, Steps } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { PatientAttributes } from 'simrs-types'

type PatientFormValues = Omit<PatientAttributes, 'birthDate'> & {
  birthDate: Dayjs
  district?: string
  village?: string
  relatedPerson?: any[]
}

// Wrapper component to isolate re-renders caused by useWatch
const GeneralConsentWrapper = ({
  form,
  visible
}: {
  form: import('antd').FormInstance
  visible: boolean
}) => {
  const patientName = Form.useWatch('name', form)
  const patientBirthDate = Form.useWatch('birthDate', form)
  const patientAddress = Form.useWatch('address', form)
  const patientPhone = Form.useWatch('phone', form)

  return (
    <div style={{ display: visible ? 'block' : 'none' }}>
      <GeneralConsentForm
        form={form}
        patientData={{
          name: patientName,
          birthDate: patientBirthDate,
          addressLine: patientAddress,
          phone: patientPhone
        }}
      />
    </div>
  )
}

export interface PatientFormComponentProps {
  id?: string
  onSuccess?: (data?: any) => void
  onCancel?: () => void
}

export function PatientFormComponent({ id, onSuccess, onCancel }: PatientFormComponentProps) {
  const [form] = Form.useForm<PatientFormValues>()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  // Use passed id or fallback to undefined (for create mode)
  const isEdit = !!id

  const detail = client.patient.getById.useQuery(
    { id: id || '' },
    {
      enabled: isEdit,
      queryKey: ['patient', { id: id as string }]
    }
  )

  useEffect(() => {
    const item = detail.data?.result as
      | Partial<PatientAttributes & { district: string; village: string }>
      | undefined
    if (item) {
      form.setFieldsValue({
        nik: item.nik,
        name: item.name,
        gender: item.gender,
        birthDate: item.birthDate ? dayjs(item.birthDate as unknown as string) : undefined,
        phone: item.phone ?? undefined,
        email: item.email ?? undefined,
        address: item.address ?? undefined,
        province: item.province ?? undefined,
        city: item.city ?? undefined,
        district: item.district ?? undefined,
        village: item.village ?? undefined,
        postalCode: item.postalCode ?? undefined,
        country: item.country ?? undefined,
        maritalStatus: item.maritalStatus ?? undefined
      })
    }
  }, [detail.data, form])

  const createMutation = client.patient.create.useMutation({
    onSuccess: (data) => {
      message.success('Pasien berhasil disimpan')
      form.resetFields()
      if (onSuccess) {
        onSuccess(data)
      } else {
        navigate('/dashboard/patient')
      }
    },
    onError: (error) => {
      message.error(error.message || 'Failed to create patient')
    }
  })

  const updateMutation = client.patient.update.useMutation({
    onSuccess: (data) => {
      message.success('Pasien berhasil diperbarui')
      if (onSuccess) {
        onSuccess(data)
      } else {
        navigate('/dashboard/patient')
      }
    },
    onError: (error) => {
      message.error(error.message || 'Failed to update patient')
    }
  })

  const onFinish = async (values: PatientFormValues) => {
    try {
      setSubmitting(true)
      const payload: any = {
        active: values.active ?? true,
        nik: values.nik,
        medicalRecordNumber: '', // Placeholder as per schema requirement if strictly validated
        name: values.name,
        gender: values.gender,
        birthDate: values.birthDate.format('YYYY-MM-DD'),
        phone: values.phone ?? '',
        email: values.email ?? '',
        address: values.address ?? '',
        province: values.province ?? '',
        city: values.city ?? '',
        district: values.district ?? '',
        village: values.village ?? '',
        postalCode: values.postalCode ?? '',
        country: values.country ?? '',
        maritalStatus: values.maritalStatus ?? '',
        relatedPerson: values.relatedPerson ?? [],
        insuranceProvider: null,
        insuranceNumber: null,
        fhirId: null,
        fhirServer: null,
        fhirVersion: null,
        lastFhirUpdated: null,
        lastSyncedAt: null
      }
      if (isEdit && id) {
        await updateMutation.mutateAsync({ ...payload, id: id })
      } else {
        await createMutation.mutateAsync(payload)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const next = async () => {
    try {
      // Validate explicit fields for the first step
      await form.validateFields([
        'nik',
        'name',
        'gender',
        'birthDate',
        'phone',
        'email',
        'address',
        'city',
        'district',
        'village',
        'province',
        'postalCode',
        'country',
        'maritalStatus'
      ])
      setCurrentStep(currentStep + 1)
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const prev = () => {
    setCurrentStep(currentStep - 1)
  }

  const selectedProvince = Form.useWatch('province', form)
  const selectedCity = Form.useWatch('city', form)
  const selectedDistrict = Form.useWatch('district', form)

  const provincesQuery = client.wilayah.getProvince.useQuery({ parentCode: 'null' })
  const citiesQuery = client.wilayah.getWilayahFromParentCode.useQuery(
    { parentCode: selectedProvince! },
    {
      enabled: !!selectedProvince,
      queryKey: ['wilayah', { parentCode: selectedProvince }]
    }
  )
  const districtsQuery = client.wilayah.getWilayahFromParentCode.useQuery(
    { parentCode: selectedCity! },
    {
      enabled: !!selectedCity,
      queryKey: ['wilayah', { parentCode: selectedCity }]
    }
  )
  const villagesQuery = client.wilayah.getWilayahFromParentCode.useQuery(
    { parentCode: selectedDistrict! },
    {
      enabled: !!selectedDistrict,
      queryKey: ['wilayah', { parentCode: selectedDistrict as string }]
    }
  )
  console.log('DETAIL DATA', detail.data)
  console.log('isEdit', isEdit)
  return (
    <div className="my-4 space-y-6">
      <div className="w-full max-w-xl mx-auto">
        <Steps
          current={currentStep}
          items={[
            {
              title: 'Biodata Pasien'
            },
            {
              title: 'General Consent'
            }
          ]}
        />
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish} className="w-full mt-6">
        <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="NIK" name="nik" rules={[{ required: true, message: 'NIK wajib' }]}>
              <Input placeholder="Nomor Induk Kependudukan" />
            </Form.Item>
            <Form.Item label="Nama" name="name" rules={[{ required: true, message: 'Nama wajib' }]}>
              <Input placeholder="Nama pasien" />
            </Form.Item>
            <Form.Item
              label="Gender"
              name="gender"
              rules={[{ required: true, message: 'Pilih gender' }]}
            >
              <Select placeholder="Pilih gender">
                <Select.Option value="male">Laki-laki</Select.Option>
                <Select.Option value="female">Perempuan</Select.Option>
                <Select.Option value="other">Lainnya</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="Tanggal Lahir"
              name="birthDate"
              rules={[{ required: true, message: 'Tanggal lahir wajib' }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item label="Nomor Telepon" name="phone">
              <Input placeholder="Nomor telepon" />
            </Form.Item>
            <Form.Item label="Email" name="email">
              <Input placeholder="Email" />
            </Form.Item>
            <Form.Item label="Alamat" name="address">
              <Input placeholder="Alamat" />
            </Form.Item>
            <Form.Item label="Provinsi" name="province">
              <Select
                placeholder="Pilih Provinsi"
                showSearch
                optionFilterProp="children"
                loading={provincesQuery.isLoading}
                onChange={() => {
                  form.setFieldsValue({ city: undefined, district: undefined, village: undefined })
                }}
              >
                {Array.isArray(provincesQuery.data?.result) &&
                  provincesQuery.data.result.map((p: any) => (
                    <Select.Option key={p.code} value={p.code}>
                      {p.name}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>
            <Form.Item label="Kabupaten/Kota" name="city">
              <Select
                placeholder="Pilih Kabupaten/Kota"
                showSearch
                optionFilterProp="children"
                loading={citiesQuery.isLoading}
                disabled={!selectedProvince}
                onChange={() => {
                  form.setFieldsValue({ district: undefined, village: undefined })
                }}
              >
                {Array.isArray(citiesQuery.data?.result) &&
                  citiesQuery.data.result.map((c: any) => (
                    <Select.Option key={c.code} value={c.code}>
                      {c.name}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>
            <Form.Item label="Kecamatan" name="district">
              <Select
                placeholder="Pilih Kecamatan"
                showSearch
                optionFilterProp="children"
                loading={districtsQuery.isLoading}
                disabled={!selectedCity}
                onChange={() => {
                  form.setFieldsValue({ village: undefined })
                }}
              >
                {Array.isArray(districtsQuery.data?.result) &&
                  districtsQuery.data.result.map((d: any) => (
                    <Select.Option key={d.code} value={d.code}>
                      {d.name}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>
            <Form.Item label="Desa/Kelurahan" name="village">
              <Select
                placeholder="Pilih Desa/Kelurahan"
                showSearch
                optionFilterProp="children"
                loading={villagesQuery.isLoading}
                disabled={!selectedDistrict}
              >
                {Array.isArray(villagesQuery.data?.result) &&
                  villagesQuery.data.result.map((v: any) => (
                    <Select.Option key={v.code} value={v.code}>
                      {v.name}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>
            <Form.Item label="Kode Pos" name="postalCode">
              <Input placeholder="Kode pos" />
            </Form.Item>
            <Form.Item label="Negara" name="country">
              <Input placeholder="Negara" />
            </Form.Item>
            <Form.Item
              label="Status Pernikahan"
              name="maritalStatus"
              rules={[{ required: true, message: 'Pilih status pernikahan' }]}
            >
              <Select placeholder="Pilih status pernikahan">
                <Select.Option value="single">Belum menikah</Select.Option>
                <Select.Option value="married">Menikah</Select.Option>
                <Select.Option value="divorced">Cerai</Select.Option>
              </Select>
            </Form.Item>

            <div className="col-span-2 mt-2">
              <Form.List name="relatedPerson">
                {(fields, { add, remove }) => (
                  <div className="space-y-3 p-4 border rounded-md bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Keluarga/Kerabat Terdekat
                      </label>
                      <Button type="dashed" onClick={() => add()} size="small">
                        + Tambah Kerabat
                      </Button>
                    </div>
                    {fields.map(({ key, name, ...restField }) => (
                      <div
                        key={key}
                        className="grid grid-cols-12 gap-2 items-start bg-white p-3 border rounded relative"
                      >
                        <Form.Item
                          {...restField}
                          name={[name, 'name']}
                          rules={[{ required: true, message: 'Nama wajib' }]}
                          className="col-span-4 mb-0"
                        >
                          <Input placeholder="Nama (e.g. Bob Smith)" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'phone']}
                          rules={[{ required: true, message: 'Telepon wajib' }]}
                          className="col-span-4 mb-0"
                        >
                          <Input placeholder="Telepon (e.g. 08123..)" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'relationship']}
                          rules={[{ required: true, message: 'Hubungan wajib' }]}
                          className="col-span-3 mb-0"
                        >
                          <Select placeholder="Hubungan (Pilih)">
                            {/* Common FHIR/SatuSehat Relationship mapping */}
                            <Select.Option value="SPS">Suami/Istri (Spouse)</Select.Option>
                            <Select.Option value="FTH">Ayah (Father)</Select.Option>
                            <Select.Option value="MTH">Ibu (Mother)</Select.Option>
                            <Select.Option value="CHILD">Anak (Child)</Select.Option>
                            <Select.Option value="SIB">Saudara Kandung (Sibling)</Select.Option>
                            <Select.Option value="GRPRN">Kakek/Nenek (Grandparent)</Select.Option>
                            <Select.Option value="O">Lainnya (Other)</Select.Option>
                          </Select>
                        </Form.Item>
                        <div className="col-span-1 flex justify-end">
                          <Button type="text" danger onClick={() => remove(name)}>
                            X
                          </Button>
                        </div>
                      </div>
                    ))}
                    {fields.length === 0 && (
                      <div className="text-sm text-gray-500 italic text-center py-2">
                        Belum ada kerabat ditambahkan
                      </div>
                    )}
                  </div>
                )}
              </Form.List>
            </div>
          </div>
        </div>

        <GeneralConsentWrapper form={form} visible={currentStep === 1} />

        <div className="mt-6 flex justify-end gap-2">
          {currentStep > 0 && <Button onClick={prev}>Kembali</Button>}
          {currentStep < 1 && (
            <Button type="primary" onClick={next}>
              Selanjutnya
            </Button>
          )}
          {currentStep === 1 && (
            <Button type="primary" htmlType="submit" loading={submitting}>
              {isEdit ? 'Update' : 'Simpan'}
            </Button>
          )}

          <Button
            htmlType="button"
            onClick={() => {
              form.resetFields()
              if (onCancel) {
                onCancel()
              } else {
                navigate('/dashboard/patient')
              }
            }}
          >
            Batal
          </Button>
        </div>
      </Form>
    </div>
  )
}

function PatientForm() {
  const params = useParams<{ id: string }>()
  console.log('IsHasId :', params?.id)
  return <PatientFormComponent id={params.id} />
}

export default PatientForm
