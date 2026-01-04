export enum FinancialResourceStatus {
  ACTIVE = 'active', // Resource aktif
  CANCELLED = 'cancelled', // Resource dibatalkan
  DRAFT = 'draft', // Resource masih draft
  ENTERED_IN_ERROR = 'entered-in-error', // Resource dibuat karena kesalahan
}

/**
 * Hasil umum dari pemrosesan permintaan finansial.
 */
export enum FinancialProcessingOutcome {
  QUEUED = 'queued', // Dalam antrian
  COMPLETE = 'complete', // Selesai diproses
  ERROR = 'error', // Terjadi kesalahan
  PARTIAL = 'partial', // Hanya sebagian diproses
}

/**
 * Tujuan permintaan atau respons eligibility.
 */
export enum EligibilityPurpose {
  AUTH_REQUIREMENTS = 'auth-requirements', // Persyaratan otorisasi
  BENEFITS = 'benefits', // Informasi manfaat
  DISCOVERY = 'discovery', // Penemuan coverage
  VALIDATION = 'validation', // Validasi informasi
}

/**
 * Status publikasi untuk definisi maupun plan.
 */
export enum PublicationStatus {
  DRAFT = 'draft', // Masih draft
  ACTIVE = 'active', // Sudah aktif
  RETIRED = 'retired', // Sudah pensiun
  UNKNOWN = 'unknown', // Status tidak diketahui
}

/**
 * Status charge item.
 */
export enum ChargeItemStatus {
  PLANNED = 'planned', // Direncanakan
  BILLABLE = 'billable', // Dapat ditagih
  NOT_BILLABLE = 'not-billable', // Tidak dapat ditagih
  ABORTED = 'aborted', // Dibatalkan
  BILLED = 'billed', // Sudah ditagih
  ENTERED_IN_ERROR = 'entered-in-error', // Dibuat karena kesalahan
  UNKNOWN = 'unknown', // Status tidak diketahui
}

/**
 * Status kontrak finansial.
 */
export enum ContractStatus {
  AMENDED = 'amended', // Kontrak telah diubah
  APPENDED = 'appended', // Kontrak telah ditambahkan
  CANCELLED = 'cancelled', // Kontrak dibatalkan
  DISPUTED = 'disputed', // Kontrak dalam sengketa
  ENTERED_IN_ERROR = 'entered-in-error', // Kontrak dibuat karena kesalahan
  EXECUTABLE = 'executable', // Kontrak dapat dieksekusi
  EXECUTED = 'executed', // Kontrak telah dieksekusi
  NEGOTIABLE = 'negotiable', // Kontrak dapat dinegosiasikan
  OFFERED = 'offered', // Kontrak ditawarkan
  POLICY = 'policy', // Kontrak adalah kebijakan
  REJECTED = 'rejected', // Kontrak ditolak
  RENEWED = 'renewed', // Kontrak diperpanjang
  REVOKED = 'revoked', // Kontrak dicabut
  RESOLVED = 'resolved', // Kontrak diselesaikan
  TERMINATED = 'terminated', // Kontrak dihentikan
}

/**
 * Tipe klaim yang dapat diajukan.
 */
export enum ClaimType {
  INSTITUTIONAL = 'institutional', // Klaim institusional (rumah sakit)
  ORAL = 'oral', // Klaim perawatan gigi
  PHARMACY = 'pharmacy', // Klaim farmasi/obat
  PROFESSIONAL = 'professional', // Klaim profesional (dokter)
  VISION = 'vision', // Klaim penglihatan/optik
}

/**
 * Penggunaan klaim.
 */
export enum ClaimUse {
  CLAIM = 'claim', // Klaim normal untuk pembayaran
  PREAUTHORIZATION = 'preauthorization', // Pre-otorisasi sebelum layanan
  PREDETERMINATION = 'predetermination', // Predeterminasi biaya
}

/**
 * Prioritas pemrosesan klaim.
 */
export enum ClaimPriority {
  STAT = 'stat', // Segera/darurat
  NORMAL = 'normal', // Normal
  DEFERRED = 'deferred', // Ditunda
}

/**
 * Jenis adjudikasi keuangan.
 */
