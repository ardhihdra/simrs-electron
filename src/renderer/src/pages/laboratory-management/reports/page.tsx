import { PrinterOutlined } from '@ant-design/icons'
import { ExportButton } from '@renderer/components/molecules/ExportButton'
import GenericTable from '@renderer/components/organisms/GenericTable'
import { TableHeader } from '@renderer/components/TableHeader'
import { defaultAppConfig } from '@renderer/config/app-config'
import { client } from '@renderer/utils/client'
import { DatePicker, Form, Input, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useLaboratoryActions } from '../../Laboratory/useLaboratoryActions'
import {
  type AncillaryCategory,
  getAncillarySectionConfig,
  getAncillarySectionConfigByCategory,
  type AncillarySection
} from '../section-config'

interface EncounterPaymentStatus {
  required: boolean
  hasInvoice: boolean
  isPaid: boolean
  invoiceId: number | null
  invoiceStatus: string | null
  remaining: number
  paidAmount: number
}

interface ReportItem {
  id: string | number
  encounterId: string
  patientId: string
  patient?: {
    name?: string
    mrn?: string
  }
  queueTicket?: {
    number?: string | number
  }
  requestedAt?: string
  testDisplay?: string
  status?: string
  encounterPayment?: EncounterPaymentStatus
}

interface LaboratoryReportsProps {
  fixedCategory?: AncillaryCategory
  section?: AncillarySection
}

