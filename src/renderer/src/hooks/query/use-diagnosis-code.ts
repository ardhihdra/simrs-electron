import { useQuery } from '@tanstack/react-query'

export const useDiagnosisCodeList = (params?: { q?: string; items?: number }) => {
    return useQuery({
        queryKey: ['diagnosis-code', 'list', params],
        queryFn: async () => {
            const fn = window.api?.query?.diagnosisCode?.list
            if (!fn) throw new Error('API diagnosis code tidak tersedia')
            const res = await fn(params)

            if (res.success) {
                const resultArray = Object.entries(res)
                    .filter(([key]) => !isNaN(Number(key)))
                    .map(([, value]) => value)
                    .filter((item) => typeof item === 'object' && item !== null)

                return resultArray.map((dx: any) => ({
                    id: String(dx.id),
                    code: dx.code,
                    display: dx.display,
                    id_display: dx.idDisplay || dx.id_display,
                    system: dx.system,
                    url: dx.url
                }))
            }
            return []
        },
        enabled: true
    })
}