export enum AdjudicationType {
  SUBMITTED = 'submitted', // Jumlah yang diajukan
  COPAY = 'copay', // Copay
  ELIGIBLE = 'eligible', // Jumlah yang eligible
  DEDUCTIBLE = 'deductible', // Deductible
  BENEFIT = 'benefit', // Benefit yang dibayar
  TAX = 'tax', // Pajak
  TOTAL = 'total', // Total keseluruhan
}

/**
 * Tipe coverage asuransi.
 */
export enum CoverageType {
  MEDICAL = 'medical', // Asuransi medis
  DENTAL = 'dental', // Asuransi gigi
  MENTAL_HEALTH = 'mental-health', // Asuransi kesehatan mental
  SUBSTANCE_ABUSE = 'substance-abuse', // Asuransi penyalahgunaan zat
  VISION = 'vision', // Asuransi penglihatan
  DRUG = 'drug', // Asuransi obat
  SHORT_TERM = 'short-term', // Asuransi jangka pendek
  LONG_TERM_CARE = 'long-term-care', // Asuransi perawatan jangka panjang
  HOSPICE = 'hospice', // Asuransi hospice
  HOME_HEALTH = 'home-health', // Asuransi perawatan di rumah
}

/**
 * Hubungan subscriber dengan beneficiary.
 */
export enum SubscriberRelationship {
  SELF = 'self', // Diri sendiri
  SPOUSE = 'spouse', // Pasangan
  CHILD = 'child', // Anak
  PARENT = 'parent', // Orang tua
  OTHER = 'other', // Lainnya
}

/**
 * Status invoice.
 */
export enum InvoiceStatus {
  DRAFT = 'draft', // Invoice masih draft
  ISSUED = 'issued', // Invoice sudah diterbitkan
  BALANCED = 'balanced', // Invoice sudah seimbang/lunas
  CANCELLED = 'cancelled', // Invoice dibatalkan
  ENTERED_IN_ERROR = 'entered-in-error', // Invoice dibuat karena kesalahan
}

/**
 * Jenis komponen harga.
 */
export enum PriceComponentType {
  BASE = 'base', // Harga dasar
  SURCHARGE = 'surcharge', // Biaya tambahan
  DEDUCTION = 'deduction', // Potongan
  DISCOUNT = 'discount', // Diskon
  TAX = 'tax', // Pajak
  INFORMATIONAL = 'informational', // Informasi saja
}

/**
 * ===== Clinical resource enums =====
 */

/**
 * Aktualitas dari kejadian merugikan.
 */
export enum AdverseEventActuality {
  ACTUAL = 'actual', // Kejadian nyata
  POTENTIAL = 'potential', // Kejadian potensial
}

/**
 * Status klinis alergi atau intoleransi.
 */
export enum AllergyIntoleranceClinicalStatus {
  ACTIVE = 'active', // Alergi aktif
  INACTIVE = 'inactive', // Alergi tidak aktif
  RESOLVED = 'resolved', // Alergi sudah sembuh
}

/**
 * Status verifikasi dari alergi.
 */
export enum AllergyIntoleranceVerificationStatus {
  UNCONFIRMED = 'unconfirmed', // Belum dikonfirmasi
  CONFIRMED = 'confirmed', // Sudah dikonfirmasi
  REFUTED = 'refuted', // Dibantah/tidak benar
  ENTERED_IN_ERROR = 'entered-in-error', // Dimasukkan karena kesalahan
}

/**
 * Tipe alergi atau intoleransi.
 */
export enum AllergyIntoleranceType {
  ALLERGY = 'allergy', // Alergi
  INTOLERANCE = 'intolerance', // Intoleransi
}

/**
 * Kategori substansi alergi.
 */
export enum AllergyIntoleranceCategory {
  FOOD = 'food', // Makanan
  MEDICATION = 'medication', // Obat
  ENVIRONMENT = 'environment', // Lingkungan
  BIOLOGIC = 'biologic', // Biologis
}

/**
 * Tingkat kekritisan alergi.
 */
export enum AllergyIntoleranceCriticality {
  LOW = 'low', // Rendah
  HIGH = 'high', // Tinggi
  UNABLE_TO_ASSESS = 'unable-to-assess', // Tidak dapat dinilai
}

