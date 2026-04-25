import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { App } from 'antd'
import dayjs from 'dayjs'

import { client } from '../../utils/client'
import { queryClient } from '../../query-client'

import { IgdBedMapPage } from './IgdBedMapPage'
import { IGD_PAGE_PATHS } from './igd.config'
import { EMPTY_IGD_DASHBOARD } from './igd.data'
import {
  buildIgdBedReportExportFileName,
  buildIgdBedReportExportGroups,
  buildIgdBedReportExportTitle
} from './igd.bed-report'

const isIgdRoomCode = (roomCodeId?: string | null) => {
  const code = String(roomCodeId || '').toUpperCase()
  return code.includes('RESUS') || code.includes('OBS') || code.includes('TREAT')
}

export default function IgdBedMapRoute() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const dashboardQuery = client.igd.dashboard.useQuery({})
  const availableBedsQuery = client.room.available.useQuery({ paginated: false })
  const roomsQuery = client.room.rooms.useQuery({})
  const reportDate = dayjs().format('YYYY-MM-DD')

  const invalidateBedQueries = async () => {
    await queryClient.invalidateQueries({
      predicate: (query) => {
        const key = JSON.stringify(query.queryKey)
        return key.includes('igd') && key.includes('dashboard')
      }
    })
    await queryClient.invalidateQueries({
      predicate: (query) => {
        const key = JSON.stringify(query.queryKey)
        return key.includes('room') && (key.includes('available') || key.includes('rooms'))
      }
    })
  }

  const assignMutation = client.room.assign.useMutation({
    onSuccess: async () => {
      await invalidateBedQueries()
    }
  })
  const transferMutation = client.room.transfer.useMutation({
    onSuccess: async () => {
      await invalidateBedQueries()
    }
  })
  const releaseMutation = client.room.release.useMutation({
    onSuccess: async () => {
      await invalidateBedQueries()
    }
  })
  const createBedMutation = client.room.createBed.useMutation({
    onSuccess: async () => {
      await invalidateBedQueries()
    }
  })

  const availableIgdBedRows = useMemo(
    () =>
      (availableBedsQuery.data?.result ?? []).filter((row) => isIgdRoomCode(row.room?.roomCodeId)),
    [availableBedsQuery.data?.result]
  )

  const availableBedOptions = useMemo(
    () =>
      availableIgdBedRows.map((row) => ({
        label: `${row.bed?.bedCodeId} (${row.room?.roomCodeId})`,
        value: row.bed?.bedCodeId || ''
      })),
    [availableIgdBedRows]
  )

  const createBedRoomOptions = useMemo(
    () =>
      (roomsQuery.data?.result ?? [])
        .filter((room) => isIgdRoomCode(room.roomCodeId))
        .map((room) => ({
          label: `${room.roomCodeId} (${room.roomClassCodeId})`,
          value: room.id
        })),
    [roomsQuery.data?.result]
  )
  const reportExportGroups = useMemo(
    () =>
      dashboardQuery.data ? buildIgdBedReportExportGroups(dashboardQuery.data) : [],
    [dashboardQuery.data]
  )
  const reportExportTitle = dashboardQuery.data
    ? buildIgdBedReportExportTitle(dashboardQuery.data, reportDate)
    : 'Laporan Bed IGD'
  const reportExportFileName = buildIgdBedReportExportFileName(reportDate)

  return (
    <IgdBedMapPage
      dashboard={dashboardQuery.data ?? EMPTY_IGD_DASHBOARD}
      availableBedOptions={availableBedOptions}
      createBedRoomOptions={createBedRoomOptions}
      isLoading={dashboardQuery.isLoading}
      errorMessage={dashboardQuery.error?.message}
      reportExportGroups={reportExportGroups}
      reportExportTitle={reportExportTitle}
      reportExportFileName={reportExportFileName}
      isReportLoading={dashboardQuery.isLoading || dashboardQuery.isFetching}
      actionLoading={{
        assign: assignMutation.isPending,
        transfer: transferMutation.isPending,
        release: releaseMutation.isPending,
        createBed: createBedMutation.isPending
      }}
      onRetry={() => {
        void dashboardQuery.refetch()
        void availableBedsQuery.refetch()
        void roomsQuery.refetch()
      }}
      onAssignBed={async ({ patientId, bedCode }) => {
        const patient = (dashboardQuery.data?.patients ?? []).find((item) => item.id === patientId)
        const bedRow = availableIgdBedRows.find((row) => row.bed?.bedCodeId === bedCode)

        if (!patient?.encounterId || !bedRow?.bed?.id || !bedRow.room?.id || !bedRow.room?.roomClassCodeId) {
          message.error('Data pasien atau bed belum lengkap untuk menempatkan pasien')
          return
        }

        await assignMutation.mutateAsync({
          encounterId: patient.encounterId,
          roomCodeId: bedRow.room.id,
          bedCodeId: bedRow.bed.id,
          classOfCareCodeId: bedRow.room.roomClassCodeId,
          reason: 'ADMISSION'
        })
        message.success(`Pasien ${patient.name} berhasil ditempatkan di bed ${bedCode}`)
      }}
      onTransferBed={async ({ sourceBedCode, targetBedCode }) => {
        const sourceBed = (dashboardQuery.data?.beds ?? []).find((item) => item.code === sourceBedCode)
        const sourcePatient = (dashboardQuery.data?.patients ?? []).find(
          (item) => item.id === sourceBed?.patientId
        )
        const targetBed = availableIgdBedRows.find((row) => row.bed?.bedCodeId === targetBedCode)

        if (!sourceBed?.currentAssignmentId || !targetBed?.bed?.id || !targetBed.room?.id || !targetBed.room?.roomClassCodeId) {
          message.error('Data bed tujuan belum lengkap')
          return
        }

        await transferMutation.mutateAsync({
          currentAssignmentId: sourceBed.currentAssignmentId,
          encounterId: sourcePatient?.encounterId,
          newRoomCodeId: targetBed.room.id,
          newBedCodeId: targetBed.bed.id,
          newClassOfCareCodeId: targetBed.room.roomClassCodeId,
          transferReason: 'TRANSFER'
        })
        message.success(`Pasien berhasil dipindahkan dari ${sourceBedCode} ke ${targetBedCode}`)
      }}
      onReleaseBed={async ({ bedCode }) => {
        const bed = (dashboardQuery.data?.beds ?? []).find((item) => item.code === bedCode)

        if (!bed?.currentAssignmentId) {
          message.error('Data penggunaan bed ini tidak ditemukan')
          return
        }

        await releaseMutation.mutateAsync({
          accommodationAssignmentId: bed.currentAssignmentId
        })
        message.success(`Bed ${bedCode} sudah dikosongkan`)
      }}
      onCreateBed={async ({ bedCodeId, roomId }) => {
        await createBedMutation.mutateAsync({ bedCodeId, roomId })
        message.success(`Bed ${bedCodeId} berhasil ditambahkan`)
      }}
      onBack={() => navigate(IGD_PAGE_PATHS.daftar)}
    />
  )
}
