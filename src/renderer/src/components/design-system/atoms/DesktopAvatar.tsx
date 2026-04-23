import { Avatar } from 'antd'
import type { AvatarProps } from 'antd'

export interface DesktopAvatarProps {
  label?: string
  src?: string
  icon?: AvatarProps['icon']
  size?: 'sm' | 'md' | 'lg'
  tone?: 'accent' | 'neutral'
}

const AVATAR_SIZE: Record<NonNullable<DesktopAvatarProps['size']>, number> = {
  sm: 24,
  md: 32,
  lg: 40
}

export function DesktopAvatar({
  label,
  src,
  icon,
  size = 'md',
  tone = 'accent'
}: DesktopAvatarProps) {
  return (
    <Avatar
      src={src}
      size={AVATAR_SIZE[size]}
      icon={icon}
      className={
        tone === 'accent'
          ? '!bg-ds-accent !text-ds-accent-text'
          : '!bg-ds-surface-muted !text-ds-text'
      }
    >
      {label}
    </Avatar>
  )
}
