/**
 * QueueMonitor Types & Constants
 *
 * Shared types for queue monitor components.
 */

import type {
  EncounterAttributes,
  PatientAttributes,
  PoliAttributes,
  PractitionerAttributes,
  ReferenceCodeAttributes,
} from 'simrs-types';

export interface QueueTicket {
  id: string;
  queueDate: string;
  queueNumber: number;
  status: string;
  patientId: string;
  poliCodeId: number;
  serviceUnitCodeId: string;
  registrationChannelCodeId: string;
  assuranceCodeId: string;
  patient?: PatientAttributes;
  poli?: PoliAttributes;
  practitioner?: PractitionerAttributes;
  encounter?: EncounterAttributes;
  serviceUnit?: ReferenceCodeAttributes;
  registrationChannel?: ReferenceCodeAttributes;
  assurance?: ReferenceCodeAttributes;
}

export const STATUS_COLORS: Record<string, string> = {
  RESERVED: 'blue',
  CHECKED_IN: 'green',
  EXPIRED: 'red',
  CANCELLED: 'red',
};

export const STATUS_LABELS: Record<string, string> = {
  RESERVED: 'Menunggu',
  CHECKED_IN: 'Dipanggil',
  EXPIRED: 'Kedaluwarsa',
  CANCELLED: 'Dibatalkan',
};

export interface GroupedTickets {
  serviceUnit: string;
  poli: string;
  channel: string;
  assurance: string;
  tickets: QueueTicket[];
}
