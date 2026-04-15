import { forwardRef } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/id'
import type { BillingComputedData, BillingLetterMeta } from './billing-types'

dayjs.locale('id')

interface BillingTagihanLetterProps {
  computedData: BillingComputedData
  letterMeta?: BillingLetterMeta
  warnings?: string[]
}

const formatCurrency = (value: number): string => `Rp ${Number(value || 0).toLocaleString('id-ID')}`

const safe = (value?: string | null): string => {
  const text = String(value || '').trim()
  return text || '-'
}

export const BillingTagihanLetter = forwardRef<HTMLDivElement, BillingTagihanLetterProps>(
  ({ computedData, letterMeta, warnings = [] }, ref) => {
    const printedAt = dayjs().format('DD MMMM YYYY HH:mm')
    const year = dayjs().format('YYYY')
    const warningList = Array.from(new Set((warnings || []).filter(Boolean)))

    return (
      <div
        ref={ref}
        className="bg-white p-10 max-w-[210mm] mx-auto text-black"
        style={{ fontFamily: 'Times New Roman, serif', fontSize: '12pt', lineHeight: 1.5 }}
      >
        <div className="flex items-center justify-between border-b-4 border-double border-black pb-4 mb-6">
          <div className="w-20 h-20 bg-gray-100 flex items-center justify-center text-xs text-gray-500 border rounded">
            Logo RS
          </div>
          <div className="text-center flex-1 px-4">
            <div className="text-xl font-bold uppercase tracking-widest">
              Rumah Sakit Rahayu Sentosa
            </div>
            <div className="text-sm mt-1">
              Cigagade, Kec. Balubur Limbangan, Kabupaten Garut, Jawa Barat 44186
            </div>
            <div className="text-sm">Telp: (0262) 123-4567 | Email: info@rs-rahayusentosa.com</div>
          </div>
          <div className="w-20" />
        </div>

        <div className="text-center mb-6">
          <div className="text-lg font-bold uppercase underline tracking-wider">
            Rincian Tagihan Operasi
          </div>
          <div className="text-sm mt-1">
            No: {safe(letterMeta?.transactionCode)}/TAGIHAN-OK/{year}
          </div>
        </div>

        <div className="mb-5 pl-2">
          <span className="font-bold underline block mb-2">Metadata Dokumen:</span>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '200px', paddingBottom: '4px' }}>Nomor Transaksi OK</td>
                <td style={{ width: '16px' }}>:</td>
                <td className="font-bold">{safe(letterMeta?.transactionCode)}</td>
              </tr>
              <tr>
                <td style={{ paddingBottom: '4px' }}>Tanggal Cetak</td>
                <td>:</td>
                <td>{printedAt}</td>
              </tr>
              <tr>
                <td>Encounter</td>
                <td>:</td>
                <td>{safe(letterMeta?.encounterId)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-6 pl-2">
          <span className="font-bold underline block mb-2">Identitas Pasien & Operasi:</span>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '200px', paddingBottom: '4px' }}>Nama Pasien</td>
                <td style={{ width: '16px' }}>:</td>
                <td>{safe(letterMeta?.patientName)}</td>
              </tr>
              <tr>
                <td style={{ paddingBottom: '4px' }}>No. Rekam Medis</td>
                <td>:</td>
                <td>{safe(letterMeta?.medicalRecordNumber)}</td>
              </tr>
              <tr>
                <td style={{ paddingBottom: '4px' }}>DPJP</td>
                <td>:</td>
                <td>{safe(letterMeta?.dpjpName)}</td>
              </tr>
              <tr>
                <td style={{ paddingBottom: '4px' }}>Ruang OK</td>
                <td>:</td>
                <td>{safe(letterMeta?.operatingRoomName)}</td>
              </tr>
              <tr>
                <td>Tanggal / Jam Rencana</td>
                <td>:</td>
                <td>
                  {safe(letterMeta?.plannedDate)} / {safe(letterMeta?.plannedTime)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-6">
          <div className="font-bold mb-2">Rincian Tarif Paket + BHP Tambahan</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>
                  Kategori
                </th>
                <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>
                  Paket
                </th>
                <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>
                  Keterangan
                </th>
                <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>
                  Kelas
                </th>
                <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>
                  Qty
                </th>
                <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>
                  Satuan
                </th>
                <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>
                  Harga
                </th>
                <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {computedData.chargeRows.map((row) => (
                <tr key={row.key}>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>{row.kategori}</td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>{row.paket}</td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>{row.keterangan}</td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>{row.kelas}</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>
                    {row.jumlah}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px' }}>{row.satuan}</td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>
                    {formatCurrency(row.harga)}
                  </td>
                  <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>
                    {formatCurrency(row.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-6">
          <div className="font-bold mb-2">Rincian Komponen Tarif (Transparansi)</div>
          {computedData.komponenRows.length === 0 ? (
            <div style={{ border: '1px solid #000', padding: '10px' }}>
              - Komponen tarif belum tersedia -
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>
                    Paket
                  </th>
                  <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>
                    Kelas
                  </th>
                  <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>
                    Tindakan
                  </th>
                  <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>
                    Komponen
                  </th>
                  <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>
                    Nominal
                  </th>
                </tr>
              </thead>
              <tbody>
                {computedData.komponenRows.map((row) => (
                  <tr key={row.key}>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>{row.paket}</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>{row.kelas}</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>{row.tindakan}</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>{row.komponen}</td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>
                      {formatCurrency(row.nominal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mb-6 flex justify-end">
          <table style={{ minWidth: '360px', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '6px' }}>Total Tarif Paket</td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>
                  {formatCurrency(computedData.totals.tarifPaketTotal)}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '6px' }}>Total BHP Tambahan</td>
                <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>
                  {formatCurrency(computedData.totals.bhpTambahanTotal)}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 700 }}>
                  Grand Total
                </td>
                <td
                  style={{
                    border: '1px solid #000',
                    padding: '6px',
                    textAlign: 'right',
                    fontWeight: 700
                  }}
                >
                  {formatCurrency(computedData.totals.grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {warningList.length > 0 && (
          <div className="mb-8">
            <div className="font-bold mb-1">Catatan Validasi Tarif:</div>
            <ol className="pl-6 mb-0" style={{ listStyleType: 'decimal' }}>
              {warningList.map((warning, idx) => (
                <li key={`${warning}-${idx}`}>{warning}</li>
              ))}
            </ol>
          </div>
        )}

        <div className="flex justify-between items-end pt-8">
          <div className="text-center" style={{ minWidth: '220px' }}>
            <div className="mb-16">Petugas Billing,</div>
            <div className="font-bold underline">( {safe(letterMeta?.createdByName)} )</div>
          </div>
          <div className="text-center" style={{ minWidth: '220px' }}>
            <div className="mb-1">Garut, {dayjs().format('DD MMMM YYYY')}</div>
            <div className="mb-12">Verifikator / DPJP,</div>
            <div className="font-bold underline">
              ( {safe(letterMeta?.verifiedByName || letterMeta?.dpjpName)} )
            </div>
          </div>
        </div>
      </div>
    )
  }
)

BillingTagihanLetter.displayName = 'BillingTagihanLetter'