/**
 * Tingkat keparahan reaksi alergi.
 */
export enum ReactionSeverity {
  MILD = 'mild', // Ringan
  MODERATE = 'moderate', // Sedang
  SEVERE = 'severe', // Parah
}

/**
 * Status care plan.
 */
export enum CarePlanStatus {
  DRAFT = 'draft', // Draft
  ACTIVE = 'active', // Aktif
  ON_HOLD = 'on-hold', // Ditunda
  REVOKED = 'revoked', // Dicabut
  COMPLETED = 'completed', // Selesai
  ENTERED_IN_ERROR = 'entered-in-error', // Kesalahan input
  UNKNOWN = 'unknown', // Tidak diketahui
}

/**
 * Intent care plan.
 */
export enum CarePlanIntent {
  PROPOSAL = 'proposal', // Proposal
  PLAN = 'plan', // Rencana
  ORDER = 'order', // Order
  OPTION = 'option', // Opsi
}

/**
 * Status anggota tim perawatan.
 */
export enum CareTeamStatus {
  PROPOSED = 'proposed',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INACTIVE = 'inactive',
  ENTERED_IN_ERROR = 'entered-in-error',
}

/**
 * Status clinical impression.
 */
export enum ClinicalImpressionStatus {
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  ENTERED_IN_ERROR = 'entered-in-error',
}

/**
 * Status komunikasi yang dilakukan.
 */
export enum CommunicationStatus {
  PREPARATION = 'preparation',
  IN_PROGRESS = 'in-progress',
  NOT_DONE = 'not-done',
  ON_HOLD = 'on-hold',
  STOPPED = 'stopped',
  COMPLETED = 'completed',
  ENTERED_IN_ERROR = 'entered-in-error',
  UNKNOWN = 'unknown',
}

/**
 * Prioritas komunikasi.
 */
export enum CommunicationPriority {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  ASAP = 'asap',
  STAT = 'stat',
}

/**
 * Status permintaan komunikasi.
 */
export enum CommunicationRequestStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ON_HOLD = 'on-hold',
  REVOKED = 'revoked',
  COMPLETED = 'completed',
  ENTERED_IN_ERROR = 'entered-in-error',
  UNKNOWN = 'unknown',
}

/**
 * Prioritas permintaan komunikasi.
 */
export enum CommunicationRequestPriority {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  ASAP = 'asap',
  STAT = 'stat',
}

/**
 * Status klinis kondisi/diagnosis.
 */
export enum ConditionClinicalStatus {
  ACTIVE = 'active', // Kondisi aktif
  RECURRENCE = 'recurrence', // Kambuh
  RELAPSE = 'relapse', // Relapse
  INACTIVE = 'inactive', // Tidak aktif
  REMISSION = 'remission', // Remisi
  RESOLVED = 'resolved', // Sembuh
}

/**
 * Status verifikasi kondisi/diagnosis.
 */
export enum ConditionVerificationStatus {
  UNCONFIRMED = 'unconfirmed', // Belum dikonfirmasi
  PROVISIONAL = 'provisional', // Provisional
  DIFFERENTIAL = 'differential', // Differential
  CONFIRMED = 'confirmed', // Dikonfirmasi
  REFUTED = 'refuted', // Dibantah
  ENTERED_IN_ERROR = 'entered-in-error', // Kesalahan input
}

/**
 * Tingkat keparahan kondisi.
 */
export enum ConditionSeverity {
  MILD = 'mild', // Ringan
  MODERATE = 'moderate', // Sedang
  SEVERE = 'severe', // Parah
}

/**
 * Status issue yang terdeteksi.
 */
export enum DetectedIssueStatus {
  REGISTERED = 'registered',
  PRELIMINARY = 'preliminary',
  FINAL = 'final',
  AMENDED = 'amended',
  CORRECTED = 'corrected',
  CANCELLED = 'cancelled',
  ENTERED_IN_ERROR = 'entered-in-error',
  UNKNOWN = 'unknown',
}

/**
 * Tingkat keparahan detected issue.
 */
export enum DetectedIssueSeverity {
  HIGH = 'high',
  MODERATE = 'moderate',
  LOW = 'low',
}

