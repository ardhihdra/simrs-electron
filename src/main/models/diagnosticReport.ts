import { DataTypes } from 'sequelize'
import { sequelize } from '../database'
import { DiagnosticReportStatus } from './enums/ResourceEnums'

export const DiagnosticReport = sequelize.define(
  'DiagnosticReport',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      comment: 'ID unik untuk diagnostic report'
    },
    identifier: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Identifier unik untuk diagnostic report'
    },
    basedOn: {
      type: DataTypes.JSONB, // Changed to JSONB
      allowNull: true,
      comment: 'ID request yang mendasari laporan'
    },
    status: {
      type: DataTypes.ENUM(...Object.values(DiagnosticReportStatus)),
      allowNull: false,
      comment:
        'Status laporan (registered, partial, preliminary, final, amended, corrected, appended, cancelled, entered-in-error, unknown)'
    },
    category: {
      type: DataTypes.JSONB, // Changed to JSONB
      allowNull: true,
      comment: 'Kategori laporan (LAB, RAD, CT, MRI, dll)'
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Kode jenis laporan diagnostik (LOINC)'
    },
    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID pasien yang diperiksa'
    },
    encounterId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID encounter saat pemeriksaan'
    },
    effectiveDateTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Tanggal dan waktu pemeriksaan dilakukan'
    },
    effectivePeriodStart: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Tanggal mulai periode pemeriksaan'
    },
    effectivePeriodEnd: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Tanggal akhir periode pemeriksaan'
    },
    issued: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Tanggal laporan diterbitkan'
    },
    performer: {
      type: DataTypes.JSONB, // Changed to JSONB
      allowNull: true,
      comment: 'ID yang melakukan pemeriksaan'
    },
    performerType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tipe performer (Practitioner, Organization)'
    },
    resultsInterpreter: {
      type: DataTypes.JSONB, // Changed to JSONB
      allowNull: true,
      comment: 'ID yang menginterpretasi hasil'
    },
    resultsInterpreterType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tipe interpreter (Practitioner, Organization)'
    },
    specimenId: {
      type: DataTypes.JSONB, // Changed to JSONB
      allowNull: true,
      comment: 'ID specimen yang digunakan'
    },
    result: {
      type: DataTypes.JSONB, // Changed to JSONB
      allowNull: true,
      comment: 'ID hasil observation'
    },
    imagingStudy: {
      type: DataTypes.JSONB, // Changed to JSONB
      allowNull: true,
      comment: 'ID imaging study terkait'
    },
    media: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Media (gambar, video) yang terkait dengan laporan'
    },
    conclusion: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Kesimpulan klinis dari laporan'
    },
    conclusionCode: {
      type: DataTypes.JSONB, // Changed to JSONB
      allowNull: true,
      comment: 'Kode kesimpulan diagnosis'
    },
    presentedForm: {
      type: DataTypes.JSONB, // Changed to JSONB
      allowNull: true,
      comment: 'Form laporan yang dipresentasikan (PDF, image, dll)'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Timestamp saat record dibuat'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Timestamp saat record terakhir diupdate'
    }
  },
  {
    tableName: 'DiagnosticReports',
    timestamps: true,
    comment: 'Tabel untuk menyimpan laporan hasil diagnostik',
    indexes: [
      {
        fields: ['identifier']
      },
      {
        fields: ['subjectId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['code']
      },
      {
        fields: ['encounterId']
      },
      {
        fields: ['issued']
      }
    ]
  }
)

export { DiagnosticReportSchema, DiagnosticReportSchemaWithId } from '../../shared/diagnostic'
