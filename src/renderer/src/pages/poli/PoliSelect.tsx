import { CalendarOutlined } from '@ant-design/icons'
import { useModuleScopeStore } from '@renderer/services/ModuleScope/store'
import { client } from '@renderer/utils/client'
import { Card, Col, Row, Typography } from 'antd'
import { useNavigate } from 'react-router'

const { Title, Text } = Typography

export default function PoliSelect() {
  const { session } = useModuleScopeStore()
  const navigate = useNavigate()

  const { data: poliData, isLoading } = client.visitManagement.poli.useQuery({})

  const listPoli = poliData?.result
    ?.map((poli) => ({
      id: poli.id,
      name: poli.name,
      code: poli.code || poli.id.toString(), // Support for code or ID
      lokasiKerjaId: poli.location.id
    }))
    .filter((poli) => {
      if (session?.hakAksesId === 'administrator') return true
      return poli.lokasiKerjaId === session?.lokasiKerjaId
    })

  console.log('Session:', session)
  console.log('List Poli:', listPoli)
  return (
    <div className="p-6">
      <div className="mb-8">
        <Title level={2} className="mb-1!">
          Pilih Unit Layanan / Poli
        </Title>
        <Text type="secondary">Silakan pilih poli untuk masuk ke workspace pemeriksaan.</Text>
      </div>

      <Row gutter={[24, 24]}>
        {listPoli?.map((poli) => (
          <Col xs={24} sm={12} md={8} lg={6} key={poli.id}>
            <Card
              hoverable
              className="bg-linear-to-br from-white to-gray-50/50 group h-full overflow-hidden rounded-2xl border-none shadow-sm transition-all duration-300 hover:shadow-xl"
              onClick={() => navigate(`/dashboard/poli/${poli.code.toLowerCase()}`)}
              bodyStyle={{ padding: '24px' }}
            >
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="bg-primary/10 group-hover:bg-primary flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110">
                  <CalendarOutlined className="text-primary group-hover:text-white text-2xl" />
                </div>
                <div className="space-y-1">
                  <Title level={4} className="group-hover:text-primary mb-0! transition-colors">
                    {poli.name}
                  </Title>
                  <Text
                    type="secondary"
                    className="block text-xs font-medium uppercase tracking-wider"
                  >
                    POLIKLINIK
                  </Text>
                </div>
                <div className="pt-2">
                  <span className="border-blue-100 bg-blue-50 text-blue-600 rounded-full border px-3 py-1 text-xs font-semibold">
                    Workspace Aktif
                  </span>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {!isLoading && (!listPoli || listPoli.length === 0) && (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-20 text-center">
          <Text type="secondary" className="text-lg">
            Tidak ada unit layanan yang tersedia untuk hak akses Anda.
          </Text>
        </div>
      )}
    </div>
  )
}
