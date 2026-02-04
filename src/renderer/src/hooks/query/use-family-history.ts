import { useMutation, useQuery } from "@tanstack/react-query"

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
            return fn(payload)
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
