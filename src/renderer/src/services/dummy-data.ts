import {
    Patient,
    Poli,
    Doctor,
    PatientQueue,
    PatientStatus,
    Gender,
    MedicalRecord
} from '../types/nurse.types'

// Dummy Poli Data
export const dummyPolis: Poli[] = [
    { id: 'poli-001', code: 'POL-001', name: 'Poli Umum', description: 'Poliklinik Umum' },
    { id: 'poli-002', code: 'POL-002', name: 'Poli Gigi', description: 'Poliklinik Gigi' },
    { id: 'poli-003', code: 'POL-003', name: 'Poli Anak', description: 'Poliklinik Anak' },
    { id: 'poli-004', code: 'POL-004', name: 'Poli Kandungan', description: 'Poliklinik Kandungan' },
    { id: 'poli-005', code: 'POL-005', name: 'Poli Mata', description: 'Poliklinik Mata' },
    { id: 'poli-006', code: 'POL-006', name: 'Poli THT', description: 'Poliklinik THT' }
]

// Dummy Doctor Data
export const dummyDoctors: Doctor[] = [
    {
        id: 'doc-001',
        name: 'dr. Ahmad Fauzi, Sp.PD',
        specialization: 'Penyakit Dalam',
        sipNumber: 'SIP/001/2023'
    },
    {
        id: 'doc-002',
        name: 'drg. Siti Nurhaliza',
        specialization: 'Dokter Gigi',
        sipNumber: 'SIP/002/2023'
    },
    {
        id: 'doc-003',
        name: 'dr. Budi Santoso, Sp.A',
        specialization: 'Spesialis Anak',
        sipNumber: 'SIP/003/2023'
    },
    {
        id: 'doc-004',
        name: 'dr. Dewi Lestari, Sp.OG',
        specialization: 'Spesialis Kandungan',
        sipNumber: 'SIP/004/2023'
    },
    {
        id: 'doc-005',
        name: 'dr. Eko Prasetyo, Sp.M',
        specialization: 'Spesialis Mata',
        sipNumber: 'SIP/005/2023'
    },
    {
        id: 'doc-006',
        name: 'dr. Fitri Handayani, Sp.THT',
        specialization: 'Spesialis THT',
        sipNumber: 'SIP/006/2023'
    }
]

