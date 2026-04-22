import { Modal, Descriptions, Tag, Divider, Row, Col, Card } from 'antd'
import { CheckCircleFilled, UserOutlined, ContactsOutlined } from '@ant-design/icons'
import type { DispenseItemRow } from '../types'
import { extractTelaahResults } from '../utils'

interface Props {
  open: boolean
  onClose: () => void
  record: DispenseItemRow
  employeeNameById: Map<number, string>
}

export function DispenseReviewDetail({ open, onClose, record, employeeNameById }: Props) {
  console.log('[Renderer:DispenseReviewDetail] Record:', record)
  const telaah = extractTelaahResults(record)

  const renderCriteria = (label: string, value?: boolean) => (
    <div className="flex items-center justify-between py-1 px-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      {value ? (
        <Tag color="#22c55e" className="m-0 font-medium px-2 shadow-none border-0" icon={<CheckCircleFilled />}>Ya</Tag>
      ) : (
        <Tag bordered={false} className="bg-gray-100 text-gray-500 m-0 px-2 shadow-none">Tidak</Tag>
      )}
    </div>
  )

  const getStaffName = (id?: number | null) => {
    if (!id) return '-'
    return employeeNameById.get(id) || `ID: ${id}`
  }

  return (
    <Modal
      title={`Review Detail Dispense: ${record.medicineName}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      styles={{ body: { padding: '24px' } }}
    >
      <Row gutter={[24, 24]}>
        <Col span={24}>
           <Card title={<span className="text-sm font-bold"><ContactsOutlined className="mr-2" />Hasil Telaah</span>} size="small" className="bg-gray-50/50">
            <Row gutter={[16, 16]}>
              <Col span={12} md={6}>
                <div className="font-bold text-[10px] uppercase opacity-50 mb-2">Administrasi</div>
                {renderCriteria('Tgl Resep', telaah?.tanggalResep)}
                {renderCriteria('Paraf Dr', telaah?.parafDokter)}
                {renderCriteria('Id Pasien', telaah?.identitasPasien)}
                {renderCriteria('BB/TB', telaah?.bbTb)}
              </Col>
              <Col span={12} md={6}>
                <div className="font-bold text-[10px] uppercase opacity-50 mb-2">Farmasetik</div>
                {renderCriteria('Nama Obat', telaah?.namaObat)}
                {renderCriteria('Kekuatan', telaah?.kekuatan)}
                {renderCriteria('Jumlah', telaah?.jumlahObat)}
                {renderCriteria('Signa', telaah?.signa)}
              </Col>
              <Col span={12} md={6}>
                <div className="font-bold text-[10px] uppercase opacity-50 mb-2">Klinis</div>
                {renderCriteria('Duplikasi', telaah?.duplikasi)}
                {renderCriteria('Kontraind.', telaah?.kontraindikasi)}
                {renderCriteria('Interaksi', telaah?.interaksi)}
                {renderCriteria('Dosis', telaah?.dosisLazim)}
              </Col>
              <Col span={12} md={6}>
                <div className="font-bold text-[10px] uppercase opacity-50 mb-2">Edukasi</div>
                {renderCriteria('Identitas', telaah?.infoKesesuaianIdentitas)}
                {renderCriteria('Info Obat', telaah?.infoNamaDosisJumlah)}
                {renderCriteria('Cara Guna', telaah?.infoCaraGuna)}
                {renderCriteria('ESO', telaah?.infoEso)}
              </Col>
            </Row>
            {telaah?.keterangan && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <div>
                  <div className="text-[10px] uppercase font-bold opacity-50 mb-1">Keterangan Tindak Lanjut</div>
                  <div className="text-sm p-2 bg-white rounded border border-gray-100">{telaah.keterangan}</div>
                </div>
              </>
            )}
           </Card>
        </Col>

        <Col span={24}>
           <Card title={<span className="text-sm font-bold"><UserOutlined className="mr-2" />Petugas & Penerima</span>} size="small" className="bg-gray-50/50">
            <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
              <Descriptions.Item label="Penyiap Obat">{getStaffName(record.penyiapObatId)}</Descriptions.Item>
              <Descriptions.Item label="Pelabel Obat">{getStaffName(record.pelabelObatId)}</Descriptions.Item>
              <Descriptions.Item label="Penyerah Obat">{getStaffName(record.penyerahObatId)}</Descriptions.Item>
              <Descriptions.Item label="Penerima Obat">
                {record.hubunganPenerima === 'Sendiri' ? 'Sendiri (Pasien)' : `${record.namaPenerima} (${record.hubunganPenerima})`}
              </Descriptions.Item>
            </Descriptions>
           </Card>
        </Col>
      </Row>
    </Modal>
  )
}
