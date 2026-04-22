import { Button, Dropdown, App as AntdApp } from 'antd'
import type { MenuProps } from 'antd'
import {
  SyncOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import { useState, useMemo } from 'react'
import { queryClient } from '@renderer/query-client'
import type { ParentRow } from '../types'
import { extractTelaahResults } from '../utils'
import { type TelaahResults } from './telaah-administrasi-form'

interface MainRowActionsProps {
  record: ParentRow
}

export function MainRowActions({ record }: MainRowActionsProps) {
  const { message, modal } = AntdApp.useApp()
  const [syncingSatusehat, setSyncingSatusehat] = useState(false)
  const [isTelaahModalVisible, setIsTelaahModalVisible] = useState(false)
  const [currentTelaahResults, setCurrentTelaahResults] = useState<TelaahResults>({})

  const existingTelaah = useMemo(() => {
    for (const item of record.items) {
      const results = extractTelaahResults(item)
      if (results) return results
    }
    return {}
  }, [record.items])

  const handleOpenTelaah = () => {
    setCurrentTelaahResults(existingTelaah)
    setIsTelaahModalVisible(true)
  }

  const syncItems = record.items.filter((i) => i.jenis !== 'Komposisi' && typeof i.id === 'number')
  const isAllSynced =
    syncItems.length > 0 &&
    syncItems.every((i) => typeof i.fhirId === 'string' && i.fhirId.trim().length > 0)

  const handleSyncGroup = async () => {
    if (syncItems.length === 0) {
      message.info('Tidak ada obat yang perlu disinkron')
      return
    }
    const fn = window.api?.query?.medicationDispense?.syncSatusehat
    if (!fn) {
      message.error('API syncSatusehat tidak tersedia.')
      return
    }

    setSyncingSatusehat(true)
    let successCount = 0
    let failCount = 0
    try {
      for (const item of syncItems) {
        if (typeof item.fhirId === 'string' && item.fhirId.trim().length > 0) {
          successCount++
          continue
        }
        if (typeof item.id === 'number') {
          try {
            const res = await fn({ id: item.id })
            if (res.success) {
              successCount++
            } else {
              failCount++
              message.error(`Gagal sinkron ${item.medicineName}: ${res.error}`)
            }
          } catch (e) {
            failCount++
            const msg = e instanceof Error ? e.message : String(e)
            message.error(`Gagal sinkron ${item.medicineName}: ${msg}`)
          }
        }
      }
      if (successCount > 0 && failCount === 0) {
        message.success('Semua item dalam grup ini berhasil disinkronkan ke SatuSehat')
      } else if (successCount > 0 && failCount > 0) {
        message.warning(`Berhasil sinkron ${successCount}, namun gagal ${failCount}`)
      }
      queryClient.invalidateQueries({ queryKey: ['medicationDispense', 'list'] })
    } finally {
      setSyncingSatusehat(false)
    }
  }

  const isPaid = record.paymentStatus === 'Lunas'
  const hasItemsToProcess = record.items.some((i) => {
    const s = (i.status || '').toLowerCase()
    return s === 'preparation' || (s === 'in-progress' && !record.servicedAt)
  })

  const handleMulaiProsesGroup = () => {
    console.log('[handleMulaiProsesGroup] Executed from dropdown click!')
    modal.confirm({
      title: 'Mulai Proses Resep',
      width: 500,
      content: (
        <div className="flex flex-col gap-3 mt-4">
          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-md border border-gray-200">
            <span className="font-semibold">Status Tagihan Kasir:</span>
            <span className={`font-bold ${isPaid ? 'text-green-600' : 'text-orange-600'}`}>
              {record.paymentStatus || 'Belum Ditagihkan'}
            </span>
          </div>
          <div>
            <div className="font-semibold mb-2">Daftar Obat yang Disiapkan:</div>
            <ul className="pl-5 m-0 flex flex-col gap-1 text-sm">
              {record.items
                .filter((i) => i.jenis !== 'Komposisi')
                .map((item) => (
                  <li key={item.id || item.key}>
                    <span className="font-medium">{item.medicineName}</span> — {item.quantity}{' '}
                    {item.unit}
                  </li>
                ))}
            </ul>
          </div>
          {!isPaid && (
            <div className="text-orange-600 mt-2 text-sm bg-orange-50 p-2 rounded border border-orange-200 flex gap-2 items-start">
              <InfoCircleOutlined className="mt-1" />
              <span>
                Pembayaran obat ini belum diselesaikan / dilunasi di kasir. Apakah Anda yakin tetap
                ingin mulai memproses resep ini sekarang?
              </span>
            </div>
          )}
        </div>
      ),
      okText: 'Konfirmasi & Mulai',
      cancelText: 'Batal',
      onOk: async () => {
        console.log('[Mulai Proses] clicked', {
          items: record.items,
          servicedAt: record.servicedAt
        })
        const fn = window.api?.query?.medicationDispense?.update
        if (!fn) {
          message.error('API update tidak tersedia.')
          return
        }
        try {
          let hit = 0
          for (const item of record.items) {
            const currentStatus = (item.status || '').toLowerCase()
            const needsTrigger =
              currentStatus === 'preparation' ||
              (currentStatus === 'in-progress' && !record.servicedAt)
            console.log('[Mulai Proses] check item', {
              id: item.id,
              status: item.status,
              currentStatus,
              needsTrigger
            })
            if (needsTrigger && typeof item.id === 'number') {
              console.log('[Mulai Proses] calling api for item', item.id)
              const res = await fn({ id: item.id, status: 'in-progress' } as never)
              console.log('[Mulai Proses] res for item', item.id, res)
              hit++
            }
          }
          console.log('[Mulai Proses] total hit =', hit)
          if (hit === 0) {
            message.warning(
              'Tidak ada data obat yang perlu di-trigger atau statusnya sudah diproses.'
            )
          } else {
            message.success('Timer mulai berjalan dan resep dipindahkan ke proses')
          }
          queryClient.invalidateQueries({ queryKey: ['medicationDispense', 'list'] })
        } catch (err) {
          console.error('[Mulai Proses] error', err)
          message.error('Gagal memulai proses: ' + String(err))
        }
      }
    })
  }

  const menuItems: MenuProps['items'] = []

  if (hasItemsToProcess) {
    menuItems.push({
      key: 'mulai-proses',
      label: 'Mulai Proses',
      icon: <CheckCircleOutlined />,
      onClick: handleMulaiProsesGroup
    })
    menuItems.push({ type: 'divider' })
  }

  menuItems.push({
    key: 'sync-satusehat',
    label: syncingSatusehat ? 'Sinkronisasi Satu Sehat...' : 'Sinkronisasi Satu Sehat',
    icon: <SyncOutlined spin={syncingSatusehat} />,
    disabled: syncingSatusehat || isAllSynced || syncItems.length === 0,
    onClick: handleSyncGroup
  })

  void isTelaahModalVisible
  void currentTelaahResults
  void handleOpenTelaah

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
      <Button type="text" icon={<MoreOutlined />} size="small" />
    </Dropdown>
  )
}
