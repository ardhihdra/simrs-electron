import { Button, Typography } from 'antd'

import { useKioskaGlobalFlow } from '../kioska-global-context'

export function StepNewPatientRoute() {
  const { goTo, setNewPatientRoute } = useKioskaGlobalFlow()

  const handleSelectRoute = (route: 'poli' | 'pendaftaran') => {
    setNewPatientRoute(route)
    goTo(route === 'poli' ? 'poli' : 'ambil_antrian')
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 text-center">
      <div className="max-w-2xl">
        <Typography.Title level={2} className="!mb-3">
          Pilih Tujuan Layanan
        </Typography.Title>
        <Typography.Text className="text-base text-slate-500">
          Pasien tanpa MRN bisa langsung memilih poli dan dokter, atau menuju pendaftaran untuk
          proses registrasi awal.
        </Typography.Text>
      </div>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-5 md:grid-cols-2">
        <Button
          className="!h-32 !rounded-[24px] !text-2xl !font-semibold"
          onClick={() => handleSelectRoute('poli')}
        >
          Pilih Poli
        </Button>
        <Button
          className="!h-32 !rounded-[24px] !text-2xl !font-semibold"
          onClick={() => handleSelectRoute('pendaftaran')}
        >
          Ke Pendaftaran
        </Button>
      </div>
    </div>
  )
}
