import { useQuery } from '@tanstack/react-query'

export const usePerformers = (roles?: ('doctor' | 'nurse' | string)[]) => {
    return useQuery({
        queryKey: ['kepegawaian', 'list', roles ? roles.join('-') : 'all'],
        queryFn: async () => {
            const fn = window.api?.query?.kepegawaian?.list
            if (!fn) throw new Error('API kepegawaian tidak tersedia')
            const res = await fn()
            if (res.success && res.result) {
                let filtered = res.result

                if (roles && roles.length > 0) {
                    filtered = filtered.filter((p: any) =>
                        roles.includes(p.hakAksesId ?? p.hak_akses_id ?? p.role)
                    )
                }

                return filtered.map((p: any) => ({
                    id: p.id,
                    name: p.namaLengkap ?? p.nama_lengkap ?? '-',
                    role: p.hakAksesId ?? p.hak_akses_id ?? p.role,
                    sip: p.sip ?? p.sipNumber ?? null,
                    ttdUrl: p.ttdUrl ?? p.ttd_url ?? null
                }))
            }
            return []
        }
    })
}
