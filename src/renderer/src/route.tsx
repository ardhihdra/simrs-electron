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
          <Route path="queue" element={<Encounter />}>
            <Route index element={<EncounterMonitor />} />
            <Route path="monitor" element={<EncounterMonitor />} />
          </Route>
          <Route path="income" element={<Income />}>
            <Route index element={<IncomeTable />} />
            <Route path="create" element={<IncomeForm />} />
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