/**
 * Status permintaan perangkat.
 */
export enum DeviceRequestStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ON_HOLD = 'on-hold',
  REVOKED = 'revoked',
  COMPLETED = 'completed',
  ENTERED_IN_ERROR = 'entered-in-error',
  UNKNOWN = 'unknown',
}

/**
 * Intent permintaan perangkat.
 */
export enum DeviceRequestIntent {
  PROPOSAL = 'proposal',
  PLAN = 'plan',
  DIRECTIVE = 'directive',
  ORDER = 'order',
  ORIGINAL_ORDER = 'original-order',
  REFLEX_ORDER = 'reflex-order',
  FILLER_ORDER = 'filler-order',
  INSTANCE_ORDER = 'instance-order',
  OPTION = 'option',
}

/**
 * Status penggunaan device oleh pasien.
 */
export enum DeviceUseStatementStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ENTERED_IN_ERROR = 'entered-in-error',
  INTENDED = 'intended',
  STOPPED = 'stopped',
  ON_HOLD = 'on-hold',
}

/**
 * Status laporan diagnostik.
 */
export enum DiagnosticReportStatus {
  REGISTERED = 'registered', // Terdaftar
  PARTIAL = 'partial', // Sebagian
  PRELIMINARY = 'preliminary', // Preliminary
  FINAL = 'final', // Final
  AMENDED = 'amended', // Diubah
  CORRECTED = 'corrected', // Dikoreksi
  APPENDED = 'appended', // Ditambahkan
  CANCELLED = 'cancelled', // Dibatalkan
  ENTERED_IN_ERROR = 'entered-in-error', // Kesalahan input
  UNKNOWN = 'unknown', // Tidak diketahui
}

/**
 * Status riwayat keluarga.
 */
export enum FamilyMemberHistoryStatus {
  PARTIAL = 'partial',
  COMPLETED = 'completed',
  ENTERED_IN_ERROR = 'entered-in-error',
  HEALTH_UNKNOWN = 'health-unknown',
}

/**
 * Status goal pasien.
 */
export enum GoalLifecycleStatus {
  PROPOSED = 'proposed',
  PLANNED = 'planned',
  ACCEPTED = 'accepted',
  ACTIVE = 'active',
  ON_HOLD = 'on-hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ENTERED_IN_ERROR = 'entered-in-error',
  REJECTED = 'rejected',
}

/**
 * Status guidance response.
 */
export enum GuidanceResponseStatus {
  SUCCESS = 'success',
  DATA_REQUESTED = 'data-requested',
  DATA_REQUIRED = 'data-required',
  IN_PROGRESS = 'in-progress',
  FAILURE = 'failure',
  ENTERED_IN_ERROR = 'entered-in-error',
}

/**
 * Status studi imaging.
 */
export enum ImagingStudyStatus {
  REGISTERED = 'registered',
  AVAILABLE = 'available',
  CANCELLED = 'cancelled',
  ENTERED_IN_ERROR = 'entered-in-error',
  UNKNOWN = 'unknown',
}

/**
 * Status imunisasi yang diberikan.
 */
export enum ImmunizationStatus {
  COMPLETED = 'completed', // Selesai
  ENTERED_IN_ERROR = 'entered-in-error', // Kesalahan input
  NOT_DONE = 'not-done', // Tidak dilakukan
}

/**
 * Status evaluasi imunisasi.
 */
export enum ImmunizationEvaluationStatus {
  COMPLETED = 'completed',
  ENTERED_IN_ERROR = 'entered-in-error',
}

/**
 * Status media klinis.
 */
export enum MediaStatus {
  PREPARATION = 'preparation',
  IN_PROGRESS = 'in-progress',
  NOT_DONE = 'not-done',
  ON_HOLD = 'on-hold',
  STOPPED = 'stopped',
  COMPLETED = 'completed',
  ENTERED_IN_ERROR = 'entered-in-error',
  UNKNOWN = 'unknown',
}

/**
 * Status obat.
 */
export enum MedicationStatus {
  ACTIVE = 'active', // Aktif
  INACTIVE = 'inactive', // Tidak aktif
  ENTERED_IN_ERROR = 'entered-in-error', // Kesalahan input
}

