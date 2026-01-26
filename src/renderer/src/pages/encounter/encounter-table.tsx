import GenericTable from '@renderer/components/GenericTable'
import { TableHeader } from '@renderer/components/TableHeader'
import { singkatPoli } from '@renderer/utils/singkatPoli'
import { useQuery } from '@tanstack/react-query'
import { Col, Form, Input, message } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'
import { QueueTicketResponse } from 'simrs-types'

const columns: ColumnsType<QueueTicketResponse> = [
  {
    title: 'No',
    dataIndex: 'no',
    key: 'no',
    width: 60,
    render: (value, record, index) => index + 1
  },
  {
    title: 'Nomo Antrian',
    dataIndex: ['queueTicket', 'queueNumber'],
    key: 'queueNumber',
    render: (value, record) => `${singkatPoli(record.poli?.name)} - ${record.queueNumber}`
  },
  {
    title: 'MRN',
    dataIndex: ['patient', 'medicalRecordNumber'],
    key: 'medicalRecordNumber'
  },
  {
    title: 'Asuransi',
    dataIndex: ['assurance', 'display'],
    key: 'assurance'
  },
  {
    title: 'Nama',
    dataIndex: ['patient', 'name'],
    key: 'name'
  },
  {
    title: 'Gender',
    dataIndex: ['patient', 'gender'],
    key: 'gender',
    render: (value: string) => (value === 'male' ? 'Laki-laki' : 'Perempuan')
  }
]

export function EncounterTable() {
  const startDate = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now.toISOString()
  }, [])
  const endDate = useMemo(() => {
    const now = new Date()
    now.setHours(23, 59, 59, 999)
    return now.toISOString()
  }, [])

  const [creatingEncounter, setCreatingEncounter] = useState<string | null>(null)

  const handleCreateEncounter = async (ticketId: string) => {
    setCreatingEncounter(ticketId)
    try {
      const tickets = (data?.data as any) || []
      const ticket = tickets.find((t: any) => t.id === ticketId)
      if (!ticket) {
        throw new Error('Ticket not found')
      }

      const isLab = ticket.serviceUnitCodeId === 'LAB'
      const payload: any = {
        patientId: ticket.patientId,
        queueTicketId: ticket.id,
        serviceUnitId: ticket.serviceUnit?.id,
        serviceUnitCodeId: ticket.serviceUnitCodeId
      }
      if (isLab) {
        payload.source = 'WALK_IN'
      }

      const createFn = isLab
        ? window.api.encounter.createLaboratory
        : window.api.encounter.createAmbulatory

      const encounterResponse = await createFn(payload)

      if (encounterResponse.success) {
        await window.api.query.queueticket.update({
          id: ticketId,
          status: 'CHECKED_IN'
        })

        message.success('Encounter created successfully and patient checked in')
        refetch()
      } else {
        throw new Error(encounterResponse.error || 'Failed to create encounter')
      }
    } catch (error: unknown) {
      console.error('Failed to create encounter', error)
      const msg = error instanceof Error ? error.message : 'Failed to create encounter'
      message.error(msg)
    } finally {
      setCreatingEncounter(null)
    }
  }

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['encounter'],
    queryFn: () => {
      const fn = window.api.query.queueticket.listAll
      return fn({
        depth: 1,
        filter: 'status',
        equal: 'RESERVED',
        startDate: startDate,
        endDate: endDate
      })
    }
  })
  const [filter, setFilter] = useState({ name: '', medicalRecordNumber: '' })

  const filteredData = useMemo(() => {
    const rawData = (data?.data as any[]) || []
    return rawData.filter((item) => {
      const patientName = item.patient?.name || ''
      const patientMrn = item.patient?.medicalRecordNumber || ''

      const filterName = filter.name || ''
      const filterMrn = filter.medicalRecordNumber || ''

      const matchName = patientName.toLowerCase().includes(filterName.toLowerCase())
      const matchMrn = patientMrn.toLowerCase().includes(filterMrn.toLowerCase())

      if (filterName && !matchName) return false
      if (filterMrn && !matchMrn) return false
      return true
    })
  }, [data, filter])

  return (
    <div>
      <TableHeader
        title="Daftar Antrian"
        onSearch={(values) => setFilter(values)}
        onReset={() => setFilter({ name: '', medicalRecordNumber: '' })}
        loading={isLoading || isRefetching}
      >
        <Col span={12}>
          <Form.Item name="name" label="Nama Pasien">
            <Input placeholder="Cari Nama Pasien" allowClear />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="medicalRecordNumber" label="MRN">
            <Input placeholder="Cari MRN" allowClear />
          </Form.Item>
        </Col>
        <Col span={24}>
          <div className="text-gray-500">
            Menampilkan antrian untuk tanggal {new Date(startDate).toLocaleDateString()}
          </div>
        </Col>
      </TableHeader>
      <div className="mt-4">
        <GenericTable
          loading={isLoading || isRefetching}
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          action={{
            items(record) {
              return [
                {
                  key: 'start',
                  label: 'Pemeriksaan Awal',
                  onClick: () => handleCreateEncounter(record.id),
                  confirm: {
                    title: 'Pemeriksaan Awal',
                    description: 'Apakah anda yakin ingin memulai pemeriksaan untuk pasien ini?'
                  }
                },
                {
                  key: 'transfer',
                  label: 'Panggil Pasien',
                  onClick: () => handleCreateEncounter(record.id),
                  confirm: {
                    title: 'Panggil Pasien',
                    description: 'Apakah anda yakin ingin memanggil pasien ini?'
                  }
                }
              ]
            }
          }}
        />
      </div>
    </div>
  )
}

export default EncounterTable
