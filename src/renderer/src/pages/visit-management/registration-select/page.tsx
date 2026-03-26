import { UserOutlined } from '@ant-design/icons'
import { useModuleScopeStore } from '@renderer/services/ModuleScope/store'
import { client } from '@renderer/utils/client'
import { Card, Col, Row, Typography } from 'antd'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router'

const { Title, Text } = Typography

export default function RegistrationSelect() {
  const { session } = useModuleScopeStore()
  const navigate = useNavigate()

  const { data: practitionerData } = client.registration.getAvailableDoctors.useQuery({
    date: dayjs().format('YYYY-MM-DD')
  })

  const { data: poliData } = client.visitManagement.poli.useQuery({})

  const listPoli = poliData?.result
    ?.map((poli) => ({
      id: poli.id,
      name: poli.name,
      lokasiKerjaId: poli.location.id
    }))
    .filter((poli) => {
      if (session?.hakAksesId === 'administrator') return true
      return poli.lokasiKerjaId === session?.lokasiKerjaId
    })

  const filteredPractitioners = practitionerData?.result?.doctors
    ?.filter((practitioner) => {
      if (session?.hakAksesId === 'administrator') return true
      return listPoli?.some((poli) => poli.id === practitioner.poliId)
    })
    ?.map((practitioner) => ({
      ...practitioner,
      id: practitioner.doctorId
    }))

  return (
    <div className="p-6">
      <div className="mb-8">
        <Title level={2} className="mb-1!">
          Pilih Dokter
        </Title>
        <Text type="secondary">Silakan pilih dokter untuk melihat antrian pendaftaran.</Text>
      </div>

      <Row gutter={[24, 24]}>
        {filteredPractitioners?.map((practitioner) => (
          <Col xs={24} sm={12} md={8} lg={6} key={practitioner.id}>
            <Card
              hoverable
              className="bg-linear-to-br h-full border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group from-white to-gray-50/50"
              onClick={() => navigate(`/dashboard/registration/queue/${practitioner.id}`)}
              bodyStyle={{ padding: '24px' }}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <UserOutlined className="text-2xl text-primary group-hover:text-white" />
                </div>
                <div className="space-y-1">
                  <Title level={4} className="mb-0! group-hover:text-primary transition-colors">
                    {practitioner.doctorName}
                  </Title>
                  <Text
                    type="secondary"
                    className="block text-sm uppercase tracking-wider font-medium"
                  >
                    {practitioner.poliName}
                  </Text>
                </div>
                <div className="pt-2">
                  <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-semibold border border-green-100">
                    Tersedia
                  </span>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {(!filteredPractitioners || filteredPractitioners.length === 0) && (
        <div className="text-center py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
          <Text type="secondary" className="text-lg">
            Tidak ada dokter yang tersedia saat ini.
          </Text>
        </div>
      )}
    </div>
  )
}
