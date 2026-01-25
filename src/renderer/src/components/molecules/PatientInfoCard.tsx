import { Card, Row, Col } from 'antd'

interface PatientInfoCardProps {
    patientData: {
        queueNumber: number
        patient: {
            medicalRecordNumber: string
            name: string
            gender: string
            age: number
        }
        poli: {
            name: string
        }
        doctor: {
            name: string
        }
    }
}

export const PatientInfoCard = ({ patientData }: PatientInfoCardProps) => {
    return (
        <Card className="mb-4" title="Informasi Pasien">
            <Row gutter={[16, 16]}>
                <Col span={4}>
                    <div className="text-gray-500 text-sm">No. Antrian</div>
                    <div className="text-3xl font-bold text-blue-600">{patientData.queueNumber}</div>
                </Col>
                <Col span={5}>
                    <div className="text-gray-500 text-sm">No. Rekam Medis</div>
                    <div className="text-lg font-semibold">{patientData.patient.medicalRecordNumber}</div>
                </Col>
                <Col span={5}>
                    <div className="text-gray-500 text-sm">Nama Pasien</div>
                    <div className="text-lg font-semibold">{patientData.patient.name}</div>
                </Col>
                <Col span={5}>
                    <div className="text-gray-500 text-sm">Jenis Kelamin / Umur</div>
                    <div className="text-lg">
                        {patientData.patient.gender === 'MALE' || patientData.patient.gender === 'male'
                            ? 'Laki-laki'
                            : 'Perempuan'}{' '}
                        / {patientData.patient.age} tahun
                    </div>
                </Col>
                <Col span={5}>
                    <div className="text-gray-500 text-sm">Poli</div>
                    <div className="text-lg">{patientData.poli.name}</div>
                </Col>
            </Row>
        </Card>
    )
}
