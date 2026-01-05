import { DataTypes } from 'sequelize'
import { sequelize } from '@main/database'
import z from 'zod'

// Sequelize model definition (kept for potential usage in main process)
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
    hakAkses: {
      type: DataTypes.ENUM(
        'administrator',
        'manager',
        'admin',
        'admin_backoffice',
        'operator_gudang',
        'doctor',
        'nurse',
        'pharmacist',
        'receptionist',
        'lab_technician',
        'radiologist',
        'accountant',
        'patient'
      ),
      allowNull: true
    },
    kodeHakAkses: { type: DataTypes.STRING, allowNull: true },
    hakAksesId: { type: DataTypes.STRING, allowNull: true },
    hash: { type: DataTypes.STRING, allowNull: true },
    emailToken: { type: DataTypes.STRING, allowNull: true },
    resetToken: { type: DataTypes.STRING, allowNull: true },
    emailVerified: { type: DataTypes.BOOLEAN, allowNull: true },
    loggedSessions: { type: DataTypes.JSON, allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
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

// Zod schemas used by IPC routes and backend client parsing
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
});

export const KepegawaianSchemaWithId = KepegawaianSchema.extend({
  id: z.number(),
  removed: z.boolean().optional(),
  token: z.string().nullable().optional(),
  tokenExpiredAt: z.string().nullable().optional(),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
  deleted_at: z.string().optional().nullable(),
  kontrakPegawai: z.array(KontrakPegawaiSchema).optional()
});
