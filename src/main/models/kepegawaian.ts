<<<<<<< HEAD
import z from 'zod'

const KontrakPegawaiSchema = z.object({
    id: z.number(),
    idPegawai: z.number(),
    kodeJabatan: z.string(),
    kodeDepartemen: z.string(),
    kodeLokasiKerja: z.string(),
    tanggalMulai: z.string(),
    tanggalSelesai: z.string().nullable().optional(),
    status: z.string(),
    createdAt: z.string().optional().nullable(),
    updatedAt: z.string().optional().nullable(),
    deletedAt: z.string().optional().nullable()
})

export const KepegawaianSchema = z.object({
    email: z.string(),
    namaLengkap: z.string().min(1),
    nik: z.string().min(1),
    tanggalLahir: z.string(),
    jenisKelamin: z.enum(['L', 'P']),
    alamat: z.string().nullable().optional(),
    nomorTelepon: z.string().nullable().optional(),
    hakAksesId: z.string().nullable().optional(),
    emailVerified: z.boolean().optional(),
    createdBy: z.number().nullable().optional(),
    updatedBy: z.number().nullable().optional(),
    deletedBy: z.number().nullable().optional()
})

export const KepegawaianSchemaWithId = KepegawaianSchema.extend({
    id: z.number(),
    removed: z.boolean().optional(),
    token: z.string().nullable().optional(),
    tokenExpiredAt: z.string().nullable().optional(),
    created_at: z.string().optional().nullable(),
    updated_at: z.string().optional().nullable(),
    deleted_at: z.string().optional().nullable(),
    kontrakPegawai: z.array(KontrakPegawaiSchema).optional()
}).passthrough()
=======
import { DataTypes } from 'sequelize'
import { sequelize } from '../database'
import z from 'zod'

export const Kepegawaian = sequelize.define(
  'Kepegawaian',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    removed: { type: DataTypes.BOOLEAN, defaultValue: false },
    email: { type: DataTypes.STRING, allowNull: false },
    namaLengkap: { type: DataTypes.STRING, allowNull: false },
    nik: { type: DataTypes.STRING, allowNull: false },
    tanggalLahir: { type: DataTypes.DATE, allowNull: false },
    jenisKelamin: { type: DataTypes.ENUM('L', 'P'), allowNull: false },
    alamat: { type: DataTypes.STRING, allowNull: true },
    nomorTelepon: { type: DataTypes.STRING, allowNull: true },
    hakAkses: { type: DataTypes.ENUM('administrator','manager','admin','admin_backoffice','operator_gudang','doctor','nurse','pharmacist','receptionist','lab_technician','radiologist','accountant','patient'), allowNull: true },
    kodeHakAkses: { type: DataTypes.STRING, allowNull: true },
    hakAksesId: { type: DataTypes.STRING, allowNull: true },
    hash: { type: DataTypes.STRING, allowNull: true },
    emailToken: { type: DataTypes.STRING, allowNull: true },
    resetToken: { type: DataTypes.STRING, allowNull: true },
    emailVerified: { type: DataTypes.BOOLEAN, allowNull: true },
    loggedSessions: { type: DataTypes.JSON, allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: false },
    updatedBy: { type: DataTypes.INTEGER, allowNull: true },
    deletedBy: { type: DataTypes.INTEGER, allowNull: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    deletedAt: { type: DataTypes.DATE, allowNull: true }
  },
  {
    paranoid: true,
    indexes: [{ fields: ['nik'] }, { fields: ['namaLengkap'] }]
  }
)

export const KepegawaianSchema = z.object({
  removed: z.boolean().optional(),
  email: z.string().email().optional(),
  namaLengkap: z.string().min(1),
  nik: z.string().min(1),
  tanggalLahir: z.union([z.date(), z.string()]).optional(),
  jenisKelamin: z.enum(['L', 'P']).optional(),
  alamat: z.string().nullable().optional(),
  nomorTelepon: z.string().nullable().optional(),
  hakAkses: z.enum(['administrator','manager','admin','admin_backoffice','operator_gudang','doctor','nurse','pharmacist','receptionist','lab_technician','radiologist','accountant','patient']).nullable().optional(),
  kodeHakAkses: z.string().nullable().optional(),
  hakAksesId: z.string().nullable().optional(),
  hash: z.string().nullable().optional(),
  emailToken: z.string().nullable().optional(),
  resetToken: z.string().nullable().optional(),
  emailVerified: z.boolean().nullable().optional(),
  loggedSessions: z.array(z.string()).nullable().optional(),
  idSatuSehat: z.string().nullable().optional(),
  createdBy: z.number().nullable().optional(),
  updatedBy: z.number().nullable().optional(),
  deletedBy: z.number().nullable().optional(),
  kontrakPegawai: z
    .array(
      z.object({
        idKontrakPegawai: z.number().optional(),
        idPegawai: z.number().optional(),
        nip: z.string().optional(),
        kodeDivisi: z.string().nullable().optional(),
        kodeDepartemen: z.string().nullable().optional(),
        kodeJabatan: z.string().nullable().optional(),
        tanggalMulaiKontrak: z.union([z.date(), z.string()]).nullable().optional(),
        tanggalBerakhirKontrak: z.union([z.date(), z.string()]).nullable().optional(),
        statusKontrak: z.string().nullable().optional()
      })
    )
    .optional()
})

export const KepegawaianSchemaWithId = KepegawaianSchema.extend({
  id: z.number(),
  createdAt: z.date().optional().nullable(),
  updatedAt: z.date().optional().nullable(),
  deletedAt: z.date().optional().nullable()
})
>>>>>>> 7933124d3b6bd1362884ad0d4fd77253b4932c19
