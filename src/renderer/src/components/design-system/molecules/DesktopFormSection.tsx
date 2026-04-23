import React, { type ReactNode } from 'react'

export interface DesktopFormSectionProps {
  title: string
  subtitle?: ReactNode
  children: ReactNode
  divided?: boolean
}

export function DesktopFormSection({
  title,
  subtitle,
  children,
  divided = false
}: DesktopFormSectionProps) {
  return (
    <section
      className={`${divided ? 'border-t border-dashed border-[var(--ds-color-border-strong)] pt-[16px]' : ''}`}
    >
      <div className="mb-[10px] text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--ds-color-text-subtle)]">
        {title}
        {subtitle ? (
          <span className="ml-[6px] normal-case tracking-normal text-[11px] font-normal">
            {subtitle}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  )
}
