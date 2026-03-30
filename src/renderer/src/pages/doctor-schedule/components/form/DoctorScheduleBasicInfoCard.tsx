import { RPCSelectAsync } from '@renderer/components/organisms/RPCSelectAsync'
import { Card, Form, Input, Select } from 'antd'

interface OptionItem {
  value: number
  label: string
}

interface DoctorScheduleBasicInfoCardProps {
  doctorOptions: OptionItem[]
  doctorLoading: boolean
  doctorIsError: boolean
  poliOptions: OptionItem[]
  poliLoading: boolean
  poliIsError: boolean
  selectedDoctorId?: number
  contractOptions: OptionItem[]
  hasSessionLokasiKerja: boolean
  locationKerjaDisplayValue: string
}

export function DoctorScheduleBasicInfoCard({
  doctorOptions,
  doctorLoading,
  doctorIsError,
  poliOptions,
  poliLoading,
  poliIsError,
  selectedDoctorId,
  contractOptions,
  hasSessionLokasiKerja,
  locationKerjaDisplayValue
}: DoctorScheduleBasicInfoCardProps) {
  return (
    <Card bodyStyle={{ padding: '20px 24px' }} className="border-none" title="Informasi Dasar">
      <Form.Item
        label={<span className="font-medium">Nama Dokter</span>}
        name="idPegawai"
        rules={[{ required: true, message: 'Nama dokter harus diisi' }]}
      >
        <Select
          placeholder="Pilih nama dokter"
          showSearch
          optionFilterProp="label"
          loading={doctorLoading}
          options={doctorOptions}
          filterOption={(input, option) =>
            String(option?.label ?? '')
              .toLowerCase()
              .includes(input.toLowerCase())
          }
          notFoundContent={doctorIsError ? 'Gagal memuat data dokter' : 'Dokter tidak ditemukan'}
          status={doctorIsError ? 'error' : undefined}
          size="large"
        />
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
          optionFilterProp="label"
          loading={poliLoading}
          options={poliOptions}
          filterOption={(input, option) =>
            String(option?.label ?? '')
              .toLowerCase()
              .includes(input.toLowerCase())
          }
          notFoundContent={poliIsError ? 'Gagal memuat data poli' : 'Poli tidak ditemukan'}
          status={poliIsError ? 'error' : undefined}
          size="large"
        />
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

      {hasSessionLokasiKerja ? (
        <>
          <Form.Item hidden name="idLokasiKerja" rules={[{ required: true }]}>
            <RPCSelectAsync
              entity="lokasikerja"
              placeHolder="Pilih lokasi kerja"
              display="nama"
              listAll
            />
          </Form.Item>
          <Form.Item label={<span className="font-medium">Lokasi Kerja Aktif</span>}>
            <Input value={locationKerjaDisplayValue} disabled size="large" />
          </Form.Item>
        </>
      ) : (
        <Form.Item
          label={<span className="font-medium">ID Lokasi Kerja</span>}
          name="idLokasiKerja"
          rules={[{ required: true, message: 'Lokasi kerja harus diisi' }]}
        >
          <RPCSelectAsync
            entity="lokasikerja"
            placeHolder="Pilih lokasi kerja"
            display="nama"
            listAll
          />
        </Form.Item>
      )}
    </Card>
  )
}
