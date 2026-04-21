import { Button } from 'antd'
import type { ButtonProps } from 'antd'

export type DesktopButtonProps = ButtonProps & {
  emphasis?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'toolbar' | 'quiet'
}

const EMPHASIS_CLASSNAME: Record<NonNullable<DesktopButtonProps['emphasis']>, string> = {
  primary:
    '!border-ds-accent !bg-ds-accent !text-ds-accent-text hover:!border-ds-accent hover:!brightness-95',
  secondary:
    '!border-ds-border-strong !bg-ds-surface !text-ds-text hover:!border-ds-accent hover:!text-ds-accent',
  ghost:
    '!border-transparent !bg-transparent !text-ds-muted hover:!bg-ds-surface-muted hover:!text-ds-text',
  danger:
    '!border-ds-danger !bg-ds-danger !text-ds-danger-text hover:!border-ds-danger hover:!brightness-95',
  toolbar:
    '!border-ds-border !bg-ds-surface !text-ds-text hover:!border-ds-border-strong hover:!bg-ds-surface-muted',
  quiet:
    '!border-transparent !bg-ds-surface-muted !text-ds-text hover:!border-ds-border hover:!bg-ds-surface'
}

export function DesktopButton({
  emphasis = 'primary',
  className = '',
  size,
  ...props
}: DesktopButtonProps) {
  const heightClassName =
    size === 'small'
      ? '!h-ds-button-sm'
      : size === 'large'
        ? '!h-ds-button-lg'
        : '!h-ds-button'

  return (
    <Button
      {...props}
      size={size}
      className={`desktop-button !rounded-ds-md !px-ds-space-md !text-ds-body !font-semibold !shadow-none ${heightClassName} ${EMPHASIS_CLASSNAME[emphasis]} ${className}`.trim()}
    />
  )
}
