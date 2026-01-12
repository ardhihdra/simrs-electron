import { Modal, Switch, Typography } from 'antd'
import { useTheme } from '@renderer/providers/theme-context'
import { MoonOutlined, SunOutlined } from '@ant-design/icons'

interface SettingsModalProps {
  open: boolean
  onCancel: () => void
}

export default function SettingsModal({ open, onCancel }: SettingsModalProps) {
  const { themeMode, toggleTheme } = useTheme()

  return (
    <Modal title="Settings" open={open} onCancel={onCancel} footer={null}>
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Typography.Text strong>Theme Mode</Typography.Text>
        </div>
        <Switch
          checkedChildren={<MoonOutlined />}
          unCheckedChildren={<SunOutlined />}
          checked={themeMode === 'dark'}
          onChange={toggleTheme}
        />
      </div>
    </Modal>
  )
}
