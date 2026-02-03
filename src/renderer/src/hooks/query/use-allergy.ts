import { useMutation, useQuery } from "@tanstack/react-query"

interface AllergyInput {
    patientId: string
    encounterId?: string
    recordedDate?: string
    recorder?: number
    clinicalStatus?: string
    verificationStatus?: string
    type?: string
    category?: string
    criticality?: string
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

            // Check if the backend returned an error response
            if (result && typeof result === 'object' && 'success' in result && result.success === false) {
                throw new Error(result.message || 'Gagal menyimpan alergi')
            }

            return result
        }
    })
}

export const useAllergyByPatient = (patientId?: string) => {
    return useQuery({
        queryKey: ['allergy', 'byPatient', patientId],
        queryFn: async () => {
            const fn = window.api?.query?.allergyIntolerance?.list
            if (!fn) throw new Error('API allergyIntolerance.list tidak tersedia')
            return fn({
                options: {
                    filter: { patientId }
                }
            })
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
            return fn({
                options: {
                    filter: { encounterId }
                }
            })
        },
        enabled: !!encounterId
    })
}
