import z from 'zod'
import { Expense } from '../../models/expense'

export const requireSession = true

export const schemas = {
  list: {
    result: z.object({
      success: z.boolean(),
      data: z
        .array(
          z.object({
            id: z.string(),
            expenseHeadId: z.string().nullable(),
            name: z.string(),
            date: z.string(),
            invoiceNumber: z.string().nullable(),
            amount: z.number(),
            description: z.string().nullable(),
            createdBy: z.string().nullable(),
            createdAt: z.string(),
            updatedAt: z.string()
          })
        )
        .optional(),
      error: z.string().optional()
    })
  },
  create: {
    args: z.object({
      expenseHeadId: z.string().optional(),
      name: z.string(),
      date: z.string(),
      invoiceNumber: z.string().nullable(),
      amount: z.number(),
      description: z.string().optional().nullable(),
      createdBy: z.string().optional().nullable()
    }),
    result: z.object({
      success: z.boolean(),
      data: z
        .object({
          id: z.string(),
          expenseHeadId: z.string().nullable(),
          name: z.string(),
          date: z.string(),
          invoiceNumber: z.string().nullable(),
          amount: z.number(),
          description: z.string().nullable(),
          createdBy: z.string().nullable(),
          createdAt: z.string(),
          updatedAt: z.string()
        })
        .optional(),
      error: z.string().optional()
    })
  },
  update: {
    args: z.object({
      id: z.string(),
      expenseHeadId: z.string().optional(),
      name: z.string().optional(),
      date: z.string().optional(),
      invoiceNumber: z.string().optional(),
      amount: z.number().optional(),
      description: z.string().optional()
    }),
    result: z.object({
      success: z.boolean(),
      data: z
        .object({
          id: z.string(),
          expenseHeadId: z.string().nullable(),
          name: z.string(),
          date: z.string(),
          invoiceNumber: z.string().nullable(),
          amount: z.number(),
          description: z.string().nullable(),
          createdBy: z.string().nullable(),
          createdAt: z.string(),
          updatedAt: z.string()
        })
        .optional(),
      error: z.string().optional()
    })
  },
  delete: {
    args: z.object({
      id: z.string()
    }),
    result: z.object({
      success: z.boolean(),
      error: z.string().optional()
    })
  },
  seed: {
    result: z.object({
      success: z.boolean(),
      count: z.number(),
      error: z.string().optional()
    })
  }
}

export const list = async () => {
  try {
    const expenses = await Expense.findAll()

    // Convert Date objects to strings for Zod validation
    const formattedExpenses = expenses.map((expense) => {
      const expenseData = expense.toJSON()
      return {
        ...expenseData,
        date: expenseData.date instanceof Date ? expenseData.date.toISOString() : expenseData.date,
        createdAt:
          expenseData.createdAt instanceof Date
            ? expenseData.createdAt.toISOString()
            : expenseData.createdAt,
        updatedAt:
          expenseData.updatedAt instanceof Date
            ? expenseData.updatedAt.toISOString()
            : expenseData.updatedAt
      }
    })

    return { success: true, data: formattedExpenses }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to get expense list' }
  }
}

export const create = async (_ctx, args: z.infer<typeof schemas.create.args>) => {
  console.log('create args:', args)
  try {
    const result = await Expense.create({
      id: crypto.randomUUID(),
      expenseHeadId: args.expenseHeadId || null,
      name: args.name,
      date: new Date(args.date),
      invoiceNumber: args.invoiceNumber || null,
      amount: args.amount,
      description: args.description || null,
      createdBy: args.createdBy || null
    })

    // Format dates for response
    const expenseData = result.toJSON()
    const formattedExpense = {
      ...expenseData,
      date: expenseData.date instanceof Date ? expenseData.date.toISOString() : expenseData.date,
      createdAt:
        expenseData.createdAt instanceof Date
          ? expenseData.createdAt.toISOString()
          : expenseData.createdAt,
      updatedAt:
        expenseData.updatedAt instanceof Date
          ? expenseData.updatedAt.toISOString()
          : expenseData.updatedAt
    }

    return { success: true, data: formattedExpense }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to create expense' }
  }
}

