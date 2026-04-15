import { Table, Tabs, Tag } from 'antd'
import type { TabsProps } from 'antd'

export interface PaketOperationTindakanRow {
  key: string
  namaPaket: string
  item: string
  qty: number
  satuan: string
  cyto?: boolean | string | null
  catatanTambahan?: string | null
}

export interface PaketOperationBhpRow {
  key: string
  namaPaket: string
  item: string
  qty: number
  satuan: string
}

interface PaketOperationBreakdownProps {
  paketRows?: PaketOperationTindakanRow[]
  paketBhpRows?: PaketOperationBhpRow[]
  extraTabItems?: TabsProps['items']
}

export default function PaketOperationBreakdown({
  paketRows = [],
  paketBhpRows = [],
  extraTabItems = []
}: PaketOperationBreakdownProps) {
  const paketColumns = [
    { title: 'Dari Paket', dataIndex: 'namaPaket', key: 'namaPaket' },
    { title: 'Item / Nama', dataIndex: 'item', key: 'item' },
    { title: 'Qty', dataIndex: 'qty', key: 'qty', width: 60, align: 'center' as const },
    { title: 'Satuan', dataIndex: 'satuan', key: 'satuan', width: 80 },
    {
      title: 'Cyto',
      dataIndex: 'cyto',
      key: 'cyto',
      width: 70,
      align: 'center' as const,
      render: (_: unknown, rec: PaketOperationTindakanRow) =>
        rec.cyto === true || String(rec.cyto).toLowerCase() === 'true' ? (
          <Tag color="error" style={{ margin: 0 }}>
            Cyto
          </Tag>
        ) : (
          <span className="text-slate-400">Tidak</span>
        )
    },
    {
      title: 'Catatan Tambahan',
      dataIndex: 'catatanTambahan',
      key: 'catatanTambahan',
      render: (val: string | null | undefined) => val || '-'
    }
  ]

  const paketBhpColumns = [
    { title: 'Dari Paket', dataIndex: 'namaPaket', key: 'namaPaket' },
    { title: 'Item / Nama', dataIndex: 'item', key: 'item' },
    { title: 'Qty', dataIndex: 'qty', key: 'qty', width: 60, align: 'center' as const },
    { title: 'Satuan', dataIndex: 'satuan', key: 'satuan', width: 80 }
  ]

  const tabItems: TabsProps['items'] = [
    ...(paketRows.length > 0
      ? [
          {
            key: 'paket',
            label: `Paket (${paketRows.length})`,
            children: (
              <Table
                columns={paketColumns}
                dataSource={paketRows}
                pagination={false}
                size="small"
              />
            )
          }
        ]
      : []),
    ...(paketBhpRows.length > 0
      ? [
          {
            key: 'paketBhp',
            label: `Pkt. BHP (${paketBhpRows.length})`,
            children: (
              <Table
                columns={paketBhpColumns}
                dataSource={paketBhpRows}
                pagination={false}
                size="small"
              />
            )
          }
        ]
      : []),
    ...(extraTabItems || [])
  ]

  if (tabItems.length === 0) {
    return (
      <div className="py-6 px-4 text-center text-slate-400 bg-slate-50/50 italic text-sm border-t border-slate-200">
        - Belum ada detail data -
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-5 bg-slate-50 shadow-inner border-y border-slate-200">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <Tabs items={tabItems} size="small" />
      </div>
    </div>
  )
}
