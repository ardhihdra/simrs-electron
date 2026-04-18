import { useQuery } from '@tanstack/react-query'

export interface MasterTindakanSimpleItem {
    id: number
    kodeTindakan: string
    namaTindakan: string
    kategoriTindakan?: string | null
}

export interface PaketDetailItem {
    id: number
    paketId: number
    masterTindakanId: number
    qty?: number | string | null
    satuan?: string | null
    bhpList?: {
        id?: number
        paketDetailId?: number
        itemId: number
        jumlahDefault?: number | string | null
        satuan?: string | null
        includedInPaket?: boolean
        keterangan?: string | null
        item?: {
            id: number
            kode?: string | null
            nama?: string | null
            kind?: string | null
            sellingPrice?: number | string | null
        } | null
    }[] | null
    tindakan?: MasterTindakanSimpleItem | null
    masterTindakan?: MasterTindakanSimpleItem | null
}

export interface PaketBhpItem {
    id?: number
    paketDetailId?: number
    masterTindakanId?: number
    itemId: number
    jumlahDefault?: number | string | null
    satuan?: string | null
    includedInPaket?: boolean
    keterangan?: string | null
    tindakan?: MasterTindakanSimpleItem | null
    item?: {
        id: number
        kode?: string | null
        nama?: string | null
        kind?: string | null
        sellingPrice?: number | string | null
    } | null
}

export interface MasterPaketTindakanItem {
    id: number
    kodePaket: string
    namaPaket: string
    kategoriPaket?: string | null
    isPaketOk?: boolean
    deskripsi?: string | null
    tarifPaket: number | string
    aktif?: boolean
    tarifList?: {
        id?: number
        paketId?: number
        kelas?: string | null
        effectiveFrom?: string | null
        effectiveTo?: string | null
        tarifTotal?: number | string | null
        aktif?: boolean | null
    }[] | null
    detailItems?: PaketDetailItem[] | null
    listTindakan?: PaketDetailItem[] | null
    listBHP?: PaketBhpItem[] | null
}

type MasterPaketTindakanListParams = Parameters<
    NonNullable<Window['api']['query']['masterPaketTindakan']['list']>
>[0]
type MasterPaketTindakanListResponse = Awaited<
    ReturnType<NonNullable<Window['api']['query']['masterPaketTindakan']['list']>>
>
type MasterPaketTindakanGetByIdResponse = Awaited<
    ReturnType<NonNullable<Window['api']['query']['masterPaketTindakan']['getById']>>
>

export const useMasterPaketTindakanList = (params?: {
    q?: string
    aktif?: boolean
    isPaketOk?: boolean
    items?: number
    depth?: number
}) => {
    return useQuery({
        queryKey: ['master-paket-tindakan', 'list', params],
        queryFn: async (): Promise<MasterPaketTindakanItem[]> => {
            const fn = window.api?.query?.masterPaketTindakan?.list
            if (!fn) throw new Error('API master paket tindakan tidak tersedia')
            const payload: MasterPaketTindakanListParams = { ...(params ?? {}) }
            const res = (await fn(payload)) as MasterPaketTindakanListResponse
            if (!res.success) throw new Error(res.error ?? 'Gagal mengambil data paket tindakan')
            return Array.isArray(res.result) ? (res.result as MasterPaketTindakanItem[]) : []
        },
        staleTime: 5 * 60 * 1000
    })
}

export const useMasterPaketTindakanById = (id: number | undefined) => {
    return useQuery({
        queryKey: ['master-paket-tindakan', 'getById', id],
        queryFn: async (): Promise<MasterPaketTindakanItem | null> => {
            const fn = window.api?.query?.masterPaketTindakan?.getById
            if (!fn) throw new Error('API master paket tindakan tidak tersedia')
            const res = (await fn({ id: id! })) as MasterPaketTindakanGetByIdResponse
            if (!res.success) throw new Error(res.error ?? 'Gagal mengambil data paket tindakan')
            return (res.result ?? null) as MasterPaketTindakanItem | null
        },
        enabled: !!id,
        staleTime: 2 * 60 * 1000
    })
}
