import { message } from 'antd'
import dayjs from 'dayjs'

export interface MedicationLabelItem {
    medicineName?: string
    quantity?: number
    unit?: string
    instruksi?: string
    expiryDate?: string
    batch?: string
    caraPenyimpanan?: string
}

export interface PrintMedicationLabelParams {
    patientName: string
    items: MedicationLabelItem[]
}

export function printMedicationLabels({ patientName, items }: PrintMedicationLabelParams) {
    const labelLinesList: string[][] = items
        .map((item) => {
            const name = item.medicineName ?? 'Obat'
            const quantityValue = typeof item.quantity === 'number' ? item.quantity : 0
            const unitLabel = item.unit ?? ''
            const instructionText = item.instruksi ?? ''
            const expiryDate = item.expiryDate
            const batch = item.batch

            const lines: string[] = []
            if (patientName.trim().length > 0) {
                lines.push(`Pasien: ${patientName}`)
            }
            lines.push(`Nama Obat: ${name}`)
            lines.push(`Qty: ${Math.round(quantityValue)} ${unitLabel}`.trim())
            
            if (instructionText.trim().length > 0) {
                lines.push(`Instruksi: ${instructionText}`)
            }

            const batchExpParts: string[] = []
            if (batch && batch.trim().length > 0) {
                batchExpParts.push(`Batch: ${batch}`)
            }
            if (expiryDate && expiryDate.trim().length > 0) {
                const formattedExp = dayjs(expiryDate).isValid() 
                    ? dayjs(expiryDate).format('DD/MM/YYYY') 
                    : expiryDate
                batchExpParts.push(`Exp: ${formattedExp}`)
            }

            if (batchExpParts.length > 0) {
                lines.push(batchExpParts.join(' | '))
            }

            if (item.caraPenyimpanan && item.caraPenyimpanan.trim().length > 0) {
                lines.push(`Penyimpanan: ${item.caraPenyimpanan}`)
            }
            
            return lines
        })
        .filter((lines) => lines.length > 0)

    if (labelLinesList.length === 0) {
        message.info('Data label obat tidak tersedia')
        return
    }

    const labelBlocks = items
        .map((item) => {
            const name = item.medicineName ?? 'Obat'
            const quantityValue = typeof item.quantity === 'number' ? item.quantity : 0
            const unitLabel = item.unit ?? ''
            const instructionText = item.instruksi ?? ''
            const expiryDate = item.expiryDate
            const batch = item.batch
            const penyimpanan = item.caraPenyimpanan

            const formattedExp = expiryDate && dayjs(expiryDate).isValid() 
                ? dayjs(expiryDate).format('DD/MM/YYYY') 
                : expiryDate || '-'

            return `
<div class="label-container">
    <div class="label-top">
        <div class="patient-info">
            <span class="tag">PASIEN</span>
            <span class="patient-name">${patientName.toUpperCase()}</span>
        </div>
    </div>
    
    <div class="label-mid">
        <div class="medicine-info">
            <div class="medicine-name">${name.toUpperCase()}</div>
            <div class="medicine-quantity">${Math.round(quantityValue)} ${unitLabel}</div>
        </div>

        <div class="signa-box">
            <div class="signa-label">ATURAN PAKAI</div>
            <div class="signa-content">${instructionText || '-'}</div>
        </div>
    </div>

    <div class="label-bottom">
        <div class="bottom-item">
            <span class="bottom-label">Penyimpanan:</span>
            <span class="bottom-value">${penyimpanan || '-'}</span>
        </div>
        <div class="bottom-item">
            <span class="bottom-label">Exp:</span>
            <span class="bottom-value">${formattedExp}</span>
        </div>
    </div>
</div>`
        })
        .join('')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Label Obat</title>
  <style>
    @page { margin: 0; }
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      font-size: 11px; 
      margin: 0;
      padding: 0;
      color: #333;
      background: #fff;
    }
    
    .label-container { 
      width: 280px; 
      height: 150px;
      padding: 10px;
      margin: 0 auto 20px;
      border: 1px solid #000;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      page-break-after: always;
      position: relative;
      overflow: hidden;
    }

    .label-top {
      border-bottom: 1px solid #eee;
      padding-bottom: 5px;
      margin-bottom: 8px;
    }
    
    .tag {
      font-size: 7px;
      font-weight: 800;
      color: #fff;
      background: #000;
      padding: 1px 4px;
      border-radius: 2px;
      margin-right: 5px;
      vertical-align: middle;
    }
    
    .patient-name {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .label-mid {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .medicine-info {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    
    .medicine-name {
      font-size: 13px;
      font-weight: 800;
      color: #000;
      max-width: 190px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .medicine-quantity {
      font-size: 10px;
      font-weight: 600;
      color: #666;
    }

    .signa-box {
      background: #f4f4f4;
      border-radius: 4px;
      padding: 6px;
      text-align: center;
      border: 1px solid #ddd;
    }
    
    .signa-label {
      font-size: 7px;
      font-weight: 800;
      color: #888;
      margin-bottom: 2px;
      letter-spacing: 1px;
    }
    
    .signa-content {
      font-size: 15px;
      font-weight: 900;
      color: #000;
      line-height: 1.2;
    }

    .label-bottom {
      margin-top: 8px;
      border-top: 1px dashed #ccc;
      padding-top: 5px;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
    }
    
    .bottom-item {
      display: flex;
      gap: 3px;
    }
    
    .bottom-label {
      color: #777;
      font-weight: 600;
    }
    
    .bottom-value {
      font-weight: 700;
      color: #000;
    }

    @media print {
      body { padding: 0; }
      .label-container { 
        margin: 0; 
        border: 1px solid #000;
      }
    }
  </style>
</head>
<body>
  ${labelBlocks}
</body>
</html>`

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const iframeWindow = iframe.contentWindow
    if (!iframeWindow) {
        message.info('Gagal menyiapkan tampilan cetak semua label')
        iframe.remove()
        return
    }

    const doc = iframeWindow.document
    doc.open()
    doc.write(html)
    doc.close()

    iframeWindow.focus()
    iframeWindow.print()

    setTimeout(() => {
        iframe.remove()
    }, 1000)
}
