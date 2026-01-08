import { Table } from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import type { ReactNode } from 'react'

type AlignType = 'left' | 'center' | 'right'

type ActionConfig<T extends object> = {
  title?: string
  width?: number
  align?: AlignType
  fixedRight?: boolean
  render: (record: T) => ReactNode
}

type GenericTableProps<T extends object> = {
  columns: ColumnsType<T>
  dataSource: T[]
  rowKey: keyof T | ((record: T) => string)
  action?: ActionConfig<T>
  tableProps?: Omit<TableProps<T>, 'columns' | 'dataSource' | 'rowKey'>
}

function GenericTable<T extends object>({ columns, dataSource, rowKey, action, tableProps }: GenericTableProps<T>) {
  const mergedColumns: ColumnsType<T> = action
    ? [
        ...columns,
        {
          title: action.title ?? 'Action',
          key: 'action',
          width: action.width ?? 100,
          align: action.align ?? 'center',
          fixed: action.fixedRight ? 'right' : undefined,
          render: (_value: T[keyof T], record: T, _index: number) => action.render(record)
        }
      ]
    : columns

  return (
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
  )
}

export default GenericTable