export const update = async (_ctx, args: z.infer<typeof schemas.update.args>) => {
  try {
    // Check if expense exists
    const expense = await Expense.findByPk(args.id)
    if (!expense) {
      return { success: false, error: 'Expense not found' }
    }

    // Prepare update data
    const updateData: any = {}
    if (args.name !== undefined) updateData.name = args.name
    if (args.expenseHeadId !== undefined) updateData.expenseHeadId = args.expenseHeadId || null
    if (args.date !== undefined) updateData.date = new Date(args.date)
    if (args.invoiceNumber !== undefined) updateData.invoiceNumber = args.invoiceNumber || null
    if (args.amount !== undefined) updateData.amount = args.amount
    if (args.description !== undefined) updateData.description = args.description || null

    // Update expense
    await expense.update(updateData)

    // Get updated expense
    const updatedExpense = await Expense.findByPk(args.id)

    // Format dates for response
    const expenseData = updatedExpense!.toJSON()
    const formattedExpense = {
      ...expenseData,
      date: expenseData.date instanceof Date ? expenseData.date.toISOString() : expenseData.date,
      createdAt:
        expenseData.createdAt instanceof Date
          ? expenseData.createdAt.toISOString()
          : expenseData.createdAt,
      updatedAt:
        expenseData.updatedAt instanceof Date
          ? expenseData.updatedAt.toISOString()
          : expenseData.updatedAt
    }

    return { success: true, data: formattedExpense }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update expense' }
  }
}

export const deleteById = async (_ctx, args: z.infer<typeof schemas.delete.args>) => {
  try {
    console.log('delete args:', args)
    // Check if expense exists
    const expense = await Expense.findByPk(args.id)
    if (!expense) {
      return { success: false, error: 'Expense not found' }
    }

    // Delete expense
    await expense.destroy()
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete expense' }
  }
}

export const seed = async () => {
  try {
    // Check if there are already expenses
    const count = await Expense.count()
    if (count > 0) {
      return { success: true, count, message: 'Expenses already exist' }
    }

    // Sample expense data
    const sampleExpenses = [
      {
        id: crypto.randomUUID(),
        name: 'Office Supplies',
        date: new Date(),
        invoiceNumber: 'INV-001',
        amount: 12500,
        description: 'Monthly office supplies',
        createdBy: 'system'
      },
      {
        id: crypto.randomUUID(),
        name: 'Internet Bill',
        date: new Date(),
        invoiceNumber: 'INV-002',
        amount: 8000,
        description: 'Monthly internet subscription',
        createdBy: 'system'
      },
      {
        id: crypto.randomUUID(),
        name: 'Staff Lunch',
        date: new Date(),
        invoiceNumber: 'INV-003',
        amount: 15000,
        description: 'Team lunch meeting',
        createdBy: 'system'
      },
      {
        id: crypto.randomUUID(),
        name: 'Software License',
        date: new Date(),
        invoiceNumber: 'INV-004',
        amount: 25000,
        description: 'Annual software subscription',
        createdBy: 'system'
      },
      {
        id: crypto.randomUUID(),
        name: 'Travel Expense',
        date: new Date(),
        invoiceNumber: 'INV-005',
        amount: 35000,
        description: 'Business trip expenses',
        createdBy: 'system'
      }
    ]

    // Create all sample expenses
    await Expense.bulkCreate(sampleExpenses)

    return {
      success: true,
      count: sampleExpenses.length,
      message: 'Sample expenses created successfully'
    }
  } catch (err: any) {
    return { success: false, count: 0, error: err.message || 'Failed to seed expenses' }
  }
}
