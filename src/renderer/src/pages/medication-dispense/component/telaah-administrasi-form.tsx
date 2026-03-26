import { Card, Checkbox, Space, Alert, Tag } from 'antd'
import { CheckCircleFilled, WarningFilled } from '@ant-design/icons'
import { useMemo, useEffect } from 'react'

export interface TelaahResults {
	kejelasanResep: boolean;
	tepatPasien: boolean;
	tepatObat: boolean;
	tepatDosis: boolean;
	tepatWaktu: boolean;
	tepatRute: boolean;
	identitasDokter: boolean;
}

export const defaultTelaahResults: TelaahResults = {
	kejelasanResep: false,
	tepatPasien: false,
	tepatObat: false,
	tepatDosis: false,
	tepatWaktu: false,
	tepatRute: false,
	identitasDokter: false
}

export const telaahCriteria = [
	{ key: 'kejelasanResep', label: 'Kejelasan Tulisan Resep' },
	{ key: 'tepatPasien', label: 'Tepat Pasien' },
	{ key: 'tepatObat', label: 'Tepat Obat' },
	{ key: 'tepatDosis', label: 'Tepat Dosis' },
	{ key: 'tepatWaktu', label: 'Tepat Waktu/Frekuensi' },
	{ key: 'tepatRute', label: 'Tepat Rute' },
	{ key: 'identitasDokter', label: 'Identitas Dokter' }
] as const

interface Props {
	isInternal: boolean;
	results: TelaahResults;
	onChange: (results: TelaahResults) => void;
}

export const TelaahAdministrasiForm = ({ isInternal, results, onChange }: Props) => {
	const allCriteriaMet = useMemo(() => {
		return Object.values(results).every(v => v === true)
	}, [results])

	useEffect(() => {
		if (isInternal) {
			onChange({
				kejelasanResep: true,
				tepatPasien: true,
				tepatObat: true,
				tepatDosis: true,
				tepatWaktu: true,
				tepatRute: true,
				identitasDokter: true
			})
		}
	}, [isInternal])

	return (
		<Card 
			title={
				<Space>
					<span>Telaah Administrasi & Farmasetik</span>
					{isInternal && <Tag color="success" icon={<CheckCircleFilled />}>Otomatis (Internal)</Tag>}
				</Space>
			}
			size="small"
		>
			{isInternal ? (
				<Alert
					message="Validasi Otomatis"
					description="Resep ini berasal dari sistem internal SIMRS dan telah divalidasi secara otomatis melalui integrasi E-Resep."
					type="success"
					showIcon
				/>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-8 p-2">
					{telaahCriteria.map(c => (
						<div key={c.key} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
							<Checkbox 
								checked={results[c.key as keyof TelaahResults]}
								onChange={(e) => onChange({ ...results, [c.key]: e.target.checked })}
							>
								<span className="text-gray-700">{c.label}</span>
							</Checkbox>
						</div>
					))}
				</div>
			)}
			{!allCriteriaMet && !isInternal && (
				<div className="mt-4">
					<Alert
						message="Perhatian"
						description="Semua kriteria telaah administrasi harus dipenuhi sebelum obat dapat diserahkan."
						type="warning"
						showIcon
						icon={<WarningFilled />}
					/>
				</div>
			)}
		</Card>
	)
}
