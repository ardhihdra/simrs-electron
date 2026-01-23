import { Button, Divider, Space, Spin, Table, Tooltip } from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import type { ReactNode } from 'react'

type AlignType = 'left' | 'center' | 'right'

export type ActionItem<T> = {
  label?: string
  icon?: ReactNode
  onClick: (record: T) => void
  danger?: boolean
  type?: 'link' | 'text' | 'primary' | 'default' | 'dashed'
  tooltip?: string
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
  tableProps?: Omit<TableProps<T>, 'columns' | 'dataSource' | 'rowKey'>,
  loading?: boolean
}

function GenericTable<T extends object>({ columns, dataSource, rowKey, action, tableProps, loading = false }: GenericTableProps<T>) {
  const mergedColumns: ColumnsType<T> = action
    ? [
        ...columns,
        {
          title: action.title ?? 'Action',
          key: 'action',
          width: action.width ?? 100,
          align: action.align ?? 'center',
          fixed: action.fixedRight ? 'right' : undefined,
          render: (_value: T[keyof T], record: T, _index: number) => {
             if (action.render) {
               return action.render(record)
             }
             if (action.items) {
               const items = action.items(record)
               return (
                 <Space split={<Divider type="vertical" />}>
                   {items.map((item, idx) => {
                     const btn = (
                       <Button
                         key={idx}
                         type={item.type ?? 'link'}
                         danger={item.danger}
                         icon={item.icon}
                         onClick={(e) => {
                            e.stopPropagation()
                            item.onClick(record)
                         }}
                         size="small"
                         style={{ padding: 0 }}
                       >
                         {item.label}
                       </Button>
                     )
                     return item.tooltip ? <Tooltip title={item.tooltip} key={idx}>{btn}</Tooltip> : btn
                   })}
                 </Space>
               )
             }
             return null
          }
        }
      ]
    : columns

  return (
    <div className='relative'>
      {loading && <div className='absolute top-0 left-0 w-full h-full bg-black/10 z-10 flex items-center justify-center rounded'>
        <Spin size="large" />
      </div>}
      <Table<T>
      columns={mergedColumns}
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
