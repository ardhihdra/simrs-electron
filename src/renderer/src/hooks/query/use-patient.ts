import { useQuery } from '@tanstack/react-query'
import type { PatientAttributes } from '@shared/patient'

export const usePatientOptions = () => {
    return useQuery({
        queryKey: ['patient', 'options'],
        queryFn: async () => {
            const fn = window.api?.query?.patient?.list
            if (!fn) throw new Error('API patient tidak tersedia')
            const res = await fn()
            if (res.success && res.data) {
                return (res.data as unknown as PatientAttributes[]).map(p => ({
                    label: p.name,
                    value: p.id!
                }))
            }
            return []
        }
    })
}
