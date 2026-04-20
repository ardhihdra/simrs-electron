import { Button } from 'antd'
import type { ButtonProps } from 'antd'

export type DesktopButtonProps = ButtonProps & {
  emphasis?: 'primary' | 'secondary' | 'ghost' | 'danger'
}

const EMPHASIS_CLASSNAME: Record<NonNullable<DesktopButtonProps['emphasis']>, string> = {
  primary:
    '!border-[var(--ds-color-accent)] !bg-[var(--ds-color-accent)] !text-[var(--ds-color-accent-text)] hover:!border-[var(--ds-color-accent-hover)] hover:!bg-[var(--ds-color-accent-hover)]',
  secondary:
    '!border-[var(--ds-color-border-strong)] !bg-[var(--ds-color-surface)] !text-[var(--ds-color-text)] hover:!border-[var(--ds-color-accent)] hover:!text-[var(--ds-color-accent)]',
  ghost:
    '!border-transparent !bg-transparent !text-[var(--ds-color-text-muted)] hover:!bg-[var(--ds-color-surface-muted)] hover:!text-[var(--ds-color-text)]',
  danger:
    '!border-[var(--ds-color-danger)] !bg-[var(--ds-color-danger)] !text-[var(--ds-color-danger-text)] hover:!border-[var(--ds-color-danger)] hover:!bg-[color-mix(in_srgb,var(--ds-color-danger)_92%,var(--ds-color-text))]'
}

export function DesktopButton({
  emphasis = 'primary',
  className = '',
  size,
  ...props
}: DesktopButtonProps) {
  const heightClassName =
    size === 'small'
      ? '!h-[var(--ds-button-h-sm)]'
      : size === 'large'
        ? '!h-[var(--ds-button-h-lg)]'
        : '!h-[var(--ds-button-h)]'

  return (
    <Button
      {...props}
      size={size}
      className={`desktop-button !rounded-[var(--ds-radius-md)] !px-[var(--ds-space-md)] !text-[length:var(--ds-font-size-body)] !font-semibold !shadow-none ${heightClassName} ${EMPHASIS_CLASSNAME[emphasis]} ${className}`.trim()}
    />
  )
}
