import { sequelize } from '@main/database'
import { DataTypes } from 'sequelize'

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

export { PatientSchema } from 'simrs-types'
