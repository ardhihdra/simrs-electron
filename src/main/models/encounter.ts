import { sequelize } from '@main/database'
import { DataTypes } from 'sequelize'
import { EncounterSchema } from 'simrs-types'
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

export const EncounterSchemaWithId = EncounterSchema.extend({
  id: z.string(),
  createdAt: z.union([z.date(), z.string()]).optional().nullable(),
  updatedAt: z.union([z.date(), z.string()]).optional().nullable(),
  deletedAt: z.union([z.date(), z.string()]).optional().nullable(),
  visitDate: z.union([z.date(), z.string()]).optional().nullable(),
})
