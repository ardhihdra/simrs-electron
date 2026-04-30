import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router'
import { ModuleScopeGuard } from './services/ModuleScope/guard'
import type { PageAccessEntry } from './services/ModuleScope/type'
import { client } from './utils/client'
import { getDefaultHomePath } from './app-shell'

import { Button, Result } from 'antd'
import AppLayout from './components/templates/AppLayout'
import Dashboard from './pages/Dashboard'
import DesignSystemPage from './pages/design-system'
import IframeView from './pages/IframeView'
import LaboratoryPage from './pages/Laboratory'
import CollectSpecimenPage from './pages/Laboratory/CollectSpecimenPage'
import { LabReportPage } from './pages/Laboratory/LabReport'
import LabReportDetailPage from './pages/Laboratory/LabReportDetailPage'
import LabResultPage from './pages/Laboratory/LabResultPage'
import LabSpecimenPage from './pages/Laboratory/LabSpecimenPage'
import { ListDiagnosticReport } from './pages/Laboratory/ListDiagnosticReport'
import RecordResultPage from './pages/Laboratory/RecordResultPage'
import PermintaanLab from './pages/PermintaanLab'
import DashboardHome from './pages/dashboard/DashboardHome'
import Diagnostic from './pages/diagnostic/diagnostic'
import DiagnosticForm from './pages/diagnostic/diagnostic-form'
import DiagnosticTable from './pages/diagnostic/diagnostic-table'
import DoctorEMR from './pages/doctor-emr/doctor-emr'
import { DoctorPatientList } from './pages/doctor-emr/doctor-patient-list'
import DoctorWorkspace from './pages/doctor-emr/doctor-workspace'
import OKSubmissionPage from './pages/ok/ok-submission-page'
import OKDashboardPage from './pages/ok/ok-dashboard-page'
import DoctorLeave from './pages/doctor-leave/DoctorLeave'
import DoctorLeaveForm from './pages/doctor-leave/doctor-leave-form'
import DoctorLeaveTable from './pages/doctor-leave/doctor-leave-table'
import DoctorSchedule from './pages/doctor-schedule/DoctorSchedule'
import { DoctorScheduleEditorShell } from './pages/doctor-schedule/components/editor/DoctorScheduleEditorShell'
import { DoctorScheduleLegacyEditRedirect } from './pages/doctor-schedule/components/editor/DoctorScheduleLegacyEditRedirect'
import DoctorScheduleCreatePage from './pages/doctor-schedule/create/page'
import DoctorScheduleExceptionsPage from './pages/doctor-schedule/exceptions/page'
import DoctorScheduleInfoPage from './pages/doctor-schedule/info/page'
import DoctorSchedulePage from './pages/doctor-schedule/page'
import DoctorScheduleQuotasPage from './pages/doctor-schedule/quotas/page'
import DoctorScheduleSessionsPage from './pages/doctor-schedule/sessions/page'
import ReferralRequestPage from './pages/encounter-transition/referral-request'
import EncounterTransitionPage from './pages/encounter-transition/transition'
import Encounter from './pages/encounter/Encounter'
import EncounterForm from './pages/encounter/encounter-form'
import EncounterTable from './pages/encounter/encounter-table'
import DoctorQueueMonitor from './pages/encounter/monitor/doctor-queue-monitor'
import EncounterMonitor from './pages/encounter/monitor/encounter-monitor'
import Expense from './pages/expense/Expense'
import { default as ExpenseForm, default as IncomeForm } from './pages/expense/expense-form'
import ExpenseTable from './pages/expense/expense-table'
import HomePage from './pages/home'
import IgdBedMapRoute from './pages/igd/IgdBedMapRoute'
import IgdDaftarRoute from './pages/igd/IgdDaftarRoute'
import { IGD_PAGE_PATHS } from './pages/igd/igd.config'
import IgdRegistrasiRoute from './pages/igd/IgdRegistrasiRoute'
import IgdTriaseRoute from './pages/igd/IgdTriasePage'
import Income from './pages/income/income'
import IncomeTable from './pages/income/income-table'
import MedicineCategoryForm from './pages/item-category/medicine-category-form'
import MedicineCategoryTable from './pages/item-category/medicine-category-table'
import ItemPurchasePage from './pages/item-purchase/item-purchase'
import ItemForm from './pages/item/item-form'
import ItemTable from './pages/item/item-table'
import Jaminan from './pages/jaminan/Jaminan'
import JaminanForm from './pages/jaminan/jaminan-form'
import JaminanTable from './pages/jaminan/jaminan-table'
import KasirPage from './pages/kasir/KasirPage'
import InvoiceDetailPage from './pages/kasir/invoice-detail'
import KasirEncounterTable from './pages/kasir/kasir-encounter-table'
import PaymentPage from './pages/kasir/payment-page'
import KfaCodeForm from './pages/kfa-code/kfa-code-form'
import KfaCodeTable from './pages/kfa-code/kfa-code-table'
import LaboratoryQueue from './pages/laboratory-management/queue'
import LaboratoryReports from './pages/laboratory-management/reports'
import LaboratoryRequests from './pages/laboratory-management/requests'
import LaboratorySpecimenRequest from './pages/laboratory-management/requests-specimen'
import LaboratoryResults from './pages/laboratory-management/results'
import LaboratoryResultEntry from './pages/laboratory-management/results-entry'
import MedicalStaffSchedule from './pages/medical-staff-schedule/MedicalStaffSchedule'
import MedicalStaffScheduleForm from './pages/medical-staff-schedule/medical-staff-schedule-form'
import MedicalStaffScheduleTable from './pages/medical-staff-schedule/medical-staff-schedule-table'
import MedicationDispenseReport from './pages/medication-dispense/component/medication-dispense-report'
import MedicationDispenseFromRequest from './pages/medication-dispense/medication-dispense-from-request'
import MedicationDispenseTable from './pages/medication-dispense/medication-dispense-table'
import MedicationRequestForm from './pages/medication-request/medication-request-form'
import MedicationRequestTable from './pages/medication-request/medication-request-table'
import ModuleSelection from './pages/module-selection/page'
import NonMedicQueuePage from './pages/non-medic-queue'
import NonMedicQueueBillingKioskPage from './pages/non-medic-queue/kiosk/billing'
import NonMedicQueueCashierKioskPage from './pages/non-medic-queue/kiosk/cashier'
import NonMedicQueuePharmacyKioskPage from './pages/non-medic-queue/kiosk/pharmacy'
import NonMedicQueueRegistrationKioskPage from './pages/non-medic-queue/kiosk/registration'
import NonMedicQueueRegistrationInsuranceKioskPage from './pages/non-medic-queue/kiosk/registration-insurance'
import NonMedicQueueServicePointWorkspacePage from './pages/non-medic-queue/service-point-workspace'
import NonMedicQueueServicePointPage from './pages/non-medic-queue/service-points'
import NurseCalling from './pages/nurse-calling/NurseCalling'
import MedicalRecordForm from './pages/nurse-calling/medical-record-form'
import PatientQueueTable from './pages/nurse-calling/patient-queue-table'
import AntrianVerifikasiPage from './pages/ok/antrian-dan-verifikasi-ok/AntrianVerifikasiPage'
import DetailVerifikasiPage from './pages/ok/antrian-dan-verifikasi-ok/DetailVerifikasiPage'
import Patient from './pages/patient/Patient'
import PatientForm from './pages/patient/patient-form'
import PatientTable from './pages/patient/patient-table'
import Pegawai from './pages/pegawai/Pegawai'
import PegawaiForm from './pages/pegawai/pegawai-form'
import PegawaiReport from './pages/pegawai/pegawai-report'
import PegawaiTable from './pages/pegawai/pegawai-table'
import Pharmacy from './pages/pharmacy/Pharmacy'
import ReportPage from './pages/pharmacy/ReportPage'
import PharmacyDashboard from './pages/pharmacy/pharmacy-dashboard'
import PoliSelect from './pages/poli/PoliSelect'
import QueueList from './pages/queue/queue-list'
import RawatInapBedMapRoute from './pages/rawat-inap/RawatInapBedMapRoute'
import RawatInapAdmisiRoute from './pages/rawat-inap/RawatInapAdmisiRoute'
import RawatInapCheckinRoute from './pages/rawat-inap/RawatInapCheckinRoute'
import RawatInapBorLosToiRoute from './pages/rawat-inap/RawatInapBorLosToiRoute'
import RawatInapPasienRoute from './pages/rawat-inap/RawatInapPasienRoute'
import RawatInapTransferRoute from './pages/rawat-inap/RawatInapTransferRoute'
import {
  RAWAT_INAP_PAGE_PATHS,
  REGISTRATION_RAWAT_INAP_PAGE_PATHS
} from './pages/rawat-inap/rawat-inap.config'
import ServiceRequest from './pages/service-request/ServiceRequest'
import ServiceRequestForm from './pages/service-request/service-request-form'
import ServiceRequestTable from './pages/service-request/service-request-table'
import PemeriksaanUtamaEditPage from './pages/services/pemeriksaan-utama/edit'
import PemeriksaanUtamaPage from './pages/services/pemeriksaan-utama/page'
import Services from './pages/services/services'
import TriagePage from './pages/triage'
import ActiveEncountersPage from './pages/visit-management/active-encounters'
import BillingPage from './pages/billing/BillingPage'
import BillingAllocationPage from './pages/billing/billing-allocation'
import InitialTriage from './pages/visit-management/initial-triage'
import KioskaPage from './pages/visit-management/kioska'
import KioskaGlobalPage from './pages/visit-management/kioska/kiosk-global'
import KioskaSetupPage from './pages/visit-management/kioska/setup'
import RegistrationPage from './pages/visit-management/registration'
import RegistrationGlobalQueue from './pages/visit-management/registration-global-queue'
import RegistrationQueue from './pages/visit-management/registration-queue'
import RegistrationSelect from './pages/visit-management/registration-select'
import UpcomingQueuePage from './pages/visit-management/upcoming-queue'
import LaporanKunjunganPage from './pages/visit-management/laporan-kunjungan'

const NoAccessFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <Result
      status="403"
      title="Akses Ditolak"
      subTitle="Anda tidak memiliki izin untuk mengakses halaman ini atau anda ada di Lokasi yang tidak sesuai. Hubungi administrator jika Anda merasa ini adalah kesalahan."
      extra={
        <Button type="primary" onClick={() => window.history.back()}>
          Kembali
        </Button>
      }
    />
  </div>
)

const withModuleGuard = (access: PageAccessEntry | undefined, element: ReactNode) => (
  <ModuleScopeGuard access={access} fallback={<NoAccessFallback />}>
    {element}
  </ModuleScopeGuard>
)

function MainRoute() {
  const location = useLocation()
  const { data: pageAccessData } = client.pageAccess.list.useQuery(
    {},
    { queryKey: ['pageAccess', {}] }
  )
  const pageAccessMap = useMemo(() => {
    const map: Record<string, PageAccessEntry> = {}
    for (const item of pageAccessData?.result ?? []) {
      map[item.page_path] = {
        allowedModules: (item.allowedModules as string[] | undefined) ?? [],
        roles: (item.roles as string[] | undefined) ?? [],
        allowedLokasiKerjaIds: (item.allowedLokasiKerjaIds as number[] | undefined) ?? []
      }
    }
    return map
  }, [pageAccessData])

  const g = (path: string, element: ReactNode) => withModuleGuard(pageAccessMap[path], element)

  return (
    <Routes location={location} key={location.pathname.split('/')[1]}>
      <Route path="/design-system" element={<DesignSystemPage />} />
      <Route path="/iframe-view" element={<IframeView />} />
      <Route path="/monitor/doctor/:practitionerId" element={<DoctorQueueMonitor />} />
      <Route path="/kioska/setup" element={<KioskaSetupPage />} />
      <Route path="/kioska/global" element={<KioskaGlobalPage />} />
      <Route path="/kioska/global/registration-insurance" element={<KioskaGlobalPage />} />
      <Route path="/kioska" element={<KioskaPage />} />
      <Route element={<AppLayout />}>
        <Route path={getDefaultHomePath()} element={<HomePage />} />
        <Route path="/module-selection" element={<ModuleSelection />} />
        <Route path="/dashboard/*" element={<Dashboard />}>
          <Route index element={<DashboardHome />} />
          <Route path="expense" element={g('/dashboard/expense', <Expense />)}>
            <Route index element={<ExpenseTable />} />
            <Route path="create" element={<ExpenseForm />} />
          </Route>
          <Route path="registration" element={g('/dashboard/registration', <Outlet />)}>
            <Route path="manage" element={<RegistrationPage />} />
            <Route path="select" element={<RegistrationSelect />} />
            <Route path="select/:practitionerId" element={<RegistrationQueue />} />
            <Route path="upcoming-queue" element={<UpcomingQueuePage />} />
            <Route
              path="global-queue"
              element={g('/dashboard/registration/global-queue', <RegistrationGlobalQueue />)}
            />
            <Route
              path="non-medic-queue"
              element={g(
                '/dashboard/registration/non-medic-queue',
                <NonMedicQueuePage
                  title="Antrian Pendaftaran"
                  description="Kelola pengambilan nomor dan operasional antrean non-medis untuk counter pendaftaran."
                  serviceTypeCode="REGISTRASI"
                />
              )}
            />
            <Route
              path="non-medic-queue/registration-insurance"
              element={g(
                '/dashboard/registration/non-medic-queue/registration-insurance',
                <NonMedicQueuePage
                  title="Antrian Pendaftaran Asuransi"
                  description="Kelola pengambilan nomor dan operasional antrean non-medis untuk counter pendaftaran asuransi."
                  serviceTypeCode="REGISTRASI_ASURANSI"
                />
              )}
            />
            <Route path="kioska" element={<Navigate to="/kioska" replace />} />
            <Route path="triage" element={<InitialTriage />} />
            <Route path="active-encounters" element={<ActiveEncountersPage />} />
            <Route path="laporan-kunjungan" element={<LaporanKunjunganPage />} />
            <Route
              path="rawat-inap/admisi"
              element={g(REGISTRATION_RAWAT_INAP_PAGE_PATHS.admisi, <RawatInapAdmisiRoute />)}
            />
            <Route
              path="rawat-inap/checkin"
              element={g(REGISTRATION_RAWAT_INAP_PAGE_PATHS.checkin, <RawatInapCheckinRoute />)}
            />
            <Route
              path="rawat-inap/pasien"
              element={g(REGISTRATION_RAWAT_INAP_PAGE_PATHS.pasien, <RawatInapPasienRoute />)}
            />
          </Route>
          <Route path="patient" element={g('/dashboard/patient', <Patient />)}>
            <Route index element={<PatientTable />} />
            <Route path="register" element={<PatientForm />} />
            <Route path="edit/:id" element={<PatientForm />} />
          </Route>
          <Route path="encounter" element={g('/dashboard/encounter', <Encounter />)}>
            <Route index element={<EncounterTable />} />
            <Route path="create" element={<EncounterForm />} />
            <Route path="edit/:id" element={<EncounterForm />} />
            <Route path="transition" element={<EncounterTransitionPage />} />
            <Route path="referral-request/:id" element={<ReferralRequestPage />} />
            <Route path="triage" element={<TriagePage />} />
          </Route>
          <Route
            path="service-request"
            element={g('/dashboard/service-request', <ServiceRequest />)}
          >
            <Route index element={<ServiceRequestTable />} />
            <Route path="create" element={<ServiceRequestForm />} />
            <Route path="edit/:id" element={<ServiceRequestForm />} />
          </Route>
          <Route path="queue" element={g('/dashboard/queue', <Encounter />)}>
            <Route index element={<EncounterMonitor />} />
            <Route path="monitor" element={<EncounterMonitor />} />
            <Route
              path="registration"
              element={<QueueList title="Antrian Pendaftaran" serviceType="registration" />}
            />
            <Route path="poli" element={<QueueList title="Antrian Poli" serviceType="poli" />} />
            <Route
              path="laboratory"
              element={<QueueList title="Antrian Laboratorium" serviceType="LAB" />}
            />
          </Route>
          <Route path="income" element={g('/dashboard/income', <Income />)}>
            <Route index element={<IncomeTable />} />
            <Route path="create" element={<IncomeForm />} />
          </Route>
          <Route
            path="registration/jaminan"
            element={g('/dashboard/registration/jaminan', <Jaminan />)}
          >
            <Route index element={<JaminanTable />} />
            <Route path="create" element={<JaminanForm />} />
            <Route path="edit/:id" element={<JaminanForm />} />
          </Route>
          <Route
            path="registration/medical-staff-schedule"
            element={g('/dashboard/registration/medical-staff-schedule', <MedicalStaffSchedule />)}
          >
            <Route index element={<MedicalStaffScheduleTable />} />
            <Route path="create" element={<MedicalStaffScheduleForm />} />
            <Route path="edit/:id" element={<MedicalStaffScheduleForm />} />
          </Route>
          <Route path="pegawai" element={g('/dashboard/pegawai', <Pegawai />)}>
            <Route index element={<PegawaiTable />} />
            <Route path="create" element={<PegawaiForm />} />
            <Route path="edit/:id" element={<PegawaiForm />} />
          </Route>
          <Route
            path="pegawai-report"
            element={g('/dashboard/pegawai-report', <PegawaiReport />)}
          />
          <Route
            path="registration/doctor-schedule"
            element={g('/dashboard/registration/doctor-schedule', <DoctorSchedule />)}
          >
            <Route index element={<DoctorSchedulePage />} />
            <Route path="create" element={<DoctorScheduleCreatePage />} />
            <Route path="edit/:id" element={<DoctorScheduleLegacyEditRedirect />} />
            <Route path=":id" element={<DoctorScheduleEditorShell />}>
              <Route index element={<Navigate to="info" replace />} />
              <Route path="info" element={<DoctorScheduleInfoPage />} />
              <Route path="sessions" element={<DoctorScheduleSessionsPage />} />
              <Route path="quotas" element={<DoctorScheduleQuotasPage />} />
              <Route path="exceptions" element={<DoctorScheduleExceptionsPage />} />
            </Route>
          </Route>
          <Route
            path="registration/doctor-leave"
            element={g('/dashboard/registration/doctor-leave', <DoctorLeave />)}
          >
            <Route index element={<DoctorLeaveTable />} />
            <Route path="create" element={<DoctorLeaveForm />} />
            <Route path="edit/:id" element={<DoctorLeaveForm />} />
          </Route>
          <Route path="diagnostic" element={g('/dashboard/diagnostic', <Diagnostic />)}>
            <Route index element={<DiagnosticTable />} />
            <Route path="create" element={<DiagnosticForm />} />
            <Route path="edit/:id" element={<DiagnosticForm />} />
          </Route>
          <Route path="poli" element={<Outlet />}>
            <Route index element={<PoliSelect />} />
            <Route path=":poliCode" element={g('/dashboard/nurse-calling', <NurseCalling />)}>
              <Route index element={<PatientQueueTable />} />
            </Route>
          </Route>
          <Route path="medicine" element={g('/dashboard/medicine', <Pharmacy />)}>
            <Route index element={<PharmacyDashboard />} />
            <Route path="report" element={<ReportPage />} />
            <Route path="medicine-categories" element={<MedicineCategoryTable />} />
            <Route path="medicine-categories/create" element={<MedicineCategoryForm />} />
            <Route path="medicine-categories/edit/:id" element={<MedicineCategoryForm />} />
            <Route path="kfa-codes" element={<KfaCodeTable />} />
            <Route path="kfa-codes/create" element={<KfaCodeForm />} />
            <Route path="kfa-codes/edit/:id" element={<KfaCodeForm />} />
            <Route path="medication-requests" element={<MedicationRequestTable />} />
            <Route path="medication-requests/create" element={<MedicationRequestForm />} />
            <Route path="medication-requests/edit/:id" element={<MedicationRequestForm />} />
            <Route path="items" element={<ItemTable />} />
            <Route path="items-bpjs" element={<ItemTable />} />
            <Route path="items/create" element={<ItemForm />} />
            <Route path="items-bpjs/create" element={<ItemForm />} />
            <Route path="items/edit/:id" element={<ItemForm />} />
            <Route path="items-bpjs/edit/:id" element={<ItemForm />} />
            <Route
              path="medication-requests/dispense/:id"
              element={<MedicationDispenseFromRequest />}
            />
            <Route path="medication-dispenses" element={<MedicationDispenseTable />} />
            <Route path="medication-dispenses/report" element={<MedicationDispenseReport />} />
            <Route path="item-purchase" element={<ItemPurchasePage />} />
            <Route path="patient" element={<Patient />}>
              <Route index element={<PatientTable />} />
              <Route path="register" element={<PatientForm />} />
              <Route path="edit/:id" element={<PatientForm />} />
            </Route>
          </Route>
          <Route path="nurse-calling" element={g('/dashboard/nurse-calling', <NurseCalling />)}>
            <Route index element={<PatientQueueTable />} />
            <Route path="medical-record/:encounterId" element={<MedicalRecordForm />} />
          </Route>
          <Route path="doctor" element={g('/dashboard/doctor', <DoctorEMR />)}>
            <Route index element={<DoctorPatientList />} />
            <Route path=":encounterId" element={<DoctorWorkspace />} />
          </Route>
          <Route path="rawat-inap" element={g('/dashboard/rawat-inap', <Outlet />)}>
            <Route
              index
              element={g('/dashboard/rawat-inap', <Navigate to="bed-map" replace />)}
            />
            <Route
              path="bed-map"
              element={g(RAWAT_INAP_PAGE_PATHS.bedMap, <RawatInapBedMapRoute />)}
            />
            <Route
              path="admisi"
              element={g(RAWAT_INAP_PAGE_PATHS.admisi, <RawatInapAdmisiRoute />)}
            />
            <Route
              path="transfer"
              element={g(RAWAT_INAP_PAGE_PATHS.transfer, <RawatInapTransferRoute />)}
            />
            <Route
              path="checkin"
              element={g(RAWAT_INAP_PAGE_PATHS.checkin, <RawatInapCheckinRoute />)}
            />
            <Route
              path="pasien"
              element={g(RAWAT_INAP_PAGE_PATHS.pasien, <RawatInapPasienRoute />)}
            />
            <Route
              path="bor-los-toi"
              element={g(RAWAT_INAP_PAGE_PATHS.borLosToi, <RawatInapBorLosToiRoute />)}
            />
          </Route>
          <Route path="igd" element={g('/dashboard/igd', <Outlet />)}>
            <Route index element={g('/dashboard/igd', <Navigate to="daftar" replace />)} />
            <Route path="daftar" element={g(IGD_PAGE_PATHS.daftar, <IgdDaftarRoute />)} />
            <Route
              path="registrasi"
              element={g(IGD_PAGE_PATHS.registrasi, <IgdRegistrasiRoute />)}
            />
            <Route path="triase" element={g(IGD_PAGE_PATHS.triase, <IgdTriaseRoute />)} />
            <Route path="bed-map" element={g(IGD_PAGE_PATHS.bedMap, <IgdBedMapRoute />)} />
          </Route>
          <Route path="ok" element={g('/dashboard/ok', <Outlet />)}>
            <Route index element={g('/dashboard/ok', <Navigate to="dashboard" replace />)} />
            <Route path="dashboard" element={g('/dashboard/ok/dashboard', <OKDashboardPage />)} />
            <Route path="pengajuan" element={g('/dashboard/ok/pengajuan', <OKSubmissionPage />)} />
            <Route
              path="verifikasi"
              element={g('/dashboard/ok/verifikasi', <AntrianVerifikasiPage />)}
            />
            <Route
              path="verifikasi/:id"
              element={g('/dashboard/ok/verifikasi', <DetailVerifikasiPage />)}
            />
          </Route>
          <Route path="services" element={g('/dashboard/services', <Services />)}>
            <Route index element={<PemeriksaanUtamaPage />} />
            <Route path="pemeriksaan-utama" element={<PemeriksaanUtamaPage />} />
            <Route path="pemeriksaan-utama/edit" element={<PemeriksaanUtamaEditPage />} />
          </Route>
          <Route path="pharmacy" element={g('/dashboard/pharmacy', <Pharmacy />)}>
            <Route path="medicine-categories" element={<MedicineCategoryTable />} />
            <Route path="medicine-categories/create" element={<MedicineCategoryForm />} />
            <Route path="medicine-categories/edit/:id" element={<MedicineCategoryForm />} />
          </Route>
          <Route path="laboratory" element={g('/dashboard/laboratory', <Outlet />)}>
            <Route index element={<LaboratoryPage />} />
            <Route path="list" element={<LaboratoryPage />} />
            <Route path="permintaan" element={<PermintaanLab />} />
            <Route path="result" element={<LabResultPage />} />
            <Route path="result/:id" element={<RecordResultPage />} />
            <Route path="specimen" element={<LabSpecimenPage />} />
            <Route path="specimen/:id" element={<CollectSpecimenPage />} />
            <Route path="report" element={<LabReportPage />} />
            <Route path="report/:id" element={<LabReportDetailPage />} />
            <Route path="diagnostic-report" element={<ListDiagnosticReport />} />
          </Route>
          <Route path="kasir" element={g('/dashboard/kasir', <KasirPage />)}>
            <Route index element={<KasirEncounterTable />} />
            <Route path="invoice/:encounterId" element={<InvoiceDetailPage />} />
            <Route path="invoice/:encounterId/bayar" element={<PaymentPage />} />
          </Route>
          <Route path="billing" element={g('/dashboard/billing', <Outlet />)}>
            <Route index element={<BillingPage />} />
            <Route path="allocate/*" element={<BillingAllocationPage />} />
          </Route>
          <Route path="non-medic-queue" element={<Outlet />}>
            <Route
              path="kiosk/billing"
              element={g(
                '/dashboard/non-medic-queue/kiosk/billing',
                <NonMedicQueueBillingKioskPage />
              )}
            />
            <Route
              path="kiosk/cashier"
              element={g(
                '/dashboard/non-medic-queue/kiosk/cashier',
                <NonMedicQueueCashierKioskPage />
              )}
            />
            <Route
              path="kiosk/pharmacy"
              element={g(
                '/dashboard/non-medic-queue/kiosk/pharmacy',
                <NonMedicQueuePharmacyKioskPage />
              )}
            />
            <Route
              path="kiosk/registration"
              element={g(
                '/dashboard/non-medic-queue/kiosk/registration',
                <NonMedicQueueRegistrationKioskPage />
              )}
            />
            <Route
              path="kiosk/registration-insurance"
              element={g(
                '/dashboard/non-medic-queue/kiosk/registration-insurance',
                <NonMedicQueueRegistrationInsuranceKioskPage />
              )}
            />
            <Route
              path="billing"
              element={g(
                '/dashboard/non-medic-queue/billing',
                <NonMedicQueuePage
                  title="Antrian Billing"
                  description="Kelola pemanggilan nomor untuk layanan billing non-medis."
                  serviceTypeCode="BILLING"
                />
              )}
            />
            <Route
              path="cashier"
              element={g(
                '/dashboard/non-medic-queue/cashier',
                <NonMedicQueuePage
                  title="Antrian Kasir"
                  description="Kelola pemanggilan nomor untuk layanan kasir non-medis."
                  serviceTypeCode="CASHIER"
                />
              )}
            />
            <Route
              path="pharmacy"
              element={g(
                '/dashboard/non-medic-queue/pharmacy',
                <NonMedicQueuePage
                  title="Antrian Farmasi"
                  description="Kelola alur panggil, layani, dan selesai untuk antrean farmasi."
                  serviceTypeCode="PHARMACY"
                />
              )}
            />
            <Route
              path="registration"
              element={g(
                '/dashboard/non-medic-queue/registration',
                <NonMedicQueuePage
                  title="Antrian Pendaftaran"
                  description="Kelola pengambilan nomor, pemanggilan, dan penyelesaian antrean non-medis untuk counter pendaftaran."
                  serviceTypeCode="REGISTRASI"
                />
              )}
            />
            <Route
              path="registration-insurance"
              element={g(
                '/dashboard/non-medic-queue/registration-insurance',
                <NonMedicQueuePage
                  title="Antrian Pendaftaran Asuransi"
                  description="Kelola pengambilan nomor, pemanggilan, dan penyelesaian antrean non-medis untuk counter pendaftaran asuransi."
                  serviceTypeCode="REGISTRASI_ASURANSI"
                />
              )}
            />
            <Route
              path="service-points"
              element={g(
                '/dashboard/non-medic-queue/service-points',
                <NonMedicQueueServicePointPage />
              )}
            />
            <Route
              path="workspace"
              element={g(
                '/dashboard/non-medic-queue/workspace',
                <NonMedicQueueServicePointWorkspacePage />
              )}
            />
            <Route
              path="service-points/:servicePointId/workspace"
              element={g(
                '/dashboard/non-medic-queue/service-points/:servicePointId/workspace',
                <NonMedicQueueServicePointWorkspacePage />
              )}
            />
          </Route>
          <Route
            path="laboratory-management"
            element={g('/dashboard/laboratory-management', <Outlet />)}
          >
            <Route
              index
              element={<LaboratoryQueue fixedCategory="LABORATORY" section="laboratory" />}
            />
            <Route
              path="queue"
              element={<LaboratoryQueue fixedCategory="LABORATORY" section="laboratory" />}
            />
            <Route
              path="requests"
              element={
                <LaboratoryRequests
                  fixedCategory="LABORATORY"
                  routeBase="/dashboard/laboratory-management"
                  section="laboratory"
                />
              }
            />
            <Route path="requests/specimen" element={<LaboratorySpecimenRequest />} />
            <Route
              path="results"
              element={<LaboratoryResults fixedCategory="LABORATORY" section="laboratory" />}
            />
            <Route path="results/entry" element={<LaboratoryResultEntry />} />
            <Route
              path="reports"
              element={<LaboratoryReports fixedCategory="LABORATORY" section="laboratory" />}
            />
          </Route>
          <Route
            path="radiology-management"
            element={g('/dashboard/radiology-management', <Outlet />)}
          >
            <Route
              index
              element={<LaboratoryQueue fixedCategory="RADIOLOGY" section="radiology" />}
            />
            <Route
              path="queue"
              element={<LaboratoryQueue fixedCategory="RADIOLOGY" section="radiology" />}
            />
            <Route
              path="requests"
              element={
                <LaboratoryRequests
                  fixedCategory="RADIOLOGY"
                  routeBase="/dashboard/radiology-management"
                  section="radiology"
                />
              }
            />
            <Route path="requests/specimen" element={<LaboratorySpecimenRequest />} />
            <Route
              path="results"
              element={<LaboratoryResults fixedCategory="RADIOLOGY" section="radiology" />}
            />
            <Route path="results/entry" element={<LaboratoryResultEntry />} />
            <Route
              path="reports"
              element={<LaboratoryReports fixedCategory="RADIOLOGY" section="radiology" />}
            />
          </Route>
        </Route>
        <Route
          path="*"
          element={
            <div>
              404: Page Not Found <Link to="/">Back to home</Link>
            </div>
          }
        />
      </Route>
    </Routes>
  )
}

export default MainRoute
