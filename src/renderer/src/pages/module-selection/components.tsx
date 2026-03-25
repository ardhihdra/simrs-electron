import { LogoutOutlined } from '@ant-design/icons'
import logoUrl from '@renderer/assets/logo.png'
import { Button, Empty, Spin } from 'antd'

export type InstallationOption = {
  allowedModules: string[]
  allowedModulesDisplay: string[]
  configId: number
  key: string
  label: string
  lokasiKerjaId: number
}

type ModuleSelectionSidebarProps = {
  onSignOut: () => void
  totalModuleCount: number
}

export function ModuleSelectionSidebar({
  onSignOut,
  totalModuleCount
}: ModuleSelectionSidebarProps) {
  return (
    <div className="flex flex-col justify-between bg-linear-to-br from-blue-600 via-blue-500 to-cyan-500 p-8 text-white">
      <div>
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 p-2 backdrop-blur">
          <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
        </div>
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.35em] text-blue-100">SIMRS</p>
        <h1 className="text-3xl font-semibold leading-tight">
          Pilih modul kerja untuk memulai aktivitas Anda
        </h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-blue-50/90">
          Masuk ke area kerja yang sesuai dengan tugas Anda. Tampilan ini mengikuti gaya halaman
          login agar pengalaman terasa lebih konsisten dan nyaman.
        </p>
      </div>

      <div className="mt-10 space-y-4">
        <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
          <p className="text-sm text-blue-50/85">Jumlah modul tersedia</p>
          <p className="mt-2 text-4xl font-semibold">{totalModuleCount}</p>
          <p className="mt-3 text-sm text-blue-50/80">
            Klik salah satu kartu modul untuk melanjutkan ke dashboard.
          </p>
        </div>

        <Button
          danger
          size="large"
          icon={<LogoutOutlined />}
          onClick={onSignOut}
          className="w-full !border-white/30 !bg-white/12 !text-white hover:!border-white/50 hover:!bg-white/20"
        >
          Sign out
        </Button>
      </div>
    </div>
  )
}

export function ModuleSelectionHeader() {
  return (
    <div className="mb-8">
      <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-600">
        Module Selection
      </p>
      <h2 className="mt-2 text-3xl font-semibold text-slate-900">Choose your workspace</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
        Silahkan pilih module yang tersedia, module dibawah ini merupakan module yang bisa kamu
        akses.
      </p>
    </div>
  )
}

type LoadingStateProps = {
  message: string
}

export function ModuleSelectionLoadingState({ message }: LoadingStateProps) {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <Spin size="large" />
        <p className="text-sm">{message}</p>
      </div>
    </div>
  )
}

type EmptyStateProps = {
  description: string
}

export function ModuleSelectionEmptyState({ description }: EmptyStateProps) {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70">
      <Empty
        description={<span className="text-sm text-slate-500">{description}</span>}
      />
    </div>
  )
}

type InstallationSectionProps = {
  installations: InstallationOption[]
  onSelect: (key: string) => void
  selectedInstallationKey?: string
}

export function InstallationSection({
  installations,
  onSelect,
  selectedInstallationKey
}: InstallationSectionProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Pilih Instalasi</h3>
          <p className="mt-1 text-sm text-slate-500">
            Tentukan instalasi terlebih dahulu untuk menampilkan module yang tersedia.
          </p>
        </div>
        <div className="rounded-lg bg-blue-50 px-3 py-1 text-center text-xs font-semibold text-blue-700">
          {installations.length} instalasi
        </div>
      </div>

      <div className="max-h-56 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
        {installations.map((installation) => {
          const isSelected = installation.key === selectedInstallationKey

          return (
            <Button
              key={installation.key}
              size="large"
              onClick={() => onSelect(installation.key)}
              className={[
                '!h-auto !rounded-xl !border !px-4 !py-4 !text-left !shadow-none transition-all',
                isSelected
                  ? '!border-blue-500 !bg-linear-to-r !from-blue-500 !to-cyan-500 !text-white hover:!border-blue-500 hover:!bg-linear-to-r hover:!from-blue-500 hover:!to-cyan-500 hover:!text-white'
                  : '!border-slate-200 !bg-slate-50/80 !text-slate-700 hover:!border-blue-300 hover:!bg-blue-50 hover:!text-blue-700'
              ].join(' ')}
            >
              <div className="flex w-full items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{installation.label}</div>
                  <div className={`mt-1 text-xs ${isSelected ? 'text-blue-50' : 'text-slate-500'}`}>
                    {installation.allowedModules.length} module tersedia
                  </div>
                </div>
                <div
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white text-slate-500'
                  }`}
                >
                  {isSelected ? 'Dipilih' : 'Pilih'}
                </div>
              </div>
            </Button>
          )
        })}
        </div>
      </div>
    </section>
  )
}

type ModuleSectionProps = {
  installationLabel?: string
  modules: string[]
  moduleCodes: string[]
  onSelectModule: (module: string) => void
}

export function ModuleSection({
  installationLabel,
  modules,
  moduleCodes,
  onSelectModule
}: ModuleSectionProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Pilih Module</h3>
          <p className="mt-1 text-sm text-slate-500">
            {installationLabel
              ? `Module untuk instalasi ${installationLabel}`
              : 'Pilih instalasi untuk menampilkan daftar module yang bisa diakses.'}
          </p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {modules.length} module
        </div>
      </div>

      {modules.length === 0 ? (
        <div className="flex min-h-[80px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 text-center text-sm text-slate-500">
          Silahkan pilih instalasi terlebih dahulu.
        </div>
      ) : (
        <div className="max-h-56 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {modules.map((moduleName, index) => (
              <Button
                key={moduleName}
                size="large"
                onClick={() => onSelectModule(moduleCodes[index])}
                className="!flex !h-auto !min-h-32 !items-center !justify-center !rounded-3xl !border !border-slate-200 !bg-linear-to-br !from-white !to-slate-50 !p-4 !text-center !text-base !font-semibold !capitalize !text-slate-700 !shadow-none !whitespace-normal transition-all hover:!-translate-y-0.5 hover:!border-blue-300 hover:!from-blue-50 hover:!to-cyan-50 hover:!text-blue-700 mt-1"
              >
                <span className="line-clamp-4 break-words text-sm leading-snug">{moduleName}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
