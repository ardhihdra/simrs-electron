import type { ReactNode } from 'react'

export interface DesktopFormFieldProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
  extra?: ReactNode
}

export function DesktopFormField({
  label,
  hint,
  error,
  required = false,
  children,
  extra
}: DesktopFormFieldProps) {
  return (
    <div className="desktop-input-field flex flex-col gap-[var(--ds-space-xs)]">
      <div className="flex items-center justify-between gap-[var(--ds-space-sm)]">
        <label className="text-[length:var(--ds-font-size-label)] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
          {label}
          {required ? (
            <span className="ml-[var(--ds-space-xxs)] text-[var(--ds-color-danger)]">*</span>
          ) : null}
        </label>
        {extra ? <div className="text-[length:var(--ds-font-size-label)]">{extra}</div> : null}
      </div>
      {children}
      {error ? (
        <span className="text-[length:var(--ds-font-size-label)] text-[var(--ds-color-danger)]">
          {error}
        </span>
      ) : hint ? (
        <span className="text-[length:var(--ds-font-size-label)] text-[var(--ds-color-text-muted)]">
          {hint}
        </span>
      ) : null}
    </div>
  )
}
