/**
 * purpose: Keep backward-compatible rawat-inap checkin route by redirecting to unified patient list page.
 * main callers: Router mapping for `/dashboard/rawat-inap/checkin`.
 * key dependencies: `Navigate` from `react-router` and rawat-inap path config.
 * main/public functions: `RawatInapCheckinRoute` default export.
 * important side effects: client-side route redirect to `/dashboard/rawat-inap/pasien`.
 */
import { Navigate } from 'react-router'

import { RAWAT_INAP_PAGE_PATHS } from './rawat-inap.config'

export default function RawatInapCheckinRoute() {
  return <Navigate replace to={RAWAT_INAP_PAGE_PATHS.pasien} />
}
