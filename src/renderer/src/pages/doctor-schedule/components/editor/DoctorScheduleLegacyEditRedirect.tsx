import { Navigate, useParams } from 'react-router'

export function DoctorScheduleLegacyEditRedirect() {
  const { id } = useParams()
  return <Navigate to={`/dashboard/registration/doctor-schedule/${id}/info`} replace />
}
