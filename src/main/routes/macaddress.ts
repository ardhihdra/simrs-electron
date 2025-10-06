import os from 'os'
import z from 'zod'

export const schemas = {
  getPrimaryMacAddress: {
    result: z.object({
      success: z.boolean(),
      data: z.string().optional(),
      error: z.string().optional()
    })
  }
}

export async function getPrimaryMacAddress() {
  try {
    const nets = os.networkInterfaces()
    for (const name of Object.keys(nets)) {
      const addrs = nets[name] || []
      for (const addr of addrs) {
        if (addr.internal) continue
        if (!addr.mac || addr.mac === '00:00:00:00:00:00') continue
        return { success: true, data: addr.mac.toLowerCase() }
      }
    }
    return { success: false, error: 'No valid MAC address found' }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to get MAC address' }
  }
}
