import { Input, Space } from 'antd'
import React from 'react'

import { DesktopFormField } from './DesktopFormField'

export interface DesktopInputGroupFieldProps {
  label: string
  addon: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  required?: boolean
  hint?: string
  disabled?: boolean
  mono?: boolean
}

export function DesktopInputGroupField({
  label,
  addon,
  placeholder,
  value,
  onChange,
  required = false,
  hint,
  disabled = false,
  mono = false
}: DesktopInputGroupFieldProps) {
  return (
    <DesktopFormField label={label} hint={hint} required={required}>
      <Space.Compact className={`desktop-input-group-field ${mono ? 'font-mono' : ''}`.trim()} block>
        <span className="desktop-input-addon">{addon}</span>
        <Input
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.value)}
        />
      </Space.Compact>
    </DesktopFormField>
  )
}
