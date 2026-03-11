import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface DetailTindakanPasienItem {
    id: number
    encounterId: string
    patientId: string
    masterTindakanId: number
    tanggalTindakan: string
    jumlah: number | string
    satuan?: string | null
    cyto?: boolean | null
    catatanTambahan?: string | null
    dokterPemeriksaId?: number | null
    dokterDelegasiId?: number | null
    dokterAnestesiId?: number | null
    perawatId?: number | null
    perawat2Id?: number | null
    perawat3Id?: number | null
    status?: string
    createdAt?: string
    // Joined associations
    masterTindakan?: { id: number; kode: string; nama: string; kategori?: string | null } | null
    dokterPemeriksa?: { id: number; namaLengkap?: string | null } | null
    dokterDelegasi?: { id: number; namaLengkap?: string | null } | null
    dokterAnestesi?: { id: number; namaLengkap?: string | null } | null
    perawat?: { id: number; namaLengkap?: string | null } | null
    perawat2?: { id: number; namaLengkap?: string | null } | null
    perawat3?: { id: number; namaLengkap?: string | null } | null
}

export interface CreateDetailTindakanInput {
    encounterId: string
    patientId: string
    masterTindakanId: number
    tanggalTindakan: string | Date
    jumlah: number
    satuan?: string
    cyto?: boolean
    catatanTambahan?: string
    dokterPemeriksaId?: number | null
    dokterDelegasiId?: number | null
    dokterAnestesiId?: number | null
    perawatId?: number | null
    perawat2Id?: number | null
    perawat3Id?: number | null
}

export const useDetailTindakanByEncounter = (encounterId: string | undefined) => {
    return useQuery({
        queryKey: ['detail-tindakan-pasien', 'by-encounter', encounterId],
        queryFn: async (): Promise<DetailTindakanPasienItem[]> => {
            const fn = window.api?.query?.detailTindakanPasien?.byEncounter
            if (!fn) throw new Error('API detail tindakan tidak tersedia')
            const res = await fn({ encounterId: encounterId! })
            if (!res.success) throw new Error(res.error ?? 'Gagal mengambil detail tindakan')
            return (res.result ?? []) as DetailTindakanPasienItem[]
        },
        enabled: !!encounterId
    })
}

export const useCreateDetailTindakan = (encounterId: string | undefined) => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (input: CreateDetailTindakanInput) => {
            const fn = window.api?.query?.detailTindakanPasien?.create
            if (!fn) throw new Error('API detail tindakan tidak tersedia')
            const res = await fn(input)
            if (!res.success) throw new Error(res.error ?? 'Gagal menyimpan detail tindakan')
            return res
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['detail-tindakan-pasien', 'by-encounter', encounterId]
            })
        }
    })
}

export const useVoidDetailTindakan = (encounterId: string | undefined) => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: number) => {
            const fn = window.api?.query?.detailTindakanPasien?.update
            if (!fn) throw new Error('API detail tindakan tidak tersedia')
            const res = await fn({ id, status: 'void' })
            if (!res.success) throw new Error(res.error ?? 'Gagal membatalkan tindakan')
            return res
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['detail-tindakan-pasien', 'by-encounter', encounterId]
            })
        }
    })
}
