import { useState, useEffect } from 'react'

interface DispenseTimerProps {
    servicedAt?: string | null
    handedOverAt?: string | null
    isBpjs: boolean
}

export function DispenseTimer({ servicedAt, handedOverAt, isBpjs }: DispenseTimerProps) {
    const [remaining, setRemaining] = useState<number | null>(null)

    const limit = isBpjs ? 60 * 60 * 1000 : 15 * 60 * 1000

    useEffect(() => {
        if (!servicedAt) return
        const start = new Date(servicedAt).getTime()

        if (handedOverAt) {
            const end = new Date(handedOverAt).getTime()
            const diff = limit - (end - start)
            setRemaining(diff)
            return
        }

        const update = () => {
            const now = Date.now()
            const diff = limit - (now - start)
            setRemaining(diff)
        }
        update()
        const timer = setInterval(update, 1000)
        return () => clearInterval(timer)
    }, [servicedAt, handedOverAt, limit])

    if (!servicedAt || remaining === null) return <span className="text-gray-400">-</span>

    const isOverdue = remaining <= 0
    const absRemaining = Math.abs(remaining)
    const mins = Math.floor(absRemaining / 60000)
    const secs = Math.floor((absRemaining % 60000) / 1000)

    const timeStr = `${isOverdue ? '-' : ''}${mins}:${secs.toString().padStart(2, '0')}`

    let color = 'text-green-600'
    if (isOverdue) color = 'text-red-600 font-bold'
    else if (remaining < 5 * 60 * 1000) color = 'text-orange-500 font-semibold'

    return <span className={color}>{timeStr}</span>
}