// Dummy Patient Data
export const dummyPatients: Patient[] = [
    {
        id: 'pat-001',
        medicalRecordNumber: 'RM-2024-001',
        name: 'Agus Setiawan',
        gender: Gender.MALE,
        birthDate: '1985-03-15',
        age: 39,
        phone: '081234567801',
        address: 'Jl. Merdeka No. 123, Jakarta',
        identityNumber: '3201011503850001'
    },
    {
        id: 'pat-002',
        medicalRecordNumber: 'RM-2024-002',
        name: 'Siti Aminah',
        gender: Gender.FEMALE,
        birthDate: '1990-07-22',
        age: 34,
        phone: '081234567802',
        address: 'Jl. Sudirman No. 45, Jakarta',
        identityNumber: '3201012207900002'
    },
    {
        id: 'pat-003',
        medicalRecordNumber: 'RM-2024-003',
        name: 'Bambang Wijaya',
        gender: Gender.MALE,
        birthDate: '1978-11-10',
        age: 45,
        phone: '081234567803',
        address: 'Jl. Gatot Subroto No. 67, Jakarta',
        identityNumber: '3201011011780003'
    },
    {
        id: 'pat-004',
        medicalRecordNumber: 'RM-2024-004',
        name: 'Ratna Sari',
        gender: Gender.FEMALE,
        birthDate: '1995-05-18',
        age: 29,
        phone: '081234567804',
        address: 'Jl. Ahmad Yani No. 89, Jakarta',
        identityNumber: '3201011805950004'
    },
    {
        id: 'pat-005',
        medicalRecordNumber: 'RM-2024-005',
        name: 'Andi Pratama',
        gender: Gender.MALE,
        birthDate: '2010-09-25',
        age: 13,
        phone: '081234567805',
        address: 'Jl. Diponegoro No. 12, Jakarta',
        identityNumber: '3201012509100005'
    },
    {
        id: 'pat-006',
        medicalRecordNumber: 'RM-2024-006',
        name: 'Rina Wijayanti',
        gender: Gender.FEMALE,
        birthDate: '1988-12-03',
        age: 35,
        phone: '081234567806',
        address: 'Jl. Hayam Wuruk No. 34, Jakarta',
        identityNumber: '3201010312880006'
    },
    {
        id: 'pat-007',
        medicalRecordNumber: 'RM-2024-007',
        name: 'Dedi Kurniawan',
        gender: Gender.MALE,
        birthDate: '1992-04-17',
        age: 32,
        phone: '081234567807',
        address: 'Jl. Thamrin No. 56, Jakarta',
        identityNumber: '3201011704920007'
    },
    {
        id: 'pat-008',
        medicalRecordNumber: 'RM-2024-008',
        name: 'Maya Indah',
        gender: Gender.FEMALE,
        birthDate: '1982-08-29',
        age: 41,
        phone: '081234567808',
        address: 'Jl. Kuningan No. 78, Jakarta',
        identityNumber: '3201012908820008'
    },
    {
        id: 'pat-009',
        medicalRecordNumber: 'RM-2024-009',
        name: 'Rudi Hermawan',
        gender: Gender.MALE,
        birthDate: '2015-01-14',
        age: 9,
        phone: '081234567809',
        address: 'Jl. Casablanca No. 90, Jakarta',
        identityNumber: '3201011401150009'
    },
    {
        id: 'pat-010',
        medicalRecordNumber: 'RM-2024-010',
        name: 'Linda Kusuma',
        gender: Gender.FEMALE,
        birthDate: '1987-06-08',
        age: 37,
        phone: '081234567810',
        address: 'Jl. Rasuna Said No. 23, Jakarta',
        identityNumber: '3201010806870010'
    },
    {
        id: 'pat-011',
        medicalRecordNumber: 'RM-2024-011',
        name: 'Hendra Gunawan',
        gender: Gender.MALE,
        birthDate: '1993-10-21',
        age: 30,
        phone: '081234567811',
        address: 'Jl. MT Haryono No. 45, Jakarta',
        identityNumber: '3201012110930011'
    },
    {
        id: 'pat-012',
        medicalRecordNumber: 'RM-2024-012',
        name: 'Yuni Astuti',
        gender: Gender.FEMALE,
        birthDate: '1991-02-13',
        age: 33,
        phone: '081234567812',
        address: 'Jl. Kemang Raya No. 67, Jakarta',
        identityNumber: '3201011302910012'
    }
]

// Dummy Patient Queue Data
export const dummyPatientQueue: PatientQueue[] = [
    {
        id: 'queue-001',
        queueNumber: 1,
        patient: dummyPatients[0],
        poli: dummyPolis[0],
        doctor: dummyDoctors[0],
        status: PatientStatus.EXAMINING,
        registrationDate: new Date().toISOString(),
        encounterId: 'enc-001',
        calledAt: new Date().toISOString()
    },
    {
        id: 'queue-002',
        queueNumber: 2,
        patient: dummyPatients[1],
        poli: dummyPolis[1],
        doctor: dummyDoctors[1],
        status: PatientStatus.EXAMINING,
        registrationDate: new Date().toISOString(),
        encounterId: 'enc-002',
        calledAt: new Date().toISOString()
    },
    {
        id: 'queue-003',
        queueNumber: 3,
        patient: dummyPatients[2],
        poli: dummyPolis[0],
        doctor: dummyDoctors[0],
        status: PatientStatus.EXAMINING,
        registrationDate: new Date().toISOString(),
        encounterId: 'enc-003',
        calledAt: new Date().toISOString()
    },
    {
        id: 'queue-004',
        queueNumber: 4,
        patient: dummyPatients[3],
        poli: dummyPolis[3],
        doctor: dummyDoctors[3],
        status: PatientStatus.WAITING,
        registrationDate: new Date().toISOString(),
        encounterId: 'enc-004'
    },
    {
        id: 'queue-005',
        queueNumber: 5,
        patient: dummyPatients[4],
        poli: dummyPolis[2],
        doctor: dummyDoctors[2],
        status: PatientStatus.WAITING,
        registrationDate: new Date().toISOString(),
        encounterId: 'enc-005'
    },
    {
        id: 'queue-006',
        queueNumber: 6,
        patient: dummyPatients[5],
        poli: dummyPolis[0],
        doctor: dummyDoctors[0],
        status: PatientStatus.WAITING,
        registrationDate: new Date().toISOString(),
        encounterId: 'enc-006'
    },
    {
        id: 'queue-007',
        queueNumber: 7,
        patient: dummyPatients[6],
        poli: dummyPolis[4],
        doctor: dummyDoctors[4],
        status: PatientStatus.WAITING,
        registrationDate: new Date().toISOString(),
        encounterId: 'enc-007'
    },
    {
        id: 'queue-008',
        queueNumber: 8,
        patient: dummyPatients[7],
        poli: dummyPolis[1],
        doctor: dummyDoctors[1],
        status: PatientStatus.WAITING,
        registrationDate: new Date().toISOString(),
        encounterId: 'enc-008'
    },
    {
        id: 'queue-009',
        queueNumber: 9,
        patient: dummyPatients[8],
        poli: dummyPolis[2],
        doctor: dummyDoctors[2],
        status: PatientStatus.WAITING,
        registrationDate: new Date().toISOString(),
        encounterId: 'enc-009'
    },
    {
        id: 'queue-010',
        queueNumber: 10,
        patient: dummyPatients[9],
        poli: dummyPolis[5],
        doctor: dummyDoctors[5],
        status: PatientStatus.WAITING,
        registrationDate: new Date().toISOString(),
        encounterId: 'enc-010'
    }
]

