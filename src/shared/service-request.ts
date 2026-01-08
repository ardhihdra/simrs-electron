export enum ServiceRequestStatus {
  Draft = 'draft',
  Active = 'active',
  OnHold = 'on-hold',
  Revoked = 'revoked',
  Completed = 'completed',
  EnteredInError = 'entered-in-error',
  Unknown = 'unknown'
}

export enum ServiceRequestIntent {
  Proposal = 'proposal',
  Plan = 'plan',
  Directive = 'directive',
  Order = 'order',
  OriginalOrder = 'original-order',
  ReflexOrder = 'reflex-order',
  FillerOrder = 'filler-order',
  InstanceOrder = 'instance-order',
  Option = 'option'
}

export enum ServiceRequestPriority {
  Routine = 'routine',
  Urgent = 'urgent',
  Asap = 'asap',
  Stat = 'stat'
}

export interface Coding {
  system?: string
  version?: string
  code?: string
  display?: string
  userSelected?: boolean
}

export interface CodeableConcept {
  coding?: Coding[]
  text?: string
}

export interface Reference {
  reference?: string
  type?: string
  display?: string
}

export interface Annotation {
  text?: string
  time?: Date
  authorReference?: Reference
  authorString?: string
}

export interface Identifier {
  value?: string
  system?: string
}

export interface ServiceRequestAttributes {
  id?: number
  identifier?: Identifier[] | null
  instantiatesCanonical?: string[] | null
  instantiatesUri?: string[] | null
  basedOn?: Reference[] | null
  replaces?: Reference[] | null
  requisition?: Identifier | null
  status: ServiceRequestStatus
  intent: ServiceRequestIntent
  category?: CodeableConcept[] | null
  priority?: ServiceRequestPriority | null
  doNotPerform?: boolean | null
  code?: CodeableConcept | null
  orderDetail?: CodeableConcept[] | null
  quantity?: object | null
  subject: Reference
  focus?: Reference[] | null
  encounter?: Reference | null
  occurrence?: object | null
  asNeeded?: object | null
  authoredOn?: Date | null
  requester?: Reference | null
  performerType?: CodeableConcept | null
  performer?: Reference[] | null
  location?: Reference[] | null
  reason?: CodeableConcept[] | null
  insurance?: Reference[] | null
  supportingInfo?: Reference[] | null
  specimen?: Reference[] | null
  bodySite?: CodeableConcept[] | null
  bodyStructure?: Reference | null
  note?: Annotation[] | null
  patientInstruction?: string[] | null
  relevantHistory?: Reference[] | null
  
  resourceType?: string | null

  createdBy?: number | null
  updatedBy?: number | null
  deletedBy?: number | null
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}
