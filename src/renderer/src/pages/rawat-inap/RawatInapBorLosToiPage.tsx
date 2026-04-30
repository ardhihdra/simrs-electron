import {
  BarChartOutlined,
  FileTextOutlined,
  FilterOutlined,
  PrinterOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import type { BorLosToiReport } from '@main/rpc/procedure/inpatient-reporting'
import { Button, DatePicker, Empty, Form, Spin, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import React from 'react'
import { ExportButton } from '../../components/molecules/ExportButton'

void React

type DateRangeValue = [Dayjs, Dayjs]

type RawatInapBorLosToiPageProps = {
  report?: BorLosToiReport | null
  loading?: boolean
  onFilter?: (range: DateRangeValue) => void
  onRefresh?: () => void
  initialRange?: DateRangeValue
}

type WardExportRow = BorLosToiReport['wards'][number] & Record<string, unknown>

const formatMetric = (value: number | null | undefined, suffix = '') => {
  if (value === null || value === undefined) return '-'
  return `${value}${suffix}`
}

const metricTone = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'text-[var(--ds-color-text)]'
  if (value > 85) return 'text-[var(--ds-color-warning)]'
  if (value >= 70) return 'text-[var(--ds-color-accent)]'
  return 'text-[var(--ds-color-success)]'
}

const wardColumns: ColumnsType<BorLosToiReport['wards'][number]> = [
  {
    title: 'Bangsal',
    dataIndex: 'wardName',
    key: 'wardName',
    render: (value: string) => <span className="font-semibold text-[var(--ds-color-text)]">{value}</span>
  },
  {
    title: 'Kelas',
    dataIndex: 'classLabel',
    key: 'classLabel',
    render: (value: string) => <Tag>{value}</Tag>
  },
  {
    title: 'BOR',
    dataIndex: 'bor',
    key: 'bor',
    align: 'right',
    render: (value: number) => (
      <div className="flex items-center justify-end gap-[8px]">
        <div className="h-[6px] w-[54px] overflow-hidden rounded-[999px] bg-[var(--ds-color-surface-muted)]">
          <div
            className="h-full rounded-[999px]"
            style={{
              width: `${Math.min(100, value)}%`,
              background:
                value > 85
                  ? 'var(--ds-color-warning)'
                  : value >= 70
                    ? 'var(--ds-color-accent)'
                    : 'var(--ds-color-success)'
            }}
          />
        </div>
        <b className={`font-mono ${metricTone(value)}`}>{formatMetric(value, '%')}</b>
      </div>
    )
  },
  {
    title: 'ALOS',
    dataIndex: 'alos',
    key: 'alos',
    align: 'right',
    render: (value: number | null) => <span className="font-mono">{formatMetric(value)}</span>
  },
  {
    title: 'TOI',
    dataIndex: 'toi',
    key: 'toi',
    align: 'right',
    render: (value: number | null) => <span className="font-mono">{formatMetric(value)}</span>
  },
  {
    title: 'Terisi',
    key: 'occupied',
    align: 'right',
    render: (_, row) => (
      <span className="font-mono">{`${row.occupiedBeds}/${row.totalBeds}`}</span>
    )
  }
]

const dpjpColumns: ColumnsType<BorLosToiReport['dpjpRows'][number]> = [
  {
    title: 'DPJP',
    dataIndex: 'dpjpName',
    key: 'dpjpName',
    render: (value: string) => <span className="text-[12px]">{value}</span>
  },
  {
    title: 'Pasien',
    dataIndex: 'patientCount',
    key: 'patientCount',
    align: 'right',
    render: (value: number) => <b className="font-mono">{value}</b>
  },
  {
    title: 'Avg LOS',
    dataIndex: 'averageLos',
    key: 'averageLos',
    align: 'right',
    render: (value: number | null) => (
      <span className={`font-mono ${value && value > 5 ? 'text-[var(--ds-color-warning)]' : ''}`}>
        {formatMetric(value)}
      </span>
    )
  },
  {
    title: 'Tindakan',
    dataIndex: 'procedureCount',
    key: 'procedureCount',
    align: 'right',
    render: (value: number | null) => <span className="font-mono">{formatMetric(value)}</span>
  }
]

export function RawatInapBorLosToiPage({
  report,
  loading = false,
  onFilter,
  onRefresh,
  initialRange = [dayjs().startOf('month'), dayjs()]
}: RawatInapBorLosToiPageProps) {
  const [form] = Form.useForm<{ dateRange: DateRangeValue }>()
  const periodLabel = report
    ? `${dayjs(report.period.fromDate).format('D MMM YYYY')} - ${dayjs(report.period.toDate).format('D MMM YYYY')}`
    : dayjs().format('MMMM YYYY')
  const exportRows = (report?.wards ?? []) as WardExportRow[]

  const handleFilter = (values: { dateRange?: DateRangeValue }) => {
    if (!values.dateRange) return
    onFilter?.(values.dateRange)
  }

  return (
    <div className="flex flex-col gap-[14px] p-[16px]">
      <div className="flex flex-wrap items-start justify-between gap-[16px]">
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] font-semibold leading-tight text-[var(--ds-color-text)]">
            Laporan BOR / LOS / TOI
          </h1>
          <div className="mt-[4px] text-[13px] text-[var(--ds-color-text-muted)]">
            Rekapitulasi kinerja rawat inap - {periodLabel} - Per bangsal & per DPJP
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-[8px]">
          <ExportButton
            data={exportRows}
            fileName={`laporan-bor-los-toi-${report?.period.fromDate ?? 'awal'}-${report?.period.toDate ?? 'akhir'}`}
            title={`Laporan BOR / LOS / TOI ${periodLabel}`}
            columns={[
              { key: 'wardName', label: 'Bangsal' },
              { key: 'classLabel', label: 'Kelas' },
              { key: 'bor', label: 'BOR (%)' },
              { key: 'alos', label: 'ALOS' },
              { key: 'toi', label: 'TOI' },
              { key: 'bto', label: 'BTO' },
              { key: 'occupiedBeds', label: 'Terisi' },
              { key: 'totalBeds', label: 'Total Bed' },
              { key: 'discharges', label: 'Pasien Keluar' }
            ]}
            buttonLabel="Ekspor Excel"
            formats={['xlsx', 'csv']}
            disabled={!exportRows.length}
          />
          <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
            Cetak
          </Button>
          <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[16px] py-[14px] shadow-[var(--ds-shadow-xs)]">
        <Form
          form={form}
          layout="inline"
          initialValues={{ dateRange: initialRange }}
          onFinish={handleFilter}
          className="flex gap-[10px]"
        >
          <Form.Item name="dateRange" className="!mb-0">
            <DatePicker.RangePicker allowClear={false} />
          </Form.Item>
          <Button htmlType="submit" type="primary" icon={<FilterOutlined />}>
            Filter Periode
          </Button>
        </Form>
      </div>

      {loading && !report ? (
        <div className="grid min-h-[260px] place-items-center rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)]">
          <Spin tip="Memuat laporan rawat inap..." />
        </div>
      ) : !report ? (
        <div className="rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] py-[42px]">
          <Empty description="Laporan belum tersedia" />
        </div>
      ) : (
        <>
          <div className="rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-xs)]">
            <div className="flex flex-wrap items-center gap-x-[32px] gap-y-[14px] px-[16px] py-[14px]">
              {[
                ['BOR RS', formatMetric(report.summary.bor, '%'), `${report.summary.occupiedBeds}/${report.summary.totalBeds} bed terisi`, metricTone(report.summary.bor)],
                ['ALOS', `${formatMetric(report.summary.alos)} hari`, 'standar ideal: 3-5 hari', 'text-[var(--ds-color-text)]'],
                ['TOI', `${formatMetric(report.summary.toi)} hari`, 'standar ideal: 1-3 hari', metricTone(report.summary.toi)],
                ['BTO', `${formatMetric(report.summary.bto)} x`, '', 'text-[var(--ds-color-text)]'],
                ['Total Admisi', String(report.summary.totalAdmissions), 'periode ini', 'text-[var(--ds-color-text)]'],
                ['Total Discharge', String(report.summary.discharges), 'periode ini', 'text-[var(--ds-color-text)]']
              ].map(([label, value, sub, color]) => (
                <div key={label} className="flex min-w-[120px] flex-col">
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--ds-color-text-subtle)]">
                    {label}
                  </span>
                  <b className={`font-mono text-[20px] ${color}`}>{value}</b>
                  {sub ? <span className="text-[10.5px] text-[var(--ds-color-text-muted)]">{sub}</span> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-[14px] xl:grid-cols-2">
            <div className="rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-xs)]">
              <div className="flex items-center gap-[8px] border-b border-[var(--ds-color-border)] px-[16px] py-[12px]">
                <BarChartOutlined className="text-[var(--ds-color-accent)]" />
                <h2 className="m-0 text-[14px] font-semibold text-[var(--ds-color-text)]">BOR per Bangsal</h2>
                <span className="ml-auto text-[11px] text-[var(--ds-color-text-muted)]">{periodLabel}</span>
              </div>
              <Table
                columns={wardColumns}
                dataSource={report.wards}
                pagination={false}
                rowKey={(row) => `${row.wardName}-${row.classLabel}`}
                size="small"
              />
            </div>

            <div className="rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-xs)]">
              <div className="flex items-center gap-[8px] border-b border-[var(--ds-color-border)] px-[16px] py-[12px]">
                <FileTextOutlined className="text-[var(--ds-color-accent)]" />
                <h2 className="m-0 text-[14px] font-semibold text-[var(--ds-color-text)]">Kinerja per DPJP</h2>
                <span className="ml-auto text-[11px] text-[var(--ds-color-text-muted)]">{periodLabel}</span>
              </div>
              <Table
                columns={dpjpColumns}
                dataSource={report.dpjpRows}
                pagination={false}
                rowKey="dpjpName"
                size="small"
              />
            </div>
          </div>

          <div className="rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] shadow-[var(--ds-shadow-xs)]">
            <div className="flex items-center gap-[8px] border-b border-[var(--ds-color-border)] px-[16px] py-[12px]">
              <BarChartOutlined className="text-[var(--ds-color-accent)]" />
              <h2 className="m-0 text-[14px] font-semibold text-[var(--ds-color-text)]">Tren BOR Harian</h2>
              <span className="ml-auto text-[11px] text-[var(--ds-color-text-muted)]">{periodLabel}</span>
            </div>
            <div className="overflow-x-auto p-[16px]">
              <div className="flex h-[92px] min-w-[620px] items-end gap-[4px]">
                {report.dailyBorTrend.map((item) => (
                  <div key={item.date} className="flex flex-1 flex-col items-center gap-[3px]">
                    <span className="font-mono text-[9px] text-[var(--ds-color-text-subtle)]">{item.bor}</span>
                    <div
                      className="w-full rounded-t-[2px]"
                      style={{
                        minHeight: 4,
                        height: Math.max(4, Math.round((Math.min(100, item.bor) / 100) * 64)),
                        background:
                          item.bor > 85 ? 'var(--ds-color-warning)' : 'var(--ds-color-accent)'
                      }}
                    />
                    <span className="font-mono text-[9px] text-[var(--ds-color-text-subtle)]">{item.dayLabel}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
