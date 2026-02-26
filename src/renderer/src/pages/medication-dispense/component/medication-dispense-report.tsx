import { useMemo, useState } from 'react'
import { Button, DatePicker, Table } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'

const { RangePicker } = DatePicker

interface QuantityInfo {
	value?: number
	unit?: string
}

interface MedicationInfo {
	name?: string
}

interface MedicationDispenseForReport {
	id?: number
	status?: string
	whenHandedOver?: string | Date | null
	quantity?: QuantityInfo | null
	medication?: MedicationInfo
}

interface MedicationDispenseListResultForReport {
	success: boolean
	data?: MedicationDispenseForReport[]
	pagination?: {
		page: number
		limit: number
		total: number
		pages: number
	}
	error?: string
}

interface ReportRow {
	key: string
	date: string
	medicineName: string
	unit?: string
	totalCompleted: number
	totalReturn: number
	net: number
}

function MedicationDispenseReport() {
	const [range, setRange] = useState<[Dayjs, Dayjs] | null>(() => {
		const today = dayjs()
		return [today.startOf('day'), today.endOf('day')]
	})

	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ['medicationDispense', 'report'],
		queryFn: async () => {
			const api = window.api?.query as {
				medicationDispense?: {
					list: (args?: { limit?: number }) => Promise<MedicationDispenseListResultForReport>
				}
			}
			const fn = api?.medicationDispense?.list
			if (!fn) {
				throw new Error('API MedicationDispense tidak tersedia.')
			}
			return fn({ limit: 1000 })
		}
	})

	const rows: ReportRow[] = useMemo(() => {
		const list: MedicationDispenseForReport[] = Array.isArray(data?.data) ? data?.data ?? [] : []
		if (!range) return []
		const [start, end] = range
		const map = new Map<string, ReportRow>()

		list.forEach((item) => {
			if (!item.whenHandedOver) return
			const dt = dayjs(item.whenHandedOver)
			if (!dt.isValid()) return
			if (dt.isBefore(start, 'day') || dt.isAfter(end, 'day')) return

			const qty = item.quantity?.value
			if (typeof qty !== 'number') return

			const status = item.status
			if (status !== 'completed' && status !== 'entered-in-error') return

			const dateKey = dt.format('YYYY-MM-DD')
			const medicineName = item.medication?.name ?? 'Tidak diketahui'
			const unit = item.quantity?.unit
			const key = `${dateKey}-${medicineName}-${unit ?? ''}`

			const existing: ReportRow = map.get(key) ?? {
				key,
				date: dateKey,
				medicineName,
				unit,
				totalCompleted: 0,
				totalReturn: 0,
				net: 0
			}

			if (status === 'completed') {
				existing.totalCompleted += qty
			} else if (status === 'entered-in-error') {
				existing.totalReturn += qty
			}
			existing.net = existing.totalCompleted - existing.totalReturn
			map.set(key, existing)
		})

		return Array.from(map.values()).sort((a, b) => {
			const dateCompare = a.date.localeCompare(b.date)
			if (dateCompare !== 0) return dateCompare
			return a.medicineName.localeCompare(b.medicineName)
		})
	}, [data?.data, range])

	const grandTotal = useMemo(() => {
		return rows.reduce(
			(acc, row) => ({
				totalCompleted: acc.totalCompleted + row.totalCompleted,
				totalReturn: acc.totalReturn + row.totalReturn,
				net: acc.net + row.net
			}),
			{ totalCompleted: 0, totalReturn: 0, net: 0 }
		)
	}, [rows])

	const columns = [
		{
			title: 'Tanggal',
			dataIndex: 'date',
			key: 'date',
			render: (val: string) => dayjs(val).format('DD/MM/YYYY')
		},
		{
			title: 'Nama Obat',
			dataIndex: 'medicineName',
			key: 'medicineName'
		},
		{
			title: 'Satuan',
			dataIndex: 'unit',
			key: 'unit'
		},
		{
			title: 'Qty Keluar',
			dataIndex: 'totalCompleted',
			key: 'totalCompleted'
		},
		{
			title: 'Qty Return',
			dataIndex: 'totalReturn',
			key: 'totalReturn'
		},
		{
			title: 'Qty Net',
			dataIndex: 'net',
			key: 'net'
		}
	]

	const setToday = () => {
		const today = dayjs()
		setRange([today.startOf('day'), today.endOf('day')])
	}

	const setLast7Days = () => {
		const end = dayjs().endOf('day')
		const start = dayjs().subtract(6, 'day').startOf('day')
		setRange([start, end])
	}

	return (
		<div>
			<div className="flex items-center justify-between mb-4 flex-wrap gap-3">
				<h2 className="text-2xl font-bold">Laporan Harian Penyerahan Obat</h2>
				<div className="flex items-center gap-2 flex-wrap">
					<RangePicker
						value={range}
						onChange={(value) => {
							if (!value || value.length !== 2 || !value[0] || !value[1]) {
								setRange(null)
								return
							}
							setRange([value[0].startOf('day'), value[1].endOf('day')])
						}}
					/>
					<Button onClick={setToday}>Hari ini</Button>
					<Button onClick={setLast7Days}>7 hari terakhir</Button>
					<Button onClick={() => refetch()} loading={isLoading}>
						Refresh
					</Button>
				</div>
			</div>
			{isError && <div className="text-red-500">Gagal memuat data laporan</div>}
			<div className="mb-2 text-sm text-gray-600">
				<span className="mr-4">Total baris: {rows.length}</span>
				<span className="mr-4">Total keluar: {grandTotal.totalCompleted}</span>
				<span className="mr-4">Total return: {grandTotal.totalReturn}</span>
				<span>Net: {grandTotal.net}</span>
			</div>
			<Table
				dataSource={rows}
				columns={columns}
				rowKey="key"
				size="small"
				loading={isLoading}
				pagination={{ pageSize: 50 }}
			/>
		</div>
	)
}

export default MedicationDispenseReport

