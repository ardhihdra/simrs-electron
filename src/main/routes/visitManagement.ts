import { IpcContext } from '@main/ipc/router'
import { createBackendClient } from '@main/utils/backendClient'

export const requireSession = true

export async function register(ctx: IpcContext, payload: any) {
  const client = createBackendClient(ctx)
  const res = await client.post('/api/module/visit-management/register', payload)

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    return {
      success: false,
      error: errorData.message || errorData.error || `HTTP Error ${res.status}`
    }
  }

  return await res.json()
}

export async function getActiveQueues(ctx: IpcContext, query: any) {
  const client = createBackendClient(ctx)
  const queryString = new URLSearchParams(query || {}).toString()
  const res = await client.get(`/api/module/visit-management/queues/active?${queryString}`)

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    return {
      success: false,
      error: errorData.message || errorData.error || `HTTP Error ${res.status}`
    }
  }

  const json = await res.json()
  // Ensure success flag is present if the backend doesn't provide it
  return { success: true, ...json }
}

export async function confirmAttendance(
  ctx: IpcContext,
  data: { queueId: string; patientId?: string }
) {
  const client = createBackendClient(ctx)
  const res = await client.put(`/api/module/visit-management/queues/${data.queueId}/confirm`, {
    patientId: data.patientId
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    return {
      success: false,
      error: errorData.message || errorData.error || `HTTP Error ${res.status}`
    }
  }

  return await res.json()
}

export async function callPatient(ctx: IpcContext, data: { queueId: string }) {
  const client = createBackendClient(ctx)
  const res = await client.put(`/api/module/visit-management/queues/${data.queueId}/call`, {})

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    return {
      success: false,
      error: errorData.message || errorData.error || `HTTP Error ${res.status}`
    }
  }

  return await res.json()
}

export async function startEncounter(
  ctx: IpcContext,
  data: { queueId: string; [key: string]: any }
) {
  const client = createBackendClient(ctx)
  const { queueId, ...body } = data
  const res = await client.put(
    `/api/module/visit-management/queues/${queueId}/start-encounter`,
    body
  )

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    return {
      success: false,
      error: errorData.message || errorData.error || `HTTP Error ${res.status}`
    }
  }

  return await res.json()
}
