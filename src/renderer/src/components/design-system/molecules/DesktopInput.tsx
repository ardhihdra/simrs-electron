import { Input, Select } from 'antd'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react'

export type DesktopInputOption = {
  label: string
  value: string
}

export interface DesktopInputProps {
  type?: 'input' | 'textarea' | 'select' | 'date' | 'datetime-local'
  placeholder?: string
  value?: string
  options?: DesktopInputOption[]
  onChange?: (value: string) => void
  disabled?: boolean
  rows?: number
  className?: string
  allowClear?: boolean
}

export function DesktopInput({
  type = 'input',
  placeholder,
  value,
  options = [],
  onChange,
  disabled = false,
  rows = 3,
  className = '',
  allowClear = false
}: DesktopInputProps) {
  if (type === 'textarea') {
    return (
      <Input.TextArea
        value={value}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        allowClear={allowClear}
        onChange={(event) => onChange?.(event.target.value)}
        className={`!rounded-[var(--ds-radius-md)] ${className}`.trim()}
      />
    )
  }

  if (type === 'select') {
    return (
      <Select
        value={value}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
        allowClear={allowClear}
        onChange={(nextValue) => onChange?.(String(nextValue ?? ''))}
        className={`desktop-input-select ${className}`.trim()}
      />
    )
  }

  return (
    <Input
      type={type === 'input' ? undefined : type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      allowClear={allowClear}
      onChange={(event) => onChange?.(event.target.value)}
      className={className}
    />
  )
}
