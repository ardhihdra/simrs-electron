import { App } from 'antd'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'

import { RawatInapAdmisiPage } from './RawatInapAdmisiPage'
import { RAWAT_INAP_PAGE_PATHS } from './rawat-inap.config'
import { client } from '../../utils/client'

export default function RawatInapAdmisiRoute() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const bedMapQuery = client.room.bedMap.useQuery({})
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
      isSubmitting={admissionMutation.isPending}
      onSubmit={(command) => admissionMutation.mutate(command)}
    />
  )
}
