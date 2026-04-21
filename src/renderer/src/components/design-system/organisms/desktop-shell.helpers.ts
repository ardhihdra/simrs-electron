import type { ReactNode } from 'react'

export type DesktopModuleBarItem = {
  key: string
  label: ReactNode
  icon?: ReactNode
  badge?: ReactNode
  disabled?: boolean
}

export type DesktopPageListItem = {
  key: string
  label: ReactNode
  icon?: ReactNode
  badge?: ReactNode
  description?: ReactNode
  disabled?: boolean
}

export type DesktopPageListGroup = {
  key: string
  label: ReactNode
  items: DesktopPageListItem[]
}

export type DesktopDocTabItem = {
  key: string
  label: ReactNode
  icon?: ReactNode
  closable?: boolean
  active?: boolean
  dirty?: boolean
}

export function getActiveDesktopKey<T extends { key: string }>(
  items: T[],
  preferredKey?: string
): string | undefined {
  if (preferredKey && items.some((item) => item.key === preferredKey)) {
    return preferredKey
  }

  return items[0]?.key
}

export function normalizeDesktopPageListGroups(
  groups: DesktopPageListGroup[]
): DesktopPageListGroup[] {
  return groups.filter((group) => group.items.length > 0)
}

export function closeDesktopDocTab(
  tabs: DesktopDocTabItem[],
  activeKey: string | undefined,
  closeKey: string
): { tabs: DesktopDocTabItem[]; activeKey: string | undefined } {
  const closingIndex = tabs.findIndex((tab) => tab.key === closeKey)

  if (closingIndex === -1) {
    return { tabs, activeKey }
  }

  const nextTabs = tabs.filter((tab) => tab.key !== closeKey)

  if (activeKey !== closeKey) {
    return { tabs: nextTabs, activeKey }
  }

  const previousTab = tabs[closingIndex - 1]
  const nextTab = tabs[closingIndex + 1]
  const fallbackTab = previousTab ?? nextTab ?? nextTabs[0]

  return {
    tabs: nextTabs,
    activeKey: fallbackTab?.key
  }
}
