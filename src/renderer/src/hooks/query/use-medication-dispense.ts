import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useMedicationDispenseByEncounter = (patientId?: string, encounterId?: string) => {
    return useQuery({
        queryKey: ['medication-dispense', 'by-encounter', encounterId],
        queryFn: async () => {
            const api = (window.api?.query as any)?.medicationDispense
            if (!api?.list || !encounterId || !patientId) {
                throw new Error('API medicationDispense tidak tersedia atau parameter tidak lengkap')
            }
            const res = await api.list({ patientId, limit: 100 })
            if (res.success && res.data) {
                // Jangan filter strict by encounterId dulu untuk mendebug apakah datanya terbuat:
                res.data = res.data.filter((item: any) => {
                    if (!item.encounterId) return true; // Tampilkan juga jika encounterId-nya null dari DB
                    return String(item.encounterId) === String(encounterId)
                })
            }
            return res
        },
        enabled: !!encounterId && !!patientId
    })
}

export const useCreateMedicationDispense = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['medication-dispense', 'create'],
        mutationFn: async (payload: any) => {
            const api = (window.api?.query as any)?.medicationDispense
            if (!api?.createModule) throw new Error('API medicationDispense tidak tersedia')
            return api.createModule(payload)
        },
        onSuccess: (_data, variables) => {
            if (variables.encounterId) {
                queryClient.invalidateQueries({
                    queryKey: ['medication-dispense', 'by-encounter', variables.encounterId]
                })
            }
        }
    })
}

export const useUpdateMedicationDispense = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['medication-dispense', 'update'],
        mutationFn: async (payload: any) => {
            const api = (window.api?.query as any)?.medicationDispense
            if (!api?.update) throw new Error('API medicationDispense tidak tersedia')
            return api.update(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['medication-dispense', 'by-encounter'] })
        }
    })
}
