import { MedicineBoxOutlined, RightOutlined } from '@ant-design/icons'
import { App, Button, Card, Space, Typography, theme } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { fetchKioskaPolis } from './public-client'
import { getPoliColor, type KioskaPoliOption, writeSelectedKioskaPoli } from './shared'

export default function KioskaSetupPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { token } = theme.useToken()
  const [polis, setPolis] = useState<KioskaPoliOption[]>([])
  const [selectedPoliId, setSelectedPoliId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const kioskGradient = `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        setIsLoading(true)
        const result = await fetchKioskaPolis()
        if (cancelled) return
        setPolis(result)
      } catch (error: any) {
        if (cancelled) return
        message.error(error?.message || 'Gagal memuat daftar poli kioska')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [message])

  const selectedPoli = useMemo(
    () => polis.find((poli) => poli.id === selectedPoliId) ?? null,
    [polis, selectedPoliId]
  )

  const handleContinue = () => {
    if (!selectedPoli) {
      message.warning('Pilih poli terlebih dahulu')
      return
    }

    writeSelectedKioskaPoli(selectedPoli)
    navigate('/kioska')
  }

  return (
    <div className="min-h-screen px-6 py-6 md:px-8 md:py-8" style={{ background: kioskGradient }}>
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-3xl">
            <Typography.Title level={1} className="!mb-3 !text-4xl !leading-tight !text-white md:!text-5xl">
              Atur Poli untuk Kioska
            </Typography.Title>
            <Typography.Paragraph className="!mb-0 !text-base !text-white/85 md:!text-lg">
              Pilih satu poli terlebih dahulu. Setelah itu halaman kioska hanya akan menampilkan dokter dari poli tersebut.
            </Typography.Paragraph>
          </div>

          <Space wrap>
            <Button
              size="large"
              className="!h-12 !rounded-2xl !border-0 !px-6 !text-base !font-medium"
              onClick={() => navigate('/')}
            >
              Kembali ke Login
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<RightOutlined />}
              iconPosition="end"
              className="!h-12 !rounded-2xl !border-0 !px-6 !text-base !font-medium"
              style={{ background: 'rgba(255,255,255,0.16)' }}
              onClick={handleContinue}
            >
              Lanjut ke Kioska
            </Button>
          </Space>
        </div>

        <Card className="!flex-1 !rounded-[32px] !border-0">
          <div className="mb-8 flex items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-[24px] text-white"
              style={{ background: kioskGradient }}
            >
              <MedicineBoxOutlined className="text-3xl" />
            </div>
            <div>
              <Typography.Title level={3} className="!mb-1">
                Pilih Poli Kioska
              </Typography.Title>
              <Typography.Text type="secondary">
                Konfigurasi ini disimpan di perangkat agar pengguna kioska tidak perlu memilih poli setiap kali membuka halaman.
              </Typography.Text>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
              Memuat daftar poli...
            </div>
          ) : !polis.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
              Daftar poli belum tersedia.
            </div>
          ) : (
            <div className="rounded-[28px] border border-slate-100 bg-slate-50/60 p-3">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-5">
                {polis.map((poli) => {
                  const isSelected = poli.id === selectedPoliId
                  const color = getPoliColor(poli.name)

                  return (
                    <Card
                      key={poli.id}
                      hoverable
                      onClick={() => setSelectedPoliId(poli.id)}
                      className={`group aspect-square overflow-hidden transition-all duration-300 ${
                        isSelected
                          ? '!border-blue-500 !bg-blue-50 shadow-lg'
                          : '!border-slate-200 hover:!border-blue-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${color.bg} ${color.hover}`}
                        >
                          <MedicineBoxOutlined
                            className={`text-2xl transition-colors duration-300 group-hover:text-white ${color.icon}`}
                          />
                        </div>
                        <div className="text-xs font-semibold">{poli.name}</div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
