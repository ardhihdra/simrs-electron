import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useCreateReferral = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: any) => {
            const fn = window.api?.query?.referral?.create
            if (!fn) throw new Error('API referral tidak tersedia')
            const res = await fn(data)
            if (!res.success) {
                throw new Error(res.error || res.message || 'Gagal membuat rujukan')
            }
            return res.result
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['referrals', 'encounter', variables.encounterId] })
            queryClient.invalidateQueries({ queryKey: ['referrals', 'patient', variables.patientId] })
        }
    })
}

export const useReferralByEncounter = (encounterId: string) => {
    return useQuery({
        queryKey: ['referrals', 'encounter', encounterId],
        queryFn: async () => {
            const fn = window.api?.query?.referral?.getByEncounter
            if (!fn) throw new Error('API referral tidak tersedia')
            // @ts-ignore: IPC handler returns strict type but window.api type might be generating differently
            const res = await fn({ encounterId })

            // Adjust based on how IPC handler returns data
            // Usually returns { success: true, result: [...] }
            return res.success ? res.result : []
        },
        enabled: !!encounterId
    })
}

export const useReferralByPatient = (patientId: string) => {
    // Note: getByPatient is not yet implemented in main/query/referral.ts
    // For now we disable or keep legacy if needed, but user specifically asked to use query style
    // I will comment this out or keep as place holder if backend support isn't ready
    return useQuery({
        queryKey: ['referrals', 'patient', patientId],
        queryFn: async () => {
            // Placeholder if getByPatient is added later
            /* 
            const fn = window.api?.query?.referral?.getByPatient
            if (!fn) throw new Error('API referral tidak tersedia')
            return fn({ patientId })
            */
            return []
        },
        enabled: false // Disabled for now
    })
}
