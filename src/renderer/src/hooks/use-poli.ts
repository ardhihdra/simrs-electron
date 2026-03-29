import { useQuery } from '@tanstack/react-query'

export const usePolis = (params?: { q?: string; kodeLokasiKerja?: string }) => {
    return useQuery({
        queryKey: ['poli', 'list', params],
        queryFn: async () => {
            const res = await window.api.query.poli.list(params)
            return res.success ? (res.data ?? []) : []
        },
        staleTime: 5 * 60 * 1000,
    })
}

export const usePoliOptions = (valueType: 'id' | 'name' = 'id') => {
    return useQuery({
        queryKey: ['poli', 'options', valueType],
        queryFn: async () => {
            const res = await window.api.query.poli.list()
            if (res.success && res.data) {
                return res.data.map((item) => ({
                    label: item.name,
                    value: valueType === 'name' ? item.name : item.id
                }))
            }
            return []
        }
    })
}
