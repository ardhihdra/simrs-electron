import { CopyOutlined } from '@ant-design/icons'
import { App } from 'antd'
import { DesktopButton } from '../atoms/DesktopButton'

export function CopyCodeButton({ value, label = 'Copy code' }: { value: string; label?: string }) {
  const { message } = App.useApp()

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    message.success('Usage snippet copied')
  }

  return (
    <DesktopButton emphasis="secondary" size="small" icon={<CopyOutlined />} onClick={handleCopy}>
      {label}
    </DesktopButton>
  )
}
