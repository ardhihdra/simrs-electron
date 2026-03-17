import { Card } from 'antd'

interface PaketBhpTabProps {
  token: any
}

export default function PaketBhpTab({ token }: PaketBhpTabProps) {
  return (
    <Card size="small" title={<span className="font-semibold">Paket BHP</span>}>
      <div className="text-xs" style={{ color: token.colorTextSecondary }}>
        Endpoint dan model Paket BHP belum tersedia. Tab ini disiapkan sebagai placeholder untuk
        implementasi berikutnya.
      </div>
    </Card>
  )
}
