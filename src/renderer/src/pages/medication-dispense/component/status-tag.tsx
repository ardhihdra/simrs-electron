import { Tag } from 'antd'
import {
    SyncOutlined,
    CheckCircleOutlined,
    ReloadOutlined,
    StopOutlined,
    PauseCircleOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons'

export function getStatusLabel(status: string): string {
    if (status === 'entered-in-error') return 'Void/Kembali'
    if (status === 'cancelled' || status === 'stopped' || status === 'declined') return 'Dibatalkan'
    if (status === 'preparation') return 'Persiapan'
    if (status === 'in-progress') return 'Diproses'
    if (status === 'on-hold') return 'Tertunda'
    if (status === 'completed') return 'Selesai'
    return status
}

export function getStatusTag(status: string) {
    const label = getStatusLabel(status)
    if (status === 'completed')
        return (
            <Tag color="green" icon={<CheckCircleOutlined />}>
                {label}
            </Tag>
        )
    if (status === 'entered-in-error')
        return (
            <Tag color="volcano" icon={<ReloadOutlined />}>
                {label}
            </Tag>
        )
    if (status === 'cancelled' || status === 'stopped' || status === 'declined')
        return (
            <Tag color="red" icon={<StopOutlined />}>
                {label}
            </Tag>
        )
    if (status === 'preparation')
        return (
            <Tag color="blue" icon={<InfoCircleOutlined />}>
                {label}
            </Tag>
        )
    if (status === 'in-progress')
        return (
            <Tag color="geekblue" icon={<SyncOutlined spin />}>
                {label}
            </Tag>
        )
    if (status === 'on-hold')
        return (
            <Tag color="orange" icon={<PauseCircleOutlined />}>
                {label}
            </Tag>
        )
    return <Tag color="default">{label}</Tag>
}
