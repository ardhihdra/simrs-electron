import { Input, Select } from 'antd'

export type DesktopInputOption = {
  label: string
  value: string
}

export interface DesktopInputProps {
  type?: 'input' | 'textarea' | 'select'
  placeholder?: string
  value?: string
  options?: DesktopInputOption[]
}

export function DesktopInput({
  type = 'input',
  placeholder,
  value,
  options = []
}: DesktopInputProps) {
  if (type === 'textarea') {
    return (
      <Input.TextArea
        value={value}
        placeholder={placeholder}
        autoSize={{ minRows: 3, maxRows: 5 }}
        className="!rounded-[var(--ds-radius-md)]"
      />
    )
  }

  if (type === 'select') {
    return (
      <Select
        value={value}
        options={options}
        placeholder={placeholder}
        className="desktop-input-select"
      />
    )
  }

  return <Input value={value} placeholder={placeholder} />
}
