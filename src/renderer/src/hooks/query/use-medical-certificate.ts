import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'



export const useCreateMedicalCertificate = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (payload: Parameters<Window['api']['query']['medicalCertificate']['create']>[0]) => {
            const res = await window.api.query.medicalCertificate.create(payload)
            if (!res.success) throw new Error(res.error || 'Failed to create medical certificate')
            return res.result
        },
        onSuccess: (_, variables) => {
            if (variables?.encounterId) {
                queryClient.invalidateQueries({
                    queryKey: ['medicalCertificate', 'list', variables.encounterId]
                })
            }
        }
    })
}

export const useMedicalCertificateByEncounter = (encounterId: string | undefined) => {
    return useQuery({
        queryKey: ['medicalCertificate', 'list', encounterId],
        queryFn: async () => {
            if (!encounterId) return []
            const res = await window.api.query.medicalCertificate.list({ encounterId })
            if (!res.success) throw new Error(res.error || 'Failed to fetch medical certificates')
            return res.result || []
        },
        enabled: !!encounterId
    })
}

export const useDeleteMedicalCertificate = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id }: { id: string }) => {
            const res = await window.api.query.medicalCertificate.remove({ id })
            if (!res.success) throw new Error(res.error || 'Failed to delete medical certificate')
            return res
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medicalCertificate', 'list'] })
        }
    })
}
