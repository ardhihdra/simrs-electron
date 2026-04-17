import { useQuery } from '@tanstack/react-query'
import { Select } from 'antd'
import { useState } from 'react'

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
  searchFields?: string
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
  className,
  searchFields = 'name'
}: SelectAsyncProps) => {
  const [search, setSearch] = useState<string>('')

  const fn = window.api.query[entity]?.listAll
  if (!fn) {
    throw new Error(`Entity ${entity} not found`)
  }

  const activeFilters = search ? { ...filters, q: search, fields: searchFields } : filters

  const data = useQuery({
    queryKey: [entity, activeFilters],
    queryFn: () => {
      return fn(activeFilters)
    },
    select: (data: any) => {
      return data.data?.map((item: any) => {
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
      showSearch
      onSearch={setSearch}
      filterOption={false}
    />
  )
}
