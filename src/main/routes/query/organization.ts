import { createCrudRoutes } from '@main/utils/crud'
import z from 'zod'

export const requireSession = true

const crud = createCrudRoutes({
    entity: 'organization',
    // FIX ME: update type to simrs-types Organization
    schema: z.any()
})

export const { list, listAll } = crud