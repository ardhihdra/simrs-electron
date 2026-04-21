import { Progress } from 'antd'

export interface DesktopProgressBarProps {
  value: number
  status?: 'normal' | 'success' | 'exception' | 'active'
  showLabel?: boolean
}

export function DesktopProgressBar({
  value,
  status = 'normal',
  showLabel = true
}: DesktopProgressBarProps) {
  return (
    <div className="desktop-progress-bar">
      <Progress
        percent={value}
        size={[100, 8]}
        status={status}
        showInfo={false}
        strokeColor="var(--ds-color-accent)"
        trailColor="var(--ds-color-surface-muted)"
      />
      {showLabel ? (
        <div className="mt-[var(--ds-space-xs)] text-right text-[length:var(--ds-font-size-label)] font-semibold text-[var(--ds-color-text-muted)]">
          {value}%
        </div>
      ) : null}
    </div>
  )
}
