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
          <Route path="income" element={<Income />}>
            <Route index element={<IncomeTable />} />
            <Route path="create" element={<IncomeForm />} />
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
