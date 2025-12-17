import z from 'zod'

const API_BASE_URL = 'http://localhost:8810/api'

export const schemas = {
    list: {
        result: z.object({
            success: z.boolean(),
            result: z.array(z.any()).optional(),
            message: z.string().optional()
        })
    },
    findById: {
        args: z.object({ id: z.number() }),
        result: z.object({
            success: z.boolean(),
            result: z.any().optional(),
            message: z.string().optional()
        })
    },
    create: {
        args: z.any(),
        result: z.object({
            success: z.boolean(),
            result: z.any().optional(),
            message: z.string().optional()
        })
    },
    update: {
        args: z.any(),
        result: z.object({
            success: z.boolean(),
            result: z.any().optional(),
            message: z.string().optional()
        })
    },
    deleteById: {
        args: z.object({ id: z.number() }),
        result: z.object({
            success: z.boolean(),
            message: z.string().optional()
        })
    }
}

export const list = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/jadwalPraktekPetugasMedis`)
        const data = await response.json()
        return data
    } catch (err: any) {
        return { success: false, message: err.message || 'Failed to fetch medical staff schedule' }
    }
}

export const findById = async (_ctx, args: z.infer<typeof schemas.findById.args>) => {
    try {
        const response = await fetch(`${API_BASE_URL}/jadwalPraktekPetugasMedis/read/${args.id}`)
        const data = await response.json()
        return data
    } catch (err: any) {
        return { success: false, message: err.message || 'Failed to fetch medical staff schedule' }
    }
}

export const create = async (_ctx, args: z.infer<typeof schemas.create.args>) => {
    try {
        const response = await fetch(`${API_BASE_URL}/jadwalPraktekPetugasMedis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(args)
        })
        const data = await response.json()
        return data
    } catch (err: any) {
        return { success: false, message: err.message || 'Failed to create medical staff schedule' }
    }
}

export const update = async (_ctx, args: z.infer<typeof schemas.update.args>) => {
    try {
        const response = await fetch(`${API_BASE_URL}/jadwalPraktekPetugasMedis/${args.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(args)
        })
        const data = await response.json()
        return data
    } catch (err: any) {
        return { success: false, message: err.message || 'Failed to update medical staff schedule' }
    }
}

export const deleteById = async (_ctx, args: z.infer<typeof schemas.deleteById.args>) => {
    try {
        const response = await fetch(`${API_BASE_URL}/jadwalPraktekPetugasMedis/${args.id}`, {
            method: 'DELETE'
        })
        const data = await response.json()
        return data
    } catch (err: any) {
        return { success: false, message: err.message || 'Failed to delete medical staff schedule' }
    }
}
