import { Outlet } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Spin, Result, message } from 'antd'
import KasirShiftModal from './kasir-shift-modal'
import { useState } from 'react'
import { LogoutOutlined } from '@ant-design/icons'

export default function KasirPage() {
  const queryClient = useQueryClient()
  const [modalMode, setModalMode] = useState<'OPEN' | 'CLOSE'>('OPEN')
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [summaryData, setSummaryData] = useState<any>(null)

  const { data: currentShift, isLoading: isLoadingShift, isError } = useQuery({
    queryKey: ['cashier-shift-current'],
    queryFn: () => window.api.query.cashierShift.current()
  })

  // @ts-ignore
  const openMutation = useMutation({
    mutationFn: (values: any) => window.api.query.cashierShift.open(values),
    onSuccess: (res: any) => {
      if (res.success) {
        message.success('Shift berhasil dibuka')
        queryClient.invalidateQueries({ queryKey: ['cashier-shift-current'] })
        setIsModalVisible(false)
      } else {
        message.error(res.error || 'Gagal membuka shift')
      }
    }
  })

  // @ts-ignore
  const closeMutation = useMutation({
    mutationFn: (values: any) => window.api.query.cashierShift.close(values),
    onSuccess: (res: any) => {
      if (res.success) {
        message.success('Shift berhasil ditutup')
        queryClient.invalidateQueries({ queryKey: ['cashier-shift-current'] })
        setIsModalVisible(false)
      } else {
        message.error(res.error || 'Gagal menutup shift')
      }
    }
  })

  const handleOpenShift = (values: any) => {
    openMutation.mutate(values)
  }

  const handleCloseShift = (values: any) => {
    closeMutation.mutate(values)
  }

  const handleTriggerClose = async () => {
    try {
      const res = await window.api.query.cashierShift.summary()
      if (res.success) {
        setSummaryData(res.result)
        setModalMode('CLOSE')
        setIsModalVisible(true)
      } else {
        message.error(res.error || 'Gagal memuat ringkasan shift')
      }
    } catch (err: any) {
      message.error(err.message)
    }
  }

  if (isLoadingShift) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spin size="large" tip="Memeriksa status kasir..." />
      </div>
    )
  }

  if (isError) {
    return (
      <Result
        status="error"
        title="Gagal memuat status kasir"
        subTitle="Terjadi kesalahan saat menghubungi server."
      />
    )
  }

  const shiftData = (currentShift as any)?.result

  if (!shiftData) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Result
          status="info"
          title="Kasir Belum Terbuka"
          subTitle="Anda harus membuka kasir sebelum dapat melayani tagihan pasien."
          extra={
            <Button type="primary" size="large" onClick={() => { setModalMode('OPEN'); setIsModalVisible(true); }}>
              Buka Kasir Sekarang
            </Button>
          }
        />
        <KasirShiftModal
          visible={isModalVisible}
          mode="OPEN"
          onCancel={() => setIsModalVisible(false)}
          onConfirm={handleOpenShift}
          loading={openMutation.isPending}
        />
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex justify-end mb-4">
        <Button 
          danger 
          icon={<LogoutOutlined />} 
          onClick={handleTriggerClose}
        >
          Tutup Kasir Sekarang
        </Button>
      </div>
      
      <Outlet />

      <KasirShiftModal
        visible={isModalVisible}
        mode={modalMode}
        onCancel={() => setIsModalVisible(false)}
        onConfirm={modalMode === 'OPEN' ? handleOpenShift : handleCloseShift}
        loading={openMutation.isPending || closeMutation.isPending}
        summaryData={summaryData}
      />
    </div>
  )
}

