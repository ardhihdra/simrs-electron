import { VerifikasiOKTable } from '../../../components/organisms/OK/VerifikasiOKTable'
import { Card } from 'antd'

const AntrianVerifikasiPage = () => {
  return (
    <div className="p-2">
      <Card className="shadow-none border-gray-100">
        <VerifikasiOKTable />
      </Card>
    </div>
  )
}

export default AntrianVerifikasiPage
