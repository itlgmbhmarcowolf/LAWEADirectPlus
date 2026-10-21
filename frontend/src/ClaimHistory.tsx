import type { ClaimDetail, Credit, ExportRun } from './types'
import { dateTime } from './types'
import { TimelinePanel } from './TimelinePanel'
import './sample-claim-detail.css'

type Event = { timestamp: string; title: string; description: string; revision?: string; tone: 'done' | 'current' | 'issue' }

export function ClaimHistory({ detail, credit, exportRun }: { detail: ClaimDetail; credit?: Credit; exportRun?: ExportRun }) {
  const events: Event[] = detail.revisions.flatMap(revision => {
    const result: Event[] = [{ timestamp: revision.submitted_at, title: `Revision ${revision.revision_no} eingereicht`, description: `${revision.snapshot.items.length} Positionen und ${revision.snapshot.documentIds.length} Nachweise eingereicht. Die Fassung bleibt unverändert.`, revision: `Revision ${revision.revision_no}`, tone: 'done' }]
    if (revision.decision_at) result.push({ timestamp: revision.decision_at, title: revision.status === 'REJECTED' ? 'Korrektur angefordert' : 'Fachlich freigegeben', description: revision.decision_reason || (revision.status === 'REJECTED' ? 'Ein Korrekturgrund wurde hinterlegt.' : 'Die Revision wurde nach Prüfung freigegeben.'), revision: `Revision ${revision.revision_no}`, tone: revision.status === 'REJECTED' ? 'issue' : 'done' })
    return result
  })
  if (exportRun) events.push({ timestamp: exportRun.created_at, title: 'Demo-Export erstellt', description: 'Die freigegebene Meldung wurde in einem Demo-CSV-Export berücksichtigt.', tone: 'done' })
  if (credit) events.push({ timestamp: credit.published_at, title: 'Gutschrift bereitgestellt', description: `Referenz ${credit.reference} wurde dieser Meldung zugeordnet.`, tone: 'current' })
  events.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  return <TimelinePanel subtitle="Einreichungen und Entscheidungen zu dieser Meldung" events={events.map(event => ({ key: `${event.timestamp}-${event.title}`, timeLabel: dateTime(event.timestamp), dateTime: event.timestamp, title: event.title, description: event.description, revision: event.revision, tone: event.tone }))}/>
}
