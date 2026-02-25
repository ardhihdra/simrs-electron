import { useQuery } from '@tanstack/react-query'

export const useMasterProcedureList = (params?: { q?: string; items?: number }) => {
    return useQuery({
        queryKey: ['master-procedure', 'list', params],
        queryFn: async () => {
            const fn = window.api?.query?.masterProcedure?.list
            if (!fn) throw new Error('API master procedure tidak tersedia')
            const res = await fn(params)

            if (res.success) {
                const resultArray = Object.entries(res)
                    .filter(([key]) => !isNaN(Number(key)))
                    .map(([, value]) => value)
                    .filter((item) => typeof item === 'object' && item !== null)

                return resultArray.map((p: any) => ({
                    id: p.id,
                    code: p.code,
                    name: p.id_display || p.display || p.name,
                    display: p.display,
                    id_display: p.id_display,
                    system: p.system,
                    url: p.url,
                    status: p.status
                }))
            }
            return []
        },
        enabled: true
    })
}
