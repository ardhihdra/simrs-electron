export const KIOSKA_PUBLIC_ERROR_PREFIX = 'KIOSKA_PUBLIC_ERROR:'

export type KioskaPublicSerializedError = {
  status?: number
  message: string
}

export function serializeKioskaPublicError(error: KioskaPublicSerializedError) {
  return `${KIOSKA_PUBLIC_ERROR_PREFIX}${JSON.stringify(error)}`
}

export function deserializeKioskaPublicError(error: unknown): KioskaPublicSerializedError | null {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : typeof (error as { message?: unknown } | undefined)?.message === 'string'
          ? String((error as { message: string }).message)
          : ''

  if (!rawMessage.startsWith(KIOSKA_PUBLIC_ERROR_PREFIX)) {
    return null
  }

  try {
    const payload = JSON.parse(rawMessage.slice(KIOSKA_PUBLIC_ERROR_PREFIX.length)) as {
      status?: unknown
      message?: unknown
    }

    if (typeof payload.message !== 'string' || !payload.message.trim()) {
      return null
    }

    return {
      status: typeof payload.status === 'number' ? payload.status : undefined,
      message: payload.message
    }
  } catch {
    return null
  }
}
