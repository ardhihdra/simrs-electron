import type { FormInstance } from 'antd'
import type { MessageInstance } from 'antd/es/message/interface'
import type { FormEvent } from 'react'

interface ValidationErrorField {
  name?: (string | number)[]
}

interface ValidationErrorInfo {
  errorFields?: ValidationErrorField[]
}

const DEFAULT_FORM_ERROR_MESSAGE = 'Mohon lengkapi field yang wajib diisi.'
const DEFAULT_API_ERROR_MESSAGE = 'Terjadi kesalahan pada proses API.'

type ScrollTargetForm = FormInstance | null | undefined

export const notifyFormValidationError = (
  form: FormInstance,
  message: MessageInstance,
  errorInfo: ValidationErrorInfo,
  fallbackMessage = DEFAULT_FORM_ERROR_MESSAGE
) => {
  message.error(fallbackMessage)

  const firstFieldPath = errorInfo?.errorFields?.[0]?.name
  if (firstFieldPath) {
    setTimeout(() => {
      form.scrollToField(firstFieldPath, { block: 'center', behavior: 'smooth' })
    }, 0)
  }
}

export const hasValidationErrors = (error: unknown): error is ValidationErrorInfo => {
  return Array.isArray((error as ValidationErrorInfo | undefined)?.errorFields)
}

export const extractApiErrorMessage = (
  error: unknown,
  fallbackMessage = DEFAULT_API_ERROR_MESSAGE
) => {
  if (error instanceof Error && error.message) return error.message

  if (typeof error === 'string' && error.trim()) return error.trim()

  if (error && typeof error === 'object') {
    const errObj = error as {
      message?: string
      error?: string
      data?: { message?: string; error?: string }
      response?: { data?: { message?: string; error?: string } }
    }

    if (typeof errObj.message === 'string' && errObj.message.trim()) return errObj.message.trim()
    if (typeof errObj.error === 'string' && errObj.error.trim()) return errObj.error.trim()

    if (errObj.data) {
      if (typeof errObj.data.message === 'string' && errObj.data.message.trim()) {
        return errObj.data.message.trim()
      }
      if (typeof errObj.data.error === 'string' && errObj.data.error.trim()) {
        return errObj.data.error.trim()
      }
    }

    if (errObj.response?.data) {
      if (
        typeof errObj.response.data.message === 'string' &&
        errObj.response.data.message.trim()
      ) {
        return errObj.response.data.message.trim()
      }
      if (typeof errObj.response.data.error === 'string' && errObj.response.data.error.trim()) {
        return errObj.response.data.error.trim()
      }
    }
  }

  return fallbackMessage
}

export const showApiError = (
  message: MessageInstance,
  error: unknown,
  fallbackMessage = DEFAULT_API_ERROR_MESSAGE
) => {
  message.error(extractApiErrorMessage(error, fallbackMessage))
}

export const handleFormValidationFailed = (
  message: MessageInstance,
  errorInfo?: ValidationErrorInfo,
  options?: {
    fallbackMessage?: string
    form?: ScrollTargetForm
  }
) => {
  const fallbackMessage = options?.fallbackMessage || DEFAULT_FORM_ERROR_MESSAGE
  message.error(fallbackMessage)

  const firstFieldPath = errorInfo?.errorFields?.[0]?.name
  if (firstFieldPath && options?.form) {
    setTimeout(() => {
      options.form?.scrollToField(firstFieldPath, { block: 'center', behavior: 'smooth' })
    }, 0)
  }
}

export const createFormValidationSubmitCapture = (
  message: MessageInstance,
  fallbackMessage = DEFAULT_FORM_ERROR_MESSAGE
) => {
  let lastToastAt = 0

  return (event: FormEvent<HTMLElement>) => {
    const formElement = event.target
    if (!(formElement instanceof HTMLFormElement)) return

    const messageCountBefore = document.querySelectorAll('.ant-message-notice').length

    window.requestAnimationFrame(() => {
      const firstErrorElement = formElement.querySelector('.ant-form-item-has-error')
      if (!(firstErrorElement instanceof HTMLElement)) return

      firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })

      const messageCountAfter = document.querySelectorAll('.ant-message-notice').length
      if (messageCountAfter > messageCountBefore) return

      const now = Date.now()
      if (now - lastToastAt < 1000) return
      lastToastAt = now
      handleFormValidationFailed(message, undefined, { fallbackMessage })
    })
  }
}
