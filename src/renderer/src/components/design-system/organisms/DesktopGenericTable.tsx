import { MoreOutlined } from '@ant-design/icons'
import {
  Button,
  Divider,
  Dropdown,
  Popconfirm,
  Space,
  Tooltip
} from 'antd'
import type { MenuProps, TableProps } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { type ReactNode } from 'react'

import { DesktopTable } from './DesktopTable'

type AlignType = 'left' | 'center' | 'right'

export type DesktopTableActionItem<T> = {
  label?: string
  icon?: ReactNode
  onClick: (record: T) => void
  danger?: boolean
  disabled?: boolean
  type?: 'link' | 'text' | 'primary' | 'default' | 'dashed'
  tooltip?: string
  confirm?: {
    title: string
    description?: string
    okText?: string
    cancelText?: string
  }
}

export interface DesktopTableActionConfig<T extends object> {
  title?: string
  width?: number
  align?: AlignType
  fixedRight?: boolean
  render?: (record: T) => ReactNode
  items?: (record: T) => DesktopTableActionItem<T>[]
}

export interface DesktopTableCardHeader {
  title: string
  subtitle?: string
  action?: ReactNode
}

export interface DesktopTableStatusFilterItem {
  key: string
  label: string
  count: number
}

export interface DesktopTableStatusFilter {
  items: DesktopTableStatusFilterItem[]
  value: string
  onChange: (key: string) => void
}

export interface DesktopGenericTableProps<T extends object> {
  columns: ColumnsType<T>
  dataSource: T[]
  rowKey: keyof T | ((record: T) => string)
  action?: DesktopTableActionConfig<T>
  tableProps?: Omit<TableProps<T>, 'columns' | 'dataSource' | 'rowKey'>
  loading?: boolean
  cardHeader?: DesktopTableCardHeader
  statusFilter?: DesktopTableStatusFilter
}

function renderDropdownItemLabel<T>(item: DesktopTableActionItem<T>) {
  return (
    <span
      className={`flex w-full items-center gap-[var(--ds-space-xs)] text-[length:var(--ds-font-size-body)] ${
        item.disabled
          ? 'text-[var(--ds-color-text-subtle)]'
          : item.danger
            ? 'text-[var(--ds-color-danger)]'
            : 'text-[var(--ds-color-text)]'
      }`}
    >
      {item.icon ? <span className="flex items-center">{item.icon}</span> : null}
      <span>{item.label}</span>
    </span>
  )
}

