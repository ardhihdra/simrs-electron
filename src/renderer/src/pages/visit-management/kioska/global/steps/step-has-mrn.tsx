import { Button, Typography } from 'antd'

import { useKioskaGlobalFlow } from '../kioska-global-context'
import { getNextStepAfterMrnAnswer } from '../kioska-global-flow'

export function StepHasMrn() {
  const { goTo, setHasMrn } = useKioskaGlobalFlow()

  const handleAnswer = (value: boolean) => {
    setHasMrn(value)
    goTo(getNextStepAfterMrnAnswer(value))
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 text-center">
      <div className="max-w-2xl">
        <Typography.Title level={2} className="!mb-3">
          Apakah Anda Sudah Memiliki Nomor Rekam Medis?
        </Typography.Title>
        <Typography.Text className="text-base text-slate-500">
          Jika anda sudah pernah diperiksa di Rumah Sakit kami maka anda seharusnya sudah memiliki
          Nomor Rekam Medis. Jika sudah, silakan lanjutkan dengan scan atau input MRN.
        </Typography.Text>
      </div>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-5 md:grid-cols-2">
        <Button
          className="!h-32 !rounded-[24px] !text-2xl !font-semibold"
          onClick={() => handleAnswer(true)}
        >
          Ya, saya punya
        </Button>
        <Button
          className="!h-32 !rounded-[24px] !text-2xl !font-semibold"
          onClick={() => handleAnswer(false)}
        >
          Belum punya
        </Button>
      </div>
    </div>
  )
}
