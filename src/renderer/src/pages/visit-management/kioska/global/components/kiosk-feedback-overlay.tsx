import { CheckCircleFilled, CloseCircleFilled, ExclamationCircleFilled } from '@ant-design/icons'
import { Button, Typography } from 'antd'
import type { ReactNode } from 'react'

type KioskFeedbackTone = 'success' | 'error' | 'warning'

type Props = {
  open: boolean
  tone: KioskFeedbackTone
  title: string
  message: string
  primaryLabel?: string
  onPrimary?: () => void
  secondaryLabel?: string
  onSecondary?: () => void
  footer?: ReactNode
}

const toneConfig: Record<
  KioskFeedbackTone,
  {
    icon: ReactNode
    iconWrapperClassName: string
    titleClassName: string
    panelClassName: string
    primaryButtonType: 'primary' | 'default'
  }
> = {
  success: {
    icon: <CheckCircleFilled className="text-6xl text-emerald-600 md:text-7xl" />,
    iconWrapperClassName: 'bg-emerald-100',
    titleClassName: 'text-emerald-700',
    panelClassName: 'border-emerald-200 bg-white',
    primaryButtonType: 'primary'
  },
  error: {
    icon: <CloseCircleFilled className="text-6xl text-rose-600 md:text-7xl" />,
    iconWrapperClassName: 'bg-rose-100',
    titleClassName: 'text-rose-700',
    panelClassName: 'border-rose-200 bg-white',
    primaryButtonType: 'primary'
  },
  warning: {
    icon: <ExclamationCircleFilled className="text-6xl text-amber-600 md:text-7xl" />,
    iconWrapperClassName: 'bg-amber-100',
    titleClassName: 'text-amber-700',
    panelClassName: 'border-amber-200 bg-white',
    primaryButtonType: 'primary'
  }
}

export function KioskFeedbackOverlay({
  open,
  tone,
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  footer
}: Props) {
  if (!open) return null

  const config = toneConfig[tone]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-6 backdrop-blur-sm">
      <div
        className={`w-full max-w-4xl rounded-[36px] border px-8 py-10 shadow-2xl md:px-12 md:py-12 ${config.panelClassName}`}
      >
        <div className="flex flex-col items-center gap-6 text-center">
          <div
            className={`flex h-24 w-24 items-center justify-center rounded-full md:h-28 md:w-28 ${config.iconWrapperClassName}`}
          >
            {config.icon}
          </div>

          <div className="max-w-3xl">
            <Typography.Title
              level={1}
              className={`!mb-4 !text-4xl !leading-tight md:!text-5xl ${config.titleClassName}`}
            >
              {title}
            </Typography.Title>
            <Typography.Text className="!text-xl !leading-relaxed text-slate-700 md:!text-2xl">
              {message}
            </Typography.Text>
          </div>

          {footer || (
            <div className="mt-4 flex flex-col gap-4 sm:flex-row">
              {secondaryLabel && onSecondary ? (
                <Button
                  size="large"
                  className="!h-16 !rounded-2xl !px-8 !text-xl !font-semibold"
                  onClick={onSecondary}
                >
                  {secondaryLabel}
                </Button>
              ) : null}

              {primaryLabel && onPrimary ? (
                <Button
                  type={config.primaryButtonType}
                  size="large"
                  className="!h-16 !rounded-2xl !px-8 !text-xl !font-semibold"
                  onClick={onPrimary}
                >
                  {primaryLabel}
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
