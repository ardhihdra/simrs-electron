/**
 * useGroupedTickets Hook
 *
 * Groups tickets by poli + service unit + assurance combination.
 */

import { useMemo } from 'react';
import type { QueueTicket } from './types';

export interface TicketGroup {
  key: string;
  poli: string;
  serviceUnit: string;
  assurance: string;
  title: string;
  tickets: QueueTicket[];
}

export function useGroupedTickets(tickets: QueueTicket[]): TicketGroup[] {
  return useMemo(() => {
    const groupMap = new Map<string, TicketGroup>();

    tickets.forEach((ticket) => {
      const poliName = ticket.poli?.name || `Poli ${ticket.poliCodeId}`;
      const serviceUnitName = ticket.serviceUnit?.display || ticket.serviceUnitCodeId;
      const assuranceName = ticket.assurance?.display || 'Umum';

      // Create composite key
      const key = `${ticket.poliCodeId}-${ticket.serviceUnitCodeId}-${ticket.assuranceCodeId}`;
      const title = `${poliName} • ${serviceUnitName} • ${assuranceName}`;

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          key,
          poli: poliName,
          serviceUnit: serviceUnitName,
          assurance: assuranceName,
          title,
          tickets: [],
        });
      }

      groupMap.get(key)!.tickets.push(ticket);
    });

    // Sort by poli name
    return Array.from(groupMap.values()).sort((a, b) => a.poli.localeCompare(b.poli));
  }, [tickets]);
}
