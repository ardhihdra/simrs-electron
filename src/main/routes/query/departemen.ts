import z from 'zod'

const API_BASE_URL = 'http://localhost:8810/api'

export const schemas = {
    list: {
        result: z.object({
            success: z.boolean(),
            result: z.array(z.any()).optional(),
            message: z.string().optional()
        })
    }
}

export const list = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/departemen`)
        const data = await response.json()
        return data
    } catch (err: any) {
        return { success: false, message: err.message || 'Failed to fetch departemen data' }
    }
}
