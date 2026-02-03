import { DataTypes } from 'sequelize'
import { sequelize } from '@main/database'
import z from 'zod'
import { Patient } from './patient'

export const Encounter = sequelize.define(
  'Encounter',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    patientId: { type: DataTypes.INTEGER, allowNull: false },
    visitDate: { type: DataTypes.DATE, allowNull: false },
    serviceType: { type: DataTypes.STRING, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM(
        'planned',
        'arrived',
        'triaged',
        'in-progress',
        'onhold',
        'finished',
        'cancelled',
        'entered-in-error',
        'unknown'
      ),
      allowNull: false
    },
    resourceType: { type: DataTypes.STRING, allowNull: true, defaultValue: 'Encounter' },
    class: { type: DataTypes.JSON, allowNull: true },
    classHistory: { type: DataTypes.JSON, allowNull: true },
    period: { type: DataTypes.JSON, allowNull: true },
    serviceTypeCode: { type: DataTypes.JSON, allowNull: true },
    subject: { type: DataTypes.JSON, allowNull: true },
    participant: { type: DataTypes.JSON, allowNull: true },
    reasonCode: { type: DataTypes.JSON, allowNull: true },
    reasonReference: { type: DataTypes.JSON, allowNull: true },
    hospitalization: { type: DataTypes.JSON, allowNull: true },
    location: { type: DataTypes.JSON, allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
    updatedBy: { type: DataTypes.INTEGER, allowNull: true },
    deletedBy: { type: DataTypes.INTEGER, allowNull: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    deletedAt: { type: DataTypes.DATE, allowNull: true }
  },
  {
    paranoid: true,
    indexes: [{ fields: ['patientId'] }, { fields: ['visitDate'] }]
  }
)

Patient.hasMany(Encounter, { foreignKey: 'patientId', onDelete: 'CASCADE', as: 'encounters' })
Encounter.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' })

export const EncounterSchema = z.object({
  episodeOfCareId: z.string().optional(),
  patientId: z.string(),
  encounterType: z.enum(['AMB', 'EMER', 'IMP', 'LAB']).default('AMB'),
  arrivalType: z.enum(['WALK_IN', 'REFERRAL', 'TRANSFER']).default('WALK_IN'),
  status: z.enum([
    'PLANNED',
    'IN_PROGRESS',
    'FINISHED',
    'CANCELLED'
  ]),
  serviceUnitId: z.string().optional(),
  serviceUnitCodeId: z.string().optional(),
  queueTicketId: z.string().optional().nullable(),
  startTime: z.union([z.date(), z.string()]).optional(),
  endTime: z.union([z.date(), z.string()]).optional().nullable(),
  partOfId: z.string().optional().nullable(),
  dischargeDisposition: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  visitDate: z.union([z.date(), z.string()]).optional(),
  serviceType: z.union([z.string(), z.number()]).optional(),
  resourceType: z.literal('Encounter').optional().default('Encounter'),
  class: z.any().optional().nullable(),
  classHistory: z.array(z.any()).optional().nullable(),
  period: z.any().optional().nullable(),
  serviceTypeCode: z.any().optional().nullable(),
  subject: z.any().optional().nullable(),
  participant: z.array(z.any()).optional().nullable(),
  reasonCode: z.array(z.any()).optional().nullable(),
  reasonReference: z.array(z.any()).optional().nullable(),
  hospitalization: z.any().optional().nullable(),
  location: z.array(z.any()).optional().nullable(),
  encounterCode: z.string().optional().nullable(),
  createdBy: z.union([z.number(), z.string()]).nullable().optional(),
  updatedBy: z.union([z.number(), z.string()]).nullable().optional(),
  deletedBy: z.union([z.number(), z.string()]).nullable().optional()
})

export const EncounterSchemaWithId = EncounterSchema.extend({
  id: z.string(),
  createdAt: z.union([z.date(), z.string()]).optional().nullable(),
  updatedAt: z.union([z.date(), z.string()]).optional().nullable(),
  deletedAt: z.union([z.date(), z.string()]).optional().nullable()
})
