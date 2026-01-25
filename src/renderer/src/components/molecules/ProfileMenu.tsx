import { useEffect, useMemo, useState } from 'react'
import { Avatar, Button, Dropdown, Modal, Space } from 'antd'
import type { MenuProps } from 'antd'
import { LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'

type SessionUser = { id: number | string; username: string }
type GetSessionResult = { success: boolean; session?: Record<string, never>; user?: SessionUser; error?: string }
type LogoutResult = { success: boolean }

function ProfileMenu() {
  const [profile, setProfile] = useState<SessionUser | undefined>(undefined)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

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

  const items: MenuProps['items'] = [
    {
      key: 'profile',
      label: 'Profile',
      icon: <UserOutlined />,
      onClick: () => setOpen(true)
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      danger: true,
      label: 'Logout',
      icon: <LogoutOutlined />,
      onClick: async () => {
        const res = (await window.api.auth.logout()) as LogoutResult
        if (res.success) {
          navigate('/')
        }
      }
    }
  ]

  return (
    <>
      <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']}>
        <Space className="cursor-pointer select-none items-center">
          <Avatar size={32} className="bg-[#EDF2FF] text-[#1E3A8A] font-medium">
            {initials}
          </Avatar>
          <div className="hidden md:block text-sm">
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
          <Button
            danger
            icon={<LogoutOutlined />}
            onClick={async () => {
              const res = (await window.api.auth.logout()) as LogoutResult
              if (res.success) {
                setOpen(false)
                navigate('/')
              }
            }}
          >
            Logout
          </Button>
        </div>
      </Modal>
    </>
  )
}

export default ProfileMenu
