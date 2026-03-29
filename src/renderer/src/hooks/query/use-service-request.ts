import { queryClient } from "@renderer/query-client"
import { rpc } from "@renderer/utils/client"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"

interface ServiceRequestFormValues {
    category: string
    code: string
    display: string
    priority?: string
    patientInstruction?: string
    system?: string
    masterServiceRequestCodeId: number
}

export const useCreateServiceRequest = ({
    encounterId,
    patientId,
    practitionerId,
}: {
    encounterId: string
    patientId: string
    practitionerId?: number
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const createServiceRequest = async (values: ServiceRequestFormValues) => {
        setIsSubmitting(true)
        try {
            console.log('sending values', values)
            const createResult = await rpc.query.entity({
                model: 'serviceRequest',
                method: 'post',
                body: {
                    encounterId,
                    patientId,
                    doctorId: practitionerId,
                    serviceRequests: [
                        {
                            category: String(values.category),
                            code: String(values.code),
                            display: String(values.display),
                            priority: String(values.priority || 'routine'),
                            patientInstruction: values.patientInstruction ? String(values.patientInstruction) : undefined,
                            system: values.system ? String(values.system) : 'http://loinc.org',
                            masterServiceRequestCodeId: values.masterServiceRequestCodeId
                        },
                    ],
                },
            })

            if (!createResult?.success) {
                throw new Error(createResult?.message || 'Gagal membuat service request')
            }

            const createdServiceRequestId = createResult?.result?.[0]?.id
            if (createdServiceRequestId) {
                await rpc.query.entity({
                    model: 'encounter',
                    path: String(encounterId),
                    method: 'put',
                    body: { serviceRequestId: String(createdServiceRequestId) },
                })
            }

            queryClient.invalidateQueries({ queryKey: ['service-request', 'by-encounter', encounterId] })
        } finally {
            setIsSubmitting(false)
        }
    }

    return { createServiceRequest, isSubmitting }
}

export const useServiceRequestByEncounter = (encounterId?: string) => {
    return useQuery({
        queryKey: ['service-request', 'by-encounter', encounterId],
        queryFn: () => {
            const fn = window.api?.query?.serviceRequest?.getByEncounter
            if (!fn || !encounterId) throw new Error('API serviceRequest tidak tersedia')
            return fn({ encounterId })
        },
        enabled: !!encounterId
    })
}

export const useBulkCreateServiceRequest = () => {
    return useMutation({
        mutationKey: ['service-request', 'create'],
        mutationFn: async (payload: any) => {
            const fn = window.api?.query?.serviceRequest?.create
            if (!fn) throw new Error('API serviceRequest tidak tersedia')
            return fn(payload)
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['service-request', 'by-encounter', variables.encounterId] })
        }
    })
}

export const useUpdateServiceRequestStatus = () => {
    return useMutation({
        mutationKey: ['service-request', 'update'],
        mutationFn: async (payload: { id: number; status: string }) => {
            const fn = window.api?.query?.serviceRequest?.update
            if (!fn) throw new Error('API serviceRequest tidak tersedia')
            return fn(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['service-request'] })
        }
    })
}
