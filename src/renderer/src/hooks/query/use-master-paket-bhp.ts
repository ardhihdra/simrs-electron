import { useQuery } from '@tanstack/react-query'

export interface ItemSimple {
    id: number
    kode?: string | null
    nama?: string | null
    kind?: string | null
    sellingPrice?: number | string | null
}

export interface PaketBhpDetailItem {
    id: number
    paketBhpId: number
    itemId: number
    jumlahDefault?: number | string | null
    satuan?: string | null
    keterangan?: string | null
    aktif?: boolean
    item?: ItemSimple | null
}

export interface MasterPaketBhpItem {
    id: number
    kodePaketBhp: string
    namaPaketBhp: string
    kategoriPaket?: string | null
    deskripsi?: string | null
    aktif?: boolean
    listBhp?: PaketBhpDetailItem[] | null
}

export const useMasterPaketBhpList = (params?: {
    q?: string
    aktif?: boolean
    items?: number
    depth?: number
}) => {
    return useQuery({
        queryKey: ['master-paket-bhp', 'list', params],
        queryFn: async (): Promise<MasterPaketBhpItem[]> => {
            const fn = window.api?.query?.masterPaketBhp?.list
            if (!fn) throw new Error('API master paket BHP tidak tersedia')

            const res = await fn({ ...params })
            if (!res.success) throw new Error((res as any).error ?? 'Gagal mengambil data master paket BHP')

            return ((res as any).result ?? []) as MasterPaketBhpItem[]
        },
        staleTime: 5 * 60 * 1000
    })
}

export const useMasterPaketBhpById = (id: number | undefined) => {
    return useQuery({
        queryKey: ['master-paket-bhp', 'getById', id],
        queryFn: async (): Promise<MasterPaketBhpItem | null> => {
            const fn = window.api?.query?.masterPaketBhp?.getById
            if (!fn) throw new Error('API master paket BHP tidak tersedia')

            const res = await fn({ id: id! })
            if (!res.success) throw new Error((res as any).error ?? 'Gagal mengambil data master paket BHP')

            return ((res as any).result) as MasterPaketBhpItem | null
        },
        enabled: !!id,
        staleTime: 2 * 60 * 1000
    })
}
