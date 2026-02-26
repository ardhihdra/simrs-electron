import { Button, Input, InputNumber, Modal, Radio, Select } from 'antd'
import { formatRupiah, type PurchaseItemRow } from '../types'

interface PaymentSummary {
    base: number
    discountValue: number
    taxValue: number
    grandTotal: number
    change: number
}

interface Props {
    open: boolean
    rows: PurchaseItemRow[]
    fakturNumber: string
    paymentMethod: 'cash' | 'noncash'
    compoundingFee: number
    otherFee: number
    discountPercent: number
    taxPercent: number
    paidAmount: number
    paymentSummary: PaymentSummary
    onPaymentMethodChange: (v: 'cash' | 'noncash') => void
    onCompoundingFeeChange: (v: number) => void
    onOtherFeeChange: (v: number) => void
    onDiscountPercentChange: (v: number) => void
    onTaxPercentChange: (v: number) => void
    onPaidAmountChange: (v: number) => void
    onCancel: () => void
    onSave: () => Promise<void>
}

export function PaymentModal({
    open,
    fakturNumber,
    paymentMethod,
    compoundingFee,
    otherFee,
    discountPercent,
    taxPercent,
    paidAmount,
    paymentSummary,
    onPaymentMethodChange,
    onCompoundingFeeChange,
    onOtherFeeChange,
    onDiscountPercentChange,
    onTaxPercentChange,
    onPaidAmountChange,
    onCancel,
    onSave
}: Props) {
    const isNoncash = paymentMethod === 'noncash'
    const isSaveable = paymentSummary.grandTotal > 0 &&
        (isNoncash || paidAmount >= paymentSummary.grandTotal)

    return (
        <Modal
            open={open}
            title="Konfirmasi Pembayaran"
            onCancel={onCancel}
            footer={null}
            width={700}
        >
            <div className="flex flex-col gap-4 mt-2">
                {/* Faktur */}
                <div className="flex items-center gap-3">
                    <label className="w-28 text-sm text-gray-600 shrink-0">No. Faktur</label>
                    <div className="flex-1 bg-gray-100 rounded px-3 py-1.5 text-sm font-mono">{fakturNumber}</div>
                </div>

                {/* Metode */}
                <div className="flex items-center gap-3">
                    <label className="w-28 text-sm text-gray-600 shrink-0">Metode Bayar</label>
                    <Radio.Group
                        value={paymentMethod}
                        onChange={(e) => onPaymentMethodChange(e.target.value === 'noncash' ? 'noncash' : 'cash')}
                    >
                        <Radio value="cash">Tunai</Radio>
                        <Radio value="noncash">Non Tunai / Kredit</Radio>
                    </Radio.Group>
                </div>

                {/* Biaya peracikan & lain */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                        <label className="w-28 text-sm text-gray-600 shrink-0">Biaya Racikan</label>
                        <InputNumber
                            className="flex-1"
                            min={0}
                            value={compoundingFee}
                            onChange={(v) => onCompoundingFeeChange(typeof v === 'number' && Number.isFinite(v) ? v : 0)}
                            formatter={(v) => v !== undefined ? String(v).replace(/[^0-9]/g, '') : ''}
                            parser={(v) => (v ? Number(v.replace(/[^0-9]/g, '')) : 0)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-28 text-sm text-gray-600 shrink-0">Biaya Lain</label>
                        <InputNumber
                            className="flex-1"
                            min={0}
                            value={otherFee}
                            onChange={(v) => onOtherFeeChange(typeof v === 'number' && Number.isFinite(v) ? v : 0)}
                            formatter={(v) => v !== undefined ? String(v).replace(/[^0-9]/g, '') : ''}
                            parser={(v) => (v ? Number(v.replace(/[^0-9]/g, '')) : 0)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-28 text-sm text-gray-600 shrink-0">Diskon (%)</label>
                        <InputNumber className="flex-1" min={0} max={100} value={discountPercent}
                            onChange={(v) => onDiscountPercentChange(typeof v === 'number' ? v : 0)} />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="w-28 text-sm text-gray-600 shrink-0">Pajak (%)</label>
                        <InputNumber className="flex-1" min={0} max={100} value={taxPercent}
                            onChange={(v) => onTaxPercentChange(typeof v === 'number' ? v : 0)} />
                    </div>
                </div>

                {/* Ringkasan */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Subtotal</span>
                        <span>{formatRupiah(paymentSummary.base - compoundingFee - otherFee)}</span>
                    </div>
                    {compoundingFee > 0 && (
                        <div className="flex justify-between">
                            <span className="text-gray-500">Biaya Racikan</span>
                            <span>{formatRupiah(compoundingFee)}</span>
                        </div>
                    )}
                    {otherFee > 0 && (
                        <div className="flex justify-between">
                            <span className="text-gray-500">Biaya Lain</span>
                            <span>{formatRupiah(otherFee)}</span>
                        </div>
                    )}
                    {paymentSummary.discountValue > 0 && (
                        <div className="flex justify-between text-red-500">
                            <span>Diskon ({discountPercent}%)</span>
                            <span>-{formatRupiah(paymentSummary.discountValue)}</span>
                        </div>
                    )}
                    {paymentSummary.taxValue > 0 && (
                        <div className="flex justify-between">
                            <span className="text-gray-500">Pajak ({taxPercent}%)</span>
                            <span>{formatRupiah(paymentSummary.taxValue)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                        <span>Grand Total</span>
                        <span className="text-blue-600 text-xl">{formatRupiah(paymentSummary.grandTotal)}</span>
                    </div>
                </div>

                {/* Dibayar & kembalian (tunai saja) */}
                {!isNoncash && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <label className="w-28 text-sm text-gray-600 shrink-0">Uang Diterima</label>
                            <div className="flex flex-1 items-center gap-1">
                                <span className="text-sm">Rp.</span>
                                <InputNumber
                                    className="flex-1"
                                    min={0}
                                    value={paidAmount}
                                    onChange={(v) => onPaidAmountChange(typeof v === 'number' && v >= 0 ? v : 0)}
                                    formatter={(v) => v !== undefined ? String(v).replace(/[^0-9]/g, '') : ''}
                                    parser={(v) => (v ? Number(v.replace(/[^0-9]/g, '')) : 0)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="w-28 text-sm text-gray-600 shrink-0">Kembalian</label>
                            <span className={`font-bold text-lg ${paymentSummary.change > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                {formatRupiah(paymentSummary.change)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-2">
                    <Button onClick={onCancel}>Batal</Button>
                    <Button type="primary" disabled={!isSaveable} onClick={onSave}>
                        Simpan &amp; Cetak Struk
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
