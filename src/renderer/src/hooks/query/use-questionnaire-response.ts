import { queryClient } from "@renderer/query-client"
import { useMutation, useQuery } from "@tanstack/react-query"
import { CreateQuestionnaireResponsePayload } from "@renderer/types/questionnaire.types"

export const useCreateQuestionnaireResponse = () => {
    return useMutation({
        mutationKey: ['questionnaire-response', 'create'],
        mutationFn: async (payload: CreateQuestionnaireResponsePayload) => {
            const fn = window.api?.query?.questionnaireResponse?.create
            if (!fn) throw new Error('API QuestionnaireResponse tidak tersedia')
            const result = await fn(payload)

            return result
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['questionnaire-response', 'list'] })
            if (variables.encounterId) {
                queryClient.invalidateQueries({ queryKey: ['questionnaire-response', 'by-encounter', variables.encounterId] })
            }
        }
    })
}

export const useQuestionnaireResponseByEncounter = (encounterId?: string) => {
    return useQuery({
        queryKey: ['questionnaire-response', 'by-encounter', encounterId],
        queryFn: () => {
            const fn = window.api?.query?.questionnaireResponse?.getByEncounter
            if (!fn || !encounterId) throw new Error('API QuestionnaireResponse tidak tersedia')
            return fn({ encounterId })
        },
        enabled: !!encounterId
    })
}

export const useQuestionnaireResponseList = (params?: any) => {
    return useQuery({
        queryKey: ['questionnaire-response', 'list', params],
        queryFn: () => {
            const fn = window.api?.query?.questionnaireResponse?.list
            if (!fn) throw new Error('API QuestionnaireResponse tidak tersedia')
            return fn(params)
        }
    })
}
