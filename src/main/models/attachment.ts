import { DataTypes } from 'sequelize'
import { sequelize } from '@main/database'
import z from 'zod'

export const Attachment = sequelize.define('Attachment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  incomeId: { type: DataTypes.UUID, allowNull: false },
  url: { type: DataTypes.STRING, allowNull: false },
  filename: { type: DataTypes.STRING },
  mimeType: { type: DataTypes.STRING },
  size: { type: DataTypes.INTEGER },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
})

export const AttachmentSchema = z.object({
  incomeId: z.string(),
  url: z.string(),
  filename: z.string().min(0).max(200),
  mimeType: z.string().min(0).max(200),
  size: z.number().int().min(0)
})
