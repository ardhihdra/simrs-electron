import { Card, Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'

interface DoctorScheduleFiltersProps {
  searchJadwal: string
  searchDokter: string
  searchPoli: string
  onSearchJadwalChange: (value: string) => void
  onSearchDokterChange: (value: string) => void
  onSearchPoliChange: (value: string) => void
  colorTextTertiary: string
}

export function DoctorScheduleFilters({
  searchJadwal,
  searchDokter,
  searchPoli,
  onSearchJadwalChange,
  onSearchDokterChange,
  onSearchPoliChange,
  colorTextTertiary
}: DoctorScheduleFiltersProps) {
  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    color: colorTextTertiary,
    marginBottom: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em'
  }

  return (
    <Card styles={{ body: { padding: '16px 20px' } }} variant="borderless">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <div style={labelStyle}>Cari Jadwal</div>
          <Input
            placeholder="Nama Jadwal / Kategori..."
            prefix={<SearchOutlined style={{ color: colorTextTertiary }} />}
            value={searchJadwal}
            onChange={(e) => onSearchJadwalChange(e.target.value)}
            allowClear
          />
        </div>
        <div>
          <div style={labelStyle}>Cari Dokter</div>
          <Input
            placeholder="Nama Dokter..."
            prefix={<SearchOutlined style={{ color: colorTextTertiary }} />}
            value={searchDokter}
            onChange={(e) => onSearchDokterChange(e.target.value)}
            allowClear
          />
        </div>
        <div>
          <div style={labelStyle}>Cari Poli</div>
          <Input
            placeholder="Klinik / Poli..."
            prefix={<SearchOutlined style={{ color: colorTextTertiary }} />}
            value={searchPoli}
            onChange={(e) => onSearchPoliChange(e.target.value)}
            allowClear
          />
        </div>
      </div>
    </Card>
  )
}
