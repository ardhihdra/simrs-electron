/**
 * purpose: Route controller daftar pasien IGD untuk memuat dashboard backend dan mengelola aksi operasional (triase, ganti pasien, disposisi, dan buka pemeriksaan dokter).
 * main callers: Routing `IGD_PAGE_PATHS.daftar` di `route.tsx`.
 * key dependencies: `client.igd.dashboard`, mutasi IGD/visit-management, `IgdDaftarPage`, dan modal disposisi/replace.
 * main/public functions: `IgdDaftarRoute`.
 * side effects: Query/mutation HTTP via RPC, invalidasi query dashboard IGD, serta navigasi halaman IGD.
 */
import type { PatientAttributes } from 'simrs-types'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { App, Button, Modal } from 'antd'
import dayjs from 'dayjs'

import { DischargeModal } from '../../components/organisms/encounter-transition/DischargeModal'
import PatientLookupSelector from '../../components/organisms/patient/PatientLookupSelector'
import { queryClient } from '../../query-client'
import { client } from '../../utils/client'

import { IgdDaftarPage } from './IgdDaftarPage'
import { getIgdActionErrorMessage } from './igd.feedback'
import { IGD_PAGE_PATHS } from './igd.config'
import { EMPTY_IGD_DASHBOARD } from './igd.data'
import { IGD_DISCHARGE_OPTIONS } from './igd.disposition'
import {
  buildIgdDailyReportExportFileName,
  buildIgdDailyReportExportGroups,
  buildIgdDailyReportExportTitle
} from './igd.report'
import { IgdReferralDispositionModal } from './IgdReferralDispositionModal'

