import { Select, SelectProps } from "antd"
import { useEffect, useState } from "react"

type SelectPoliProps = SelectProps & {
    valueType?: 'id' | 'name'
}

export const SelectPoli = ({ valueType = 'id', ...props }: SelectPoliProps) => {
    const [options, setOptions] = useState<{ label: string; value: string }[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchPoli = async () => {
            setLoading(true)
            try {
                // @ts-ignore - The route is auto-registered but types might not be generated yet
                const res = await window.api.query.poli.list()
                if (res.success && res.data) {
                    console.log('SelectPoli data:', res.data)
                    const formattedOptions = res.data.map((item: any) => ({
                        label: item.name || item.label || item.id,
                        value: valueType === 'name' ? (item.name || item.label) : item.id
                    }))
                    setOptions(formattedOptions)
                }
            } catch (error) {
                console.error('Failed to fetch poli:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchPoli()
    }, [valueType])

    return (
        <Select
            placeholder="Pilih Poliklinik"
            loading={loading}
            options={options}
            showSearch
            filterOption={(input, option) =>
                (String(option?.label ?? '')).toLowerCase().includes(input.toLowerCase())
            }
            {...props}
        />
    )
}