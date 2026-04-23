import { DesktopFormField } from './DesktopFormField'
import { DesktopInput, type DesktopInputOption } from './DesktopInput'

export type DesktopInputFieldOption = DesktopInputOption

export interface DesktopInputFieldProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  type?: 'input' | 'textarea' | 'select'
  placeholder?: string
  value?: string
  options?: DesktopInputFieldOption[]
}

export function DesktopInputField({
  label,
  hint,
  error,
  required = false,
  type = 'input',
  placeholder,
  value,
  options = []
}: DesktopInputFieldProps) {
  return (
    <DesktopFormField label={label} hint={hint} error={error} required={required}>
      <DesktopInput
        type={type}
        placeholder={placeholder}
        value={value}
        options={options}
      />
    </DesktopFormField>
  )
}
