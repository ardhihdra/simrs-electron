import { UserOutlined } from '@ant-design/icons'
import { useModuleScopeStore } from '@renderer/services/ModuleScope/store'
import { client } from '@renderer/utils/client'
import { Card, Col, Row, Typography } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router'

const { Title, Text } = Typography

const POLI_COLORS: { key?: string; bg: string; icon: string; hover: string }[] = [
  { key: 'umum', bg: 'bg-blue-100', icon: 'text-blue-600', hover: 'group-hover:bg-blue-500' },
  { key: 'anak', bg: 'bg-sky-100', icon: 'text-sky-600', hover: 'group-hover:bg-sky-500' },
  { key: 'kandungan', bg: 'bg-pink-100', icon: 'text-pink-600', hover: 'group-hover:bg-pink-500' },
  {
    key: 'penyakit dalam',
    bg: 'bg-amber-100',
    icon: 'text-amber-600',
    hover: 'group-hover:bg-amber-500'
  },
  { key: 'bedah', bg: 'bg-red-100', icon: 'text-red-600', hover: 'group-hover:bg-red-500' },
  { key: 'jantung', bg: 'bg-rose-100', icon: 'text-rose-600', hover: 'group-hover:bg-rose-500' },
  {
    key: 'saraf',
    bg: 'bg-violet-100',
    icon: 'text-violet-600',
    hover: 'group-hover:bg-violet-500'
  },
  { key: 'mata', bg: 'bg-cyan-100', icon: 'text-cyan-600', hover: 'group-hover:bg-cyan-500' },
  { key: 'tht', bg: 'bg-indigo-100', icon: 'text-indigo-600', hover: 'group-hover:bg-indigo-500' },
  {
    key: 'kulit',
    bg: 'bg-orange-100',
    icon: 'text-orange-600',
    hover: 'group-hover:bg-orange-500'
  },
  { key: 'gigi', bg: 'bg-lime-100', icon: 'text-lime-600', hover: 'group-hover:bg-lime-500' },
  {
    key: 'orthopedi',
    bg: 'bg-stone-100',
    icon: 'text-stone-600',
    hover: 'group-hover:bg-stone-500'
  },
  { key: 'paru', bg: 'bg-teal-100', icon: 'text-teal-600', hover: 'group-hover:bg-teal-500' },
  { key: 'jiwa', bg: 'bg-purple-100', icon: 'text-purple-600', hover: 'group-hover:bg-purple-500' },
  { key: 'gizi', bg: 'bg-green-100', icon: 'text-green-600', hover: 'group-hover:bg-green-500' },
  {
    key: 'urologi',
    bg: 'bg-emerald-100',
    icon: 'text-emerald-600',
    hover: 'group-hover:bg-emerald-500'
  },
  {
    key: 'geriatri',
    bg: 'bg-yellow-100',
    icon: 'text-yellow-600',
    hover: 'group-hover:bg-yellow-500'
  },
  {
    key: 'rehabilitasi',
    bg: 'bg-fuchsia-100',
    icon: 'text-fuchsia-600',
    hover: 'group-hover:bg-fuchsia-500'
  },
  { key: 'kelamin', bg: 'bg-slate-100', icon: 'text-slate-600', hover: 'group-hover:bg-slate-500' },
  { key: 'otak', bg: 'bg-zinc-100', icon: 'text-zinc-600', hover: 'group-hover:bg-zinc-500' }
]

function getPoliColor(poliName: string) {
  const lower = poliName.toLowerCase()
  const matched = POLI_COLORS.find((c) => c.key && lower.includes(c.key))
  if (matched) return matched
  let hash = 0
  for (let i = 0; i < poliName.length; i++) hash = poliName.charCodeAt(i) + ((hash << 5) - hash)
  return POLI_COLORS[Math.abs(hash) % POLI_COLORS.length]
}

export default function RegistrationSelect() {
  const { session } = useModuleScopeStore()
  const isDoctor = session?.hakAksesId === 'doctor'
  const navigate = useNavigate()

  const { data: practitionerData } = client.registration.getAvailableDoctors.useQuery({
    date: dayjs().format('YYYY-MM-DD')
  })

  const { data: poliData } = client.visitManagement.poli.useQuery({})

  const listPoli = useMemo(
    () =>
      poliData?.result
        ?.map((poli) => ({
          id: poli.id,
          name: poli.name,
          lokasiKerjaId: poli.location.id
        }))
        .filter((poli) => {
          if (session?.hakAksesId === 'administrator') return true
          return poli.lokasiKerjaId === session?.lokasiKerjaId
        }),
    [poliData?.result, session?.hakAksesId, session?.lokasiKerjaId]
  )

  const filteredPractitioners = useMemo(
    () =>
      practitionerData?.result?.doctors
        ?.filter((practitioner) => {
          if (session?.hakAksesId === 'administrator') return true
          return (
            listPoli?.some((poli) => poli.id === practitioner.poliId) &&
            (!isDoctor || practitioner.id == session.kepegawaianId)
          )
        })
        ?.map((practitioner) => ({
          ...practitioner,
          id: practitioner.doctorId
        })),
    [
      isDoctor,
      listPoli,
      practitionerData?.result?.doctors,
      session?.hakAksesId,
      session?.kepegawaianId
    ]
  )

  useEffect(() => {
    if (filteredPractitioners?.length !== 1) {
      return
    }

    // navigate(`/dashboard/registration/queue/${filteredPractitioners[0].id}`, { replace: true })
  }, [filteredPractitioners, navigate])

  return (
    <div className="p-6">
      <div className="mb-8">
        <Title level={2} className="mb-1!">
          Pilih Dokter
        </Title>
        <Text type="secondary">Silakan pilih dokter untuk melihat antrian pendaftaran.</Text>
      </div>

      <Row gutter={[24, 24]}>
        {filteredPractitioners?.map((practitioner) => {
          const color = getPoliColor(practitioner.poliName ?? '')
          return (
            <Col xs={24} sm={12} md={8} lg={6} key={practitioner.id}>
              <Card
                hoverable
                className="bg-linear-to-br h-full border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group from-white to-gray-50/50"
                onClick={() => navigate(`/dashboard/registration/select/${practitioner.id}`)}
                bodyStyle={{ padding: '24px' }}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300 ${color.bg} ${color.hover}`}
                  >
                    <UserOutlined className={`text-2xl group-hover:text-white ${color.icon}`} />
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
          )
        })}
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
