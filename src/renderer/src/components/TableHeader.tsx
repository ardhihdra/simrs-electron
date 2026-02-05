import { ClearOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Form, Row } from 'antd'
import { ReactNode } from 'react'

export interface TableHeaderProps {
  title: string
  onSearch: (values: any) => void
  onReset?: () => void
  onCreate?: () => void
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
  createLabel = 'Buat Baru',
  loading,
  children,
  action
}: TableHeaderProps) => {
  const [form] = Form.useForm()

  return (
    <Card title={title} className="mb-6">
      <Form form={form} layout="vertical" onFinish={onSearch}>
        <Row gutter={16}>{children}</Row>
        <div className="flex justify-end gap-2 mt-4">
          {action}
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
          {onCreate && (
            <Button onClick={onCreate} icon={<PlusOutlined />}>
              {createLabel}
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
