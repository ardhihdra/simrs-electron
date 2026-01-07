import { DataTypes } from 'sequelize'
import z from 'zod'
import { sequelize } from '@main/database'

export const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false }
})

export const UserSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6).max(20)
})
