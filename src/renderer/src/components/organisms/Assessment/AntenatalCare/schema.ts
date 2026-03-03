import { z } from 'zod'

export const obstetricHistorySchema = z.object({
    gravida: z.number().min(1, 'Harus lebih dari 0').optional(),
    paritas: z.number().min(0, 'Tidak boleh negatif').optional(),
    abortus: z.number().min(0, 'Tidak boleh negatif').optional(),
    hpht: z.string().optional(),
    hpl: z.string().optional(),
    usia_kehamilan: z.number().min(0, 'Tidak boleh negatif').optional(),
    trimester: z.string().optional(),
    berat_badan_sebelum_hamil: z.number().min(0, 'Tidak boleh negatif').optional(),
    tinggi_badan: z.number().min(0, 'Tidak boleh negatif').optional(),
    imt_sebelum_hamil: z.number().min(0, 'Tidak boleh negatif').optional(),
    target_kenaikan_bb: z.string().optional(),
    jarak_kehamilan: z.number().min(0, 'Tidak boleh negatif').optional()
})

export const maternalExamSchema = z.object({
    lila: z.number().min(0, 'Tidak boleh negatif').optional(),
    tfu: z.number().min(0, 'Tidak boleh negatif').optional(),
    golongan_darah: z.string().optional(),
    rhesus: z.string().optional()
})

export const fetalExamSchema = z.object({
    djj: z.number().min(0, 'Tidak boleh negatif').optional(),
    kepala_terhadap_pap: z.string().optional(),
    tbj: z.number().min(0, 'Tidak boleh negatif').optional(),
    presentasi: z.string().optional(),
    jumlah_janin: z.number().min(1, 'Harus lebih dari 0').optional()
})

export const ancAssessmentSchema = z.object({
    performerId: z.number().refine(val => val !== undefined, { message: 'Pemeriksa wajib diisi' }),
    assessment_date: z.any(),
    obstetricHistory: obstetricHistorySchema.optional(),
    maternalExam: maternalExamSchema.optional(),
    fetalExam: fetalExamSchema.optional()
})

export type AncAssessmentFormValues = z.infer<typeof ancAssessmentSchema>