export default function IgdDaftarRoute() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const dashboardQuery = client.igd.dashboard.useQuery({})
  const dailyReportQuery = client.igd.dailyReport.useQuery({ date: dayjs().format('YYYY-MM-DD') })
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(undefined)
  const [replacePatientModalVisible, setReplacePatientModalVisible] = useState(false)
  const [selectedDisposition, setSelectedDisposition] = useState('')
  const [selectedDispositionEncounterId, setSelectedDispositionEncounterId] = useState<
    string | null
  >(null)
  const [dischargeModalVisible, setDischargeModalVisible] = useState(false)
  const [rujukanModalVisible, setRujukanModalVisible] = useState(false)
  const [selectedReplacementPatient, setSelectedReplacementPatient] = useState<
    PatientAttributes | undefined
  >()

  const invalidateIgdDashboard = async () => {
    await queryClient.invalidateQueries({
      predicate: (query) => {
        const key = JSON.stringify(query.queryKey)
        return key.includes('igd') && key.includes('dashboard')
      }
    })
  }

  const resetDispositionState = () => {
    setSelectedDisposition('')
    setSelectedDispositionEncounterId(null)
    setDischargeModalVisible(false)
    setRujukanModalVisible(false)
  }

  const rebindPatientMutation = client.igd.rebindPatient.useMutation({
    onSuccess: async () => {
      await invalidateIgdDashboard()
    }
  })
  const dischargeEncounterMutation = client.visitManagement.dischargeEncounter.useMutation({
    onSuccess: async () => {
      await invalidateIgdDashboard()
    }
  })

  useEffect(() => {
    const patients = dashboardQuery.data?.patients ?? []
    if (patients.length === 0) {
      setSelectedPatientId(undefined)
      return
    }

    if (!selectedPatientId || !patients.some((patient) => patient.id === selectedPatientId)) {
      setSelectedPatientId(patients[0]?.id)
    }
  }, [dashboardQuery.data?.patients, selectedPatientId])

  const selectedPatient =
    dashboardQuery.data?.patients.find((patient) => patient.id === selectedPatientId) ??
    dashboardQuery.data?.patients[0] ??
    null
  const reportExportGroups = useMemo(
    () => (dailyReportQuery.data ? buildIgdDailyReportExportGroups(dailyReportQuery.data) : []),
    [dailyReportQuery.data]
  )
  const reportExportTitle = dailyReportQuery.data
    ? buildIgdDailyReportExportTitle(dailyReportQuery.data)
    : 'Laporan Harian IGD'
  const reportExportFileName = dailyReportQuery.data
    ? buildIgdDailyReportExportFileName(dailyReportQuery.data)
    : 'laporan-igd'

  const openDisposition = (encounterId: string, patientId?: string) => {
    if (patientId) {
      setSelectedPatientId(patientId)
    }
    setSelectedDispositionEncounterId(encounterId)
    setSelectedDisposition('')
    setDischargeModalVisible(true)
  }

  return (
    <>
      <IgdDaftarPage
        dashboard={dashboardQuery.data ?? EMPTY_IGD_DASHBOARD}
        selectedPatientId={selectedPatientId}
        onSelectPatient={setSelectedPatientId}
        isLoading={dashboardQuery.isLoading}
        errorMessage={dashboardQuery.error?.message}
        onRetry={() => {
          void dashboardQuery.refetch()
        }}
        onOpenRegistrasi={() => navigate(IGD_PAGE_PATHS.registrasi)}
        onOpenTriase={(patientId) =>
          navigate(IGD_PAGE_PATHS.triase, {
            state: { selectedPatientId: patientId ?? selectedPatientId }
          })
        }
        onOpenBedMap={() => navigate(IGD_PAGE_PATHS.bedMap)}
        onOpenReplacePatient={() => {
          setSelectedReplacementPatient(undefined)
          setReplacePatientModalVisible(true)
        }}
        onOpenDisposition={(patient) => {
          openDisposition(patient.encounterId, patient.id)
        }}
        onOpenExamination={(patient) => navigate(`/dashboard/doctor/${patient.encounterId}`)}
        reportExportGroups={reportExportGroups}
        reportExportTitle={reportExportTitle}
        reportExportFileName={reportExportFileName}
        isReportLoading={dailyReportQuery.isLoading || dailyReportQuery.isFetching}
      />

      <Modal
        title="Ganti Identitas Pasien"
        open={replacePatientModalVisible}
        onCancel={() => {
          setSelectedReplacementPatient(undefined)
          setReplacePatientModalVisible(false)
        }}
        width={1100}
        destroyOnClose
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setSelectedReplacementPatient(undefined)
              setReplacePatientModalVisible(false)
            }}
          >
            Batal
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={async () => {
              if (!selectedPatient?.encounterId || !selectedReplacementPatient?.id) {
                return
              }

              try {
                await rebindPatientMutation.mutateAsync({
                  encounterId: selectedPatient.encounterId,
                  patientId: selectedReplacementPatient.id
                })
                setSelectedReplacementPatient(undefined)
                setReplacePatientModalVisible(false)
                message.success('Identitas pasien IGD berhasil diperbarui')
              } catch (error) {
                message.error(
                  getIgdActionErrorMessage(error, 'Gagal mengganti identitas pasien IGD')
                )
              }
            }}
            disabled={!selectedReplacementPatient?.id || rebindPatientMutation.isPending}
            loading={rebindPatientMutation.isPending}
          >
            Gunakan Pasien Ini
          </Button>
        ]}
      >
        <PatientLookupSelector
          value={selectedReplacementPatient}
          onChange={setSelectedReplacementPatient}
          title="Pilih Pasien Existing"
          createButtonLabel="Buat Pasien Baru"
          showSelectionSummary={false}
        />
      </Modal>

      <DischargeModal
        visible={dischargeModalVisible}
        loading={dischargeEncounterMutation.isPending}
        selectedDisposition={selectedDisposition}
        options={IGD_DISCHARGE_OPTIONS}
        onDispositionChange={setSelectedDisposition}
        onConfirm={async () => {
          if (!selectedDispositionEncounterId || !selectedDisposition) {
            message.warning('Pilih disposisi pulang terlebih dahulu')
            return
          }

          if (selectedDisposition === 'REFERRED') {
            setDischargeModalVisible(false)
            setRujukanModalVisible(true)
            return
          }

          try {
            await dischargeEncounterMutation.mutateAsync({
              encounterId: selectedDispositionEncounterId,
              dischargeDisposition: selectedDisposition
            })
            resetDispositionState()
            message.success('Disposition IGD berhasil diproses')
          } catch (error) {
            message.error(getIgdActionErrorMessage(error, 'Gagal memproses disposition IGD'))
          }
        }}
        onCancel={resetDispositionState}
      />

      {rujukanModalVisible && selectedDispositionEncounterId && selectedPatient ? (
        <IgdReferralDispositionModal
          open
          encounterId={selectedDispositionEncounterId}
          patient={selectedPatient}
          onReferralCreated={async () => {
            try {
              await dischargeEncounterMutation.mutateAsync({
                encounterId: selectedDispositionEncounterId,
                dischargeDisposition: 'REFERRED'
              })
              resetDispositionState()
            } catch (error) {
              resetDispositionState()
              message.error(getIgdActionErrorMessage(error, 'Gagal memproses disposition IGD'))
            }
          }}
          onCancel={resetDispositionState}
        />
      ) : null}
    </>
  )
}
