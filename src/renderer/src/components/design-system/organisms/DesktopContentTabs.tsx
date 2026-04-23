import { Tabs } from 'antd'
import type { TabsProps } from 'antd'

export type DesktopContentTabItem = {
  key: string
  label: NonNullable<TabsProps['items']>[number]['label']
  children: NonNullable<TabsProps['items']>[number]['children']
}

export interface DesktopContentTabsProps {
  items: DesktopContentTabItem[]
  activeKey?: string
  onChange?: (key: string) => void
}

export function DesktopContentTabs({ items, activeKey, onChange }: DesktopContentTabsProps) {
  return (
    <Tabs
      items={items as TabsProps['items']}
      activeKey={activeKey}
      onChange={onChange}
      className="desktop-content-tabs"
    />
  )
}
