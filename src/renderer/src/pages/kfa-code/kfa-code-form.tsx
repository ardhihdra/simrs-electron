import { Button, Form, Input, InputNumber } from 'antd'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'

interface KfaCodeAttributes {
  id?: number
  code: number
  display: string
}

function KfaCodeForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [form] = Form.useForm<KfaCodeAttributes>()

  useEffect(() => {
    if (isEdit && id) {
      const fn = window.api?.query?.kfaCode?.getById
      if (!fn) return
      fn({ id: Number(id) }).then((res) => {
        const record = res?.result as KfaCodeAttributes | undefined
        if (record) {
          form.setFieldsValue({
            code: record.code,
            display: record.display
          })
        }
      })
    }
  }, [id, isEdit, form])

  const onFinish = async (values: KfaCodeAttributes) => {
    if (isEdit && id) {
      const fn = window.api?.query?.kfaCode?.update
      if (!fn) throw new Error('API KFA Code tidak tersedia.')
      await fn({ id: Number(id), code: values.code, display: values.display })
    } else {
      const fn = window.api?.query?.kfaCode?.create
      if (!fn) throw new Error('API KFA Code tidak tersedia.')
      await fn({ code: values.code, display: values.display })
    }
    navigate('/dashboard/medicine/kfa-codes')
  }

  return (
    <div className="flex justify-center p-4">
      <div className="w-full max-w-xl bg-white dark:bg-[#141414] rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {isEdit ? 'Edit Kode KFA' : 'Kode KFA Baru'}
          </h2>
          <Button onClick={() => navigate('/dashboard/medicine/kfa-codes')}>Kembali</Button>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>

          <Form.Item label="Kode" name="code" rules={[{ required: true, message: 'Kode harus diisi' }]}>
            <InputNumber className="w-full" />
          </Form.Item>

          <Form.Item label="Nama" name="display" rules={[{ required: true, message: 'Nama harus diisi' }]}>
            <Input />
          </Form.Item>

          <Form.Item>
            <div className="flex justify-end gap-2">
              <Button onClick={() => navigate('/dashboard/medicine/kfa-codes')}>Batal</Button>
              <Button type="primary" htmlType="submit">
                Simpan
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default KfaCodeForm
