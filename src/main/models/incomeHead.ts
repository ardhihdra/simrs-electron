import { DataTypes } from 'sequelize'
import { sequelize } from '@main/database'
import z from 'zod'

export const IncomeHead = sequelize.define('IncomeHead', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, unique: true, allowNull: false },
  notes: { type: DataTypes.STRING },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
})

export const IncomeHeadSchema = z.object({
  name: z.string().min(3).max(20),
  notes: z.string().min(0).max(200)
})
