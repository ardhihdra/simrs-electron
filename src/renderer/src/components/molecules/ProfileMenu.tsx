import { LogoutOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { clearModuleScopeSession } from '@renderer/services/ModuleScope/module-scope'
import { queryClient } from '@renderer/query-client'
import { useSelectedModuleStore } from '@renderer/store/selectedModuleStore'
import { client } from '@renderer/utils/client'
import { App, Avatar, Button, Dropdown, Modal, Space } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import SettingsModal from '../SettingsModal'

type SessionUser = { id: number | string; username: string }
type GetSessionResult = {
  success: boolean
  session?: Record<string, never>
  user?: SessionUser
  error?: string
}
type LogoutResult = { success: boolean }
type ModuleSignOutResult = {
  success?: boolean
  message?: string
  error?: string
}

function ProfileMenu() {
  const [profile, setProfile] = useState<SessionUser | undefined>(undefined)
  const [open, setOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { message } = App.useApp()
  const navigate = useNavigate()
  const moduleSignOutMutation = client.module.signout.useMutation()
  const clearSelectedModule = useSelectedModuleStore((state) => state.clearSelectedModule)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = (await window.api.auth.getSession()) as GetSessionResult
        if (mounted && res.success && res.user) setProfile(res.user)
      } catch {
        // ignore
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const initials = useMemo(() => {
    const name = profile?.username?.trim() || ''
    if (!name) return 'U'
    const parts = name.split(/\s+/)
    const a = parts[0]?.[0] ?? ''
    const b = parts[1]?.[0] ?? ''
    return (a + b).toUpperCase() || a.toUpperCase() || 'U'
  }, [profile?.username])

  const clearModuleClientState = () => {
    clearModuleScopeSession()
    clearSelectedModule()
    queryClient.removeQueries({ queryKey: ['module'] })
  }

  const handleModuleSignOut = async () => {
    try {
      const result = (await moduleSignOutMutation.mutateAsync({})) as ModuleSignOutResult

      if (result.success === false) {
        throw new Error(result.error || result.message || 'Module sign out failed')
      }

      clearModuleClientState()
      message.success(result.message || 'Module sign out berhasil')
      setOpen(false)
      navigate('/module-selection')
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Gagal melakukan module sign out'
      message.error(errorMessage)
    }
  }

  const handleLogout = async () => {
    const res = (await window.api.auth.logout()) as LogoutResult
    if (res.success) {
      clearModuleClientState()
      setOpen(false)
      navigate('/')
    }
  }

  const items: MenuProps['items'] = [
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
      onClick: () => setOpen(true)
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <SettingOutlined />,
      onClick: () => setSettingsOpen(true)
    },
    {
      type: 'divider'
    },
    {
      key: 'module-signout',
      label: 'Module Sign out',
      icon: <LogoutOutlined />,
      onClick: () => {
        void handleModuleSignOut()
      }
    },
    {
      key: 'logout',
      danger: true,
      label: 'Logout',
      icon: <LogoutOutlined />,
      onClick: () => {
        void handleLogout()
      }
    }
  ]

  return (
    <>
      <Dropdown menu={{ items }} placement="bottomLeft" trigger={['click']}>
        <Space className="cursor-pointer select-none items-center">
          <Avatar size={32} className="bg-[#EDF2FF] text-[#1E3A8A] font-medium">
            {initials}
          </Avatar>
          <div className="hidden xl:block text-sm">
            <div className="font-medium leading-none">{profile?.username || 'User'}</div>
          </div>
        </Space>
      </Dropdown>

      <Modal title="Profile" open={open} onCancel={() => setOpen(false)} footer={null}>
        <div className="flex items-center gap-3 mb-4">
          <Avatar size={48} className="bg-[#EDF2FF] text-[#1E3A8A] font-medium">
            {initials}
          </Avatar>
          <div>
            <div className="font-semibold">{profile?.username || 'User'}</div>
            <div className="text-xs text-gray-500">ID: {String(profile?.id ?? '-')}</div>
          </div>
        </div>
        <div className="text-right">
          <Space>
            <Button icon={<LogoutOutlined />} onClick={() => void handleModuleSignOut()}>
              Module Sign out
            </Button>
            <Button danger icon={<LogoutOutlined />} onClick={() => void handleLogout()}>
              Logout
            </Button>
          </Space>
        </div>
      </Modal>

      <SettingsModal open={settingsOpen} onCancel={() => setSettingsOpen(false)} />
    </>
  )
}

export default ProfileMenu
