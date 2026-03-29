import { useQuery } from '@tanstack/react-query'

export const CATEGORY_BPJS_VALUES = [
    'Prosedur Non Bedah',
    'Prosedur Bedah',
    'Tenaga Ahli',
    'Keperawatan',
    'Radiologi',
    'Laboratorium',
    'Rehabilitasi',
    'Kamar / Akomodasi',
    'Obat',
    'Alkes',
    'BMHP',
    'Pelayanan Darah',
    'Rawat Intensif',
    'Konsultasi',
    'Penunjang',
    'Sewa Alat'
] as const

export type CategoryBpjs = typeof CATEGORY_BPJS_VALUES[number]

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

export const useMasterTindakanList = (params?: {
    q?: string
    kategori?: string
    categoryBpjs?: CategoryBpjs
    status?: string
    items?: number
}) => {
    return useQuery({
        queryKey: ['master-tindakan', 'list', params],
        queryFn: async (): Promise<MasterTindakanItem[]> => {
            const fn = window.api?.query?.masterTindakan?.list
            if (!fn) throw new Error('API master tindakan tidak tersedia')
            const res = await fn({ ...params, status: params?.status ?? 'active' })
            if (!res.success) throw new Error(res.error ?? 'Gagal mengambil data master tindakan')
            return (res.result ?? []) as MasterTindakanItem[]
        },
        staleTime: 5 * 60 * 1000
    })
}
