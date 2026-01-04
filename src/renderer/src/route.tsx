import { Link, Route, Routes, useLocation } from 'react-router'

import AppLayout from './components/AppLayout'
import HomePage from './pages/home'
import Dashboard from './pages/Dashboard'
import Expense from './pages/expense/Expense'
import Patient from './pages/patient/Patient'
import DashboardHome from './pages/DashboardHome'
import ExpenseTable from './pages/expense/expense-table'
import IncomeForm from './pages/expense/expense-form'
import Income from './pages/income/income'
import IncomeTable from './pages/income/income-table'
import ExpenseForm from './pages/expense/expense-form'
import PatientTable from './pages/patient/patient-table'
import PatientForm from './pages/patient/patient-form'
import Encounter from './pages/encounter/Encounter'
import EncounterTable from './pages/encounter/encounter-table'
import EncounterForm from './pages/encounter/encounter-form'
import ServiceRequest from './pages/service-request/ServiceRequest'
import ServiceRequestTable from './pages/service-request/service-request-table'
import ServiceRequestForm from './pages/service-request/service-request-form'
import Jaminan from './pages/jaminan/Jaminan'
import JaminanTable from './pages/jaminan/jaminan-table'
import JaminanForm from './pages/jaminan/jaminan-form'
import MedicalStaffSchedule from './pages/medical-staff-schedule/MedicalStaffSchedule'
import MedicalStaffScheduleTable from './pages/medical-staff-schedule/medical-staff-schedule-table'
import MedicalStaffScheduleForm from './pages/medical-staff-schedule/medical-staff-schedule-form'
import Pegawai from './pages/pegawai/Pegawai'
import PegawaiTable from './pages/pegawai/pegawai-table'
import PegawaiForm from './pages/pegawai/pegawai-form'
import PegawaiReport from './pages/pegawai/pegawai-report'
import DoctorScheduleTable from './pages/doctor-schedule/doctor-schedule-table'
import DoctorScheduleForm from './pages/doctor-schedule/doctor-schedule-form'
import EncounterMonitor from './pages/encounter/monitor/encounter-monitor'
import DiagnosticTable from './pages/diagnostic/diagnostic-table'
import Diagnostic from './pages/diagnostic/diagnostic'
import DiagnosticForm from './pages/diagnostic/diagnostic-form'
import Services from './pages/services/services'
import PemeriksaanUtamaTable from './pages/services/pemeriksaan-utama/table'
import PemeriksaanUtamaPage from './pages/services/pemeriksaan-utama/page'
import PemeriksaanUtamaEditPage from './pages/services/pemeriksaan-utama/edit'

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
          <Route path="patient" element={<Patient />}>
            <Route index element={<PatientTable />} />
            <Route path="register" element={<PatientForm />} />
            <Route path="edit/:id" element={<PatientForm />} />
          </Route>
          <Route path="encounter" element={<Encounter />}>
            <Route index element={<EncounterTable />} />
            <Route path="create" element={<EncounterForm />} />
            <Route path="edit/:id" element={<EncounterForm />} />
          </Route>
          <Route path="service-request" element={<ServiceRequest />}>
            <Route index element={<ServiceRequestTable />} />
            <Route path="create" element={<ServiceRequestForm />} />
            <Route path="edit/:id" element={<ServiceRequestForm />} />
          </Route>
          <Route path="queue" element={<Encounter />}>
            <Route index element={<EncounterMonitor />} />
            <Route path="monitor" element={<EncounterMonitor />} />
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
