import { queryClient } from "@renderer/query-client"
import { useMutation, useQuery } from "@tanstack/react-query"

export const useDiagnosticReportByEncounter = (encounterId?: string) => {
    return useQuery({
        queryKey: ['diagnostic-report', 'by-encounter', encounterId],
        queryFn: () => {
            const fn = window.api?.query?.diagnosticReport?.getByEncounter
            if (!fn || !encounterId) throw new Error('API diagnosticReport tidak tersedia')
            return fn({ encounterId })
        },
        enabled: !!encounterId
    })
}

export const useCreateDiagnosticReport = () => {
    return useMutation({
        mutationKey: ['diagnostic-report', 'create'],
        mutationFn: async (payload: any) => {
            const fn = window.api?.query?.diagnosticReport?.create
            if (!fn) throw new Error('API diagnosticReport tidak tersedia')
            return fn(payload)
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['diagnostic-report', 'by-encounter', variables.encounterId] })
            queryClient.invalidateQueries({ queryKey: ['service-request', 'by-encounter', variables.encounterId] })
        }
    })
}
