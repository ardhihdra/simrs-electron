import { DataTypes } from 'sequelize';
import { sequelize } from '@main/database';
import z from 'zod';
import { ObservationStatus } from 'import { DiagnosticReportStatus } from '@main/models/enums / ResourceEnums'';

export const Observation = sequelize.define(
  'Observation',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      comment: 'ID unik untuk observation',
    },
    identifier: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Identifier unik untuk observation',
    },
    basedOn: {
      type: DataTypes.JSONB, // Changed to JSONB
      allowNull: true,
      comment: 'ID request yang mendasari observation',
    },
    partOf: {
      type: DataTypes.JSONB, // Changed to JSONB
      allowNull: true,
      comment: 'ID prosedur yang observation ini merupakan bagiannya',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ObservationStatus)),
      allowNull: false,
      comment: 'Status observation (registered, preliminary, final, amended, corrected, cancelled, entered-in-error, unknown)',
    },
    category: {
      type: DataTypes.JSONB, // Changed to JSONB
      allowNull: true,
      comment: 'Kategori observation (vital-signs, laboratory, imaging, survey, exam, therapy, activity, etc)',
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Kode tipe observation (LOINC, SNOMED CT, dll)',
    },
    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID pasien yang diobservasi',
    },
    focusId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID fokus observation jika bukan pasien',
    },
    focusType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tipe fokus observation',
    },
    encounterId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID encounter saat observation dilakukan',
    },
    effectiveDateTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Tanggal dan waktu observation dilakukan',
    },
    effectivePeriodStart: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Tanggal mulai periode observation',
    },
    effectivePeriodEnd: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Tanggal akhir periode observation',
    },
    effectiveTiming: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Timing observation dalam format FHIR timing',
    },
    effectiveInstant: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Instant waktu observation',
    },
    issued: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Tanggal hasil observation diterbitkan',
    },
    performer: {
      type: DataTypes.JSONB, // Changed to JSONB
      allowNull: true,
      comment: 'ID yang melakukan observation',
    },
    performerType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tipe performer (Practitioner, Organization, Patient, RelatedPerson)',
    },
    valueQuantity: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: true,
      comment: 'Nilai hasil observation dalam bentuk kuantitas',
    },
    valueUnit: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Unit dari nilai kuantitas',
    },
    valueCodeableConcept: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Nilai hasil dalam bentuk kode',
    },
    valueString: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Nilai hasil dalam bentuk string',
    },
    valueBoolean: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      comment: 'Nilai hasil dalam bentuk boolean',
    },
    valueInteger: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Nilai hasil dalam bentuk integer',
    },
    valueRange: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Nilai hasil dalam bentuk range',
    },
    valueRatio: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Nilai hasil dalam bentuk ratio',
    },
    valueSampledData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Nilai hasil dalam bentuk sampled data',
    },
    valueTime: {
      type: DataTypes.TIME,
      allowNull: true,
      comment: 'Nilai hasil dalam bentuk waktu',
    },
    valueDateTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Nilai hasil dalam bentuk datetime',
    },
    valuePeriodStart: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Nilai hasil periode mulai',
    },
    valuePeriodEnd: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Nilai hasil periode selesai',
    },
    dataAbsentReason: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Alasan data tidak tersedia',
    },
    interpretation: {
      type: DataTypes.JSONB, // Changed to JSONB
      allowNull: true,
      comment: 'Interpretasi hasil (normal, abnormal, high, low, dll)',
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Catatan tambahan tentang observation',
    },
    bodySite: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Lokasi anatomi tubuh yang diobservasi',
    },
    method: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Metode yang digunakan untuk observation',
    },
    specimenId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID specimen yang digunakan',
    },
    deviceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID device yang digunakan untuk observation',
    },
    referenceRange: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Range nilai referensi normal',
    },
    hasMember: {
      type: DataTypes.JSONB, // Changed to JSONB
      allowNull: true,
      comment: 'ID observation anggota (untuk group observations)',
    },
    derivedFrom: {
      type: DataTypes.JSONB, // Changed to JSONB
      allowNull: true,
      comment: 'ID sumber dari mana observation ini diturunkan',
    },
    component: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Komponen observation (untuk multi-component observations)',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Timestamp saat record dibuat',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Timestamp saat record terakhir diupdate',
    },
  },
  {
    tableName: 'Observations',
    timestamps: true,
    comment: 'Tabel untuk menyimpan pengukuran dan observasi klinis',
    indexes: [
      {
        fields: ['identifier'],
      },
      {
        fields: ['subjectId'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['code'],
      },
      {
        fields: ['encounterId'],
      },
      {
        fields: ['effectiveDateTime'],
      },
    ],
  }
);

