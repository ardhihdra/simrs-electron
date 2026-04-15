import { ApiResponseSchema } from 'simrs-types'
import { z } from 'zod'
import { t } from '../'

const ReferralIdInputSchema = z.object({
  id: z.string().min(1)
})

const PdfResultSchema = z.object({
  success: z.boolean(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  base64Data: z.string().optional(),
  error: z.string().optional()
})

function parseFileName(contentDisposition: string | null, fallback: string) {
  if (!contentDisposition) return fallback

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }

  const plainMatch = contentDisposition.match(/filename="?([^"]+)"?/i)
  if (plainMatch?.[1]) {
    return plainMatch[1]
  }

  return fallback
}

export const referralRpc = {
  getDetail: t
    .input(ReferralIdInputSchema)
    .output(ApiResponseSchema(z.any()))
    .query(async ({ client }, { id }) => {
      const response = await client.get(`/api/module/referral/${id}`)
      return await response.json()
    }),

  printPdf: t
    .input(ReferralIdInputSchema)
    .output(PdfResultSchema)
    .query(async ({ client }, { id }) => {
      try {
        const response = await client.get(`/api/module/referral/${id}/print`)

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          return {
            success: false,
            error:
              payload?.error ||
              payload?.message ||
              `Gagal memuat PDF rujukan: HTTP ${response.status}`
          }
        }

        const buffer = await response.arrayBuffer()
        return {
          success: true,
          fileName: parseFileName(
            response.headers.get('content-disposition'),
            `surat-rujukan-${id}.pdf`
          ),
          mimeType: response.headers.get('content-type') || 'application/pdf',
          base64Data: Buffer.from(buffer).toString('base64')
        }
      } catch (error: any) {
        return {
          success: false,
          error: error?.message || 'Gagal memuat PDF rujukan'
        }
      }
    })
}
