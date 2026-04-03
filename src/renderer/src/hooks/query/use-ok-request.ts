import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useOkRequestList = (encounterId?: string) => {
    return useQuery({
        queryKey: ['ok-request', 'list', encounterId],
        queryFn: async () => {
            const fn = window.api?.query?.okRequest?.list
            if (!fn) throw new Error('API okRequest tidak tersedia')
            const res = await fn({ encounterId })
            if (res.success === false) {
                throw new Error(res.error || res.message || 'Gagal memuat data pengajuan OK')
            }
            return res.result ?? []
        }
    })
}

export const useCreateOkRequest = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (payload: Record<string, unknown>) => {
            const fn = window.api?.query?.okRequest?.create
            if (!fn) throw new Error('API okRequest tidak tersedia')
            const res = await fn(payload)
            if (res.success === false) {
                throw new Error(res.error || res.message || 'Gagal membuat pengajuan OK')
            }
            return res
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ok-request'] })
        }
    })
}
