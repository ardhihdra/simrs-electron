import { OBSERVATION_CATEGORIES, type ObservationBuilderOptions } from "../builders/observation-builder";

const createAncObservation = (
    code: string,
    display: string,
    valueObj: { valueQuantity?: { value: number; unit: string; system?: string; code?: string }; valueString?: string; valueInteger?: number; valueDateTime?: string | Date; valueCodeableConcept?: Record<string, any>; category?: string; codeCoding?: Array<{ code: string; display: string; system?: string }>; interpretations?: Array<{ code: string; display: string; system?: string }>; referenceRange?: Array<{ low?: any; high?: any; text?: string }>; bodySite?: { coding?: Array<{ code: string; display: string; system: string }> } }
): Omit<ObservationBuilderOptions, 'effectiveDateTime'> => {
    return {
        category: valueObj.category || OBSERVATION_CATEGORIES.EXAM,
        code,
        display,
        ...valueObj
    }
}

export const buildAncObservations = (
    values: Record<string, any>
): Omit<ObservationBuilderOptions, 'effectiveDateTime'>[] => {
    const obsToCreate: Omit<ObservationBuilderOptions, 'effectiveDateTime'>[] = []

    // 1. Obstetric History & Visit Data
    const obstetrics = values.obstetricHistory
    if (obstetrics) {
        if (obstetrics.gravida !== undefined) {
            obsToCreate.push(createAncObservation('11996-6', 'Gravida', {
                valueInteger: obstetrics.gravida,
                category: 'survey',
                codeCoding: [
                    { system: 'http://loinc.org', code: '11996-6', display: 'Gravida' },
                    { system: 'http://fhir.org/guides/who/anc-cds/CodeSystem/anc-custom-codes', code: 'ANC.B6.DE24', display: 'Number of pregnancies (gravida)' }
                ]
            }))
        }
        if (obstetrics.paritas !== undefined) {
            obsToCreate.push(createAncObservation('11977-6', 'Parity', {
                valueInteger: obstetrics.paritas,
                category: 'survey',
                codeCoding: [
                    { system: 'http://loinc.org', code: '11977-6', display: 'Parity' },
                    { system: 'http://fhir.org/guides/who/anc-cds/CodeSystem/anc-custom-codes', code: 'ANC.B6.DE32', display: 'Parity' }
                ]
            }))
        }
        if (obstetrics.abortus !== undefined) {
            obsToCreate.push(createAncObservation('69043-8', 'Other pregnancy outcomes #', {
                valueInteger: obstetrics.abortus,
                category: 'survey',
                codeCoding: [
                    { system: 'http://loinc.org', code: '69043-8', display: 'Other pregnancy outcomes #' },
                    { system: 'http://fhir.org/guides/who/anc-cds/CodeSystem/anc-custom-codes', code: 'ANC.B6.DE25', display: 'Number of miscarriages and/or abortions' }
                ]
            }))
        }
        if (obstetrics.hpht) {
            obsToCreate.push(createAncObservation('8665-2', 'Last menstrual period start date', {
                valueDateTime: obstetrics.hpht,
                category: 'survey',
                codeCoding: [
                    { system: 'http://loinc.org', code: '8665-2', display: 'Last menstrual period start date' },
                    { system: 'http://fhir.org/guides/who/anc-cds/CodeSystem/anc-custom-codes', code: 'ANC.B6.DE14', display: 'Last menstrual period (LMP) date' }
                ]
            }))
        }
        if (obstetrics.hpl) {
            obsToCreate.push(createAncObservation('11778-8', 'Delivery date Estimated', {
                valueDateTime: obstetrics.hpl,
                category: 'survey',
                codeCoding: [
                    { system: 'http://loinc.org', code: '11778-8', display: 'Delivery date Estimated' },
                    { system: 'http://fhir.org/guides/who/anc-cds/CodeSystem/anc-custom-codes', code: 'ANC.B6.DE22', display: 'Expected date of delivery (EDD)' }
                ]
            }))
        }
        if (obstetrics.usia_kehamilan !== undefined) {
            obsToCreate.push(createAncObservation('18185-9', 'Gestational age', {
                valueQuantity: { value: obstetrics.usia_kehamilan, unit: 'wk' },
                category: 'survey',
                codeCoding: [
                    { system: 'http://loinc.org', code: '18185-9', display: 'Gestational age' },
                    { system: 'http://fhir.org/guides/who/anc-cds/CodeSystem/anc-custom-codes', code: 'ANC.B6.DE17', display: 'Gestational age' }
                ]
            }))
        }
        if (obstetrics.trimester) {
            obsToCreate.push(createAncObservation('32418-6', 'Obstetric trimester Stated', {
                valueInteger: Number(obstetrics.trimester),
                category: 'survey',
                codeCoding: [
                    { system: 'http://loinc.org', code: '32418-6', display: 'Obstetric trimester Stated' },
                    { system: 'http://terminology.kemkes.go.id/CodeSystem/anc-custom-codes', code: 'ANC.SS.DE13', display: 'Trimester ke' }
                ]
            }))
        }
        if (obstetrics.berat_badan_sebelum_hamil !== undefined) {
            obsToCreate.push(createAncObservation('56077-1', 'Body weight --pre current pregnancy', {
                valueQuantity: { value: obstetrics.berat_badan_sebelum_hamil, unit: 'kg' },
                category: 'survey',
                codeCoding: [
                    { system: 'http://loinc.org', code: '56077-1', display: 'Body weight --pre current pregnancy' },
                    { system: 'http://fhir.org/guides/who/anc-cds/CodeSystem/anc-custom-codes', code: 'ANC.B8.DE2', display: 'Pre-gestational weight' }
                ]
            }))
        }
        if (obstetrics.tinggi_badan !== undefined) {
            obsToCreate.push(createAncObservation('8302-2', 'Body height', {
                valueQuantity: { value: obstetrics.tinggi_badan, unit: 'cm' },
                category: 'vital-signs',
                codeCoding: [
                    { system: 'http://loinc.org', code: '8302-2', display: 'Tinggi Badan' },
                    { system: 'http://fhir.org/guides/who/anc-cds/CodeSystem/anc-custom-codes', code: 'ANC.B8.DE1', display: 'Height' }
                ]
            }))
        }
        if (obstetrics.imt_sebelum_hamil !== undefined) {
            let interpretationCode = 'N'
            let interpretationDisplay = 'Normal weight'
            const imt = obstetrics.imt_sebelum_hamil
            if (imt < 18.5) {
                interpretationCode = '310252000'
                interpretationDisplay = 'Low birth weight infant' // fallback representation for underweight if not 43664005 mapped
            } else if (imt >= 25 && imt < 30) {
                interpretationCode = '233820003'
                interpretationDisplay = 'Overweight'
            } else if (imt >= 30) {
                interpretationCode = '414915002'
                interpretationDisplay = 'Obese'
            } else {
                interpretationCode = '43664005'
                interpretationDisplay = 'Normal weight'
            }

            obsToCreate.push(createAncObservation('OC000010', 'Indeks Massa Tubuh Sebelum Hamil', {
                valueQuantity: { value: obstetrics.imt_sebelum_hamil, unit: 'kg/m2' },
                category: 'exam',
                codeCoding: [
                    { system: 'http://terminology.kemkes.go.id/CodeSystem/clinical-term', code: 'OC000010', display: 'Indeks Massa Tubuh Sebelum Hamil' },
                    { system: 'http://terminology.kemkes.go.id/CodeSystem/anc-custom-codes', code: 'ANC.SS.DE58', display: 'IMT Sebelum Hamil' }
                ],
                interpretations: [
                    { system: 'http://snomed.info/sct', code: interpretationCode, display: interpretationDisplay }
                ],
                referenceRange: [
                    { high: { value: 18.4, unit: 'kg/m2', system: 'http://unitsofmeasure.org', code: 'kg/m2' }, text: 'Kurus' },
                    { low: { value: 18.5, unit: 'kg/m2', system: 'http://unitsofmeasure.org', code: 'kg/m2' }, high: { value: 24.9, unit: 'kg/m2', system: 'http://unitsofmeasure.org', code: 'kg/m2' }, text: 'Normal' },
                    { low: { value: 25, unit: 'kg/m2', system: 'http://unitsofmeasure.org', code: 'kg/m2' }, high: { value: 29.9, unit: 'kg/m2', system: 'http://unitsofmeasure.org', code: 'kg/m2' }, text: 'Gemuk' },
                    { low: { value: 30, unit: 'kg/m2', system: 'http://unitsofmeasure.org', code: 'kg/m2' }, text: 'Obesitas' }
                ]
            }))
        }
        if (obstetrics.target_kenaikan_bb !== undefined && obstetrics.target_kenaikan_bb !== '') {
            obsToCreate.push(createAncObservation('OC000011', 'Target Kenaikan Berat Badan', {
                valueCodeableConcept: {
                    coding: [
                        { system: 'http://terminology.kemkes.go.id/CodeSystem/clinical-term', code: 'OV000009', display: obstetrics.target_kenaikan_bb }
                    ]
                },
                category: 'exam',
                codeCoding: [
                    { system: 'http://terminology.kemkes.go.id/CodeSystem/clinical-term', code: 'OC000011', display: 'Target Kenaikan Berat Badan' },
                    { system: 'http://fhir.org/guides/who/anc-cds/CodeSystem/anc-custom-codes', code: 'ANC.B8.DE10', display: 'Expected weight gain' }
                ]
            }))
        }
        if (obstetrics.jarak_kehamilan !== undefined) {
            obsToCreate.push(createAncObservation('OC000001', 'Jarak kehamilan', {
                valueQuantity: { value: obstetrics.jarak_kehamilan, unit: 'mo', system: 'http://unitsofmeasure.org', code: 'mo' },
                category: 'survey',
                codeCoding: [
                    { system: 'http://terminology.kemkes.go.id/CodeSystem/clinical-term', code: 'OC000001', display: 'Jarak kehamilan' },
                    { system: 'http://terminology.kemkes.go.id/CodeSystem/anc-custom-codes', code: 'ANC.SS.DE53', display: 'Jarak kehamilan' }
                ]
            }))
        }
    }

    // 2. Maternal Exam (Specific)
    const maternal = values.maternalExam
    if (maternal) {
        if (maternal.lila !== undefined) {
            let interpretationCode = 'N'
            let interpretationDisplay = 'Normal'
            if (maternal.lila < 23.5) {
                interpretationCode = 'L'
                interpretationDisplay = 'Low'
            }

            obsToCreate.push(createAncObservation('284473002', 'Mid upper arm circumference', {
                valueQuantity: { value: maternal.lila, unit: 'cm' },
                category: 'exam',
                codeCoding: [
                    { system: 'http://snomed.info/sct', code: '284473002', display: 'Mid upper arm circumference' },
                    { system: 'http://terminology.kemkes.go.id/CodeSystem/anc-custom-codes', code: 'ANC.SS.DE3', display: 'Lingkar Lengan Atas (LILA)' }
                ],
                interpretations: [
                    { system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation', code: interpretationCode, display: interpretationDisplay }
                ]
            }))
        }
        if (maternal.tfu !== undefined) {
            obsToCreate.push(createAncObservation('11881-0', 'Uterus Fundal height Tape measure', {
                valueQuantity: { value: maternal.tfu, unit: 'cm' },
                category: 'exam',
                codeCoding: [
                    { system: 'http://loinc.org', code: '11881-0', display: 'Uterus Fundal height Tape measure' },
                    { system: 'http://fhir.org/guides/who/anc-cds/CodeSystem/anc-custom-codes', code: 'ANC.B8.DE105', display: 'Symphysis-fundal height (SFH)' }
                ]
            }))
        }
        if (maternal.golongan_darah) {
            let snomedCode = 'LA19710-5'
            let snomedDisplay = 'Group A'
            if (maternal.golongan_darah === 'B') {
                snomedCode = 'LA19711-3'
                snomedDisplay = 'Group B'
            } else if (maternal.golongan_darah === 'AB') {
                snomedCode = 'LA19712-1'
                snomedDisplay = 'Group AB'
            } else if (maternal.golongan_darah === 'O') {
                snomedCode = 'LA19713-9'
                snomedDisplay = 'Group O'
            } else if (maternal.golongan_darah === 'Tidak Tahu' || maternal.golongan_darah === 'Unknown') {
                snomedCode = 'LA4489-6'
                snomedDisplay = 'Unknown'
            }

            obsToCreate.push(createAncObservation('883-9', 'ABO group [Type] in Blood', {
                valueCodeableConcept: {
                    coding: [
                        { system: 'http://loinc.org', code: snomedCode, display: snomedDisplay }
                    ]
                },
                category: 'laboratory',
                codeCoding: [
                    { system: 'http://loinc.org', code: '883-9', display: 'ABO group [Type] in Blood' },
                    { system: 'http://fhir.org/guides/who/anc-cds/CodeSystem/anc-custom-codes', code: 'ANC.B9.DE24', display: 'Blood type' }
                ]
            }))
        }
        if (maternal.rhesus) {
            let snomedCode = 'LA6576-8'
            let snomedDisplay = 'Positive'
            if (maternal.rhesus === 'Negatif (-)') {
                snomedCode = 'LA6577-6'
                snomedDisplay = 'Negative'
            }

            obsToCreate.push(createAncObservation('10331-7', 'Rh [Type] in Blood', {
                valueCodeableConcept: {
                    coding: [
                        { system: 'http://loinc.org', code: snomedCode, display: snomedDisplay }
                    ]
                },
                category: 'laboratory',
                codeCoding: [
                    { system: 'http://loinc.org', code: '10331-7', display: 'Rh [Type] in Blood' },
                    { system: 'http://fhir.org/guides/who/anc-cds/CodeSystem/anc-custom-codes', code: 'ANC.B9.DE29', display: 'Rh factor' }
                ]
            }))
        }
        if (maternal.pemberian_makanan_tambahan) {
            obsToCreate.push(createAncObservation('PMT_STATUS', 'Pemberian Makanan Tambahan', { valueString: maternal.pemberian_makanan_tambahan }))
        }
    }

    // 3. Fetal Exam
    const fetal = values.fetalExam
    if (fetal) {
        if (fetal.djj !== undefined) {
            obsToCreate.push(createAncObservation('55283-6', 'Fetal Heart rate', {
                valueQuantity: { value: fetal.djj, unit: '{beats}/min', system: 'http://unitsofmeasure.org', code: '{beats}/min' },
                category: 'exam',
                codeCoding: [
                    { system: 'http://loinc.org', code: '55283-6', display: 'Fetal Heart rate' },
                    { system: 'http://fhir.org/guides/who/anc-cds/CodeSystem/anc-custom-codes', code: 'ANC.B8.DE107', display: 'Fetal heart rate' }
                ]
            }))
        }
        if (fetal.kepala_terhadap_pap) {
            let snomedCode = '62098001'
            let snomedDisplay = 'Head not engaged'

            if (fetal.kepala_terhadap_pap === '41882003') {
                snomedCode = '41882003'
                snomedDisplay = 'Head engaged'
            }

            obsToCreate.push(createAncObservation('249111004', 'Engagement of head', {
                valueCodeableConcept: {
                    coding: [
                        { system: 'http://terminology.kemkes.go.id/CodeSystem/clinical-term', code: snomedCode, display: snomedDisplay }
                    ]
                },
                category: 'exam',
                codeCoding: [
                    { system: 'http://terminology.kemkes.go.id/CodeSystem/clinical-term', code: '249111004', display: 'Engagement of head' },
                    { system: 'http://terminology.kemkes.go.id/CodeSystem/anc-custom-codes', code: 'ANC.SS.DE46', display: 'Kepala terhadap PAP' }
                ]
            }))
        }
        if (fetal.tbj !== undefined) {
            obsToCreate.push(createAncObservation('89087-1', 'Fetal Body weight Estimated', {
                valueQuantity: { value: fetal.tbj, unit: 'g', system: 'http://unitsofmeasure.org', code: 'g' },
                category: 'exam',
                codeCoding: [
                    { system: 'http://loinc.org', code: '89087-1', display: 'Fetal Body weight Estimated' },
                    { system: 'http://terminology.kemkes.go.id/CodeSystem/anc-custom-codes', code: 'ANC.SS.DE1', display: 'Taksiran Berat Janin (TBJ)' }
                ]
            }))
        }
        if (fetal.presentasi) {
            let snomedCode = '1209182005' // Kepala (Cephalic)
            let snomedDisplay = 'Cephalic fetal presentation'

            if (fetal.presentasi === 'sungsang') {
                snomedCode = '6096002'
                snomedDisplay = 'Breech presentation'
            } else if (fetal.presentasi === 'lintang') {
                snomedCode = '73161006'
                snomedDisplay = 'Transverse presentation'
            } else if (fetal.presentasi === 'ganda') {
                snomedCode = '112676009'
                snomedDisplay = 'Multiple pregnancy' // Approximation for 'Ganda'
            }

            obsToCreate.push(createAncObservation('72155-5', 'Position in womb Fetus [RHEA]', {
                valueCodeableConcept: {
                    coding: [
                        { system: 'http://snomed.info/sct', code: snomedCode, display: snomedDisplay }
                    ]
                },
                category: 'exam',
                codeCoding: [
                    { system: 'http://loinc.org', code: '72155-5', display: 'Position in womb Fetus [RHEA]' },
                    { system: 'http://fhir.org/guides/who/anc-cds/CodeSystem/anc-custom-codes', code: 'ANC.B8.DE111', display: 'Fetal presentation' }
                ]
            }))
        }
        if (fetal.jumlah_janin !== undefined) {
            obsToCreate.push(createAncObservation('246435002', 'Number of fetuses', {
                valueInteger: fetal.jumlah_janin,
                category: 'exam',
                codeCoding: [
                    { system: 'http://snomed.info/sct', code: '246435002', display: 'Number of fetuses' },
                    { system: 'http://fhir.org/guides/who/anc-cds/CodeSystem/anc-custom-codes', code: 'ANC.B8.DE109', display: 'Number of fetuses' }
                ]
            }))
        }
    }

    return obsToCreate
}

export const parseAncObservations = (observations: Record<string, unknown>[]) => {
    const defaultData = {
        obstetricHistory: {} as Record<string, unknown>,
        maternalExam: {} as Record<string, unknown>,
        fetalExam: {} as Record<string, unknown>
    }

    if (!observations || !Array.isArray(observations) || observations.length === 0) {
        return defaultData
    }

    observations.forEach((obs) => {
        const code = obs.code as string | undefined
        const codeCoding = obs.codeCoding as Array<{ code: string; system: string }> | undefined
        const valQty = (obs.valueQuantity as { value?: number })?.value || (obs.valueInteger as number)
        const valStr = obs.valueString as string | undefined
        const valDateTime = obs.valueDateTime as string | undefined
        const valCodeableConcept = (obs.valueCodeableConcept as Record<string, any>)?.coding?.[0]?.display as string | undefined

        const hasCode = (target: string) => {
            if (code === target) return true
            if (codeCoding && Array.isArray(codeCoding)) {
                return codeCoding.some(c => c.code === target)
            }
            return false
        }

        // Obstetric History
        if (hasCode('11996-6')) defaultData.obstetricHistory.gravida = valQty
        else if (hasCode('11977-6')) defaultData.obstetricHistory.paritas = valQty
        else if (hasCode('69043-8')) defaultData.obstetricHistory.abortus = valQty
        else if (hasCode('8665-2')) defaultData.obstetricHistory.hpht = valStr || valDateTime
        else if (hasCode('11778-8')) defaultData.obstetricHistory.hpl = valStr || valDateTime
        else if (hasCode('OC000001')) defaultData.obstetricHistory.jarak_kehamilan = valQty

        // Visit Data
        else if (hasCode('18185-9')) defaultData.obstetricHistory.usia_kehamilan = valQty
        else if (hasCode('32418-6')) defaultData.obstetricHistory.trimester = valQty ? String(valQty) : undefined
        else if (hasCode('56077-1')) defaultData.obstetricHistory.berat_badan_sebelum_hamil = valQty
        else if (hasCode('8302-2')) defaultData.obstetricHistory.tinggi_badan = valQty
        else if (hasCode('OC000010')) defaultData.obstetricHistory.imt_sebelum_hamil = valQty
        else if (hasCode('OC000011')) defaultData.obstetricHistory.target_kenaikan_bb = valCodeableConcept || valStr

        // Maternal Exam
        else if (hasCode('284473002')) defaultData.maternalExam.lila = valQty
        else if (hasCode('11881-0')) defaultData.maternalExam.tfu = valQty
        else if (hasCode('883-9')) defaultData.maternalExam.golongan_darah = valCodeableConcept || valStr
        else if (hasCode('10331-5')) defaultData.maternalExam.rhesus = valCodeableConcept || valStr

        // Fetal Exam
        else if (hasCode('55283-6')) defaultData.fetalExam.djj = valQty
        else if (hasCode('249111004')) {
            const mappedCode = (obs.valueCodeableConcept as Record<string, any>)?.coding?.[0]?.code
            if (mappedCode === '41882003') defaultData.fetalExam.kepala_terhadap_pap = '41882003'
            else if (mappedCode === '62098001') defaultData.fetalExam.kepala_terhadap_pap = '62098001'
        }
        else if (hasCode('89087-1')) defaultData.fetalExam.tbj = valQty
        else if (hasCode('72155-5')) {
            const mappedCode = (obs.valueCodeableConcept as Record<string, any>)?.coding?.[0]?.code
            if (mappedCode === '1209182005') defaultData.fetalExam.presentasi = 'kepala'
            else if (mappedCode === '6096002') defaultData.fetalExam.presentasi = 'sungsang'
            else if (mappedCode === '73161006') defaultData.fetalExam.presentasi = 'lintang'
            else if (mappedCode === '112676009') defaultData.fetalExam.presentasi = 'ganda'
        }
        else if (hasCode('246435002')) defaultData.fetalExam.jumlah_janin = (obs.valueInteger as number)
    })

    return defaultData
}

