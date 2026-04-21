import type { ReactNode } from 'react'

export interface DesktopStatusBarItem {
  key: string
  content: ReactNode
}

export interface DesktopStatusBarProps {
  leftItems: DesktopStatusBarItem[]
  rightItems?: DesktopStatusBarItem[]
}

export function DesktopStatusBar({ leftItems, rightItems = [] }: DesktopStatusBarProps) {
  return (
    <div className="flex h-ds-statusbar items-center gap-ds-space-md border-t border-ds-border bg-ds-surface px-ds-space-md text-ds-caption text-ds-subtle">
      {leftItems.map((item) => (
        <span key={item.key}>{item.content}</span>
      ))}
      {rightItems.length > 0 ? <span className="ml-auto" /> : null}
      {rightItems.map((item) => (
        <span key={item.key}>{item.content}</span>
      ))}
    </div>
  )
}
