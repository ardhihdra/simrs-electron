import { queryClient } from "@renderer/query-client"
import { EncounterListResult } from "@shared/encounter"
import { useMutation, useQuery } from "@tanstack/react-query"
import { EncounterAttributes } from 'simrs-types'

export const useCreateEncounter = () => {
    return useMutation({
        mutationKey: ['encounter', 'create'],
        mutationFn: async (payload: EncounterAttributes) => {
            const fn = window.api?.query?.encounter?.create
            if (!fn) throw new Error('API encounter tidak tersedia')
            return fn(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['encounter', 'list'] })
        }
    })
}

export const useUpdateEncounter = () => {
    return useMutation({
        mutationKey: ['encounter', 'update'],
        mutationFn: async (payload: EncounterAttributes & { id: string }) => {
            const fn = window.api?.query?.encounter?.update
            if (!fn) throw new Error('API encounter tidak tersedia')
            return fn(payload)
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['encounter', 'list'] })
            queryClient.invalidateQueries({ queryKey: ['encounter', 'detail', variables.id] })
        }
    })
}

export const useEncounterDetail = (id?: number | string) => {
    return useQuery({
        queryKey: ['encounter', 'detail', id],
        queryFn: () => {
            const fn = window.api?.query?.encounter?.getById
            if (!fn || !id) throw new Error('API encounter tidak tersedia')
            return fn({ id: String(id) })
        },
        enabled: !!id
    })
}

export const useEncounterList = () => {
    return useQuery<EncounterListResult>({
        queryKey: ['encounter', 'list'],
        queryFn: () => {
            const fn = window.api?.query?.encounter?.list
            if (!fn) throw new Error('API encounter tidak tersedia. Silakan restart aplikasi/dev server.')
            return fn() as Promise<EncounterListResult>
        }
    })
}

export const useDeleteEncounter = () => {
    return useMutation({
        mutationKey: ['encounter', 'delete'],
        mutationFn: (id: any) => {
            const fn = window.api?.query?.encounter?.deleteById
            if (!fn) throw new Error('API encounter tidak tersedia. Silakan restart aplikasi/dev server.')
            return fn({ id })
        },
        onSuccess: () => {
            console.log('success')
            queryClient.invalidateQueries({ queryKey: ['encounter', 'list'] })
        },
        onError: (error) => {
            console.log('error', error)
        }
    })
}

import { EncounterRow } from '@shared/encounter'
import dayjs from 'dayjs'
import { useCallback } from "react"

export const useEncounterMonitor = () => {
    return useQuery<EncounterListResult>({
        queryKey: ['encounter', 'list'],
        queryFn: () => {
            const fn = window.api?.query?.encounter?.list
            if (!fn) throw new Error('API encounter tidak tersedia. Silakan restart aplikasi/dev server.')
            return fn() as Promise<EncounterListResult>
        },
        select: useCallback((data: EncounterListResult) => {
            if (!data.success || !data.data) return data;

            const today = dayjs().startOf('day');

            // Should be filtered by today AND planned
            const filtered = (data.data as EncounterRow[]).filter(item => {
                const isToday = dayjs(item.visitDate).isSame(today, 'day');
                const isPlanned = (item.status || '').toLowerCase() === 'planned';
                return isToday && isPlanned;
            });

            return { ...data, data: filtered };
        }, [])
    })
}