import { LogoutOutlined } from '@ant-design/icons'
import logoUrl from '@renderer/assets/logo.png'
import { useSelectedModuleStore } from '@renderer/store/selectedModuleStore'
import { client } from '@renderer/utils/client'
import { Button, Empty, Spin } from 'antd'
import { useNavigate } from 'react-router'

type LogoutResult = { success: boolean }

export default function ModuleSelection() {
  const navigation = useNavigate()
  const { data, isLoading } = client.module.my.useQuery({})
  const setSelectedModule = useSelectedModuleStore((state) => state.setSelectedModule)
  const clearSelectedModule = useSelectedModuleStore((state) => state.clearSelectedModule)

  const modules = data?.result ?? []

  const handleClick = (item: string) => {
    setSelectedModule(item)
    navigation('/dashboard')
  }

  const handleSignOut = async () => {
    const res = (await window.api.auth.logout()) as LogoutResult
    if (res.success) {
      clearSelectedModule()
      navigation('/')
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-linear-to-br from-slate-50 via-blue-50 to-cyan-100 px-6 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-12 h-56 w-56 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex h-[calc(100vh-5rem)] max-w-6xl items-center">
        <div className="grid w-full  overflow-hidden rounded-3xl border border-white/40 bg-white/75 shadow-2xl backdrop-blur grid-cols-[0.95fr_1.4fr]">
          <div className="flex flex-col justify-between bg-linear-to-br from-blue-600 via-blue-500 to-cyan-500 p-8 text-white">
            <div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 p-2 backdrop-blur">
                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
              </div>
              <p className="mb-2 text-sm font-medium uppercase tracking-[0.35em] text-blue-100">
                SIMRS
              </p>
              <h1 className="text-3xl font-semibold leading-tight">
                Pilih modul kerja untuk memulai aktivitas Anda
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-blue-50/90">
                Masuk ke area kerja yang sesuai dengan tugas Anda. Tampilan ini mengikuti gaya
                halaman login agar pengalaman terasa lebih konsisten dan nyaman.
              </p>
            </div>

            <div className="mt-10 space-y-4">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <p className="text-sm text-blue-50/85">Jumlah modul tersedia</p>
                <p className="mt-2 text-4xl font-semibold">{modules.length}</p>
                <p className="mt-3 text-sm text-blue-50/80">
                  Klik salah satu kartu modul untuk melanjutkan ke dashboard.
                </p>
              </div>

              <Button
                danger
                size="large"
                icon={<LogoutOutlined />}
                onClick={handleSignOut}
                className="w-full !border-white/30 !bg-white/12 !text-white hover:!border-white/50 hover:!bg-white/20"
              >
                Sign out
              </Button>
            </div>
          </div>

          <div className="p-8 md:p-10">
            <div className="mb-8">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-600">
                Module Selection
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                Choose your workspace
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Silahkan pilih module yang tersedia, module dibawah ini merupakan module yang bisa kamu akses.
              </p>
            </div>

            {isLoading ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <Spin size="large" />
                  <p className="text-sm">Memuat daftar modul...</p>
                </div>
              </div>
            ) : modules.length > 0 ? (
              <div className="grid gap-4 grid-cols-3">
                {modules.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleClick(item)}
                    className="group flex aspect-square min-h-36 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 cursor-pointer m-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-xl font-semibold text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                        {item.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 transition-colors group-hover:bg-blue-100 group-hover:text-blue-700">
                        Open
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{item}</h3>
                     
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70">
                <Empty
                  description={
                    <span className="text-sm text-slate-500">
                      Belum ada modul yang tersedia untuk akun ini.
                    </span>
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
