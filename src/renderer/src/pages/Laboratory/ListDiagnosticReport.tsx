import GenericTable from '@renderer/components/GenericTable'
import { client } from '@renderer/utils/client'
import { Card, Image, Tag } from 'antd'

export const ListDiagnosticReport = () => {
  const data = client.laboratory.listDiagnosticReport.useQuery({})

  const columns = [
    {
      title: 'No',
      dataIndex: 'no',
      key: 'no',
      render: (_: string, record: any, index: number) => {
        return index + 1
      }
    },
    {
      title: 'MRN',
      dataIndex: 'mrn',
      key: 'mrn',
      render: (_: string, record: any) => {
        return record?.patient?.medicalRecordNumber || '-'
      }
    },
    {
      title: 'Pasien',
      dataIndex: 'patientId',
      key: 'patient',
      render: (text: string, record: any) => {
        return record?.patient?.name || text
      }
    },
    {
      title: 'Report',
      dataIndex: 'report',
      key: 'report',
      render: (_: string, record: any) => {
        const count = record?.observations?.length || 0
        return <span>{count} Pemeriksaan</span>
      }
    },
    {
      title: 'Request',
      dataIndex: 'encounterId',
      key: 'request',
      render: (_: string, record: any) => {
        const count = record?.encounter?.labServiceRequests?.length || 0
        return <span>{count} Permintaan</span>
      }
    },
    {
      title: 'Tanggal',
      dataIndex: 'effectiveDateTime',
      key: 'effectiveDateTime',
      render: (value: string) => {
        return <span>{new Date(value).toLocaleDateString()}</span>
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text: string) => {
        return <Tag color={text === 'registered' ? 'blue' : 'green'}>{text.toUpperCase()}</Tag>
      }
    }
  ]
  console.log(data.data?.result)
  return (
    <div>
      <GenericTable
        columns={columns}
        dataSource={data.data?.result || []}
        rowKey={(item: any) => item.id}
        tableProps={{
          expandable: {
            expandedRowRender: (record: any) => {
              const observations = record?.observations
              const requests = record?.encounter?.labServiceRequests
              if (!observations?.length && !requests?.length) return null

              return (
                <div className="p-4 bg-gray-50/50 rounded-lg flex gap-4">
                  <Card
                    title={<span className="text-gray-700 font-semibold">Hasil Pemeriksaan</span>}
                    size="small"
                    className="w-full"
                  >
                    {observations && observations.length > 0 ? (
                      <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                        {observations.map((item: any) => {
                          if (item.value.startsWith('cons')) return null
                          return (
                            <div
                              key={item.id}
                              className="flex justify-between items-start p-3 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-gray-800">
                                  {item.observationCodeId}
                                </span>
                                {item.interpretation && (
                                  <Tag
                                    color={
                                      ['HIGH', 'LOW', 'POS', 'ABNORMAL'].includes(
                                        item.interpretation
                                      )
                                        ? 'error'
                                        : 'success'
                                    }
                                    className="w-fit text-[10px] leading-tight px-1 py-0"
                                  >
                                    {item.interpretation}
                                  </Tag>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="text-gray-900 font-semibold text-lg">
                                  {item.value}
                                </span>
                                <span className="text-gray-500 text-sm ml-1">{item.unit}</span>
                                {item.referenceRange && (
                                  <div className="text-xs text-gray-400 mt-0.5">
                                    Ref: {item.referenceRange}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : record?.imagingStudies && record.imagingStudies.length > 0 ? null : (
                      <div className="p-6 text-center text-gray-400 italic">Belum ada hasil</div>
                    )}

                    {/* Render Image for Radiology */}
                    {record?.imagingStudies && record.imagingStudies.length > 0 && (
                      <div className="border-t border-gray-100 pt-4 mt-4">
                        <span className="block text-gray-700 font-medium mb-2">
                          Citra Radiologi
                        </span>
                        {record.imagingStudies.map((study: any) =>
                          study.pacsEndpoint ? (
                            <div
                              key={study.id}
                              className="rounded-lg overflow-hidden border border-gray-200"
                            >
                              <Image
                                src={`http://localhost:8810/public/${study.pacsEndpoint}`}
                                alt="Radiology Result"
                                className="w-full h-auto object-contain max-h-[400px]"
                              />
                              <div className="p-2 bg-gray-50 text-xs text-gray-500">
                                {study.modalityCode} - {new Date(study.started).toLocaleString()}
                              </div>
                            </div>
                          ) : null
                        )}
                      </div>
                    )}
                  </Card>

                  <Card
                    title={<span className="text-gray-700 font-semibold">Permintaan Layanan</span>}
                    size="small"
                    className="w-full"
                  >
                    {requests && requests.length > 0 ? (
                      <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                        {requests.map((item: any) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center p-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-800">
                                {item?.serviceCode?.display || item?.serviceCodeId}
                              </span>
                              <span className="text-xs text-gray-400 uppercase tracking-wide">
                                {item.category}
                              </span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Tag
                                color={
                                  item.priority === 'URGENT' || item.priority === 'STAT'
                                    ? 'red'
                                    : 'blue'
                                }
                                className="m-0"
                              >
                                {item.priority}
                              </Tag>
                              <span className="text-[10px] text-gray-500 font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                                {item.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-gray-400 italic">
                        Tidak ada permintaan
                      </div>
                    )}
                  </Card>
                </div>
              )
            },
            rowExpandable: (record: any) =>
              record?.observations?.length > 0 || record?.encounter?.labServiceRequests?.length > 0
          }
        }}
      />
    </div>
  )
}
