import z from 'zod'
import { ExpenseHead } from '../../models/expenseHead'

export const schemas = {
  list: {
    result: z.object({
      success: z.boolean(),
      data: z
        .array(
          z.object({
            id: z.string(),
            name: z.string()
          })
        )
        .optional(),
      error: z.string().optional()
    })
  },
  seed: {
    result: z.object({
      success: z.boolean(),
      message: z.string().optional(),
      error: z.string().optional()
    })
  }
}

export const list = async () => {
  try {
    const result = await ExpenseHead.findAll()
    return { success: true, data: result }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to list expense heads' }
  }
}

export const seed = async () => {
  try {
    if ((await ExpenseHead.count()) > 0) {
      return { success: true, message: 'Expense heads already exist' }
    }
    await ExpenseHead.bulkCreate([
      { name: 'Food', id: crypto.randomUUID() },
      { name: 'Transport', id: crypto.randomUUID() },
      { name: 'Entertainment', id: crypto.randomUUID() },
      { name: 'Utilities', id: crypto.randomUUID() },
      { name: 'Other', id: crypto.randomUUID() }
    ])
    return { success: true, message: 'Expense heads seeded successfully' }
  } catch (err: any) {
    console.log(err)
    return { success: false, error: err.message || 'Failed to seed expense heads' }
  }
}
