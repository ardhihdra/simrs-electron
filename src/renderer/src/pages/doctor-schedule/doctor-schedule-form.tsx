import { Button, Card, DatePicker, Form, Input, InputNumber, Select, Tag } from 'antd'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'
import { useEffect, useMemo } from 'react'
import { queryClient } from '@renderer/query-client'
import { useModuleScopeStore } from '@renderer/services/ModuleScope/store'
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  SaveOutlined
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'

type DoctorScheduleStatus = 'active' | 'inactive'

interface DoctorContract {
  idKontrakPegawai?: number
  nomorKontrak?: string
  kodeJabatan?: string | null
  statusKontrak?: string | null
  tanggalMulaiKontrak?: string | Date | null
  tanggalBerakhirKontrak?: string | Date | null
}

interface DoctorOption {
  id: number
  namaLengkap: string
  email?: string | null
  nik?: string | null
  hakAkses?: string | null
  hakAksesId?: string | null
  kontrakPegawai?: DoctorContract[]
}

interface PoliOption {
  id: number
  name: string
}

interface DoctorScheduleFormData {
  idPegawai: number
  idPoli: number
  idLokasiKerja: number
  idKontrakKerja: number
  kategori: string
  namaJadwal?: string | null
  berlakuDari: string
  berlakuSampai?: string | null
  status: DoctorScheduleStatus
  keterangan?: string | null
}

interface DoctorScheduleFormValues {
  idPegawai: number
  idPoli: number
  idLokasiKerja: number
  idKontrakKerja: number
  kategori: string
  namaJadwal?: string
  berlakuDari: Dayjs
  berlakuSampai?: Dayjs | null
  status: DoctorScheduleStatus
  keterangan?: string
}

interface DoctorScheduleDetail extends DoctorScheduleFormData {
  id: number
  pegawai?: {
    id: number
    namaLengkap: string
    email?: string | null
    nik?: string | null
  } | null
  poli?: {
    id: number
    name: string
  } | null
}

type DoctorScheduleDetailResponse = {
  success: boolean
  result?: DoctorScheduleDetail
  message?: string
  error?: string
}

