import type { Dayjs } from 'dayjs'
import { Card, DatePicker, Form, Input, Select } from 'antd'

export function DoctorSchedulePeriodCard() {
  return (
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

      <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
        Halaman ini hanya menyimpan informasi inti jadwal. Pengaturan sesi, quota registrasi, dan
        libur dikelola dari halaman editor yang terpisah setelah jadwal dibuat.
      </div>
    </Card>
  )
}
