import { client } from '@renderer/utils/client'
import type { ApiSuccessResponse, DoctorScheduleSummaryDto } from '../doctor-schedule-form.types'

export function useDoctorScheduleSummary(scheduleId?: number) {
  const query = client.registration.getScheduleEditorSummary.useQuery(
    { scheduleId: scheduleId ?? 0 },
    {
      enabled: typeof scheduleId === 'number' && scheduleId > 0,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      queryKey: ['doctorScheduleEditor', 'summary', scheduleId]
    } as any
  )

  const response = query.data as ApiSuccessResponse<DoctorScheduleSummaryDto> | undefined

  return {
    summary: response?.result,
    isLoading: query.isPending,
    isError: query.isError,
    refetch: query.refetch
  }
}
