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
    invoiceId?: number
    encounterId?: string
    patientId?: string
    remaining: number
    invoiceTotal: number
    onCancel: () => void
    onSuccess: () => void
}

interface MasterBank {
    id: number
    name: string
    accountNumber: string
    accountHolder: string
}

export function PaymentModal({ open, invoiceId, encounterId, patientId, remaining, invoiceTotal, onCancel, onSuccess }: PaymentModalProps) {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)
    const [fileList, setFileList] = useState<UploadFile[]>([])
    
    // Watch fields for real-time calculations
    const paymentMethod = Form.useWatch('paymentMethod', form)
    const amount = Form.useWatch('amount', form) || 0
    const change = Math.max(0, amount - remaining)

    const initialCategory = undefined

    const { data: banksData } = useQuery({
        queryKey: ['kasir-banks'],
        queryFn: () => rpc.kasir.listBanks(),
        enabled: open,
    })

    const banks = (banksData as { result: MasterBank[] } | undefined)?.result ?? []

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
        console.log('[PaymentModal] handleOk called', { invoiceId, encounterId, patientId })
        if (!invoiceId && (!encounterId || !patientId)) {
            message.error('Data transaksi (Invoice/Encounter) tidak lengkap')
            return
        }
        try {
            setLoading(true)
            const values = await form.validateFields()
            
            let file: ArrayBuffer | undefined
            let filename: string | undefined
            let mimetype: string | undefined

            if (fileList.length > 0 && fileList[0].originFileObj) {
                file = await fileList[0].originFileObj.arrayBuffer()
                filename = fileList[0].name
                mimetype = fileList[0].type ?? 'application/octet-stream'
            }

            const res = (await rpc.kasir.recordPayment({
                invoiceId,
                encounterId,
                patientId,
                amount: values.amount,
                paymentMethod: values.paymentMethod,
                bankId: values.bankId,
                ref: values.ref ?? undefined,
                note: values.note ?? undefined,
                category: values.category,
                file,
                filename,
                mimetype,
            })) as { success: boolean; message?: string }

            if (res.success) {
                message.success('Pembayaran berhasil dicatat')
                form.resetFields()
                setFileList([])
                onSuccess()
            } else {
                message.error(res.message ?? 'Gagal mencatat pembayaran')
            }
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'errorFields' in err) return 
            const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan'
            message.error(errorMsg)
        } finally {
            setLoading(false)
        }
    }

    // Watch values for logic
    const watchCategory = Form.useWatch('category', form)
    const isDeposit = watchCategory === 'INITIAL_DEPOSIT' || watchCategory === 'SUBSEQUENT_DEPOSIT'

    return (
        <Modal
            title={<span style={{ fontWeight: 600 }}>Catat Pembayaran</span>}
            open={open}
            onCancel={handleCancel}
            width={520}
            footer={[
                <Button key="back" onClick={handleCancel} size="large">
                    Batal
                </Button>,
                <Button 
                    key="submit" 
                    type="primary" 
                    loading={loading} 
                    onClick={handleOk} 
                    size="large"
                >
                    Simpan Pembayaran
                </Button>
            ]}
            destroyOnClose
            centered
        >
            {/* Header: Sisa Tagihan */}
            <div style={{ 
                background: isDeposit ? '#ecfdf5' : '#f1f5f9', 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                textAlign: 'center'
            }}>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    {isDeposit ? 'Deposit Sebelumnya' : 'Sisa Tagihan'}
                </div>
                <div style={{ color: isDeposit ? '#059669' : '#0f172a', fontSize: '1.5rem', fontWeight: 700 }}>
                    {formatRupiah(remaining)}
                </div>
            </div>

            <Form 
                form={form} 
                layout="vertical" 
                initialValues={{ 
                    paymentMethod: 'CASH', 
                    amount: (remaining > 0 && !isDeposit) ? remaining : undefined, 
                    category: initialCategory 
                }}
            >
                <Form.Item
                    name="category"
                    label="Tipe Pembayaran / Deposit"
                    rules={[{ required: true, message: 'Pilih tipe pembayaran' }]}
                    style={{ marginBottom: '12px' }}
                >
                    <Select
                        size="large"
                        placeholder="Pilih tipe..."
                        options={[
                            { label: 'Pelunasan (Settlement)', value: 'SETTLEMENT' },
                            { label: 'Deposit Awal', value: 'INITIAL_DEPOSIT' },
                            { label: 'Deposit Lanjutan', value: 'SUBSEQUENT_DEPOSIT' },
                        ]}
                    />
                </Form.Item>

                <Form.Item
                    name="paymentMethod"
                    label="Metode Pembayaran"
                    rules={[{ required: true, message: 'Pilih metode pembayaran' }]}
                    style={{ marginBottom: '12px' }}
                >
                    <Select
                        size="large"
                        options={[
                            { label: 'Tunai', value: 'CASH' },
                            { label: 'Transfer Bank', value: 'BANK_TRANSFER' },
                            { label: 'EDC / Lainnya', value: 'OTHER' },
                        ]}
                    />
                </Form.Item>

                {paymentMethod === 'BANK_TRANSFER' && (
                    <Form.Item
                        name="bankId"
                        label="Bank Tujuan"
                        rules={[{ required: true, message: 'Pilih bank tujuan' }]}
                        style={{ marginBottom: '12px' }}
                    >
                        <Select
                            size="large"
                            options={banks.map((b: any) => ({
                                label: `${b.name} – ${b.accountNumber} (${b.accountHolder})`,
                                value: b.id,
                            }))}
                            placeholder="Pilih bank"
                        />
                    </Form.Item>
                )}

                <Form.Item
                    name="amount"
                    label={isDeposit ? "Nominal Deposit (Rp)" : "Jumlah Uang Diterima (Rp)"}
                    rules={[
                        { required: true, message: 'Wajib diisi' },
                        {
                            validator: (_, value) => {
                                if (!value || value <= 0) return Promise.reject('Harus lebih dari 0')
                                return Promise.resolve()
                            },
                        },
                    ]}
                >
                    <InputNumber
                        style={{ width: '100%', height: '45px', fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}
                        size="large"
                        min={1}
                        placeholder="0"
                        formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                        parser={(v) => Number(v!.replace(/\./g, '')) as any}
                    />
                </Form.Item>

                {paymentMethod === 'CASH' && amount > remaining && !isDeposit && (
                    <div style={{ marginBottom: '20px', marginTop: '-12px' }}>
                        <Alert 
                            message={
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Kembalian</span>
                                    <b style={{ fontSize: '1.2rem', color: '#16a34a' }}>{formatRupiah(change)}</b>
                                </div>
                            }
                            type="success"
                            style={{ borderRadius: '6px' }}
                        />
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <Form.Item name="ref" label="No. Referensi">
                        <Input placeholder="Opsional" />
                    </Form.Item>
                    <Form.Item name="attachmentFile" label="Bukti Bayar">
                        <Upload {...uploadProps}>
                            <Button icon={<UploadOutlined />} style={{ width: '100%' }}>Pilih File</Button>
                        </Upload>
                    </Form.Item>
                </div>

                <Form.Item name="note" label="Catatan" style={{ marginBottom: 0 }}>
                    <Input.TextArea rows={1} placeholder="Catatan tambahan..." />
                </Form.Item>
            </Form>
        </Modal>
    )
}
