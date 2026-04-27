export type DashboardTabItem = {
  key: string
  label: string
  href?: string
  icon?: import('react').ReactNode
}

export type ResolveInitialDashboardTabsInput = {
  pathname: string
  fallbackTab: DashboardTabItem
  findTab: (key: string) => DashboardTabItem | undefined
}

export type CloseDashboardTabInput = {
  tabs: DashboardTabItem[]
  activeKey: string
  closingKey: string
  fallbackTab: DashboardTabItem
}

export type DashboardTabState = {
  tabs: DashboardTabItem[]
  activeKey: string
}

export type DashboardShortcutKeyEvent = {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  shiftKey: boolean
}

const DEFAULT_MAX_DASHBOARD_TABS = 5

function appendDashboardTab(
  tabs: DashboardTabItem[],
  nextTab: DashboardTabItem,
  currentActiveKey?: string,
  maxTabs = DEFAULT_MAX_DASHBOARD_TABS
) {
  const existingTab = tabs.find((tab) => tab.key === nextTab.key)

  if (existingTab) {
    return {
      tabs,
      activeKey: existingTab.key
    }
  }

  if (tabs.length < maxTabs) {
    return {
      tabs: [...tabs, nextTab],
      activeKey: nextTab.key
    }
  }

  const replaceIndex = tabs.findIndex((tab) => tab.key !== currentActiveKey)
  const nextTabs = tabs.filter((_, index) => index !== (replaceIndex >= 0 ? replaceIndex : 0))

  return {
    tabs: [...nextTabs, nextTab],
    activeKey: nextTab.key
  }
}

export function ensureDashboardTab(
  tabs: DashboardTabItem[],
  nextTab: DashboardTabItem,
  currentActiveKey?: string
) {
  return appendDashboardTab(tabs, nextTab, currentActiveKey)
}

export function resolveInitialDashboardTabs({
  pathname,
  fallbackTab,
  findTab
}: ResolveInitialDashboardTabsInput) {
  const activeTab = findTab(pathname) ?? fallbackTab

  return {
    tabs: [activeTab],
    activeKey: activeTab.key
  }
}

export function closeDashboardTab({
  tabs,
  activeKey,
  closingKey,
  fallbackTab
}: CloseDashboardTabInput) {
  const closingIndex = tabs.findIndex((tab) => tab.key === closingKey)
  const nextTabs = tabs.filter((tab) => tab.key !== closingKey)

  if (closingIndex === -1) {
    return {
      tabs,
      activeKey
    }
  }

  if (nextTabs.length === 0) {
    return {
      tabs: [fallbackTab],
      activeKey: fallbackTab.key
    }
  }

  if (activeKey !== closingKey) {
    return {
      tabs: nextTabs,
      activeKey
    }
  }

  const fallbackIndex = Math.max(0, closingIndex - 1)
  const nextActiveTab = nextTabs[fallbackIndex] ?? nextTabs[0]

  return {
    tabs: nextTabs,
    activeKey: nextActiveTab.key
  }
}

export function syncDashboardTabsWithLocation(
  currentState: DashboardTabState,
  locationTab: DashboardTabItem
) {
  const existingTab = currentState.tabs.find((tab) => tab.key === locationTab.key)

  if (existingTab && currentState.activeKey === existingTab.key) {
    return currentState
  }

  if (existingTab) {
    return {
      tabs: currentState.tabs,
      activeKey: existingTab.key
    }
  }

  return appendDashboardTab(currentState.tabs, locationTab, currentState.activeKey)
}

export function isCloseActiveTabShortcut(event: DashboardShortcutKeyEvent) {
  return (
    event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    !event.shiftKey &&
    event.key.toLowerCase() === 'w'
  )
}

export function isDashboardContentOnlyRoute(pathname: string, search = '') {
  const searchParams = new URLSearchParams(search)
  const fullscreenParam = searchParams.get('contentFullscreen')
  const isContentFullscreen =
    fullscreenParam === '1' || fullscreenParam?.toLowerCase() === 'true'
  const isWorkspaceRoute =
    pathname.match(/^\/dashboard\/(doctor|nurse-calling\/medical-record)\/[^/]+$/) !== null

  return isContentFullscreen || isWorkspaceRoute
}
