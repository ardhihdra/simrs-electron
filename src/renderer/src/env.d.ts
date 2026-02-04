/// <reference types="vite/client" />
import '../../preload/ipc-channels'

type RawMaterialCategory = { id?: number; name: string; status: boolean }
type Supplier = {
  id?: number
  nama: string
  kode: string
  noHp: string
  alamat?: string | null
  note?: string | null
}
type SupplierCreate = {
  nama: string
  kode: string
  noHp: string
  alamat?: string | null
  note?: string | null
}
type SupplierUpdate = SupplierCreate & { id: number }

declare global {
  interface Window {
    api: Window['api'] & {
      query: Window['api']['query'] & {
        rawMaterialCategory: {
          list: Invoke<void, { success: boolean; result?: RawMaterialCategory[]; message?: string }>
          getById: Invoke<{ id: number }, { success: boolean; result?: RawMaterialCategory; message?: string }>
          create: Invoke<{ name: string; status?: boolean }, { success: boolean; result?: RawMaterialCategory; message?: string }>
          update: Invoke<{ id: number; name: string; status?: boolean }, { success: boolean; result?: RawMaterialCategory; message?: string }>
          deleteById: Invoke<{ id: number }, { success: boolean; message?: string }>
        }
        suplier: {
          read: Invoke<{ id: number }, { success: boolean; result?: Supplier; message?: string }>
          list: Invoke<void, { success: boolean; result?: Supplier[]; message?: string }>
          create: Invoke<SupplierCreate, { success: boolean; result?: Supplier; message?: string }>
          update: Invoke<SupplierUpdate, { success: boolean; result?: Supplier; message?: string }>
          remove: Invoke<{ id: number }, { success: boolean; message?: string }>
        }
      }
    }
  }
}
