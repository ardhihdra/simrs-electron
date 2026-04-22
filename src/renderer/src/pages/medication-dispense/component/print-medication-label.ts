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

    const labelBlocks = labelLinesList
        .map((lines) => {
            const inner = lines
                .map((line) => `<div class="line">${line}</div>`)
                .join('')
            return `<div class="label">${inner}</div>`
        })
        .join('')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Label Obat</title>
  <style>
    body { 
      font-family: inherit; 
      font-size: 14px; 
      margin: 0;
      padding: 0;
    }
    .label { 
      border: 1px dashed #ccc; 
      padding: 10px; 
      width: 300px; 
      margin-bottom: 15px; 
      page-break-after: always;
    }
    .line { 
      margin-bottom: 4px; 
      word-wrap: break-word;
      border-bottom: 1px dotted #eee;
      padding-bottom: 2px;
    }
    .line:last-child { border-bottom: none; }
    @media print {
      body { margin: 0; }
      .label { border: none; padding: 0; margin-bottom: 0; width: 100%; }
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
