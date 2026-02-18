import { Link, Route, Routes, useLocation } from 'react-router'

import AppLayout from './components/templates/AppLayout'
import Dashboard from './pages/Dashboard'
import DashboardHome from './pages/DashboardHome'
import LaboratoryPage from './pages/Laboratory'
import CollectSpecimenPage from './pages/Laboratory/CollectSpecimenPage'
import { LabReportPage } from './pages/Laboratory/LabReport'
import LabReportDetailPage from './pages/Laboratory/LabReportDetailPage'
import LabResultPage from './pages/Laboratory/LabResultPage'
import LabSpecimenPage from './pages/Laboratory/LabSpecimenPage'
import { ListDiagnosticReport } from './pages/Laboratory/ListDiagnosticReport'
import RecordResultPage from './pages/Laboratory/RecordResultPage'
import LaboratoryQueue from './pages/laboratory-management/queue'
import LaboratoryReports from './pages/laboratory-management/reports'
import LaboratoryRequests from './pages/laboratory-management/requests'
import LaboratorySpecimenRequest from './pages/laboratory-management/requests/specimen'
import LaboratoryResults from './pages/laboratory-management/results'
import LaboratoryResultEntry from './pages/laboratory-management/results/entry'
import PermintaanLab from './pages/PermintaanLab'
import Diagnostic from './pages/diagnostic/diagnostic'
import DiagnosticForm from './pages/diagnostic/diagnostic-form'
import ItemPurchasePage from './pages/item-purchase/item-purchase'
import DiagnosticTable from './pages/diagnostic/diagnostic-table'
import DoctorScheduleForm from './pages/doctor-schedule/doctor-schedule-form'
import DoctorScheduleTable from './pages/doctor-schedule/doctor-schedule-table'
import ReferralRequestPage from './pages/encounter-transition/ReferralRequestPage'
import EncounterTransitionPage from './pages/encounter-transition/encounter-transition'
import Encounter from './pages/encounter/Encounter'
import EncounterForm from './pages/encounter/encounter-form'
import EncounterTable from './pages/encounter/encounter-table'
import EncounterMonitor from './pages/encounter/monitor/encounter-monitor'
import Expense from './pages/expense/Expense'
import { default as ExpenseForm, default as IncomeForm } from './pages/expense/expense-form'
import ExpenseTable from './pages/expense/expense-table'
import HomePage from './pages/home'
import Income from './pages/income/income'
import IncomeTable from './pages/income/income-table'
import Jaminan from './pages/jaminan/Jaminan'
import JaminanForm from './pages/jaminan/jaminan-form'
import JaminanTable from './pages/jaminan/jaminan-table'
import MedicalStaffSchedule from './pages/medical-staff-schedule/MedicalStaffSchedule'
import MedicalStaffScheduleForm from './pages/medical-staff-schedule/medical-staff-schedule-form'
import MedicalStaffScheduleTable from './pages/medical-staff-schedule/medical-staff-schedule-table'
import Patient from './pages/patient/Patient'
import PatientForm from './pages/patient/patient-form'
import PatientTable from './pages/patient/patient-table'
import Pegawai from './pages/pegawai/Pegawai'
import PegawaiForm from './pages/pegawai/pegawai-form'
import PegawaiReport from './pages/pegawai/pegawai-report'
import PegawaiTable from './pages/pegawai/pegawai-table'
import Pendaftaran from './pages/pendaftaran'
import ItemForm from './pages/item/item-form'
import ItemTable from './pages/item/item-table'
import Pharmacy from './pages/pharmacy/Pharmacy'
import ReportPage from './pages/pharmacy/ReportPage'
import MedicationDispenseFromRequest from './pages/medication-dispense/medication-dispense-from-request'
import MedicationDispenseReport from './pages/medication-dispense/medication-dispense-report'
import MedicationDispenseTable from './pages/medication-dispense/medication-dispense-table'
import MedicationRequestForm from './pages/medication-request/medication-request-form'
import MedicationRequestTable from './pages/medication-request/medication-request-table'
import MedicineCategoryForm from './pages/item-category/medicine-category-form'
import MedicineCategoryTable from './pages/item-category/medicine-category-table'
import PharmacyDashboard from './pages/pharmacy/pharmacy-dashboard'
import QueueList from './pages/queue/queue-list'
import ServiceRequest from './pages/service-request/ServiceRequest'
import ServiceRequestForm from './pages/service-request/service-request-form'
import ServiceRequestTable from './pages/service-request/service-request-table'
import PemeriksaanUtamaEditPage from './pages/services/pemeriksaan-utama/edit'
import PemeriksaanUtamaPage from './pages/services/pemeriksaan-utama/page'
import Services from './pages/services/services'
import TriagePage from './pages/triage'
import RegistrationPage from './pages/visit-management/registration-page'
import RegistrationQueue from './pages/visit-management/registration-queue'
import ActiveEncountersPage from './pages/visit-management/active-encounters-page'
import InitialTriage from './pages/visit-management/initial-triage'
import DoctorLeave from './pages/doctor-leave/DoctorLeave'
import DoctorLeaveTable from './pages/doctor-leave/doctor-leave-table'
import DoctorLeaveForm from './pages/doctor-leave/doctor-leave-form'
import NurseCalling from './pages/nurse-calling/NurseCalling'
import PatientQueueTable from './pages/nurse-calling/patient-queue-table'
import MedicalRecordForm from './pages/nurse-calling/medical-record-form'
import DoctorEMR from './pages/doctor-emr/doctor-emr'
import PatientList from './pages/doctor-emr/doctor-patient-list'
import DoctorWorkspace from './pages/doctor-emr/doctor-workspace'

