import type { PatientInfo, PatientNameEntry, DosageInstructionEntry } from './types'
import type { TelaahResults } from './component/telaah-administrasi-form'

export function getPatientDisplayName(patient?: PatientInfo): string {
    if (!patient) return ''

    if (typeof patient.name === 'string') {
        const trimmed = patient.name.trim()
        if (trimmed.length > 0) {
            const identifiers = Array.isArray(patient.identifier) ? patient.identifier : []
            const localMrn = identifiers.find((id) => id.system === 'local-mrn')
            const mrn = patient.mrNo || localMrn?.value || ''
            return mrn ? `${trimmed} (${mrn})` : trimmed
        }
    }

    const firstName: PatientNameEntry | undefined =
        Array.isArray(patient.name) && patient.name.length > 0 ? patient.name[0] : undefined

    const nameFromText = firstName?.text?.trim() ?? ''
    const nameFromGivenFamily = [firstName?.given?.[0], firstName?.family]
        .filter((v) => typeof v === 'string' && v.trim().length > 0)
        .join(' ')
        .trim()

    const baseName = nameFromText || nameFromGivenFamily || 'Tanpa nama'

    const identifiers = Array.isArray(patient.identifier) ? patient.identifier : []
    const localMrn = identifiers.find((id) => id.system === 'local-mrn')
    const mrn = patient.mrNo || localMrn?.value || ''

    if (mrn) return `${baseName} (${mrn})`
    return baseName
}

export function getInstructionText(dosage?: DosageInstructionEntry[] | null): string {
    if (!Array.isArray(dosage) || dosage.length === 0) return ''
    return dosage[0]?.text ?? ''
}

export function extractTelaahResults(record: any): TelaahResults | null {
    const criteriaKeys = [
        'tanggalResep',
        'parafDokter',
        'identitasPasien',
        'bbTb',
        'namaObat',
        'kekuatan',
        'jumlahObat',
        'signa',
        'duplikasi',
        'kontraindikasi',
        'interaksi',
        'dosisLazim',
        'alergi',
        'infoKesesuaianIdentitas',
        'infoNamaDosisJumlah',
        'infoCaraGuna',
        'infoEso',
    ]

    if (record.telaah && typeof record.telaah === 'object') {
        return record.telaah
    }

    const notes = record.note
    if (!Array.isArray(notes)) return null
    const telaahNote = notes.find((n) => typeof n?.text === 'string' && n.text.startsWith('TEALAAH:'))
    if (!telaahNote) return null

    try {
        const jsonStr = telaahNote.text.replace('TEALAAH:', '').trim()
        const results = JSON.parse(jsonStr)
        return results
    } catch (e) {
        console.error('Failed to parse telaah note', e)
        return null
    }
}
