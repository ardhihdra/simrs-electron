import { CLINICAL_IMPRESSION_CATEGORIES } from '@renderer/config/maps/clinical-impression-maps';

/**
 * Formatter untuk FHIR ClinicalImpression resource.
 * Mengkonversi array ClinicalImpression dari API menjadi object yang siap dipakai form.
 */

export interface ClinicalImpressionData {
    id?: string
    status?: string
    subjectId?: string
    encounterId?: string
    description?: string
    summary?: string
    effectiveDateTime?: string
    date?: string
    code?: any
    subject?: any
    encounter?: any
    assessor?: any
    investigation?: any[]
    problem?: any[]
    finding?: any[]
    note?: any[]
}

export interface FormattedClinicalImpression {
    id?: string;
    riwayatPerjalananPenyakit?: string;
    rasionalKlinis?: string;
    investigations?: string[];
}

export const formatClinicalImpression = (
    impressions: ClinicalImpressionData[]
): FormattedClinicalImpression => {

    const riwayat = impressions.find(i => i.description === CLINICAL_IMPRESSION_CATEGORIES.CLINICAL_COURSE);
    const rasional = impressions.find(i => i.description === CLINICAL_IMPRESSION_CATEGORIES.CLINICAL_RATIONALE);

    let investigations: string[] = [];
    if (rasional?.investigation?.[0]?.item) {
        investigations = rasional.investigation[0].item.map((it: any) => it.reference?.replace('Observation/', ''));
    }

    return {
        id: riwayat?.id || rasional?.id, // Useful if we just need the parent ID, though each might have its own ID
        riwayatPerjalananPenyakit: riwayat?.summary || '',
        rasionalKlinis: rasional?.summary || '',
        investigations
    };
};

export const formatClinicalImpressionsByCategory = (
    impressions: ClinicalImpressionData[]
): Record<string, FormattedClinicalImpression> => {
    // If you need it separated or grouped differently
    return {
        combined: formatClinicalImpression(impressions)
    };
};
