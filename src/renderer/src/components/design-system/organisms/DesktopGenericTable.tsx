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
import React, { type ReactNode } from 'react'

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

export interface DesktopGenericTableProps<T extends object> {
  columns: ColumnsType<T>
  dataSource: T[]
  rowKey: keyof T | ((record: T) => string)
  action?: DesktopTableActionConfig<T>
  tableProps?: Omit<TableProps<T>, 'columns' | 'dataSource' | 'rowKey'>
  loading?: boolean
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
  loading = false
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

  return (
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
}
