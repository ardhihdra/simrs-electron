import { useQuery } from '@tanstack/react-query'
import { Select } from 'antd'

interface SelectAsyncProps {
  entity: string
  display?: string
  output?: string
  placeHolder?: string
  filters?: Record<string, any>
  onChange?: (value: any) => void
  value?: any
  defaultValue?: any
  disabled?: boolean
  className?: string
}

export const SelectAsync = ({
  entity,
  display = 'name',
  output = 'id',
  placeHolder = 'Pilih',
  filters,
  onChange,
  value,
  defaultValue,
  disabled,
  className
}: SelectAsyncProps) => {
  const fn = window.api.query[entity]?.listAll
  if (!fn) {
    throw new Error(`Entity ${entity} not found`)
  }
  const data = useQuery({
    queryKey: [entity, filters],
    queryFn: () => {
      return fn(filters)
    },
    select: (data) => {
      return data.data?.map((item) => {
        return {
          value: item[output],
          label: item[display]
        }
      })
    }
  })
  return (
    <Select
      options={data.data}
      loading={data.isLoading || data.isRefetching}
      placeholder={placeHolder}
      onChange={onChange}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      className={className}
    />
  )
}
