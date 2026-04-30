// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react'

import { DesktopFormField } from './DesktopFormField'
import { DesktopInput, type DesktopInputOption } from './DesktopInput'

export type DesktopInputFieldOption = DesktopInputOption

export interface DesktopInputFieldProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  type?: 'input' | 'textarea' | 'select' | 'date' | 'datetime-local'
  placeholder?: string
  value?: string
  options?: DesktopInputFieldOption[]
  onChange?: (value: string) => void
  disabled?: boolean
  rows?: number
  className?: string
  allowClear?: boolean
}

export function DesktopInputField({
  label,
  hint,
  error,
  required = false,
  type = 'input',
  placeholder,
  value,
  options = [],
  onChange,
  disabled = false,
  rows,
  className,
  allowClear = false
}: DesktopInputFieldProps) {
  return (
    <DesktopFormField label={label} hint={hint} error={error} required={required}>
      <DesktopInput
        type={type}
        placeholder={placeholder}
        value={value}
        options={options}
        onChange={onChange}
        disabled={disabled}
        rows={rows}
        className={className}
        allowClear={allowClear}
      />
    </DesktopFormField>
  )
}
