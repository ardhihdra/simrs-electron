import { Button, Result } from 'antd'
import { useNavigate } from 'react-router'

export default function LabSpecimenPage() {
  const navigate = useNavigate()
  return (
    <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
      <Result
        status="info"
        title="Pilih Permintaan Lab"
        subTitle="Silahkan pilih permintaan laboratorium dari daftar untuk pengambilan spesimen."
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard/laboratory/list')}>
            Ke Daftar Permintaan
          </Button>
        }
      />
    </div>
  )
}
