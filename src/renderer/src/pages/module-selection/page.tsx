import {
  clearModuleScopeSession,
  normalizeModuleCode,
  setModuleScopeSession
} from '@renderer/services/ModuleScope/module-scope'
import { useSelectedModuleStore } from '@renderer/store/selectedModuleStore'
import { useProfileStore } from '@renderer/store/profileStore'
import { client } from '@renderer/utils/client'
import { App } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router'

import {
  InstallationOption,
  InstallationSection,
  ModuleSection,
  ModuleSelectionEmptyState,
  ModuleSelectionHeader,
  ModuleSelectionLoadingState,
  ModuleSelectionSidebar
} from './components'

type LogoutResult = { success: boolean }

type ModuleGroup = {
  lokasiKerja: {
    id: number
    kode: string
    nama: string
  },
  configs?: {
    allowedModules: string[]
    id: number
    label: string
  }[]
}

const formatModuleId = (moduleId: string): string =>
  moduleId
    .split('.')
    .map((segment) => segment.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(' › ')

const uniqueModules = (modules: string[]) => Array.from(new Set(modules))

const normalizeInstallations = (groups?: ModuleGroup[]): InstallationOption[] =>
  groups?.flatMap((group, groupIndex) =>
    (group.configs ?? []).map((config, configIndex) => ({
      ...config,
      allowedModules: uniqueModules(config.allowedModules),
      allowedModulesDisplay: uniqueModules(config.allowedModules.map(formatModuleId)),
      configId: config.id,
      key: `${groupIndex}-${configIndex}-${config.id}`,
      lokasiKerjaId: group.lokasiKerja.id,
    }))
  ) ?? []

export default function ModuleSelection() {
  const navigation = useNavigate()
  const { notification } = App.useApp()
  const { data, isLoading } = client.module.my.useQuery({})
  const scopeMutation = client.module.scope.useMutation()
  const sessionQuery = client.module.getSession.useQuery(
    {},
    {
      enabled: false,
      queryKey: ['module', { session: true }],
      retry: false
    }
  )
  const [selectedInstallationKey, setSelectedInstallationKey] = useState<string | undefined>()
  const setSelectedModule = useSelectedModuleStore((state) => state.setSelectedModule)
  const clearSelectedModule = useSelectedModuleStore((state) => state.clearSelectedModule)
  const clearProfile = useProfileStore((state) => state.clearProfile)

  const installations = normalizeInstallations(data?.result)
  const selectedInstallation = installations.find((item) => item.key === selectedInstallationKey)
  const totalModuleCount = new Set(installations.flatMap((i) => i.allowedModules)).size

  const handleSelectInstallation = (installationKey: string) => {
    setSelectedInstallationKey((currentKey) =>
      currentKey === installationKey ? undefined : installationKey
    )
  }

  const notify = (type: 'success' | 'error' | 'warning', message: string) =>
    notification[type]({
      message: <span style={{ fontSize: 13, fontWeight: 500 }}>{message}</span>,
      placement: 'topRight',
      duration: 3,
      style: {
        borderRadius: 10,
        padding: '14px 16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
      },
    })

  const handleClick = async (moduleName: string) => {
    if (!selectedInstallation) {
      notify('warning', 'Silahkan pilih instalasi terlebih dahulu')
      return
    }

    const selectedModuleCode = normalizeModuleCode(moduleName)

    try {
      await scopeMutation.mutateAsync({
        configId: selectedInstallation.configId,
        allowedModules: [selectedModuleCode]
      })
      const sessionResult = await sessionQuery.refetch()
      if (!sessionResult.data) {
        throw new Error('Module session is empty')
      }
      console.log('Session Result', sessionResult.data)

      setModuleScopeSession(sessionResult.data)
      setSelectedModule(moduleName)
      notify('success', `Berhasil Mengaktifkan Modul ${moduleName.replaceAll('_', ' ')}`)
      navigation('/dashboard')
    } catch (err) {
      console.log(err)
      clearModuleScopeSession()
      notify('error', 'Gagal Mengaktifkan Modul')
    }
  }

  const handleSignOut = async () => {
    const res = (await window.api.auth.logout()) as LogoutResult
    if (res.success) {
      clearModuleScopeSession()
      clearSelectedModule()
      clearProfile()
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
        <div className="grid w-full grid-cols-[0.95fr_1.4fr] overflow-hidden rounded-3xl border border-white/40 bg-white/75 shadow-2xl backdrop-blur">
          <ModuleSelectionSidebar
            totalModuleCount={totalModuleCount}
            onSignOut={() => {
              void handleSignOut()
            }}
          />

          <div className="p-8 md:p-10">
            <ModuleSelectionHeader />

            {isLoading ? (
              <ModuleSelectionLoadingState message="Memuat daftar modul..." />
            ) : installations.length > 0 ? (
              <div className="space-y-6">
                <InstallationSection
                  installations={installations}
                  selectedInstallationKey={selectedInstallationKey}
                  onSelect={handleSelectInstallation}
                />
                <ModuleSection
                  installationLabel={selectedInstallation?.label}
                  modules={selectedInstallation?.allowedModulesDisplay ?? []}
                  moduleCodes={selectedInstallation?.allowedModules ?? []}
                  onSelectModule={(moduleName) => {
                    void handleClick(moduleName)
                  }}
                />
              </div>
            ) : (
              <ModuleSelectionEmptyState description="Belum ada modul yang tersedia untuk akun ini." />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
