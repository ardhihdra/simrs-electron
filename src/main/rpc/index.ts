import { createProcedure } from '@mavolostudio/electron-rpc'
import type { AppContext } from './types'

export const t = createProcedure<AppContext>()
