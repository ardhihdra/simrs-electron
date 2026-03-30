import { useModuleScopeStore } from '@renderer/services/ModuleScope/store'
import { client } from '@renderer/utils/client'
import { useMemo } from 'react'

type ModuleGroup = {
    lokasiKerja?: {
        id: number
        kode: string
        nama: string
    }
}

export function useActiveLokasiKerjaName() {
    const session = useModuleScopeStore((state) => state.session)
    const lokasiKerjaId = session?.lokasiKerjaId
    const moduleQuery = client.module.my.useQuery({})

    const lokasiKerjaName = useMemo(() => {
        const groups = (moduleQuery.data?.result as ModuleGroup[] | undefined) ?? []
        const matchedLokasiKerja = groups.find((group) => group.lokasiKerja?.id === lokasiKerjaId)?.lokasiKerja

        if (matchedLokasiKerja?.nama) {
            return matchedLokasiKerja.nama
        }

        if (session?.label?.trim()) {
            return session.label.trim()
        }

        return 'Lokasi belum diketahui'
    }, [lokasiKerjaId, moduleQuery.data?.result, session?.label])

    return {
        lokasiKerjaName,
        lokasiKerjaId,
        isLoadingLokasiKerjaName: moduleQuery.isLoading,
    }
}
