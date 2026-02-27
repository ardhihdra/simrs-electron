export const OBSTETRIC_HISTORY_MAP: Record<string, string> = {
    '11996-6': 'gravida',
    '11977-6': 'paritas',
    '69043-8': 'abortus',
    '8665-2': 'hpht',
    '11778-8': 'hpl',
    '11884-4': 'usia_kehamilan',
    '75620-5': 'trimester',
    '8687-3': 'jarak_kehamilan'
}

export const MATERNAL_EXAM_MAP: Record<string, string> = {
    '29463-7': 'berat_badan_ibu',
    '284473002': 'lila',
    '11881-0': 'tfu',
    '8480-6': 'tekanan_darah_sistolik',
    '8462-4': 'tekanan_darah_diastolik',
    '8867-4': 'nadi',
    '8310-5': 'suhu',
    '9279-1': 'pernapasan',
    '883-9': 'golongan_darah',
    '10331-7': 'rhesus',
    '10197-2|29445007': 'konjungtiva',
    '10197-2|18619003': 'sklera',
    '116312005': 'tungkai',
    PMT_STATUS: 'pemberian_makanan_tambahan'
}

export const FETAL_EXAM_MAP: Record<string, string> = {
    '55283-6': 'djj',
    '72155-5': 'presentasi',
    '249111004': 'kepala_terhadap_pap',
    '89087-1': 'tbj',
    '246435002': 'jumlah_janin'
}

export const PRESENTATION_CODES: Record<string, string> = {
    kepala: 'Kepala',
    sungsang: 'Sungsang',
    lintang: 'Melintang',
    ganda: 'Ganda (Kehamilan Multipel)'
}

export const ENGAGEMENT_CODES: Record<string, string> = {
    masuk: 'Sudah Masuk PAP',
    belum_masuk: 'Belum Masuk PAP'
}
