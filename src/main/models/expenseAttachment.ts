import { DataTypes } from 'sequelize'
import { sequelize } from '@main/database'
import z from 'zod'

export const ExpenseAttachment = sequelize.define('ExpenseAttachment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  expenseId: { type: DataTypes.UUID, allowNull: false },
  url: { type: DataTypes.STRING, allowNull: false },
  filename: { type: DataTypes.STRING },
  mimeType: { type: DataTypes.STRING },
  size: { type: DataTypes.INTEGER },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
})

export const ExpenseAttachmentSchema = z.object({
  expenseId: z.string().uuid(),
  url: z.string().url(),
  filename: z.string().min(0).max(200),
  mimeType: z.string().min(0).max(200),
  size: z.number().int().min(0)
})
