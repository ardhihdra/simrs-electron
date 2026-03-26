import { Modal, Form, Select, Input, Divider } from 'antd'
import { useMemo } from 'react'

interface EmployeeOption {
	id: number
	namaLengkap: string
}

interface SerahkanObatFormValues {
	hubunganPenerima: string
	namaPenerima: string
	penyiapObatId: number
	penyerahObatId: number
}

interface SerahkanObatModalProps {
	open: boolean
	loading: boolean
	employees: EmployeeOption[]
	onSubmit: (values: SerahkanObatFormValues) => void
	onCancel: () => void
}

const HUBUNGAN_OPTIONS = [
	{ value: 'Sendiri', label: 'Sendiri (Pasien)' },
	{ value: 'Suami', label: 'Suami' },
	{ value: 'Istri', label: 'Istri' },
	{ value: 'Anak', label: 'Anak' },
	{ value: 'Orang Tua', label: 'Orang Tua' },
	{ value: 'Saudara', label: 'Saudara' },
	{ value: 'Lainnya', label: 'Lainnya' }
]

export type { SerahkanObatFormValues }

export function SerahkanObatModal({
	open,
	loading,
	employees,
	onSubmit,
	onCancel
}: SerahkanObatModalProps) {
	const [form] = Form.useForm<SerahkanObatFormValues>()

	const hubunganValue = Form.useWatch('hubunganPenerima', form)
	const isSendiri = hubunganValue === 'Sendiri'

	const employeeOptions = useMemo(() => {
		return employees.map((e) => ({
			value: e.id,
			label: e.namaLengkap
		}))
	}, [employees])

	const handleOk = async () => {
		const values = await form.validateFields()
		if (values.hubunganPenerima === 'Sendiri') {
			values.namaPenerima = ''
		}
		onSubmit(values)
	}

	const handleCancel = () => {
		form.resetFields()
		onCancel()
	}

	return (
		<Modal
			title="Serahkan Obat"
			open={open}
			onOk={handleOk}
			onCancel={handleCancel}
			okText="Serahkan"
			cancelText="Batal"
			confirmLoading={loading}
			destroyOnClose
			afterOpenChange={(visible) => {
				if (!visible) {
					form.resetFields()
				}
			}}
		>
			<Form
				form={form}
				layout="vertical"
				initialValues={{
					hubunganPenerima: 'Sendiri',
					namaPenerima: '',
					penyiapObatId: undefined,
					penyerahObatId: undefined
				}}
			>
				<Divider orientation="left" orientationMargin={0} style={{ marginTop: 8 }}>
					Penerima Obat (PIO)
				</Divider>

				<Form.Item
					name="hubunganPenerima"
					label="Obat Diserahkan Kepada"
					rules={[{ required: true, message: 'Pilih hubungan penerima obat' }]}
				>
					<Select
						options={HUBUNGAN_OPTIONS}
						placeholder="Pilih hubungan"
					/>
				</Form.Item>

				<Form.Item
					name="namaPenerima"
					label="Nama Penerima"
					rules={[
						{
							required: !isSendiri,
							message: 'Masukkan nama penerima obat'
						}
					]}
				>
					<Input
						placeholder={isSendiri ? 'Pasien sendiri' : 'Masukkan nama penerima'}
						disabled={isSendiri}
					/>
				</Form.Item>

				<Divider orientation="left" orientationMargin={0}>
					Petugas Farmasi
				</Divider>

				<Form.Item
					name="penyiapObatId"
					label="Penyiap Obat"
					rules={[{ required: true, message: 'Pilih petugas yang menyiapkan obat' }]}
				>
					<Select
						options={employeeOptions}
						placeholder="Pilih petugas penyiap"
						showSearch
						optionFilterProp="label"
					/>
				</Form.Item>

				<Form.Item
					name="penyerahObatId"
					label="Penyerah Obat"
					rules={[{ required: true, message: 'Pilih petugas yang menyerahkan obat' }]}
				>
					<Select
						options={employeeOptions}
						placeholder="Pilih petugas penyerah"
						showSearch
						optionFilterProp="label"
					/>
				</Form.Item>
			</Form>
		</Modal>
	)
}
