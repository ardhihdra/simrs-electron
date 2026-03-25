import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface TindakanPelaksanaItem {
    id: number
    tindakanPasienId: number
    pegawaiId: number
    roleTenaga: string
    jasa?: number | string | null
    pegawai?: { id: number; namaLengkap?: string | null; nik?: string | null } | null
}

export interface DetailTindakanBhpItem {
    id?: number
    tindakanPasienId?: number
    medicationDispenseId?: number | null
    itemId: number
    namaItem?: string | null
    jumlah: number | string
    satuan?: string | null
    hargaSatuan?: number | string | null
    subtotal?: number | string | null
    includedInPaket?: boolean | null
    item?: {
        id: number
        kode?: string | null
        nama?: string | null
        sellingPrice?: number | string | null
        kind?: string | null
    } | null
    medicationDispense?: {
        id: number
        itemId?: number | null
        status?: string | null
        whenPrepared?: string | null
        whenHandedOver?: string | null
    } | null
}

export interface DetailTindakanPasienItem {
    id: number
    encounterId: string
    patientId: string
    masterTindakanId: number
    paketId?: number | null
    tanggalTindakan: string
    jumlah: number | string
    satuan?: string | null
    tarif?: number | string | null
    subtotal?: number | string | null
    cyto?: boolean | null
    catatanTambahan?: string | null
    status?: string
    createdAt?: string
    masterTindakan?: { id: number; kodeTindakan: string; namaTindakan: string; kategoriTindakan?: string | null } | null
    tindakanPelaksanaList?: TindakanPelaksanaItem[] | null
    bhpList?: DetailTindakanBhpItem[] | null
}

export interface PetugasInput {
    pegawaiId: number
    roleTenaga: string
}

export interface CreateDetailTindakanInput {
    encounterId: string
    patientId: string
    tanggalTindakan: string | Date
    cyto?: boolean
    catatanTambahan?: string | null
    petugasList: PetugasInput[]
    tindakanSatuanList?: {
        masterTindakanId: number
        kelas?: string | null
        jumlah: number
        satuan?: string | null
        cyto?: boolean
    }[]
    tindakanPaketList?: {
        masterTindakanId: number
        paketId: number
        paketDetailId: number
        kelas?: string | null
        jumlah: number
        satuan?: string | null
        cyto?: boolean
    }[]
    bhpSatuanList?: {
        itemId: number
        jumlah: number
        satuan?: string | null
        includedInPaket?: boolean
    }[]
    bhpPaketList?: {
        paketBhpId: number
        paketBhpDetailId: number
        itemId: number
        jumlah: number
        satuan?: string | null
    }[]
}

export interface UpdateDetailTindakanInput extends CreateDetailTindakanInput {
    id: number;
}

export const useDetailTindakanByEncounter = (encounterId: string | undefined) => {
    return useQuery({
        queryKey: ['detail-tindakan-pasien', 'by-encounter', encounterId],
        queryFn: async (): Promise<DetailTindakanPasienItem[]> => {
            const fn = window.api?.query?.detailTindakanPasien?.byEncounter
            if (!fn) throw new Error('API detail tindakan tidak tersedia')
            const res = await fn({ encounterId: encounterId! })
            if (!res.success) throw new Error(res.error ?? 'Gagal mengambil detail tindakan')
            return (res.result ?? []) as unknown as DetailTindakanPasienItem[]
        },
        enabled: !!encounterId
    })
}

export const useCreateDetailTindakan = (encounterId: string | undefined) => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (input: CreateDetailTindakanInput) => {
            const fn = (window.api?.query?.detailTindakanPasien?.create as any)
            if (!fn) throw new Error('API detail tindakan tidak tersedia')
            const res = await (fn as any)(input)
            if (!res.success) throw new Error((res as any).error ?? 'Gagal menyimpan detail tindakan')
            return res
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['detail-tindakan-pasien', 'by-encounter', encounterId]
            })
        }
    })
}

export const useUpdateDetailTindakan = (encounterId: string | undefined) => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (input: UpdateDetailTindakanInput) => {
            const fn = (window.api?.query?.detailTindakanPasien?.update as any)
            if (!fn) throw new Error('API detail tindakan tidak tersedia')
            const res = await (fn as any)(input)
            if (!res.success) throw new Error((res as any).error ?? 'Gagal memperbarui detail tindakan')
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
            const fn = (window.api?.query?.detailTindakanPasien?.remove as any)
            if (!fn) throw new Error('API detail tindakan tidak tersedia')
            const res = await fn({ id })
            if (!res.success) throw new Error((res as any).error ?? 'Gagal membatalkan tindakan')
            return res
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['detail-tindakan-pasien', 'by-encounter', encounterId]
            })
        }
    })
}
