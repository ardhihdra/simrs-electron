import type { ReactNode } from 'react'

import { DesktopAvatar } from '../atoms/DesktopAvatar'
import type { DesktopAvatarProps } from '../atoms/DesktopAvatar'
import { DesktopStatusDot, type DesktopStatus } from '../atoms/DesktopStatusDot'

export interface DesktopNotificationItemData {
  id: string
  title: string
  body: string
  time: string
  status?: DesktopStatus
  avatarLabel?: string
  avatarIcon?: DesktopAvatarProps['icon']
  unread?: boolean
}

export interface DesktopNotificationItemProps extends DesktopNotificationItemData {
  action?: ReactNode
}

export function DesktopNotificationItem({
  title,
  body,
  time,
  status = 'info',
  avatarLabel,
  avatarIcon,
  unread = false,
  action
}: DesktopNotificationItemProps) {
  return (
    <div className="flex items-start gap-[var(--ds-space-sm)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[var(--ds-space-md)] py-[var(--ds-space-sm)] shadow-[var(--ds-shadow-xs)]">
      <DesktopAvatar label={avatarLabel} icon={avatarIcon} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-[var(--ds-space-sm)]">
          <div className="min-w-0">
            <div className="flex items-center gap-[var(--ds-space-xs)]">
              <span className="truncate text-[length:var(--ds-font-size-body)] font-semibold text-[var(--ds-color-text)]">
                {title}
              </span>
              {unread ? <DesktopStatusDot status="accent" /> : null}
            </div>
            <p className="mt-[var(--ds-space-xxs)] text-[length:var(--ds-font-size-body)] text-[var(--ds-color-text-muted)]">
              {body}
            </p>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        <div className="mt-[var(--ds-space-sm)] flex items-center justify-between gap-[var(--ds-space-sm)]">
          <DesktopStatusDot status={status} label={time} />
        </div>
      </div>
    </div>
  )
}
