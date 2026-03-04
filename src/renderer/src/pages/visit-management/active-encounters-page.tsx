import {  Tag, Form, Input, App } from 'antd'
import { client, rpc } from '@renderer/utils/client'
import { ExportButton } from '@renderer/components/molecules/ExportButton'
import GenericTable from '@renderer/components/organisms/GenericTable'
import { TableHeader } from '@renderer/components/TableHeader'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { DischargeModal } from '../encounter-transition/components/DischargeModal'
import { MpdnDischargeModal } from '../encounter-transition/components/MpdnDischargeModal'
import { RujukanModal } from '../encounter-transition/components/RujukanModal'
import { TransferBedFormValues, TransferBedModal } from '../encounter-transition/components/TransferBedModal'


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
    encounter:any
}


export default function ActiveEncountersPage() {
  const { data: encounters, isLoading, refetch } = client.visitManagement.getActiveEncounters.useQuery({})
  const { message } = App.useApp()
  
  const [transitionModalVisible, setTransitionModalVisible] = useState(false)
  const [dischargeModalVisible, setDischargeModalVisible] = useState(false)
  const [rujukanModalVisible, setRujukanModalVisible] = useState(false)
  const [selectedDisposition, setSelectedDisposition] = useState<string>('')

  const [searchText, setSearchText] = useState('')

  const [selectedEncounter, setSelectedEncounter] = useState<GetActiveEncountersResult | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mpdnDischargeModalVisible, setMpdnDischargeModalVisible] = useState(false)
  const [isMpdnSubmitting, setIsMpdnSubmitting] = useState(false)
  
  const { mutateAsync: transitionToInpatient } = client.visitManagement.transitionToInpatient.useMutation()
  const { mutateAsync: dischargeMpdn } = client.visitManagement.dischargeMpdnEncounter.useMutation()

  const columns = [
    {
      title: 'No. Antrian',
      dataIndex: 'queueTicket',
      key: 'queueTicket',
      render: (_, record: any) => record.encounter?.queueTicket?.formattedQueueNumber || record.encounter?.queueTicket?.queueNumber
    },
    {
      title: 'Patient Name',
      dataIndex: 'patientName',
      key: 'patientName',
      render:(patientName,record)=><div>
        <span className='text-xs text-gray-500'>{record.patientMrNo} -</span>
        <span> {patientName}</span>
      </div>
    },
    {
        title: 'Start Time',
        dataIndex: 'startTime',
        key: 'startTime',
        render: (val: string) => val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '-'
    },
    {
      title: 'Unit',
      dataIndex: 'encounter',
      key: 'serviceUnitName',
      render:(encounter)=>encounter?.queueTicket?.serviceUnit?.display
    },
    {
      title:"Poli",
      dataIndex:"encounter",
      key:"poli",
      render:(encounter)=>encounter?.queueTicket?.poli?.name
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color="blue">{status}</Tag>,
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

    if (selectedDisposition === 'REFERRED') {
        setDischargeModalVisible(false)
        setRujukanModalVisible(true)
        return
    }
    
    try {
        setIsSubmitting(true)
        const input = { encounterId: selectedEncounter.encounter.id, dischargeDisposition: selectedDisposition }
        await rpc.visitManagement.dischargeEncounter(input as any)
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

  const handleRujukanConfirm = async (referralType: string) => {
    if (!selectedEncounter) return
    setIsSubmitting(true)
    try {
        const input = {
            encounterId: selectedEncounter.id,
            dischargeDisposition: 'REFERRED',
            dischargeNote: referralType
        }

        await rpc.visitManagement.dischargeEncounter(input as any)
        console.log('Rujukan confirmed:', referralType)
        message.success(`Pasien berhasil dirujuk (${referralType})`)
        setRujukanModalVisible(false)
        setSelectedDisposition('')
        refetch()
    } catch (error: any) {
        console.error(error)
        message.error(error.message || 'Gagal merujuk pasien')
    } finally {
        setIsSubmitting(false)
    }
  }

  const syncSatusehat = async (id:string) => {
    try {
        setIsSubmitting(true)
        await rpc.encounter.syncExtracted({id})
        message.success('Sync Satusehat berhasil')
    } catch (error: any) {
        console.error(error)
        message.error(error.message || 'Gagal sync Satusehat')
    } finally {
        setIsSubmitting(false)
    }
  }

  const onSearch = (values: any) => {
    setSearchText(values.patientName?.toLowerCase() || '')
  }

  const filteredData = useMemo(() => {
    const data = (encounters as any)?.data || []
    if (!searchText) return data
    return data.filter((item: any) => 
      item.patientName?.toLowerCase().includes(searchText) ||
      item.patientMrNo?.toLowerCase().includes(searchText)
    )
  }, [encounters, searchText])

  return (
    <div>
      <TableHeader
        title="Kunjungan Aktif"
        subtitle="Manajemen kunjungan aktif"
        loading={isLoading}
        onSearch={onSearch}
        action={<ExportButton data={filteredData.map((item: any) => ({
          MRN: item.patientMrNo,
          Name: item.patientName,
          Unit: item.encounter?.queueTicket?.serviceUnit?.display,
          Poli: item.encounter?.queueTicket?.poli?.name,
          Status: item.status,
        }))} fileName="daftar-kunjungan"  />}
      >
      
          <Form.Item name="patientName" style={{ width: '100%' }} label="Pasien" className="mb-0">
            <Input placeholder="Cari Nama / No. MR" allowClear size='large' />
          </Form.Item>
          <Form.Item name="patientMrNo" style={{ width: '100%' }} label="MRN" className="mb-0">
            <Input placeholder="Cari MRN" allowClear size='large' />
          </Form.Item>
          <Form.Item name="encounterType" style={{ width: '100%' }} label="Tipe Kunjungan" className="mb-0">
            <Input placeholder="Cari Tipe Kunjungan" allowClear size='large' />
          </Form.Item>
          <Form.Item name="status" style={{ width: '100%' }} label="Status" className="mb-0">
            <Input placeholder="Cari Status" allowClear size='large' />
          </Form.Item>
      </TableHeader>
      <div className="mt-4">
          <GenericTable 
              dataSource={filteredData} 
              columns={columns} 
              loading={isLoading} 
              rowKey="id"
              action={{
                  title: 'Aksi',
                  width: 70,
                  items: (record) => [
                      ...(record.encounterType === 'EMER' ? [{
                          label: 'Transfer Inpatient',
                          type: 'primary' as const,
                          onClick: () => handleTransitionClick(record)
                      }] : []),
                      {
                          label: 'Discharge',
                          onClick: () => handleDischargeClick(record)
                      },
                      {
                          label: 'Rujuk',
                          onClick: () => handleRujukanClick(record)
                      },
                      {
                        label: 'Sync Satusehat',
                        onClick: () => syncSatusehat(record?.encounter?.id)
                      },
                      {
                          label: 'Cancel',
                          type: 'primary' as const,
                          danger: true,
                          onClick: () => console.log('Cancel clicked', record)
                      }
                  ]
              }}
          />
      </div>

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
        loading={isSubmitting}
        encounterId={selectedEncounter?.id}
        onConfirm={handleRujukanConfirm}
        onCancel={() => setRujukanModalVisible(false)}
      />
    </div>
  )
}
