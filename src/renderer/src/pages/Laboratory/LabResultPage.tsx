import { Button, Result } from 'antd'
import { useNavigate } from 'react-router'

export default function LabResultPage() {
  const navigate = useNavigate()
  return (
    <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
      <Result
        status="info"
        title="Pilih Permintaan Lab"
        subTitle="Silahkan pilih permintaan laboratorium dari daftar untuk input hasil pemeriksaan."
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard/laboratory/permintaan')}>
            Ke Daftar Permintaan
          </Button>
        }
      />
    </div>
  )
}
