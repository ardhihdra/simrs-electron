export const SNOMED_CONDITIONS: Record<string, { code: string; display: string }> = {
    caries: { code: '80967001', display: 'Dental caries' },
    filling: { code: '28059005', display: 'Restoration of tooth' },
    root_canal: { code: '41743004', display: 'Root canal treatment' },
    bridge: { code: '50106000', display: 'Has dental bridge' },
    missing: { code: '2660000', display: 'Tooth missing' },
    impacted: { code: '66617006', display: 'Tooth impacted' },
    veneer: { code: '235286001', display: 'Dental veneer' }
}

export const SURFACE_NAMES: Record<string, string> = {
    top: 'Occlusal surface',
    center: 'Occlusal surface',
    bottom: 'Lingual surface',
    left: 'Mesial surface',
    right: 'Distal surface',
    whole: 'Whole tooth',
    labial: 'Labial surface',
    lingual: 'Lingual surface',
    palatal: 'Palatal surface',
    buccal: 'Buccal surface'
}

export const SNOMED_TEETH: Record<string, { code: string; display: string }> = {
    // Quadrant 1 (Upper Right)
    '18': { code: '24538006', display: 'Tooth 18' },
    '17': { code: '48830006', display: 'Tooth 17' },
    '16': { code: '5616000', display: 'Tooth 16' },
    '15': { code: '21183006', display: 'Tooth 15' },
    '14': { code: '85652003', display: 'Tooth 14' },
    '13': { code: '6011000', display: 'Tooth 13' },
    '12': { code: '39097003', display: 'Tooth 12' },
    '11': { code: '24521004', display: 'Tooth 11' },

    // Quadrant 2 (Upper Left)
    '21': { code: '52240004', display: 'Tooth 21' },
    '22': { code: '15410003', display: 'Tooth 22' },
    '23': { code: '68512006', display: 'Tooth 23' },
    '24': { code: '8619001', display: 'Tooth 24' },
    '25': { code: '16928003', display: 'Tooth 25' },
    '26': { code: '23420002', display: 'Tooth 26' },
    '27': { code: '12519008', display: 'Tooth 27' },
    '28': { code: '86629007', display: 'Tooth 28' },

    // Quadrant 3 (Lower Left)
    '38': { code: '77237004', display: 'Tooth 38' },
    '37': { code: '27725002', display: 'Tooth 37' },
    '36': { code: '76856008', display: 'Tooth 36' },
    '35': { code: '80975005', display: 'Tooth 35' },
    '34': { code: '10044005', display: 'Tooth 34' },
    '33': { code: '36465007', display: 'Tooth 33' },
    '32': { code: '13550009', display: 'Tooth 32' },
    '31': { code: '62725000', display: 'Tooth 31' },

    // Quadrant 4 (Lower Right)
    '41': { code: '11306000', display: 'Tooth 41' },
    '42': { code: '66144005', display: 'Tooth 42' },
    '43': { code: '24835003', display: 'Tooth 43' },
    '44': { code: '40730006', display: 'Tooth 44' },
    '45': { code: '37257008', display: 'Tooth 45' },
    '46': { code: '41910008', display: 'Tooth 46' },
    '47': { code: '21193003', display: 'Tooth 47' },
    '48': { code: '64953005', display: 'Tooth 48' },

    // Deciduous Teeth (Gigi Susu) - Quadrant 5
    '55': { code: '5096005', display: 'Tooth 55' },
    '54': { code: '48446006', display: 'Tooth 54' },
    '53': { code: '2157008', display: 'Tooth 53' },
    '52': { code: '53313000', display: 'Tooth 52' },
    '51': { code: '48762007', display: 'Tooth 51' },

    // Deciduous Teeth - Quadrant 6
    '61': { code: '25846001', display: 'Tooth 61' },
    '62': { code: '4540003', display: 'Tooth 62' },
    '63': { code: '47775005', display: 'Tooth 63' },
    '64': { code: '57053000', display: 'Tooth 64' },
    '65': { code: '5225006', display: 'Tooth 65' },

    // Deciduous Teeth - Quadrant 7
    '75': { code: '33333008', display: 'Tooth 75' },
    '74': { code: '72592003', display: 'Tooth 74' },
    '73': { code: '40196001', display: 'Tooth 73' },
    '72': { code: '3362004', display: 'Tooth 72' },
    '71': { code: '67554009', display: 'Tooth 71' },

    // Deciduous Teeth - Quadrant 8
    '81': { code: '87082005', display: 'Tooth 81' },
    '82': { code: '26413008', display: 'Tooth 82' },
    '83': { code: '58771008', display: 'Tooth 83' },
    '84': { code: '2411000', display: 'Tooth 84' },
    '85': { code: '28662003', display: 'Tooth 85' }
}
