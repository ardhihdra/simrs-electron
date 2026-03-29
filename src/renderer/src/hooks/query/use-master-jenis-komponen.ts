import { useQuery } from '@tanstack/react-query'

export interface MasterJenisKomponenItem {
    id: number
    kode: string
    label: string
    isUntukMedis: boolean
    keterangan?: string | null
    aktif?: boolean
}

export const useMasterJenisKomponenList = (params?: {
    q?: string
    kode?: string
    label?: string
    isUntukMedis?: boolean
    status?: string
    items?: number
}) => {
    return useQuery({
        queryKey: ['master-jenis-komponen', 'list', params],
        queryFn: async (): Promise<MasterJenisKomponenItem[]> => {
            const fn = window.api?.query?.masterJenisKomponen?.list
            if (!fn) throw new Error('API master jenis komponen tidak tersedia')
            const res = await fn({ ...params, status: params?.status ?? 'active' })
            if (!res.success) throw new Error(res.error ?? 'Gagal mengambil data master jenis komponen')
            return (res.result ?? []) as MasterJenisKomponenItem[]
        },
        staleTime: 5 * 60 * 1000
    })
}
