import { useMutation, useQuery } from "@tanstack/react-query"
import { queryClient } from "@renderer/query-client"

interface AllergyInput {
    patientId: string
    encounterId?: string
    recordedDate?: string
    recorder?: number
    clinicalStatus?: 'active' | 'inactive' | 'resolved'
    verificationStatus?: 'unconfirmed' | 'confirmed' | 'refuted' | 'entered-in-error'
    type?: 'allergy' | 'intolerance'
    category?: 'food' | 'medication' | 'environment' | 'biologic'
    criticality?: 'low' | 'high' | 'unable-to-assess'
    note?: string
    diagnosisCodeId?: number
}

export const useCreateAllergy = () => {
    return useMutation({
        mutationKey: ['allergy', 'create'],
        mutationFn: async (payload: AllergyInput) => {
            const fn = window.api?.query?.allergyIntolerance?.create
            if (!fn) throw new Error('API allergyIntolerance tidak tersedia')
            const result = await fn(payload)
            if (result && typeof result === 'object' && 'success' in result && result.success === false) {
                const r = result as { success: false; error?: string; message?: string }
                throw new Error(r.error || r.message || 'Gagal menyimpan alergi')
            }

            return result
        },
        onSuccess: (_data, variables) => {
            if (variables.encounterId) {
                queryClient.invalidateQueries({ queryKey: ['allergy', 'byEncounter', variables.encounterId] })
            }
            queryClient.invalidateQueries({ queryKey: ['allergy', 'byPatient', variables.patientId] })
        }
    })
}

export const useAllergyByPatient = (patientId?: string) => {
    return useQuery({
        queryKey: ['allergy', 'byPatient', patientId],
        queryFn: async () => {
            const fn = window.api?.query?.allergyIntolerance?.list
            if (!fn) throw new Error('API allergyIntolerance.list tidak tersedia')
            return fn({ patientId })
        },
        enabled: !!patientId
    })
}

export const useAllergyByEncounter = (encounterId?: string) => {
    return useQuery({
        queryKey: ['allergy', 'byEncounter', encounterId],
        queryFn: async () => {
            const fn = window.api?.query?.allergyIntolerance?.list
            if (!fn) throw new Error('API allergyIntolerance.list tidak tersedia')
            return fn({ encounterId })
        },
        enabled: !!encounterId
    })
}
