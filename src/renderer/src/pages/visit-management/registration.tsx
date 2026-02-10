import { usePatientList } from '@renderer/hooks/query/use-patient'
import { PatientAttributes } from '@shared/patient'
import { Button } from 'antd'
import { useState } from 'react'
import { PatientSearch, PatientSearchFilter } from './components/PatientSearch'
import { PatientTable } from './components/PatientTable'
import RegistrationSheet from './components/RegistrationSheet'

export default function RegistrationPage() {
  const [filters, setFilters] = useState<PatientSearchFilter>({})
  const [selectedPatient, setSelectedPatient] = useState<PatientAttributes | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Use hook to fetch patients based on filters
  const { data, isLoading } = usePatientList(filters)

  const handleSearch = (newFilters: PatientSearchFilter) => {
    setFilters(newFilters)
  }

  const handleRegister = (patient: PatientAttributes) => {
    setSelectedPatient(patient)
    setIsSheetOpen(true)
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Pendaftaran Kunjungan</h1>
          <p className="text-gray-500">Cari pasien dan daftarkan kunjungan (Pre-Reserved)</p>
        </div>
        <Button size="large" onClick={() => setIsSheetOpen(true)}>
          Ambil Antrian (Tanpa Pasien)
        </Button>
      </div>

      <PatientSearch onSearch={handleSearch} loading={isLoading} />

      <PatientTable
        dataSource={Array.isArray(data?.data) ? data.data : []}
        loading={isLoading}
        onRegister={handleRegister}
      />

      <RegistrationSheet
        open={isSheetOpen}
        onClose={() => {
          setIsSheetOpen(false)
          setSelectedPatient(null)
        }}
        patient={selectedPatient}
        onFinish={async () => {
          // Optional: Navigate to queue list or show notification
          console.log('Registration complete')
        }}
      />
    </div>
  )
}
