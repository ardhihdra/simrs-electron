import { Modal, Form, Input, App } from 'antd'
import { useState } from 'react'

interface SignaCreateModalProps {
  open: boolean
  onCancel: () => void
  onSuccess?: (newSigna: any) => void
}

export const SignaCreateModal = ({ open, onCancel, onSuccess }: SignaCreateModalProps) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      
      const api = window.api?.query as any
      if (!api?.mastersigna?.create) {
        throw new Error('API mastersigna.create tidak tersedia')
      }

      const response = await api.mastersigna.create({
        signaName: values.signaName
      })

      if (response.success) {
        message.success(response.message || 'Signa berhasil ditambahkan')
        form.resetFields()
        onSuccess?.(response.result)
        onCancel()
      } else {
        message.error(response.message || 'Gagal menambahkan signa')
      }
    } catch (error: any) {
      // Form validation errors are handled by Ant Design UI
      if (error?.name !== 'ValidationError') {
        console.error('Error creating signa:', error)
        message.error(error?.message || 'Terjadi kesalahan saat menyimpan signa')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={
        <div className="flex flex-col">
          <span className="text-lg font-bold text-gray-800">Tambah Master Signa</span>
          <span className="text-xs font-normal text-gray-500">Buat instruksi dosis baru untuk master data</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={submitting}
      destroyOnClose
      okText="Simpan Master"
      cancelText="Batal"
      centered
      width={400}
      modalRender={(node) => (
        <div className="antigravity-modal">
          {node}
        </div>
      )}
    >
      <Form 
        form={form} 
        layout="vertical" 
        className="mt-6"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="signaName"
          label={<span className="font-semibold text-gray-600">Nama Signa / Aturan Pakai</span>}
          rules={[
            { required: true, message: 'Masukkan nama signa' },
            { min: 3, message: 'Nama signa terlalu pendek (minimal 3 karakter)' }
          ]}
          extra="Contoh: 3 x 1 sesudah makan, 2 x 1 kapsul"
        >
          <Input 
            placeholder="Ketik aturan pakai di sini..." 
            size="large"
            className="rounded-lg border-gray-200 focus:border-blue-400 focus:ring-blue-100"
            autoFocus 
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
