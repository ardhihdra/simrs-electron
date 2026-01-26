import { useQuery } from '@tanstack/react-query'

export const usePoliOptions = (valueType: 'id' | 'name' = 'id') => {
    return useQuery({
        queryKey: ['poli', 'options', valueType],
        queryFn: async () => {
            const res = await window.api.query.poli.list()
            if (res.success && res.result) {
                return res.result.map((item) => ({
                    label: item.name,
                    value: valueType === 'name' ? item.name : item.id
                }))
            }
            return []
        }
    })
}
