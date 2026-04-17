import { authRpc } from './auth'
import { encounterRpc } from './encounter'
import { applicationConfigRpc } from './application-config'
import { kasirRpc } from './kasir'
import { outpatientReportingRpc } from './outpatient-reporting'
import { kioskaPublicRpc } from './kioska-public'
import { billingRpc } from './billing'
import { laboratoryRpc } from './laboratory'
import { laboratoryManagementRpc } from './laboratory-management'
import { mmoduleRpc } from './module'
import { nonMedicQueueRpc } from './non-medic-queue'
import { pageAccessRpc } from './pageAccess'
import { patientRpc } from './patient'
import { practitionerRpc } from './practitioner'
import { queryProcedure } from './query'
import { referralRpc } from './referral'
import { registrationRpc } from './registration'
import { roomRpc } from './room'
import { triageRpc } from './triage'
import { visitManagementRpc } from './visit-management'
import { wilayahRpc } from './wilayah'
import { windowRpc } from './window'

export const rpcRouter = {
  auth: authRpc,
  applicationConfig: applicationConfigRpc,
  kioskaPublic: kioskaPublicRpc,
  patient: patientRpc,
  encounter: encounterRpc,
  room: roomRpc,
  practitioner: practitionerRpc,
  triage: triageRpc,
  visitManagement: visitManagementRpc,
  laboratory: laboratoryRpc,
  laboratoryManagement: laboratoryManagementRpc,
  wilayah: wilayahRpc,
  window: windowRpc,
  module: mmoduleRpc,
  nonMedicQueue: nonMedicQueueRpc,
  registration: registrationRpc,
  referral: referralRpc,
  query: queryProcedure,
  pageAccess: pageAccessRpc,
  kasir: kasirRpc,
  billing: billingRpc,
  outpatientReporting: outpatientReportingRpc
}

export type AppRouter = typeof rpcRouter
