import { Card, Space, Alert, Tag, Radio, Divider } from 'antd'
import { CheckCircleFilled, WarningFilled } from '@ant-design/icons'
import { useMemo } from 'react'

export interface TelaahResults {
	// 1. Telaah Resep
	kejelasanResep: boolean;
	benarNamaPasien: boolean;
	benarNamaObat: boolean;
	benarDosis: boolean;
	benarWaktuFrekuensi: boolean;
	benarCaraPemberian: boolean;
	tidakAdaPolifarmasi: boolean;
	tidakAdaDuplikasi: boolean;
	tidakAdaInteraksi: boolean;
	// 2. Verifikasi Obat
	verifBenarObat: boolean;
	verifBenarWaktu: boolean;
	verifBenarFrekuensi: boolean;
	verifBenarDosis: boolean;
	verifBenarRute: boolean;
	verifBenarIdentitas: boolean;
}

export const defaultTelaahResults: TelaahResults = {
	kejelasanResep: true,
	benarNamaPasien: true,
	benarNamaObat: true,
	benarDosis: true,
	benarWaktuFrekuensi: true,
	benarCaraPemberian: true,
	tidakAdaPolifarmasi: true,
	tidakAdaDuplikasi: true,
	tidakAdaInteraksi: true,
	verifBenarObat: true,
	verifBenarWaktu: true,
	verifBenarFrekuensi: true,
	verifBenarDosis: true,
	verifBenarRute: true,
	verifBenarIdentitas: true,
}

const telaahResepCriteria = [
	{ key: 'kejelasanResep', label: '1. Kejelasan Tulisan :' },
	{ key: 'benarNamaPasien', label: '2. Benar Nama Pasien :' },
	{ key: 'benarNamaObat', label: '3. Benar nama obat :' },
	{ key: 'benarDosis', label: '4. Benar dosis :' },
	{ key: 'benarWaktuFrekuensi', label: '5. Benar waktu dan frekuensi pemberian :' },
	{ key: 'benarCaraPemberian', label: '6. Benar cara pemberian :' },
	{ key: 'tidakAdaPolifarmasi', label: '7. Ada tidaknya polifarmasi :', invert: true },
	{ key: 'tidakAdaDuplikasi', label: '8. Ada tidaknya duplikasi :', invert: true },
	{ key: 'tidakAdaInteraksi', label: '9. Interaksi obat yang mungkin terjadi :', invert: true },
]

const verifikasiObatCriteria = [
	{ key: 'verifBenarObat', label: '1. Benar Obat :' },
	{ key: 'verifBenarWaktu', label: '2. Benar Waktu :' },
	{ key: 'verifBenarFrekuensi', label: '3. Benar Frekuensi :' },
	{ key: 'verifBenarDosis', label: '4. Benar Dosis :' },
	{ key: 'verifBenarRute', label: '5. Benar Rute :' },
	{ key: 'verifBenarIdentitas', label: '6. Benar identitas pasien :' },
]

interface Props {
	isInternal: boolean;
	results: TelaahResults;
	onChange: (results: TelaahResults) => void;
}

export const TelaahAdministrasiForm = ({ isInternal, results, onChange }: Props) => {
	const allCriteriaMet = useMemo(() => {
		return Object.values(results).every(v => v === true)
	}, [results])

	const renderCriteria = (c: { key: string; label: string; invert?: boolean }) => {
		const val = results[c.key as keyof TelaahResults]
		// mapping: val true -> "Ya" (kecuali invert), val false -> "Tidak" (kecuali invert)
		// Jika invert=true: Radio "Ya" -> val=false, Radio "Tidak" -> val=true
		const radioVal = c.invert ? !val : val

		return (
			<div key={c.key} className="flex justify-between items-center py-1 px-2 border-b border-gray-50 last:border-0">
				<span className="text-gray-700 text-sm">{c.label}</span>
				<Radio.Group 
					size="small"
					value={radioVal}
					onChange={(e) => {
						const nextVal = c.invert ? !e.target.value : e.target.value
						onChange({ ...results, [c.key]: nextVal })
					}}
				>
					<Radio value={true}>Ya</Radio>
					<Radio value={false}>Tidak</Radio>
				</Radio.Group>
			</div>
		)
	}

	return (
		<Card 
			title={
				<Space>
					<span>Telaah Administrasi & Verifikasi Obat</span>
					{isInternal && <Tag color="blue" icon={<CheckCircleFilled />}>Internal</Tag>}
				</Space>
			}
			size="small"
			styles={{ body: { padding: '16px' } }}
		>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
				<div>
					<Divider orientation="left" plain style={{ margin: '0 0 12px 0' }}>
						<span className="font-bold text-gray-800">Telaah Resep</span>
					</Divider>
					<div className="flex flex-col">
						{telaahResepCriteria.map(renderCriteria)}
					</div>
				</div>
				<div>
					<Divider orientation="left" plain style={{ margin: '0 0 12px 0' }}>
						<span className="font-bold text-gray-800 uppercase">Verifikasi Obat</span>
					</Divider>
					<div className="flex flex-col">
						{verifikasiObatCriteria.map(renderCriteria)}
					</div>
				</div>
			</div>

			{!allCriteriaMet && (
				<div className="mt-6">
					<Alert
						message="Pemeriksaan Manual Diperlukan"
						description="Pastikan semua kriteria telaah administrasi dan verifikasi obat telah diperiksa dan dipenuhi."
						type="warning"
						showIcon
						icon={<WarningFilled />}
					/>
				</div>
			)}
		</Card>
	)
}
