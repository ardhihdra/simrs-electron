import { useState } from 'react'
import { Form, InputNumber, Modal, Select, Input, Upload, Button, Alert, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd/es/upload/interface'
import { useQuery } from '@tanstack/react-query'
import { rpc } from '@renderer/utils/client'

function formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value)
}

interface PaymentModalProps {
    open: boolean
    invoiceId: number
    remaining: number
    onCancel: () => void
    onSuccess: () => void
}

export function PaymentModal({ open, invoiceId, remaining, onCancel, onSuccess }: PaymentModalProps) {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [fileList, setFileList] = useState<UploadFile[]>([])
    const paymentMethod = Form.useWatch('paymentMethod', form)

    const { data: banksData } = useQuery({
        queryKey: ['kasir-banks'],
        queryFn: () => rpc.kasir.listBanks(),
        enabled: open,
    })

    const banks: any[] = (banksData as any)?.result ?? []

    const uploadProps: UploadProps = {
        beforeUpload: () => false,
        fileList,
        maxCount: 1,
        accept: '.jpg,.jpeg,.png,.pdf',
        onChange: ({ fileList: newList }) => setFileList(newList.slice(-1)),
    }

    const handleCancel = () => {
        form.resetFields()
        setFileList([])
        onCancel()
    }

    const handleOk = async () => {
        const values = await form.validateFields()
        setLoading(true)
        try {
            let file: ArrayBuffer | undefined
            let filename: string | undefined
            let mimetype: string | undefined

            if (fileList.length > 0 && fileList[0].originFileObj) {
                file = await fileList[0].originFileObj.arrayBuffer()
                filename = fileList[0].name
                mimetype = fileList[0].type ?? 'application/octet-stream'
            }

            const res = await rpc.kasir.recordPayment({
                invoiceId,
                amount: values.amount,
                paymentMethod: values.paymentMethod,
                bankId: values.bankId,
                ref: values.ref ?? undefined,
                note: values.note ?? undefined,
                file,
                filename,
                mimetype,
            })

            if ((res as any).success) {
                message.success('Pembayaran berhasil dicatat')
                form.resetFields()
                setFileList([])
                onSuccess()
            } else {
                message.error((res as any).message ?? 'Gagal mencatat pembayaran')
            }
        } catch (err: any) {
            message.error(err.message ?? 'Terjadi kesalahan')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal
            title="Catat Pembayaran"
            open={open}
            onCancel={handleCancel}
            onOk={handleOk}
            confirmLoading={loading}
            okText="Simpan"
            cancelText="Batal"
            destroyOnClose
        >
            <Alert
                type="info"
                message={`Sisa tagihan: ${formatRupiah(remaining)}`}
                className="mb-4"
                showIcon
            />
            <Form form={form} layout="vertical">
                <Form.Item
                    name="amount"
                    label="Jumlah Bayar (Rp)"
                    rules={[
                        { required: true, message: 'Jumlah wajib diisi' },
                        {
                            validator: (_, value) => {
                                if (!value || value <= 0) return Promise.reject('Jumlah harus lebih dari 0')
                                if (value > remaining) return Promise.reject(`Jumlah tidak boleh melebihi sisa tagihan`)
                                return Promise.resolve()
                            },
                        },
                    ]}
                >
                    <InputNumber
                        className="w-full"
                        min={1}
                        max={remaining}
                        formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                        parser={(v) => Number(v!.replace(/\./g, '')) as any}
                    />
                </Form.Item>

                <Form.Item
                    name="paymentMethod"
                    label="Metode Pembayaran"
                    rules={[{ required: true, message: 'Pilih metode pembayaran' }]}
                >
                    <Select
                        options={[
                            { label: 'Tunai', value: 'CASH' },
                            { label: 'Transfer Bank', value: 'BANK_TRANSFER' },
                            { label: 'Lainnya', value: 'OTHER' },
                        ]}
                        placeholder="Pilih metode"
                    />
                </Form.Item>

                {paymentMethod === 'BANK_TRANSFER' && (
                    <Form.Item
                        name="bankId"
                        label="Bank Tujuan"
                        rules={[{ required: true, message: 'Pilih bank tujuan' }]}
                    >
                        <Select
                            options={banks.map((b: any) => ({
                                label: `${b.name} – ${b.accountNumber} (${b.accountHolder})`,
                                value: b.id,
                            }))}
                            placeholder="Pilih bank"
                        />
                    </Form.Item>
                )}

                <Form.Item name="ref" label="No. Referensi / Kwitansi">
                    <Input placeholder="Opsional" />
                </Form.Item>

                <Form.Item name="note" label="Catatan">
                    <Input.TextArea rows={2} placeholder="Opsional" />
                </Form.Item>

                <Form.Item name="attachmentFile" label="Bukti Pembayaran (JPG/PNG/PDF)">
                    <Upload {...uploadProps}>
                        <Button icon={<UploadOutlined />}>Pilih File</Button>
                    </Upload>
                </Form.Item>
            </Form>
        </Modal>
    )
}
