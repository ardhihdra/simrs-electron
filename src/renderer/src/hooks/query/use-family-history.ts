import { useMutation, useQuery } from "@tanstack/react-query"
import { queryClient } from "@renderer/query-client"

interface FamilyHistoryInput {
    patientId: string
    status: string
    relationship: string
    relationshipDisplay?: string
    sex?: string
    bornDate?: string
    bornAge?: number
    deceasedBoolean?: boolean
    deceasedDate?: string
    note?: string
    conditions?: Array<{
        diagnosisCodeId: number
        outcome?: string
        contributedToDeath?: boolean
        note?: string
    }>
}

export const useCreateFamilyHistory = () => {
    return useMutation({
        mutationKey: ['family-history', 'create'],
        mutationFn: async (payload: FamilyHistoryInput) => {
            const fn = window.api?.query?.familyMemberHistory?.create
            if (!fn) throw new Error('API familyMemberHistory tidak tersedia')
            const result = await fn(payload)

            // Check if the backend returned an error response
            if (result && typeof result === 'object' && 'success' in result && result.success === false) {
                throw new Error(result.message || 'Gagal menyimpan riwayat keluarga')
            }

            return result
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['family-history', 'list', variables.patientId] })
        }
    })
}

export const useFamilyHistoryByPatient = (patientId: string) => {
    return useQuery({
        queryKey: ['family-history', 'list', patientId],
        queryFn: async () => {
            const fn = window.api?.query?.familyMemberHistory?.list
            if (!fn) throw new Error('API familyMemberHistory tidak tersedia')
            return fn({ patientId })
        },
        enabled: !!patientId
    })
}
