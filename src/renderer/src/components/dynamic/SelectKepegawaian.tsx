import { Select, SelectProps } from 'antd'
import { useEffect, useState } from 'react'
import type { KepegawaianAttributes } from '@shared/kepegawaian'

type SelectKepegawaianProps = SelectProps & {
    hakAksesCode?: string
}

export const SelectKepegawaian = ({ hakAksesCode, ...props }: SelectKepegawaianProps) => {
    const [options, setOptions] = useState<{ label: string; value: number }[]>([])
    const [loading, setLoading] = useState(false)

    // Reload options when hakAksesCode changes
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                if (!hakAksesCode) {
                    // Fallback to normal filtered list if no code provided or if simple filter is enough
                    const res = await window.api.query.kepegawaian.list()

                    if (res.success && res.result) {
                        const formatted = (res.result as unknown as KepegawaianAttributes[]).map((item) => ({
                            label: item.namaLengkap,
                            value: item.id!
                        }))
                        setOptions(formatted)
                    }
                } else {
                    const res = await window.api.query.hakAkses.getByCode({ code: hakAksesCode })

                    if (res.success && res.data) {
                        console.log('SelectKepegawaian data:', res.data)
                        // The backend returns the HakAkses object which contains pegawaiByHakAkses
                        const pegawaiList = res.data.pegawaiByHakAkses || []
                        const formatted = (pegawaiList as KepegawaianAttributes[]).map((item) => ({
                            label: item.namaLengkap,
                            value: item.id!
                        }))
                        setOptions(formatted)
                    }
                }
            } catch (error) {
                console.error('Failed to fetch kepegawaian:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [hakAksesCode])

    return (
        <Select
            placeholder="Pilih Pegawai"
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