export const ObservationSchema = z.object({
  identifier: z.string().nullable().optional(),
  basedOn: z.array(z.number()).nullable().optional(),
  partOf: z.array(z.number()).nullable().optional(),
  status: z.nativeEnum(ObservationStatus),
  category: z.array(z.string()).nullable().optional(),
  code: z.string(),
  subjectId: z.number(),
  focusId: z.number().nullable().optional(),
  focusType: z.string().nullable().optional(),
  encounterId: z.number().nullable().optional(),
  effectiveDateTime: z.union([z.date(), z.string()]).nullable().optional(),
  effectivePeriodStart: z.union([z.date(), z.string()]).nullable().optional(),
  effectivePeriodEnd: z.union([z.date(), z.string()]).nullable().optional(),
  effectiveTiming: z.string().nullable().optional(),
  effectiveInstant: z.union([z.date(), z.string()]).nullable().optional(),
  issued: z.union([z.date(), z.string()]).nullable().optional(),
  performer: z.array(z.number()).nullable().optional(),
  performerType: z.string().nullable().optional(),
  valueQuantity: z.number().nullable().optional(),
  valueUnit: z.string().nullable().optional(),
  valueCodeableConcept: z.string().nullable().optional(),
  valueString: z.string().nullable().optional(),
  valueBoolean: z.boolean().nullable().optional(),
  valueInteger: z.number().nullable().optional(),
  valueRange: z.string().nullable().optional(),
  valueRatio: z.string().nullable().optional(),
  valueSampledData: z.string().nullable().optional(),
  valueTime: z.string().nullable().optional(),
  valueDateTime: z.union([z.date(), z.string()]).nullable().optional(),
  valuePeriodStart: z.union([z.date(), z.string()]).nullable().optional(),
  valuePeriodEnd: z.union([z.date(), z.string()]).nullable().optional(),
  dataAbsentReason: z.string().nullable().optional(),
  interpretation: z.array(z.string()).nullable().optional(),
  note: z.string().nullable().optional(),
  bodySite: z.string().nullable().optional(),
  method: z.string().nullable().optional(),
  specimenId: z.number().nullable().optional(),
  deviceId: z.number().nullable().optional(),
  referenceRange: z.array(z.object({
    low: z.number().optional(),
    high: z.number().optional(),
    type: z.string().optional(),
    appliesTo: z.array(z.string()).optional(),
    age: z.object({
      low: z.number().optional(),
      high: z.number().optional(),
    }).optional(),
    text: z.string().optional(),
  })).nullable().optional(),
  hasMember: z.array(z.number()).nullable().optional(),
  derivedFrom: z.array(z.number()).nullable().optional(),
  component: z.array(z.object({
    code: z.string(),
    valueQuantity: z.number().optional(),
    valueCodeableConcept: z.string().optional(),
    valueString: z.string().optional(),
    valueBoolean: z.boolean().optional(),
    valueInteger: z.number().optional(),
    valueRange: z.object({
      low: z.number().optional(),
      high: z.number().optional(),
    }).optional(),
    valueRatio: z.object({
      numerator: z.number().optional(),
      denominator: z.number().optional(),
    }).optional(),
    valueSampledData: z.string().optional(),
    valueTime: z.string().optional(),
    valueDateTime: z.union([z.date(), z.string()]).optional(),
    valuePeriodStart: z.union([z.date(), z.string()]).optional(),
    valuePeriodEnd: z.union([z.date(), z.string()]).optional(),
    dataAbsentReason: z.string().optional(),
    interpretation: z.array(z.string()).optional(),
    referenceRange: z.array(z.any()).optional(), // Simplified for recursive type reference issue
  })).nullable().optional(),
});

export const ObservationSchemaWithId = ObservationSchema.extend({
  id: z.number(),
  createdAt: z.date().optional().nullable(),
  updatedAt: z.date().optional().nullable(),
});
