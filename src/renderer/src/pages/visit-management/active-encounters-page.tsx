import { client, rpc } from '@renderer/utils/client'
import { Button, Card, Space, Table, Tag, message } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'
import { EncounterDischargeInput } from 'simrs-types'
import { TransferBedFormValues, TransferBedModal } from '../encounter-transition/components/TransferBedModal'
import { DischargeModal } from '../encounter-transition/components/DischargeModal'
import { MpdnDischargeModal } from '../encounter-transition/components/MpdnDischargeModal'
import { RujukanModal } from '../encounter-transition/components/RujukanModal'


// Mock type if not available in simrs-types yet
interface GetActiveEncountersResult {
    id: string
    encounterType: string
    status: string
    startTime: string
    patientId: string
    patientName: string
    patientMrNo: string
    serviceUnitId: string
    serviceUnitName: string
}


export default function ActiveEncountersPage() {
  const { data: encounters, isLoading, refetch } = client.visitManagement.getActiveEncounters.useQuery({})
  
  const [transitionModalVisible, setTransitionModalVisible] = useState(false)
  const [dischargeModalVisible, setDischargeModalVisible] = useState(false)
  const [rujukanModalVisible, setRujukanModalVisible] = useState(false)
  const [selectedDisposition, setSelectedDisposition] = useState<string>('')

  const [selectedEncounter, setSelectedEncounter] = useState<GetActiveEncountersResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mpdnDischargeModalVisible, setMpdnDischargeModalVisible] = useState(false)
  const [isMpdnSubmitting, setIsMpdnSubmitting] = useState(false)
  
  const { mutateAsync: transitionToInpatient } = client.visitManagement.transitionToInpatient.useMutation()
  const { mutateAsync: dischargeMpdn } = client.visitManagement.dischargeMpdnEncounter.useMutation()

  const columns = [
    {
      title: 'No. MR',
      dataIndex: 'patientMrNo',
      key: 'patientMrNo',
    },
    {
      title: 'Patient Name',
      dataIndex: 'patientName',
      key: 'patientName',
    },
    {
        title: 'Start Time',
        dataIndex: 'startTime',
        key: 'startTime',
        render: (val: string) => val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '-'
    },
    {
      title: 'Unit',
      dataIndex: 'serviceUnitName',
      key: 'serviceUnitName',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color="blue">{status}</Tag>,
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record: GetActiveEncountersResult) => (
        <Space size="middle">
          {record.encounterType === 'EMER' && (
            <Button type="primary" size="small" onClick={() => handleTransitionClick(record)}>
              Transfer Inpatient
            </Button>
          )}
          <Button size="small" onClick={() => handleDischargeClick(record)}>
            Discharge
          </Button>
          <Button size="small" onClick={() => handleRujukanClick(record)}>
            Rujuk
          </Button>
        </Space>
      ),
    },
  ]

  const handleTransitionClick = (encounter: GetActiveEncountersResult) => {
    setSelectedEncounter(encounter)
    setTransitionModalVisible(true)
  }

  const handleDischargeClick = (encounter: GetActiveEncountersResult) => {
    setSelectedEncounter(encounter)
    setDischargeModalVisible(true)
  }

  const handleRujukanClick = (encounter: GetActiveEncountersResult) => {
    setSelectedEncounter(encounter)
    setRujukanModalVisible(true)
  }

  const handleTransitionSubmit = async (values: TransferBedFormValues) => {
    try {
        if (!selectedEncounter) return
        setIsSubmitting(true)

        await transitionToInpatient({
            encounterId: selectedEncounter.id,
            targetServiceUnitId: values.organizationId, 
            targetServiceUnitCodeId: values.roomCodeId // Assuming roomCodeId relates to the unit code or similar
        })
        
        message.success('Transition successful')
        setTransitionModalVisible(false)
        refetch()
    } catch (error) {
        console.error(error)
        message.error('Transition failed')
    } finally {
        setIsSubmitting(false)
    }
  }

  const handleDischargeConfirm = async () => {
    if (!selectedEncounter || !selectedDisposition) {
      message.warning('Pilih disposisi pulang terlebih dahulu')
      return
    }

    if (selectedDisposition === 'DECEASED') {
        setDischargeModalVisible(false)
        setMpdnDischargeModalVisible(true)
        return
    }
    
    try {
        setIsSubmitting(true)
        const input: EncounterDischargeInput = { id: selectedEncounter.id, dischargeDisposition: selectedDisposition }
        await rpc.encounter.discharge(input)
        message.success('Pasien dipulangkan')
        setDischargeModalVisible(false)
        setSelectedDisposition('')
        refetch()
    } catch (error: any) {
        console.error(error)
        message.error(error.message || 'Gagal memulangkan pasien')
    } finally {
        setIsSubmitting(false)
    }
  }

  const handleMpdnConfirm = async (values: any) => {
    if (!selectedEncounter) return
    setIsMpdnSubmitting(true)
    try {
        await dischargeMpdn({
            encounterId: selectedEncounter.id,
            ...values,
            dateOfDeath: values.dateOfDeath?.toDate(),
            timeOfDeath: values.timeOfDeath?.toDate()
        })
        
        message.success('Data Kematian (MPDN) berhasil disimpan dan pasien dipulangkan')
        setMpdnDischargeModalVisible(false)
        setSelectedDisposition('')
        refetch()
    } catch (error: any) {
        console.error(error)
        message.error(error.message || 'Gagal menyimpan data MPDN')
    } finally {
        setIsMpdnSubmitting(false)
    }
  }

  const handleRujukanConfirm = (referralType: string) => {
    // Implement referral logic if backend ready, for now just UI
    console.log('Rujukan confirmed:', referralType)
    message.success(`Pasien berhasil dirujuk (${referralType})`)
    setRujukanModalVisible(false)
  }

  return (
    <div className="p-6">
      <Card title="Active Encounters">
        <Table 
            dataSource={(encounters as any)?.data || []} 
            columns={columns} 
            loading={isLoading} 
            rowKey="id"
        />
      </Card>

      <TransferBedModal
        visible={transitionModalVisible}
        loading={isSubmitting}
        onConfirm={handleTransitionSubmit}
        onCancel={() => setTransitionModalVisible(false)}
      />

      <DischargeModal
        visible={dischargeModalVisible}
        loading={isSubmitting}
        selectedDisposition={selectedDisposition}
        onDispositionChange={setSelectedDisposition}
        onConfirm={handleDischargeConfirm}
        onCancel={() => {
            setDischargeModalVisible(false)
            setSelectedDisposition('')
        }}
      />

      <MpdnDischargeModal
        visible={mpdnDischargeModalVisible}
        loading={isMpdnSubmitting}
        onConfirm={handleMpdnConfirm}
        onCancel={() => setMpdnDischargeModalVisible(false)}
      />

      <RujukanModal
        visible={rujukanModalVisible}
        encounterId={selectedEncounter?.id}
        onConfirm={handleRujukanConfirm}
        onCancel={() => setRujukanModalVisible(false)}
      />
    </div>
  )
}
