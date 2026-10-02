export type Role = 'PHARMACY_ADMIN' | 'PHARMACY_STAFF' | 'REVIEWER' | 'FINANCE'
export type Status = 'DRAFT' | 'MANUAL_REVIEW' | 'REJECTED' | 'APPROVED' | 'CANCELLED' | 'COMPLETED'
export type User = { id: string; name: string; email: string; role: Role; organizationId: string | null; organizationName: string | null }
export type Term = { id: string; label: string; date: string; opens_at: string; closes_at: string; source: string }
export type Product = { pzn: string; name: string; maker: string }
export type Item = { pzn: string; charge: string; quantity: number }
export type Draft = { items: Item[]; contactName: string; contactEmail: string; comment: string; declaration: boolean }
export type Claim = { id: string; organization_id: string; organization_name?: string; term_id: string; term_date: string; term_label: string; number: string; status: Status; revision_no: number; version: number; draft: Draft; ruleResult: { version: string; flags: { pzn: string; note: string }[]; automaticApproval: boolean } | null; rejection_reason: string | null; updated_at: string; submitted_at: string | null; export_run_id: string | null }
export type Member = { id: string; name: string; email: string; role: Role; status: string }
export type Invitation = { id: string; name: string; email: string; role: 'PHARMACY_ADMIN' | 'PHARMACY_STAFF'; expires_at: string; created_by: string }
export type Document = { id: string; kind: string; original_name: string; mime: string; size: number; scan_status: string; created_at: string; removed_at: string | null }
export type Revision = { revision_no: number; status: Status; submitted_at: string; decision_at: string | null; decision_reason: string | null; snapshot: Draft & { documentIds: string[] } }
export type Credit = { id: string; claim_id: string; reference: string; claim_number: string; document_id: string; published_at: string }
export type PendingOrganization = { id: string; name: string; city: string; owner: string; created_at: string; license_document_id: string; applicant: string; email: string }
export type CreditQueue = { id: string; reference: string; status: string; reason: string | null; claim_id: string | null; document_id: string; created_at: string }
export type ExportRun = { id: string; created_at: string; count: number; sha256: string; status: string }
export type Bootstrap = { user: User; demo: boolean; terms: Term[]; products: Product[]; claims: Claim[]; organization?: { id: string; name: string; street: string; zip: string; city: string; owner: string; phone: string; ibanMasked: string; status: string }; members?: Member[]; invitations?: Invitation[]; credits?: Credit[]; pending?: PendingOrganization[]; exports?: ExportRun[]; creditQueue?: CreditQueue[] }
export type ClaimDetail = { claim: Claim; documents: Document[]; revisions: Revision[]; term: Term; organization: { id: string; name: string; city: string } }

export const statusLabel: Record<Status, string> = {
  DRAFT: 'Entwurf', MANUAL_REVIEW: 'Wir prüfen', REJECTED: 'Bitte korrigieren',
  APPROVED: 'Freigegeben', CANCELLED: 'Verworfen', COMPLETED: 'Gutschrift verfügbar'
}

export const dateLabel = (value?: string | null) => value ? new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value)) : '–'
export const shortDate = (value?: string | null) => value ? new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value)) : '–'
export const dateTime = (value?: string | null) => value ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '–'
