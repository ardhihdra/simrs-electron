import { Select } from 'antd'
import type { SelectProps } from 'antd'
import { DEFAULT_KELAS_TARIF_OPTIONS, type KelasTarifOption } from '@renderer/utils/tarif-kelas'
import { useTarifKelasOptions } from '@renderer/hooks/query/use-tarif-kelas-options'

type SelectKelasTarifProps = Omit<SelectProps, 'options'> & {
  options?: KelasTarifOption[]
}

export const SelectKelasTarif = ({
  options,
  showSearch = true,
  optionFilterProp = 'label',
  ...props
}: SelectKelasTarifProps) => {
  const { data: remoteOptions } = useTarifKelasOptions()
  const resolvedOptions =
    Array.isArray(options) && options.length > 0
      ? options
      : remoteOptions || DEFAULT_KELAS_TARIF_OPTIONS

  return (
    <Select
      options={resolvedOptions}
      showSearch={showSearch}
      optionFilterProp={optionFilterProp}
      {...props}
    />
  )
}

export default SelectKelasTarif
