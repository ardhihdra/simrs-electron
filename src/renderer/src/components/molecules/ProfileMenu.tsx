import { KeyOutlined, LogoutOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { client } from '@renderer/utils/client'
import { App, Avatar, Button, Dropdown, Modal, Space } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import SettingsModal from '../SettingsModal'
import ChangePasswordModal from './ChangePasswordModal'
import { useMyProfile } from '@renderer/hooks/useProfile'
import { useLogout } from '@renderer/hooks/useLogout'

type ModuleSignOutResult = {
  success?: boolean
  message?: string
  error?: string
}

function ProfileMenu() {
  const { profile, initials } = useMyProfile()
  const [open, setOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const { message } = App.useApp()
  const navigate = useNavigate()
  const moduleSignOutMutation = client.module.signout.useMutation()
  const { handleLogout, clearModuleClientState } = useLogout()

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
      key: 'change-password',
      label: 'Change Password',
      icon: <KeyOutlined />,
      onClick: () => setChangePasswordOpen(true)
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
      <ChangePasswordModal open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
    </>
  )
}

export default ProfileMenu