export function DesktopGenericTable<T extends object>({
  columns,
  dataSource,
  rowKey,
  action,
  tableProps,
  loading = false,
  cardHeader,
  statusFilter,
}: DesktopGenericTableProps<T>) {
  const { className: tablePropsClassName, ...restTableProps } = tableProps ?? {}

  const tableWrapperClassName = ['desktop-generic-table', tablePropsClassName]
    .filter(Boolean)
    .join(' ')

  const mergedColumns = action
    ? [
        ...columns,
        {
          title: action.title ?? 'Action',
          key: 'action',
          width: action.width ?? 92,
          align: action.align ?? 'center',
          fixed: action.fixedRight ? 'right' : undefined,
          render: (_: unknown, record: T) => {
            if (action.render) return action.render(record)
            if (!action.items) return null

            const items = action.items(record)

            if (items.length <= 1) {
              return (
                <Space split={<Divider type="vertical" />}>
                  {items.map((item, idx) => {
                    const button = (
                      <Button
                        key={idx}
                        type={item.type ?? 'link'}
                        danger={item.danger}
                        disabled={item.disabled}
                        icon={item.icon as any}
                        onClick={(event) => {
                          if (!item.confirm) {
                            event.stopPropagation()
                            item.onClick(record)
                          }
                        }}
                        size="small"
                        className="!h-auto !p-0 !text-[length:var(--ds-font-size-body)]"
                      >
                        {item.label}
                      </Button>
                    )

                    const wrappedButton = item.confirm ? (
                      <Popconfirm
                        key={idx}
                        title={item.confirm.title}
                        description={item.confirm.description}
                        okText={item.confirm.okText ?? 'Ya'}
                        cancelText={item.confirm.cancelText ?? 'Batal'}
                        onConfirm={(event) => {
                          event?.stopPropagation()
                          item.onClick(record)
                        }}
                        onCancel={(event) => event?.stopPropagation()}
                      >
                        {button}
                      </Popconfirm>
                    ) : (
                      button
                    )

                    return item.tooltip ? (
                      <Tooltip key={idx} title={item.tooltip}>
                        {wrappedButton}
                      </Tooltip>
                    ) : (
                      wrappedButton
                    )
                  })}
                </Space>
              )
            }

            const menuItems: MenuProps['items'] = items.map((item, idx) => ({
              key: String(idx),
              disabled: item.disabled,
              danger: item.danger,
              onClick: item.confirm
                ? undefined
                : ({ domEvent }) => {
                    domEvent.stopPropagation()
                    item.onClick(record)
                  },
              label: item.confirm ? (
                <Popconfirm
                  title={item.confirm.title}
                  description={item.confirm.description}
                  okText={item.confirm.okText ?? 'Ya'}
                  cancelText={item.confirm.cancelText ?? 'Batal'}
                  onConfirm={(event) => {
                    event?.stopPropagation()
                    item.onClick(record)
                  }}
                  onCancel={(event) => event?.stopPropagation()}
                >
                  <div className="-mx-3 -my-2 block px-3 py-2">{renderDropdownItemLabel(item)}</div>
                </Popconfirm>
              ) : (
                renderDropdownItemLabel(item)
              )
            }))

            return (
              <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                <Button
                  type="text"
                  size="small"
                  icon={<MoreOutlined />}
                  className="!h-[var(--ds-button-h-sm)] !w-[var(--ds-button-h-sm)] !rounded-[var(--ds-radius-sm)] !text-[var(--ds-color-text-muted)]"
                  onClick={(event) => event.preventDefault()}
                />
              </Dropdown>
            )
          }
        }
      ]
    : columns

  const table = (
    <DesktopTable<T>
      className={tableWrapperClassName}
      columns={mergedColumns as ColumnsType<T>}
      dataSource={dataSource}
      rowKey={rowKey as keyof T}
      pagination={false}
      size="small"
      loading={loading}
      {...restTableProps}
    />
  )

  if (!cardHeader && !statusFilter) return table

  return (
    <>
      {cardHeader && (
        <div className="px-4 py-2 border-b border-ds-border flex items-center justify-between bg-white">
          <div className="flex items-baseline gap-2">
            <h3 className="text-[14px] font-bold m-0 text-ds-text">{cardHeader.title}</h3>
            {cardHeader.subtitle && (
              <span className="text-[11px] text-ds-muted">{cardHeader.subtitle}</span>
            )}
          </div>
          {cardHeader.action}
        </div>
      )}
      {statusFilter && (
        <div className="px-3 py-1.5 border-b border-ds-border flex gap-1 flex-wrap bg-white">
          {statusFilter.items.map(({ key, label, count }) => {
            const active = statusFilter.value === key
            return (
              <button
                key={key}
                onClick={() => statusFilter.onChange(key)}
                className={`px-2.5 py-1 rounded border-none cursor-pointer text-[11.5px] transition-all flex items-center gap-1 ${
                  active
                    ? 'bg-ds-accent-soft text-ds-accent font-semibold'
                    : 'bg-transparent text-ds-muted hover:bg-ds-surface-muted'
                }`}
              >
                {label}
                <span
                  className={`px-1.5 rounded-full text-[10px] font-mono ${active ? 'bg-ds-accent text-white' : 'bg-ds-surface-muted text-ds-muted'}`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}
      <div className="flex-1 overflow-hidden">{table}</div>
    </>
  )
}
