import { Select, SelectProps } from 'antd'
import { useKepegawaianOptions } from '@renderer/hooks/use-kepegawaian'

type SelectKepegawaianProps = SelectProps & {
    hakAksesCode?: string
}

export const SelectKepegawaian = ({ hakAksesCode, ...props }: SelectKepegawaianProps) => {
    const { data: options = [], isLoading } = useKepegawaianOptions(hakAksesCode)

    return (
        <Select
            placeholder="Pilih Pegawai"
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
