// Shared types for item-purchase feature
export interface PriceRule {
    unitCode: string
    qty: number
    price: number
}

export interface ItemLookup {
    id: number
    kode: string
    nama: string
    kodeUnit: string
    itemCategoryId?: number | null
    sellingPrice: number | null
    sellPriceRules?: PriceRule[] | null
    categoryName?: string | null
    currentStock?: number | null
}

export interface InventoryStockItem {
    kodeItem: string
    namaItem: string
    unit: string
    stockIn: number
    stockOut: number
    availableStock: number
}

export interface PharmacyTransactionRecord {
    id: number
    fakturNumber: string
    transactionDate: string
    cashierName?: string | null
    patientId?: string | null
    paymentMethod: 'CASH' | 'NONCASH' | 'CREDIT'
    compoundingFee?: number | null
    otherFee?: number | null
    discountPercent?: number | null
    taxPercent?: number | null
    totalAmount: number
    grandTotal: number
    paidAmount: number
    changeAmount: number
    notes?: string | null
}

export interface PurchaseItemRow {
    key: string
    kode: string
    nama: string
    harga: number
    qty: number
    satuan: string
    subTotal: number
}

export const formatRupiah = (value: number | null | undefined): string => {
    const safe = typeof value === 'number' && Number.isFinite(value) ? value : 0
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(safe)
}

export const generateFakturNumber = (): string => {
    const now = new Date()
    const pad = (n: number, len: number): string => n.toString().padStart(len, '0')
    const parts = [
        pad(now.getFullYear() % 100, 2),
        pad(now.getMonth() + 1, 2),
        pad(now.getDate(), 2),
        pad(now.getHours(), 2),
        pad(now.getMinutes(), 2),
        pad(now.getSeconds(), 2)
    ]
    return `PJ.${parts.join('')}`
}
