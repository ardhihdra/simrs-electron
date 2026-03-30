import { LogoutOutlined } from '@ant-design/icons'
import logoUrl from '@renderer/assets/logo.png'
import { Button, Empty, Spin, theme } from 'antd'

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
  const { token } = theme.useToken()

  return (
    <div
      className="flex flex-col justify-between p-8 text-white"
      style={{
        background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryHover} 50%, ${token.colorInfoActive} 100%)`
      }}
    >
      <div>
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 p-2 backdrop-blur">
          <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
        </div>
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.35em] opacity-80" style={{ color: token.colorPrimaryBg }}>SIMRS</p>
        <h1 className="text-3xl font-semibold leading-tight">
          Pilih modul kerja untuk memulai aktivitas Anda
        </h1>
        <p className="mt-4 max-w-md text-sm leading-6 opacity-90">
          Masuk ke area kerja yang sesuai dengan tugas Anda. Tampilan ini mengikuti gaya halaman
          login agar pengalaman terasa lebih konsisten dan nyaman.
        </p>
      </div>

      <div className="mt-10 space-y-4">
        <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
          <p className="text-sm opacity-85">Jumlah modul tersedia</p>
          <p className="mt-2 text-4xl font-semibold">{totalModuleCount}</p>
          <p className="mt-3 text-sm opacity-80">
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
  const { token } = theme.useToken()

  return (
    <div className="mb-8">
      <p className="text-sm font-medium uppercase tracking-[0.3em]" style={{ color: token.colorPrimary }}>
        Module Selection
      </p>
      <h2 className="mt-2 text-3xl font-semibold" style={{ color: token.colorTextHeading }}>Choose your workspace</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: token.colorTextSecondary }}>
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
  const { token } = theme.useToken()

  return (
    <div
      className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed"
      style={{
        borderColor: token.colorBorder,
        backgroundColor: token.colorBgLayout
      }}
    >
      <div className="flex flex-col items-center gap-3" style={{ color: token.colorTextSecondary }}>
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
  const { token } = theme.useToken()

  return (
    <div
      className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed"
      style={{
        borderColor: token.colorBorder,
        backgroundColor: token.colorBgLayout
      }}
    >
      <Empty
        description={<span className="text-sm" style={{ color: token.colorTextSecondary }}>{description}</span>}
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
  const { token } = theme.useToken()

  return (
    <section className="rounded-3xl border bg-white/80 p-5 shadow-sm" style={{ borderColor: token.colorBorderSecondary }}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: token.colorTextHeading }}>Pilih Instalasi</h3>
          <p className="mt-1 text-sm" style={{ color: token.colorTextSecondary }}>
            Tentukan instalasi terlebih dahulu untuk menampilkan module yang tersedia.
          </p>
        </div>
        <div
          className="rounded-lg px-3 py-1 text-center text-xs font-semibold"
          style={{
            backgroundColor: token.colorPrimaryBg,
            color: token.colorPrimaryText
          }}
        >
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
              style={isSelected ? {
                background: `linear-gradient(to right, ${token.colorPrimary}, ${token.colorInfo})`,
                borderColor: token.colorPrimary,
                color: token.colorTextLightSolid
              } : {
                backgroundColor: token.colorBgLayout,
                borderColor: token.colorBorder,
                color: token.colorText
              }}
              className={[
                '!h-auto !rounded-xl !border !px-4 !py-4 !text-left !shadow-none transition-all',
                isSelected
                  ? 'hover:!border-blue-500 hover:!opacity-90'
                  : 'hover:!border-blue-300 hover:!bg-blue-50'
              ].join(' ')}
            >
              <div className="flex w-full items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{installation.label}</div>
                  <div className="mt-1 text-xs opacity-80" style={{ color: isSelected ? token.colorPrimaryBg : token.colorTextSecondary }}>
                    {installation.allowedModules.length} module tersedia
                  </div>
                </div>
                <div
                  className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : token.colorBgContainer,
                    color: isSelected ? token.colorTextLightSolid : token.colorTextSecondary
                  }}
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
  const { token } = theme.useToken()

  return (
    <section className="rounded-3xl border bg-white/80 p-5 shadow-sm" style={{ borderColor: token.colorBorderSecondary }}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: token.colorTextHeading }}>Pilih Module</h3>
          <p className="mt-1 text-sm" style={{ color: token.colorTextSecondary }}>
            {installationLabel
              ? `Module untuk instalasi ${installationLabel}`
              : 'Pilih instalasi untuk menampilkan daftar module yang bisa diakses.'}
          </p>
        </div>
        <div className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: token.colorFillAlter, color: token.colorTextSecondary }}>
          {modules.length} module
        </div>
      </div>

      {modules.length === 0 ? (
        <div
          className="flex min-h-[80px] items-center justify-center rounded-2xl border border-dashed px-6 text-center text-sm"
          style={{
            borderColor: token.colorBorder,
            backgroundColor: token.colorBgLayout,
            color: token.colorTextSecondary
          }}
        >
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
                style={{
                  background: `linear-gradient(135deg, ${token.colorBgContainer}, ${token.colorBgLayout})`,
                  borderColor: token.colorBorder,
                  color: token.colorText
                }}
                className="!flex !h-auto !min-h-32 !items-center !justify-center !rounded-3xl !border !p-4 !text-center !text-base !font-semibold !capitalize !shadow-none !whitespace-normal transition-all hover:!-translate-y-0.5 hover:!border-blue-300 hover:!from-blue-50 hover:!to-cyan-50 mt-1"
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
