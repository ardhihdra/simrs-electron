import { Select, SelectProps } from "antd"
import { usePoliOptions } from "@renderer/hooks/use-poli"

type SelectPoliProps = SelectProps & {
    valueType?: 'id' | 'name'
}

export const SelectPoli = ({ valueType = 'id', ...props }: SelectPoliProps) => {
    const { data: options = [], isLoading } = usePoliOptions(valueType)

    return (
        <Select
            placeholder="Pilih Poliklinik"
            loading={isLoading}
            options={options}
            showSearch
            filterOption={(input, option) =>
                (String(option?.label ?? '')).toLowerCase().includes(input.toLowerCase())
            }
            {...props}
        />
    )
}