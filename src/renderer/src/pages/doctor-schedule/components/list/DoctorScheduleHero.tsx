import { Button, Card } from 'antd'
import { CalendarOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'

interface DoctorScheduleHeroProps {
  total: number
  colorPrimary: string
  colorPrimaryActive: string
  colorSuccessBg: string
  onRefresh: () => void
  onExport: () => Promise<void>
  onCreate: () => void
}

export function DoctorScheduleHero({
  total,
  colorPrimary,
  colorPrimaryActive,
  colorSuccessBg,
  onRefresh,
  onExport,
  onCreate
}: DoctorScheduleHeroProps) {
  return (
    <Card
      styles={{ body: { padding: '20px 24px' } }}
      variant="borderless"
      style={{
        background: `linear-gradient(135deg, ${colorPrimary} 0%, ${colorPrimaryActive} 100%)`
      }}
    >
      <div className="flex flex-col gap-5">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                <CalendarOutlined
                  className="text-base"
                  style={{ color: colorSuccessBg, fontSize: 16 }}
                />
              </div>
              <h1 className="text-xl font-bold text-white m-0 leading-tight">Jadwal Praktek Dokter</h1>
            </div>
            <p className="text-sm text-blue-200 m-0 ml-12">
              Manajemen master jadwal dokter berdasarkan periode, kontrak kerja, dan poli
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              className="border-white/30 text-white hover:border-white hover:text-white"
              style={{
                background: 'rgba(255,255,255,0.1)',
                borderColor: 'rgba(255,255,255,0.3)',
                color: '#fff'
              }}
              ghost
            >
              Refresh
            </Button>
            <Button
              type="default"
              onClick={() => void onExport()}
              style={{
                background: 'rgba(255,255,255,0.1)',
                borderColor: 'rgba(255,255,255,0.3)',
                color: '#fff'
              }}
            >
              Export CSV
            </Button>
            <Button
              icon={<PlusOutlined />}
              onClick={onCreate}
              style={{
                background: '#fff',
                borderColor: '#fff',
                color: colorPrimaryActive
              }}
            >
              Tambah Jadwal
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.15)'
            }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,255,255,0.10)' }}
            >
              <CalendarOutlined style={{ color: '#fff', fontSize: 16 }} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                {total}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)', lineHeight: 1.2 }}>
                Total Jadwal
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
