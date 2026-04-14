import { client } from '@renderer/utils/client'
import { Select } from 'antd'

interface RPCSelectAsyncProps {
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
  listAll?: boolean
  allowClear?: boolean
}

export const RPCSelectAsync = ({
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
  allowClear,
  listAll = false
}: RPCSelectAsyncProps) => {
  const { data, isLoading, isRefetching } = client.query.entity.useQuery(
    {
      model: entity,
      params: filters,
      listAll,
      method: 'get'
    },
    {
      select: (res: any) => {
        const items = res?.data?.data || res?.data?.items || res?.data || res?.result || res
        if (Array.isArray(items)) {
          return items.map((item: any) => {
            return {
              value: item[output],
              label: item[display]
            }
          })
        }
        return []
      },
      queryKey: [
        entity,
        {
          method: 'get',
          params: filters,
          listAll,
          model: entity
        } as any
      ]
    }
  )

  return (
    <Select
      options={data}
      loading={isLoading || isRefetching}
      placeholder={placeHolder}
      onChange={onChange}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      className={className}
      allowClear={allowClear}
      showSearch
      optionFilterProp="label"
    />
  )
}
