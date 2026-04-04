import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { queryClient } from '@renderer/query-client'
import { client } from '@renderer/utils/client'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button, Card, Checkbox, Divider, Form, Select, Tag, TimePicker } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { BackendResponse, MedicalStaffScheduleSchemaWithId } from 'simrs-types'

interface DaySchedule {
  enabled: boolean
  startTime: string
  endTime: string
}

interface MedicalStaffScheduleFormData {
  idPegawai: number
  organizationId: string
  kategori: string
  senin: DaySchedule
  selasa: DaySchedule
  rabu: DaySchedule
  kamis: DaySchedule
  jumat: DaySchedule
  sabtu: DaySchedule
  minggu: DaySchedule
  status: 'active' | 'inactive'
}

const defaultDaySchedule = {
  enabled: false,
  startTime: dayjs('08:00', 'HH:mm'),
  endTime: dayjs('16:00', 'HH:mm')
}

export function MedicalStaffScheduleForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm()
  const isEdit = Boolean(id)

  const { data: detailData } = useQuery({
    queryKey: ['medicalStaffSchedule', 'detail', id],
    queryFn: () => {
      const fn = window.api?.query?.medicalStaffSchedule?.getById
      if (!fn)
        throw new Error(
          'API medical staff schedule tidak tersedia. Silakan restart aplikasi/dev server.'
        )
      return fn({ id: Number(id) })
    },
    enabled: isEdit
  })

  const { data: pegawaiData } = useQuery({
    queryKey: ['kepegawaian', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.kepegawaian?.list
      if (!fn) throw new Error('API kepegawaian tidak tersedia')
      return fn()
    }
  })

  const { data: organizationData } = client.query.entity.useQuery({
    model: 'organization',
    method: 'get',
    params: {
      items: '200',
      type: 'dept',
      depth: '2',
      sortBy: 'name',
      sortValue: '1'
    }
  })

  useEffect(() => {
    if (isEdit && detailData?.success && detailData.result) {
      const data = detailData.result
      const convertDaySchedule = (day: DaySchedule | undefined) => {
        if (!day) return defaultDaySchedule
        return {
          enabled: day.enabled,
          startTime: day.startTime ? dayjs(day.startTime, 'HH:mm') : dayjs('08:00', 'HH:mm'),
          endTime: day.endTime ? dayjs(day.endTime, 'HH:mm') : dayjs('16:00', 'HH:mm')
        }
      }

      const formValues = {
        idPegawai: data.idPegawai,
        organizationId: data.organizationId,
        kategori: data.kategori,
        status: data.status,
        senin: convertDaySchedule(data.senin),
        selasa: convertDaySchedule(data.selasa),
        rabu: convertDaySchedule(data.rabu),
        kamis: convertDaySchedule(data.kamis),
        jumat: convertDaySchedule(data.jumat),
        sabtu: convertDaySchedule(data.sabtu),
        minggu: convertDaySchedule(data.minggu)
      }

      form.setFieldsValue(formValues)
    }
  }, [isEdit, detailData, form])

  const createMutation = useMutation({
    mutationKey: ['medicalStaffSchedule', 'create'],
    // @ts-ignore - for now
    mutationFn: (data: MedicalStaffScheduleFormData) => {
      const fn = window.api?.query?.medicalStaffSchedule?.create
      if (!fn)
        throw new Error(
          'API medical staff schedule tidak tersedia. Silakan restart aplikasi/dev server.'
        )
      return fn(data)
    },
    onSuccess: (data: BackendResponse<typeof MedicalStaffScheduleSchemaWithId>) => {
      if (data?.success) {
        queryClient.invalidateQueries({ queryKey: ['medicalStaffSchedule', 'list'] })
        navigate('/dashboard/registration/medical-staff-schedule')
      } else {
        alert(data?.message || 'Gagal membuat jadwal praktek')
      }
    },
    onError: (error: { message: string }) => {
      alert(error?.message || 'Terjadi kesalahan saat membuat jadwal praktek')
    }
  })

  const updateMutation = useMutation({
    mutationKey: ['medicalStaffSchedule', 'update'],
    // @ts-ignore - for now
    mutationFn: (data: MedicalStaffScheduleFormData & { id: number }) => {
      const fn = window.api?.query?.medicalStaffSchedule?.update
      if (!fn)
        throw new Error(
          'API medical staff schedule tidak tersedia. Silakan restart aplikasi/dev server.'
        )
      return fn(data)
    },
    onSuccess: (data: BackendResponse<typeof MedicalStaffScheduleSchemaWithId>) => {
      if (data?.success) {
        queryClient.invalidateQueries({ queryKey: ['medicalStaffSchedule', 'list'] })
        queryClient.invalidateQueries({ queryKey: ['medicalStaffSchedule', 'detail', id] })
        navigate('/dashboard/registration/medical-staff-schedule')
      } else {
        alert(data?.message || 'Gagal mengupdate jadwal praktek')
      }
    },
    onError: (error: { message: string }) => {
      alert(error?.message || 'Terjadi kesalahan saat mengupdate jadwal praktek')
    }
  })

  const onFinish = (values: MedicalStaffScheduleFormData) => {
    const formattedValues = { ...values }
    const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu']

    days.forEach((day) => {
      if (formattedValues[day]) {
        const dayData = formattedValues[day]
        formattedValues[day] = {
          enabled: dayData.enabled || false,
          startTime:
            dayData.startTime && dayjs.isDayjs(dayData.startTime)
              ? dayData.startTime.format('HH:mm')
              : dayData.startTime || '08:00',
          endTime:
            dayData.endTime && dayjs.isDayjs(dayData.endTime)
              ? dayData.endTime.format('HH:mm')
              : dayData.endTime || '16:00'
        }
      }
    })

    if (isEdit) {
      updateMutation.mutate({ ...formattedValues, id: Number(id) })
    } else {
      createMutation.mutate(formattedValues)
    }
  }

  const DayScheduleField = ({ name, label }: { name: string; label: string }) => {
    const enabled = Form.useWatch([name, 'enabled'], form)

    return (
      <div className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
        <div className="w-24 shrink-0">
          <Form.Item name={[name, 'enabled']} valuePropName="checked" className="mb-0">
            <Checkbox>
              <span className="font-medium text-gray-700">{label}</span>
            </Checkbox>
          </Form.Item>
        </div>
        <div className="flex items-center gap-3 flex-1">
          {enabled ? (
            <>
              <Form.Item
                name={[name, 'startTime']}
                className="mb-0"
                rules={[{ required: enabled, message: 'Waktu mulai harus diisi' }]}
              >
                <TimePicker format="HH:mm" placeholder="Mulai" className="w-32" />
              </Form.Item>
              <span className="text-gray-400 text-sm">s/d</span>
              <Form.Item
                name={[name, 'endTime']}
                className="mb-0"
                rules={[{ required: enabled, message: 'Waktu selesai harus diisi' }]}
              >
                <TimePicker format="HH:mm" placeholder="Selesai" className="w-32" />
              </Form.Item>
            </>
          ) : (
            <span className="text-gray-400 text-sm italic">— Libur / Tidak Bertugas —</span>
          )}
        </div>
      </div>
    )
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header Card */}
      <Card bodyStyle={{ padding: '20px 24px' }} className="border-none">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => navigate('/dashboard/registration/medical-staff-schedule')}
                className="text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 text-sm"
              >
                <ArrowLeftOutlined />
                <span>Jadwal Praktek Petugas Medis</span>
              </button>
            </div>
            <h1 className="text-2xl font-bold mb-0">
              {isEdit ? 'Edit Jadwal Praktek' : 'Tambah Jadwal Praktek'}
            </h1>
            <p className="text-sm text-gray-400 m-0">
              {isEdit
                ? 'Perbarui data jadwal praktik petugas medis'
                : 'Isi formulir berikut untuk mendaftarkan jadwal praktik petugas medis baru'}
            </p>
          </div>
          <Tag color={isEdit ? 'blue' : 'green'} className="px-3 py-1 text-sm m-0">
            {isEdit ? 'Mode Edit' : 'Jadwal Baru'}
          </Tag>
        </div>
      </Card>

      {/* Form */}
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          senin: defaultDaySchedule,
          selasa: defaultDaySchedule,
          rabu: defaultDaySchedule,
          kamis: defaultDaySchedule,
          jumat: defaultDaySchedule,
          sabtu: defaultDaySchedule,
          minggu: defaultDaySchedule,
          status: 'active'
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Informasi Dasar */}
          <Card
            bodyStyle={{ padding: '20px 24px' }}
            className="border-none"
            title="Informasi Dasar"
          >
            <Form.Item
              label={<span className="font-medium">Nama Petugas</span>}
              name="idPegawai"
              rules={[{ required: true, message: 'Nama petugas harus diisi' }]}
            >
              <Select
                placeholder="Pilih nama petugas"
                showSearch
                optionFilterProp="children"
                loading={!pegawaiData}
                size="large"
              >
                {pegawaiData?.success &&
                  pegawaiData.result?.map(
                    (pegawai: { email: string; id: number; namaLengkap: string }) => (
                      <Select.Option key={pegawai.id} value={pegawai.id}>
                        {pegawai.namaLengkap}
                      </Select.Option>
                    )
                  )}
              </Select>
            </Form.Item>

            <Form.Item
              label={<span className="font-medium">Kategori</span>}
              name="kategori"
              rules={[{ required: true, message: 'Kategori harus diisi' }]}
            >
              <Select placeholder="Pilih kategori" size="large">
                <Select.Option value="Perawat">Perawat</Select.Option>
                <Select.Option value="Bidan">Bidan</Select.Option>
                <Select.Option value="Apoteker">Apoteker</Select.Option>
                <Select.Option value="Analis">Analis</Select.Option>
                <Select.Option value="Radiografer">Radiografer</Select.Option>
                <Select.Option value="Fisioterapis">Fisioterapis</Select.Option>
                <Select.Option value="Ahli Gizi">Ahli Gizi</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={<span className="font-medium">Organization / Unit</span>}
              name="organizationId"
              rules={[{ required: true, message: 'Organization harus diisi' }]}
            >
              <Select
                placeholder="Pilih organization"
                showSearch
                optionFilterProp="children"
                loading={!organizationData}
                size="large"
              >
                {organizationData?.success &&
                  organizationData.result?.map(
                    (organization: {
                      id: string
                      name: string
                      partOf?: { name?: string | null } | null
                    }) => (
                      <Select.Option key={organization.id} value={organization.id}>
                        {organization.name}
                        {organization.partOf?.name ? ` - ${organization.partOf.name}` : ''}
                      </Select.Option>
                    )
                  )}
              </Select>
            </Form.Item>

            <Form.Item
              label={<span className="font-medium">Status</span>}
              name="status"
              rules={[{ required: true, message: 'Status harus dipilih' }]}
            >
              <Select placeholder="Pilih status" size="large">
                <Select.Option value="active">Aktif</Select.Option>
                <Select.Option value="inactive">Tidak Aktif</Select.Option>
              </Select>
            </Form.Item>
          </Card>

          {/* Jadwal Harian */}
          <Card
            bodyStyle={{ padding: '20px 24px' }}
            className="border-none"
            title="Jadwal Praktek Harian"
          >
            <div className="text-xs text-gray-400 mb-3 uppercase tracking-tight font-semibold">
              Centang hari yang aktif lalu tentukan jam mulai dan selesai
            </div>
            <Divider className="my-2" />
            <div>
              <DayScheduleField name="senin" label="Senin" />
              <DayScheduleField name="selasa" label="Selasa" />
              <DayScheduleField name="rabu" label="Rabu" />
              <DayScheduleField name="kamis" label="Kamis" />
              <DayScheduleField name="jumat" label="Jumat" />
              <DayScheduleField name="sabtu" label="Sabtu" />
              <DayScheduleField name="minggu" label="Minggu" />
            </div>
          </Card>
        </div>

        {/* Action Footer */}
        <Card bodyStyle={{ padding: '16px 24px' }} className="border-none mt-4">
          <div className="flex items-center justify-end gap-3">
            <Button
              size="large"
              onClick={() => navigate('/dashboard/registration/medical-staff-schedule')}
              icon={<ArrowLeftOutlined />}
            >
              Batal
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={isLoading}
              icon={<SaveOutlined />}
            >
              {isEdit ? 'Update Jadwal' : 'Simpan Jadwal'}
            </Button>
          </div>
        </Card>
      </Form>
    </div>
  )
}

export default MedicalStaffScheduleForm
