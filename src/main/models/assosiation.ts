import { Attachment } from '@main/models/attachment'
import { Expense } from '@main/models/expense'
import { ExpenseAttachment } from '@main/models/expenseAttachment'
import { ExpenseHead } from '@main/models/expenseHead'
import { Income } from '@main/models/income'
import { IncomeHead } from '@main/models/incomeHead'

import { Patient } from '@main/models/patient'
import { Encounter } from '@main/models/encounter'
import { Condition } from '@main/models/condition'
import { DiagnosticReport } from '@main/models/diagnosticReport'
import { Observation } from '@main/models/observation'

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