// Store for medical records
export const dummyMedicalRecords: MedicalRecord[] = [
    // Sample medical record for queue-001 (enc-001)
    {
        id: 'rec-001',
        encounterId: 'enc-001',
        patientId: 'pat-001',
        nurseId: 'nurse-001',
        nurseName: 'Perawat Demo',
        vitalSigns: {
            systolicBloodPressure: 120,
            diastolicBloodPressure: 80,
            temperature: 36.5,
            pulseRate: 78,
            respiratoryRate: 18,
            height: 170,
            weight: 68,
            bmi: 23.53,
            oxygenSaturation: 98
        },
        anamnesis: {
            chiefComplaint: 'Demam dan batuk sejak 3 hari',
            historyOfPresentIllness: 'Pasien mengeluh demam tinggi mencapai 38°C disertai batuk berdahak warna putih. Pasien juga merasa lemas.'
        },
        physicalExamination: {
            consciousness: 'Composmentis',
            generalCondition: 'Baik'
        },
        examinationDate: new Date().toISOString()
    },
    // Sample medical record for queue-002 (enc-002)
    {
        id: 'rec-002',
        encounterId: 'enc-002',
        patientId: 'pat-002',
        nurseId: 'nurse-001',
        nurseName: 'Perawat Demo',
        vitalSigns: {
            systolicBloodPressure: 140,
            diastolicBloodPressure: 90,
            temperature: 36.8,
            pulseRate: 82,
            respiratoryRate: 20,
            height: 165,
            weight: 75,
            bmi: 27.55,
            oxygenSaturation: 97
        },
        anamnesis: {
            chiefComplaint: 'Nyeri sendi lutut',
            historyOfPresentIllness: 'Pasien mengeluh nyeri pada lutut kanan sejak 1 minggu yang lalu, terutama saat berjalan.'
        },
        physicalExamination: {
            consciousness: 'Composmentis',
            generalCondition: 'Baik'
        },
        examinationDate: new Date().toISOString()
    },
    // Sample medical record for queue-003 (enc-003)
    {
        id: 'rec-003',
        encounterId: 'enc-003',
        patientId: 'pat-003',
        nurseId: 'nurse-001',
        nurseName: 'Perawat Demo',
        vitalSigns: {
            systolicBloodPressure: 110,
            diastolicBloodPressure: 70,
            temperature: 37.2,
            pulseRate: 75,
            respiratoryRate: 16,
            height: 160,
            weight: 55,
            bmi: 21.48,
            oxygenSaturation: 99
        },
        anamnesis: {
            chiefComplaint: 'Sakit kepala',
            historyOfPresentIllness: 'Pasien mengeluh sakit kepala yang hilang timbul sejak 2 hari yang lalu.'
        },
        physicalExamination: {
            consciousness: 'Composmentis',
            generalCondition: 'Baik'
        },
        examinationDate: new Date().toISOString()
    }
]
