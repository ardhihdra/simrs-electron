import { Button, Checkbox, Form, Select, TimePicker } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { useEffect } from 'react'
import { queryClient } from '@renderer/query-client'
import dayjs from 'dayjs'

interface DaySchedule {
  enabled: boolean
  startTime: string
  endTime: string
}

interface MedicalStaffScheduleFormData {
  idPegawai: number
  kodeDepartemen: string
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
  console.log(pegawaiData)

  const { data: departemenData } = useQuery({
    queryKey: ['departemen', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.departemen?.list
      if (!fn) throw new Error('API departemen tidak tersedia')
      return fn()
    }
  })
  console.log('data', departemenData)

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
        kodeDepartemen: data.kodeDepartemen,
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
    mutationFn: (data: MedicalStaffScheduleFormData) => {
      const fn = window.api?.query?.medicalStaffSchedule?.create
      if (!fn)
        throw new Error(
          'API medical staff schedule tidak tersedia. Silakan restart aplikasi/dev server.'
        )
      return fn(data)
    },
    onSuccess: (data) => {
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
    mutationFn: (data: MedicalStaffScheduleFormData & { id: number }) => {
      const fn = window.api?.query?.medicalStaffSchedule?.update
      if (!fn)
        throw new Error(
          'API medical staff schedule tidak tersedia. Silakan restart aplikasi/dev server.'
        )
      return fn(data)
    },
    onSuccess: (data) => {
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
      <div className="flex items-center h-full justify-between ml-32">
        <Form.Item name={[name, 'enabled']} valuePropName="checked" className="mb-0 min-w-[100px]">
          <Checkbox>{label}</Checkbox>
        </Form.Item>
        {enabled && (
          <>
            <div className="flex items-center w-full justify-start gap-10">
              <Form.Item
                name={[name, 'startTime']}
                className="mb-0"
                rules={[{ required: enabled, message: 'Waktu mulai harus diisi' }]}
              >
                <TimePicker format="HH:mm" placeholder="Mulai" className="w-42" />
              </Form.Item>
              <div className="-mt-7">s/d</div>
              <Form.Item
                name={[name, 'endTime']}
                className="mb-0"
                rules={[{ required: enabled, message: 'Waktu selesai harus diisi' }]}
              >
                <TimePicker format="HH:mm" placeholder="Selesai" className="w-42" />
              </Form.Item>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-3xl">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isEdit ? 'Edit Jadwal Praktek' : 'Tambah Jadwal Praktek'}
        </h2>
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
          <Form.Item
            label="Nama Petugas"
            name="idPegawai"
            rules={[{ required: true, message: 'Nama petugas harus diisi' }]}
          >
            <Select
              placeholder="Pilih nama petugas"
              showSearch
              optionFilterProp="children"
              loading={!pegawaiData}
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
            label="Kategori"
            name="kategori"
            rules={[{ required: true, message: 'Kategori harus diisi' }]}
          >
            <Select placeholder="Pilih kategori">
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
            label="Nama Poli/Departemen"
            name="kodeDepartemen"
            rules={[{ required: true, message: 'Poli/Departemen harus diisi' }]}
          >
            <Select
              placeholder="Pilih poli/departemen"
              showSearch
              optionFilterProp="children"
              loading={!departemenData}
            >
              {departemenData?.success &&
                departemenData.result?.map((dept: { kode: string; nama: string }) => (
                  <Select.Option key={dept.kode} value={dept.kode}>
                    {dept.nama}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-3">Jadwal Praktek</label>
            <div className="space-y-3">
              <DayScheduleField name="senin" label="Senin" />
              <DayScheduleField name="selasa" label="Selasa" />
              <DayScheduleField name="rabu" label="Rabu" />
              <DayScheduleField name="kamis" label="Kamis" />
              <DayScheduleField name="jumat" label="Jumat" />
              <DayScheduleField name="sabtu" label="Sabtu" />
              <DayScheduleField name="minggu" label="Minggu" />
            </div>
          </div>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Status harus dipilih' }]}
          >
            <Select placeholder="Pilih status">
              <Select.Option value="active">Aktif</Select.Option>
              <Select.Option value="inactive">Tidak Aktif</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <div className="flex gap-2 justify-center">
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {isEdit ? 'Update' : 'Simpan'}
              </Button>
              <Button onClick={() => navigate('/dashboard/registration/medical-staff-schedule')}>
                Batal
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default MedicalStaffScheduleForm
