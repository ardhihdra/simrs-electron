import type { Rule } from 'antd/es/form'

export const REQUIRED_RULE_MESSAGE = 'Wajib diisi'

export const VITAL_SIGNS_REQUIRED_FLAGS = {
  systolicBloodPressure: true,
  diastolicBloodPressure: true,
  temperature: true,
  pulseRate: true,
  respiratoryRate: false,
  oxygenSaturation: false,
  height: true,
  weight: true
} as const

export type VitalSignsValidationField = keyof typeof VITAL_SIGNS_REQUIRED_FLAGS

export const getVitalSignRules = (field: VitalSignsValidationField): Rule[] =>
  VITAL_SIGNS_REQUIRED_FLAGS[field] ? [{ required: true, message: REQUIRED_RULE_MESSAGE }] : []

