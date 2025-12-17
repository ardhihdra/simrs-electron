import { DataTypes } from 'sequelize'
import { sequelize } from '../database'
import z from 'zod'

export const Patient = sequelize.define(
  'Patient',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    identifier: { type: DataTypes.STRING, allowNull: true },
    kode: { type: DataTypes.STRING, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    gender: { type: DataTypes.ENUM('male', 'female'), allowNull: false },
    birthDate: { type: DataTypes.DATE, allowNull: false },
    placeOfBirth: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true },
    addressLine: { type: DataTypes.STRING, allowNull: true },
    province: { type: DataTypes.STRING, allowNull: true },
    city: { type: DataTypes.STRING, allowNull: true },
    district: { type: DataTypes.STRING, allowNull: true },
    village: { type: DataTypes.STRING, allowNull: true },
    postalCode: { type: DataTypes.STRING, allowNull: true },
    country: { type: DataTypes.STRING, allowNull: true },
    maritalStatus: { type: DataTypes.ENUM('single', 'married', 'divorced'), allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
    updatedBy: { type: DataTypes.INTEGER, allowNull: true },
    deletedBy: { type: DataTypes.INTEGER, allowNull: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    deletedAt: { type: DataTypes.DATE, allowNull: true }
  },
  {
    paranoid: true,
    indexes: [{ fields: ['kode'] }, { fields: ['name'] }]
  }
)

export const PatientSchema = z.object({
  active: z.boolean().optional(),
  identifier: z.string().nullable().optional(),
  kode: z.string().min(1),
  name: z.string().min(1),
  gender: z.enum(['male', 'female']),
  birthDate: z.union([z.date(), z.string()]),
  placeOfBirth: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  addressLine: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  village: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  maritalStatus: z.enum(['single', 'married', 'divorced']).nullable().optional(),
  createdBy: z.number().nullable().optional(),
  updatedBy: z.number().nullable().optional(),
  deletedBy: z.number().nullable().optional()
})

export const PatientSchemaWithId = PatientSchema.extend({
  id: z.number(),
  createdBy: z.number().nullable().optional(),
  updatedBy: z.number().nullable().optional(),
  deletedBy: z.number().nullable().optional(),
  createdAt: z.date().optional().nullable(),
  updatedAt: z.date().optional().nullable(),
  deletedAt: z.date().optional().nullable()
})
