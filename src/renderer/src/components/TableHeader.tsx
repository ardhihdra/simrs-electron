import { ClearOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Form, Row } from 'antd'
import { ReactNode } from 'react'

export interface TableHeaderProps {
  title: string
  subtitle?: string
  onSearch: (values: any) => void
  onReset?: () => void
  onCreate?: () => void
  onRefresh?: () => void
  createLabel?: string
  loading?: boolean
  children: ReactNode
  action?: ReactNode
}

export const TableHeader = ({
  title,
  onSearch,
  onReset,
  onCreate,
  onRefresh,
  createLabel = 'Buat Baru',
  loading,
  children,
  subtitle,
  action
}: TableHeaderProps) => {
  const [form] = Form.useForm()

  return (
    <Card className="mb-6 p-4 w-full">
      <div className="w-full flex justify-between items-center">
        <div><h2 className="text-2xl font-bold w-full">{title}</h2>
        <h5 className="text-sm text-gray-500">{subtitle || 'Lorem ipsum dolor sit amet'}</h5></div>
         <div className='flex justify-end items-center gap-2'>{action}{<Button onClick={onRefresh} icon={<ReloadOutlined />} disabled={!onRefresh} type="default">Refresh</Button>} {onCreate && (
            <Button onClick={onCreate} icon={<PlusOutlined />}>
              {createLabel}
            </Button>
          )}</div>
      </div>
      <Form form={form} layout="vertical" onFinish={onSearch}>
        <Row gutter={16}>
          <div className='flex w-full justify-between items-center pt-4 gap-4'>{children}</div>
        </Row>
        <div className="flex justify-end gap-2 mt-4">
         
          {onReset && (
            <Button
              onClick={() => {
                form.resetFields()
                onReset()
              }}
              icon={<ClearOutlined />}
            >
              Reset
            </Button>
          )}
         
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>
            Cari
          </Button>
        </div>
      </Form>
    </Card>
  )
}
