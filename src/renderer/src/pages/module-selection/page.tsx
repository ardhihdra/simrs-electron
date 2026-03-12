import {
  clearModuleScopeSession,
  normalizeModuleCode,
  setModuleScopeSession
} from '@renderer/services/ModuleScope/module-scope'
import { useSelectedModuleStore } from '@renderer/store/selectedModuleStore'
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
  configs?: {
    allowedModules: string[]
    id: number
    label: string
  }[]
}

const uniqueModules = (modules: string[]) => Array.from(new Set(modules))

const normalizeInstallations = (groups?: ModuleGroup[]): InstallationOption[] =>
  groups?.flatMap((group, groupIndex) =>
    (group.configs ?? []).map((config, configIndex) => ({
      allowedModules: uniqueModules(config.allowedModules),
      configId: config.id,
      key: `${groupIndex}-${configIndex}-${config.id}`,
      label: config.label
    }))
  ) ?? []

export default function ModuleSelection() {
  const navigation = useNavigate()
  const { message } = App.useApp()
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

  const installations = normalizeInstallations(data?.result)
  const selectedInstallation = installations.find((item) => item.key === selectedInstallationKey)
  const filteredAllowedModules = selectedInstallation?.allowedModules ?? []
  const totalModuleCount = installations.reduce(
    (total, installation) => total + installation.allowedModules.length,
    0
  )

  const handleSelectInstallation = (installationKey: string) => {
    setSelectedInstallationKey((currentKey) =>
      currentKey === installationKey ? undefined : installationKey
    )
  }

  const handleClick = async (moduleName: string) => {
    if (!selectedInstallation) {
      message.warning('Silahkan pilih instalasi terlebih dahulu')
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

      setModuleScopeSession(sessionResult.data)
      setSelectedModule(moduleName)
      message.success('Berhasil Mengaktifkan Modul')
      navigation('/dashboard')
    } catch (err) {
      console.log(err)
      clearModuleScopeSession()
      message.error('Gagal Mengaktifkan Modul')
    }
  }

  const handleSignOut = async () => {
    const res = (await window.api.auth.logout()) as LogoutResult
    if (res.success) {
      clearModuleScopeSession()
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
                  modules={filteredAllowedModules}
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
