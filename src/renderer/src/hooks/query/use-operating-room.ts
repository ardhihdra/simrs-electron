import { useQuery } from '@tanstack/react-query'

export const useOperatingRoomList = (status?: string) => {
    return useQuery({
        queryKey: ['operating-room', 'list', status],
        queryFn: async () => {
            const fn = window.api?.query?.operatingRoom?.list
            if (!fn) throw new Error('API operatingRoom tidak tersedia')
            const res = await fn({ status })
            if (res.success && Array.isArray(res.result)) {
                return res.result
            }
            if (res.success) return []
            const message = (res as any)?.error || (res as any)?.message || 'Gagal memuat daftar ruang OK'
            throw new Error(message)
        }
    })
}