export default function LaboratoryReports({
  fixedCategory = 'LABORATORY',
  section
}: LaboratoryReportsProps = {}) {
  const sectionConfig = section
    ? getAncillarySectionConfig(section)
    : getAncillarySectionConfigByCategory(fixedCategory)
  const [searchParams, setSearchParams] = useState({
    fromDate: dayjs().subtract(7, 'days').format('YYYY-MM-DD'),
    toDate: dayjs().format('YYYY-MM-DD'),
    patientName: '',
    status: 'COMPLETED'
  })

  const {
    data: requestData,
    isLoading,
    isRefetching,
    refetch
  } = client.laboratoryManagement.getPendingOrders.useQuery({
    fromDate: searchParams.fromDate,
    toDate: searchParams.toDate,
    status: searchParams.status as any,
    category: fixedCategory
  })
  const { data: appConfigData } = client.applicationConfig.get.useQuery()
  const requirePaymentBeforePrintingLabResult =
    appConfigData?.result?.payment?.requirePaymentBeforePrintingLabResult ??
    defaultAppConfig.payment.requirePaymentBeforePrintingLabResult

  const reportList = useMemo(() => {
    if (!requestData?.result) return []

    const grouped = new Map<string, any>()
    requestData.result.forEach((item: ReportItem) => {
      if (!grouped.has(item.encounterId)) {
        grouped.set(item.encounterId, {
          id: item.encounterId,
          encounterId: item.encounterId,
          patientId: item.patientId,
          patient: item.patient,
          medicalRecordNumber: item.queueTicket?.number,
          lastUpdate: item.requestedAt,
          requestCount: 0,
          items: [],
          encounterPayment: item.encounterPayment
        })
      }
      const group = grouped.get(item.encounterId)
      group.requestCount += 1
      group.items.push(item)
      if (!group.encounterPayment && item.encounterPayment) {
        group.encounterPayment = item.encounterPayment
      }
      if (new Date(item.requestedAt as string).getTime() > new Date(group.lastUpdate).getTime()) {
        group.lastUpdate = item.requestedAt
      }
    })

    const patientKeyword = searchParams.patientName.trim().toLowerCase()

    return Array.from(grouped.values()).filter((group) => {
      if (!patientKeyword) return true
      const name = String(group.patient?.name || '').toLowerCase()
      const mrn = String(group.patient?.mrn || '').toLowerCase()
      return name.includes(patientKeyword) || mrn.includes(patientKeyword)
    })
  }, [requestData, searchParams.patientName])

  const columns: ColumnsType<any> = [
    {
      title: 'Pasien',
      dataIndex: 'patient',
      key: 'patient',
      render: (patient, record) => (
        <div>
          <span className="text-gray-500 text-xs">{record.patient?.mrn || '-'} - </span>
          <span className="font-bold">{patient?.name || '-'}</span>
        </div>
      )
    },
    {
      title: 'Tanggal',
      dataIndex: 'lastUpdate',
      key: 'lastUpdate',
      width: 150,
      render: (date?: string) => (date ? dayjs(date).format('DD/MM/YYYY') : '-')
    },
    {
      title: 'Jumlah Pemeriksaan',
      dataIndex: 'requestCount',
      key: 'requestCount',
      render: (count) => <Tag color="blue">{count} Item</Tag>
    },
    {
      title: 'Status',
      key: 'status',
      render: () => <Tag color="green">Finalized</Tag>
    },
    {
      title: 'Status Pembayaran',
      key: 'paymentStatus',
      render: (record) => (
        <Tag color={record.encounterPayment?.isPaid ? 'green' : 'red'}>
          {record.encounterPayment?.isPaid ? 'Lunas' : 'Belum Lunas'}
        </Tag>
      )
    }
  ]

  const onSearch = (values: { dateRange?: dayjs.Dayjs[]; patientName?: string }) => {
    setSearchParams({
      fromDate: values.dateRange ? dayjs(values.dateRange[0]).format('YYYY-MM-DD') : '',
      toDate: values.dateRange ? dayjs(values.dateRange[1]).format('YYYY-MM-DD') : '',
      patientName: values.patientName || '',
      status: 'COMPLETED'
    })
  }

  const { handlePrintReport } = useLaboratoryActions()

  return (
    <div className="p-4">
      <TableHeader
        title={sectionConfig.reportsTitle}
        subtitle={sectionConfig.reportsSubtitle}
        onSearch={onSearch}
        onRefresh={() => {
          refetch()
        }}
        loading={isLoading || isRefetching}
        action={
          <ExportButton
            data={reportList as any}
            fileName={`laporan-diagnostik-${sectionConfig.section}`}
            title={sectionConfig.reportsExportTitle}
            columns={[
              { key: 'medicalRecordNumber', label: 'No. RM' },
              { key: 'patient.mrn', label: 'MRN' },
              { key: 'patient.name', label: 'Nama Pasien' },
              {
                key: 'lastUpdate',
                label: 'Tanggal',
                render: (value) => (value ? dayjs(value as string).format('DD/MM/YYYY') : '-')
              },
              {
                key: 'requestCount',
                label: 'Jumlah Pemeriksaan',
                render: (value) => `${value} Item`
              },
              { key: 'status', label: 'Status', render: () => 'Finalized' }
            ]}
            nestedTable={{
              getChildren: (parent) => parent.items as Record<string, unknown>[],
              columns: [
                { key: 'testDisplay', label: 'Pemeriksaan' },
                { key: 'status', label: 'Status' }
              ]
            }}
          />
        }
      >
        <Form.Item
          name="dateRange"
          label="Tanggal"
          initialValue={[dayjs().subtract(7, 'days'), dayjs()]}
          style={{ width: '100%' }}
        >
          <DatePicker.RangePicker allowClear={false} style={{ width: '100%' }} size="large" />
        </Form.Item>
        <Form.Item name="patientName" label="Pasien" style={{ width: '100%' }}>
          <Input placeholder="Cari Nama / No. RM Pasien" allowClear size="large" />
        </Form.Item>
      </TableHeader>

      <div className="mt-4">
        <GenericTable
          columns={columns}
          dataSource={reportList}
          rowKey="id"
          loading={isLoading || isRefetching}
          action={{
            title: 'Aksi',
            width: 100,
            items: (record) => [
              {
                label: 'Cetak',
                icon: <PrinterOutlined />,
                type: 'primary',
                disabled:
                  requirePaymentBeforePrintingLabResult && !record.encounterPayment?.isPaid,
                tooltip:
                  requirePaymentBeforePrintingLabResult && !record.encounterPayment?.isPaid
                    ? 'Hasil belum dapat dicetak karena invoice belum lunas'
                    : undefined,
                onClick: () => handlePrintReport(record.encounterId, { category: fixedCategory })
              }
            ]
          }}
        />
      </div>
    </div>
  )
}
