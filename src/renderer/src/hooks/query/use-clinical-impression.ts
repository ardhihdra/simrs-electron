import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ClinicalImpressionData } from '@renderer/utils/formatters/clinical-impression-formatter'

export const useClinicalImpressionByEncounter = (encounterId: string) => {
    return useQuery({
        queryKey: ['clinical-impressions', encounterId],
        queryFn: async () => {
            const res = await window.api.query.clinicalImpression.getByEncounter({ encounterId })
            if (!res.success) throw new Error(res.error || res.message || 'Failed to fetch clinical impressions')
            return res as { success: boolean; data: ClinicalImpressionData[]; message?: string }
        },
        enabled: !!encounterId
    })
}

export const useSaveClinicalImpression = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: any) => {
            if (payload.id) {
                const res = await window.api.query.clinicalImpression.update(payload);
                if (!res.success) throw new Error(res.error || res.message || 'Failed to update clinical impression');
                return res;
            } else {
                const res = await window.api.query.clinicalImpression.create(payload);
                if (!res.success) throw new Error(res.error || res.message || 'Failed to create clinical impression');
                return res;
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['clinical-impressions', variables.encounterId] });
        }
    });
};