/**
 * Status pengetahuan obat.
 */
export enum MedicationKnowledgeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ENTERED_IN_ERROR = 'entered-in-error',
}

/**
 * Status permintaan obat.
 */
export enum MedicationRequestStatus {
  ACTIVE = 'active', // Aktif
  ON_HOLD = 'on-hold', // Ditunda
  CANCELLED = 'cancelled', // Dibatalkan
  COMPLETED = 'completed', // Selesai
  ENTERED_IN_ERROR = 'entered-in-error', // Kesalahan input
  STOPPED = 'stopped', // Dihentikan
  DRAFT = 'draft', // Draft
  UNKNOWN = 'unknown', // Tidak diketahui
}

/**
 * Intent permintaan obat.
 */
export enum MedicationRequestIntent {
  PROPOSAL = 'proposal', // Proposal
  PLAN = 'plan', // Rencana
  ORDER = 'order', // Order
  ORIGINAL_ORDER = 'original-order', // Order asli
  REFLEX_ORDER = 'reflex-order', // Reflex order
  FILLER_ORDER = 'filler-order', // Filler order
  INSTANCE_ORDER = 'instance-order', // Instance order
  OPTION = 'option', // Opsi
}

/**
 * Prioritas permintaan obat.
 */
export enum MedicationRequestPriority {
  ROUTINE = 'routine', // Rutin
  URGENT = 'urgent', // Mendesak
  ASAP = 'asap', // Sesegera mungkin
  STAT = 'stat', // Segera/darurat
}

/**
 * Status pemberian obat.
 */
export enum MedicationAdministrationStatus {
  IN_PROGRESS = 'in-progress', // Sedang berlangsung
  NOT_DONE = 'not-done', // Tidak dilakukan
  ON_HOLD = 'on-hold', // Ditunda
  COMPLETED = 'completed', // Selesai
  ENTERED_IN_ERROR = 'entered-in-error', // Kesalahan input
  STOPPED = 'stopped', // Dihentikan
  UNKNOWN = 'unknown', // Tidak diketahui
}

/**
 * Status penyerahan obat.
 */
export enum MedicationDispenseStatus {
  PREPARATION = 'preparation', // Persiapan
  IN_PROGRESS = 'in-progress', // Sedang berlangsung
  CANCELLED = 'cancelled', // Dibatalkan
  ON_HOLD = 'on-hold', // Ditunda
  COMPLETED = 'completed', // Selesai
  ENTERED_IN_ERROR = 'entered-in-error', // Kesalahan input
  STOPPED = 'stopped', // Dihentikan
  DECLINED = 'declined', // Ditolak
  UNKNOWN = 'unknown', // Tidak diketahui
}

/**
 * Status pernyataan penggunaan obat.
 */
export enum MedicationStatementStatus {
  ACTIVE = 'active', // Aktif
  COMPLETED = 'completed', // Selesai
  ENTERED_IN_ERROR = 'entered-in-error', // Kesalahan input
  INTENDED = 'intended', // Dimaksudkan
  STOPPED = 'stopped', // Dihentikan
  ON_HOLD = 'on-hold', // Ditunda
  UNKNOWN = 'unknown', // Tidak diketahui
  NOT_TAKEN = 'not-taken', // Tidak diminum
}

/**
 * Jenis sekuens molekuler.
 */
export enum MolecularSequenceType {
  AA = 'aa',
  DNA = 'dna',
  RNA = 'rna',
}

/**
 * Status nutrition order.
 */
export enum NutritionOrderStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ON_HOLD = 'on-hold',
  REVOKED = 'revoked',
  COMPLETED = 'completed',
  ENTERED_IN_ERROR = 'entered-in-error',
  UNKNOWN = 'unknown',
}

/**
 * Intent nutrition order.
 */
export enum NutritionOrderIntent {
  PROPOSAL = 'proposal',
  PLAN = 'plan',
  DIRECTIVE = 'directive',
  ORDER = 'order',
  ORIGINAL_ORDER = 'original-order',
  REFLEX_ORDER = 'reflex-order',
  FILLER_ORDER = 'filler-order',
  INSTANCE_ORDER = 'instance-order',
  OPTION = 'option',
}

