import { InputNumber } from 'antd'
import { useEffect, useRef, useState } from 'react'

const DebouncedInputNumber = ({
  value,
  onChange,
  debounceMs = 300,
  ...props
}: {
  value: number
  onChange: (val: number) => void
  debounceMs?: number
} & any) => {
  const [localValue, setLocalValue] = useState<number>(value)
  const timerRef = useRef<any>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = (newValue: number | null) => {
    const val = newValue || 0
    setLocalValue(val)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onChange(val)
    }, debounceMs)
  }

  const handleBlur = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    onChange(localValue)
  }

  return (
    <InputNumber
      {...props}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onPressEnter={handleBlur}
    />
  )
}

export default DebouncedInputNumber