function MainRoute() {
  const location = useLocation()
  return (
    <Routes location={location} key={location.pathname.split('/')[1]}>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard/*" element={<Dashboard />}>
          <Route index element={<DashboardHome />} />
          <Route path="expense" element={<Expense />}>
            <Route index element={<ExpenseTable />} />
            <Route path="create" element={<ExpenseForm />} />
          </Route>
          <Route path="registration">
            <Route index element={<RegistrationPage />} />
            <Route path="queue" element={<RegistrationQueue />} />
            <Route path="triage" element={<InitialTriage />} />
            <Route path="active-encounters" element={<ActiveEncountersPage />} />
          </Route>
          <Route path="patient" element={<Patient />}>
            <Route index element={<PatientTable />} />
            <Route path="register" element={<PatientForm />} />
            <Route path="edit/:id" element={<PatientForm />} />
          </Route>
          <Route path="pendaftaran" element={<Pendaftaran />}>
            <Route index element={<div>Daftar</div>} />
          </Route>
          <Route path="encounter" element={<Encounter />}>
            <Route index element={<EncounterTable />} />
            <Route path="create" element={<EncounterForm />} />
            <Route path="edit/:id" element={<EncounterForm />} />
            <Route path="edit/:id" element={<EncounterForm />} />
            <Route path="transition" element={<EncounterTransitionPage />} />
            <Route path="referral-request/:id" element={<ReferralRequestPage />} />
            <Route path="triage" element={<TriagePage />} />
          </Route>
          <Route path="service-request" element={<ServiceRequest />}>
            <Route index element={<ServiceRequestTable />} />
            <Route path="create" element={<ServiceRequestForm />} />
            <Route path="edit/:id" element={<ServiceRequestForm />} />
          </Route>
          <Route path="queue" element={<Encounter />}>
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
          <Route path="income" element={<Income />}>
            <Route index element={<IncomeTable />} />
            <Route path="create" element={<IncomeForm />} />
          </Route>
          <Route path="registration/jaminan" element={<Jaminan />}>
            <Route index element={<JaminanTable />} />
            <Route path="create" element={<JaminanForm />} />
            <Route path="edit/:id" element={<JaminanForm />} />
          </Route>
          <Route path="registration/medical-staff-schedule" element={<MedicalStaffSchedule />}>
            <Route index element={<MedicalStaffScheduleTable />} />
            <Route path="create" element={<MedicalStaffScheduleForm />} />
            <Route path="edit/:id" element={<MedicalStaffScheduleForm />} />
          </Route>
          <Route path="pegawai" element={<Pegawai />}>
            <Route index element={<PegawaiTable />} />
            <Route path="create" element={<PegawaiForm />} />
            <Route path="edit/:id" element={<PegawaiForm />} />
          </Route>
          <Route path="pegawai-report" element={<PegawaiReport />} />
          <Route path="registration/doctor-schedule" element={<DoctorScheduleTable />} />
          <Route path="registration/doctor-schedule/create" element={<DoctorScheduleForm />} />
          <Route path="registration/doctor-schedule/edit/:id" element={<DoctorScheduleForm />} />
          <Route path="registration/doctor-leave" element={<DoctorLeave />}>
            <Route index element={<DoctorLeaveTable />} />
            <Route path="create" element={<DoctorLeaveForm />} />
            <Route path="edit/:id" element={<DoctorLeaveForm />} />
          </Route>
          <Route path="diagnostic" element={<Diagnostic />}>
            <Route index element={<DiagnosticTable />} />
            <Route path="create" element={<DiagnosticForm />} />
            <Route path="edit/:id" element={<DiagnosticForm />} />
          </Route>
          <Route path="services" element={<Services />}>
            <Route index element={<PemeriksaanUtamaPage />} />
            <Route path="pemeriksaan-utama" element={<PemeriksaanUtamaPage />} />
            <Route path="pemeriksaan-utama/edit" element={<PemeriksaanUtamaEditPage />} />
          </Route>
          <Route path="medicine" element={<Pharmacy />}>
            <Route index element={<PharmacyDashboard />} />
            <Route path="report" element={<ReportPage />} />
            <Route path="medicine-categories" element={<MedicineCategoryTable />} />
            <Route path="medicine-categories/create" element={<MedicineCategoryForm />} />
            <Route path="medicine-categories/edit/:id" element={<MedicineCategoryForm />} />
            <Route path="medication-requests" element={<MedicationRequestTable />} />
            <Route path="medication-requests/create" element={<MedicationRequestForm />} />
            <Route path="medication-requests/edit/:id" element={<MedicationRequestForm />} />
            <Route path="items" element={<ItemTable />} />
            <Route path="items/create" element={<ItemForm />} />
            <Route path="items/edit/:id" element={<ItemForm />} />
            <Route
              path="medication-requests/dispense/:id"
              element={<MedicationDispenseFromRequest />}
            />
            <Route path="medication-dispenses" element={<MedicationDispenseTable />} />
            <Route path="medication-dispenses/report" element={<MedicationDispenseReport />} />
            <Route path="item-purchase" element={<ItemPurchasePage />} />
          </Route>
            
          <Route path="nurse-calling" element={<NurseCalling />}>
            <Route index element={<PatientQueueTable />} />
            <Route path="medical-record/:encounterId" element={<MedicalRecordForm />} />
          </Route>
          <Route path="doctor" element={<DoctorEMR />}>
            <Route index element={<PatientList />} />
            <Route path=":encounterId" element={<DoctorWorkspace />} />
          </Route>
          <Route path="services" element={<Services />}>
            <Route index element={<PemeriksaanUtamaPage />} />
            <Route path="pemeriksaan-utama" element={<PemeriksaanUtamaPage />} />
            <Route path="pemeriksaan-utama/edit" element={<PemeriksaanUtamaEditPage />} />
          </Route>
          <Route path="pharmacy" element={<Pharmacy />}>
            <Route path="medicine-categories" element={<MedicineCategoryTable />} />
            <Route path="medicine-categories/create" element={<MedicineCategoryForm />} />
            <Route path="medicine-categories/edit/:id" element={<MedicineCategoryForm />} />
          </Route>
          <Route path="laboratory">
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
          <Route path="laboratory-management">
            <Route index element={<LaboratoryQueue />} />
            <Route path="queue" element={<LaboratoryQueue />} />
            <Route path="requests" element={<LaboratoryRequests />} />
            <Route path="requests/specimen" element={<LaboratorySpecimenRequest />} />
            <Route path="results" element={<LaboratoryResults />} />
            <Route path="results/entry" element={<LaboratoryResultEntry />} />
            <Route path="reports" element={<LaboratoryReports />} />
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
