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

interface DoctorScheduleFormData {
  idPegawai: number
  idPoli: number
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

export function DoctorScheduleForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm()
  const isEdit = Boolean(id)

  const { data: detailData } = useQuery({
    queryKey: ['doctorSchedule', 'detail', id],
    queryFn: () => {
      const fn = window.api?.query?.doctorSchedule?.getById
      if (!fn)
        throw new Error('API jadwal dokter tidak tersedia. Silakan restart aplikasi/dev server.')
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

  const { data: poliData } = useQuery({
    queryKey: ['poli', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.poli?.list
      if (!fn) throw new Error('API poli tidak tersedia')
      return fn()
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
        idPoli: data.idPoli,
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
    mutationKey: ['doctorSchedule', 'create'],
    mutationFn: (data: DoctorScheduleFormData) => {
      const fn = window.api?.query?.doctorSchedule?.create
      if (!fn)
        throw new Error('API jadwal dokter tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn(data)
    },
    onSuccess: (data) => {
      if (data?.success) {
        queryClient.invalidateQueries({ queryKey: ['doctorSchedule', 'list'] })
        navigate('/dashboard/registration/doctor-schedule')
      } else {
        console.log('data', data)
        alert(data?.message || 'Gagal membuat jadwal dokter')
      }
    },
    onError: (error: { message: string }) => {
      alert(error?.message || 'Terjadi kesalahan saat membuat jadwal dokter')
    }
  })

  const updateMutation = useMutation({
    mutationKey: ['doctorSchedule', 'update'],
    mutationFn: (data: DoctorScheduleFormData & { id: number }) => {
      const fn = window.api?.query?.doctorSchedule?.update
      if (!fn)
        throw new Error('API jadwal dokter tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn(data)
    },
    onSuccess: (data) => {
      if (data?.success) {
        queryClient.invalidateQueries({ queryKey: ['doctorSchedule', 'list'] })
        queryClient.invalidateQueries({ queryKey: ['doctorSchedule', 'detail', id] })
        navigate('/dashboard/registration/doctor-schedule')
      } else {
        alert(data?.message || 'Gagal mengupdate jadwal dokter')
      }
    },
    onError: (error: { message: string }) => {
      alert(error?.message || 'Terjadi kesalahan saat mengupdate jadwal dokter')
    }
  })

  const onFinish = (values: DoctorScheduleFormData) => {
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
          {isEdit ? 'Edit Jadwal Dokter' : 'Tambah Jadwal Dokter'}
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
            label="Nama Dokter"
            name="idPegawai"
            rules={[{ required: true, message: 'Nama dokter harus diisi' }]}
          >
            <Select
              placeholder="Pilih nama dokter"
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
              <Select.Option value="Dokter Umum">Dokter Umum</Select.Option>
              <Select.Option value="Dokter Spesialis Anak">Dokter Spesialis Anak</Select.Option>
              <Select.Option value="Dokter Spesialis Kandungan">
                Dokter Spesialis Kandungan
              </Select.Option>
              <Select.Option value="Dokter Spesialis Bedah">Dokter Spesialis Bedah</Select.Option>
              <Select.Option value="Dokter Spesialis Penyakit Dalam">
                Dokter Spesialis Penyakit Dalam
              </Select.Option>
              <Select.Option value="Dokter Spesialis Mata">Dokter Spesialis Mata</Select.Option>
              <Select.Option value="Dokter Spesialis THT">Dokter Spesialis THT</Select.Option>
              <Select.Option value="Dokter Spesialis Kulit">Dokter Spesialis Kulit</Select.Option>
              <Select.Option value="Dokter Spesialis Jantung">
                Dokter Spesialis Jantung
              </Select.Option>
              <Select.Option value="Dokter Spesialis Saraf">Dokter Spesialis Saraf</Select.Option>
              <Select.Option value="Dokter Gigi">Dokter Gigi</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Poli"
            name="idPoli"
            rules={[{ required: true, message: 'Poli harus diisi' }]}
          >
            <Select
              placeholder="Pilih poli"
              showSearch
              optionFilterProp="children"
              loading={!poliData}
            >
              {poliData?.success &&
                poliData.result?.map((poli: { id: number; name: string }) => (
                  <Select.Option key={poli.id} value={poli.id}>
                    {poli.name}
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
              <Button onClick={() => navigate('/dashboard/registration/doctor-schedule')}>
                Batal
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default DoctorScheduleForm
