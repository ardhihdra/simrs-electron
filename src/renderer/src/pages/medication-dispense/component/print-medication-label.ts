import { message } from 'antd'

export interface MedicationLabelItem {
    medicineName?: string
    quantity?: number
    unit?: string
    instruksi?: string
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

            const lines: string[] = []
            if (patientName.trim().length > 0) {
                lines.push(`Pasien: ${patientName}`)
            }
            lines.push(`Nama Obat: ${name}`)
            lines.push(`Qty: ${quantityValue} ${unitLabel}`.trim())
            if (instructionText.trim().length > 0) {
                lines.push(`Instruksi: ${instructionText}`)
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
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
      font-size: 12px; 
      margin: 8px; 
    }
    .label { 
      border: 1px solid #000; 
      padding: 4px 8px; 
      max-width: 320px; 
      margin-bottom: 8px; 
      page-break-after: always; /* Pastikan tiap label di halaman berbeda jika diprint panjang */
    }
    .line { margin-bottom: 2px; }
    @media print {
      body { margin: 0; }
      /* Saat di print bisa dihapus border-nya atau menyesuaikan ukuran printer thermal */
      .label { border: none; padding: 0; margin-bottom: 0; }
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
