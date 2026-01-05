import { DataTypes } from 'sequelize'
import { sequelize } from '@main/database'
import z from 'zod'

export const Income = sequelize.define(
  'Income',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    incomeHeadId: { type: DataTypes.UUID, allowNull: true },
    name: { type: DataTypes.STRING, allowNull: false },
    date: { type: DataTypes.DATE, allowNull: false },
    invoiceNumber: { type: DataTypes.STRING(100) },
    amount: { type: DataTypes.INTEGER, allowNull: false },
    description: { type: DataTypes.TEXT },
    createdBy: { type: DataTypes.STRING },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  },
  {
    indexes: [{ fields: ['date'] }, { fields: ['invoiceNumber'] }]
  }
)

export const IncomeSchema = z.object({
  incomeHeadId: z.string(),
  name: z.string().min(3).max(20),
  date: z.date(),
  invoiceNumber: z.string().min(0).max(100),
  amount: z.number().int().min(0),
  description: z.string().min(0).max(200)
})
