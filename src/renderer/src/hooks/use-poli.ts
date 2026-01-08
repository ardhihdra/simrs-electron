import { useQuery } from '@tanstack/react-query'

export const usePoliOptions = (valueType: 'id' | 'name' = 'id') => {
    return useQuery({
        queryKey: ['poli', 'options', valueType],
        queryFn: async () => {
            // @ts-ignore - The route is auto-registered
            const res = await window.api.query.poli.list()
            if (res.success && res.data) {
                return res.data.map((item: any) => ({
                    label: item.name || item.label || item.id,
                    value: valueType === 'name' ? (item.name || item.label) : item.id
                }))
            }
            return []
        }
    })
}