/**
 * Status observation klinis.
 */
export enum ObservationStatus {
  REGISTERED = 'registered', // Terdaftar
  PRELIMINARY = 'preliminary', // Preliminary
  FINAL = 'final', // Final
  AMENDED = 'amended', // Diubah
  CORRECTED = 'corrected', // Dikoreksi
  CANCELLED = 'cancelled', // Dibatalkan
  ENTERED_IN_ERROR = 'entered-in-error', // Kesalahan input
  UNKNOWN = 'unknown', // Tidak diketahui
}

/**
 * Status prosedur klinis.
 */
export enum ProcedureStatus {
  PREPARATION = 'preparation', // Persiapan
  IN_PROGRESS = 'in-progress', // Sedang berlangsung
  NOT_DONE = 'not-done', // Tidak dilakukan
  ON_HOLD = 'on-hold', // Ditunda
  STOPPED = 'stopped', // Dihentikan
  COMPLETED = 'completed', // Selesai
  ENTERED_IN_ERROR = 'entered-in-error', // Kesalahan input
  UNKNOWN = 'unknown', // Tidak diketahui
}

/**
 * Status response kuesioner.
 */
export enum QuestionnaireResponseStatus {
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  AMENDED = 'amended',
  ENTERED_IN_ERROR = 'entered-in-error',
  STOPPED = 'stopped',
}

/**
 * Status request group.
 */
export enum RequestGroupStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ON_HOLD = 'on-hold',
  REVOKED = 'revoked',
  COMPLETED = 'completed',
  ENTERED_IN_ERROR = 'entered-in-error',
  UNKNOWN = 'unknown',
}

/**
 * Intent request group.
 */
export enum RequestGroupIntent {
  PROPOSAL = 'proposal',
  PLAN = 'plan',
  DIRECTIVE = 'directive',
  ORDER = 'order',
  ORIGINAL_ORDER = 'original-order',
  REFLEX_ORDER = 'reflex-order',
  FILLER_ORDER = 'filler-order',
  INSTANCE_ORDER = 'instance-order',
  OPTION = 'option',
}

/**
 * Prioritas request group.
 */
export enum RequestGroupPriority {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  ASAP = 'asap',
  STAT = 'stat',
}

/**
 * Status penilaian risiko.
 */
export enum RiskAssessmentStatus {
  REGISTERED = 'registered',
  PRELIMINARY = 'preliminary',
  FINAL = 'final',
  AMENDED = 'amended',
  CORRECTED = 'corrected',
  CANCELLED = 'cancelled',
  ENTERED_IN_ERROR = 'entered-in-error',
  UNKNOWN = 'unknown',
}

/**
 * Status permintaan layanan.
 */
export enum ServiceRequestStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ON_HOLD = 'on-hold',
  REVOKED = 'revoked',
  COMPLETED = 'completed',
  ENTERED_IN_ERROR = 'entered-in-error',
  UNKNOWN = 'unknown',
}

/**
 * Intent permintaan layanan.
 */
export enum ServiceRequestIntent {
  PROPOSAL = 'proposal',
  PLAN = 'plan',
  DIRECTIVE = 'directive',
  ORDER = 'order',
  ORIGINAL_ORDER = 'original-order',
  REFLEX_ORDER = 'reflex-order',
  FILLER_ORDER = 'filler-order',
  INSTANCE_ORDER = 'instance-order',
  OPTION = 'option',
}

/**
 * Prioritas permintaan layanan.
 */
export enum ServiceRequestPriority {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  ASAP = 'asap',
  STAT = 'stat',
}

/**
 * Status specimen.
 */
export enum SpecimenStatus {
  AVAILABLE = 'available', // Tersedia
  UNAVAILABLE = 'unavailable', // Tidak tersedia
  UNSATISFACTORY = 'unsatisfactory', // Tidak memuaskan
  ENTERED_IN_ERROR = 'entered-in-error', // Kesalahan input
}

/**
 * Status resep penglihatan.
 */
export enum VisionPrescriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  DRAFT = 'draft',
  ENTERED_IN_ERROR = 'entered-in-error',
}
