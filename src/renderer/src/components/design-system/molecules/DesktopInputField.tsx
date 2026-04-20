import { Input, Select } from 'antd'

export type DesktopInputFieldOption = {
  label: string
  value: string
}

export interface DesktopInputFieldProps {
  label: string
  hint?: string
  required?: boolean
  type?: 'input' | 'textarea' | 'select'
  placeholder?: string
  value?: string
  options?: DesktopInputFieldOption[]
}

export function DesktopInputField({
  label,
  hint,
  required = false,
  type = 'input',
  placeholder,
  value,
  options = []
}: DesktopInputFieldProps) {
  return (
    <div className="desktop-input-field flex flex-col gap-[var(--ds-space-xs)]">
      <label className="text-[length:var(--ds-font-size-label)] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
        {label}
        {required ? (
          <span className="ml-[var(--ds-space-xxs)] text-[var(--ds-color-danger)]">*</span>
        ) : null}
      </label>
      {type === 'textarea' ? (
        <Input.TextArea
          value={value}
          placeholder={placeholder}
          autoSize={{ minRows: 3, maxRows: 5 }}
          className="!rounded-[var(--ds-radius-md)]"
        />
      ) : type === 'select' ? (
        <Select
          value={value}
          options={options}
          placeholder={placeholder}
          className="desktop-input-select"
        />
      ) : (
        <Input value={value} placeholder={placeholder} />
      )}
      {hint ? (
        <span className="text-[length:var(--ds-font-size-label)] text-[var(--ds-color-text-muted)]">
          {hint}
        </span>
      ) : null}
    </div>
  )
}
