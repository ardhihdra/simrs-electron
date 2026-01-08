import { useQuery, useMutation } from "@tanstack/react-query"
import { useCallback } from "react"
import type { KepegawaianAttributes } from '@shared/kepegawaian'
import dayjs from 'dayjs'
import { queryClient } from '@renderer/query-client'

export type PegawaiRow = KepegawaianAttributes & {
    no: number
    kategori?: string | null
    idSatuSehat?: string | null
    bagianSpesialis?: string | null
    tanggalMulaiTugas?: string | null
}

export interface PegawaiListFilter {
    searchNama?: string
    searchNik?: string
    searchIdSehat?: string
    searchBagian?: string
    searchAlamat?: string
    kategori?: string
    mulaiTugas?: string | null
}

export const useKepegawaianList = (filters?: PegawaiListFilter) => {
    return useQuery({
        queryKey: ['pegawai', 'list'],
        queryFn: async () => {
            const fn = window.api?.query?.pegawai?.list
            if (!fn) throw new Error('API pegawai tidak tersedia. Silakan restart aplikasi/dev server.')
            const result = await fn()
            return result as unknown as { data: KepegawaianAttributes[] }
        },
        select: useCallback((data: { data: KepegawaianAttributes[] }) => {
            const source = data.data || []
            const rows: PegawaiRow[] = source.map((p, idx) => {
                const kontrak = Array.isArray(p.kontrakPegawai) ? p.kontrakPegawai[0] : undefined
                return {
                    ...p,
                    no: idx + 1,
                    kategori: p.hakAkses ?? null,
                    idSatuSehat: p.idSatuSehat ?? null,
                    bagianSpesialis: kontrak?.kodeJabatan || kontrak?.kodeDepartemen || null,
                    tanggalMulaiTugas: kontrak?.tanggalMulaiKontrak ? String(kontrak.tanggalMulaiKontrak) : null
                }
            })

            if (!filters) return rows

            return rows.filter((r) => {
                const matchKategori = filters.kategori ? String(r.kategori || '').toLowerCase() === filters.kategori.toLowerCase() : true
                const matchNama = filters.searchNama ? String(r.namaLengkap || '').toLowerCase().includes(filters.searchNama.toLowerCase()) : true
                const matchNik = filters.searchNik ? String(r.nik || '').toLowerCase().includes(filters.searchNik.toLowerCase()) : true
                const matchIdSehat = filters.searchIdSehat ? String(r.idSatuSehat || '').toLowerCase().includes(filters.searchIdSehat.toLowerCase()) : true
                const matchBagian = filters.searchBagian ? String(r.bagianSpesialis || '').toLowerCase().includes(filters.searchBagian.toLowerCase()) : true
                const matchAlamat = filters.searchAlamat ? String(r.alamat || '').toLowerCase().includes(filters.searchAlamat.toLowerCase()) : true
                const matchMulai = filters.mulaiTugas ? dayjs(r.tanggalMulaiTugas).isSame(dayjs(filters.mulaiTugas), 'day') : true
                return matchKategori && matchNama && matchNik && matchIdSehat && matchBagian && matchAlamat && matchMulai
            })
        }, [filters])
    })
}

export const useDeletePegawai = () => {
    return useMutation({
        mutationKey: ['pegawai', 'delete'],
        mutationFn: (id: number) => {
            const fn = window.api?.query?.pegawai?.deleteById
            if (!fn) throw new Error('API pegawai tidak tersedia. Silakan restart aplikasi/dev server.')
            return fn({ id })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pegawai', 'list'] })
        }
    })
}

export const useKepegawaianOptions = (hakAksesCode?: string) => {
    return useQuery({
        queryKey: ['select-kepegawaian', hakAksesCode || 'all'],
        queryFn: async () => {
            if (!hakAksesCode) {
                const res = await window.api.query.kepegawaian.list()
                if (res.success && res.result) {
                    return (res.result as unknown as KepegawaianAttributes[]).map((item) => ({
                        label: item.namaLengkap,
                        value: item.id!
                    }))
                }
            } else {
                const res = await window.api.query.hakAkses.getByCode({ code: hakAksesCode })
                if (res.success && res.data) {
                    const pegawaiList = res.data.pegawaiByHakAkses || []
                    return (pegawaiList as KepegawaianAttributes[]).map((item) => ({
                        label: item.namaLengkap,
                        value: item.id!
                    }))
                }
            }
            return []
        }
    })
}