import { Attachment } from './attachment'
import { Expense } from './expense'
import { ExpenseAttachment } from './expenseAttachment'
import { ExpenseHead } from './expenseHead'
import { Income } from './income'
import { IncomeHead } from './incomeHead'

import { Patient } from './patient'
import { Encounter } from './encounter'
import { Condition } from './Condition'
import { DiagnosticReport } from './DiagnosticReport'
import { Observation } from './Observation'

// IncomeHead 1 - N Income
IncomeHead.hasMany(Income, { foreignKey: 'incomeHeadId' })
Income.belongsTo(IncomeHead, { foreignKey: 'incomeHeadId' })

// Income 1 - N Attachment
Income.hasMany(Attachment, { foreignKey: 'incomeId', onDelete: 'CASCADE' })
Attachment.belongsTo(Income, { foreignKey: 'incomeId' })

// ExpenseHead 1 - N Expense
ExpenseHead.hasMany(Expense, { foreignKey: 'expenseHeadId' })
Expense.belongsTo(ExpenseHead, { foreignKey: 'expenseHeadId' })

// Expense 1 - N ExpenseAttachment
Expense.hasMany(ExpenseAttachment, { foreignKey: 'expenseId', onDelete: 'CASCADE' })
ExpenseAttachment.belongsTo(Expense, { foreignKey: 'expenseId' })

// Condition Associations
Condition.belongsTo(Patient, { foreignKey: 'subjectId', as: 'subject' });
Condition.belongsTo(Encounter, { foreignKey: 'encounterId', as: 'encounter' });

// DiagnosticReport Associations
DiagnosticReport.belongsTo(Patient, { foreignKey: 'subjectId', as: 'subject' });
DiagnosticReport.belongsTo(Encounter, { foreignKey: 'encounterId', as: 'encounter' });

// Observation Associations
Observation.belongsTo(Patient, { foreignKey: 'subjectId', as: 'subject' });
Observation.belongsTo(Encounter, { foreignKey: 'encounterId', as: 'encounter' });
