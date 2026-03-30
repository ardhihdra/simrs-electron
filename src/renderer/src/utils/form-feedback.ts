import type { FormInstance } from 'antd'
import type { MessageInstance } from 'antd/es/message/interface'

interface ValidationErrorField {
  name?: (string | number)[]
}

interface ValidationErrorInfo {
  errorFields?: ValidationErrorField[]
}

export const notifyFormValidationError = (
  form: FormInstance,
  message: MessageInstance,
  errorInfo: ValidationErrorInfo,
  fallbackMessage = 'Lengkapi data yang wajib diisi terlebih dahulu.'
) => {
  message.error(fallbackMessage)

  const firstFieldPath = errorInfo?.errorFields?.[0]?.name
  if (firstFieldPath) {
    setTimeout(() => {
      form.scrollToField(firstFieldPath, { block: 'center' })
    }, 0)
  }
}

export const hasValidationErrors = (error: unknown): error is ValidationErrorInfo => {
  return Array.isArray((error as ValidationErrorInfo | undefined)?.errorFields)
}
