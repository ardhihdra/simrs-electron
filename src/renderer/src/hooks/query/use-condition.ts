import { queryClient } from "@renderer/query-client"
import { useMutation, useQuery } from "@tanstack/react-query"

interface ConditionInput {
    diagnosisCodeId?: number
    isPrimary?: boolean
    category?: string
    notes?: string
}

interface BulkCreateConditionPayload {
    encounterId: string
    patientId: string
    doctorId: number
    conditions: ConditionInput[]
}

export const useBulkCreateCondition = () => {
    return useMutation({
        mutationKey: ['condition', 'bulk-create'],
        mutationFn: async (payload: BulkCreateConditionPayload) => {
            // Updated to call the new 'create' method in IPC
            const fn = window.api?.query?.condition?.create
            if (!fn) throw new Error('API condition tidak tersedia')
            return fn(payload)
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['condition', 'by-encounter', variables.encounterId] })
            queryClient.invalidateQueries({ queryKey: ['encounter', 'detail', variables.encounterId] })
        }
    })
}

export const useConditionByEncounter = (encounterId?: string) => {
    return useQuery({
        queryKey: ['condition', 'by-encounter', encounterId],
        queryFn: () => {
            const fn = window.api?.query?.condition?.getByEncounter
            if (!fn || !encounterId) throw new Error('API condition tidak tersedia')
            return fn({ encounterId })
        },
        enabled: !!encounterId
    })
}
