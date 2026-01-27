import { SelectAsync } from '@renderer/components/dynamic/SelectAsync'
import { Input, Modal, Select } from 'antd'
import { useState } from 'react'

interface RujukanModalProps {
  visible: boolean
  loading?: boolean
  onConfirm: (referralType: string) => void
  onCancel: () => void
}

export function RujukanModal({ visible, loading, onConfirm, onCancel }: RujukanModalProps) {
  const [referralType, setReferralType] = useState<string>('Internal')

  return (
    <Modal
      open={visible}
      title="Pilih Jenis Rujukan"
      okText="Simpan"
      cancelText="Batal"
      confirmLoading={loading}
      onOk={() => onConfirm(referralType)}
      onCancel={onCancel}
    >
      <div className="py-4">
        <label className="block mb-2 font-medium">Jenis Rujukan</label>
        <Select
          className="w-full"
          value={referralType}
          onChange={setReferralType}
          options={[
            { value: 'Internal', label: 'Internal' },
            { value: 'Eksternal', label: 'Eksternal' }
          ]}
        />
        {referralType === 'Internal' && (
          <div className="mt-4">
            <label className="block mb-2 font-medium">Pilih Poli</label>
            <SelectAsync entity="poli" className="w-full" placeHolder="Pilih poli tujuan" />
          </div>
        )}
        {referralType === 'Eksternal' && (
          <div className="mt-4">
            <label className="block mb-2 font-medium">Pilih Tujuan</label>
            <Select
              options={[
                {
                  value: 'RSUPN Dr. Cipto Mangunkusumo (RSCM)',
                  label: 'RSUPN Dr. Cipto Mangunkusumo (RSCM)'
                },
                { value: 'RSPAD Gatot Soebroto', label: 'RSPAD Gatot Soebroto' },
                { value: 'RS Kanker Dharmais', label: 'RS Kanker Dharmais' },
                {
                  value: 'RS Jantung dan Pembuluh Darah Harapan Kita',
                  label: 'RS Jantung dan Pembuluh Darah Harapan Kita'
                },
                {
                  value: 'RS Anak dan Bunda Harapan Kita',
                  label: 'RS Anak dan Bunda Harapan Kita'
                },
                { value: 'RSUP Fatmawati', label: 'RSUP Fatmawati' },
                { value: 'RSUP Persahabatan', label: 'RSUP Persahabatan' },
                {
                  value: 'RS Penyakit Infeksi Sulianti Saroso',
                  label: 'RS Penyakit Infeksi Sulianti Saroso'
                },
                { value: 'RS Otak Nasional', label: 'RS Otak Nasional' },
                {
                  value: 'RS Ortopedi Prof. Dr. R. Soeharso',
                  label: 'RS Ortopedi Prof. Dr. R. Soeharso'
                },
                { value: 'RSUP Dr. Kariadi (Semarang)', label: 'RSUP Dr. Kariadi (Semarang)' },
                {
                  value: 'RSUP Dr. Sardjito (Yogyakarta)',
                  label: 'RSUP Dr. Sardjito (Yogyakarta)'
                },
                {
                  value: 'RSUP Dr. Hasan Sadikin (Bandung)',
                  label: 'RSUP Dr. Hasan Sadikin (Bandung)'
                },
                { value: 'RSUP Sanglah (Denpasar)', label: 'RSUP Sanglah (Denpasar)' },
                {
                  value: 'RSUP Dr. Wahidin Sudirohusodo (Makassar)',
                  label: 'RSUP Dr. Wahidin Sudirohusodo (Makassar)'
                }
              ]}
              className="w-full"
              placeholder="Pilih Rumah sakit tujuan"
            />
          </div>
        )}
        {referralType && (
          <div className="mt-4">
            <label className="block mb-2 font-medium">Referal Code</label>
            <Input type="text" placeholder="Masukkan referal code" />
          </div>
        )}
      </div>
    </Modal>
  )
}
