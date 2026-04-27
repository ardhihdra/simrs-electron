import { App } from 'antd'
import { useNavigate } from 'react-router'

import { RawatInapAdmisiPage } from './RawatInapAdmisiPage'
import { RAWAT_INAP_PAGE_PATHS } from './rawat-inap.config'

export default function RawatInapAdmisiRoute() {
  const navigate = useNavigate()
  const { message } = App.useApp()

  return (
    <RawatInapAdmisiPage
      onBack={() => navigate(RAWAT_INAP_PAGE_PATHS.bedMap)}
      onCancel={() => navigate(RAWAT_INAP_PAGE_PATHS.bedMap)}
      onSubmit={() => message.info('Admisi rawat inap belum terhubung ke backend')}
    />
  )
}
