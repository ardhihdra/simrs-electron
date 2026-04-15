import { MoreOutlined } from '@ant-design/icons'
import { Button, Divider, Dropdown, MenuProps, Popconfirm, Space, Spin, Table, Tooltip } from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import type { ReactNode } from 'react'

type AlignType = 'left' | 'center' | 'right'

export type ActionItem<T> = {
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

type ActionConfig<T extends object> = {
  title?: string
  width?: number
  align?: AlignType
  fixedRight?: boolean
  render?: (record: T) => ReactNode
  items?: (record: T) => ActionItem<T>[]
}

type GenericTableProps<T extends object> = {
  columns: ColumnsType<T>
  dataSource: T[]
  rowKey: keyof T | ((record: T) => string)
  action?: ActionConfig<T>
  tableProps?: Omit<TableProps<T>, 'columns' | 'dataSource' | 'rowKey'>
  loading?: boolean
}

function GenericTable<T extends object>({
  columns,
  dataSource,
  rowKey,
  action,
  tableProps,
  loading = false
}: GenericTableProps<T>) {
  const renderDropdownItemLabel = (item: ActionItem<T>) => {
    return (
      <span
        className={`flex w-full items-center gap-2 text-sm ${
          item.disabled ? 'text-gray-400' : item.danger ? 'text-red-500 hover:text-white' : ''
        }`}
      >
        {item.icon ? <span className="flex items-center">{item.icon}</span> : null}
        <span>{item.label}</span>
      </span>
    )
  }

  const mergedColumns = action
    ? [
        ...columns,
        {
          title: action.title ?? 'Action',
          key: 'action',
          width: action.width ?? 100,
          align: action.align ?? 'center',
          fixed: action.fixedRight ? 'right' : undefined,
          render: (_: any, record: T): any => {
            if (action.render) {
              return action.render(record)
            }
            if (action.items) {
              const items = action.items(record)

              const renderItem = (item: ActionItem<T>, idx: number) => {
                const btn = (
                  <Button
                    type={item.type ?? 'link'}
                    danger={item.danger}
                    disabled={item.disabled}
                    icon={item.icon as any}
                    onClick={(e) => {
                      if (!item.confirm) {
                        e.stopPropagation()
                        item.onClick(record)
                      }
                    }}
                    size="small"
                  >
                    {item.label}
                  </Button>
                )

                const element = item.confirm ? (
                  <Popconfirm
                    key={idx}
                    title={item.confirm.title}
                    description={item.confirm.description}
                    okText={item.confirm.okText ?? 'Ya'}
                    cancelText={item.confirm.cancelText ?? 'Batal'}
                    onConfirm={(e) => {
                      e?.stopPropagation()
                      item.onClick(record)
                    }}
                    onCancel={(e) => e?.stopPropagation()}
                  >
                    {btn}
                  </Popconfirm>
                ) : (
                  <span key={idx}>{btn}</span>
                )

                return item.tooltip ? (
                  <Tooltip title={item.tooltip} key={idx}>
                    {element}
                  </Tooltip>
                ) : (
                  element
                )
              }

              if (items.length <= 1) {
                return (
                  <Space split={<Divider type="vertical" />}>
                    {items.map((item, idx) => renderItem(item, idx))}
                  </Space>
                )
              }

              const menuItems: MenuProps['items'] = items.map((item, idx) => {
                if (item.confirm) {
                  return {
                    key: String(idx),
                    disabled: item.disabled,
                    danger: item.danger,
                    label: (
                      <Popconfirm
                        title={item.confirm.title}
                        description={item.confirm.description}
                        okText={item.confirm.okText ?? 'Ya'}
                        cancelText={item.confirm.cancelText ?? 'Batal'}
                        onConfirm={(e) => {
                          e?.stopPropagation()
                          item.onClick(record)
                        }}
                        onCancel={(e) => e?.stopPropagation()}
                      >
                        <div className="-mx-3 -my-1.5 block px-3 py-1.5">
                          {item.tooltip ? (
                            <Tooltip title={item.tooltip}>{renderDropdownItemLabel(item)}</Tooltip>
                          ) : (
                            renderDropdownItemLabel(item)
                          )}
                        </div>
                      </Popconfirm>
                    )
                  }
                }

                return {
                  key: String(idx),
                  disabled: item.disabled,
                  danger: item.danger,
                  onClick: ({ domEvent }) => {
                    domEvent.stopPropagation()
                    item.onClick(record)
                  },
                  label: item.tooltip ? (
                    <Tooltip title={item.tooltip}>{renderDropdownItemLabel(item)}</Tooltip>
                  ) : (
                    renderDropdownItemLabel(item)
                  )
                }
              })

              return (
                <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                  <Button
                    size="small"
                    type="text"
                    icon={<MoreOutlined />}
                    onClick={(e) => e.preventDefault()}
                  />
                </Dropdown>
              )
            }
            return null
          }
        }
      ]
    : columns

  return (
    <div className="relative">
      {loading && (
        <div className="absolute top-0 left-0 w-full h-full bg-black/10 z-10 flex items-center justify-center rounded">
          <Spin size="large" />
        </div>
      )}
      <Table<T>
        columns={mergedColumns as any}
        dataSource={dataSource}
        rowKey={rowKey as keyof T}
        pagination={false}
        size="small"
        bordered
        scroll={{ x: 'max-content' }}
        {...tableProps}
      />
    </div>
  )
}

export default GenericTable
