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
    deskripsi?: string | null
    tarifPaket: number | string
    aktif?: boolean
    detailItems?: PaketDetailItem[] | null
    listTindakan?: PaketDetailItem[] | null
    listBHP?: PaketBhpItem[] | null
}

export const useMasterPaketTindakanList = (params?: {
    q?: string
    aktif?: boolean
    items?: number
    depth?: number
}) => {
    return useQuery({
        queryKey: ['master-paket-tindakan', 'list', params],
        queryFn: async (): Promise<MasterPaketTindakanItem[]> => {
            const fn = window.api?.query?.masterPaketTindakan?.list
            if (!fn) throw new Error('API master paket tindakan tidak tersedia')
            const res = await fn({ ...params })
            if (!res.success) throw new Error((res as any).error ?? 'Gagal mengambil data paket tindakan')
            return ((res as any).result ?? []) as MasterPaketTindakanItem[]
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
            const res = await fn({ id: id! })
            if (!res.success) throw new Error((res as any).error ?? 'Gagal mengambil data paket tindakan')
            return ((res as any).result) as MasterPaketTindakanItem | null
        },
        enabled: !!id,
        staleTime: 2 * 60 * 1000
    })
}
