Kioska is our queue system for this hospital app
it has two mechanism: non medic related (tm_non_medic_queue_ticket) and medic related (tm_queue_tickets).

this is how it works in simrs and simrs-electron repo at the moment:
1. in main Kisoka it relates to tm_queue_tickets, and related to encounter for health examination
2. on creating queue it directly creates tm_queue_tickets with status PRE_RESERVED
3. then admin call that person and then confirm the identity then become RESERVED
4. then admin call again to become CALLED
5. then admin redirect him to nurse with status TRIAGE

now what it should actually do:
1. all patient is assumed unknown, it goes to registration queue first in tm_non_medic_queue_ticket, creates registration Kioska page
2. if patient doesn't input their rekam medis in the kioska, then it goes to registration Queue. the number will be like R-001
3. what happened in this queue is admin confirm their identity and assurance condition if any, and quota check when they choose poli, then it will become reserved if all good.
4. then it goes to tm_queue_tickets queue with status directly to RESERVED, what goes to tm_queue_tickets we should already know the patient information. Here we he have different queue code like U-001 for poli umum, so registration queue will spread to multiple queue in tm_queue_tickets
5. if patient input their rekam medis in Kioska (or scan it), then we will directly creates tm_queue_tickets queue with status RESERVED
6. if patient is registered online, then in Kioska they will choose check-in, then input or scan the online registration info, then it will become CHECKED_IN and then RESERVED
7. Then admin Poli can call them to become CALLED and then move it to nurse with status TRIAGE