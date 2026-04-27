import { App } from 'antd'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'

import { RawatInapAdmisiPage } from './RawatInapAdmisiPage'
import { RAWAT_INAP_PAGE_PATHS } from './rawat-inap.config'
import { client } from '../../utils/client'

function toMitraOptions(payload: unknown) {
  const rows =
    payload && typeof payload === 'object'
      ? ((payload as any).result ?? (payload as any).data ?? [])
      : []

  return Array.isArray(rows)
    ? rows.map((item: any) => ({
        value: Number(item.id),
        label: item.name || item.nama || `Mitra ${item.id}`
      }))
    : []
}

export default function RawatInapAdmisiRoute() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const bedMapQuery = client.room.bedMap.useQuery({})
  const bpjsMitraQuery = client.visitManagement.getMitra.useQuery({
    type: 'bpjs',
    status: 'active'
  })
  const insuranceMitraQuery = client.visitManagement.getMitra.useQuery({
    type: 'insurance',
    status: 'active'
  })
  const companyMitraQuery = client.visitManagement.getMitra.useQuery({
    type: 'company',
    status: 'active'
  })
  const admissionMutation = client.rawatInapAdmission.create.useMutation({
    onSuccess: (result) => {
      message.success(`Admisi rawat inap berhasil dibuat (${result?.encounterId ?? 'encounter baru'})`)
      void queryClient.invalidateQueries()
      navigate(RAWAT_INAP_PAGE_PATHS.bedMap)
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : 'Gagal membuat admisi rawat inap')
    }
  })
  return (
    <RawatInapAdmisiPage
      onBack={() => navigate(RAWAT_INAP_PAGE_PATHS.bedMap)}
      onCancel={() => navigate(RAWAT_INAP_PAGE_PATHS.bedMap)}
      bedMapSnapshot={bedMapQuery.data}
      mitraOptionsByPaymentMethod={{
        bpjs: toMitraOptions(bpjsMitraQuery.data),
        asuransi: toMitraOptions(insuranceMitraQuery.data),
        company: toMitraOptions(companyMitraQuery.data)
      }}
      isSubmitting={admissionMutation.isPending}
      onSubmit={(command) => admissionMutation.mutate(command)}
    />
  )
}