export function DoctorScheduleForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm<DoctorScheduleFormValues>()
  const isEdit = Boolean(id)
  const session = useModuleScopeStore((state) => state.session)

  const { data: detailData } = useQuery<DoctorScheduleDetailResponse>({
    queryKey: ['doctorSchedule', 'detail', id],
    queryFn: () => {
      const fn = window.api?.query?.doctorSchedule?.getById
      if (!fn)
        throw new Error('API jadwal dokter tidak tersedia. Silakan restart aplikasi/dev server.')
      return fn({ id: Number(id) })
    },
    enabled: isEdit
  })

  const { data: pegawaiData } = useQuery<{
    success: boolean
    result?: DoctorOption[]
    message?: string
    error?: string
  }>({
    queryKey: ['kepegawaian', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.kepegawaian?.list
      if (!fn) throw new Error('API kepegawaian tidak tersedia')
      return fn({ query: { depth: 1 } })
    }
  })

  const { data: poliData } = useQuery<{
    success: boolean
    result?: PoliOption[]
    message?: string
    error?: string
  }>({
    queryKey: ['poli', 'list'],
    queryFn: () => {
      const fn = window.api?.query?.poli?.list
      if (!fn) throw new Error('API poli tidak tersedia')
      return fn()
    }
  })

  const selectedDoctorId = Form.useWatch('idPegawai', form)

  const selectedDoctor = useMemo(
    () => pegawaiData?.result?.find((pegawai) => pegawai.id === selectedDoctorId),
    [pegawaiData?.result, selectedDoctorId]
  )

  const contractOptions = useMemo(() => {
    const contracts = selectedDoctor?.kontrakPegawai ?? []
    const activeContracts = contracts.filter((contract) => {
      const status = String(contract.statusKontrak ?? '').trim().toLowerCase()
      return status === 'aktif' || status === 'active'
    })
    return (activeContracts.length > 0 ? activeContracts : contracts)
      .filter((contract): contract is DoctorContract & { idKontrakPegawai: number } =>
        typeof contract.idKontrakPegawai === 'number'
      )
      .map((contract) => {
        const dateRange = [
          contract.tanggalMulaiKontrak ? dayjs(contract.tanggalMulaiKontrak).format('DD MMM YYYY') : null,
          contract.tanggalBerakhirKontrak ? dayjs(contract.tanggalBerakhirKontrak).format('DD MMM YYYY') : 'sekarang'
        ]
          .filter(Boolean)
          .join(' - ')
        const fragments = [contract.nomorKontrak, contract.kodeJabatan, dateRange].filter(Boolean)

        return {
          value: contract.idKontrakPegawai,
          label: fragments.join(' | ')
        }
      })
  }, [selectedDoctor?.kontrakPegawai])

  useEffect(() => {
    if (isEdit && detailData?.success && detailData.result) {
      const data = detailData.result
      const formValues = {
        idPegawai: data.idPegawai,
        idPoli: data.idPoli,
        idLokasiKerja: data.idLokasiKerja,
        idKontrakKerja: data.idKontrakKerja,
        kategori: data.kategori,
        namaJadwal: data.namaJadwal ?? undefined,
        berlakuDari: dayjs(data.berlakuDari),
        berlakuSampai: data.berlakuSampai ? dayjs(data.berlakuSampai) : undefined,
        status: data.status,
        keterangan: data.keterangan ?? undefined
      }

      form.setFieldsValue(formValues)
    }
  }, [isEdit, detailData, form])

  useEffect(() => {
    if (!isEdit && session?.lokasiKerjaId) {
      form.setFieldValue('idLokasiKerja', session.lokasiKerjaId)
    }
  }, [form, isEdit, session?.lokasiKerjaId])

  useEffect(() => {
    const currentContractId = form.getFieldValue('idKontrakKerja')
    if (contractOptions.length === 0) {
      form.setFieldValue('idKontrakKerja', undefined)
      return
    }

    const contractStillValid = contractOptions.some((contract) => contract.value === currentContractId)
    if (!contractStillValid) {
      form.setFieldValue('idKontrakKerja', contractOptions[0]?.value)
    }
  }, [contractOptions, form, selectedDoctorId])

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

  const onFinish = (values: DoctorScheduleFormValues) => {
    const formattedValues: DoctorScheduleFormData = {
      idPegawai: Number(values.idPegawai),
      idPoli: Number(values.idPoli),
      idLokasiKerja: Number(values.idLokasiKerja),
      idKontrakKerja: Number(values.idKontrakKerja),
      kategori: values.kategori.trim(),
      namaJadwal: values.namaJadwal?.trim() || null,
      berlakuDari: values.berlakuDari.format('YYYY-MM-DD'),
      berlakuSampai: values.berlakuSampai ? values.berlakuSampai.format('YYYY-MM-DD') : null,
      status: values.status,
      keterangan: values.keterangan?.trim() || null
    }

    if (isEdit) {
      updateMutation.mutate({ ...formattedValues, id: Number(id) })
    } else {
      createMutation.mutate(formattedValues)
    }
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
                onClick={() => navigate('/dashboard/registration/doctor-schedule')}
                className="text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 text-sm"
              >
                <ArrowLeftOutlined />
                <span>Jadwal Praktek Dokter</span>
              </button>
            </div>
            <h1 className="text-2xl font-bold mb-0">
              {isEdit ? 'Edit Jadwal Dokter' : 'Tambah Jadwal Dokter'}
            </h1>
            <p className="text-sm text-gray-400 m-0">
              {isEdit
                ? 'Perbarui data jadwal praktik dokter'
                : 'Isi formulir berikut untuk mendaftarkan jadwal praktik dokter baru'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tag
              color={isEdit ? 'blue' : 'green'}
              icon={isEdit ? <CalendarOutlined /> : <CheckCircleOutlined />}
              className="px-3 py-1 text-sm m-0"
            >
              {isEdit ? 'Mode Edit' : 'Jadwal Baru'}
            </Tag>
          </div>
        </div>
      </Card>

      {/* Form Content Card */}
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          berlakuDari: dayjs(),
          idLokasiKerja: session?.lokasiKerjaId,
          status: 'active'
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Info Dasar Card */}
          <Card
            bodyStyle={{ padding: '20px 24px' }}
            className="border-none"
            title="Informasi Dasar"
          >
            <Form.Item
              label={<span className="font-medium">Nama Dokter</span>}
              name="idPegawai"
              rules={[{ required: true, message: 'Nama dokter harus diisi' }]}
            >
              <Select
                placeholder="Pilih nama dokter"
                showSearch
                optionFilterProp="children"
                loading={!pegawaiData}
                size="large"
              >
                {pegawaiData?.success &&
                  pegawaiData.result?.map((pegawai) => (
                    <Select.Option key={pegawai.id} value={pegawai.id}>
                      {pegawai.namaLengkap}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={<span className="font-medium">Kategori</span>}
              name="kategori"
              rules={[{ required: true, message: 'Kategori harus diisi' }]}
            >
              <Input placeholder="Contoh: Dokter Umum, Dokter Spesialis Anak" size="large" />
            </Form.Item>

            <Form.Item
              label={<span className="font-medium">Poli</span>}
              name="idPoli"
              rules={[{ required: true, message: 'Poli harus diisi' }]}
            >
              <Select
                placeholder="Pilih poli"
                showSearch
                optionFilterProp="children"
                loading={!poliData}
                size="large"
              >
                {poliData?.success &&
                  poliData.result?.map((poli) => (
                    <Select.Option key={poli.id} value={poli.id}>
                      {poli.name}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={<span className="font-medium">Kontrak Kerja</span>}
              name="idKontrakKerja"
              rules={[{ required: true, message: 'Kontrak kerja harus dipilih' }]}
              extra={
                selectedDoctorId && contractOptions.length === 0
                  ? 'Pegawai ini belum memiliki kontrak aktif yang bisa dipakai untuk jadwal.'
                  : undefined
              }
            >
              <Select
                placeholder={selectedDoctorId ? 'Pilih kontrak kerja' : 'Pilih dokter terlebih dahulu'}
                size="large"
                disabled={!selectedDoctorId || contractOptions.length === 0}
                options={contractOptions}
              />
            </Form.Item>

            {session?.lokasiKerjaId ? (
              <>
                <Form.Item hidden name="idLokasiKerja" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item label={<span className="font-medium">Lokasi Kerja Aktif</span>}>
                  <Input
                    value={`ID Lokasi #${form.getFieldValue('idLokasiKerja') ?? session.lokasiKerjaId}`}
                    disabled
                    size="large"
                  />
                </Form.Item>
              </>
            ) : (
              <Form.Item
                label={<span className="font-medium">ID Lokasi Kerja</span>}
                name="idLokasiKerja"
                rules={[{ required: true, message: 'Lokasi kerja harus diisi' }]}
              >
                <InputNumber
                  className="w-full"
                  size="large"
                  placeholder="Masukkan ID lokasi kerja"
                  min={1}
                />
              </Form.Item>
            )}
          </Card>

          <Card bodyStyle={{ padding: '20px 24px' }} className="border-none" title="Periode Jadwal">
            <Form.Item label={<span className="font-medium">Nama Jadwal</span>} name="namaJadwal">
              <Input placeholder="Contoh: Praktik Pagi Poli Anak" size="large" />
            </Form.Item>

            <Form.Item
              label={<span className="font-medium">Berlaku Dari</span>}
              name="berlakuDari"
              rules={[{ required: true, message: 'Tanggal mulai berlaku harus diisi' }]}
            >
              <DatePicker className="w-full" format="DD MMM YYYY" size="large" />
            </Form.Item>

            <Form.Item
              label={<span className="font-medium">Berlaku Sampai</span>}
              name="berlakuSampai"
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value: Dayjs | null | undefined) {
                    const berlakuDari = getFieldValue('berlakuDari') as Dayjs | undefined
                    if (!value || !berlakuDari || !value.isBefore(berlakuDari, 'day')) {
                      return Promise.resolve()
                    }
                    return Promise.reject(
                      new Error('Tanggal selesai harus sama dengan atau setelah tanggal mulai')
                    )
                  }
                })
              ]}
            >
              <DatePicker className="w-full" format="DD MMM YYYY" size="large" />
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

            <Form.Item label={<span className="font-medium">Keterangan</span>} name="keterangan">
              <Input.TextArea
                rows={5}
                placeholder="Catatan tambahan untuk jadwal dokter ini"
                showCount
                maxLength={1000}
              />
            </Form.Item>

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Form ini mengikuti model master `JadwalDokter`. Pengaturan sesi atau jam praktik harian
              dikelola terpisah dari data master jadwal.
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <Card bodyStyle={{ padding: '16px 24px' }} className="border-none mt-4">
          <div className="flex items-center justify-end gap-3">
            <Button
              size="large"
              onClick={() => navigate('/dashboard/registration/doctor-schedule')}
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

export default DoctorScheduleForm
