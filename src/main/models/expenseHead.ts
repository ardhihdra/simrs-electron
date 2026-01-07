import { DataTypes } from 'sequelize'
import z from 'zod'
import { sequelize } from '@main/database'

export const ExpenseHead = sequelize.define('ExpenseHead', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, unique: true, allowNull: false },
  notes: { type: DataTypes.STRING },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
})

export const ExpenseHeadSchema = z.object({
  name: z.string().min(3).max(20),
  notes: z.string().min(0).max(200)
})
