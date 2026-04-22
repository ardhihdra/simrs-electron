import { useQuery } from '@tanstack/react-query'
import { type CategoryBpjs, CATEGORY_BPJS_VALUES } from 'simrs-types'

export { CATEGORY_BPJS_VALUES }
export type { CategoryBpjs }

export interface MasterTindakanItem {
    id: number
    kodeTindakan: string
    namaTindakan: string
    kategoriTindakan?: string | null
    categoryBpjs?: CategoryBpjs | null
    aktif?: boolean
    satuan?: string | null
    deskripsi?: string | null
}

export interface MasterTindakanPagination {
    page: number
    pages: number
    count: number
    limit?: number
}

export interface MasterTindakanListResult {
    rows: MasterTindakanItem[]
    pagination?: MasterTindakanPagination
}

export const useMasterTindakanList = (params?: {
    page?: number
    q?: string
    kategori?: string
    categoryBpjs?: CategoryBpjs
    status?: string
    items?: number
}, options?: {
    enabled?: boolean
}) => {
    return useQuery({
        queryKey: ['master-tindakan', 'list', params],
        queryFn: async (): Promise<MasterTindakanListResult> => {
            const fn = window.api?.query?.masterTindakan?.list
            if (!fn) throw new Error('API master tindakan tidak tersedia')
            const res = await fn({ ...params, status: params?.status ?? 'active' })
            if (!res.success) throw new Error(res.error ?? 'Gagal mengambil data master tindakan')
            return {
                rows: (res.result ?? []) as MasterTindakanItem[],
                pagination: res.pagination
                    ? {
                        page: Number(res.pagination.page) || 1,
                        pages: Number(res.pagination.pages) || 1,
                        count: Number(res.pagination.count) || 0,
                        limit: Number(res.pagination.limit) || params?.items
                    }
                    : undefined
            }
        },
        staleTime: 5 * 60 * 1000,
        enabled: options?.enabled ?? true
    })
}
