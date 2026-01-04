import { DataTypes } from 'sequelize'
import { sequelize } from '../database'
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
  patientId: z.string(),
  visitDate: z.union([z.date(), z.string()]),
  serviceType: z.string().min(1),
  reason: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  status: z.enum([
    'planned',
    'arrived',
    'triaged',
    'in-progress',
    'onhold',
    'finished',
    'cancelled',
    'entered-in-error',
    'unknown',
    // legacy app statuses for backward compatibility
    'scheduled',
    'in_progress',
    'completed'
  ]),
  resourceType: z.literal('Encounter').optional(),
  class: z.any().optional().nullable(),
  classHistory: z
    .array(
      z.object({
        class: z.any(),
        period: z
          .object({
            start: z.string().optional(),
            end: z.string().optional()
          })
          .optional()
      })
    )
    .optional()
    .nullable(),
  period: z
    .object({
      start: z.string().optional(),
      end: z.string().optional()
    })
    .optional()
    .nullable(),
  serviceTypeCode: z
    .object({
      coding: z
        .array(
          z.object({
            system: z.string().optional(),
            version: z.string().optional(),
            code: z.string().optional(),
            display: z.string().optional(),
            userSelected: z.boolean().optional()
          })
        )
        .optional(),
      text: z.string().optional()
    })
    .optional()
    .nullable(),
  subject: z
    .object({
      reference: z.string().optional(),
      type: z.string().optional(),
      display: z.string().optional()
    })
    .optional()
    .nullable(),
  participant: z
    .array(
      z.object({
        type: z
          .array(
            z.object({
              coding: z
                .array(
                  z.object({
                    system: z.string().optional(),
                    version: z.string().optional(),
                    code: z.string().optional(),
                    display: z.string().optional(),
                    userSelected: z.boolean().optional()
                  })
                )
                .optional(),
              text: z.string().optional()
            })
          )
          .optional(),
        period: z
          .object({
            start: z.string().optional(),
            end: z.string().optional()
          })
          .optional(),
        individual: z
          .object({
            reference: z.string().optional(),
            type: z.string().optional(),
            display: z.string().optional()
          })
          .optional()
      })
    )
    .optional()
    .nullable(),
  reasonCode: z
    .array(
      z.object({
        coding: z
          .array(
            z.object({
              system: z.string().optional(),
              version: z.string().optional(),
              code: z.string().optional(),
              display: z.string().optional(),
              userSelected: z.boolean().optional()
            })
          )
          .optional(),
        text: z.string().optional()
      })
    )
    .optional()
    .nullable(),
  reasonReference: z
    .array(
      z.object({
        reference: z.string().optional(),
        type: z.string().optional(),
        display: z.string().optional()
      })
    )
    .optional()
    .nullable(),
  hospitalization: z.record(z.string(), z.unknown()).optional().nullable(),
  location: z
    .array(
      z.object({
        location: z.object({
          reference: z.string().optional(),
          type: z.string().optional(),
          display: z.string().optional()
        }),
        status: z.enum(['planned', 'active', 'reserved', 'completed']).optional(),
        physicalType: z
          .object({
            coding: z
              .array(
                z.object({
                  system: z.string().optional(),
                  version: z.string().optional(),
                  code: z.string().optional(),
                  display: z.string().optional(),
                  userSelected: z.boolean().optional()
                })
              )
              .optional(),
            text: z.string().optional()
          })
          .optional(),
        period: z
          .object({
            start: z.string().optional(),
            end: z.string().optional()
          })
          .optional()
      })
    )
    .optional()
    .nullable(),
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
