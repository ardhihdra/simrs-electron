import { Segmented } from 'antd'
import React from 'react'

export type DesktopSegmentedOption = {
  label: string
  value: string
}

export interface DesktopSegmentedControlProps {
  value?: string
  options: DesktopSegmentedOption[]
  onChange?: (value: string) => void
}

export function DesktopSegmentedControl({
  value,
  options,
  onChange
}: DesktopSegmentedControlProps) {
  return (
    <Segmented
      value={value}
      options={options}
      onChange={(nextValue) => onChange?.(String(nextValue))}
      className="desktop-segmented-control !rounded-[var(--ds-radius-md)] !bg-[var(--ds-color-surface-muted)]"
    />
  )
}
