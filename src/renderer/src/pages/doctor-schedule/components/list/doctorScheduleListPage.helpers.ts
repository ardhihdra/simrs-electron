export const buildDoctorScheduleListQuery = () => ({
  model: 'jadwalDokter',
  method: 'get' as const,
  listAll: true
})
