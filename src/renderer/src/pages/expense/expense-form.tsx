import { Form, Input, Button, Select, DatePicker, InputNumber, Upload, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { UploadFile, UploadProps } from 'antd/es/upload/interface'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useMutation, useQuery } from '@tanstack/react-query'

const { TextArea } = Input

function ExpenseForm() {
  const [form] = Form.useForm()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const navigate = useNavigate()
  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      try {
        const result = await window.api.query.expense.create(payload)
        console.log('create result:', result)
        if (result?.error) {
          throw result.error
        }
        return result
      } catch (error) {
        console.error('create error:', error)
        throw error
      }
    },
    onSuccess: () => {
      message.success('Expense saved successfully!')
      form.resetFields()
      setFileList([])
      navigate('/dashboard/expense')
    },
    onError: (err: any) => {
      message.error(`Failed to save expense: ${err.message || err}`)
    }
  })

  const expenseHeads = useQuery({
    queryKey: ['expenseHeads'],
    queryFn: async () => await window.api.query.expenseHead.list()
  })

  const onFinish = async (values: any): Promise<any> => {
    try {
      const payload = {
        expenseHead: {
          connect: {
            id: Number(values.expenseHead)
          }
        },
        name: values.name,
        date: values.date?.toISOString(),
        invoiceNumber: values.invoiceNumber || null,
        amount: Number(values.amount),
        // attachment: fileList[0]?.name || null, // nanti bisa ganti jadi file upload ke server
        description: values.description || null
      }

      console.log('Expense Payload:', payload)

      const result = await mutation.mutateAsync(payload)
      return result
    } catch (err) {
      console.error(err)
    }
  }

  const uploadProps: UploadProps = {
    listType: 'picture-card',
    fileList,
    onChange: ({ fileList }) => setFileList(fileList),
    beforeUpload: () => {
      return false
    }
  }

  return (
    <div className="my-4">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ maxWidth: 800, margin: '0 auto' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Form.Item
            label="Expense Head"
            name="expenseHead"
            rules={[{ required: true, message: 'Please select expense head' }]}
          >
            <Select placeholder="Select Expense Head">
              {expenseHeads.data?.success &&
                expenseHeads.data?.data?.map((head: any) => (
                  <Select.Option key={head.id} value={head.id}>
                    {head.name}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input placeholder="Name" />
          </Form.Item>

          <Form.Item
            label="Date"
            name="date"
            rules={[{ required: true, message: 'Please pick a date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Invoice Number" name="invoiceNumber">
            <Input placeholder="Invoice Number" />
          </Form.Item>

          <Form.Item
            label="Amount"
            name="amount"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <InputNumber placeholder="Amount" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Attachment" name="attachment">
            <Upload {...uploadProps}>
              {fileList.length >= 1 ? null : (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </div>

        <Form.Item label="Description" name="description">
          <TextArea rows={4} placeholder="Description" />
        </Form.Item>

        <Form.Item style={{ textAlign: 'right' }}>
          <Button type="primary" htmlType="submit" style={{ marginRight: 8 }}>
            Save
          </Button>
          <Button
            htmlType="button"
            onClick={() => {
              form.resetFields()
              navigate('/dashboard/expense')
            }}
          >
            Cancel
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default ExpenseForm
