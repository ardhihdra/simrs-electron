import { DataTypes } from 'sequelize';
import { sequelize } from '@main/database';
import z from 'zod';
import {
  ConditionClinicalStatus,
  ConditionSeverity,
  ConditionVerificationStatus,
} from '@main/models/enums/ResourceEnums';

export const Condition = sequelize.define(
  'Condition',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      comment: 'ID unik untuk condition',
    },
    identifier: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Identifier unik untuk condition',
    },
    clinicalStatus: {
      type: DataTypes.ENUM(...Object.values(ConditionClinicalStatus)),
      allowNull: true,
      comment: 'Status klinis (active, recurrence, relapse, inactive, remission, resolved)',
    },
    verificationStatus: {
      type: DataTypes.ENUM(...Object.values(ConditionVerificationStatus)),
      allowNull: true,
      comment: 'Status verifikasi (unconfirmed, provisional, differential, confirmed, refuted, entered-in-error)',
    },
    category: {
      type: DataTypes.JSONB, // Changed to JSONB for array storage compatibility
      allowNull: true,
      comment: 'Kategori kondisi (problem-list-item, encounter-diagnosis, dll)',
    },
    severity: {
      type: DataTypes.ENUM(...Object.values(ConditionSeverity)),
      allowNull: true,
      comment: 'Tingkat keparahan (mild, moderate, severe)',
    },
    code: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Kode diagnosis (ICD-10, SNOMED CT, dll)',
    },
    bodySite: {
      type: DataTypes.JSONB, // Changed to JSONB
      allowNull: true,
      comment: 'Lokasi anatomi tubuh yang terkena',
    },
    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'ID pasien yang memiliki kondisi',
    },
    encounterId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID encounter saat kondisi dicatat',
    },
    onsetDateTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Tanggal dan waktu onset kondisi',
    },
    onsetAge: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Usia saat onset (dalam tahun)',
    },
    onsetPeriodStart: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Tanggal mulai periode onset',
    },
    onsetPeriodEnd: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Tanggal akhir periode onset',
    },
    onsetRange: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Range onset',
    },
    onsetString: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Deskripsi onset dalam teks',
    },
    abatementDateTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Tanggal dan waktu kondisi sembuh/hilang',
    },
    abatementAge: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Usia saat sembuh (dalam tahun)',
    },
    abatementPeriodStart: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Tanggal mulai periode sembuh',
    },
    abatementPeriodEnd: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Tanggal akhir periode sembuh',
    },
    abatementRange: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Range sembuh',
    },
    abatementString: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Deskripsi sembuh dalam teks',
    },
    recordedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Tanggal kondisi dicatat dalam sistem',
    },
    recorder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID yang mencatat kondisi',
    },
    recorderType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tipe recorder (Practitioner, Patient, RelatedPerson)',
    },
    asserter: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID yang menyatakan kondisi',
    },
    asserterType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tipe asserter (Practitioner, Patient, RelatedPerson)',
    },
    stage: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Stadium atau fase kondisi',
    },
    evidence: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Bukti pendukung diagnosis',
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Catatan tambahan tentang kondisi',
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
    tableName: 'Conditions',
    timestamps: true,
    comment: 'Tabel untuk menyimpan kondisi klinis atau diagnosis pasien',
    indexes: [
      {
        fields: ['identifier'],
      },
      {
        fields: ['subjectId'],
      },
      {
        fields: ['clinicalStatus'],
      },
      {
        fields: ['code'],
      },
      {
        fields: ['encounterId'],
      },
    ],
  }
);


