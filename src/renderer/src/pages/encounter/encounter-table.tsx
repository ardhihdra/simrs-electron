import GenericTable from '@renderer/components/GenericTable'
import { singkatPoli } from '@renderer/utils/singkatPoli'
import { useQuery } from '@tanstack/react-query'
import { Button, message } from 'antd'
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
  return (
    <div>
      <GenericTable
        loading={isLoading || isRefetching}
        columns={columns}
        dataSource={(data?.data as any) || []}
        rowKey="id"
        action={{
          render(record) {
            return (
              <div>
                <Button
                  loading={creatingEncounter === record.id}
                  onClick={() => handleCreateEncounter(record.id)}
                >
                  Buat
                </Button>
              </div>
            )
          }
        }}
      />
    </div>
  )
}

export default EncounterTable
