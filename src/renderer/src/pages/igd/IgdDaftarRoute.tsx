import type { PatientAttributes } from 'simrs-types'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { App, Button, Modal } from 'antd'
import dayjs from 'dayjs'

import PatientLookupSelector from '../../components/organisms/patient/PatientLookupSelector'
import { queryClient } from '../../query-client'
import { client } from '../../utils/client'

import { IgdDaftarPage } from './IgdDaftarPage'
import { IgdDisposisiPage } from './IgdDisposisiPage'
import { getIgdActionErrorMessage } from './igd.feedback'
import { IGD_PAGE_PATHS } from './igd.config'
import { EMPTY_IGD_DASHBOARD } from './igd.data'
import {
  buildIgdDailyReportExportFileName,
  buildIgdDailyReportExportGroups,
  buildIgdDailyReportExportTitle
} from './igd.report'
import { IgdReferralDispositionContent } from './IgdReferralDispositionModal'

export default function IgdDaftarRoute() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const dashboardQuery = client.igd.dashboard.useQuery({})
  const dailyReportQuery = client.igd.dailyReport.useQuery({ date: dayjs().format('YYYY-MM-DD') })
  const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(undefined)
  const [replacePatientModalVisible, setReplacePatientModalVisible] = useState(false)
  const [selectedDispositionEncounterId, setSelectedDispositionEncounterId] = useState<
    string | null
  >(null)
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
    setSelectedDispositionEncounterId(null)
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
  }

  if (selectedDispositionEncounterId && selectedPatient) {
    return (
      <IgdDisposisiPage
        patient={selectedPatient}
        isSubmitting={dischargeEncounterMutation.isPending}
        onBack={resetDispositionState}
        onConfirm={async ({ dischargeDisposition, note }) => {
          try {
            await dischargeEncounterMutation.mutateAsync({
              encounterId: selectedDispositionEncounterId,
              dischargeDisposition,
              dischargeNote: note || undefined
            })
            resetDispositionState()
            message.success('Disposition IGD berhasil diproses')
          } catch (error) {
            message.error(getIgdActionErrorMessage(error, 'Gagal memproses disposition IGD'))
          }
        }}
        renderReferralForm={() => (
          <IgdReferralDispositionContent
            encounterId={selectedDispositionEncounterId}
            patient={selectedPatient}
            onReferralCreated={async () => {
              try {
                await dischargeEncounterMutation.mutateAsync({
                  encounterId: selectedDispositionEncounterId,
                  dischargeDisposition: 'REFERRED'
                })
                resetDispositionState()
                message.success('Rujukan IGD berhasil dibuat dan disposition diproses')
              } catch (error) {
                resetDispositionState()
                message.error(getIgdActionErrorMessage(error, 'Gagal memproses disposition IGD'))
              }
            }}
          />
        )}
      />
    )
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
        onOpenTriase={() => navigate(IGD_PAGE_PATHS.triase)}
        onOpenBedMap={() => navigate(IGD_PAGE_PATHS.bedMap)}
        onOpenReplacePatient={() => {
          setSelectedReplacementPatient(undefined)
          setReplacePatientModalVisible(true)
        }}
        onOpenDisposition={(patient) => {
          openDisposition(patient.encounterId, patient.id)
        }}
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
        destroyOnHidden
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
    </>
  )
}
