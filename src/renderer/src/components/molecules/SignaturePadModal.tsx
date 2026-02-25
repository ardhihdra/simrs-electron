import { Button, Modal } from 'antd'
import { useRef, useState, useEffect } from 'react'

interface SignaturePadModalProps {
  title: string
  visible: boolean
  onClose: () => void
  onSave: (dataUrl: string) => void
}

export const SignaturePadModal = ({ title, visible, onClose, onSave }: SignaturePadModalProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    if (visible && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
      }
    }
  }, [visible])

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true)
    draw(e)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    const ctx = canvasRef.current?.getContext('2d')
    ctx?.beginPath()
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    let x, y
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }

    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (canvas) {
      onSave(canvas.toDataURL())
      onClose()
    }
  }

  return (
    <Modal
      title={`Tanda Tangan: ${title}`}
      open={visible}
      onCancel={onClose}
      onOk={handleSave}
      okText="Simpan"
      cancelText="Batal"
      width={440}
    >
      <div className="border border-gray-300 rounded mb-2 bg-white">
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
          className="cursor-crosshair w-full"
        />
      </div>
      <Button size="small" onClick={clear}>
        Bersihkan
      </Button>
    </Modal>
  )
}
