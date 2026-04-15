import { useQuery } from '@tanstack/react-query'

export const useOperatingRoomList = (status?: string) => {
    return useQuery({
        queryKey: ['operating-room', 'list', status],
        queryFn: async () => {
            const fn = window.api?.query?.operatingRoom?.list
            if (!fn) throw new Error('API operatingRoom tidak tersedia')
            const res = await fn({ status })
            if (res.success && res.result) {
                return res.result
            }
            return []
        }
    })
}
